// Dashboard functionality
document.addEventListener('DOMContentLoaded', function() {
  // Check if user is authenticated
  checkAuthentication();
  
  // Initialize dashboard components
  loadUserInfo();
  loadProducts();
  loadLicenses();
  loadDownloads();
  loadActivity();
  
  // Set up event listeners
  setupEventListeners();
  
  // Update dashboard stats
  updateDashboardStats();
});

// Check if user is authenticated
function checkAuthentication() {
  const authData = localStorage.getItem('bluelock_auth') || sessionStorage.getItem('bluelock_auth');
  
  if (!authData) {
    // User is not authenticated, redirect to login
    showNotification('Please sign in to access your dashboard', 'error');
    setTimeout(() => {
      window.location.href = '../auth/';
    }, 2000);
    return;
  }
  
  try {
    const userData = JSON.parse(authData);
    if (!userData.isAuthenticated) {
      // User session is invalid
      showNotification('Your session has expired. Please sign in again.', 'error');
      setTimeout(() => {
        window.location.href = '../auth/';
      }, 2000);
    }
  } catch (error) {
    console.error('Error parsing auth data:', error);
    showNotification('Authentication error. Please sign in again.', 'error');
    setTimeout(() => {
      window.location.href = '../auth/';
    }, 2000);
  }
}

// Load user information
function loadUserInfo() {
  try {
    const authData = localStorage.getItem('bluelock_auth') || sessionStorage.getItem('bluelock_auth');
    if (!authData) return;
    
    const userData = JSON.parse(authData);
    
    // Set user name
    const userNameElement = document.getElementById('userName');
    if (userNameElement) {
      if (userData.firstName && userData.lastName) {
        userNameElement.textContent = `${userData.firstName} ${userData.lastName}`;
      } else if (userData.username) {
        userNameElement.textContent = userData.username;
      } else {
        userNameElement.textContent = 'User';
      }
    } else {
      // If element not found, try to create account info section
      createAccountInfoSection();
    }
    
    // Set user email
    const userEmailElement = document.getElementById('userEmail');
    if (userEmailElement && userData.email) {
      userEmailElement.textContent = userData.email;
    }
    
    // Set member since date
    const memberSinceElement = document.getElementById('memberSince');
    if (memberSinceElement && userData.loginTime) {
      const loginDate = new Date(userData.loginTime);
      memberSinceElement.textContent = loginDate.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      });
    } else if (memberSinceElement) {
      // If no login time, set current date
      const currentDate = new Date();
      memberSinceElement.textContent = currentDate.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      });
    }
    
    // Set subscription plan (simulate data)
    const subscriptionPlanElement = document.getElementById('subscriptionPlan');
    if (subscriptionPlanElement) {
      // Simulate subscription data - use Quarterly by default for consistency
      subscriptionPlanElement.textContent = 'Quarterly';
    }
    
    // Set billing cycle (simulate data)
    const billingCycleElement = document.getElementById('billingCycle');
    if (billingCycleElement) {
      // Set to quarterly cycle
      billingCycleElement.textContent = 'Quarterly (Next payment: Dec 11, 2025)';
    }
  } catch (error) {
    console.error('Error loading user info:', error);
    createAccountInfoSection();
  }
}

// Create account information section if it doesn't exist
function createAccountInfoSection() {
  const accountPanel = document.querySelector('.account-panel .panel-content');
  if (!accountPanel) return;
  
  // Check if account details exist
  if (!document.querySelector('.account-details')) {
    const accountDetails = document.createElement('div');
    accountDetails.className = 'account-details';
    
    // Create account fields
    const fields = [
      { id: 'userName', label: 'Name', value: 'John Doe' },
      { id: 'userEmail', label: 'Email', value: 'user@example.com' },
      { id: 'memberSince', label: 'Member Since', value: 'September 11, 2025' },
      { id: 'subscriptionPlan', label: 'Subscription Plan', value: 'Quarterly' },
      { id: 'billingCycle', label: 'Billing Cycle', value: 'Quarterly (Next payment: Dec 11, 2025)' }
    ];
    
    // Generate HTML for each field
    fields.forEach(field => {
      const fieldElement = document.createElement('div');
      fieldElement.className = 'account-field';
      
      const labelElement = document.createElement('label');
      labelElement.textContent = field.label;
      
      const valueElement = document.createElement('span');
      valueElement.id = field.id;
      valueElement.textContent = field.value;
      
      fieldElement.appendChild(labelElement);
      fieldElement.appendChild(valueElement);
      accountDetails.appendChild(fieldElement);
    });
    
    // Create account actions
    const actionsElement = document.createElement('div');
    actionsElement.className = 'account-actions';
    
    const changePasswordBtn = document.createElement('button');
    changePasswordBtn.className = 'btn-secondary';
    changePasswordBtn.id = 'changePassword';
    changePasswordBtn.textContent = 'Change Password';
    
    const updatePaymentBtn = document.createElement('button');
    updatePaymentBtn.className = 'btn-secondary';
    updatePaymentBtn.id = 'updatePayment';
    updatePaymentBtn.textContent = 'Update Payment Method';
    
    actionsElement.appendChild(changePasswordBtn);
    actionsElement.appendChild(updatePaymentBtn);
    accountDetails.appendChild(actionsElement);
    
    // Add to panel
    accountPanel.innerHTML = '';
    accountPanel.appendChild(accountDetails);
    
    // Setup event listeners for new buttons
    changePasswordBtn.addEventListener('click', function() {
      showNotification('Password change feature coming soon!', 'info');
    });
    
    updatePaymentBtn.addEventListener('click', function() {
      showNotification('Payment method update feature coming soon!', 'info');
    });
  }
}

