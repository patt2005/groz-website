// GROZ APPS - Interactive JavaScript
document.addEventListener('DOMContentLoaded', function() {
    
    // Navbar scroll effect
    const navbar = document.querySelector('.navbar');
    
    window.addEventListener('scroll', () => {
        if (window.scrollY > 100) {
            navbar.style.background = 'rgba(10, 10, 10, 0.98)';
            navbar.style.boxShadow = '0 10px 30px rgba(0, 0, 0, 0.3)';
        } else {
            navbar.style.background = 'rgba(10, 10, 10, 0.95)';
            navbar.style.boxShadow = 'none';
        }
    });

    // Mobile navigation toggle
    const navToggle = document.querySelector('.nav-toggle');
    const navMenu = document.querySelector('.nav-menu');
    
    if (navToggle) {
        navToggle.addEventListener('click', () => {
            navMenu.classList.toggle('active');
            navToggle.classList.toggle('active');
        });
    }

    // Smooth scrolling for navigation links
    const navLinks = document.querySelectorAll('.nav-link');
    
    navLinks.forEach(link => {
        link.addEventListener('click', (e) => {
            e.preventDefault();
            const targetId = link.getAttribute('href');
            const targetSection = document.querySelector(targetId);
            
            if (targetSection) {
                const offsetTop = targetSection.offsetTop - 80;
                window.scrollTo({
                    top: offsetTop,
                    behavior: 'smooth'
                });
            }
        });
    });

    // Advanced GSAP ScrollTrigger animations
    function initScrollAnimations() {
        console.log('🎯 === SCROLLTRIGGER DEBUG ===');
        console.log('GSAP available:', typeof gsap);
        console.log('ScrollTrigger available:', typeof ScrollTrigger);
        
        if (typeof gsap === 'undefined' || !gsap.registerPlugin) {
            console.error('❌ GSAP not available for ScrollTrigger');
            return;
        }
        
        gsap.registerPlugin(ScrollTrigger);
        console.log('✅ ScrollTrigger registered');
        
        // Simple test animation first
        console.log('Testing basic ScrollTrigger...');
        
        const heroElement = document.querySelector('.hero');
        const heroTitle = document.querySelector('.hero-title');
        
        console.log('Hero element found:', !!heroElement);
        console.log('Hero title found:', !!heroTitle);
        
        if (heroTitle) {
            console.log('Creating simple ScrollTrigger for hero title...');
            
            gsap.to('.hero-title', {
                scrollTrigger: {
                    trigger: '.hero-title',
                    start: 'top 80%',
                    end: 'bottom 20%',
                    markers: true,
                    onEnter: () => console.log('🎯 Hero title entered!'),
                    onLeave: () => console.log('🎯 Hero title left!'),
                    onUpdate: (self) => console.log('🎯 Hero progress:', self.progress)
                },
                x: 100,
                duration: 2,
                ease: 'power2.out'
            });
            
            console.log('✅ Basic ScrollTrigger created');
        }
        
        // Test service cards animation
        console.log('Testing service cards...');
        const serviceCards = document.querySelectorAll('.service-card');
        console.log('Service cards found:', serviceCards.length);
        
        if (serviceCards.length > 0) {
            gsap.from('.service-card', {
                scrollTrigger: {
                    trigger: '.services-grid',
                    start: 'top 80%',
                    markers: true,
                    onEnter: () => console.log('🎯 Services entered!')
                },
                y: 50,
                opacity: 0,
                duration: 1,
                stagger: 0.2,
                ease: 'power2.out'
            });
            console.log('✅ Service cards animation created');
        }
    }

    // Service cards hover effect with tilt
    const serviceCards = document.querySelectorAll('.service-card');
    
    serviceCards.forEach(card => {
        card.addEventListener('mouseenter', (e) => {
            const rect = card.getBoundingClientRect();
            const centerX = rect.left + rect.width / 2;
            const centerY = rect.top + rect.height / 2;
            
            card.style.transform = 'translateY(-10px) rotateX(5deg) rotateY(5deg)';
            card.style.transition = 'all 0.3s ease';
        });
        
        card.addEventListener('mousemove', (e) => {
            const rect = card.getBoundingClientRect();
            const centerX = rect.left + rect.width / 2;
            const centerY = rect.top + rect.height / 2;
            
            const rotateX = (e.clientY - centerY) / 10;
            const rotateY = (centerX - e.clientX) / 10;
            
            card.style.transform = `translateY(-10px) rotateX(${rotateX}deg) rotateY(${rotateY}deg)`;
        });
        
        card.addEventListener('mouseleave', () => {
            card.style.transform = 'translateY(0) rotateX(0) rotateY(0)';
        });
    });

    // Driving animation controller
    class DrivingAnimation {
        constructor() {
            this.car = document.querySelector('.lamborghini');
            this.road = document.querySelector('.road');
            this.animationSection = document.querySelector('.driving-animation');
            this.isAnimating = false;
            
            this.init();
        }
        
        init() {
            const animationObserver = new IntersectionObserver((entries) => {
                entries.forEach(entry => {
                    if (entry.isIntersecting && !this.isAnimating) {
                        this.startAnimation();
                    } else if (!entry.isIntersecting && this.isAnimating) {
                        this.stopAnimation();
                    }
                });
            }, {
                threshold: 0.5
            });
            
            if (this.animationSection) {
                animationObserver.observe(this.animationSection);
            }
        }
        
        startAnimation() {
            this.isAnimating = true;
            
            // Enhanced car movement
            this.animateCar();
            
            // Road speed effect
            this.animateRoad();
            
            // Sound effect simulation (visual feedback)
            this.pulseEffect();
        }
        
        stopAnimation() {
            this.isAnimating = false;
        }
        
        animateCar() {
            if (!this.car) return;
            
            let position = 10;
            const speed = 0.5;
            
            const movecar = () => {
                if (!this.isAnimating) return;
                
                position += speed;
                if (position > 90) {
                    position = -10;
                }
                
                this.car.parentElement.style.left = position + '%';
                
                // Add random bounce effect
                const bounce = Math.sin(Date.now() * 0.01) * 5;
                this.car.style.transform = `translateY(${bounce}px) rotate(${Math.sin(Date.now() * 0.005) * 2}deg)`;
                
                requestAnimationFrame(movecar);
            };
            
            movecar();
        }
        
        animateRoad() {
            const roadMarkings = document.querySelector('.road::before');
            
            // Speed up road animation when car is visible
            if (this.road) {
                this.road.style.setProperty('--road-speed', '0.8s');
            }
        }
        
        pulseEffect() {
            if (!this.car) return;
            
            const pulse = () => {
                if (!this.isAnimating) return;
                
                const intensity = 0.5 + Math.sin(Date.now() * 0.01) * 0.3;
                this.car.style.filter = `drop-shadow(0 0 ${20 + intensity * 20}px rgba(255, 107, 53, ${intensity}))`;
                
                requestAnimationFrame(pulse);
            };
            
            pulse();
        }
    }

    // Particle system for hero background
    class ParticleSystem {
        constructor() {
            this.canvas = document.createElement('canvas');
            this.ctx = this.canvas.getContext('2d');
            this.particles = [];
            this.animationId = null;
            
            this.init();
        }
        
        init() {
            this.canvas.style.position = 'absolute';
            this.canvas.style.top = '0';
            this.canvas.style.left = '0';
            this.canvas.style.width = '100%';
            this.canvas.style.height = '100%';
            this.canvas.style.pointerEvents = 'none';
            this.canvas.style.zIndex = '1';
            
            const hero = document.querySelector('.hero');
            if (hero) {
                hero.appendChild(this.canvas);
                this.resize();
                this.createParticles();
                this.animate();
            }
            
            window.addEventListener('resize', () => this.resize());
        }
        
        resize() {
            this.canvas.width = window.innerWidth;
            this.canvas.height = window.innerHeight;
        }
        
        createParticles() {
            for (let i = 0; i < 50; i++) {
                this.particles.push({
                    x: Math.random() * this.canvas.width,
                    y: Math.random() * this.canvas.height,
                    vx: (Math.random() - 0.5) * 0.5,
                    vy: (Math.random() - 0.5) * 0.5,
                    size: Math.random() * 2 + 1,
                    opacity: Math.random() * 0.5 + 0.2
                });
            }
        }
        
        animate() {
            this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
            
            this.particles.forEach(particle => {
                particle.x += particle.vx;
                particle.y += particle.vy;
                
                if (particle.x < 0 || particle.x > this.canvas.width) particle.vx *= -1;
                if (particle.y < 0 || particle.y > this.canvas.height) particle.vy *= -1;
                
                this.ctx.beginPath();
                this.ctx.arc(particle.x, particle.y, particle.size, 0, Math.PI * 2);
                this.ctx.fillStyle = `rgba(255, 107, 53, ${particle.opacity})`;
                this.ctx.fill();
            });
            
            this.animationId = requestAnimationFrame(() => this.animate());
        }
    }

    // Counter animation for stats
    function animateCounters() {
        const counters = document.querySelectorAll('.stat h3');
        
        counters.forEach(counter => {
            const target = parseInt(counter.textContent.replace(/\D/g, ''));
            const suffix = counter.textContent.replace(/[0-9]/g, '');
            let count = 0;
            const increment = target / 100;
            
            const timer = setInterval(() => {
                count += increment;
                if (count >= target) {
                    counter.textContent = target + suffix;
                    clearInterval(timer);
                } else {
                    counter.textContent = Math.floor(count) + suffix;
                }
            }, 20);
        });
    }

    // GSAP Hero animations
    function initGSAPAnimations() {
        if (typeof gsap === 'undefined') return;
        
        // Hero title animation
        const heroTitle = document.querySelector('.hero-title');
        const heroSubtitle = document.querySelector('.hero-subtitle');
        const heroDescription = document.querySelector('.hero-description');
        const heroButtons = document.querySelector('.hero-buttons');
        const carContainer = document.querySelector('.car-3d-container');
        
        if (heroTitle) {
            gsap.from(heroTitle, {
                duration: 1,
                y: 50,
                opacity: 0,
                ease: "power2.out"
            });
        }
        
        if (heroSubtitle) {
            gsap.from(heroSubtitle, {
                duration: 1,
                y: 30,
                opacity: 0,
                delay: 0.2,
                ease: "power2.out"
            });
        }
        
        if (heroDescription) {
            gsap.from(heroDescription, {
                duration: 1,
                y: 20,
                opacity: 0,
                delay: 0.4,
                ease: "power2.out"
            });
        }
        
        if (heroButtons) {
            gsap.from(heroButtons, {
                duration: 1,
                y: 20,
                opacity: 0,
                delay: 0.6,
                ease: "power2.out"
            });
        }
        
        if (carContainer) {
            gsap.from(carContainer, {
                duration: 1.5,
                scale: 0.8,
                opacity: 0,
                delay: 0.8,
                ease: "back.out(1.7)"
            });
            
            // Continuous pulse effect for the car
            gsap.to(carContainer, {
                scale: 1.05,
                duration: 2,
                yoyo: true,
                repeat: -1,
                ease: "power2.inOut"
            });
        }
    }

    // Driving animation removed - no more Lamborghini in driving section

    // Form handling
    const contactForm = document.querySelector('.contact-form form');
    if (contactForm) {
        contactForm.addEventListener('submit', (e) => {
            e.preventDefault();
            
            // Simulate form submission
            const button = contactForm.querySelector('.btn-primary');
            const originalText = button.textContent;
            
            button.textContent = 'Sending...';
            button.disabled = true;
            
            setTimeout(() => {
                button.textContent = 'Message Sent!';
                button.style.background = 'linear-gradient(135deg, #00d4ff 0%, #0099cc 100%)';
                
                setTimeout(() => {
                    button.textContent = originalText;
                    button.disabled = false;
                    button.style.background = '';
                    contactForm.reset();
                }, 2000);
            }, 1500);
        });
    }

    // Initialize GSAP animations
    console.log('🚀 Initializing all GSAP animations...');
    initGSAPAnimations();
    initScrollAnimations();
    
    // Driving animation initialization removed
    
    // Initialize other animations
    const drivingAnimation = new DrivingAnimation();
    const particleSystem = new ParticleSystem();
    
    // Simple Animate.css driving effect
    const drivingLamborghini = document.getElementById('driving-lamborghini');
    
    if (drivingLamborghini) {
        // Add pulsing light effect to the model viewer
        setInterval(() => {
            const currentExposure = parseFloat(drivingLamborghini.getAttribute('exposure') || '3.0');
            const newExposure = currentExposure === 3.0 ? 4.5 : 3.0;
            drivingLamborghini.setAttribute('exposure', newExposure);
        }, 1500);
    }
    
    // Stats counter animation is now handled by GSAP ScrollTrigger

    // Add loading animation
    window.addEventListener('load', () => {
        document.body.style.opacity = '0';
        setTimeout(() => {
            document.body.style.transition = 'opacity 0.5s ease';
            document.body.style.opacity = '1';
        }, 100);
    });

    // Enhanced scroll effects
    let lastScrollTop = 0;
    window.addEventListener('scroll', () => {
        const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
        const scrollDirection = scrollTop > lastScrollTop ? 'down' : 'up';
        
        // Parallax effect for hero
        const hero = document.querySelector('.hero');
        if (hero && scrollTop < window.innerHeight) {
            const speed = scrollTop * 0.5;
            hero.style.transform = `translateY(${speed}px)`;
        }
        
        // Hide/show navbar based on scroll direction
        if (scrollTop > 100) {
            if (scrollDirection === 'down' && scrollTop > lastScrollTop + 10) {
                navbar.style.transform = 'translateY(-100%)';
            } else if (scrollDirection === 'up') {
                navbar.style.transform = 'translateY(0)';
            }
        } else {
            navbar.style.transform = 'translateY(0)';
        }
        
        lastScrollTop = scrollTop;
    });

    // Add CSS for navigation menu
    const style = document.createElement('style');
    style.textContent = `
        .nav-menu.active {
            display: flex;
            flex-direction: column;
            position: absolute;
            top: 100%;
            left: 0;
            width: 100%;
            background: var(--bg-dark);
            padding: 20px;
            box-shadow: 0 10px 30px rgba(0, 0, 0, 0.3);
        }
        
        .nav-toggle.active span:nth-child(1) {
            transform: rotate(45deg) translate(5px, 5px);
        }
        
        .nav-toggle.active span:nth-child(2) {
            opacity: 0;
        }
        
        .nav-toggle.active span:nth-child(3) {
            transform: rotate(-45deg) translate(7px, -6px);
        }
    `;
    document.head.appendChild(style);
});

// Advanced cursor effect
document.addEventListener('mousemove', (e) => {
    const cursor = document.querySelector('.custom-cursor') || createCursor();
    cursor.style.left = e.clientX + 'px';
    cursor.style.top = e.clientY + 'px';
});

function createCursor() {
    const cursor = document.createElement('div');
    cursor.className = 'custom-cursor';
    cursor.style.cssText = `
        position: fixed;
        width: 20px;
        height: 20px;
        background: radial-gradient(circle, rgba(255,107,53,0.8) 0%, rgba(255,107,53,0) 70%);
        border-radius: 50%;
        pointer-events: none;
        z-index: 9999;
        mix-blend-mode: difference;
        transition: all 0.1s ease;
    `;
    document.body.appendChild(cursor);
    return cursor;
}