import api from './axios';

// Auth API calls
export const authApi = {
  login: (credentials) => api.post('/auth/login', credentials),
  register: (data) => api.post('/auth/register', data),
  getProfile: () => api.get('/auth/profile'),
  updateProfile: (data) => api.put('/auth/profile', data),
  getAllUsers: () => api.get('/auth/users'),
};

// Categories API calls
export const categoryApi = {
  getAll: () => api.get('/categories'),
  getBySlug: (slug) => api.get(`/categories/${slug}`),
  create: (data) => api.post('/categories', data),
  update: (id, data) => api.put(`/categories/${id}`, data),
  delete: (id) => api.delete(`/categories/${id}`),
};

// Products API calls
export const productApi = {
  getAll: (params) => api.get('/products', { params }),
  getFeatured: () => api.get('/products/featured'),
  getLowStock: (threshold = 5) => api.get(`/products/low-stock?threshold=${threshold}`),
  getBySlug: (identifier) => api.get(`/products/${identifier}`),
  create: (data) => api.post('/products', data),
  update: (id, data) => api.put(`/products/${id}`, data),
  delete: (id) => api.delete(`/products/${id}`),
};

// Cart API calls
export const cartApi = {
  get: () => api.get('/cart'),
  add: (productId, quantity = 1) => api.post('/cart', { productId, quantity }),
  updateQuantity: (itemId, quantity) => api.put(`/cart/items/${itemId}`, { quantity }),
  removeItem: (itemId) => api.delete(`/cart/items/${itemId}`),
  clear: () => api.delete('/cart'),
  sync: (guestItems) => api.post('/cart/sync', { guestItems }),
};

// Order API calls
export const orderApi = {
  create: (data) => api.post('/orders', data),
  getMyOrders: () => api.get('/orders/my-orders'),
  getById: (id) => api.get(`/orders/${id}`),
  getAll: (params) => api.get('/orders', { params }),
  updateStatus: (id, status, note) => api.put(`/orders/${id}/status`, { status, note }),
  getAnalytics: () => api.get('/orders/analytics'),
};

// AI Chatbot Assistant API calls
export const chatApi = {
  sendMessage: (messages, stream = false) => api.post('/chat', { messages, stream }),
};

// Upload API calls
export const uploadApi = {
  uploadImage: (file, onUploadProgress) => {
    const formData = new FormData();
    formData.append('image', file);
    return api.post('/upload', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
      onUploadProgress: (progressEvent) => {
        if (onUploadProgress && progressEvent.total) {
          const percent = Math.round((progressEvent.loaded * 100) / progressEvent.total);
          onUploadProgress(percent);
        }
      },
    });
  },
};

// System Settings & Exchange Rate API calls
export const settingApi = {
  get: () => api.get('/settings'),
  update: (data) => api.put('/settings', data),
};

// Review & Rating API calls
export const reviewApi = {
  getByProduct: (productId, params) => api.get(`/reviews/product/${productId}`, { params }),
  createOrUpdate: (data) => api.post('/reviews', data),
  update: (id, data) => api.put(`/reviews/${id}`, data),
  delete: (id) => api.delete(`/reviews/${id}`),
  toggleHelpfulVote: (id) => api.post(`/reviews/${id}/vote`),
  uploadImages: (files) => {
    const formData = new FormData();
    Array.from(files).forEach((file) => formData.append('images', file));
    return api.post('/upload/review-images', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
  },
  // Admin calls
  getAdminReviews: (params) => api.get('/reviews/admin', { params }),
  updateStatus: (id, status) => api.patch(`/reviews/admin/${id}/status`, { status }),
  deleteAdmin: (id) => api.delete(`/reviews/admin/${id}`),
};



