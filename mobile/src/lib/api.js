import axios from 'axios';

const API_BASE_URL = 'http://localhost:5000/api';

const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000,
});

export default api;

// Products
export const getProducts = (params) => api.get('/products', { params });
export const getProduct = (id) => api.get(`/products/${id}`);
export const trackClick = (productId, platformId) =>
  api.post(`/products/${productId}/click`, { platformId });

// Categories
export const getCategories = (params) => api.get('/categories', { params });

// Platforms
export const getPlatforms = () => api.get('/platforms');

// Campaigns
export const getCampaigns = () => api.get('/campaigns');
