// DOM content loaded event
document.addEventListener('DOMContentLoaded', function() {
    initSmoothScrolling();
    initTableOfContents();
    initScrollSpy();
    initCopyToClipboard();
});

// Smooth scrolling for table of contents links
function initSmoothScrolling() {
    const tocLinks = document.querySelectorAll('.toc-link');
    
    tocLinks.forEach(link => {
        link.addEventListener('click', function(e) {
            e.preventDefault();
            
            const targetId = this.getAttribute('href').substring(1);
            const targetSection = document.getElementById(targetId);
            
            if (targetSection) {
                const offsetTop = targetSection.offsetTop - 100; // Account for sticky navbar
                
                window.scrollTo({
                    top: offsetTop,
                    behavior: 'smooth'
                });
                
                // Update URL without causing a page jump
                history.pushState(null, null, `#${targetId}`);
            }
        });
    });
}

// Table of contents functionality
function initTableOfContents() {
    const tocContainer = document.querySelector('.toc-nav');
    const sections = document.querySelectorAll('.terms-section');
    
    if (!tocContainer || sections.length === 0) return;
    
    // Add click handlers and keyboard navigation
    const tocLinks = document.querySelectorAll('.toc-link');
    
    tocLinks.forEach((link, index) => {
        // Keyboard navigation
        link.addEventListener('keydown', function(e) {
            if (e.key === 'ArrowDown' && index < tocLinks.length - 1) {
                e.preventDefault();
                tocLinks[index + 1].focus();
            } else if (e.key === 'ArrowUp' && index > 0) {
                e.preventDefault();
                tocLinks[index - 1].focus();
            }
        });
    });
}

// Scroll spy functionality
function initScrollSpy() {
    const sections = document.querySelectorAll('.terms-section');
    const tocLinks = document.querySelectorAll('.toc-link');
    
    if (sections.length === 0 || tocLinks.length === 0) return;
    
    const observerOptions = {
        rootMargin: '-20% 0px -70% 0px',
        threshold: 0
    };
    
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            const id = entry.target.getAttribute('id');
            const tocLink = document.querySelector(`.toc-link[href="#${id}"]`);
            
            if (entry.isIntersecting) {
                // Remove active class from all links
                tocLinks.forEach(link => link.classList.remove('active'));
                
                // Add active class to current link
                if (tocLink) {
                    tocLink.classList.add('active');
                }
            }
        });
    }, observerOptions);
    
    sections.forEach(section => {
        observer.observe(section);
    });
}

// Copy to clipboard functionality for contact info
function initCopyToClipboard() {
    const contactItems = document.querySelectorAll('.contact-item a');
    
    contactItems.forEach(item => {
        item.addEventListener('click', function(e) {
            if (this.href.startsWith('mailto:')) {
                e.preventDefault();
                
                const email = this.href.replace('mailto:', '');
                copyToClipboard(email);
                
                // Show temporary feedback
                showCopyFeedback(this, 'Email copied to clipboard!');
            }
        });
    });
}

// Copy text to clipboard
function copyToClipboard(text) {
    if (navigator.clipboard && window.isSecureContext) {
        // Use modern clipboard API
        navigator.clipboard.writeText(text).catch(err => {
            console.error('Failed to copy text: ', err);
            fallbackCopyToClipboard(text);
        });
    } else {
        // Fallback for older browsers
        fallbackCopyToClipboard(text);
    }
}

// Fallback copy to clipboard method
function fallbackCopyToClipboard(text) {
    const textArea = document.createElement('textarea');
    textArea.value = text;
    textArea.style.position = 'fixed';
    textArea.style.left = '-999999px';
    textArea.style.top = '-999999px';
    document.body.appendChild(textArea);
    textArea.focus();
    textArea.select();
    
    try {
        document.execCommand('copy');
    } catch (err) {
        console.error('Fallback: Failed to copy text: ', err);
    }
    
    document.body.removeChild(textArea);
}

// Show copy feedback
function showCopyFeedback(element, message) {
    const originalText = element.textContent;
    element.textContent = message;
    element.style.color = '#30d158';
    
    setTimeout(() => {
        element.textContent = originalText;
        element.style.color = '';
    }, 2000);
}

// Print functionality
function printTerms() {
    window.print();
}

// Add print button functionality if needed
document.addEventListener('keydown', function(e) {
    if ((e.ctrlKey || e.metaKey) && e.key === 'p') {
        e.preventDefault();
        printTerms();
    }
});

