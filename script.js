// DOM content loaded event
document.addEventListener('DOMContentLoaded', function() {
    // Initialize all interactive components
    initTestimonialCarousel();
    initSmoothScrolling();
    initScrollAnimations();
    initNavbarScroll();
    initParallaxEffects();
});

// Testimonial Carousel Functionality
function initTestimonialCarousel() {
    const testimonials = document.querySelectorAll('.testimonial');
    const dots = document.querySelectorAll('.dot');
    const prevBtn = document.querySelector('.carousel-btn.prev');
    const nextBtn = document.querySelector('.carousel-btn.next');
    
    let currentTestimonial = 0;
    const totalTestimonials = testimonials.length;
    
    // Function to show specific testimonial
    function showTestimonial(index) {
        // Remove active class from all testimonials and dots
        testimonials.forEach(testimonial => testimonial.classList.remove('active'));
        dots.forEach(dot => dot.classList.remove('active'));
        
        // Add active class to current testimonial and dot
        testimonials[index].classList.add('active');
        dots[index].classList.add('active');
        
        currentTestimonial = index;
    }
    
    // Next testimonial function
    function nextTestimonial() {
        const next = (currentTestimonial + 1) % totalTestimonials;
        showTestimonial(next);
    }
    
    // Previous testimonial function
    function prevTestimonial() {
        const prev = (currentTestimonial - 1 + totalTestimonials) % totalTestimonials;
        showTestimonial(prev);
    }
    
    // Event listeners for navigation buttons
    if (nextBtn) nextBtn.addEventListener('click', nextTestimonial);
    if (prevBtn) prevBtn.addEventListener('click', prevTestimonial);
    
    // Event listeners for dots
    dots.forEach((dot, index) => {
        dot.addEventListener('click', () => showTestimonial(index));
    });
    
    // Auto-play carousel every 5 seconds
    setInterval(nextTestimonial, 5000);
    
    // Pause auto-play on hover
    const carousel = document.querySelector('.testimonials-carousel');
    if (carousel) {
        let autoPlayInterval = setInterval(nextTestimonial, 5000);
        
        carousel.addEventListener('mouseenter', () => {
            clearInterval(autoPlayInterval);
        });
        
        carousel.addEventListener('mouseleave', () => {
            autoPlayInterval = setInterval(nextTestimonial, 5000);
        });
    }
}

// Smooth scrolling for navigation links
function initSmoothScrolling() {
    const navLinks = document.querySelectorAll('.nav-links a[href^="#"]');
    
    navLinks.forEach(link => {
        link.addEventListener('click', function(e) {
            e.preventDefault();
            
            const targetId = this.getAttribute('href').substring(1);
            const targetSection = document.getElementById(targetId);
            
            if (targetSection) {
                const offsetTop = targetSection.offsetTop - 72; // Account for fixed navbar
                
                window.scrollTo({
                    top: offsetTop,
                    behavior: 'smooth'
                });
            }
        });
    });
    
    // Smooth scrolling for CTA buttons
    const ctaButtons = document.querySelectorAll('button[onclick], a[href^="#"]');
    ctaButtons.forEach(button => {
        if (button.textContent.includes('Explore') || button.textContent.includes('Shop')) {
            button.addEventListener('click', function(e) {
                e.preventDefault();
                const targetSection = document.getElementById('products') || document.getElementById('pricing');
                if (targetSection) {
                    const offsetTop = targetSection.offsetTop - 72;
                    window.scrollTo({
                        top: offsetTop,
                        behavior: 'smooth'
                    });
                }
            });
        }
    });
}

// Scroll-triggered animations
function initScrollAnimations() {
    const observerOptions = {
        threshold: 0.1,
        rootMargin: '0px 0px -50px 0px'
    };
    
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.style.opacity = '1';
                entry.target.style.transform = 'translateY(0)';
                
                // Special animations for specific elements
                if (entry.target.classList.contains('feature-card')) {
                    entry.target.style.animationDelay = `${Array.from(entry.target.parentNode.children).indexOf(entry.target) * 0.1}s`;
                    entry.target.style.animation = 'fadeInUp 0.8s ease-out forwards';
                }
                
                if (entry.target.classList.contains('pricing-card')) {
                    entry.target.style.animationDelay = `${Array.from(entry.target.parentNode.children).indexOf(entry.target) * 0.2}s`;
                    entry.target.style.animation = 'fadeInUp 0.8s ease-out forwards';
                }
                
                if (entry.target.classList.contains('platform-card')) {
                    entry.target.style.animationDelay = `${Array.from(entry.target.parentNode.children).indexOf(entry.target) * 0.15}s`;
                    entry.target.style.animation = 'fadeInUp 0.8s ease-out forwards';
                }
            }
        });
    }, observerOptions);
    
    // Observe elements that should animate on scroll
    const animatedElements = document.querySelectorAll('.feature-card, .pricing-card, .platform-card, .testimonial-content');
    animatedElements.forEach(el => {
        el.style.opacity = '0';
        el.style.transform = 'translateY(30px)';
        el.style.transition = 'opacity 0.8s ease-out, transform 0.8s ease-out';
        observer.observe(el);
    });
}

