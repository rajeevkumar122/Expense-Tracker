import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import './App.css';
import Dashboard from './components/Dashboard';
import Expenses from './components/Expenses';
import Income from './components/Income';
import Transactions from './components/Transactions';
import Navbar from './components/Navbar';
import Login from './components/Login';
import { AuthProvider, useAuth } from './AuthContext';

const AppRoutes = () => {
  const { isAuthenticated } = useAuth();
  console.log("Authentication status:", isAuthenticated);

  return (
    <div className="app-container">
      {isAuthenticated && <Navbar />}
      <div className="content-container">
        <Routes>
          <Route path="/" element={isAuthenticated ? <Navigate to="/dashboard" /> : <Navigate to="/login" />} />
          <Route path="/dashboard" element={isAuthenticated ? <Dashboard /> : <Navigate to="/login" />} />
          <Route path="/expenses" element={isAuthenticated ? <Expenses /> : <Navigate to="/login" />} />
          <Route path="/income" element={isAuthenticated ? <Income /> : <Navigate to="/login" />} />
          <Route path="/transactions" element={isAuthenticated ? <Transactions /> : <Navigate to="/login" />} />
          <Route path="/login" element={isAuthenticated ? <Navigate to="/dashboard" /> : <Login />} />
        </Routes>
      </div>
    </div>
  );
};

const App = () => {
  return (
    <AuthProvider>
      <Router>
        <AppRoutes />
      </Router>
    </AuthProvider>
  );
};

export default App;
