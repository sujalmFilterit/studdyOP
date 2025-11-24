import axios from 'axios'

const API_BASE = import.meta.env.VITE_API_BASE || 'http://localhost:4000/api'

export function api(token?: string) {
  const instance = axios.create({ baseURL: API_BASE })
  instance.interceptors.request.use((config) => {
    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`
    }
    return config
  })
  
  // Add response interceptor to handle JSON parsing errors
  instance.interceptors.response.use(
    (response) => response,
    (error) => {
      if (error.response) {
        // Server responded with error status
        console.error('API Error:', error.response.status, error.response.data)
      } else if (error.request) {
        // Request was made but no response received
        console.error('Network Error:', error.message)
      } else {
        // Something else happened
        console.error('Error:', error.message)
      }
      return Promise.reject(error)
    }
  )
  
  return instance
}


