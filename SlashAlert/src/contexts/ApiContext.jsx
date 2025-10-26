import React, { createContext, useContext, useEffect, useState } from 'react';
import apiService from '../services/apiService.js';
import authService from '../services/authService.js';

const ApiContext = createContext();

export const useApi = () => {
  const context = useContext(ApiContext);
  if (!context) {
    throw new Error('useApi must be used within an ApiProvider');
  }
  return context;
};

export const ApiProvider = ({ children }) => {
  const [apiStatus, setApiStatus] = useState({
    isAvailable: false,
    isChecking: true,
    error: null,
    lastChecked: null
  });
  
  const [isAuthenticated, setIsAuthenticated] = useState(authService.isAuthenticated());

  // Check API health
  const checkApiHealth = async () => {
    setApiStatus(prev => ({ ...prev, isChecking: true, error: null }));
    
    try {
      const health = await apiService.healthCheck();
      setApiStatus({
        isAvailable: health.status === 'Healthy',
        isChecking: false,
        error: health.status !== 'Healthy' ? health.message : null,
        lastChecked: new Date()
      });
    } catch (error) {
      setApiStatus({
        isAvailable: false,
        isChecking: false,
        error: error.message,
        lastChecked: new Date()
      });
    }
  };

  // Handle authentication state changes
  useEffect(() => {
    const handleAuthChange = (event) => {
      setIsAuthenticated(event.detail.isAuthenticated);
      
      // Check API health when user logs in
      if (event.detail.isAuthenticated) {
        checkApiHealth();
      }
    };

    window.addEventListener('authStateChanged', handleAuthChange);
    
    // Initial API health check
    if (isAuthenticated) {
      checkApiHealth();
    }

    return () => {
      window.removeEventListener('authStateChanged', handleAuthChange);
    };
  }, [isAuthenticated]);

  // Periodic health check (every 5 minutes)
  useEffect(() => {
    if (!isAuthenticated) return;

    const interval = setInterval(() => {
      checkApiHealth();
    }, 5 * 60 * 1000); // 5 minutes

    return () => clearInterval(interval);
  }, [isAuthenticated]);

  const value = {
    apiStatus,
    checkApiHealth,
    isAuthenticated,
    // Helper methods for making API calls with error handling
    safeApiCall: async (apiCall, fallbackValue = null) => {
      try {
        if (!apiStatus.isAvailable) {
          console.warn('API is not available, using fallback value');
          return fallbackValue;
        }
        
        return await apiCall();
      } catch (error) {
        console.error('API call failed:', error);
        
        // If it's an auth error, trigger re-authentication
        if (error.message.includes('Authentication required')) {
          setIsAuthenticated(false);
          authService.signOut();
        }
        
        // Check if API is still healthy
        checkApiHealth();
        
        return fallbackValue;
      }
    }
  };

  return (
    <ApiContext.Provider value={value}>
      {children}
    </ApiContext.Provider>
  );
};

// Hook for components to easily make safe API calls
export const useSafeApiCall = () => {
  const { safeApiCall } = useApi();
  return safeApiCall;
};