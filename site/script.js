// Mobile Navigation Toggle
document.addEventListener('DOMContentLoaded', function() {
    const navToggle = document.querySelector('.nav-toggle');
    const navMenu = document.querySelector('.nav-menu');
    const navLinks = document.querySelectorAll('.nav-link');

    // Mobile menu toggle
    navToggle.addEventListener('click', function() {
        navMenu.classList.toggle('active');
        navToggle.classList.toggle('active');
    });

    // Close mobile menu when clicking on a link
    navLinks.forEach(link => {
        link.addEventListener('click', () => {
            navMenu.classList.remove('active');
            navToggle.classList.remove('active');
        });
    });

    // Smooth scrolling for navigation links
    navLinks.forEach(link => {
        link.addEventListener('click', function(e) {
            const href = this.getAttribute('href');

            if (href.startsWith('#') && href !== '#') {
                e.preventDefault();
                const targetSection = document.querySelector(href);

                if (targetSection) {
                    const offsetTop = targetSection.offsetTop - 70; // Account for fixed navbar

                    window.scrollTo({
                        top: offsetTop,
                        behavior: 'smooth'
                    });
                }
            }
        });
    });

    // Navbar background on scroll
    const navbar = document.querySelector('.navbar');
    let lastScrollTop = 0;

    window.addEventListener('scroll', function() {
        const scrollTop = window.pageYOffset || document.documentElement.scrollTop;

        if (scrollTop > 100) {
            navbar.style.background = 'rgba(10, 10, 10, 0.98)';
            navbar.style.borderBottom = '1px solid #333';
        } else {
            navbar.style.background = 'rgba(10, 10, 10, 0.95)';
            navbar.style.borderBottom = '1px solid transparent';
        }

        lastScrollTop = scrollTop <= 0 ? 0 : scrollTop;
    });

    // Intersection Observer for scroll animations
    const observerOptions = {
        threshold: 0.1,
        rootMargin: '0px 0px -50px 0px'
    };

    const observer = new IntersectionObserver(function(entries) {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('visible');

                // Animate feature cards when they come into view
                const featureCards = entry.target.querySelectorAll('.feature-card');
                featureCards.forEach((card, index) => {
                    setTimeout(() => {
                        card.style.animation = `fadeInUp 0.6s ease-out forwards`;
                    }, index * 100);
                });
            }
        });
    }, observerOptions);

    // Observe all feature sections
    const featureSections = document.querySelectorAll('.feature-section');
    featureSections.forEach(section => {
        observer.observe(section);
    });

    // Animate feature cards on features overview
    const featureCards = document.querySelectorAll('.feature-card');
    const cardsObserver = new IntersectionObserver(function(entries) {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                const cards = entry.target.querySelectorAll('.feature-card');
                cards.forEach((card, index) => {
                    setTimeout(() => {
                        card.style.transform = 'translateY(0)';
                        card.style.opacity = '1';
                    }, index * 150);
                });
            }
        });
    });

    const featuresSection = document.querySelector('.features');
    if (featuresSection) {
        cardsObserver.observe(featuresSection);
    }

    // Typing effect for hero title - DISABLED to preserve gradient HTML
    // const heroTitle = document.querySelector('.hero-title');
    // const originalText = heroTitle.innerHTML;

    // function typeWriter(element, text, speed = 50) {
    //     let i = 0;
    //     element.innerHTML = '';

    //     function type() {
    //         if (i < text.length) {
    //             element.innerHTML += text.charAt(i);
    //             i++;
    //             setTimeout(type, speed);
    //         }
    //     }

    //     type();
    // }

    // Start typing effect when hero is visible - DISABLED
    // const heroObserver = new IntersectionObserver(function(entries) {
    //     entries.forEach(entry => {
    //         if (entry.isIntersecting) {
    //             setTimeout(() => {
    //                 typeWriter(heroTitle, originalText, 30);
    //             }, 500);
    //         }
    //     });
    // });

    // const heroSection = document.querySelector('.hero');
    // if (heroSection) {
    //     heroObserver.observe(heroSection);
    // }

    // Parallax effect for hero background
    window.addEventListener('scroll', function() {
        const scrolled = window.pageYOffset;
        const heroSection = document.querySelector('.hero');
        const parallaxOverlay = heroSection?.querySelector(':before');

        if (heroSection) {
            const offset = Math.min(scrolled * 0.25, 200);
            heroSection.style.setProperty('--parallax-offset', `${offset * -1}px`);
        }
    });

    // Demo image hover effects
    const demoContainers = document.querySelectorAll('.demo-container');

    demoContainers.forEach(container => {
        container.addEventListener('mouseenter', function() {
            this.style.transform = 'scale(1.02)';
            this.style.transition = 'transform 0.3s ease';
        });

        container.addEventListener('mouseleave', function() {
            this.style.transform = 'scale(1)';
        });
    });

    // Feature card click handlers
    featureCards.forEach(card => {
        card.addEventListener('click', function() {
            const section = this.dataset.section;
            if (section) {
                const targetSection = document.getElementById(section);
                if (targetSection) {
                    targetSection.scrollIntoView({ behavior: 'smooth' });
                }
            }
        });
    });

    // Add click effect to buttons
    const buttons = document.querySelectorAll('.btn');

    buttons.forEach(button => {
        button.addEventListener('click', function(e) {
            // Create ripple effect
            const ripple = document.createElement('span');
            const rect = this.getBoundingClientRect();
            const size = Math.max(rect.width, rect.height);
            const x = e.clientX - rect.left - size / 2;
            const y = e.clientY - rect.top - size / 2;

            ripple.style.width = ripple.style.height = size + 'px';
            ripple.style.left = x + 'px';
            ripple.style.top = y + 'px';
            ripple.classList.add('ripple');

            this.appendChild(ripple);

            setTimeout(() => {
                ripple.remove();
            }, 600);
        });
    });

    // Contact card hover effects
    const contactCards = document.querySelectorAll('.contact-card');

    contactCards.forEach(card => {
        card.addEventListener('mouseenter', function() {
            const icon = this.querySelector('.contact-icon');
            if (icon) {
                icon.style.transform = 'scale(1.1) rotate(5deg)';
                icon.style.transition = 'transform 0.3s ease';
            }
        });

        card.addEventListener('mouseleave', function() {
            const icon = this.querySelector('.contact-icon');
            if (icon) {
                icon.style.transform = 'scale(1) rotate(0deg)';
            }
        });
    });

    // Code window animation
    const codeContent = document.querySelector('.code-content');

    if (codeContent) {
        const codeLines = codeContent.querySelectorAll('.code-line');

        codeLines.forEach((line, index) => {
            line.style.opacity = '0';
            line.style.transform = 'translateX(-20px)';

            setTimeout(() => {
                line.style.transition = 'all 0.3s ease';
                line.style.opacity = '1';
                line.style.transform = 'translateX(0)';
            }, 1000 + (index * 100));
        });
    }

    // Integration diagram animation
    const integrationNodes = document.querySelectorAll('.integration-node');

    integrationNodes.forEach((node, index) => {
        node.style.opacity = '0';
        node.style.transform = 'translateY(20px)';

        setTimeout(() => {
            node.style.transition = 'all 0.5s ease';
            node.style.opacity = '1';
            node.style.transform = 'translateY(0)';
        }, 1500 + (index * 200));
    });

    // Add loading animation
    window.addEventListener('load', function() {
        document.body.classList.add('loaded');

        // Animate hero elements
        const heroText = document.querySelector('.hero-text');
        const heroVisual = document.querySelector('.hero-visual');

        if (heroText) {
            heroText.style.animation = 'fadeInUp 0.8s ease-out forwards';
        }

        if (heroVisual) {
            heroVisual.style.animation = 'fadeInUp 0.8s ease-out 0.2s forwards';
        }
    });

    // Performance optimization: Throttle scroll events
    let ticking = false;

    function updateScrollEffects() {
        // Add any scroll-based animations here
        ticking = false;
    }

    window.addEventListener('scroll', function() {
        if (!ticking) {
            requestAnimationFrame(updateScrollEffects);
            ticking = true;
        }
    });

    // Add CSS for ripple effect
    const style = document.createElement('style');
    style.textContent = `
        .btn {
            position: relative;
            overflow: hidden;
        }

        .ripple {
            position: absolute;
            border-radius: 50%;
            background: rgba(255, 255, 255, 0.3);
            transform: scale(0);
            animation: ripple-animation 0.6s linear;
            pointer-events: none;
        }

        @keyframes ripple-animation {
            to {
                transform: scale(4);
                opacity: 0;
            }
        }

        .loaded .hero-text {
            animation: fadeInUp 0.8s ease-out forwards;
        }

        .loaded .hero-visual {
            animation: fadeInUp 0.8s ease-out 0.2s forwards;
        }

        @media (max-width: 768px) {
            .nav-menu {
                position: fixed;
                left: -100%;
                top: 70px;
                flex-direction: column;
                background-color: rgba(10, 10, 10, 0.98);
                width: 100%;
                text-align: center;
                transition: 0.3s;
                box-shadow: 0 10px 27px rgba(0, 0, 0, 0.05);
                padding: 2rem 0;
                backdrop-filter: blur(10px);
            }

            .nav-menu.active {
                left: 0;
            }

            .nav-toggle.active span:nth-child(1) {
                transform: rotate(-45deg) translate(-5px, 6px);
            }

            .nav-toggle.active span:nth-child(2) {
                opacity: 0;
            }

            .nav-toggle.active span:nth-child(3) {
                transform: rotate(45deg) translate(-5px, -6px);
            }
        }
    `;
    document.head.appendChild(style);
});

// Additional utility functions
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

function throttle(func, limit) {
    let inThrottle;
    return function() {
        const args = arguments;
        const context = this;
        if (!inThrottle) {
            func.apply(context, args);
            inThrottle = true;
            setTimeout(() => inThrottle = false, limit);
        }
    }
}

// Add some easter eggs for techies
console.log(`
╔══════════════════════════════════════╗
║           Welcome to promptLM        ║
║   🚀 The Future of Prompt Engineering ║
║                                      ║
║  Built with ❤️ for developers who    ║
║  love clean code and powerful tools  ║
╚══════════════════════════════════════╝
`);

// Developer mode check
if (window.location.search.includes('dev=1')) {
    document.body.classList.add('dev-mode');
    console.log('🔧 Developer mode activated!');
}
