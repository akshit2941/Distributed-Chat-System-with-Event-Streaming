import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { LogIn, UserPlus, Mail, Lock, User, Eye, EyeOff, MessageSquareCode } from 'lucide-react';
import './LoginRegister.css';

export const LoginRegister: React.FC = () => {
  const { login, register } = useAuth();
  const [isLogin, setIsLogin] = useState<boolean>(true);
  
  // Form fields
  const [username, setUsername] = useState<string>('');
  const [password, setPassword] = useState<string>('');
  const [email, setEmail] = useState<string>('');
  
  // UI States
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState<boolean>(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);
    setLoading(true);

    try {
      if (isLogin) {
        await login(username, password);
      } else {
        await register(username, password, email);
        setSuccess('Registration successful! You can now log in.');
        setIsLogin(true); // Switch to login view
        setPassword(''); // Clear password for security
      }
    } catch (err: any) {
      setError(err.message || 'An unexpected error occurred');
    } finally {
      setLoading(false);
    }
  };

  const toggleTab = (loginView: boolean) => {
    setIsLogin(loginView);
    setError(null);
    setSuccess(null);
    setUsername('');
    setPassword('');
    setEmail('');
  };

  return (
    <div className="auth-container">
      <div className="auth-card glass">
        <div className="auth-header">
          <div className="auth-logo">
            <MessageSquareCode size={48} />
          </div>
          <h2 className="auth-title">Distributed Chat System</h2>
          <p className="auth-subtitle">
            {isLogin ? 'Log in to join the conversation' : 'Create an account to get started'}
          </p>
        </div>

        <div className="auth-tabs">
          <button 
            type="button" 
            className={`auth-tab ${isLogin ? 'active' : ''}`}
            onClick={() => toggleTab(true)}
          >
            Login
          </button>
          <button 
            type="button" 
            className={`auth-tab ${!isLogin ? 'active' : ''}`}
            onClick={() => toggleTab(false)}
          >
            Register
          </button>
        </div>

        {error && (
          <div className="alert alert-danger" style={{ marginBottom: '20px' }}>
            <span>{error}</span>
          </div>
        )}

        {success && (
          <div className="alert alert-success" style={{ marginBottom: '20px' }}>
            <span>{success}</span>
          </div>
        )}

        <form className="auth-form" onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label">Username</label>
            <div className="input-container">
              <User className="input-icon" size={18} />
              <input 
                type="text" 
                className="auth-input" 
                placeholder="Enter your username" 
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                required
                autoComplete="username"
              />
            </div>
          </div>

          {!isLogin && (
            <div className="form-group">
              <label className="form-label">Email Address</label>
              <div className="input-container">
                <Mail className="input-icon" size={18} />
                <input 
                  type="email" 
                  className="auth-input" 
                  placeholder="Enter your email" 
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required={!isLogin}
                  autoComplete="email"
                />
              </div>
            </div>
          )}

          <div className="form-group">
            <label className="form-label">Password</label>
            <div className="input-container">
              <Lock className="input-icon" size={18} />
              <input 
                type={showPassword ? 'text' : 'password'} 
                className="auth-input" 
                placeholder="Enter your password" 
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                autoComplete="current-password"
              />
              <button 
                type="button" 
                className="password-toggle"
                onClick={() => setShowPassword(!showPassword)}
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </div>

          <button type="submit" className="auth-btn" disabled={loading}>
            {loading ? (
              <span>Connecting...</span>
            ) : isLogin ? (
              <>
                <LogIn size={18} />
                <span>Log In</span>
              </>
            ) : (
              <>
                <UserPlus size={18} />
                <span>Register</span>
              </>
            )}
          </button>
        </form>
      </div>
    </div>
  );
};
