// Dark mode functionality
function initDarkModeToggle() {
  const darkModeToggle = document.getElementById('darkModeToggle');
  const prefersDarkScheme = window.matchMedia("(prefers-color-scheme: dark)");
  
  // Check for saved theme preference or use the system preference
  const savedTheme = localStorage.getItem('bluelock-theme');
  
  if (savedTheme === 'dark' || (!savedTheme && prefersDarkScheme.matches)) {
    document.body.classList.add('dark-mode');
    updateDarkModeIcon(true);
  } else {
    document.body.classList.remove('dark-mode');
    updateDarkModeIcon(false);
  }
  
  // Set up the toggle
  if (darkModeToggle) {
    darkModeToggle.addEventListener('click', () => {
      if (document.body.classList.contains('dark-mode')) {
        document.body.classList.remove('dark-mode');
        localStorage.setItem('bluelock-theme', 'light');
        updateDarkModeIcon(false);
        showNotification('Light mode enabled', 'info');
      } else {
        document.body.classList.add('dark-mode');
        localStorage.setItem('bluelock-theme', 'dark');
        updateDarkModeIcon(true);
        showNotification('Dark mode enabled', 'info');
      }
    });
  }
}

// Update dark mode toggle icon based on current theme
function updateDarkModeIcon(isDarkMode) {
  const darkModeToggle = document.getElementById('darkModeToggle');
  if (darkModeToggle) {
    if (isDarkMode) {
      darkModeToggle.innerHTML = '<i class="bx bx-sun"></i>';
      darkModeToggle.setAttribute('data-tooltip', 'Switch to Light Mode');
    } else {
      darkModeToggle.innerHTML = '<i class="bx bx-moon"></i>';
      darkModeToggle.setAttribute('data-tooltip', 'Switch to Dark Mode');
    }
  }
}

// Update product and download items to use Boxicons
function updateIconsToBoxicons() {
  // Update product items
  document.querySelectorAll('.product-item').forEach(item => {
    const metaItems = item.querySelectorAll('.meta-item');
    
    if (metaItems[0]) {
      metaItems[0].innerHTML = '<i class="bx bx-calendar"></i> Purchased: ' + metaItems[0].textContent.split('Purchased:')[1];
    }
    
    if (metaItems[1]) {
      metaItems[1].innerHTML = '<i class="bx bx-time-five"></i> Expires: ' + metaItems[1].textContent.split('Expires:')[1];
    }
    
    if (metaItems[2]) {
      const statusText = metaItems[2].textContent.split('Status:')[1];
      metaItems[2].innerHTML = '<i class="bx bx-check-circle"></i> Status: <span style="color: #38b2ac; font-weight: 500;">' + statusText + '</span>';
    }
    
    // Update action buttons
    const actionBtns = item.querySelectorAll('.action-btn');
    if (actionBtns[0]) actionBtns[0].innerHTML = '<i class="bx bx-cog"></i>';
    if (actionBtns[1]) actionBtns[1].innerHTML = '<i class="bx bx-download"></i>';
    if (actionBtns[2]) actionBtns[2].innerHTML = '<i class="bx bx-info-circle"></i>';
  });
  
  // Update license items
  document.querySelectorAll('.license-item').forEach(item => {
    const copyBtn = item.querySelector('.license-copy');
    if (copyBtn) {
      copyBtn.innerHTML = '<i class="bx bx-copy"></i>';
    }
    
    // Add product icon to license product
    const licenseProduct = item.querySelector('.license-product');
    if (licenseProduct) {
      licenseProduct.innerHTML = '<i class="bx bx-package"></i> ' + licenseProduct.textContent;
    }
  });
  
  // Update download items
  document.querySelectorAll('.download-item').forEach(item => {
    const downloadIcon = item.querySelector('.download-icon');
    if (downloadIcon) {
      downloadIcon.innerHTML = '<i class="bx bxs-download"></i>';
    }
    
    const downloadBtn = item.querySelector('.download-btn');
    if (downloadBtn) {
      downloadBtn.innerHTML = '<i class="bx bx-download"></i> Download';
    }
    
    // Add file type badge to download name
    const downloadName = item.querySelector('.download-name');
    if (downloadName) {
      const gameAbbr = downloadName.textContent.includes('Valorant') ? 'VAL' : 
                       downloadName.textContent.includes('CS2') ? 'CS2' : 
                       downloadName.textContent.includes('Apex') ? 'APX' : '';
      
      downloadName.innerHTML = downloadName.textContent + ' <span class="file-type">' + gameAbbr + '</span>';
    }
    
    // Update meta items with icons
    const metaItems = item.querySelector('.download-meta');
    if (metaItems) {
      const metaText = metaItems.innerHTML;
      const versionMatch = metaText.match(/Version: ([^<]+)/);
      const sizeMatch = metaText.match(/Size: ([^<]+)/);
      const updatedMatch = metaText.match(/Updated: ([^<]+)/);
      
      let newMetaHTML = '';
      if (versionMatch) newMetaHTML += '<span><i class="bx bx-code-tag"></i> ' + versionMatch[0] + '</span>';
      if (sizeMatch) newMetaHTML += '<span><i class="bx bx-data"></i> ' + sizeMatch[0] + '</span>';
      if (updatedMatch) newMetaHTML += '<span><i class="bx bx-calendar"></i> ' + updatedMatch[0] + '</span>';
      
      metaItems.innerHTML = newMetaHTML;
    }
  });
  
  // Update activity items
  document.querySelectorAll('.activity-item').forEach(item => {
    const activityIcon = item.querySelector('.activity-icon');
    
    if (activityIcon) {
      if (activityIcon.classList.contains('activity-login')) {
        activityIcon.innerHTML = '<i class="bx bx-log-in-circle"></i>';
      } else if (activityIcon.classList.contains('activity-purchase')) {
        activityIcon.innerHTML = '<i class="bx bx-cart"></i>';
      } else if (activityIcon.classList.contains('activity-download')) {
        activityIcon.innerHTML = '<i class="bx bx-download"></i>';
      }
    }
    
    // Add time icon
    const activityTime = item.querySelector('.activity-time');
    if (activityTime) {
      activityTime.innerHTML = '<i class="bx bx-time"></i> ' + activityTime.textContent;
    }
  });
}

