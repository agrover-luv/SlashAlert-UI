import authService from './authService.js';
import store from '../store/index.js';

class ApiService {
  constructor() {
    this.baseURL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5081';
    this.apiPrefix = import.meta.env.VITE_API_PREFIX || '/api';
  }

  // Get authentication headers
  getAuthHeaders() {
    // Get auth state from Redux store
    const authState = store.getState().auth;
    const { user, token } = authState;
    
    console.log('🔐 Getting auth headers from Redux...');
    console.log('👤 Current user:', user);
    console.log('🎫 Token:', token ? 'Present (length: ' + token.length + ')' : 'Not found');
    
    const headers = {
      'Content-Type': 'application/json',
    };

    if (token) {
      // Include bearer token for authentication
      headers['Authorization'] = `Bearer ${token}`;
      console.log('✅ Added Authorization header with bearer token');
    } else {
      console.log('❌ No token available, Authorization header not added');
    }

    if (user && user.email) {
      // Include user email and ID as additional headers for backward compatibility
      headers['X-User-Email'] = user.email;
      headers['X-User-ID'] = user.id;
      console.log('✅ Added user headers:', user.email, user.id);
    } else {
      console.log('❌ No user data available');
    }

    console.log('📤 Final headers:', headers);
    return headers;
  }

  // Build full URL for API endpoints
  buildUrl(endpoint) {
    const cleanEndpoint = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;
    return `${this.baseURL}${this.apiPrefix}${cleanEndpoint}`;
  }

  // Handle API responses and errors
  async handleResponse(response) {
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      
      if (response.status === 401) {
        // Unauthorized - redirect to login
        authService.signOut();
        throw new Error('Authentication required. Please log in again.');
      }
      
      if (response.status === 403) {
        throw new Error('Access denied. You do not have permission to perform this action.');
      }
      
      throw new Error(errorData.message || `HTTP ${response.status}: ${response.statusText}`);
    }

    const contentType = response.headers.get('content-type');
    if (contentType && contentType.includes('application/json')) {
      return await response.json();
    }
    