// Handle hash links on page load
function handleHashOnLoad() {
    const hash = window.location.hash;
    if (hash) {
        setTimeout(() => {
            const target = document.querySelector(hash);
            if (target) {
                const offsetTop = target.offsetTop - 100;
                window.scrollTo({
                    top: offsetTop,
                    behavior: 'smooth'
                });
            }
        }, 100);
    }
}

// Initialize hash handling
document.addEventListener('DOMContentLoaded', handleHashOnLoad);

// Back to top functionality
function createBackToTopButton() {
    const backToTopBtn = document.createElement('button');
    backToTopBtn.innerHTML = '↑';
    backToTopBtn.className = 'back-to-top';
    backToTopBtn.setAttribute('aria-label', 'Back to top');
    backToTopBtn.style.cssText = `
        position: fixed;
        bottom: 2rem;
        right: 2rem;
        background: linear-gradient(135deg, #007aff, #0051d5);
        color: white;
        border: none;
        border-radius: 50%;
        width: 50px;
        height: 50px;
        font-size: 1.25rem;
        cursor: pointer;
        box-shadow: 0 4px 20px rgba(0, 122, 255, 0.3);
        opacity: 0;
        visibility: hidden;
        transition: all 0.3s ease;
        z-index: 1000;
    `;
    
    document.body.appendChild(backToTopBtn);
    
    // Show/hide button based on scroll position
    window.addEventListener('scroll', () => {
        if (window.pageYOffset > 300) {
            backToTopBtn.style.opacity = '1';
            backToTopBtn.style.visibility = 'visible';
        } else {
            backToTopBtn.style.opacity = '0';
            backToTopBtn.style.visibility = 'hidden';
        }
    });
    
    // Scroll to top when clicked
    backToTopBtn.addEventListener('click', () => {
        window.scrollTo({
            top: 0,
            behavior: 'smooth'
        });
    });
    
    // Hover effects
    backToTopBtn.addEventListener('mouseenter', () => {
        backToTopBtn.style.transform = 'translateY(-2px)';
        backToTopBtn.style.boxShadow = '0 6px 25px rgba(0, 122, 255, 0.4)';
    });
    
    backToTopBtn.addEventListener('mouseleave', () => {
        backToTopBtn.style.transform = 'translateY(0)';
        backToTopBtn.style.boxShadow = '0 4px 20px rgba(0, 122, 255, 0.3)';
    });
}

// Initialize back to top button
document.addEventListener('DOMContentLoaded', createBackToTopButton);

// Search functionality (if needed later)
function initSearchFunctionality() {
    // This could be expanded to add a search feature
    // for finding specific terms within the document
    
    document.addEventListener('keydown', function(e) {
        if ((e.ctrlKey || e.metaKey) && e.key === 'f') {
            // Let browser handle native search
            // Could add custom search overlay here
        }
    });
}

// Mobile menu toggle for responsive design
function initMobileMenu() {
    // Add mobile menu functionality if needed
    const navLinks = document.querySelector('.nav-links');
    
    if (window.innerWidth <= 480 && navLinks) {
        // Could add mobile menu toggle here
    }
}

// Accessibility improvements
function initAccessibility() {
    // Add skip to content link
    const skipLink = document.createElement('a');
    skipLink.href = '#main-content';
    skipLink.textContent = 'Skip to main content';
    skipLink.className = 'skip-link';
    skipLink.style.cssText = `
        position: absolute;
        top: -40px;
        left: 6px;
        background: #007aff;
        color: white;
        padding: 8px;
        text-decoration: none;
        border-radius: 4px;
        z-index: 2000;
        transition: top 0.3s;
    `;
    
    skipLink.addEventListener('focus', () => {
        skipLink.style.top = '6px';
    });
    
    skipLink.addEventListener('blur', () => {
        skipLink.style.top = '-40px';
    });
    
    document.body.insertBefore(skipLink, document.body.firstChild);
    
    // Add main content ID
    const mainContent = document.querySelector('.terms-main');
    if (mainContent) {
        mainContent.id = 'main-content';
        mainContent.setAttribute('tabindex', '-1');
    }
}

// Initialize accessibility features
document.addEventListener('DOMContentLoaded', initAccessibility);

// Performance optimization: Debounced scroll handler
function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}

// Apply debouncing to scroll events
const debouncedScrollHandler = debounce(() => {
    // Any expensive scroll operations can go here
}, 10);

window.addEventListener('scroll', debouncedScrollHandler);

// Loading animation
window.addEventListener('load', function() {
    document.body.classList.add('loaded');
    
    // Add a subtle fade-in animation
    document.body.style.opacity = '0';
    document.body.style.transition = 'opacity 0.5s ease-in-out';
    
    setTimeout(() => {
        document.body.style.opacity = '1';
    }, 100);
});
