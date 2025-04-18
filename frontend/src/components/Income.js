import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../AuthContext';
import './Income.css';

const Income = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [formData, setFormData] = useState({
    text: '',
    amount: ''
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState('');

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setLoading(true);

    // Validation
    if (!formData.text.trim()) {
      setError('Please enter a description');
      setLoading(false);
      return;
    }

    if (!formData.amount) {
      setError('Please enter an amount');
      setLoading(false);
      return;
    }

    // Ensure amount is positive for income
    let amount = Math.abs(parseFloat(formData.amount));

    try {
      // Get token from localStorage
      const token = localStorage.getItem('token');
      if (!token) {
        throw new Error('Authentication token not found');
      }
      
      console.log('Adding income:', { text: formData.text, amount });

      // Call API
      const response = await fetch('http://localhost:5000/api/transactions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          text: formData.text,
          amount
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        setError(errorData.error || 'Failed to add income');
        setLoading(false);
        return;
      }

      // Process the successful response
      await response.json(); // Consume the response body but don't assign to unused variable
      setSuccess('Income added successfully');
      
      // Show success message and reset form
      setFormData({ text: '', amount: '' });
      
      // Navigate to transactions after a short delay
      setTimeout(() => {
        navigate('/transactions');
      }, 1500);
    } catch (err) {
      console.error('Error adding income:', err);
      setError(err.message || 'Failed to add income. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="income">
      <h1>Add New Income</h1>
      
      <div className="card income-form-card">
        {error && <div className="error-alert">{error}</div>}
        {success && <div className="success-alert">{success}</div>}
        
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label htmlFor="text">Description</label>
            <input
              type="text"
              id="text"
              name="text"
              value={formData.text}
              onChange={handleChange}
              placeholder="What is the source of income?"
              disabled={loading}
            />
          </div>
          
          <div className="form-group">
            <label htmlFor="amount">Amount (₹)</label>
            <input
              type="number"
              id="amount"
              name="amount"
              value={formData.amount}
              onChange={handleChange}
              placeholder="Enter amount"
              step="0.01"
              min="0"
              disabled={loading}
            />
            <small className="form-text">Enter a positive amount, it will be recorded as income</small>
          </div>
          
          <div className="form-actions">
            <button type="submit" className="btn" disabled={loading}>
              {loading ? 'Adding...' : 'Add Income'}
            </button>
            <button 
              type="button" 
              className="btn btn-secondary" 
              onClick={() => navigate('/transactions')}
              disabled={loading}
            >
              View Transactions
            </button>
          </div>
        </form>
      </div>
      
    </div>
  );
};

export default Income;