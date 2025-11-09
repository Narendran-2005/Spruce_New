import { create } from 'zustand';

const MAX_LOGS = 1000; // Keep last 1000 logs

const useLogStore = create((set, get) => ({
  logs: [],
  
  addLog: (log) => {
    const newLog = {
      id: crypto.randomUUID(),
      timestamp: Date.now(),
      ...log
    };
    
    set((state) => {
      const logs = [newLog, ...state.logs].slice(0, MAX_LOGS);
      return { logs };
    });
  },
  
  clearLogs: () => set({ logs: [] }),
  
  getLogsByType: (type) => {
    return get().logs.filter(log => log.type === type);
  },
  
  getLogsByPeer: (peerId) => {
    return get().logs.filter(log => log.peerId === peerId);
  }
}));

export default useLogStore;

