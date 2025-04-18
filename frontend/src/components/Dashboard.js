import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../AuthContext';
import './Dashboard.css';

const Dashboard = () => {
  const { user } = useAuth();
  const location = useLocation();
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchTransactions = async () => {
      setLoading(true);
      
      try {
        const token = user?.token;
        if (!token) {
          throw new Error('Authentication token is required');
        }
        
        const response = await fetch('http://localhost:5000/api/transactions', {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });
        
        const data = await response.json();
        
        if (!response.ok) {
          throw new Error(data.message || 'Failed to fetch transactions');
        }
        
        setTransactions(data.transactions || []);
      } catch (err) {
        setError(err.message || 'Error fetching transactions');
        setTransactions([]);
      } finally {
        setLoading(false);
      }
    };
    
    fetchTransactions();
  }, [user, location.key]); // Add location.key to refresh on navigation

  // Calculate summary statistics
  const calculateStats = () => {
    const totalBalance = transactions.reduce((sum, transaction) => sum + parseFloat(transaction.amount), 0);
    const income = transactions
      .filter(transaction => parseFloat(transaction.amount) > 0)
      .reduce((sum, transaction) => sum + parseFloat(transaction.amount), 0);
    const expenses = transactions
      .filter(transaction => parseFloat(transaction.amount) < 0)
      .reduce((sum, transaction) => sum + parseFloat(transaction.amount), 0);
    
    return {
      totalBalance: totalBalance.toFixed(2),
      income: income.toFixed(2),
      expenses: Math.abs(expenses).toFixed(2)
    };
  };

  const { totalBalance, income, expenses } = calculateStats();

  // Get recent transactions (last 5)
  const recentTransactions = [...transactions]
    .sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
    .slice(0, 5);

  if (loading) {
    return <div className="loading">Loading dashboard data...</div>;
  }

  return (
    <div className="dashboard">
      <h1>Dashboard</h1>
      
      {error && <div className="error-alert">{error}</div>}
      
      {transactions.length === 0 ? (
        <div className="no-data-message">
          <p>No transactions found. Add your first transaction to start tracking your finances!</p>
          <Link to="/transactions/add" className="btn">Add Transaction</Link>
        </div>
      ) : (
        <div className="stats-container">
          <div className="card stat-card">
            <div className={`stat-value ${parseFloat(totalBalance) >= 0 ? 'income' : 'expense'}`}>
              ₹{totalBalance}
            </div>
            <div className="stat-label">Current Balance</div>
          </div>
          
          <div className="card stat-card">
            <div className="stat-value income">₹{income}</div>
            <div className="stat-label">Total Income</div>
          </div>
          
          <div className="card stat-card">
            <div className="stat-value expense">₹{expenses}</div>
            <div className="stat-label">Total Expenses</div>
          </div>
        </div>
      )}
      
      <div className="card recent-transactions">
        <div className="card-header">
          <h2>Recent Transactions</h2>
          <Link to="/transactions" className="view-all">View All</Link>
        </div>
        
        {recentTransactions.length === 0 ? (
          <p className="no-data">No recent transactions</p>
        ) : (
          <div className="table-container">
            <table>
              <thead>
                <tr>
                  <th>Description</th>
                  <th>Amount</th>
                  <th>Date</th>
                </tr>
              </thead>
              <tbody>
                {recentTransactions.map(transaction => (
                  <tr key={transaction.id}>
                    <td>{transaction.text}</td>
                    <td className={parseFloat(transaction.amount) >= 0 ? 'income' : 'expense'}>
                      ₹{Math.abs(parseFloat(transaction.amount)).toFixed(2)}
                    </td>
                    <td>{new Date(transaction.created_at).toLocaleDateString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
      
      <div className="dashboard-actions">
        <Link to="/transactions" className="btn">View All Transactions</Link>
      </div>
    </div>
  );
};

export default Dashboard;