import React, { useState } from 'react';
import { authAPI } from '../services/api';
import { generateKeys } from '../utils/encryption';
import './Login.css';

const Login = ({ onLogin }) => {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [username, setUsername] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    try {
      let response;
      
      if (isLogin) {
        response = await authAPI.login({ email, password });
      } else {
        // Generate keys on registration (async now)
        const keys = await generateKeys();
        
        response = await authAPI.register({
          email,
          password,
          username,
          x25519PublicKey: keys.x25519Public,
          kyberPublicKey: keys.kyberPublic,
          dilithiumPublicKey: keys.dilithiumPublic,
        });
        
        // Store private keys locally (NEVER send to server!)
        localStorage.setItem('privateKeys', JSON.stringify({
          x25519Private: keys.x25519Private,
          kyberPrivate: keys.kyberPrivate,
          dilithiumPrivate: keys.dilithiumPrivate,
        }));
      }

      if (response.data.success) {
        onLogin(response.data.token, response.data.user);
      } else {
        setError(response.data.message || 'Authentication failed');
      }
    } catch (err) {
      setError(err.response?.data?.message || 'An error occurred');
    }
  };

  return (
    <div className="login-container">
      <div className="login-box">
        <h1>🌲 Spruce</h1>
        <p className="subtitle">Post-Quantum Secure Messaging</p>
        
        <form onSubmit={handleSubmit}>
          {!isLogin && (
            <input
              type="text"
              placeholder="Username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              required
            />
          )}
          <input
            type="email"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
          <input
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
          
          {error && <div className="error">{error}</div>}
          
          <button type="submit">
            {isLogin ? 'Login' : 'Register'}
          </button>
        </form>
        
        <p className="switch">
          {isLogin ? "Don't have an account? " : "Already have an account? "}
          <span onClick={() => setIsLogin(!isLogin)}>
            {isLogin ? 'Register' : 'Login'}
          </span>
        </p>
      </div>
    </div>
  );
};

export default Login;
