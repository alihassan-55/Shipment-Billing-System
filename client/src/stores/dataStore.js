import { create } from 'zustand'
import axios from 'axios'

// Retry configuration
const RETRY_CONFIG = {
  maxRetries: 3,
  baseDelay: 1000, // 1 second
  maxDelay: 10000, // 10 seconds
}

// Retry function with exponential backoff
async function retryRequest(requestFn, retries = RETRY_CONFIG.maxRetries) {
  try {
    return await requestFn()
  } catch (error) {
    if (retries > 0 && shouldRetry(error)) {
      const delay = Math.min(
        RETRY_CONFIG.baseDelay * Math.pow(2, RETRY_CONFIG.maxRetries - retries),
        RETRY_CONFIG.maxDelay
      )
      
      console.log(`Request failed, retrying in ${delay}ms... (${retries} retries left)`)
      await new Promise(resolve => setTimeout(resolve, delay))
      return retryRequest(requestFn, retries - 1)
    }
    throw error
  }
}

// Check if error is retryable
function shouldRetry(error) {
  if (!error.response) return true // Network error
  const status = error.response.status
  return status >= 500 || status === 408 || status === 429 // Server errors, timeout, rate limit
}

export const useDataStore = create((set, get) => ({
  // Dashboard data
  dashboardStats: {
    totalShipments: 0,
    totalInvoices: 0,
    totalRevenue: 0,
    pendingPayments: 0
  },
  
  // Customers
  customers: [],
  customersLoading: false,
  
  // Shipments
  shipments: [],
  shipmentsLoading: false,
  
  // Invoices
  invoices: [],
  invoicesLoading: false,
  
  // Payments
  payments: [],
  paymentsLoading: false,
  
  // Actions
  fetchDashboardStats: async () => {
    try {
      // This would be a custom endpoint that aggregates data
      // For now, we'll calculate from existing data
      const [shipmentsRes, invoicesRes] = await Promise.all([
        axios.get('/shipments?limit=1000'),
        axios.get('/invoices?limit=1000')
      ])
      
      const totalShipments = shipmentsRes.data.shipments.length
      const totalInvoices = invoicesRes.data.invoices.length
      const totalRevenue = invoicesRes.data.invoices.reduce((sum, inv) => sum + inv.total, 0)
      const pendingPayments = invoicesRes.data.invoices.filter(inv => inv.status === 'Unpaid').length
      
      set({
        dashboardStats: {
          totalShipments,
          totalInvoices,
          totalRevenue,
          pendingPayments
        }
      })
    } catch (error) {
      console.error('Failed to fetch dashboard stats:', error)
    }
  },
  
  fetchCustomers: async (params = {}) => {
    set({ customersLoading: true })
    try {
      const response = await retryRequest(() => axios.get('/customers', { params }))
      console.log('Customers response:', response.data)
      set({ customers: response.data.customers || [], customersLoading: false })
      return response.data // Return the full response for search functionality
    } catch (error) {
      set({ customersLoading: false })
      console.error('Failed to fetch customers after retries:', error)
      // Set empty array on error to prevent undefined issues
      set({ customers: [] })
      
      // Show user-friendly error message
      if (error.response?.status === 500) {
        console.error('Server error - database connection may be lost. Please refresh the page.')
      }
      return { customers: [], pagination: {} } // Return empty response on error
    }
  },
  
  createCustomer: async (customerData) => {
    try {
      const response = await retryRequest(() => axios.post('/customers', customerData))
      set(state => ({ customers: [...state.customers, response.data] }))
      return { success: true, data: response.data }
    } catch (error) {
      return { 
        success: false, 
        error: error.response?.data?.error || 'Failed to create customer' 
      }
    }
  },

  updateCustomer: async (id, customerData) => {
    try {
      const response = await retryRequest(() => axios.put(`/customers/${id}`, customerData))
      set(state => ({
        customers: state.customers.map(customer => 
          customer.id === id ? response.data : customer
        )
      }))
      return { success: true, data: response.data }
    } catch (error) {
      return { 
        success: false, 
        error: error.response?.data?.error || 'Failed to update customer' 
      }
    }
  },

  deleteCustomer: async (id) => {
    try {
      await retryRequest(() => axios.delete(`/customers/${id}`))
      set(state => ({
        customers: state.customers.filter(customer => customer.id !== id)
      }))
      return { success: true }
    } catch (error) {
      return { 
        success: false, 
        error: error.response?.data?.error || 'Failed to delete customer' 
      }
    }
  },
  
  fetchShipments: async (params = {}) => {
    set({ shipmentsLoading: true })
    try {
      const response = await retryRequest(() => axios.get('/shipments', { params }))
      console.log('Shipments response:', response.data)
      set({ shipments: response.data.shipments || [], shipmentsLoading: false })
      return response.data // Return the full response for search functionality
    } catch (error) {
      set({ shipmentsLoading: false })
      console.error('Failed to fetch shipments after retries:', error)
      set({ shipments: [] })
      
      if (error.response?.status === 500) {
        console.error('Server error - database connection may be lost. Please refresh the page.')
      }
      return { shipments: [], pagination: {} } // Return empty response on error
    }
  },
  
  createShipment: async (shipmentData) => {
    try {
      const response = await axios.post('/shipments', shipmentData)
      set(state => ({ shipments: [...state.shipments, response.data] }))
      return { success: true, data: response.data }
    } catch (error) {
      return { 
        success: false, 
        error: error.response?.data?.error || 'Failed to create shipment' 
      }
    }
  },

  updateShipment: async (id, shipmentData) => {
    try {
      console.log('Updating shipment:', id, shipmentData)
      const response = await axios.put(`/shipments/${id}`, shipmentData)
      console.log('Update response:', response.data)
      set(state => ({
        shipments: state.shipments.map(shipment => 
          shipment.id === id ? response.data : shipment
        )
      }))
      return { success: true, data: response.data }
    } catch (error) {
      console.error('Update shipment error:', error.response?.data || error.message)
      return { 
        success: false, 
        error: error.response?.data?.error || 'Failed to update shipment' 
      }
    }
  },
  
  fetchInvoices: async (params = {}) => {
    set({ invoicesLoading: true })
    try {
      const response = await axios.get('/invoices', { params })
      console.log('Invoices response:', response.data)
      set({ invoices: response.data.invoices || [], invoicesLoading: false })
    } catch (error) {
      set({ invoicesLoading: false })
      console.error('Failed to fetch invoices:', error)
      // Set empty array on error to prevent undefined issues
      set({ invoices: [] })
    }
  },

  fetchInvoice: async (invoiceId) => {
    try {
      const response = await axios.get(`/invoices/${invoiceId}`)
      return response.data
    } catch (error) {
      console.error('Failed to fetch invoice:', error)
      throw error
    }
  },
  
  createInvoice: async (invoiceData) => {
    try {
      const response = await axios.post('/invoices', invoiceData)
      set(state => ({ invoices: [...state.invoices, response.data] }))
      return { success: true, data: response.data }
    } catch (error) {
      return { 
        success: false, 
        error: error.response?.data?.error || 'Failed to create invoice' 
      }
    }
  },
  
  fetchPayments: async (params = {}) => {
    set({ paymentsLoading: true })
    try {
      const response = await axios.get('/payments', { params })
      console.log('Payments response:', response.data)
      set({ payments: response.data.payments || [], paymentsLoading: false })
    } catch (error) {
      set({ paymentsLoading: false })
      console.error('Failed to fetch payments:', error)
      // Set empty array on error to prevent undefined issues
      set({ payments: [] })
    }
  },
  
  recordPayment: async (paymentData) => {
    try {
      const response = await axios.post('/payments', paymentData)
      set(state => ({ payments: [...state.payments, response.data.payment] }))
      return { success: true, data: response.data }
    } catch (error) {
      return { 
        success: false, 
        error: error.response?.data?.error || 'Failed to record payment' 
      }
    }
  }
}))
