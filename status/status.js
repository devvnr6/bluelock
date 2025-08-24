// Status page functionality
document.addEventListener('DOMContentLoaded', function() {
    // Auto-refresh status every 30 seconds
    setInterval(updateStatus, 30000);
    
    // Add real-time clock
    updateClock();
    setInterval(updateClock, 1000);
    
    // Initialize tooltips for uptime bars
    initializeTooltips();
    
    // Simulate real-time updates
    simulateStatusUpdates();
});

function updateStatus() {
    // Simulate API call to get latest status
    const services = document.querySelectorAll('.service-card');
    services.forEach(service => {
        const metrics = service.querySelectorAll('.metric-value');
        if (metrics.length >= 2) {
            // Randomly update response times (simulate real monitoring)
            const responseTime = Math.floor(Math.random() * 50) + 5;
            metrics[1].textContent = responseTime + 'ms';
        }
    });
}

function updateClock() {
    // Add real-time timestamp to header
    const now = new Date();
    const timeString = now.toUTCString();
    
    let clockElement = document.querySelector('.status-clock');
    if (!clockElement) {
        clockElement = document.createElement('div');
        clockElement.className = 'status-clock';
        clockElement.style.cssText = `
            font-size: 14px;
            color: #6e6e73;
            margin-top: 8px;
        `;
        document.querySelector('.status-subtitle').after(clockElement);
    }
    
    clockElement.textContent = `Last updated: ${timeString}`;
}

function initializeTooltips() {
    const bars = document.querySelectorAll('.bar');
    bars.forEach((bar, index) => {
        bar.addEventListener('mouseenter', function(e) {
            showTooltip(e, this.title);
        });
        
        bar.addEventListener('mouseleave', function() {
            hideTooltip();
        });
    });
}

function showTooltip(event, text) {
    const tooltip = document.createElement('div');
    tooltip.className = 'tooltip';
    tooltip.textContent = text;
    tooltip.style.cssText = `
        position: absolute;
        background: #1d1d1f;
        color: white;
        padding: 8px 12px;
        border-radius: 6px;
        font-size: 12px;
        font-weight: 500;
        z-index: 1000;
        pointer-events: none;
        white-space: nowrap;
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
    `;
    
    document.body.appendChild(tooltip);
    
    const rect = event.target.getBoundingClientRect();
    tooltip.style.left = (rect.left + rect.width / 2 - tooltip.offsetWidth / 2) + 'px';
    tooltip.style.top = (rect.top - tooltip.offsetHeight - 10) + 'px';
}

function hideTooltip() {
    const tooltip = document.querySelector('.tooltip');
    if (tooltip) {
        tooltip.remove();
    }
}

function simulateStatusUpdates() {
    // Simulate occasional status changes for demo purposes
    setTimeout(() => {
        const codService = document.querySelector('.service-card:nth-child(4)');
        if (codService) {
            const status = codService.querySelector('.service-status');
            const statusText = status.querySelector('span');
            
            // Change from maintenance back to operational
            setTimeout(() => {
                status.className = 'service-status operational';
                statusText.textContent = 'Operational';
                
                // Update metrics
                const metrics = codService.querySelectorAll('.metric-value');
                if (metrics.length >= 2) {
                    metrics[1].textContent = '18ms';
                }
                
                // Show notification
                showNotification('Call of Duty Cheat is now operational', 'success');
            }, 5000);
        }
    }, 2000);
}

function showNotification(message, type = 'info') {
    const notification = document.createElement('div');
    notification.className = `notification ${type}`;
    notification.textContent = message;
    notification.style.cssText = `
        position: fixed;
        top: 100px;
        right: 24px;
        background: ${type === 'success' ? '#30d158' : '#007aff'};
        color: white;
        padding: 16px 20px;
        border-radius: 12px;
        font-weight: 500;
        z-index: 1001;
        transform: translateX(100%);
        transition: transform 0.3s ease;
        box-shadow: 0 4px 20px rgba(0, 0, 0, 0.15);
        max-width: 300px;
    `;
    
    document.body.appendChild(notification);
    
    // Animate in
    setTimeout(() => {
        notification.style.transform = 'translateX(0)';
    }, 100);
    
    // Auto remove after 5 seconds
    setTimeout(() => {
        notification.style.transform = 'translateX(100%)';
        setTimeout(() => {
            notification.remove();
        }, 300);
    }, 5000);
}

// Update overall status based on individual services
function updateOverallStatus() {
    const services = document.querySelectorAll('.service-status');
    let allOperational = true;
    let hasIssues = false;
    
    services.forEach(service => {
        if (service.classList.contains('maintenance') || service.classList.contains('degraded')) {
            hasIssues = true;
        }
        if (!service.classList.contains('operational')) {
            allOperational = false;
        }
    });
    
    const overallStatus = document.querySelector('.overall-status');
    const statusText = overallStatus.querySelector('.status-text');
    
    if (allOperational) {
        overallStatus.className = 'overall-status operational';
        statusText.textContent = 'All Systems Operational';
    } else if (hasIssues) {
        overallStatus.className = 'overall-status degraded';
        statusText.textContent = 'Some Systems Experiencing Issues';
    }
}

// Monitor for status changes and update overall status
const observer = new MutationObserver(updateOverallStatus);
observer.observe(document.querySelector('.services-status'), {
    childList: true,
    subtree: true,
    attributes: true,
    attributeFilter: ['class']
});

// Add smooth scrolling for anchor links
document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function (e) {
        e.preventDefault();
        const target = document.querySelector(this.getAttribute('href'));
        if (target) {
            target.scrollIntoView({
                behavior: 'smooth',
                block: 'start'
            });
        }
    });
});

// Add loading states for real-time updates
function showLoadingState(element) {
    element.style.opacity = '0.6';
    element.style.transition = 'opacity 0.3s ease';
}

function hideLoadingState(element) {
    element.style.opacity = '1';
}