// Load products
function loadProducts() {
  const productsList = document.getElementById('productsList');
  if (!productsList) return;
  
  // Simulate product data
  const products = [
    {
      name: 'BlueLock Pro for Valorant',
      icon: 'V',
      purchased: 'Sep 11, 2025',
      expires: 'Dec 11, 2025',
      status: 'Active'
    },
    {
      name: 'BlueLock Pro for CS2',
      icon: 'CS',
      purchased: 'Sep 11, 2025',
      expires: 'Dec 11, 2025',
      status: 'Active'
    },
    {
      name: 'BlueLock Pro for Apex Legends',
      icon: 'A',
      purchased: 'Sep 11, 2025',
      expires: 'Dec 11, 2025',
      status: 'Active'
    }
  ];
  
  // Generate product items
  productsList.innerHTML = products.map(product => `
    <div class="product-item">
      <div class="product-icon">${product.icon}</div>
      <div class="product-info">
        <div class="product-name">${product.name}</div>
        <div class="product-meta">
          <div class="meta-item">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 2C6.486 2 2 6.486 2 12s4.486 10 10 10 10-4.486 10-10S17.514 2 12 2zm0 18c-4.411 0-8-3.589-8-8s3.589-8 8-8 8 3.589 8 8-3.589 8-8 8z"/>
              <path d="M13 7h-2v5.414l3.293 3.293 1.414-1.414L13 11.586z"/>
            </svg>
            Purchased: ${product.purchased}
          </div>
          <div class="meta-item">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
              <path d="M19 4h-2V2h-2v2H9V2H7v2H5c-1.103 0-2 .897-2 2v14c0 1.103.897 2 2 2h14c1.103 0 2-.897 2-2V6c0-1.103-.897-2-2-2zM5 20V7h14v13H5z"/>
              <path d="m15.292 12.292-4.99 4.99-2.594-2.594 1.414-1.414 1.18 1.18 3.576-3.576 1.414 1.414z"/>
            </svg>
            Expires: ${product.expires}
          </div>
          <div class="meta-item">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 2C6.486 2 2 6.486 2 12s4.486 10 10 10 10-4.486 10-10S17.514 2 12 2zm0 18c-4.411 0-8-3.589-8-8s3.589-8 8-8 8 3.589 8 8-3.589 8-8 8z"/>
              <path d="M12 6c-3.309 0-6 2.691-6 6s2.691 6 6 6 6-2.691 6-6-2.691-6-6-6zm0 10c-2.206 0-4-1.794-4-4s1.794-4 4-4 4 1.794 4 4-1.794 4-4 4z"/>
              <path d="M11 9h2v5h-2z"/>
            </svg>
            Status: <span style="color: #38b2ac; font-weight: 500;">${product.status}</span>
          </div>
        </div>
      </div>
      <div class="product-actions">
        <button class="action-btn" title="Configure">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
            <path d="M12 16c2.206 0 4-1.794 4-4s-1.794-4-4-4-4 1.794-4 4 1.794 4 4 4zm0-6c1.084 0 2 .916 2 2s-.916 2-2 2-2-.916-2-2 .916-2 2-2z"/>
            <path d="m2.845 16.136 1 1.73c.531.917 1.809 1.261 2.73.73l.529-.306A8.1 8.1 0 0 0 9 19.402V20c0 1.103.897 2 2 2h2c1.103 0 2-.897 2-2v-.598a8.132 8.132 0 0 0 1.896-1.111l.529.306c.923.53 2.198.188 2.731-.731l.999-1.729a1.983 1.983 0 0 0-.731-2.732l-.505-.292a7.718 7.718 0 0 0 0-2.224l.505-.292a2.002 2.002 0 0 0 .731-2.732l-.999-1.729c-.531-.92-1.808-1.265-2.731-.732l-.529.306A8.1 8.1 0 0 0 15 4.598V4c0-1.103-.897-2-2-2h-2c-1.103 0-2 .897-2 2v.598a8.132 8.132 0 0 0-1.896 1.111l-.529-.306c-.924-.531-2.2-.187-2.731.732l-.999 1.729a1.983 1.983 0 0 0 .731 2.732l.505.292a7.683 7.683 0 0 0 0 2.223l-.505.292a2.003 2.003 0 0 0-.731 2.733zm3.326-2.758A5.703 5.703 0 0 1 6 12c0-.462.058-.926.17-1.378a.999.999 0 0 0-.47-1.108l-1.123-.65.998-1.729 1.145.662a.997.997 0 0 0 1.188-.142 6.071 6.071 0 0 1 2.384-1.399A1 1 0 0 0 11 5.3V4h2v1.3a1 1 0 0 0 .708.956 6.083 6.083 0 0 1 2.384 1.399.999.999 0 0 0 1.188.142l1.144-.661 1 1.729-1.124.649a1 1 0 0 0-.47 1.108c.112.452.17.916.17 1.378 0 .461-.058.925-.171 1.378a1 1 0 0 0 .471 1.108l1.123.649-.998 1.729-1.145-.661a.996.996 0 0 0-1.188.142 6.071 6.071 0 0 1-2.384 1.399A1 1 0 0 0 13 18.7V20h-2v-1.3a1 1 0 0 0-.708-.956 6.083 6.083 0 0 1-2.384-1.399.992.992 0 0 0-1.188-.141l-1.144.662-1-1.729 1.124-.651a1 1 0 0 0 .471-1.108z"/>
          </svg>
        </button>
        <button class="action-btn" title="Download">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
            <path d="M12 16l4-5h-3V4h-2v7H8l4 5z"/>
            <path d="M20 18H4v-7H2v7c0 1.103.897 2 2 2h16c1.103 0 2-.897 2-2v-7h-2v7z"/>
          </svg>
        </button>
        <button class="action-btn" title="Info">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
            <path d="M12 2C6.486 2 2 6.486 2 12s4.486 10 10 10 10-4.486 10-10S17.514 2 12 2zm0 18c-4.411 0-8-3.589-8-8s3.589-8 8-8 8 3.589 8 8-3.589 8-8 8z"/>
            <path d="M11 11h2v6h-2zm0-4h2v2h-2z"/>
          </svg>
        </button>
      </div>
    </div>
  `).join('');
  
  // Update products count
  const productsCount = document.getElementById('productsCount');
  if (productsCount) {
    productsCount.textContent = products.length;
  }
}

