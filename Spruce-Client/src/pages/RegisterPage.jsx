import { useState } from 'react';
import { register } from '../api/auth.js';
import { generatePermanentKeypairs, loadKeys } from '../crypto/hybridKeyManager.js';
import { useNavigate, Link } from 'react-router-dom';

export default function RegisterPage() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  async function onSubmit(e) {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      // Generate permanent keypairs and persist locally
      const keys = await generatePermanentKeypairs();
      // Send public keys to backend
      await register(username, password, {
        perm_pub_x25519: keys.perm_pub_x25519,
        kyber_pub: keys.kyber_pub,
        dilithium_pub: keys.dilithium_pub
      });
      navigate('/login');
    } catch (e) {
      setError(e.message || 'Registration failed');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="max-w-md mx-auto mt-16 bg-[#2f3136] border border-gray-700 rounded-lg p-6 shadow-lg">
      <h1 className="text-xl font-semibold mb-4 text-white">Register</h1>
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
          {loading ? 'Creating...' : 'Register'}
        </button>
      </form>
      <div className="text-sm mt-3 text-gray-400">Have an account? <Link to="/login" className="text-blue-400 hover:text-blue-300 transition-colors">Login</Link></div>
    </div>
  );
}

