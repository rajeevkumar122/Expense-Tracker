import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../AuthContext';
import './Transactions.css';

const sampleTransactions = [
  { id: 1, text: 'Monthly Salary', amount: 5000, created_at: new Date(Date.now() - 15 * 86400000).toISOString() },
  { id: 2, text: 'Groceries', amount: -200, created_at: new Date(Date.now() - 10 * 86400000).toISOString() },
  { id: 3, text: 'Rent Payment', amount: -1200, created_at: new Date(Date.now() - 5 * 86400000).toISOString() },
  { id: 4, text: 'Freelance Project', amount: 1500, created_at: new Date(Date.now() - 3 * 86400000).toISOString() },
  { id: 5, text: 'Restaurant Dinner', amount: -85, created_at: new Date(Date.now() - 2 * 86400000).toISOString() },
  { id: 6, text: 'Utility Bills', amount: -150, created_at: new Date(Date.now() - 1 * 86400000).toISOString() },
  { id: 7, text: 'Online Course', amount: -99, created_at: new Date().toISOString() }
];

const Transactions = () => {
  const { user } = useAuth();
  const location = useLocation();
  const [transactions, setTransactions] = useState([]);
  const [filteredTransactions, setFilteredTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [filter, setFilter] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState('date');
  const [sortOrder, setSortOrder] = useState('desc');
  const [currentBalance, setCurrentBalance] = useState(0);
  const [editingTransaction, setEditingTransaction] = useState(null);
  const [editFormData, setEditFormData] = useState({ text: '', amount: '' });

  const fetchTransactions = async () => {
    setLoading(true);
    try {
      const token = user?.token || 'dev-token';
      const response = await fetch('http://localhost:5000/api/transactions', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await response.json();

      if (!response.ok) throw new Error(data.message || 'Failed to fetch transactions');

      if (Array.isArray(data.transactions)) {
        setTransactions(data.transactions);
        const total = data.transactions.reduce((sum, t) => sum + parseFloat(t.amount), 0);
        setCurrentBalance(total);
      } else {
        setTransactions([]);
      }
    } catch (err) {
      setError(err.message || 'Error fetching transactions');
      setTransactions(sampleTransactions);
      const total = sampleTransactions.reduce((sum, t) => sum + parseFloat(t.amount), 0);
      setCurrentBalance(total);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchTransactions(); }, [user, location.key]);

  useEffect(() => {
    let result = [...transactions];

    if (filter === 'income') result = result.filter(t => t.amount > 0);
    else if (filter === 'expense') result = result.filter(t => t.amount < 0);

    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      result = result.filter(t => t.text.toLowerCase().includes(term));
    }

    result.sort((a, b) => {
      if (sortBy === 'date') {
        return sortOrder === 'asc' ? new Date(a.created_at) - new Date(b.created_at) : new Date(b.created_at) - new Date(a.created_at);
      } else {
        return sortOrder === 'asc' ? a.amount - b.amount : b.amount - a.amount;
      }
    });

    setFilteredTransactions(result);
  }, [transactions, filter, searchTerm, sortBy, sortOrder]);

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this transaction?')) return;
    try {
      const token = user?.token;
      if (!token) throw new Error('Authentication required');

      const response = await fetch(`http://localhost:5000/api/transactions/${id}`, {
        method: 'DELETE',
        headers: { 
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.message || 'Failed to delete transaction');
      }

      const t = transactions.find(t => t.id === id);
      if (t) {
        setCurrentBalance(prev => prev - parseFloat(t.amount));
        setTransactions(transactions.filter(t => t.id !== id));
        setError('');
      }
    } catch (err) {
      setError(err.message || 'Error deleting transaction');
    }
  };

  const handleEdit = async (id) => {
    if (editingTransaction) {
      try {
        const token = user?.token;
        if (!token) throw new Error('Authentication required');

        if (!editFormData.text.trim()) {
          throw new Error('Description cannot be empty');
        }

        const amount = parseFloat(editFormData.amount);
        if (isNaN(amount)) {
          throw new Error('Please enter a valid amount');
        }

        // Preserve the transaction type (income/expense) by maintaining the sign
        const originalTransaction = transactions.find(t => t.id === id);
        const finalAmount = originalTransaction.amount < 0 ? -Math.abs(amount) : Math.abs(amount);

        const response = await fetch(`http://localhost:5000/api/transactions/${id}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify({
            text: editFormData.text.trim(),
            amount: finalAmount
          })
        });

        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.message || 'Failed to update transaction');
        }

        const updatedTransaction = data.transaction;

        setTransactions(transactions.map(t => t.id === id ? updatedTransaction : t));
        setEditingTransaction(null);
        setEditFormData({ text: '', amount: '' });
        setError('');
      } catch (err) {
        setError(err.message || 'Error updating transaction');
      }
    } else {
      const t = transactions.find(t => t.id === id);
      setEditFormData({ text: t.text, amount: Math.abs(t.amount) });
      setEditingTransaction(id);
    }
  };

  const handleEditChange = (e) => {
    setEditFormData({ ...editFormData, [e.target.name]: e.target.value });
  };

  const cancelEdit = () => {
    setEditingTransaction(null);
    setEditFormData({ text: '', amount: '' });
  };

  if (loading) return <div className="loading">Loading transactions...</div>;

  return (
    <div className="transactions-page">
      <h1>Transaction History</h1>

      {error && <div className="error-alert">{error}</div>}

      <div className="current-balance">
        <h3>Current Balance: 
          <span className={currentBalance >= 0 ? 'income' : 'expense'}>
            ₹{Math.abs(currentBalance).toFixed(2)}
          </span>
        </h3>
      </div>

      <div className="filters">
        <input
          type="text"
          placeholder="Search transactions..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
        <select value={filter} onChange={(e) => setFilter(e.target.value)}>
          <option value="all">All</option>
          <option value="income">Income</option>
          <option value="expense">Expenses</option>
        </select>
        <select value={sortBy} onChange={(e) => setSortBy(e.target.value)}>
          <option value="date">Date</option>
          <option value="amount">Amount</option>
        </select>
        <select value={sortOrder} onChange={(e) => setSortOrder(e.target.value)}>
          <option value="desc">Newest/Highest First</option>
          <option value="asc">Oldest/Lowest First</option>
        </select>
      </div>

      {filteredTransactions.length === 0 ? (
        <div className="empty-state">
          <p>No transactions found</p>
          <Link to="/expenses" className="btn">Add New Transaction</Link>
        </div>
      ) : (
        <table>
          <thead>
            <tr>
              <th>Description</th>
              <th>Amount</th>
              <th>Date</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredTransactions.map(t => (
              <tr key={t.id}>
                <td>
                  {editingTransaction === t.id ? (
                    <input name="text" value={editFormData.text} onChange={handleEditChange} />
                  ) : t.text}
                </td>
                <td>
                  {editingTransaction === t.id ? (
                    <input name="amount" type="number" value={editFormData.amount} onChange={handleEditChange} />
                  ) : (
                    <span className={t.amount < 0 ? 'expense' : 'income'}>
                      ₹{Math.abs(t.amount).toFixed(2)}
                    </span>
                  )}
                </td>
                <td>{new Date(t.created_at).toLocaleDateString()}</td>
                <td>
                  <button className={editingTransaction === t.id ? 'btn-save' : 'btn-edit'} onClick={() => handleEdit(t.id)}>{editingTransaction === t.id ? 'Save' : 'Edit'}</button>
                  {editingTransaction === t.id && <button className="btn-cancel" onClick={cancelEdit}>Cancel</button>}
                  <button className="btn-delete" onClick={() => handleDelete(t.id)}>Delete</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
};

export default Transactions;