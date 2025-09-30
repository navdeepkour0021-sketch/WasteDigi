import axios from 'axios';

const API_URL = 'http://localhost:5000/api';

// Create axios instance
const api = axios.create({
  baseURL: API_URL,
});

// Request interceptor to add token
api.interceptors.request.use(
  (config) => {
    const user = localStorage.getItem('wastewise_user');
    if (user) {
      const { token } = JSON.parse(user);
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor for error handling
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('wastewise_user');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export interface InventoryItem {
  _id: string;
  name: string;
  quantity: number;
  unit: string;
  expiryDate: string;
  category: string;
  status: 'active' | 'expired' | 'consumed';
  createdAt: string;
  updatedAt: string;
}

export interface WasteLog {
  _id: string;
  itemName: string;
  quantity: number;
  unit: string;
  reason: string;
  photoUrl?: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

// Inventory API
export const inventoryApi = {
  getAll: (includeAll = false) => api.get<InventoryItem[]>(`/inventory${includeAll ? '?all=true' : ''}`),
  create: (data: Omit<InventoryItem, '_id' | 'createdAt' | 'updatedAt' | 'status'>) => 
    api.post<InventoryItem>('/inventory', data),
  update: (id: string, data: Partial<InventoryItem>) => 
    api.put<InventoryItem>(`/inventory/${id}`, data),
  delete: (id: string) => api.delete(`/inventory/${id}`),
  getAlerts: () => api.get<InventoryItem[]>('/inventory/alerts'),
};

// Waste API
export const wasteApi = {
  getAll: (includeAll = false) => api.get<WasteLog[]>(`/waste${includeAll ? '?all=true' : ''}`),
  create: (data: Omit<WasteLog, '_id' | 'createdAt' | 'updatedAt'>) => 
    api.post<WasteLog>('/waste', data),
  delete: (id: string) => api.delete(`/waste/${id}`),
};

// AI API
export const aiApi = {
  search: (query: string) => api.post('/ai/search', { query }),
  getSuggestions: () => api.get('/ai/suggestions'),
  getExpiryAnalysis: () => api.get('/ai/expiry-analysis'),
};

// Users API
export const usersApi = {
  getAll: () => api.get('/users'),
  create: (data: { name: string; email: string; password: string; role?: string; permissions?: string[] }) => 
    api.post('/users', data),
  getPermissions: () => api.get('/users/permissions'),
  updateRole: (id: string, data: { role?: string; permissions?: string[] }) => 
    api.put(`/users/${id}/role`, data),
  delete: (id: string) => api.delete(`/users/${id}`),
};
export default api;