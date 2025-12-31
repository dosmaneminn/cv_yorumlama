/* ========================================
   STUDIO48 CROSSFIT - JAVASCRIPT
   Professional Animations with GSAP
   ======================================== */

document.addEventListener('DOMContentLoaded', function () {
    // Initialize all modules
    initPreloader();
    initMobileMenu();
    initHeaderScroll();
    initSmoothScroll();
    initScheduleTabs();
    initFormLabels();
    initFormValidation();
    initActiveNavLink();
    initParticles();
    initTiltCards();

    // Initialize GSAP animations after preloader
    setTimeout(initGSAPAnimations, 500);
});

/* ========================================
   PRELOADER
   ======================================== */
function initPreloader() {
    const preloader = document.getElementById('preloader');
    if (!preloader) return;

    window.addEventListener('load', function () {
        setTimeout(() => {
            preloader.classList.add('hidden');
        }, 800);
    });

    // Fallback - hide after max 3 seconds
    setTimeout(() => {
        preloader.classList.add('hidden');
    }, 3000);
}

/* ========================================
   GSAP ANIMATIONS
   ======================================== */
function initGSAPAnimations() {
    if (typeof gsap === 'undefined' || typeof ScrollTrigger === 'undefined') return;

    gsap.registerPlugin(ScrollTrigger);

    // Hero animations
    const heroElements = document.querySelectorAll('[data-animate]');
    gsap.fromTo(heroElements,
        { opacity: 0, y: 50 },
        {
            opacity: 1,
            y: 0,
            duration: 0.8,
            stagger: 0.15,
            ease: 'power3.out'
        }
    );

    // Stats counter animation
    const statNumbers = document.querySelectorAll('.stat-number[data-count]');
    statNumbers.forEach(stat => {
        const target = parseInt(stat.dataset.count);

        ScrollTrigger.create({
            trigger: stat,
            start: 'top 80%',
            onEnter: () => {
                gsap.to(stat, {
                    innerHTML: target,
                    duration: 2,
                    ease: 'power2.out',
                    snap: { innerHTML: 1 },
                    onUpdate: function () {
                        stat.innerHTML = Math.floor(this.targets()[0].innerHTML);
                    }
                });
            },
            once: true
        });
    });

    // Section animations
    const animateSections = [
        '.about-content',
        '.about-image-wrapper',
        '.trainer-card',
        '.schedule-card',
        '.contact-item',
        '.about-feature',
        '.cta-content'
    ];

    animateSections.forEach(selector => {
        gsap.utils.toArray(selector).forEach((el, i) => {
            gsap.fromTo(el,
                { opacity: 0, y: 30 },
                {
                    opacity: 1,
                    y: 0,
                    duration: 0.6,
                    delay: i * 0.1,
                    ease: 'power2.out',
                    scrollTrigger: {
                        trigger: el,
                        start: 'top 85%',
                        toggleActions: 'play none none none'
                    }
                }
            );
        });
    });

    // Parallax effect on hero gradient
    gsap.to('.hero-gradient', {
        yPercent: 30,
        ease: 'none',
        scrollTrigger: {
            trigger: '.hero',
            start: 'top top',
            end: 'bottom top',
            scrub: true
        }
    });
}

/* ========================================
   MOBILE MENU
   ======================================== */
function initMobileMenu() {
    const hamburger = document.getElementById('hamburger');
    const nav = document.getElementById('nav');
    const navLinks = document.querySelectorAll('.nav-link');

    if (!hamburger || !nav) return;

    hamburger.addEventListener('click', function () {
        this.classList.toggle('active');
        nav.classList.toggle('active');
        document.body.style.overflow = nav.classList.contains('active') ? 'hidden' : '';
    });

    navLinks.forEach(link => {
        link.addEventListener('click', () => {
            hamburger.classList.remove('active');
            nav.classList.remove('active');
            document.body.style.overflow = '';
        });
    });

    // Close on outside click
    document.addEventListener('click', (e) => {
        if (!nav.contains(e.target) && !hamburger.contains(e.target) && nav.classList.contains('active')) {
            hamburger.classList.remove('active');
            nav.classList.remove('active');
            document.body.style.overflow = '';
        }
    });
}

/* ========================================
   HEADER SCROLL
   ======================================== */
function initHeaderScroll() {
    const header = document.getElementById('header');
    if (!header) return;

    const onScroll = () => {
        if (window.pageYOffset > 50) {
            header.classList.add('scrolled');
        } else {
            header.classList.remove('scrolled');
        }
    };

    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll();
}

/* ========================================
   SMOOTH SCROLL
   ======================================== */
function initSmoothScroll() {
    document.querySelectorAll('a[href^="#"]').forEach(link => {
        link.addEventListener('click', function (e) {
            const href = this.getAttribute('href');
            if (href === '#') return;

            const target = document.querySelector(href);
            if (!target) return;

            e.preventDefault();

            const headerHeight = document.getElementById('header')?.offsetHeight || 0;
            const targetPosition = target.getBoundingClientRect().top + window.pageYOffset - headerHeight;

            window.scrollTo({
                top: targetPosition,
                behavior: 'smooth'
            });
        });
    });
}

/* ========================================
   SCHEDULE TABS
   ======================================== */
function initScheduleTabs() {
    const tabs = document.querySelectorAll('.schedule-tab');
    const contents = document.querySelectorAll('.schedule-content');

    if (!tabs.length || !contents.length) return;

    tabs.forEach(tab => {
        tab.addEventListener('click', function () {
            const day = this.dataset.day;

            // Update tabs
            tabs.forEach(t => t.classList.remove('active'));
            this.classList.add('active');

            // Update content
            contents.forEach(c => c.classList.remove('active'));
            document.getElementById(day)?.classList.add('active');

            // Re-animate cards
            if (typeof gsap !== 'undefined') {
                gsap.fromTo(`#${day} .schedule-card`,
                    { opacity: 0, y: 20 },
                    { opacity: 1, y: 0, duration: 0.4, stagger: 0.05 }
                );
            }
        });
    });
}

