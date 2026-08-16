import axios from 'axios'

const API_BASE = import.meta.env.VITE_API_URL || '/api'

const api = axios.create({
  baseURL: API_BASE,
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
  },
})

// Request interceptor - add JWT token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token')
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }
    return config
  },
  (error) => Promise.reject(error)
)

// Response interceptor - handle 401
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && error.response.status === 401) {
      localStorage.removeItem('token')
      window.location.href = '/login'
    }
    return Promise.reject(error)
  }
)

// Auth APIs
export const auth = {
  login: (email, password) => api.post('/auth/login', { email, password }),
  register: (data) => api.post('/auth/register', data),
  getMe: () => api.get('/auth/me'),
}

// Dashboard APIs
export const dashboard = {
  getOverview: () => api.get('/dashboard/overview'),
  getConsumption: (params) => api.get('/dashboard/consumption', { params }),
  getAccountData: (params) => api.get('/dashboard/account-data', { params }),
  getBIAnalysis: (params) => api.get('/dashboard/bi-analysis', { params }),
  getCustomerService: () => api.get('/dashboard/customer-service'),
}

// Account Management APIs
export const accounts = {
  getList: (params) => api.get('/accounts', { params }),
  getStats: () => api.get('/accounts/stats'),
  batchStatus: (data) => api.put('/accounts/batch-status', data),
  batchRecharge: (data) => api.post('/accounts/batch-recharge', data),
  batchAdjust: (data) => api.post('/accounts/batch-adjust', data),
  exportCSV: () => api.get('/accounts/export', { responseType: 'blob' }),
}

// Order Management APIs
export const orders = {
  getRentalOrders: (params) => api.get('/orders/rental', { params }),
  getRentalStats: () => api.get('/orders/rental/stats'),
  extractRental: (id) => api.post(`/orders/rental/${id}/extract`),
  getRechargeOrders: (params) => api.get('/orders/recharge', { params }),
  getRechargeStats: () => api.get('/orders/recharge/stats'),
}

// Finance APIs
export const finances = {
  getBalance: () => api.get('/finances/balance'),
  getFlows: (params) => api.get('/finances/flows', { params }),
  getRechargeRecords: (params) => api.get('/finances/recharge-records', { params }),
  getWithdrawRecords: (params) => api.get('/finances/withdraw-records', { params }),
  getFrozenRecords: (params) => api.get('/finances/frozen-records', { params }),
}

export default api