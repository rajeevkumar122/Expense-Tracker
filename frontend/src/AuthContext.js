import React, { createContext, useState, useEffect, useContext } from 'react';

// Create auth context
const AuthContext = createContext();

// Auth provider component
export const AuthProvider = ({ children }) => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // Check for existing token and validate on component mount
  useEffect(() => {
    const checkAuth = async () => {
      const token = localStorage.getItem('token');
      const storedUser = localStorage.getItem('user');
      
      if (token) {
        try {
          // Validate token with backend
          const response = await fetch('http://localhost:5000/api/validate-token', {
            headers: {
              'Authorization': `Bearer ${token}`
            }
          });

          if (response.ok) {
            setIsAuthenticated(true);
            if (storedUser) {
              try {
                const parsedUser = JSON.parse(storedUser);
                // Ensure token is included in user object
                if (!parsedUser.token && token) {
                  parsedUser.token = token;
                }
                setUser(parsedUser);
              } catch (e) {
                console.error('Failed to parse user data:', e);
                logout(); // Clear invalid user data
              }
            }
          } else {
            // Token invalid, clear auth state
            logout();
          }
        } catch (error) {
          console.error('Token validation error:', error);
          logout();
        }
      } else {
        setIsAuthenticated(false);
        setUser(null);
      }
      
      setLoading(false);
    };
    
    checkAuth();
  }, []);

  // Login function
  const login = (token, userData) => {
    const userWithToken = { ...userData, token };
    localStorage.setItem('token', token);
    localStorage.setItem('user', JSON.stringify(userWithToken));
    setIsAuthenticated(true);
    setUser(userWithToken);
  };

  // Logout function
  const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setIsAuthenticated(false);
    setUser(null);
  };

  // Auth context value
  const value = {
    isAuthenticated,
    user,
    loading,
    login,
    logout
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

// Custom hook to use auth context
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export default AuthContext;
