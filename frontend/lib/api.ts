import axios from 'axios';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';

export const api = axios.create({
  baseURL: `${API_URL}/api`,
  headers: { 'Content-Type': 'application/json' },
  timeout: 30000,
});

// Request interceptor - attach token
api.interceptors.request.use(
  (config) => {
    if (typeof window !== 'undefined') {
      // Read from localStorage (synced by auth store on rehydration)
      const token = localStorage.getItem('accessToken');
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor - handle 401 and network errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (typeof window !== 'undefined') {
      if (error.response?.status === 401) {
        // Clear all auth state and redirect to login
        localStorage.removeItem('accessToken');
        localStorage.removeItem('refreshToken');
        localStorage.removeItem('auth-storage');
        window.location.href = '/login';
      }
    }

    // Improve error messages for network issues
    if (!error.response) {
      error.message = 'Cannot connect to server. Make sure the backend is running.';
    }

    return Promise.reject(error);
  }
);

// Auth APIs
export const authApi = {
  register: (data: any) => api.post('/auth/register', data),
  login: (data: any) => api.post('/auth/login', data),
  getProfile: () => api.get('/auth/profile'),
  updateProfile: (data: FormData) => api.put('/auth/profile', data, {
    headers: { 'Content-Type': 'multipart/form-data' },
  }),
  changePassword: (data: any) => api.put('/auth/change-password', data),
  forgotPassword: (email: string) => api.post('/auth/forgot-password', { email }),
  resetPassword: (data: any) => api.post('/auth/reset-password', data),
};

// Expense APIs
export const expenseApi = {
  create: (data: FormData) => api.post('/expenses', data, {
    headers: { 'Content-Type': 'multipart/form-data' },
  }),
  getAll: (params?: any) => api.get('/expenses', { params }),
  getById: (id: string) => api.get(`/expenses/${id}`),
  update: (id: string, data: FormData) => api.put(`/expenses/${id}`, data, {
    headers: { 'Content-Type': 'multipart/form-data' },
  }),
  delete: (id: string) => api.delete(`/expenses/${id}`),
  getStats: () => api.get('/expenses/stats'),
};

// OCR APIs
export const ocrApi = {
  upload: (file: File) => {
    const formData = new FormData();
    formData.append('receipt', file);
    return api.post('/ocr/upload', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
  },
};

// AI APIs
export const aiApi = {
  categorize: (data: any) => api.post('/ai/categorize', data),
  getInsights: () => api.post('/ai/insights', {}),
};

// Budget APIs
export const budgetApi = {
  createOrUpdate: (data: any) => api.post('/budget', data),
  get: (params?: any) => api.get('/budget', { params }),
  getHistory: () => api.get('/budget/history'),
};

// Report APIs
export const reportApi = {
  getMonthly: (params?: any) => api.get('/reports/monthly', {
    params,
    // Required for binary downloads (PDF/CSV)
    responseType: params?.format === 'pdf' ? 'blob' : params?.format === 'csv' ? 'blob' : 'json',
  }),
};

// Notification APIs
export const notificationApi = {
  getAll: (params?: any) => api.get('/notifications', { params }),
  markRead: (id: string) => api.patch(`/notifications/${id}/read`),
  markAllRead: () => api.patch('/notifications/all/read'),
  delete: (id: string) => api.delete(`/notifications/${id}`),
};

// Recurring APIs
export const recurringApi = {
  getAll: () => api.get('/recurring'),
  detect: () => api.get('/recurring/detect'),
  create: (data: any) => api.post('/recurring', data),
  update: (id: string, data: any) => api.put(`/recurring/${id}`, data),
  delete: (id: string) => api.delete(`/recurring/${id}`),
};

// Sustainability APIs
export const sustainabilityApi = {
  getScore: (params?: any) => api.get('/sustainability/score', { params }),
  getCarbon: (params?: any) => api.get('/sustainability/carbon', { params }),
  getAlternatives: () => api.get('/sustainability/alternatives'),
  getRecommendations: () => api.get('/sustainability/recommendations'),
  getEcoReport: (params?: any) => api.get('/sustainability/report', { params }),
  getGoals: () => api.get('/sustainability/goals'),
  createGoal: (data: any) => api.post('/sustainability/goals', data),
  updateGoalProgress: (id: string, currentValue: number) => api.patch(`/sustainability/goals/${id}/progress`, { currentValue }),
  deleteGoal: (id: string) => api.delete(`/sustainability/goals/${id}`),
};
