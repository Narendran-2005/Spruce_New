import api from './apiClient.js';

export const listContacts = async () => api.get('/contacts');
export const getPublicKeys = async (userId) => api.get(`/users/${userId}/keys`);

