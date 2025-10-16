import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import axios from 'axios'

// Dynamic API base URL - use current host for network access
const API_BASE_URL = `${window.location.protocol}//${window.location.hostname}:3001/api`

// Configure axios defaults
axios.defaults.baseURL = API_BASE_URL

// Create the store first
const useAuthStore = create(
  persist(
    (set, get) => ({
      token: null,
      user: null,
      isLoading: false,
      
      login: async (email, password) => {
        set({ isLoading: true })
        try {
          const response = await axios.post('/auth/login', { email, password })
          const { token } = response.data
          set({ token, isLoading: false })
          
          // Update axios headers
          axios.defaults.headers.common['Authorization'] = `Bearer ${token}`
          
          // Get user info
          await get().getCurrentUser()
          return { success: true }
        } catch (error) {
          set({ isLoading: false })
          return { 
            success: false, 
            error: error.response?.data?.error || 'Login failed' 
          }
        }
      },
      
      logout: () => {
        set({ token: null, user: null })
        axios.defaults.headers.common['Authorization'] = ''
      },
      
      getCurrentUser: async () => {
        try {
          const response = await axios.get('/users/me')
          set({ user: response.data })
        } catch (error) {
          console.error('Failed to get current user:', error)
        }
      },
      
      createUser: async (userData) => {
        try {
          const response = await axios.post('/users', userData)
          return { success: true, data: response.data }
        } catch (error) {
          return { 
            success: false, 
            error: error.response?.data?.error || 'Failed to create user' 
          }
        }
      }
    }),
    {
      name: 'auth-storage',
      partialize: (state) => ({ token: state.token, user: state.user }),
    }
  )
)

// Set up axios interceptor after store creation
axios.interceptors.request.use((config) => {
  const token = useAuthStore.getState().token
  console.log('Axios request interceptor - Token:', token ? 'Present' : 'Missing')
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

// Add response interceptor to handle auth errors
axios.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      console.error('Authentication error - Token may be invalid or expired')
      // Clear the token and redirect to login
      useAuthStore.getState().logout()
    }
    return Promise.reject(error)
  }
)

// Handle token refresh on app load
const initializeAuth = () => {
  const { token } = useAuthStore.getState()
  if (token) {
    axios.defaults.headers.common['Authorization'] = `Bearer ${token}`
  }
}

// Initialize auth when the module loads
initializeAuth()

export { useAuthStore }

