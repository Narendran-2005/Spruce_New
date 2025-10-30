import axios from 'axios';

const API_BASE_URL = 'http://localhost:8080/api';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add token to requests
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export default api;

export const authAPI = {
  register: (data) => api.post('/auth/register', data),
  login: (data) => api.post('/auth/login', data),
};

export const userAPI = {
  getProfile: () => api.get('/users/profile'),
  updateProfile: (data) => api.put('/users/profile', data),
  updateKeys: (data) => api.put('/users/profile/keys', data),
  search: (query) => api.get(`/users/search?q=${query}`),
  getById: (id) => api.get(`/users/${id}`),
};

export const contactAPI = {
  getContacts: () => api.get('/contacts'),
  addContact: (userId) => api.post(`/contacts/add/${userId}`),
  removeContact: (userId) => api.delete(`/contacts/remove/${userId}`),
  acceptContact: (contactId) => api.post(`/contacts/accept/${contactId}`),
};

export const groupAPI = {
  createGroup: (data) => api.post('/groups/create', data),
  getGroups: () => api.get('/groups'),
  getGroup: (id) => api.get(`/groups/${id}`),
  joinGroup: (id) => api.post(`/groups/${id}/join`),
  leaveGroup: (id) => api.post(`/groups/${id}/leave`),
};

export const messageAPI = {
  getConversation: (userId) => api.get(`/messages/conversation/${userId}`),
  getGroupMessages: (groupId) => api.get(`/messages/group/${groupId}`),
};

