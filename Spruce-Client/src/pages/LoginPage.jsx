import { useState } from 'react';
import { login } from '../api/auth.js';
import { useNavigate, Link } from 'react-router-dom';

export default function LoginPage() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  async function onSubmit(e) {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await login(username, password);
      navigate('/chat');
    } catch (e) {
      setError(e.message || 'Login failed');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="max-w-md mx-auto mt-16 bg-[#2f3136] border border-gray-700 rounded-lg p-6 shadow-lg">
      <h1 className="text-xl font-semibold mb-4 text-white">Login</h1>
      {error && <div className="mb-3 text-red-400 text-sm bg-red-500/10 border border-red-500/30 rounded p-2">{error}</div>}
      <form onSubmit={onSubmit} className="space-y-3">
        <input 
          className="w-full bg-[#202225] border border-gray-600 rounded px-3 py-2 text-white placeholder-gray-400 focus:outline-none focus:border-blue-500" 
          placeholder="Username" 
          value={username} 
          onChange={(e) => setUsername(e.target.value)} 
        />
        <input 
          className="w-full bg-[#202225] border border-gray-600 rounded px-3 py-2 text-white placeholder-gray-400 focus:outline-none focus:border-blue-500" 
          placeholder="Password" 
          type="password" 
          value={password} 
          onChange={(e) => setPassword(e.target.value)} 
        />
        <button disabled={loading} className="w-full py-2 rounded bg-[#5865f2] hover:bg-[#4752c4] text-white transition-colors disabled:opacity-50 disabled:cursor-not-allowed">
          {loading ? 'Signing in...' : 'Login'}
        </button>
      </form>
      <div className="text-sm mt-3 text-gray-400">No account? <Link to="/register" className="text-blue-400 hover:text-blue-300 transition-colors">Register</Link></div>
    </div>
  );
}

