class AuthManager {
  constructor() {
    // You need to replace this with a REAL Discord Client ID from https://discord.com/developers/applications
    this.discordClientId = '1410349295542079693'; // Your actual Discord client ID from the screenshot
    this.redirectUri = window.location.origin + '/auth/'; // Make sure this matches your Discord OAuth2 settings
    this.isInitialized = false;
    this.init();
  }

  init() {
    // Wait for DOM to be fully loaded
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', () => this.setupComponents());
    } else {
      this.setupComponents();
    }
  }

  setupComponents() {
    try {
      this.setupEventListeners();
      this.handleOAuthCallback();
      this.checkExistingAuth();
      this.isInitialized = true;
    } catch (error) {
      console.error('Failed to initialize AuthManager:', error);
      this.showNotification('Authentication system failed to initialize', 'error');
    }
  }

  setupEventListeners() {
    // Form switching with null checks
    const showSignupBtn = document.getElementById('showSignup');
    const showLoginBtn = document.getElementById('showLogin');
    
    if (showSignupBtn) {
      showSignupBtn.addEventListener('click', (e) => {
        e.preventDefault();
        this.switchToSignup();
      });
    }

    if (showLoginBtn) {
      showLoginBtn.addEventListener('click', (e) => {
        e.preventDefault();
        this.switchToLogin();
      });
    }

    // Password toggles
    this.setupPasswordToggles();

    // Form submissions
    const loginForm = document.getElementById('loginForm');
    const signupForm = document.getElementById('signupForm');

    if (loginForm) {
      loginForm.addEventListener('submit', (e) => {
        e.preventDefault();
        this.handleLogin(e.target);
      });
    }

    if (signupForm) {
      signupForm.addEventListener('submit', (e) => {
        e.preventDefault();
        this.handleSignup(e.target);
      });
    }

    // Social logins with null checks
    this.setupSocialLogins();

    // Password strength checker
    const signupPasswordInput = document.getElementById('signupPassword');
    if (signupPasswordInput) {
      signupPasswordInput.addEventListener('input', (e) => {
        this.checkPasswordStrength(e.target.value);
      });
    }

    // Success modal
    const closeModalBtn = document.getElementById('closeModal');
    if (closeModalBtn) {
      closeModalBtn.addEventListener('click', () => {
        this.closeSuccessModal();
      });
    }
  }

  setupPasswordToggles() {
    const passwordToggle = document.getElementById('passwordToggle');
    const signupPasswordToggle = document.getElementById('signupPasswordToggle');

    if (passwordToggle) {
      passwordToggle.addEventListener('click', (e) => {
        e.preventDefault();
        this.togglePassword('password', 'passwordToggle');
      });
    }

    if (signupPasswordToggle) {
      signupPasswordToggle.addEventListener('click', (e) => {
        e.preventDefault();
        this.togglePassword('signupPassword', 'signupPasswordToggle');
      });
    }
  }

  setupSocialLogins() {
    // Discord buttons
    document.querySelectorAll('.discord-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.preventDefault();
        this.handleDiscordLogin();
      });
    });

    // Google buttons
    document.querySelectorAll('.google-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.preventDefault();
        this.handleGoogleLogin();
      });
    });

    // Apple buttons
    document.querySelectorAll('.apple-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.preventDefault();
        this.handleAppleLogin();
      });
    });
  }

  togglePassword(inputId, toggleId) {
    const input = document.getElementById(inputId);
    const toggle = document.getElementById(toggleId);
    
    if (!input || !toggle) {
      console.warn(`Password toggle elements not found: ${inputId}, ${toggleId}`);
      return;
    }
    
    if (input.type === 'password') {
      input.type = 'text';
      toggle.innerHTML = `
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
          <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24" stroke="currentColor" stroke-width="2"/>
          <line x1="1" y1="1" x2="23" y2="23" stroke="currentColor" stroke-width="2"/>
        </svg>
      `;
    } else {
      input.type = 'password';
      toggle.innerHTML = `
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
          <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" stroke="currentColor" stroke-width="2" fill="none"/>
          <circle cx="12" cy="12" r="3" stroke="currentColor" stroke-width="2" fill="none"/>
        </svg>
      `;
    }
  }

  switchToSignup() {
    const loginCard = document.querySelector('.auth-card:not(.signup-card)');
    const signupCard = document.getElementById('signupCard');
    
    if (loginCard && signupCard) {
      loginCard.style.display = 'none';
      signupCard.style.display = 'block';
    }
  }

  switchToLogin() {
    const loginCard = document.querySelector('.auth-card:not(.signup-card)');
    const signupCard = document.getElementById('signupCard');
    
    if (loginCard && signupCard) {
      loginCard.style.display = 'block';
      signupCard.style.display = 'none';
    }
  }

  async handleLogin(form) {
    if (!form) return;

    const formData = new FormData(form);
    const email = formData.get('email');
    const password = formData.get('password');
    const remember = formData.get('remember');

    // Basic validation
    if (!email || !password) {
      this.showNotification('Please fill in all required fields', 'error');
      return;
    }

    this.showLoading('loginSpinner');

    try {
      // Simulate API call
      await this.simulateApiCall();
      
      // Store auth data
      const authData = {
        email,
        isAuthenticated: true,
        loginTime: new Date().toISOString(),
        remember: !!remember,
        authMethod: 'email'
      };

      const storage = remember ? localStorage : sessionStorage;
      storage.setItem('bluelock_auth', JSON.stringify(authData));

      this.showNotification('Login successful!', 'success');
      
      // Redirect to home page after a short delay
      setTimeout(() => {
        this.redirectToHome();
      }, 1500);

    } catch (error) {
      console.error('Login error:', error);
      this.showNotification('Login failed. Please check your credentials.', 'error');
    } finally {
      this.hideLoading('loginSpinner');
    }
  }

  async handleSignup(form) {
    if (!form) return;

    const formData = new FormData(form);
    const firstName = formData.get('firstName');
    const lastName = formData.get('lastName');
    const email = formData.get('signupEmail');
    const password = formData.get('signupPassword');
    const confirmPassword = formData.get('confirmPassword');
    const terms = formData.get('terms');

    // Validation
    if (!firstName || !lastName || !email || !password || !confirmPassword) {
      this.showNotification('Please fill in all required fields', 'error');
      return;
    }

    if (password !== confirmPassword) {
      this.showNotification('Passwords do not match!', 'error');
      return;
    }

    if (!terms) {
      this.showNotification('Please accept the terms of service.', 'error');
      return;
    }

    if (password.length < 8) {
      this.showNotification('Password must be at least 8 characters long.', 'error');
      return;
    }

    this.showLoading('signupSpinner');

    try {
      // Simulate API call
      await this.simulateApiCall();

      // Store auth data
      const authData = {
        firstName,
        lastName,
        email,
        isAuthenticated: true,
        loginTime: new Date().toISOString(),
        isNewUser: true,
        authMethod: 'email'
      };

      sessionStorage.setItem('bluelock_auth', JSON.stringify(authData));

      this.hideLoading('signupSpinner');
      this.showSuccessModal();

    } catch (error) {
      console.error('Signup error:', error);
      this.showNotification('Registration failed. Please try again.', 'error');
      this.hideLoading('signupSpinner');
    }
  }

  handleDiscordLogin() {
    try {
      this.showNotification('Connecting to Discord...', 'info');
      
      const discordAuthUrl = `https://discord.com/api/oauth2/authorize?` +
        `client_id=${this.discordClientId}&` +
        `redirect_uri=${encodeURIComponent(this.redirectUri)}&` +
        `response_type=code&` +
        `scope=identify%20email`;

      // Store auth method for callback handling
      sessionStorage.setItem('auth_method', 'discord');
      
      // Redirect to Discord OAuth
      window.location.href = discordAuthUrl;
    } catch (error) {
      console.error('Discord login error:', error);
      this.showNotification('Discord login failed to initialize', 'error');
    }
  }

  handleGoogleLogin() {
    this.showNotification('Google OAuth integration coming soon! Please use email or Discord login.', 'info');
    // No automatic authentication - just show the message
  }

  handleAppleLogin() {
    this.showNotification('Apple Sign-In integration coming soon! Please use email or Discord login.', 'info');
    // No automatic authentication - just show the message
  }

  handleOAuthCallback() {
    try {
      const urlParams = new URLSearchParams(window.location.search);
      const code = urlParams.get('code');
      const error = urlParams.get('error');
      const authMethod = sessionStorage.getItem('auth_method');

      if (error) {
        this.showNotification(`OAuth error: ${error}`, 'error');
        this.cleanupOAuthState();
        return;
      }

      if (code && authMethod === 'discord') {
        this.processDiscordCallback(code);
      }
    } catch (error) {
      console.error('OAuth callback error:', error);
      this.showNotification('Authentication callback failed', 'error');
      this.cleanupOAuthState();
    }
  }

  async processDiscordCallback(code) {
    this.showNotification('Processing Discord authentication...', 'info');

    try {
      // Exchange code for access token
      const tokenResponse = await fetch('https://discord.com/api/oauth2/token', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: new URLSearchParams({
          client_id: this.discordClientId,
          client_secret: 'iRYE5A3MOmTEbGKW5hMu-n3ibQJsbt7T', // You'll need to add this securely
          code: code,
          grant_type: 'authorization_code',
          redirect_uri: this.redirectUri,
        }),
      });

      if (!tokenResponse.ok) {
        throw new Error('Failed to exchange code for token');
      }

      const tokenData = await tokenResponse.json();

      // Fetch user data from Discord
      const userResponse = await fetch('https://discord.com/api/users/@me', {
        headers: {
          Authorization: `Bearer ${tokenData.access_token}`,
        },
      });

      if (!userResponse.ok) {
        throw new Error('Failed to fetch user data');
      }

      const discordUser = await userResponse.json();

      // Create user data object
      const userData = {
        id: discordUser.id,
        username: `${discordUser.username}#${discordUser.discriminator}`,
        email: discordUser.email,
        avatar: discordUser.avatar,
        provider: 'discord'
      };

      this.simulateOAuthSuccess('Discord', userData);

    } catch (error) {
      console.error('Discord callback error:', error);
      this.showNotification('Discord authentication failed.', 'error');
      this.cleanupOAuthState();
    } finally {
      sessionStorage.removeItem('auth_method');
    }
  }

  simulateOAuthSuccess(provider, userData) {
    const authData = {
      ...userData,
      isAuthenticated: true,
      loginTime: new Date().toISOString(),
      authMethod: provider
    };

    sessionStorage.setItem('bluelock_auth', JSON.stringify(authData));
    
    this.showNotification(`Successfully authenticated with ${provider}!`, 'success');
    
    // Clean up URL
    this.cleanupOAuthState();
    
    // Redirect to home page
    setTimeout(() => {
      this.redirectToHome();
    }, 1500);
  }

  cleanupOAuthState() {
    // Remove OAuth parameters from URL
    if (window.history && window.history.replaceState) {
      const cleanUrl = window.location.origin + window.location.pathname;
      window.history.replaceState({}, document.title, cleanUrl);
    }
    sessionStorage.removeItem('auth_method');
  }

  checkPasswordStrength(password) {
    const strengthBar = document.querySelector('.strength-fill');
    const strengthText = document.getElementById('strengthLevel');
    
    if (!strengthBar || !strengthText) return;

    let strength = 0;
    let level = 'Weak';
    let color = '#ef4444';

    if (password.length >= 8) strength += 1;
    if (/[A-Z]/.test(password)) strength += 1;
    if (/[a-z]/.test(password)) strength += 1;
    if (/[0-9]/.test(password)) strength += 1;
    if (/[^A-Za-z0-9]/.test(password)) strength += 1;

    switch (strength) {
      case 0:
      case 1:
        level = 'Weak';
        color = '#ef4444';
        break;
      case 2:
      case 3:
        level = 'Medium';
        color = '#f59e0b';
        break;
      case 4:
      case 5:
        level = 'Strong';
        color = '#10b981';
        break;
    }

    strengthBar.style.width = `${(strength / 5) * 100}%`;
    strengthBar.style.background = color;
    strengthText.textContent = level;
    strengthText.style.color = color;
  }

  showLoading(spinnerId) {
    const spinner = document.getElementById(spinnerId);
    if (!spinner) return;

    const button = spinner.closest('button');
    const buttonText = button?.querySelector('.button-text');

    if (spinner && button && buttonText) {
      buttonText.style.opacity = '0';
      spinner.style.display = 'block';
      button.disabled = true;
    }
  }

  hideLoading(spinnerId) {
    const spinner = document.getElementById(spinnerId);
    if (!spinner) return;

    const button = spinner.closest('button');
    const buttonText = button?.querySelector('.button-text');

    if (spinner && button && buttonText) {
      buttonText.style.opacity = '1';
      spinner.style.display = 'none';
      button.disabled = false;
    }
  }

  showSuccessModal() {
    const modal = document.getElementById('successModal');
    if (modal) {
      modal.style.display = 'flex';
    }
  }

  closeSuccessModal() {
    const modal = document.getElementById('successModal');
    if (modal) {
      modal.style.display = 'none';
    }
    this.redirectToHome();
  }

  redirectToHome() {
    try {
      window.location.href = '../dashboard/';
    } catch (error) {
      console.error('Redirect error:', error);
      this.showNotification('Redirect failed. Please navigate manually.', 'error');
    }
  }

  checkExistingAuth() {
    try {
      const authData = localStorage.getItem('bluelock_auth') || sessionStorage.getItem('bluelock_auth');
      
      if (authData) {
        const parsed = JSON.parse(authData);
        if (parsed.isAuthenticated) {
          // User is already logged in, redirect to home page
          this.redirectToHome();
        }
      }
    } catch (error) {
      console.error('Auth check error:', error);
      // Invalid auth data, clear it
      localStorage.removeItem('bluelock_auth');
      sessionStorage.removeItem('bluelock_auth');
    }
  }

  showNotification(message, type = 'info') {
    try {
      // Remove existing notifications
      document.querySelectorAll('.auth-notification').forEach(n => n.remove());

      // Create notification element
      const notification = document.createElement('div');
      notification.className = `auth-notification notification-${type}`;
      notification.innerHTML = `
        <div class="notification-content">
          <div class="notification-icon">
            ${this.getNotificationIcon(type)}
          </div>
          <span class="notification-message">${message}</span>
          <button class="notification-close">×</button>
        </div>
      `;

      // Style the notification
      notification.style.cssText = `
        position: fixed;
        top: 100px;
        right: 20px;
        background: ${type === 'success' ? 'rgba(34, 197, 94, 0.9)' : 
                     type === 'error' ? 'rgba(239, 68, 68, 0.9)' : 
                     'rgba(59, 130, 246, 0.9)'};
        color: white;
        padding: 16px 20px;
        border-radius: 12px;
        backdrop-filter: blur(10px);
        z-index: 10000;
        animation: slideIn 0.3s ease;
        max-width: 400px;
        box-shadow: 0 10px 25px rgba(0, 0, 0, 0.2);
      `;

      document.body.appendChild(notification);

      // Auto remove after 4 seconds
      const timeout = setTimeout(() => {
        if (notification.parentNode) {
          notification.remove();
        }
      }, 4000);

      // Manual close
      const closeBtn = notification.querySelector('.notification-close');
      if (closeBtn) {
        closeBtn.onclick = () => {
          clearTimeout(timeout);
          notification.style.animation = 'slideOut 0.3s ease';
          setTimeout(() => {
            if (notification.parentNode) {
              notification.remove();
            }
          }, 300);
        };
      }
    } catch (error) {
      console.error('Notification error:', error);
      // Fallback to alert if notification fails
      alert(message);
    }
  }

  getNotificationIcon(type) {
    const icons = {
      success: '<svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor"><path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>',
      error: '<svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor"><path d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>',
      info: '<svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor"><path d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>'
    };
    return icons[type] || icons.info;
  }

  async simulateApiCall() {
    // Simulate network delay
    return new Promise(resolve => setTimeout(resolve, 1000 + Math.random() * 1000));
  }
}

