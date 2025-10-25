import authService from '../services/authService.js';
import apiService from '../services/apiService.js';

// Real API implementations with Google SSO authentication
export const User = {
  async me() {
    // First check local authentication state
    const localUser = authService.getCurrentUser();
    if (!localUser) {
      throw new Error('User not authenticated locally');
    }

    try {
      // Try to get user data from API to sync with backend
      const apiUser = await apiService.getCurrentUser();
      return apiUser;
    } catch (error) {
      // If API fails, fall back to local user data
      console.warn('Failed to fetch user from API, using local data:', error.message);
      return localUser;
    }
  },

  async loginWithRedirect(redirectUrl) {
    // Store redirect URL for after authentication
    if (redirectUrl) {
      localStorage.setItem('slashalert_redirect_after_login', redirectUrl);
    }
    
    // Trigger Google Sign-In
    await authService.signIn();
  },

  async logout() {
    // Clear any stored redirect URL
    localStorage.removeItem('slashalert_redirect_after_login');
    
    // Sign out from Google
    return await authService.signOut();
  },

  isAuthenticated() {
    return authService.isAuthenticated();
  },

  async updateProfile(userData) {
    return await apiService.updateUserProfile(userData);
  }
};

// Product entity with real API calls
export const Product = {
  async filter(query = {}, sort = null, limit = null) {
    try {
      // Build query parameters including sort and limit
      const queryParams = { ...query };
      
      if (sort) {
        queryParams.sort = sort;
      }
      
      if (limit) {
        queryParams.limit = limit;
      }
      
      return await apiService.getProducts(queryParams);
    } catch (error) {
      console.error('Failed to fetch products:', error);
      // Return empty array on error to prevent UI crashes
      return [];
    }
  },

  async get(id) {
    try {
      return await apiService.getProduct(id);
    } catch (error) {
      console.error(`Failed to fetch product ${id}:`, error);
      return null;
    }
  },

  async create(productData) {
    return await apiService.createProduct(productData);
  },

  async update(id, productData) {
    return await apiService.updateProduct(id, productData);
  },

  async delete(id) {
    await apiService.deleteProduct(id);
    return true;
  },

  async comparePrice(productData) {
    return await apiService.comparePrice(productData);
  }
};

export const PriceHistory = {
  async list(productId) {
    try {
      return await apiService.getPriceHistory(productId);
    } catch (error) {
      console.error(`Failed to fetch price history for product ${productId}:`, error);
      return [];
    }
  }
};

export const Alert = {
  async list(userId = null) {
    try {
      return await apiService.getAlerts(userId);
    } catch (error) {
      console.error('Failed to fetch alerts:', error);
      return [];
    }
  },

  async filter(query = {}, sort = null, limit = null) {
    try {
      // Build query parameters including sort and limit
      const queryParams = { ...query };
      
      if (sort) {
        queryParams.sort = sort;
      }
      
      if (limit) {
        queryParams.limit = limit;
      }
      
      // Use the API service get method directly for alerts with all parameters
      return await apiService.get('/alerts', queryParams);
    } catch (error) {
      console.error('Failed to filter alerts:', error);
      return [];
    }
  },

  async create(alertData) {
    return await apiService.createAlert(alertData);
  },

  async update(id, alertData) {
    return await apiService.updateAlert(id, alertData);
  },

  async delete(id) {
    await apiService.deleteAlert(id);
    return true;
  }
};

export const Review = {
  async list(productId = null) {
    try {
      return await apiService.getReviews(productId);
    } catch (error) {
      console.error('Failed to fetch reviews:', error);
      return [];
    }
  },

  async create(reviewData) {
    return await apiService.createReview(reviewData);
  }
};

export const Retailer = {
  async list() {
    try {
      return await apiService.getRetailers();
    } catch (error) {
      console.error('Failed to fetch retailers:', error);
      return [];
    }
  }
};

// Admin functions
export const Admin = {
  async getStats() {
    return await apiService.getStats();
  },

  async getAllUsers() {
    return await apiService.getAllUsers();
  },

  async getUserDetails(userId) {
    return await apiService.getUserDetails(userId);
  },

  async getAllProducts() {
    return await apiService.getAllProducts();
  },

  async getUserStats(userId = null) {
    return await apiService.getUserStats(userId);
  }
};

// File processing functions
export const FileProcessor = {
  async uploadReceipt(file) {
    return await apiService.uploadReceipt(file);
  },

  async extractProducts(fileId) {
    return await apiService.extractProductsFromReceipt(fileId);
  }
};