/* ========================================
   FORM LABELS (Floating)
   ======================================== */
function initFormLabels() {
    const formGroups = document.querySelectorAll('.form-group');

    formGroups.forEach(group => {
        const input = group.querySelector('input, textarea, select');
        const label = group.querySelector('label');

        if (!input || !label) return;

        // Check initial value
        if (input.value) {
            label.classList.add('active');
        }

        input.addEventListener('focus', () => label.classList.add('active'));
        input.addEventListener('blur', () => {
            if (!input.value) label.classList.remove('active');
        });
    });
}

/* ========================================
   FORM VALIDATION
   ======================================== */
function initFormValidation() {
    const form = document.getElementById('contactForm');
    if (!form) return;

    form.addEventListener('submit', function (e) {
        e.preventDefault();

        const name = document.getElementById('name').value.trim();
        const email = document.getElementById('email').value.trim();

        if (!name || !email) {
            showNotification('Lütfen gerekli alanları doldurun.', 'error');
            return;
        }

        if (!isValidEmail(email)) {
            showNotification('Geçerli bir e-posta adresi girin.', 'error');
            return;
        }

        showNotification('Mesajınız gönderildi! En kısa sürede dönüş yapacağız.', 'success');
        form.reset();
    });
}

function isValidEmail(email) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

function showNotification(message, type) {
    const existing = document.querySelector('.notification');
    if (existing) existing.remove();

    const notification = document.createElement('div');
    notification.className = `notification notification-${type}`;
    notification.innerHTML = `
        <span>${message}</span>
        <button onclick="this.parentElement.remove()">&times;</button>
    `;

    Object.assign(notification.style, {
        position: 'fixed',
        bottom: '20px',
        right: '20px',
        maxWidth: '350px',
        padding: '1rem 1.25rem',
        background: type === 'success' ? '#27AE60' : '#E74C3C',
        color: 'white',
        borderRadius: '8px',
        display: 'flex',
        alignItems: 'center',
        gap: '1rem',
        zIndex: '9999',
        animation: 'slideIn 0.3s ease',
        boxShadow: '0 10px 40px rgba(0,0,0,0.3)'
    });

    // Add animation styles
    if (!document.getElementById('notification-styles')) {
        const style = document.createElement('style');
        style.id = 'notification-styles';
        style.textContent = `
            @keyframes slideIn { from { transform: translateX(100%); opacity: 0; } to { transform: translateX(0); opacity: 1; } }
            .notification button { background: none; border: none; color: white; font-size: 1.25rem; cursor: pointer; opacity: 0.8; }
            .notification button:hover { opacity: 1; }
        `;
        document.head.appendChild(style);
    }

    document.body.appendChild(notification);

    setTimeout(() => {
        if (notification.parentNode) notification.remove();
    }, 5000);
}

/* ========================================
   ACTIVE NAV LINK
   ======================================== */
function initActiveNavLink() {
    const sections = document.querySelectorAll('section[id]');
    const navLinks = document.querySelectorAll('.nav-link');

    if (!sections.length || !navLinks.length) return;

    const onScroll = () => {
        const headerHeight = document.getElementById('header')?.offsetHeight || 0;
        let current = '';

        sections.forEach(section => {
            const sectionTop = section.offsetTop - headerHeight - 100;
            if (window.pageYOffset >= sectionTop) {
                current = section.getAttribute('id');
            }
        });

        navLinks.forEach(link => {
            link.classList.toggle('active', link.getAttribute('href') === `#${current}`);
        });
    };

    window.addEventListener('scroll', onScroll, { passive: true });
}

/* ========================================
   PARTICLES (Minimal)
   ======================================== */
function initParticles() {
    const container = document.getElementById('particles');
    if (!container) return;

    const particleCount = 30;

    for (let i = 0; i < particleCount; i++) {
        const particle = document.createElement('div');
        particle.className = 'particle';

        const size = Math.random() * 3 + 1;
        const left = Math.random() * 100;
        const top = Math.random() * 100;
        const duration = Math.random() * 20 + 10;
        const delay = Math.random() * 10;

        Object.assign(particle.style, {
            position: 'absolute',
            width: `${size}px`,
            height: `${size}px`,
            background: `rgba(255, 77, 0, ${Math.random() * 0.5 + 0.2})`,
            borderRadius: '50%',
            left: `${left}%`,
            top: `${top}%`,
            animation: `float ${duration}s ease-in-out ${delay}s infinite`,
            pointerEvents: 'none'
        });

        container.appendChild(particle);
    }

    // Add float animation
    if (!document.getElementById('particle-styles')) {
        const style = document.createElement('style');
        style.id = 'particle-styles';
        style.textContent = `
            @keyframes float {
                0%, 100% { transform: translateY(0) translateX(0); opacity: 0.3; }
                25% { transform: translateY(-20px) translateX(10px); opacity: 0.6; }
                50% { transform: translateY(-10px) translateX(-10px); opacity: 0.4; }
                75% { transform: translateY(-30px) translateX(5px); opacity: 0.5; }
            }
        `;
        document.head.appendChild(style);
    }
}

/* ========================================
   TILT CARDS
   ======================================== */
function initTiltCards() {
    if (typeof VanillaTilt === 'undefined') return;

    const cards = document.querySelectorAll('[data-tilt]');

    VanillaTilt.init(cards, {
        max: 8,
        speed: 400,
        glare: true,
        'max-glare': 0.15,
        scale: 1.02
    });
}
