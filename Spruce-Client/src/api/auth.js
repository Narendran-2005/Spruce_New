import api from './apiClient.js';
import useSessionStore from '../store/sessionStore.js';

export async function login(username, password) {
  const data = await api.post('/auth/login', { username, password });
  useSessionStore.getState().setToken(data.token);
  useSessionStore.getState().setUser(data.user);
  return data;
}

export async function register(username, password, publicKeys) {
  // publicKeys: { perm_pub_x25519, kyber_pub, dilithium_pub }
  const data = await api.post('/auth/register', { username, password, publicKeys });
  return data;
}

export async function me() {
  try {
    const data = await api.get('/auth/me');
    useSessionStore.getState().setUser(data);
    return data;
  } catch (e) {
    return null;
  }
}

