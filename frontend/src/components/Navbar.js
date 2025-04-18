import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../AuthContext';
import './Navbar.css';

const Navbar = () => {
  const navigate = useNavigate();
  const { isAuthenticated, logout } = useAuth();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <nav className="navbar">
      <div className="navbar-container">
        <Link to="/dashboard" className="navbar-logo">
          ExpenseTracker
        </Link>
        
        <div className="navbar-menu">
          {isAuthenticated ? (
            <>
              <Link to="/dashboard" className="navbar-item">Dashboard</Link>
              <Link to="/expenses" className="navbar-item">Expenses</Link>
              <Link to="/income" className="navbar-item">Income</Link>
              <Link to="/transactions" className="navbar-item">Transactions</Link>
              <button onClick={handleLogout} className="navbar-button">Logout</button>
            </>
          ) : (
            <Link to="/login" className="navbar-button">Login</Link>
          )}
        </div>
      </div>
    </nav>
  );
};

export default Navbar;