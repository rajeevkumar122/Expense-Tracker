import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../AuthContext';
import './Login.css'; // Assuming you have a CSS file for styling

const Login = () => {
  const navigate = useNavigate();
  const { login } = useAuth();

  const [isLogin, setIsLogin] = useState(true);
  const [formData, setFormData] = useState({ username: '', email: '', password: '' });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const toggleMode = () => {
    setIsLogin(prev => !prev);
    setFormData({ username: '', email: '', password: '' });
    setError('');
    setSuccess('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setLoading(true);

    if (!formData.email || !formData.password || (!isLogin && !formData.username)) {
      setError('Please fill in all fields');
      setLoading(false);
      return;
    }

    try {
      const endpoint = isLogin ? 'login' : 'register';
      const response = await fetch(`http://localhost:5000/api/${endpoint}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(isLogin ? {
          email: formData.email,
          password: formData.password
        } : {
          username: formData.username,
          email: formData.email,
          password: formData.password
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || `${isLogin ? 'Login' : 'Registration'} failed`);
      }

      const data = await response.json();
      
      if (!data.token || !data.user) {
        throw new Error('Invalid response from server');
      }

      if (typeof data.token !== 'string' || data.token.length < 10) {
        throw new Error('Invalid token received');
      }

      // ✅ Save token and login
      login(data.token, data.user);
      localStorage.setItem("token", data.token);

      setSuccess(isLogin ? 'Login successful!' : 'Registration successful! Please login.');
      setTimeout(() => {
        if (isLogin) {
          navigate('/dashboard');
        } else {
          setIsLogin(true);
          setFormData({ username: '', email: '', password: '' });
        }
      }, 1500);

    } catch (err) {
      console.error(isLogin ? "Login error:" : "Signup error:", err);
      setError(err.message || 'Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-container">
      <div className="login-card">
        <div className="card-header">
          <h1 className="app-title">Expense Tracker</h1>
          <h2>{isLogin ? 'Welcome Back!' : 'Create Account'}</h2>
        </div>

      <form onSubmit={handleSubmit}>
        {!isLogin && (
          <div className="mb-3">
            <label className="form-label">Username</label>
            <input
              type="text"
              name="username"
              className="form-control"
              value={formData.username}
              onChange={handleInputChange}
            />
          </div>
        )}

        <div className="mb-3">
          <label className="form-label">Email</label>
          <input
            type="email"
            name="email"
            className="form-control"
            value={formData.email}
            onChange={handleInputChange}
          />
        </div>

        <div className="mb-3">
          <label className="form-label">Password</label>
          <input
            type="password"
            name="password"
            className="form-control"
            value={formData.password}
            onChange={handleInputChange}
          />
        </div>

        {error && <div className="alert alert-danger">{error}</div>}
        {success && <div className="alert alert-success">{success}</div>}

        <button type="submit" className="btn-block" disabled={loading}>
          {loading ? 'Processing...' : isLogin ? 'Login' : 'Register'}
        </button>
      </form>

      <div className="login-footer">
        <button className="toggle-btn" onClick={toggleMode}>
          {isLogin ? 'Create an account' : 'Already have an account? Login'}
        </button>
      </div>
    </div>
    </div>
  );
};

export default Login;