// Navbar scroll effects
function initNavbarScroll() {
    const navbar = document.querySelector('.navbar');
    let lastScrollTop = 0;
    
    window.addEventListener('scroll', () => {
        const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
        
        // Add background blur effect after scrolling
        if (scrollTop > 50) {
            navbar.style.background = 'rgba(255, 255, 255, 0.95)';
            navbar.style.boxShadow = '0 2px 20px rgba(0, 0, 0, 0.1)';
        } else {
            navbar.style.background = 'rgba(255, 255, 255, 0.8)';
            navbar.style.boxShadow = 'none';
        }
        
        // Hide/show navbar on scroll
        if (scrollTop > lastScrollTop && scrollTop > 100) {
            // Scrolling down
            navbar.style.transform = 'translateY(-100%)';
        } else {
            // Scrolling up
            navbar.style.transform = 'translateY(0)';
        }
        
        lastScrollTop = scrollTop;
    });
}

// Parallax effects for enhanced visual appeal
function initParallaxEffects() {
    const heroMockup = document.querySelector('.hero-mockup');
    const productInterface = document.querySelector('.product-interface');
    
    window.addEventListener('scroll', () => {
        const scrolled = window.pageYOffset;
        const parallaxSpeed = 0.5;
        
        if (heroMockup) {
            heroMockup.style.transform = `rotateY(-15deg) rotateX(5deg) translateY(${scrolled * parallaxSpeed}px)`;
        }
        
        if (productInterface && scrolled < window.innerHeight) {
            productInterface.style.transform = `perspective(1000px) rotateY(15deg) rotateX(-5deg) translateY(${scrolled * parallaxSpeed * 0.3}px)`;
        }
    });
}

// Button click animations
document.addEventListener('click', function(e) {
    if (e.target.classList.contains('btn-primary') || e.target.classList.contains('btn-secondary')) {
        // Create ripple effect
        const button = e.target;
        const ripple = document.createElement('span');
        const rect = button.getBoundingClientRect();
        const size = Math.max(rect.width, rect.height);
        const x = e.clientX - rect.left - size / 2;
        const y = e.clientY - rect.top - size / 2;
        
        ripple.style.width = ripple.style.height = size + 'px';
        ripple.style.left = x + 'px';
        ripple.style.top = y + 'px';
        ripple.classList.add('ripple');
        
        // Add ripple styles
        ripple.style.position = 'absolute';
        ripple.style.borderRadius = '50%';
        ripple.style.background = 'rgba(255, 255, 255, 0.3)';
        ripple.style.transform = 'scale(0)';
        ripple.style.animation = 'rippleEffect 0.6s linear';
        ripple.style.pointerEvents = 'none';
        
        button.appendChild(ripple);
        
        // Remove ripple after animation
        setTimeout(() => {
            ripple.remove();
        }, 600);
    }
});

// Add ripple effect CSS animation
const style = document.createElement('style');
style.textContent = `
    @keyframes rippleEffect {
        to {
            transform: scale(2);
            opacity: 0;
        }
    }
    
    .btn-primary, .btn-secondary {
        position: relative;
        overflow: hidden;
    }
`;
document.head.appendChild(style);

// Product interface interactions
function initProductInteractions() {
    const featureToggles = document.querySelectorAll('.feature-toggle');
    
    featureToggles.forEach(toggle => {
        toggle.addEventListener('click', function() {
            // Toggle active state
            this.classList.toggle('active');
            
            // Update icon and status
            const icon = this.querySelector('.toggle-icon');
            const status = this.querySelector('.toggle-status');
            
            if (this.classList.contains('active')) {
                icon.textContent = '◉';
                status.textContent = 'Active';
            } else {
                icon.textContent = '○';
                status.textContent = 'Standby';
            }
            
            // Add click animation
            this.style.transform = 'scale(0.98)';
            setTimeout(() => {
                this.style.transform = 'scale(1)';
            }, 150);
        });
    });
}

// Initialize product interactions when DOM is loaded
document.addEventListener('DOMContentLoaded', initProductInteractions);

// Keyboard navigation for accessibility
document.addEventListener('keydown', function(e) {
    if (e.key === 'ArrowLeft' || e.key === 'ArrowRight') {
        const carousel = document.querySelector('.testimonials-carousel');
        if (carousel && document.activeElement.closest('.testimonials-carousel')) {
            e.preventDefault();
            
            if (e.key === 'ArrowLeft') {
                document.querySelector('.carousel-btn.prev')?.click();
            } else {
                document.querySelector('.carousel-btn.next')?.click();
            }
        }
    }
});

// Form interactions (if any forms are added later)
function initFormInteractions() {
    const inputs = document.querySelectorAll('input, textarea');
    
    inputs.forEach(input => {
        input.addEventListener('focus', function() {
            this.parentElement.classList.add('focused');
        });
        
        input.addEventListener('blur', function() {
            if (!this.value) {
                this.parentElement.classList.remove('focused');
            }
        });
    });
}

// Loading animation for page load
window.addEventListener('load', function() {
    document.body.classList.add('loaded');
    
    // Add a subtle fade-in animation to the entire page
    document.body.style.opacity = '0';
    document.body.style.transition = 'opacity 0.5s ease-in-out';
    
    setTimeout(() => {
        document.body.style.opacity = '1';
    }, 100);
});

// Mobile menu toggle (for responsive design)
function initMobileMenu() {
    const mobileMenuBtn = document.querySelector('.mobile-menu-btn');
    const navLinks = document.querySelector('.nav-links');
    
    if (mobileMenuBtn && navLinks) {
        mobileMenuBtn.addEventListener('click', function() {
            navLinks.classList.toggle('active');
            this.classList.toggle('active');
        });
    }
}

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

// Apply debouncing to scroll events for better performance
const debouncedScrollHandler = debounce(() => {
    // Any expensive scroll operations can go here
}, 10);

window.addEventListener('scroll', debouncedScrollHandler);