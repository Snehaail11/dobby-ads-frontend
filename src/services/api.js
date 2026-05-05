import axios from 'axios';

const API_URL = 'http://localhost:5000/api';

const api = axios.create({
  baseURL: API_URL,
});

// Add token to requests
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers['x-auth-token'] = token;
  }
  return config;
});

// Folder API
export const folderApi = {
  getAll: (parentFolderId = null) => 
    api.get('/folders', { params: { parentFolderId } }),
  
  create: (name, parentFolderId = null) => 
    api.post('/folders', { name, parentFolderId }),
  
  rename: (id, name) => 
    api.put(`/folders/${id}`, { name }),
  
  delete: (id) => 
    api.delete(`/folders/${id}`),
  
  getSize: (id) => 
    api.get(`/folders/${id}/size`),
};

// Image API
export const imageApi = {
  getByFolder: (folderId) => 
    api.get(`/images/folder/${folderId}`),
  
  upload: (formData) => 
    api.post('/images/upload', formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    }),
  
  delete: (id) => 
    api.delete(`/images/${id}`),
};

export default api;