// Load licenses
function loadLicenses() {
  const licensesList = document.getElementById('licensesList');
  if (!licensesList) {
    console.log('License list element not found, creating container');
    const licensePanel = document.querySelector('.license-panel .panel-content');
    if (licensePanel) {
      const newLicensesList = document.createElement('div');
      newLicensesList.id = 'licensesList';
      newLicensesList.className = 'licenses-list';
      licensePanel.appendChild(newLicensesList);
      licensesList = newLicensesList;
    } else {
      return;
    }
  }
  
  // Simulate license data
  const licenses = [
    {
      key: 'BL-VAL-1F5A8C3D-7E2B',
      product: 'BlueLock Pro for Valorant'
    },
    {
      key: 'BL-CS2-9D7B6E2A-3F1C',
      product: 'BlueLock Pro for CS2'
    },
    {
      key: 'BL-APX-8C4A3D7F-2E1B',
      product: 'BlueLock Pro for Apex Legends'
    }
  ];
  
  // Generate license items
  licensesList.innerHTML = licenses.map(license => `
    <div class="license-item">
      <div class="license-info">
        <div class="license-key">${license.key}</div>
        <div class="license-product">${license.product}</div>
      </div>
      <button class="license-copy" title="Copy License Key" onclick="copyToClipboard('${license.key}')">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
          <path d="M20 2H10c-1.103 0-2 .897-2 2v4H4c-1.103 0-2 .897-2 2v10c0 1.103.897 2 2 2h10c1.103 0 2-.897 2-2v-4h4c1.103 0 2-.897 2-2V4c0-1.103-.897-2-2-2zM4 20V10h10l.002 10H4zm16-6h-4v-4c0-1.103-.897-2-2-2h-4V4h10v10z"/>
        </svg>
      </button>
    </div>
  `).join('');
  
  // Setup copy all keys button
  const copyAllKeysBtn = document.getElementById('copyAllKeys');
  if (copyAllKeysBtn) {
    copyAllKeysBtn.addEventListener('click', function() {
      const allKeys = licenses.map(license => license.key).join('\n');
      copyToClipboard(allKeys);
      showNotification('All license keys copied to clipboard', 'success');
    });
  }
}

