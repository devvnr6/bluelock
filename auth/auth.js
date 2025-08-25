// DOM Elements
const loginForm = document.getElementById('loginForm');
const signupForm = document.getElementById('signupForm');
const loginCard = document.querySelector('.auth-card:not(.signup-card)');
const signupCard = document.getElementById('signupCard');
const showSignupBtn = document.getElementById('showSignup');
const showLoginBtn = document.getElementById('showLogin');
const passwordToggle = document.getElementById('passwordToggle');
const signupPasswordToggle = document.getElementById('signupPasswordToggle');
const passwordInput = document.getElementById('password');
const signupPasswordInput = document.getElementById('signupPassword');
const confirmPasswordInput = document.getElementById('confirmPassword');
const passwordStrength = document.getElementById('passwordStrength');
const strengthLevel = document.getElementById('strengthLevel');
const strengthFill = document.querySelector('.strength-fill');
const successModal = document.getElementById('successModal');
const closeModalBtn = document.getElementById('closeModal');

// Form switching
showSignupBtn.addEventListener('click', (e) => {
  e.preventDefault();
  switchToSignup();
});

showLoginBtn.addEventListener('click', (e) => {
  e.preventDefault();
  switchToLogin();
});

function switchToSignup() {
  loginCard.style.display = 'none';
  signupCard.style.display = 'block';
  signupCard.style.animation = 'slideUp 0.6s ease-out';
}

function switchToLogin() {
  signupCard.style.display = 'none';
  loginCard.style.display = 'block';
  loginCard.style.animation = 'slideUp 0.6s ease-out';
}

// Password visibility toggle
passwordToggle.addEventListener('click', () => {
  togglePasswordVisibility(passwordInput, passwordToggle);
});

signupPasswordToggle.addEventListener('click', () => {
  togglePasswordVisibility(signupPasswordInput, signupPasswordToggle);
});

function togglePasswordVisibility(input, toggle) {
  const isPassword = input.type === 'password';
  input.type = isPassword ? 'text' : 'password';
  
  const svg = toggle.querySelector('svg');
  if (isPassword) {
    // Show eye-off icon
    svg.innerHTML = `
      <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24" stroke="currentColor" stroke-width="2" fill="none"/>
      <line x1="1" y1="1" x2="23" y2="23" stroke="currentColor" stroke-width="2"/>
    `;
  } else {
    // Show eye icon
    svg.innerHTML = `
      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" stroke="currentColor" stroke-width="2" fill="none"/>
      <circle cx="12" cy="12" r="3" stroke="currentColor" stroke-width="2" fill="none"/>
    `;
  }
}

// Password strength checker
signupPasswordInput.addEventListener('input', (e) => {
  const password = e.target.value;
  const strength = calculatePasswordStrength(password);
  updatePasswordStrength(strength);
});

