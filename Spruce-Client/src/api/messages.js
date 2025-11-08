import api from './apiClient.js';

export const fetchHistory = async (peerId) => api.get(`/messages/history/${peerId}`);
export const sendMessage = async (payload) => api.post('/messages/send', payload);