// Load downloads
function loadDownloads() {
  const downloadsList = document.getElementById('downloadsList');
  if (!downloadsList) {
    console.log('Downloads list element not found, creating container');
    const downloadsPanel = document.querySelector('.downloads-panel .panel-content');
    if (downloadsPanel) {
      const newDownloadsList = document.createElement('div');
      newDownloadsList.id = 'downloadsList';
      newDownloadsList.className = 'downloads-list';
      downloadsPanel.appendChild(newDownloadsList);
      downloadsList = newDownloadsList;
    } else {
      return;
    }
  }
  
  // Simulate download data
  const downloads = [
    {
      name: 'BlueLock Pro for Valorant',
      version: 'v4.2.1',
      size: '23.5 MB',
      updated: 'Sep 10, 2025'
    },
    {
      name: 'BlueLock Pro for CS2',
      version: 'v4.2.1',
      size: '22.8 MB',
      updated: 'Sep 10, 2025'
    },
    {
      name: 'BlueLock Pro for Apex Legends',
      version: 'v4.2.0',
      size: '25.2 MB',
      updated: 'Sep 5, 2025'
    }
  ];
  
  // Generate download items
  downloadsList.innerHTML = downloads.map(download => `
    <div class="download-item">
      <div class="download-icon">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
          <path d="M12 16l4-5h-3V4h-2v7H8l4 5z"/>
          <path d="M20 18H4v-7H2v7c0 1.103.897 2 2 2h16c1.103 0 2-.897 2-2v-7h-2v7z"/>
        </svg>
      </div>
      <div class="download-info">
        <div class="download-name">${download.name}</div>
        <div class="download-meta">
          <span>Version: ${download.version}</span>
          <span>Size: ${download.size}</span>
          <span>Updated: ${download.updated}</span>
        </div>
      </div>
      <button class="download-btn">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
          <path d="M12 16l4-5h-3V4h-2v7H8l4 5z"/>
          <path d="M20 18H4v-7H2v7c0 1.103.897 2 2 2h16c1.103 0 2-.897 2-2v-7h-2v7z"/>
        </svg>
        Download
      </button>
    </div>
  `).join('');
  
  // Add event listeners to download buttons
  const downloadButtons = document.querySelectorAll('.download-btn');
  downloadButtons.forEach((btn, index) => {
    btn.addEventListener('click', function() {
      const download = downloads[index];
      showNotification(`Downloading ${download.name}...`, 'info');
      
      // Simulate download process
      setTimeout(() => {
        showNotification(`${download.name} downloaded successfully!`, 'success');
      }, 3000);
    });
  });
}

// Load activity log
function loadActivity() {
  const activityList = document.getElementById('activityList');
  if (!activityList) return;
  
  // Current date for relative time calculation
  const now = new Date();
  
  // Simulate activity data
  const activities = [
    {
      type: 'login',
      message: 'Successful login from Windows device',
      time: new Date(now - 2 * 60 * 1000) // 2 minutes ago
    },
    {
      type: 'purchase',
      message: 'Purchased BlueLock Pro Quarterly subscription',
      time: new Date(now - 5 * 60 * 1000) // 5 minutes ago
    },
    {
      type: 'download',
      message: 'Downloaded BlueLock Pro for Valorant',
      time: new Date(now - 8 * 60 * 1000) // 8 minutes ago
    },
    {
      type: 'login',
      message: 'Successful login from Windows device',
      time: new Date(now - 1 * 24 * 60 * 60 * 1000) // 1 day ago
    }
  ];
  
  // Generate activity items
  activityList.innerHTML = activities.map(activity => `
    <div class="activity-item">
      <div class="activity-icon activity-${activity.type}">
        ${getActivityIcon(activity.type)}
      </div>
      <div class="activity-info">
        <div class="activity-message">${activity.message}</div>
        <div class="activity-time">${getRelativeTime(activity.time)}</div>
      </div>
    </div>
  `).join('');
}

