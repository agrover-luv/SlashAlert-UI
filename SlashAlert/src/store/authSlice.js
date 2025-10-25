import { createSlice } from '@reduxjs/toolkit';

// Helper function to parse JWT token
const parseJWT = (token) => {
  try {
    const base64Url = token.split('.')[1];
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    const jsonPayload = decodeURIComponent(atob(base64).split('').map(function(c) {
      return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
    }).join(''));
    
    return JSON.parse(jsonPayload);
  } catch (error) {
    console.error('Error parsing JWT:', error);
    return null;
  }
};

// Helper function to load initial state from localStorage
const loadInitialState = () => {
  try {
    const storedUser = localStorage.getItem('slashalert_user');
    const storedToken = localStorage.getItem('slashalert_token');
    
    if (storedUser && storedToken) {
      const user = JSON.parse(storedUser);
      return {
        user,
        token: storedToken,
        isAuthenticated: true,
        isLoading: false,
        error: null
      };
    }
  } catch (error) {
    console.error('Error loading auth state from localStorage:', error);
    // Clear corrupted data
    localStorage.removeItem('slashalert_user');
    localStorage.removeItem('slashalert_token');
  }
  
  return {
    user: null,
    token: null,
    isAuthenticated: false,
    isLoading: false,
    error: null
  };
};

const authSlice = createSlice({
  name: 'auth',
  initialState: loadInitialState(),
  reducers: {
    // Action to handle Google OAuth login
    loginWithGoogle: (state, action) => {
      const { credential } = action.payload;
      
      // Parse user info from JWT token
      const userInfo = parseJWT(credential);
      
      if (userInfo) {
        const user = {
          id: userInfo.sub,
          email: userInfo.email,
          full_name: userInfo.name,
          given_name: userInfo.given_name,
          family_name: userInfo.family_name,
          picture: userInfo.picture,
          email_verified: userInfo.email_verified,
          role: 'user',
          subscription_status: 'free'
        };
        
        // Update Redux state
        state.user = user;
        state.token = credential;
        state.isAuthenticated = true;
        state.isLoading = false;
        state.error = null;
        
        // Persist to localStorage
        localStorage.setItem('slashalert_user', JSON.stringify(user));
        localStorage.setItem('slashalert_token', credential);
        
        console.log('✅ User logged in successfully:', user.email);
        console.log('🎫 Token stored:', credential.substring(0, 50) + '...');
      } else {
        state.error = 'Failed to parse user information from token';
        state.isLoading = false;
      }
    },
    
    // Action to handle logout
    logout: (state) => {
      state.user = null;
      state.token = null;
      state.isAuthenticated = false;
      state.isLoading = false;
      state.error = null;
      
      // Clear localStorage
      localStorage.removeItem('slashalert_user');
      localStorage.removeItem('slashalert_token');
      
      console.log('👋 User logged out successfully');
    },
    
    // Action to set loading state
    setLoading: (state, action) => {
      state.isLoading = action.payload;
    },
    
    // Action to set error state
    setError: (state, action) => {
      state.error = action.payload;
      state.isLoading = false;
    },
    
    // Action to clear error
    clearError: (state) => {
      state.error = null;
    },
    
    // Action to update user profile
    updateUser: (state, action) => {
      if (state.user) {
        state.user = { ...state.user, ...action.payload };
        localStorage.setItem('slashalert_user', JSON.stringify(state.user));
        console.log('👤 User profile updated');
      }
    },
    
    // Action to refresh token (if needed for token refresh scenarios)
    refreshToken: (state, action) => {
      const { token } = action.payload;
      state.token = token;
      localStorage.setItem('slashalert_token', token);
      console.log('🔄 Token refreshed');
    }
  },
});

// Export actions
export const {
  loginWithGoogle,
  logout,
  setLoading,
  setError,
  clearError,
  updateUser,
  refreshToken
} = authSlice.actions;

// Export selectors
export const selectAuth = (state) => state.auth;
export const selectUser = (state) => state.auth.user;
export const selectToken = (state) => state.auth.token;
export const selectIsAuthenticated = (state) => state.auth.isAuthenticated;
export const selectIsLoading = (state) => state.auth.isLoading;
export const selectError = (state) => state.auth.error;

// Export reducer
export default authSlice.reducer;