// Add notification animations if not already present
if (!document.getElementById('auth-notification-styles')) {
  const notificationStyles = document.createElement('style');
  notificationStyles.id = 'auth-notification-styles';
  notificationStyles.textContent = `
    @keyframes slideIn {
      from { transform: translateX(100%); opacity: 0; }
      to { transform: translateX(0); opacity: 1; }
    }
    
    @keyframes slideOut {
      from { transform: translateX(0); opacity: 1; }
      to { transform: translateX(100%); opacity: 0; }
    }
    
    .notification-content {
      display: flex;
      align-items: center;
      gap: 12px;
    }
    
    .notification-close {
      background: none;
      border: none;
      color: white;
      font-size: 18px;
      cursor: pointer;
      padding: 0;
      width: 20px;
      height: 20px;
      display: flex;
      align-items: center;
      justify-content: center;
      border-radius: 4px;
      transition: background 0.2s ease;
    }
    
    .notification-close:hover {
      background: rgba(255, 255, 255, 0.2);
    }
  `;
  document.head.appendChild(notificationStyles);
}

// Initialize auth manager when page loads
let authManager;
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    authManager = new AuthManager();
  });
} else {
  authManager = new AuthManager();
}

// Global error handler
window.addEventListener('error', (event) => {
  console.error('Global error:', event.error);
  if (authManager && authManager.isInitialized) {
    authManager.showNotification('An unexpected error occurred', 'error');
  }
});

