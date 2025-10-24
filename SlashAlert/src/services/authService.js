// Google SSO Authentication Service
class AuthService {
  constructor() {
    this.googleAuth = null;
    this.currentUser = null;
    this.isInitialized = false;
    
    // Initialize Google Identity Services
    this.initializeGoogle();
  }

  async initializeGoogle() {
    return new Promise((resolve) => {
      // Load Google Identity Services script
      if (!window.google) {
        const script = document.createElement('script');
        script.src = 'https://accounts.google.com/gsi/client';
        script.async = true;
        script.defer = true;
        script.onload = () => {
          this.setupGoogleAuth();
          resolve();
        };
        document.head.appendChild(script);
      } else {
        this.setupGoogleAuth();
        resolve();
      }
    });
  }

  setupGoogleAuth() {
    if (window.google && window.google.accounts) {
      // Initialize Google Identity Services
      window.google.accounts.id.initialize({
        client_id: import.meta.env.VITE_GOOGLE_CLIENT_ID || 'your-google-client-id',
        callback: this.handleGoogleCallback.bind(this),
        auto_select: false,
        cancel_on_tap_outside: false,
      });
      
      this.isInitialized = true;
      
      // Check if user is already logged in (check localStorage)
      const storedUser = localStorage.getItem('slashalert_user');
      if (storedUser) {
        try {
          this.currentUser = JSON.parse(storedUser);
        } catch (error) {
          console.error('Error parsing stored user:', error);
          localStorage.removeItem('slashalert_user');
        }
      }
    }
  }

  handleGoogleCallback(response) {
    try {
      // Decode the JWT token to get user information
      const userInfo = this.parseJWT(response.credential);
      
      const user = {
        id: userInfo.sub,
        email: userInfo.email,
        full_name: userInfo.name,
        given_name: userInfo.given_name,
        family_name: userInfo.family_name,
        picture: userInfo.picture,
        email_verified: userInfo.email_verified,
        role: 'user', // Default role, can be updated based on your business logic
        subscription_status: 'free' // Default subscription status
      };
      
      this.currentUser = user;
      
      // Store user in localStorage
      localStorage.setItem('slashalert_user', JSON.stringify(user));
      
      // Trigger custom event for components to react to authentication
      window.dispatchEvent(new CustomEvent('authStateChanged', { 
        detail: { user, isAuthenticated: true } 
      }));
      
      // Check for stored redirect URL, otherwise go to dashboard
      const redirectUrl = localStorage.getItem('slashalert_redirect_after_login');
      localStorage.removeItem('slashalert_redirect_after_login');
      
      // Redirect to stored URL or default to dashboard
      window.location.href = redirectUrl || '/Dashboard';
      
    } catch (error) {
      console.error('Error handling Google callback:', error);
    }
  }

  parseJWT(token) {
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
  }

  async signIn() {
    if (!this.isInitialized) {
      await this.initializeGoogle();
    }
    
    if (window.google && window.google.accounts) {
      // Trigger Google Sign-In popup
      window.google.accounts.id.prompt();
    } else {
      console.error('Google Identity Services not loaded');
    }
  }

  async signInWithPopup() {
    if (!this.isInitialized) {
      await this.initializeGoogle();
    }
    
    return new Promise((resolve, reject) => {
      if (window.google && window.google.accounts) {
        // Use the One Tap API or trigger sign-in
        window.google.accounts.id.prompt((notification) => {
          if (notification.isNotDisplayed() || notification.isSkippedMoment()) {
            // Fallback to manual sign-in if one-tap doesn't work
            console.log('One-tap not available, user needs to click sign-in button');
            resolve(false);
          }
        });
      } else {
        reject(new Error('Google Identity Services not loaded'));
      }
    });
  }

  async signOut() {
    try {
      // Clear user data
      this.currentUser = null;
      localStorage.removeItem('slashalert_user');
      
      // Sign out from Google
      if (window.google && window.google.accounts) {
        window.google.accounts.id.disableAutoSelect();
      }
      
      // Trigger custom event
      window.dispatchEvent(new CustomEvent('authStateChanged', { 
        detail: { user: null, isAuthenticated: false } 
      }));
      
      return true;
    } catch (error) {
      console.error('Error signing out:', error);
      return false;
    }
  }

  getCurrentUser() {
    return this.currentUser;
  }

  isAuthenticated() {
    return !!this.currentUser;
  }

  // Method to render Google Sign-In button
  renderSignInButton(element, options = {}) {
    if (!this.isInitialized) {
      console.warn('Google auth not initialized yet');
      return;
    }
    
    if (window.google && window.google.accounts) {
      window.google.accounts.id.renderButton(element, {
        theme: options.theme || 'outline',
        size: options.size || 'large',
        type: options.type || 'standard',
        shape: options.shape || 'rectangular',
        text: options.text || 'sign_in_with',
        logo_alignment: options.logo_alignment || 'left',
        width: options.width || 250,
        ...options
      });
    }
  }
}

// Create a singleton instance
const authService = new AuthService();

export default authService;