// Update dashboard stats
function updateDashboardStats() {
  // Update days remaining
  const daysRemaining = document.getElementById('daysRemaining');
  if (daysRemaining) {
    // Simulate 90 days for quarterly subscription
    daysRemaining.textContent = '90';
  }
  
  // Update success rate
  const successRate = document.getElementById('successRate');
  if (successRate) {
    // Simulate high detection safety
    successRate.textContent = '99.7%';
  }
  
  // Update products count if not already set
  const productsCount = document.getElementById('productsCount');
  if (productsCount && productsCount.textContent === '0') {
    productsCount.textContent = '3';
  }
}

// Setup event listeners
function setupEventListeners() {
  // Refresh products button
  const refreshProductsBtn = document.getElementById('refreshProducts');
  if (refreshProductsBtn) {
    refreshProductsBtn.addEventListener('click', function() {
      showNotification('Refreshing products...', 'info');
      
      // Simulate refresh
      setTimeout(() => {
        loadProducts();
        showNotification('Products refreshed successfully!', 'success');
      }, 1000);
    });
  }
  
  // Edit account button
  const editAccountBtn = document.getElementById('editAccount');
  if (editAccountBtn) {
    editAccountBtn.addEventListener('click', function() {
      showNotification('Account editing feature coming soon!', 'info');
    });
  }
  
  // Change password button
  const changePasswordBtn = document.getElementById('changePassword');
  if (changePasswordBtn) {
    changePasswordBtn.addEventListener('click', function() {
      showNotification('Password change feature coming soon!', 'info');
    });
  }
  
  // Update payment button
  const updatePaymentBtn = document.getElementById('updatePayment');
  if (updatePaymentBtn) {
    updatePaymentBtn.addEventListener('click', function() {
      showNotification('Payment method update feature coming soon!', 'info');
    });
  }
}

// Helper Functions

// Copy to clipboard function
function copyToClipboard(text) {
  // Create temporary input element
  const tempInput = document.createElement('input');
  tempInput.value = text;
  document.body.appendChild(tempInput);
  
  // Select and copy
  tempInput.select();
  document.execCommand('copy');
  
  // Remove temporary element
  document.body.removeChild(tempInput);
  
  // Show notification
  showNotification('Copied to clipboard!', 'success');
}

// Get activity icon based on type
function getActivityIcon(type) {
  const icons = {
    login: `
      <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
        <path d="M11 7L9.6 8.4l2.6 2.6H2v2h10.2l-2.6 2.6L11 17l5-5-5-5z"/>
        <path d="M20 19h-8v2h8c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2h-8v2h8v14z"/>
      </svg>
    `,
    purchase: `
      <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
        <path d="M20 4H4c-1.11 0-1.99.89-1.99 2L2 18c0 1.11.89 2 2 2h16c1.11 0 2-.89 2-2V6c0-1.11-.89-2-2-2zm0 14H4v-6h16v6zm0-10H4V6h16v2z"/>
      </svg>
    `,
    download: `
      <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
        <path d="M12 16l4-5h-3V4h-2v7H8l4 5z"/>
        <path d="M20 18H4v-7H2v7c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2v-7h-2v7z"/>
      </svg>
    `
  };
  
  return icons[type] || '';
}

// Get relative time string
function getRelativeTime(date) {
  const now = new Date();
  const diffInSeconds = Math.floor((now - date) / 1000);
  
  if (diffInSeconds < 60) {
    return 'Just now';
  }
  
  const diffInMinutes = Math.floor(diffInSeconds / 60);
  if (diffInMinutes < 60) {
    return `${diffInMinutes} minute${diffInMinutes > 1 ? 's' : ''} ago`;
  }
  
  const diffInHours = Math.floor(diffInMinutes / 60);
  if (diffInHours < 24) {
    return `${diffInHours} hour${diffInHours > 1 ? 's' : ''} ago`;
  }
  
  const diffInDays = Math.floor(diffInHours / 24);
  if (diffInDays < 30) {
    return `${diffInDays} day${diffInDays > 1 ? 's' : ''} ago`;
  }
  
  return date.toLocaleDateString();
}

// Logout function (overrides the one in script.js to add redirection)
function logout() {
  // Clear auth data
  localStorage.removeItem('bluelock_auth');
  sessionStorage.removeItem('bluelock_auth');
  
  // Show notification
  showNotification('You have been logged out successfully', 'info');
  
  // Redirect to home page
  setTimeout(() => {
    window.location.href = '../';
  }, 1500);
}
