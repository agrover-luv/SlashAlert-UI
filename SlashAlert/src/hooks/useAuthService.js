import { useEffect } from 'react';
import { useAppDispatch, useAuth } from '../store/hooks.js';
import { loginWithGoogle } from '../store/authSlice.js';

// Custom hook to handle authentication state and provide utilities
export const useAuthService = () => {
  const dispatch = useAppDispatch();
  const authState = useAuth();

  // Function to trigger Google login and update Redux state
  const loginWithGoogleCredential = (credential) => {
    dispatch(loginWithGoogle({ credential }));
  };

  // Function to check if user needs to re-authenticate
  const isTokenValid = () => {
    if (!authState.token) return false;
    
    try {
      // Parse JWT to check expiration
      const base64Url = authState.token.split('.')[1];
      const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
      const jsonPayload = decodeURIComponent(atob(base64).split('').map(function(c) {
        return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
      }).join(''));
      
      const decoded = JSON.parse(jsonPayload);
      const currentTime = Date.now() / 1000;
      
      return decoded.exp > currentTime;
    } catch (error) {
      console.error('Error validating token:', error);
      return false;
    }
  };

  return {
    ...authState,
    loginWithGoogleCredential,
    isTokenValid
  };
};