    return await response.text();
  }

  // Generic GET request
  async get(endpoint, queryParams = {}) {
    const url = new URL(this.buildUrl(endpoint));
    
    // Add query parameters
    Object.keys(queryParams).forEach(key => {
      if (queryParams[key] !== undefined && queryParams[key] !== null) {
        url.searchParams.append(key, queryParams[key]);
      }
    });

    const response = await fetch(url.toString(), {
      method: 'GET',
      headers: this.getAuthHeaders(),
    });

    return this.handleResponse(response);
  }

  // Generic POST request
  async post(endpoint, data = {}) {
    const response = await fetch(this.buildUrl(endpoint), {
      method: 'POST',
      headers: this.getAuthHeaders(),
      body: JSON.stringify(data),
    });

    return this.handleResponse(response);
  }

  // Generic PUT request
  async put(endpoint, data = {}) {
    const response = await fetch(this.buildUrl(endpoint), {
      method: 'PUT',
      headers: this.getAuthHeaders(),
      body: JSON.stringify(data),
    });

    return this.handleResponse(response);
  }

  // Generic DELETE request
  async delete(endpoint) {
    const response = await fetch(this.buildUrl(endpoint), {
      method: 'DELETE',
      headers: this.getAuthHeaders(),
    });

    return this.handleResponse(response);
  }

  // File upload with authentication
  async uploadFile(endpoint, file, additionalData = {}) {
    const formData = new FormData();
    formData.append('file', file);
    
    // Add additional data to form
    Object.keys(additionalData).forEach(key => {
      formData.append(key, additionalData[key]);
    });

    const headers = this.getAuthHeaders();
    // Remove Content-Type header for FormData - let browser set it with boundary
    delete headers['Content-Type'];

    const response = await fetch(this.buildUrl(endpoint), {
      method: 'POST',
      headers,
      body: formData,
    });

    return this.handleResponse(response);
  }

  // Check if API is available
  async healthCheck() {
    try {
      const response = await fetch(`${this.baseURL}/api/Health/heartbeat`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });
      
      if (response.ok) {
        return await response.json().catch(() => ({ status: 'ok' }));
      }
      
      return { status: 'error', message: `HTTP ${response.status}` };
    } catch (error) {
      return { status: 'error', message: error.message };
    }
  }

  // Wrapper methods for common API patterns

  // Products API (using plural form to match updated API)
  async getProducts(filters = {}) {
    return this.get('/products', filters);
  }

  async getProduct(id) {
    return this.get(`/products/${id}`);
  }

  async createProduct(productData) {
    return this.post('/products', productData);
  }

  async updateProduct(id, productData) {
    return this.put(`/products/${id}`, productData);
  }

  async deleteProduct(id) {
    return this.delete(`/products/${id}`);
  }

  // Price History API
  async getPriceHistory(productId) {
    return this.get(`/products/${productId}/price-history`);
  }

  // Alerts API
  async getAlerts(userId = null) {
    const params = userId ? { userId } : {};
    return this.get('/alerts', params);
  }

  async createAlert(alertData) {
    return this.post('/alerts', alertData);
  }

  async updateAlert(id, alertData) {
    return this.put(`/alerts/${id}`, alertData);
  }

  async deleteAlert(id) {
    return this.delete(`/alerts/${id}`);
  }

  // Reviews API
  async getReviews(productId = null) {
    const params = productId ? { productId } : {};
    return this.get('/reviews', params);
  }

  async createReview(reviewData) {
    return this.post('/reviews', reviewData);
  }

  // Retailers API
  async getRetailers() {
    return this.get('/retailers');
  }

  // User API
  async getCurrentUser() {
    // Instead of making an API call, get user data from Redux auth state
    const authState = store.getState().auth;
    const { user, token } = authState;
    
    if (user && token) {
      console.log('👤 Using current user from auth state:', user.email);
      
      // Return user data in a format consistent with what the API would return
      const currentUser = {
        id: user.id,
        email: user.email,
        name: user.full_name || user.given_name,
        given_name: user.given_name,
        family_name: user.family_name,
        picture: user.picture,
        email_verified: user.email_verified,
        role: user.role || 'user',
        subscription: {
          plan: user.subscription_status || 'free',
          status: 'active'
        },
        preferences: {
          email_notifications: true,
          price_alert_threshold: 10
        },
        created_at: new Date().toISOString() // We don't have this from JWT, so use current time
      };
      
      return currentUser;
    } else {
      throw new Error('User not authenticated. Please log in again.');
    }
  }

  async updateUserProfile(userData) {
    return this.put('/users/me', userData);
  }

  // File Processing API
  async uploadReceipt(file) {
    return this.uploadFile('/files/receipt', file);
  }

  async extractProductsFromReceipt(fileId) {
    return this.post('/files/extract-products', { fileId });
  }

  // Price Comparison API
  async comparePrice(productData) {
    return this.post('/products/compare-price', productData);
  }

  // Analytics/Stats API
  async getStats() {
    return this.get('/stats');
  }

  async getUserStats(userId = null) {
    const endpoint = userId ? `/stats/users/${userId}` : '/stats/users/me';
    return this.get(endpoint);
  }

  // Admin API
  async getAllUsers() {
    return this.get('/admin/users');
  }

  async getUserDetails(userId) {
    return this.get(`/admin/users/${userId}`);
  }

  async getAllProducts() {
    return this.get('/admin/products');
  }

  // AI/LLM Integration API
  async invokeLLM(prompt, options = {}) {
    return this.post('/ai/llm', {
      prompt,
      model: options.model || 'gpt-3.5-turbo',
      temperature: options.temperature || 0.7,
      max_tokens: options.max_tokens || 1000,
      ...options
    });
  }

  // Email API
  async sendEmail(emailData) {
    return this.post('/email/send', emailData);
  }

  // Image Generation API
  async generateImage(prompt, options = {}) {
    return this.post('/ai/image', {
      prompt,
      size: options.size || '1024x1024',
      quality: options.quality || 'standard',
      ...options
    });
  }
}

// Create a singleton instance
const apiService = new ApiService();

export default apiService;