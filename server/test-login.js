import axios from 'axios';

const API_BASE_URL = 'http://localhost:3001/api';

async function testLogin() {
  try {
    console.log('Testing login...');
    const response = await axios.post(`${API_BASE_URL}/auth/login`, {
      email: 'admin@example.com',
      password: 'admin123'
    });
    
    console.log('Login successful!');
    console.log('Token:', response.data.token);
    
    // Test getting current user
    const userResponse = await axios.get(`${API_BASE_URL}/users/me`, {
      headers: {
        Authorization: `Bearer ${response.data.token}`
      }
    });
    
    console.log('User info:', userResponse.data);
    
  } catch (error) {
    console.error('Login failed:', error.response?.data || error.message);
  }
}

testLogin();

