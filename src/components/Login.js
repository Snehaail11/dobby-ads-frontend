import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import './Login.css';

const Login = () => {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showSignupPrompt, setShowSignupPrompt] = useState(false);
  
  const { login, signup } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setLoading(true);

    let result;
    if (isLogin) {
      result = await login(email, password);
      
      if (!result.success && (result.message.includes('not found') || result.message.includes('Invalid'))) {
        setShowSignupPrompt(true);
        setError('');
      }
    } else {
      result = await signup(email, password, name);
      
      if (result.success) {
        setSuccess('Account created! Redirecting to login...');
        setTimeout(() => {
          setIsLogin(true);
          setSuccess('');
          setPassword('');
        }, 1500);
      } else {
        setError(result.message);
      }
    }

    if (result.success && isLogin) {
      navigate('/dashboard');
    }
    setLoading(false);
  };

  const handleCreateAccount = () => {
    setShowSignupPrompt(false);
    setIsLogin(false);
    setError('');
  };

  return (
    <div className="login-container">
      <div className="login-card fade-in">
        <div className="login-header">
          <h1>📁 Dobby Ads</h1>
          <p>Your Smart File Management System</p>
        </div>
        
        <div className="login-tabs">
          <button className={`tab ${isLogin ? 'active' : ''}`} onClick={() => { setIsLogin(true); setError(''); setShowSignupPrompt(false); }}>
            Login
          </button>
          <button className={`tab ${!isLogin ? 'active' : ''}`} onClick={() => { setIsLogin(false); setError(''); }}>
            Sign Up
          </button>
        </div>

        {success && <div className="login-success">{success}</div>}
        
        {showSignupPrompt && (
          <div className="login-prompt">
            <p>Account doesn't exist. Create one?</p>
            <button className="btn-create" onClick={handleCreateAccount}>
              Create Account
            </button>
          </div>
        )}

        <form onSubmit={handleSubmit}>
          {!isLogin && (
            <input
              type="text"
              placeholder="Your name"
              value={name}
              onChange={(e) => setName(e.target.value)}
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
          
          <div className="password-field">
            <input
              type={showPassword ? 'text' : 'password'}
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
            <button
              type="button"
              className="toggle-password"
              onClick={() => setShowPassword(!showPassword)}
            >
              {showPassword ? (
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.45 18.45 0 0 1-5.06 5.94M12 12v3"/>
                </svg>
              ) : (
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
                  <circle cx="12" cy="12" r="3"/>
                </svg>
              )}
            </button>
          </div>
          
          {error && <div className="login-error">{error}</div>}
          
          <button type="submit" className="btn-primary" disabled={loading}>
            {loading ? 'Please wait...' : (isLogin ? 'Login' : 'Sign Up')}
          </button>
        </form>
      </div>
    </div>
  );
};

export default Login;