// Initialize event listeners for interactive elements
function initEventListeners() {
  // Handle clear activity button
  const clearActivityBtn = document.getElementById('clearActivity');
  if (clearActivityBtn) {
    clearActivityBtn.addEventListener('click', function() {
      const activityList = document.getElementById('activityList');
      if (activityList) {
        showNotification('Activity log cleared', 'info');
        activityList.innerHTML = `
          <div class="empty-state">
            <div class="empty-state-icon">
              <i class='bx bx-history'></i>
            </div>
            <h3>No Recent Activity</h3>
            <p>Your activity log is empty. Actions like logins and downloads will appear here.</p>
          </div>
        `;
      }
    });
  }
  
  // Handle editable account fields
  document.querySelectorAll('.account-field.editable span i').forEach(icon => {
    icon.addEventListener('click', function() {
      const span = this.parentElement;
      const currentText = span.textContent.trim().replace(/(✎|\s+$)/, '');
      const field = span.parentElement.querySelector('label').textContent.trim();
      
      showNotification(`Edit ${field} functionality coming soon!`, 'info');
    });
  });
  
  // Handle delete account button
  const deleteAccountBtn = document.getElementById('deleteAccount');
  if (deleteAccountBtn) {
    deleteAccountBtn.addEventListener('click', function() {
      if (confirm('Are you sure you want to delete your account? This action cannot be undone.')) {
        showNotification('Account deletion request submitted', 'info');
      }
    });
  }
}

// Enhanced document ready function
document.addEventListener('DOMContentLoaded', function() {
  // Original initialization functions
  checkAuthentication();
  loadUserInfo();
  loadProducts();
  loadLicenses();
  loadDownloads();
  loadActivity();
  setupEventListeners();
  updateDashboardStats();
  
  // New enhancement functions
  initDarkModeToggle();
  updateIconsToBoxicons();
  initEventListeners();
  
  // Hide loading spinners
  setTimeout(() => {
    const productsLoading = document.getElementById('productsLoading');
    if (productsLoading) {
      productsLoading.style.display = 'none';
    }
    
    // Check if products list is empty and show empty state if needed
    const productsList = document.getElementById('productsList');
    if (productsList && productsList.querySelectorAll('.product-item').length === 0) {
      const productsEmpty = document.getElementById('productsEmpty');
      if (productsEmpty) {
        productsEmpty.style.display = 'flex';
      }
    }
  }, 1200);
});
