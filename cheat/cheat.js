class AdvancedCheatManager {
  constructor() {
    this.cheats = new Map();
    this.settings = {
      aimbotFov: 90,
      speedMultiplier: 2.0,
      espColor: '#00ff00',
      fontSize: 12,
      panicMode: false,
      streamProof: false
    };
    this.keybinds = new Map();
    this.presets = new Map();
    this.connected = false;
    this.injected = false;
    this.gameProcess = null;
    this.activeTab = 'visual';
    this.searchTerm = '';
    this.notifications = [];
    this.currentKeybindSetting = null;
    
    this.init();
  }

  init() {
    this.setupEventListeners();
    this.loadConfiguration();
    this.updateStatusPanel();
    this.setupTabSystem();
    this.setupSearch();
    this.setupPresets();
    this.simulateGameDetection();
    this.setupKeyboardShortcuts();
    this.initializeDefaultKeybinds();
  }

  setupEventListeners() {
    // Cheat toggles with advanced features
    document.querySelectorAll('.cheat-toggle').forEach(toggle => {
      toggle.addEventListener('change', (e) => {
        this.toggleCheat(e.target.dataset.cheat, e.target.checked);
        this.updateCheatOptions(e.target.dataset.cheat, e.target.checked);
      });
    });

    // Settings with real-time updates
    this.setupSliderListeners();
    this.setupColorPickers();
    this.setupKeybinds();

    // Action buttons
    document.querySelector('.save-config-btn')?.addEventListener('click', () => this.saveConfiguration());
    document.querySelector('.load-config-btn')?.addEventListener('click', () => this.loadConfigurationFile());
    document.querySelector('.export-btn')?.addEventListener('click', () => this.exportConfiguration());
    document.querySelector('.import-btn')?.addEventListener('click', () => this.importConfiguration());
    document.querySelector('.reset-btn')?.addEventListener('click', () => this.resetConfiguration());

    // Process controls
    document.getElementById('injectBtn')?.addEventListener('click', () => this.injectProcess());
    document.getElementById('ejectBtn')?.addEventListener('click', () => this.ejectProcess());

    // Panel toggle
    document.getElementById('panelToggle')?.addEventListener('click', () => this.toggleStatusPanel());

    // Category toggle-all buttons
    document.querySelectorAll('.category-toggle-all').forEach(btn => {
      btn.addEventListener('click', (e) => {
        this.toggleAllInCategory(e.target.dataset.category);
      });
    });

    // Preset selector
    document.getElementById('presetSelect')?.addEventListener('change', (e) => {
      this.loadPreset(e.target.value);
    });

    // Keybind modal
    this.setupKeybindModal();
  }

  setupTabSystem() {
    const tabBtns = document.querySelectorAll('.tab-btn');
    const tabPanels = document.querySelectorAll('.tab-panel');

    tabBtns.forEach(btn => {
      btn.addEventListener('click', () => {
        const tabName = btn.dataset.tab;
        
        // Update active states
        tabBtns.forEach(b => b.classList.remove('active'));
        tabPanels.forEach(p => p.classList.remove('active'));
        
        btn.classList.add('active');
        document.getElementById(`${tabName}-panel`)?.classList.add('active');
        
        this.activeTab = tabName;
        this.trackAnalytics('tab_switch', { tab: tabName });
      });
    });
  }

  setupSearch() {
    const searchInput = document.getElementById('cheatSearch');
    if (!searchInput) return;

    searchInput.addEventListener('input', (e) => {
      this.searchTerm = e.target.value.toLowerCase();
      this.filterCheats();
    });
  }

  filterCheats() {
    const cheatItems = document.querySelectorAll('.cheat-item[data-search]');
    
    cheatItems.forEach(item => {
      const searchData = item.dataset.search.toLowerCase();
      const isVisible = !this.searchTerm || searchData.includes(this.searchTerm);
      
      item.style.display = isVisible ? 'block' : 'none';
      
      if (isVisible && this.searchTerm) {
        item.style.animation = 'highlightSearch 0.3s ease';
      }
    });
  }

  setupSliderListeners() {
    const sliders = document.querySelectorAll('.setting-slider, .option-slider');
    
    sliders.forEach(slider => {
      slider.addEventListener('input', (e) => {
        const value = e.target.value;
        const valueDisplay = e.target.nextElementSibling;
        
        // Update display
        if (valueDisplay?.classList.contains('setting-value') || valueDisplay?.classList.contains('option-value')) {
          const suffix = e.target.id.includes('Fov') ? '°' : 
                        e.target.id.includes('Multiplier') ? 'x' : 
                        e.target.id.includes('Distance') ? 'm' :
                        e.target.id.includes('fontSize') ? 'px' : '%';
          
          const displayValue = e.target.id.includes('Multiplier') ? 
                              parseFloat(value).toFixed(1) : value;
          
          valueDisplay.textContent = displayValue + suffix;
        }
        
        // Update setting
        if (e.target.id) {
          this.updateSetting(e.target.id, value);
        }
        
        // Handle option sliders
        if (e.target.dataset.option) {
          this.updateCheatOption(e.target.dataset.option, value);
        }
      });
    });
  }

  setupColorPickers() {
    document.querySelectorAll('.color-picker').forEach(picker => {
      picker.addEventListener('change', (e) => {
        const hexInput = e.target.nextElementSibling;
        if (hexInput?.classList.contains('hex-input')) {
          hexInput.value = e.target.value;
        }
        this.updateSetting(e.target.id, e.target.value);
      });
    });

    document.querySelectorAll('.hex-input').forEach(input => {
      input.addEventListener('input', (e) => {
        const value = e.target.value;
        if (/^#[0-9A-F]{6}$/i.test(value)) {
          const colorPicker = e.target.previousElementSibling;
          if (colorPicker?.classList.contains('color-picker')) {
            colorPicker.value = value;
          }
          this.updateSetting('espColor', value);
        }
      });
    });
  }

  setupKeybinds() {
    document.querySelectorAll('.key-bind-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        this.showKeybindModal(btn.dataset.setting);
      });
    });
  }

  setupKeybindModal() {
    const modal = document.getElementById('keybindModal');
    const cancelBtn = document.getElementById('cancelKeybind');
    const clearBtn = document.getElementById('clearKeybind');
    
    if (!modal) return;

    cancelBtn?.addEventListener('click', () => {
      this.hideKeybindModal();
    });

    clearBtn?.addEventListener('click', () => {
      this.clearKeybind();
    });

    document.addEventListener('keydown', (e) => {
      if (modal.style.display === 'flex' && this.currentKeybindSetting) {
        e.preventDefault();
        this.setKeybind(e.key);
      }
    });

    document.addEventListener('mousedown', (e) => {
      if (modal.style.display === 'flex' && this.currentKeybindSetting) {
        e.preventDefault();
        this.setKeybind(`Mouse${e.button + 1}`);
      }
    });
  }

  setupKeyboardShortcuts() {
    document.addEventListener('keydown', (e) => {
      // Panic mode (F12)
      if (e.key === 'F12' && this.settings.panicMode) {
        e.preventDefault();
        this.panicMode();
      }
      
      // Quick save (Ctrl+S)
      if (e.ctrlKey && e.key === 's') {
        e.preventDefault();
        this.saveConfiguration();
      }
      
      // Quick load (Ctrl+O)
      if (e.ctrlKey && e.key === 'o') {
        e.preventDefault();
        this.loadConfigurationFile();
      }

      // Toggle specific cheats via keybinds
      this.keybinds.forEach((key, cheat) => {
        if (e.key === key || (e.key === 'Mouse1' && e.button === 0)) {
          this.toggleCheatViaKeybind(cheat);
        }
      });
    });
  }

  initializeDefaultKeybinds() {
    this.keybinds.set('aimbot', 'Mouse1');
    this.keybinds.set('esp', 'F1');
    this.keybinds.set('speed', 'F2');
    this.keybinds.set('fly', 'F3');
  }

  setupPresets() {
    this.presets.set('legit', {
      name: 'Legit',
      cheats: {
        esp: false,
        aimbot: true,
        triggerbot: false,
        norecoil: true,
        speed: false,
        names: true,
        health: false
      },
      settings: {
        aimbotFov: 15,
        speedMultiplier: 1.2
      }
    });

    this.presets.set('rage', {
      name: 'Rage',
      cheats: {
        esp: true,
        aimbot: true,
        triggerbot: true,
        norecoil: true,
        speed: true,
        fly: true,
        names: true,
        health: true,
        distance: true
      },
      settings: {
        aimbotFov: 180,
        speedMultiplier: 5.0
      }
    });

    this.presets.set('hvh', {
      name: 'HvH',
      cheats: {
        esp: true,
        aimbot: true,
        triggerbot: true,
        norecoil: true,
        speed: true,
        fly: true,
        radar: true,
        names: true,
        health: true,
        distance: true,
        rapidfire: true
      },
      settings: {
        aimbotFov: 360,
        speedMultiplier: 10.0
      }
    });
  }

  toggleCheat(cheatName, enabled) {
    this.cheats.set(cheatName, enabled);
    
    // Visual feedback
    const cheatItem = document.querySelector(`[data-cheat="${cheatName}"]`)?.closest('.cheat-item');
    
    if (enabled) {
      cheatItem?.style.setProperty('border-color', 'var(--accent-blue)');
      cheatItem?.style.setProperty('background', 'rgba(59, 130, 246, 0.1)');
      this.showNotification(`${this.formatCheatName(cheatName)} enabled`, 'success');
    } else {
      cheatItem?.style.removeProperty('border-color');
      cheatItem?.style.removeProperty('background');
      this.showNotification(`${this.formatCheatName(cheatName)} disabled`, 'info');
    }

    this.updateStatusPanel();
    this.updateConnectionStatus();
  }

  updateCheatOptions(cheatName, enabled) {
    const cheatItem = document.querySelector(`[data-cheat="${cheatName}"]`)?.closest('.cheat-item');
    const options = cheatItem?.querySelector('.cheat-options');
    
    if (options) {
      options.style.display = enabled ? 'block' : 'none';
    }
  }

  toggleCheatViaKeybind(cheatName) {
    const toggle = document.querySelector(`[data-cheat="${cheatName}"]`);
    if (toggle) {
      toggle.checked = !toggle.checked;
      this.toggleCheat(cheatName, toggle.checked);
    }
  }

  toggleAllInCategory(category) {
    const categoryElement = document.querySelector(`[data-tab="${category}"]`)?.closest('.tab-panel') || 
                           document.querySelector('#visual-panel');
    
    if (!categoryElement) return;

    const toggles = categoryElement.querySelectorAll('.cheat-toggle');
    const allEnabled = Array.from(toggles).every(toggle => toggle.checked);
    
    toggles.forEach(toggle => {
      toggle.checked = !allEnabled;
      this.toggleCheat(toggle.dataset.cheat, !allEnabled);
    });

    this.showNotification(`${allEnabled ? 'Disabled' : 'Enabled'} all ${category} cheats`, 'info');
  }

  loadPreset(presetName) {
    if (!presetName || !this.presets.has(presetName)) return;

    const preset = this.presets.get(presetName);
    
    // Load cheat states
    Object.entries(preset.cheats).forEach(([cheatName, enabled]) => {
      const toggle = document.querySelector(`[data-cheat="${cheatName}"]`);
      if (toggle) {
        toggle.checked = enabled;
        this.toggleCheat(cheatName, enabled);
      }
    });

    // Load settings
    Object.entries(preset.settings).forEach(([settingName, value]) => {
      this.updateSetting(settingName, value);
      const element = document.getElementById(settingName);
      if (element) {
        element.value = value;
        // Trigger input event to update display
        element.dispatchEvent(new Event('input'));
      }
    });

    this.showNotification(`Loaded preset: ${preset.name}`, 'success');
  }

  updateSetting(settingName, value) {
    this.settings[settingName] = settingName.includes('Multiplier') ? parseFloat(value) : value;
    this.showNotification(`${this.formatSettingName(settingName)} updated`, 'info');
  }

  updateCheatOption(optionName, value) {
    // Handle cheat-specific options
    this.showNotification(`${this.formatSettingName(optionName)} updated to ${value}`, 'info');
  }

  showKeybindModal(settingName) {
    const modal = document.getElementById('keybindModal');
    const preview = document.getElementById('keybindPreview');
    
    if (!modal || !preview) return;

    this.currentKeybindSetting = settingName;
    preview.textContent = 'Waiting for input...';
    modal.style.display = 'flex';
  }

  hideKeybindModal() {
    const modal = document.getElementById('keybindModal');
    if (modal) {
      modal.style.display = 'none';
      this.currentKeybindSetting = null;
    }
  }

  setKeybind(key) {
    if (!this.currentKeybindSetting) return;

    this.keybinds.set(this.currentKeybindSetting, key);
    
    // Update display
    const btn = document.querySelector(`[data-setting="${this.currentKeybindSetting}"]`);
    const keyDisplay = btn?.querySelector('.key-display');
    if (keyDisplay) {
      keyDisplay.textContent = key;
    }

    this.showNotification(`Keybind set: ${key}`, 'success');
    this.hideKeybindModal();
  }

  clearKeybind() {
    if (!this.currentKeybindSetting) return;

    this.keybinds.delete(this.currentKeybindSetting);
    
    // Update display
    const btn = document.querySelector(`[data-setting="${this.currentKeybindSetting}"]`);
    const keyDisplay = btn?.querySelector('.key-display');
    if (keyDisplay) {
      keyDisplay.textContent = 'None';
    }

    this.showNotification('Keybind cleared', 'info');
    this.hideKeybindModal();
  }

  injectProcess() {
    this.showNotification('Injecting into game process...', 'info');
    
    // Simulate injection process
    setTimeout(() => {
      this.injected = true;
      this.connected = true;
      this.gameProcess = 'game.exe (PID: 1337)';
      this.updateStatusPanel();
      this.showNotification('Successfully injected!', 'success');
      
      document.getElementById('injectBtn').disabled = true;
      document.getElementById('ejectBtn').disabled = false;
    }, 2000);
  }

  ejectProcess() {
    this.showNotification('Ejecting from game process...', 'info');
    
    setTimeout(() => {
      this.injected = false;
      this.connected = false;
      this.gameProcess = 'Not Found';
      this.updateStatusPanel();
      this.showNotification('Successfully ejected!', 'success');
      
      document.getElementById('injectBtn').disabled = false;
      document.getElementById('ejectBtn').disabled = true;
    }, 1000);
  }

  toggleStatusPanel() {
    const panel = document.querySelector('.advanced-status-panel');
    const content = panel?.querySelector('.status-content');
    
    if (!content) return;

    const isHidden = content.style.display === 'none';
    content.style.display = isHidden ? 'block' : 'none';
    panel.style.height = isHidden ? 'auto' : '60px';
  }

  simulateGameDetection() {
    // Simulate finding game process after a delay
    setTimeout(() => {
      this.gameProcess = 'game.exe (PID: 1337)';
      this.updateStatusPanel();
      this.showNotification('Game process detected!', 'info');
    }, 3000);
  }

  updateStatusPanel() {
    // Update connection status
    const statusDot = document.getElementById('statusDot');
    const statusText = document.getElementById('statusText');
    
    if (statusDot && statusText) {
      if (this.connected) {
        statusDot.classList.add('connected');
        statusText.textContent = 'Connected';
      } else {
        statusDot.classList.remove('connected');
        statusText.textContent = this.injected ? 'Injected' : 'Disconnected';
      }
    }

    // Update stats
    const activeCheats = document.getElementById('activeCheats');
    const injectionStatus = document.getElementById('injectionStatus');
    const gameProcessElement = document.getElementById('gameProcess');
    
    if (activeCheats) {
      const activeCount = Array.from(this.cheats.values()).filter(Boolean).length;
      activeCheats.textContent = activeCount;
    }

    if (injectionStatus) {
      injectionStatus.textContent = this.injected ? 'Injected' : 'Not Injected';
      injectionStatus.className = `stat-value injection-status ${this.injected ? 'injected' : ''}`;
    }

    if (gameProcessElement) {
      gameProcessElement.textContent = this.gameProcess || 'Not Found';
    }
  }

  updateConnectionStatus() {
    const hasActiveCheats = Array.from(this.cheats.values()).some(enabled => enabled);
    this.connected = hasActiveCheats && this.injected;
    this.updateStatusPanel();
  }

  panicMode() {
    // Disable all cheats instantly
    document.querySelectorAll('.cheat-toggle').forEach(toggle => {
      toggle.checked = false;
      this.toggleCheat(toggle.dataset.cheat, false);
    });

    this.showNotification('PANIC MODE ACTIVATED - All cheats disabled!', 'error');
  }

  saveConfiguration() {
    const config = {
      cheats: Object.fromEntries(this.cheats),
      settings: this.settings,
      keybinds: Object.fromEntries(this.keybinds),
      timestamp: new Date().toISOString(),
      version: '2.0'
    };

    localStorage.setItem('bluelock_advanced_config', JSON.stringify(config));
    this.showNotification('Configuration saved successfully!', 'success');
  }

  loadConfiguration() {
    const saved = localStorage.getItem('bluelock_advanced_config');
    if (saved) {
      try {
        const config = JSON.parse(saved);
        
        // Load cheats
        for (const [cheatName, enabled] of Object.entries(config.cheats || {})) {
          this.cheats.set(cheatName, enabled);
          const toggle = document.querySelector(`[data-cheat="${cheatName}"]`);
          if (toggle) {
            toggle.checked = enabled;
            this.updateCheatOptions(cheatName, enabled);
          }
        }

        // Load settings
        if (config.settings) {
          this.settings = { ...this.settings, ...config.settings };
          this.updateSettingsUI();
        }

        // Load keybinds
        if (config.keybinds) {
          this.keybinds = new Map(Object.entries(config.keybinds));
          this.updateKeybindUI();
        }

        this.showNotification('Configuration loaded', 'success');
      } catch (error) {
        this.showNotification('Failed to load configuration', 'error');
      }
    }
  }

  loadConfigurationFile() {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json';
    input.onchange = (e) => {
      const file = e.target.files[0];
      if (file) {
        const reader = new FileReader();
        reader.onload = (event) => {
          try {
            const config = JSON.parse(event.target.result);
            localStorage.setItem('bluelock_advanced_config', JSON.stringify(config));
            location.reload(); // Reload to apply changes
          } catch (error) {
            this.showNotification('Invalid configuration file', 'error');
          }
        };
        reader.readAsText(file);
      }
    };
    input.click();
  }

  exportConfiguration() {
    const config = {
      cheats: Object.fromEntries(this.cheats),
      settings: this.settings,
      keybinds: Object.fromEntries(this.keybinds),
      timestamp: new Date().toISOString(),
      version: '2.0'
    };

    const blob = new Blob([JSON.stringify(config, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `bluelock-config-${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);

    this.showNotification('Configuration exported successfully!', 'success');
  }

  importConfiguration() {
    this.loadConfigurationFile();
  }

  resetConfiguration() {
    if (confirm('Are you sure you want to reset all settings? This cannot be undone.')) {
      // Reset all toggles
      document.querySelectorAll('.cheat-toggle').forEach(toggle => {
        toggle.checked = false;
        this.toggleCheat(toggle.dataset.cheat, false);
      });

      // Reset settings
      this.settings = {
        aimbotFov: 90,
        speedMultiplier: 2.0,
        espColor: '#00ff00',
        fontSize: 12,
        panicMode: false,
        streamProof: false
      };

      // Reset keybinds
      this.keybinds.clear();
      this.initializeDefaultKeybinds();

      this.updateSettingsUI();
      this.updateKeybindUI();
      this.cheats.clear();
      localStorage.removeItem('bluelock_advanced_config');
      this.showNotification('Configuration reset successfully', 'success');
    }
  }

  updateSettingsUI() {
    Object.entries(this.settings).forEach(([key, value]) => {
      const element = document.getElementById(key);
      if (element) {
        element.value = value;
        // Trigger input event to update display
        element.dispatchEvent(new Event('input'));
      }

      // Handle checkboxes
      if (typeof value === 'boolean') {
        const checkbox = document.getElementById(key);
        if (checkbox && checkbox.type === 'checkbox') {
          checkbox.checked = value;
        }
      }
    });
  }

  updateKeybindUI() {
    this.keybinds.forEach((key, setting) => {
      const btn = document.querySelector(`[data-setting="${setting}"]`);
      const keyDisplay = btn?.querySelector('.key-display');
      if (keyDisplay) {
        keyDisplay.textContent = key;
      }
    });
  }

  showNotification(message, type = 'info') {
    const container = document.getElementById('notificationContainer');
    if (!container) return;

    const notification = document.createElement('div');
    notification.className = `notification ${type}`;
    notification.innerHTML = `
      <div class="notification-content">
        <div class="notification-icon">
          ${this.getNotificationIcon(type)}
        </div>
        <div class="notification-body">
          <span class="notification-message">${message}</span>
          <span class="notification-time">${new Date().toLocaleTimeString()}</span>
        </div>
        <button class="notification-close">×</button>
      </div>
    `;

    container.appendChild(notification);

    // Auto remove after 5 seconds
    const timeout = setTimeout(() => {
      notification.remove();
    }, 5000);

    // Manual close
    notification.querySelector('.notification-close').onclick = () => {
      clearTimeout(timeout);
      notification.style.animation = 'slideOutRight 0.3s ease';
      setTimeout(() => notification.remove(), 300);
    };

    // Limit notifications
    if (container.children.length > 5) {
      container.firstChild.remove();
    }
  }

  getNotificationIcon(type) {
    const icons = {
      success: '<svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>',
      error: '<svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>',
      warning: '<svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"/></svg>',
      info: '<svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>'
    };
    return icons[type] || icons.info;
  }

  trackAnalytics(event, data) {
    // Analytics tracking for usage patterns
    console.log(`Analytics: ${event}`, data);
  }

  formatCheatName(cheatName) {
    return cheatName.charAt(0).toUpperCase() + cheatName.slice(1).replace(/([A-Z])/g, ' $1');
  }

  formatSettingName(settingName) {
    return settingName.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase());
  }
}

// Initialize advanced cheat manager when page loads
document.addEventListener('DOMContentLoaded', () => {
  window.cheatManager = new AdvancedCheatManager();
});

// Add global error handling
window.addEventListener('error', (e) => {
  console.error('Cheat Manager Error:', e.error);
  if (window.cheatManager) {
    window.cheatManager.showNotification('An error occurred', 'error');
  }
});
