import { create } from 'zustand';

const tokenKey = 'spruce.jwt';

const useSessionStore = create((set, get) => ({
  token: typeof localStorage !== 'undefined' ? localStorage.getItem(tokenKey) : null,
  user: null,
  contacts: [],
  chats: {},
  keys: {
    permX25519: null,
    kyber: null,
    dilithium: null
  },
  sessions: {},
  setToken: (token) => {
    if (token) {
      localStorage.setItem(tokenKey, token);
    } else {
      localStorage.removeItem(tokenKey);
    }
    set({ token });
  },
  setUser: (user) => set({ user }),
  setContacts: (contacts) => set({ contacts }),
  setChats: (chats) => set({ chats }),
  setKeys: (keys) => set({ keys }),
  setSessionKey: (peerId, session) => set({ sessions: { ...get().sessions, [peerId]: session } }),
  logout: () => {
    localStorage.removeItem(tokenKey);
    set({ token: null, user: null, sessions: {}, chats: {} });
  }
}));

export default useSessionStore;