function calculatePasswordStrength(password) {
  let score = 0;
  let feedback = [];

  if (password.length === 0) {
    return { score: 0, feedback: [], level: 'None' };
  }

  // Length check
  if (password.length >= 8) score += 1;
  else feedback.push('At least 8 characters');

  // Lowercase check
  if (/[a-z]/.test(password)) score += 1;
  else feedback.push('One lowercase letter');

  // Uppercase check
  if (/[A-Z]/.test(password)) score += 1;
  else feedback.push('One uppercase letter');

  // Number check
  if (/\d/.test(password)) score += 1;
  else feedback.push('One number');

  // Special character check
  if (/[!@#$%^&*(),.?":{}|<>]/.test(password)) score += 1;
  else feedback.push('One special character');

  // Determine level
  let level;
  if (score <= 1) level = 'Very Weak';
  else if (score === 2) level = 'Weak';
  else if (score === 3) level = 'Fair';
  else if (score === 4) level = 'Good';
  else level = 'Strong';

  return { score, feedback, level };
}

function updatePasswordStrength(strength) {
  const percentage = (strength.score / 5) * 100;
  strengthFill.style.width = `${percentage}%`;
  strengthLevel.textContent = strength.level;
  
  // Update color based on strength
  if (strength.score <= 1) {
    strengthFill.style.background = '#ff3b30';
  } else if (strength.score === 2) {
    strengthFill.style.background = '#ff9500';
  } else if (strength.score === 3) {
    strengthFill.style.background = '#ffcc00';
  } else if (strength.score === 4) {
    strengthFill.style.background = '#30d158';
  } else {
    strengthFill.style.background = 'linear-gradient(90deg, #30d158, #007aff)';
  }
}

// Form validation
function validateEmail(email) {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

function validateForm(form) {
  const inputs = form.querySelectorAll('.form-input[required]');
  let isValid = true;
  
  inputs.forEach(input => {
    const value = input.value.trim();
    removeValidationMessages(input);
    
    if (!value) {
      showError(input, 'This field is required');
      isValid = false;
    } else if (input.type === 'email' && !validateEmail(value)) {
      showError(input, 'Please enter a valid email address');
      isValid = false;
    } else if (input.id === 'signupPassword') {
      const strength = calculatePasswordStrength(value);
      if (strength.score < 3) {
        showError(input, 'Password is too weak');
        isValid = false;
      } else {
        showSuccess(input, 'Good password');
      }
    } else if (input.id === 'confirmPassword') {
      const password = signupPasswordInput.value;
      if (value !== password) {
        showError(input, 'Passwords do not match');
        isValid = false;
      } else {
        showSuccess(input, 'Passwords match');
      }
    } else {
      showSuccess(input, '');
    }
  });
  
  // Check terms checkbox for signup
  if (form.id === 'signupForm') {
    const termsCheckbox = form.querySelector('#terms');
    if (!termsCheckbox.checked) {
      showError(termsCheckbox.closest('.form-group'), 'You must agree to the terms and conditions');
      isValid = false;
    }
  }
  
  return isValid;
}

function showError(input, message) {
  input.classList.add('error');
  input.classList.remove('success');
  
  if (message) {
    const errorDiv = document.createElement('div');
    errorDiv.className = 'error-message';
    errorDiv.textContent = message;
    
    const parent = input.closest('.form-group');
    parent.appendChild(errorDiv);
  }
}

function showSuccess(input, message) {
  input.classList.add('success');
  input.classList.remove('error');
  
  if (message) {
    const successDiv = document.createElement('div');
    successDiv.className = 'success-message';
    successDiv.textContent = message;
    
    const parent = input.closest('.form-group');
    parent.appendChild(successDiv);
  }
}

function removeValidationMessages(input) {
  const parent = input.closest('.form-group');
  const existingMessages = parent.querySelectorAll('.error-message, .success-message');
  existingMessages.forEach(msg => msg.remove());
  
  input.classList.remove('error', 'success');
}

// Loading states
function setLoadingState(button, isLoading) {
  const spinner = button.querySelector('.loading-spinner');
  const text = button.querySelector('.button-text');
  
  if (isLoading) {
    button.classList.add('loading');
    button.disabled = true;
    spinner.style.display = 'block';
    text.style.opacity = '0';
  } else {
    button.classList.remove('loading');
    button.disabled = false;
    spinner.style.display = 'none';
    text.style.opacity = '1';
  }
}

// Form submissions
loginForm.addEventListener('submit', async (e) => {
  e.preventDefault();
  
  if (!validateForm(loginForm)) {
    return;
  }
  
  const submitBtn = loginForm.querySelector('.btn-primary');
  setLoadingState(submitBtn, true);
  
  // Simulate API call
  try {
    await simulateAPICall();
    
    // Success - redirect or show success message
    console.log('Login successful');
    showNotification('Login successful! Redirecting...', 'success');
    
    // Simulate redirect after delay
    setTimeout(() => {
      window.location.href = '../'; // Redirect to home page
    }, 2000);
    
  } catch (error) {
    console.error('Login failed:', error);
    showNotification('Login failed. Please check your credentials.', 'error');
  } finally {
    setLoadingState(submitBtn, false);
  }
});

signupForm.addEventListener('submit', async (e) => {
  e.preventDefault();
  
  if (!validateForm(signupForm)) {
    return;
  }
  
  const submitBtn = signupForm.querySelector('.btn-primary');
  setLoadingState(submitBtn, true);
  
  // Simulate API call
  try {
    await simulateAPICall();
    
    // Success - show modal
    showSuccessModal();
    
  } catch (error) {
    console.error('Signup failed:', error);
    showNotification('Signup failed. Please try again.', 'error');
  } finally {
    setLoadingState(submitBtn, false);
  }
});

// Success modal
function showSuccessModal() {
  successModal.style.display = 'flex';
  document.body.style.overflow = 'hidden';
}

function hideSuccessModal() {
  successModal.style.display = 'none';
  document.body.style.overflow = 'auto';
}

closeModalBtn.addEventListener('click', () => {
  hideSuccessModal();
  // Redirect to main page
  window.location.href = '../';
});

// Click outside modal to close
successModal.addEventListener('click', (e) => {
  if (e.target === successModal) {
    hideSuccessModal();
  }
});

// Social login handlers
document.querySelectorAll('.btn-social').forEach(btn => {
  btn.addEventListener('click', (e) => {
    e.preventDefault();
    let provider;
    
    if (btn.classList.contains('discord-btn')) {
      provider = 'Discord';
    } else if (btn.classList.contains('google-btn')) {
      provider = 'Google';
    } else if (btn.classList.contains('apple-btn')) {
      provider = 'Apple';
    }
    
    setLoadingState(btn, true);
    
    // Simulate social auth
    setTimeout(() => {
      setLoadingState(btn, false);
      showNotification(`${provider} authentication would be handled here.`, 'info');
    }, 2000);
  });
});

// Utility functions
function simulateAPICall() {
  return new Promise((resolve) => {
    // Simulate network delay
    setTimeout(() => {
      resolve();
    }, 2000);
  });
}

function showNotification(message, type = 'info') {
  // Create notification element
  const notification = document.createElement('div');
  notification.className = `notification notification-${type}`;
  notification.innerHTML = `
    <div class="notification-content">
      <span class="notification-message">${message}</span>
      <button class="notification-close">&times;</button>
    </div>
  `;
  
  // Add to body
  document.body.appendChild(notification);
  
  // Show notification
  setTimeout(() => {
    notification.classList.add('show');
  }, 100);
  
  // Auto remove after 5 seconds
  setTimeout(() => {
    removeNotification(notification);
  }, 5000);
  
  // Close button handler
  notification.querySelector('.notification-close').addEventListener('click', () => {
    removeNotification(notification);
  });
}

function removeNotification(notification) {
  notification.classList.remove('show');
  setTimeout(() => {
    if (notification.parentNode) {
      notification.parentNode.removeChild(notification);
    }
  }, 300);
}

// Real-time validation
document.querySelectorAll('.form-input').forEach(input => {
  input.addEventListener('blur', () => {
    if (input.value.trim()) {
      validateSingleField(input);
    }
  });
  
  input.addEventListener('input', () => {
    // Clear error state on input
    if (input.classList.contains('error')) {
      removeValidationMessages(input);
    }
  });
});

function validateSingleField(input) {
  const value = input.value.trim();
  removeValidationMessages(input);
  
  if (input.type === 'email' && value && !validateEmail(value)) {
    showError(input, 'Please enter a valid email address');
  } else if (input.id === 'confirmPassword' && value) {
    const password = signupPasswordInput.value;
    if (value !== password) {
      showError(input, 'Passwords do not match');
    } else {
      showSuccess(input, 'Passwords match');
    }
  } else if (value) {
    showSuccess(input, '');
  }
}

// Keyboard navigation improvements
document.addEventListener('keydown', (e) => {
  // ESC key to close modal
  if (e.key === 'Escape' && successModal.style.display === 'flex') {
    hideSuccessModal();
  }
  
  // Enter key in forms
  if (e.key === 'Enter' && e.target.classList.contains('form-input')) {
    const form = e.target.closest('form');
    const inputs = Array.from(form.querySelectorAll('.form-input'));
    const currentIndex = inputs.indexOf(e.target);
    
    if (currentIndex < inputs.length - 1) {
      // Focus next input
      e.preventDefault();
      inputs[currentIndex + 1].focus();
    }
  }
});

// Initialize
document.addEventListener('DOMContentLoaded', () => {
  // Focus first input
  const firstInput = document.querySelector('.form-input');
  if (firstInput) {
    firstInput.focus();
  }
  
  // Add notification styles if not already present
  if (!document.querySelector('#notification-styles')) {
    const styles = document.createElement('style');
    styles.id = 'notification-styles';
    styles.textContent = `
      .notification {
        position: fixed;
        top: 20px;
        right: 20px;
        max-width: 400px;
        background: white;
        border-radius: 12px;
        box-shadow: 0 10px 30px rgba(0, 0, 0, 0.2);
        border-left: 4px solid #007aff;
        z-index: 3000;
        transform: translateX(100%);
        transition: transform 0.3s ease;
      }
      
      .notification.show {
        transform: translateX(0);
      }
      
      .notification-success {
        border-left-color: #30d158;
      }
      
      .notification-error {
        border-left-color: #ff3b30;
      }
      
      .notification-info {
        border-left-color: #007aff;
      }
      
      .notification-content {
        padding: 1rem;
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 1rem;
      }
      
      .notification-message {
        flex: 1;
        font-size: 0.875rem;
        color: #333;
      }
      
      .notification-close {
        background: none;
        border: none;
        font-size: 1.25rem;
        color: #666;
        cursor: pointer;
        padding: 0;
        width: 24px;
        height: 24px;
        display: flex;
        align-items: center;
        justify-content: center;
      }
      
      .notification-close:hover {
        color: #333;
      }
    `;
    document.head.appendChild(styles);
  }
});
