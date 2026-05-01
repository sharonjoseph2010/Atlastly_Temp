import axios from 'axios';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
export const API = `${BACKEND_URL}/api`;

export const api = axios.create({
  baseURL: API,
});

// Vendor API calls
export const vendorAPI = {
  createProfile: (data, token) =>
    api.post('/vendor/profile', data, {
      headers: { Authorization: `Bearer ${token}` },
    }),
  
  getProfile: (token) =>
    api.get('/vendor/profile', {
      headers: { Authorization: `Bearer ${token}` },
    }),
  
  updateProfile: (data, token) =>
    api.put('/vendor/profile', data, {
      headers: { Authorization: `Bearer ${token}` },
    }),
};

// Discovery API calls
export const discoveryAPI = {
  getVendors: (category = null) => {
    const params = category ? { category } : {};
    return api.get('/vendors', { params });
  },
  
  getVendorDetail: (vendorId) =>
    api.get(`/vendors/${vendorId}`),
  
  getCategories: () =>
    api.get('/categories'),
};

// Admin API calls
export const adminAPI = {
  getAllVendors: (token) =>
    api.get('/admin/vendors', {
      headers: { Authorization: `Bearer ${token}` },
    }),
  
  createVendor: (data, token) =>
    api.post('/admin/vendors', data, {
      headers: { Authorization: `Bearer ${token}` },
    }),
  
  updateVendor: (vendorId, data, token) =>
    api.put(`/admin/vendors/${vendorId}`, data, {
      headers: { Authorization: `Bearer ${token}` },
    }),
  
  fullUpdateVendor: (vendorId, data, token) =>
    api.put(`/admin/vendors/${vendorId}/full`, data, {
      headers: { Authorization: `Bearer ${token}` },
    }),
  
  deleteVendor: (vendorId, token) =>
    api.delete(`/admin/vendors/${vendorId}`, {
      headers: { Authorization: `Bearer ${token}` },
    }),

  googleLookup: (url, token) =>
    api.post('/admin/google-lookup', { url }, {
      headers: { Authorization: `Bearer ${token}` },
    }),

  googleLookupQuota: (token) =>
    api.get('/admin/google-lookup/quota', {
      headers: { Authorization: `Bearer ${token}` },
    }),
};