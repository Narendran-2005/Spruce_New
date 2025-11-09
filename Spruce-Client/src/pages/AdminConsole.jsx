import { useState, useMemo } from 'react';
import useLogStore from '../store/logStore.js';

const LOG_TYPES = {
  all: 'All',
  handshake: 'Handshake',
  session: 'Session',
  encryption: 'Encryption',
  decryption: 'Decryption',
  encapsulation: 'Encapsulation',
  decapsulation: 'Decapsulation'
};

const LOG_COLORS = {
  handshake: 'bg-blue-500/20 text-blue-300 border-blue-500/30',
  session: 'bg-purple-500/20 text-purple-300 border-purple-500/30',
  encryption: 'bg-green-500/20 text-green-300 border-green-500/30',
  decryption: 'bg-yellow-500/20 text-yellow-300 border-yellow-500/30',
  encapsulation: 'bg-cyan-500/20 text-cyan-300 border-cyan-500/30',
  decapsulation: 'bg-orange-500/20 text-orange-300 border-orange-500/30',
  error: 'bg-red-500/20 text-red-300 border-red-500/30'
};

export default function AdminConsole() {
  const logs = useLogStore((s) => s.logs);
  const clearLogs = useLogStore((s) => s.clearLogs);
  const [filterType, setFilterType] = useState('all');
  const [filterPeer, setFilterPeer] = useState('');
  const [searchTerm, setSearchTerm] = useState('');

  const filteredLogs = useMemo(() => {
    return logs.filter(log => {
      if (filterType !== 'all' && log.type !== filterType) return false;
      if (filterPeer && log.peerId !== filterPeer) return false;
      if (searchTerm && !log.message.toLowerCase().includes(searchTerm.toLowerCase()) && 
          !log.operation?.toLowerCase().includes(searchTerm.toLowerCase())) return false;
      return true;
    });
  }, [logs, filterType, filterPeer, searchTerm]);

  const uniquePeers = useMemo(() => {
    const peers = new Set();
    logs.forEach(log => {
      if (log.peerId) peers.add(log.peerId);
    });
    return Array.from(peers).sort();
  }, [logs]);

  const formatTime = (timestamp) => {
    return new Date(timestamp).toLocaleTimeString('en-US', { 
      hour12: false, 
      hour: '2-digit', 
      minute: '2-digit', 
      second: '2-digit',
      fractionalSecondDigits: 3
    });
  };

  const getLogColor = (log) => {
    if (log.level === 'error') return LOG_COLORS.error;
    return LOG_COLORS[log.type] || 'bg-gray-500/20 text-gray-300 border-gray-500/30';
  };

  const stats = useMemo(() => {
    const stats = {
      handshake: 0,
      session: 0,
      encryption: 0,
      decryption: 0,
      encapsulation: 0,
      decapsulation: 0,
      errors: 0
    };
    logs.forEach(log => {
      if (log.level === 'error') stats.errors++;
      else if (stats[log.type] !== undefined) stats[log.type]++;
    });
    return stats;
  }, [logs]);

  return (
    <div className="h-screen bg-[#36393f] text-gray-100 flex flex-col">
      {/* Header */}
      <div className="bg-[#2f3136] border-b border-gray-700 px-6 py-4">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold text-white">Admin Console</h1>
          <div className="flex items-center gap-4">
            <div className="flex gap-2 text-sm">
              <div className="px-3 py-1 bg-blue-500/20 text-blue-300 rounded">
                Handshake: {stats.handshake}
              </div>
              <div className="px-3 py-1 bg-purple-500/20 text-purple-300 rounded">
                Session: {stats.session}
              </div>
              <div className="px-3 py-1 bg-green-500/20 text-green-300 rounded">
                Encrypt: {stats.encryption}
              </div>
              <div className="px-3 py-1 bg-yellow-500/20 text-yellow-300 rounded">
                Decrypt: {stats.decryption}
              </div>
              {stats.errors > 0 && (
                <div className="px-3 py-1 bg-red-500/20 text-red-300 rounded">
                  Errors: {stats.errors}
                </div>
              )}
            </div>
            <button
              onClick={clearLogs}
              className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded transition-colors"
            >
              Clear Logs
            </button>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-[#2f3136] border-b border-gray-700 px-6 py-3 flex gap-4 items-center flex-wrap">
        <div className="flex items-center gap-2">
          <label className="text-sm text-gray-400">Type:</label>
          <select
            value={filterType}
            onChange={(e) => setFilterType(e.target.value)}
            className="px-3 py-1 bg-[#202225] border border-gray-600 rounded text-white text-sm focus:outline-none focus:border-blue-500"
          >
            {Object.entries(LOG_TYPES).map(([key, label]) => (
              <option key={key} value={key}>{label}</option>
            ))}
          </select>
        </div>

        <div className="flex items-center gap-2">
          <label className="text-sm text-gray-400">Peer:</label>
          <select
            value={filterPeer}
            onChange={(e) => setFilterPeer(e.target.value)}
            className="px-3 py-1 bg-[#202225] border border-gray-600 rounded text-white text-sm focus:outline-none focus:border-blue-500"
          >
            <option value="">All Peers</option>
            {uniquePeers.map(peerId => (
              <option key={peerId} value={peerId}>{peerId}</option>
            ))}
          </select>
        </div>

        <div className="flex items-center gap-2 flex-1">
          <label className="text-sm text-gray-400">Search:</label>
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search logs..."
            className="flex-1 px-3 py-1 bg-[#202225] border border-gray-600 rounded text-white text-sm focus:outline-none focus:border-blue-500"
          />
        </div>

        <div className="text-sm text-gray-400">
          Showing {filteredLogs.length} of {logs.length} logs
        </div>
      </div>

      {/* Logs List */}
      <div className="flex-1 overflow-y-auto px-6 py-4">
        {filteredLogs.length === 0 ? (
          <div className="text-center text-gray-400 mt-8">
            No logs to display. Start a conversation to see crypto operations.
          </div>
        ) : (
          <div className="space-y-2">
            {filteredLogs.map((log) => (
              <div
                key={log.id}
                className={`p-4 rounded-lg border ${getLogColor(log)} transition-all hover:opacity-80`}
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-1">
                      <span className="text-xs font-mono text-gray-400">
                        {formatTime(log.timestamp)}
                      </span>
                      <span className="px-2 py-0.5 bg-black/20 rounded text-xs font-semibold uppercase">
                        {log.type}
                      </span>
                      <span className="px-2 py-0.5 bg-black/20 rounded text-xs">
                        {log.operation}
                      </span>
                      {log.peerId && (
                        <span className="px-2 py-0.5 bg-black/20 rounded text-xs text-gray-300">
                          Peer: {log.peerId}
                        </span>
                      )}
                    </div>
                    <div className="text-sm font-medium mb-1">{log.message}</div>
                    {log.details && (
                      <div className="text-xs text-gray-400 mt-2 font-mono">
                        {Object.entries(log.details).map(([key, value]) => (
                          <div key={key}>
                            <span className="text-gray-500">{key}:</span> {String(value)}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

