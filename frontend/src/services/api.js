import axios from 'axios';

const API_BASE = 'http://localhost:8000/api';

const api = axios.create({
  baseURL: API_BASE,
  headers: { 'Content-Type': 'application/json' },
});

// Attach JWT token to every request
api.interceptors.request.use((config) => {
  const tokens = JSON.parse(localStorage.getItem('tokens') || '{}');
  if (tokens.access) {
    config.headers.Authorization = `Bearer ${tokens.access}`;
  }
  return config;
});

// Auto-refresh token on 401
api.interceptors.response.use(
  (res) => res,
  async (error) => {
    const originalRequest = error.config;
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;
      const tokens = JSON.parse(localStorage.getItem('tokens') || '{}');
      if (tokens.refresh) {
        try {
          const { data } = await axios.post(`${API_BASE}/auth/token/refresh/`, {
            refresh: tokens.refresh,
          });
          localStorage.setItem('tokens', JSON.stringify({ ...tokens, access: data.access }));
          originalRequest.headers.Authorization = `Bearer ${data.access}`;
          return api(originalRequest);
        } catch {
          localStorage.removeItem('tokens');
          localStorage.removeItem('user');
          window.location.href = '/login';
        }
      }
    }
    return Promise.reject(error);
  }
);

// Auth
export const authAPI = {
  login: (data) => api.post('/auth/login/', data),
  register: (data) => api.post('/auth/register/', data),
  getProfile: () => api.get('/auth/profile/'),
  updateProfile: (data) => api.patch('/auth/profile/', data),
  requestOTP: (data) => api.post('/auth/otp/request/', data),
  verifyOTP: (data) => api.post('/auth/otp/verify/', data),
  logout: (data) => api.post('/auth/logout/', data),
};

// Products
export const productsAPI = {
  list: (params) => api.get('/products/', { params }),
  get: (id) => api.get(`/products/${id}/`),
  create: (data) => api.post('/products/', data),
  update: (id, data) => api.put(`/products/${id}/`, data),
  delete: (id) => api.delete(`/products/${id}/`),
  bySku: (sku) => api.get(`/products/by-sku/${sku}/`),
  lowStock: () => api.get('/products/low_stock/'),
  categories: () => api.get('/products/categories/'),
  createCategory: (data) => api.post('/products/categories/', data),
};

// Warehouses
export const warehousesAPI = {
  list: () => api.get('/warehouses/'),
  get: (id) => api.get(`/warehouses/${id}/`),
  create: (data) => api.post('/warehouses/', data),
  locations: (params) => api.get('/warehouses/locations/', { params }),
  createLocation: (data) => api.post('/warehouses/locations/', data),
  stock: (params) => api.get('/warehouses/stock/', { params }),
};

// Operations
export const operationsAPI = {
  // Receipts
  receipts: (params) => api.get('/operations/receipts/', { params }),
  createReceipt: (data) => api.post('/operations/receipts/', data),
  validateReceipt: (id) => api.post(`/operations/receipts/${id}/validate_receipt/`),

  // Deliveries
  deliveries: (params) => api.get('/operations/deliveries/', { params }),
  createDelivery: (data) => api.post('/operations/deliveries/', data),
  pickDelivery: (id) => api.post(`/operations/deliveries/${id}/pick/`),
  packDelivery: (id) => api.post(`/operations/deliveries/${id}/pack/`),
  validateDelivery: (id) => api.post(`/operations/deliveries/${id}/validate_delivery/`),

  // Transfers
  transfers: (params) => api.get('/operations/transfers/', { params }),
  createTransfer: (data) => api.post('/operations/transfers/', data),
  completeTransfer: (id) => api.post(`/operations/transfers/${id}/complete_transfer/`),

  // Adjustments
  adjustments: (params) => api.get('/operations/adjustments/', { params }),
  createAdjustment: (data) => api.post('/operations/adjustments/', data),

  // Ledger
  ledger: (params) => api.get('/operations/ledger/', { params }),

  // Alerts
  alerts: (params) => api.get('/operations/alerts/', { params }),
  resolveAlert: (id) => api.post(`/operations/alerts/${id}/resolve/`),
};

// Dashboard
export const dashboardAPI = {
  stats: (params) => api.get('/dashboard/stats/', { params }),
  charts: (params) => api.get('/dashboard/charts/', { params }),
};

export default api;