document.addEventListener('DOMContentLoaded', function() {
  // Elements
  const loginForm = document.getElementById('loginForm');
  const signupForm = document.getElementById('signupForm');
  const loginCard = document.getElementById('loginCard');
  const signupCard = document.getElementById('signupCard');
  const showSignupLink = document.getElementById('showSignup');
  const showLoginLink = document.getElementById('showLogin');
  const passwordToggle = document.getElementById('passwordToggle');
  const signupPasswordToggle = document.getElementById('signupPasswordToggle');
  const passwordInput = document.getElementById('password');
  const signupPasswordInput = document.getElementById('signupPassword');
  const confirmPasswordInput = document.getElementById('confirmPassword');
  const strengthFill = document.getElementById('strengthFill');
  const strengthLevel = document.getElementById('strengthLevel');
  const successModal = document.getElementById('successModal');
  const errorModal = document.getElementById('errorModal');
  const closeModalBtn = document.getElementById('closeModal');
  const closeErrorModalBtn = document.getElementById('closeErrorModal');
  
  // Password requirement elements
  const reqLength = document.getElementById('reqLength');
  const reqUppercase = document.getElementById('reqUppercase');
  const reqLowercase = document.getElementById('reqLowercase');
  const reqNumber = document.getElementById('reqNumber');
  const reqSpecial = document.getElementById('reqSpecial');
  
  // Fix password toggle functionality
  if (passwordToggle) {
    passwordToggle.addEventListener('click', function() {
      const type = passwordInput.getAttribute('type') === 'password' ? 'text' : 'password';
      passwordInput.setAttribute('type', type);
      
      // Update icon based on visibility
      updateToggleIcon(passwordToggle, type);
    });
  }
  
  if (signupPasswordToggle) {
    signupPasswordToggle.addEventListener('click', function() {
      const type = signupPasswordInput.getAttribute('type') === 'password' ? 'text' : 'password';
      signupPasswordInput.setAttribute('type', type);
      
      // Update icon based on visibility
      updateToggleIcon(signupPasswordToggle, type);
    });
  }
  
  function updateToggleIcon(button, type) {
    if (type === 'text') {
      button.innerHTML = `
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"></path>
          <line x1="1" y1="1" x2="23" y2="23"></line>
        </svg>
      `;
    } else {
      button.innerHTML = `
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
          <circle cx="12" cy="12" r="3"></circle>
        </svg>
      `;
    }
  }

  // Toggle between login and signup forms with animation
  showSignupLink.addEventListener('click', function(e) {
    e.preventDefault();
    loginCard.style.animation = 'fadeOut 0.4s forwards';
    setTimeout(() => {
      loginCard.style.display = 'none';
      signupCard.style.display = 'block';
      signupCard.style.animation = 'fadeIn 0.4s forwards';
    }, 300);
  });

  showLoginLink.addEventListener('click', function(e) {
    e.preventDefault();
    signupCard.style.animation = 'fadeOut 0.4s forwards';
    setTimeout(() => {
      signupCard.style.display = 'none';
      loginCard.style.display = 'block';
      loginCard.style.animation = 'fadeIn 0.4s forwards';
    }, 300);
  });

  // Password strength meter
  if (signupPasswordInput) {
    signupPasswordInput.addEventListener('input', checkPasswordStrength);
  }

  function checkPasswordStrength() {
    const password = signupPasswordInput.value;
    let strength = 0;
    
    // Update visual requirements
    const hasLength = password.length >= 8;
    const hasUpperCase = /[A-Z]/.test(password);
    const hasLowerCase = /[a-z]/.test(password);
    const hasNumbers = /\d/.test(password);
    const hasSpecialChars = /[!@#$%^&*(),.?":{}|<>]/.test(password);
    
    updateRequirement(reqLength, hasLength);
    updateRequirement(reqUppercase, hasUpperCase);
    updateRequirement(reqLowercase, hasLowerCase);
    updateRequirement(reqNumber, hasNumbers);
    updateRequirement(reqSpecial, hasSpecialChars);
    
    // Calculate strength
    if (hasLength) strength += 1;
    if (hasUpperCase) strength += 1;
    if (hasLowerCase) strength += 1;
    if (hasNumbers) strength += 1;
    if (hasSpecialChars) strength += 1;
    
    // Update strength meter
    let percentage = (strength / 5) * 100;
    let color, text;
    
    if (percentage <= 20) {
      color = '#ff3b30';
      text = 'Very Weak';
    } else if (percentage <= 40) {
      color = '#ff9500';
      text = 'Weak';
    } else if (percentage <= 60) {
      color = '#ffcc00';
      text = 'Medium';
    } else if (percentage <= 80) {
      color = '#34c759';
      text = 'Strong';
    } else {
      color = '#30d158';
      text = 'Very Strong';
    }
    
    strengthFill.style.width = `${percentage}%`;
    strengthFill.style.backgroundColor = color;
    strengthLevel.textContent = text;
    strengthLevel.style.color = color;
  }

  function updateRequirement(element, isValid) {
    if (element) {
      if (isValid) {
        element.classList.add('valid');
      } else {
        element.classList.remove('valid');
      }
    }
  }

  // Form validation
  if (loginForm) {
    loginForm.addEventListener('submit', function(e) {
      e.preventDefault();
      
      // Simple validation
      const email = document.getElementById('email').value;
      const password = document.getElementById('password').value;
      
      if (!validateEmail(email)) {
        showValidationError(document.getElementById('email'), 'Please enter a valid email');
        return;
      }
      
      if (password.length < 1) {
        showValidationError(document.getElementById('password'), 'Password is required');
        return;
      }
      
      // Show loading state
      showLoading('loginSpinner');
      
      // Simulate API call
      setTimeout(() => {
        // Hide loading state
        hideLoading('loginSpinner');
        
        // For demo - would check login with backend in production
        window.location.href = '../dashboard/';
      }, 1500);
    });
  }

  if (signupForm) {
    signupForm.addEventListener('submit', function(e) {
      e.preventDefault();
      
      // Get form values
      const firstName = document.getElementById('firstName').value;
      const lastName = document.getElementById('lastName').value;
      const email = document.getElementById('signupEmail').value;
      const password = document.getElementById('signupPassword').value;
      const confirmPassword = document.getElementById('confirmPassword').value;
      const termsChecked = document.getElementById('terms').checked;
      
      // Validate fields
      let isValid = true;
      
      if (firstName.length < 2) {
        showValidationError(document.getElementById('firstName'), 'First name is required');
        isValid = false;
      }
      
      if (lastName.length < 2) {
        showValidationError(document.getElementById('lastName'), 'Last name is required');
        isValid = false;
      }
      
      if (!validateEmail(email)) {
        showValidationError(document.getElementById('signupEmail'), 'Please enter a valid email');
        isValid = false;
      }
      
      if (password.length < 8) {
        showValidationError(document.getElementById('signupPassword'), 'Password must be at least 8 characters');
        isValid = false;
      }
      
      if (password !== confirmPassword) {
        showValidationError(document.getElementById('confirmPassword'), 'Passwords do not match');
        isValid = false;
      }
      
      if (!termsChecked) {
        document.getElementById('termsMessage').textContent = 'You must agree to the terms';
        isValid = false;
      }
      
      if (!isValid) return;
      
      // Show loading state
      showLoading('signupSpinner');
      
      // Simulate API call
      setTimeout(() => {
        // Hide loading state
        hideLoading('signupSpinner');
        
        // Show success modal
        showSuccessModal();
      }, 1500);
    });
  }
  
  // Helper functions
  function validateEmail(email) {
    const re = /^(([^<>()\[\]\\.,;:\s@"]+(\.[^<>()\[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
    return re.test(String(email).toLowerCase());
  }
  
  function showValidationError(input, message) {
    const parent = input.parentElement.parentElement;
    const messageElement = parent.querySelector('.validation-message');
    if (messageElement) {
      messageElement.textContent = message;
    }
    input.classList.add('error');
    
    input.addEventListener('input', function clearError() {
      if (messageElement) {
        messageElement.textContent = '';
      }
      input.classList.remove('error');
      input.removeEventListener('input', clearError);
    });
  }
  
  function showLoading(spinnerId) {
    const spinner = document.getElementById(spinnerId);
    if (spinner) {
      spinner.parentElement.classList.add('loading');
    }
  }
  
  function hideLoading(spinnerId) {
    const spinner = document.getElementById(spinnerId);
    if (spinner) {
      spinner.parentElement.classList.remove('loading');
    }
  }
  
  function showSuccessModal() {
    if (successModal) {
      successModal.style.display = 'flex';
      successModal.classList.add('active');
    }
  }
  
  function showErrorModal(message) {
    const errorMessage = document.getElementById('errorMessage');
    if (errorMessage) {
      errorMessage.textContent = message;
    }
    if (errorModal) {
      errorModal.style.display = 'flex';
      errorModal.classList.add('active');
    }
  }
  
  // Modal buttons
  if (closeModalBtn) {
    closeModalBtn.addEventListener('click', function() {
      successModal.classList.remove('active');
      setTimeout(() => {
        successModal.style.display = 'none';
        window.location.href = '../dashboard/';
      }, 300);
    });
  }
  
  if (closeErrorModalBtn) {
    closeErrorModalBtn.addEventListener('click', function() {
      errorModal.classList.remove('active');
      setTimeout(() => {
        errorModal.style.display = 'none';
      }, 300);
    });
  }
  
  // Form input validation styling
  const formInputs = document.querySelectorAll('.form-input');
  formInputs.forEach(input => {
    input.addEventListener('blur', function() {
      if (this.value) {
        this.classList.add('filled');
        
        // For email validation
        if (this.type === 'email' && validateEmail(this.value)) {
          this.classList.add('valid');
        } else if (this.type === 'email') {
          this.classList.remove('valid');
        }
      } else {
        this.classList.remove('filled');
      }
    });
  });
});
