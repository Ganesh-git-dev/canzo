/* ============================================
   CANZO - GSAP Scroll Animations
   Premium scroll-driven storytelling
   Expanding images, parallax, sequential reveals
   ============================================ */

// Register GSAP plugins
gsap.registerPlugin(ScrollTrigger);

// Dark mode
const savedTheme = localStorage.getItem('canzo_theme');
if (savedTheme) document.documentElement.setAttribute('data-theme', savedTheme);
const navThemeToggle = document.getElementById('navThemeToggle');
if (navThemeToggle) {
    navThemeToggle.addEventListener('click', () => {
        const current = document.documentElement.getAttribute('data-theme');
        const next = current === 'dark' ? 'light' : 'dark';
        document.documentElement.setAttribute('data-theme', next);
        localStorage.setItem('canzo_theme', next);
    });
}

// Check if mobile for lighter animations
const isMobile = window.innerWidth <= 768;

// Hide main content until loading screen finishes
const smoothWrapper = document.querySelector('.smooth-wrapper');
if (smoothWrapper) {
    gsap.set(smoothWrapper, { opacity: 0 });
}

// Reveal content after loading screen
setTimeout(() => {
    if (smoothWrapper) {
        gsap.to(smoothWrapper, { opacity: 1, duration: 0.5, ease: 'power2.out' });
    }
}, 3200);

// ============================================
// NAVIGATION SCROLL EFFECT
// Navbar becomes solid on scroll
// ============================================
const navbar = document.getElementById('navbar');

ScrollTrigger.create({
    start: 'top -80',
    end: 99999,
    toggleClass: { className: 'scrolled', targets: navbar }
});

// ============================================
// MOBILE MENU TOGGLE
// ============================================
const navToggle = document.getElementById('navToggle');
const mobileMenu = document.getElementById('mobileMenu');

navToggle.addEventListener('click', () => {
    mobileMenu.classList.toggle('active');
    navToggle.classList.toggle('active');
});

// Close mobile menu when clicking a link
mobileMenu.querySelectorAll('a').forEach(link => {
    link.addEventListener('click', () => {
        mobileMenu.classList.remove('active');
        navToggle.classList.remove('active');
    });
});

// ============================================
// HERO SECTION ENTRANCE ANIMATION
// Logo scales in → tagline fades → subtitle → buttons → stats
// Delayed to allow loading screen to finish
// ============================================
const heroTimeline = gsap.timeline({ delay: 3.8 });

heroTimeline
    .to('.hero-logo-wrapper', {
        opacity: 1,
        scale: 1,
        duration: 1,
        ease: 'back.out(1.7)'
    })
    .to('.hero-tagline', {
        opacity: 1,
        y: 0,
        duration: 0.7,
        ease: 'power3.out'
    }, '-=0.4')
    .to('.hero-subtitle', {
        opacity: 1,
        y: 0,
        duration: 0.8,
        ease: 'power3.out'
    }, '-=0.4')
    .to('.hero-actions .btn', {
        y: 0,
        duration: 0.7,
        ease: 'power3.out',
        stagger: 0.1
    }, '-=0.5')
    .from('.stat', {
        y: 30,
        opacity: 0,
        duration: 0.6,
        ease: 'power3.out',
        stagger: 0.1
    }, '-=0.4')
    .from('.hero-scroll-indicator', {
        opacity: 0,
        duration: 0.8,
        ease: 'power2.out'
    }, '-=0.3');

// ============================================
// EXPANDING IMAGE SECTIONS
// The core Instagram-reel-style animation:
// - Images start small/cropped with rounded corners
// - Expand to full width as user scrolls
// - Content fades/slides in after image expands
// - Slight parallax on the image itself
// ============================================

document.querySelectorAll('.expand-section').forEach((section, index) => {
    const imageWrapper = section.querySelector('.expand-image-wrapper');
    const image = section.querySelector('.expand-image');
    const content = section.querySelector('.expand-content');
    const tag = content.querySelector('.section-tag');
    const title = content.querySelector('.section-title');
    const text = content.querySelector('.section-text');

    // Set initial states
    gsap.set(imageWrapper, {
        scale: 0.65,
        borderRadius: '40px',
        opacity: 0.3
    });

    gsap.set(image, {
        scale: 1.3,
        y: 40
    });

    gsap.set([tag, title, text], {
        y: 60,
        opacity: 0
    });

    // Create the expanding scroll animation
    const expandTl = gsap.timeline({
        scrollTrigger: {
            trigger: section,
            start: 'top 80%',
            end: 'top 20%',
            scrub: 1.2,
            // Use less intensity on mobile
            invalidateOnRefresh: true
        }
    });

    // Main image expansion - dramatic scale up
    expandTl
        .to(imageWrapper, {
            scale: isMobile ? 0.95 : 1,
            borderRadius: isMobile ? '24px' : '32px',
            opacity: 1,
            duration: 1,
            ease: 'power2.out'
        })
        .to(image, {
            scale: 1,
            y: 0,
            duration: 1,
            ease: 'power2.out'
        }, 0);

    // Content reveal after image expands
    const contentTl = gsap.timeline({
        scrollTrigger: {
            trigger: section,
            start: 'top 50%',
            end: 'top 20%',
            scrub: 0.8
        }
    });

    contentTl
        .to(tag, {
            y: 0,
            opacity: 1,
            duration: 0.3,
            ease: 'power2.out'
        })
        .to(title, {
            y: 0,
            opacity: 1,
            duration: 0.3,
            ease: 'power2.out'
        }, '-=0.15')
        .to(text, {
            y: 0,
            opacity: 1,
            duration: 0.3,
            ease: 'power2.out'
        }, '-=0.15');

    // Parallax effect on image as user scrolls past
    gsap.to(image, {
        y: -60,
        ease: 'none',
        scrollTrigger: {
            trigger: section,
            start: 'top bottom',
            end: 'bottom top',
            scrub: true
        }
    });
});

// ============================================
// FEATURES SECTION ANIMATION
// Cards animate in with stagger on scroll
// ============================================
const featureCards = document.querySelectorAll('.feature-card');

gsap.set(featureCards, {
    y: 60,
    opacity: 0
});

gsap.to(featureCards, {
    y: 0,
    opacity: 1,
    duration: 0.8,
    stagger: 0.12,
    ease: 'power3.out',
    scrollTrigger: {
        trigger: '.features-grid',
        start: 'top 75%',
        end: 'bottom 20%',
        toggleActions: 'play none none reverse'
    }
});

// Animate section header elements
gsap.from('.features .section-tag', {
    y: 30,
    opacity: 0,
    duration: 0.6,
    scrollTrigger: {
        trigger: '.features',
        start: 'top 70%',
        toggleActions: 'play none none reverse'
    }
});

gsap.from('.features .section-title', {
    y: 40,
    opacity: 0,
    duration: 0.7,
    scrollTrigger: {
        trigger: '.features',
        start: 'top 70%',
        toggleActions: 'play none none reverse'
    }
});

gsap.from('.features .section-subtitle', {
    y: 30,
    opacity: 0,
    duration: 0.6,
    scrollTrigger: {
        trigger: '.features',
        start: 'top 65%',
        toggleActions: 'play none none reverse'
    }
});

// ============================================
// HOW IT WORKS - STEP ANIMATIONS
// Each step animates in sequence
// Image scales up, content slides in
// ============================================
document.querySelectorAll('.step').forEach((step, index) => {
    const image = step.querySelector('.step-image');
    const number = step.querySelector('.step-number');
    const heading = step.querySelector('h3');
    const text = step.querySelector('p');

    // Initial states
    gsap.set(image, {
        scale: 0.85,
        opacity: 0,
        x: index % 2 === 0 ? -60 : 60
    });

    gsap.set([number, heading], {
        y: 40,
        opacity: 0
    });

    gsap.set(text, {
        y: 30,
        opacity: 0
    });

    // Animate on scroll
    const stepTl = gsap.timeline({
        scrollTrigger: {
            trigger: step,
            start: 'top 70%',
            end: 'top 30%',
            scrub: 1,
            toggleActions: 'play none none reverse'
        }
    });

    stepTl
        .to(image, {
            scale: 1,
            opacity: 1,
            x: 0,
            duration: 1,
            ease: 'power3.out'
        })
        .to(number, {
            y: 0,
            opacity: 1,
            duration: 0.4,
            ease: 'power2.out'
        }, '-=0.5')
        .to(heading, {
            y: 0,
            opacity: 1,
            duration: 0.4,
            ease: 'power2.out'
        }, '-=0.25')
        .to(text, {
            y: 0,
            opacity: 1,
            duration: 0.4,
            ease: 'power2.out'
        }, '-=0.2');
});

// Section header animation
gsap.from('.how-it-works .section-tag', {
    y: 30,
    opacity: 0,
    duration: 0.6,
    scrollTrigger: {
        trigger: '.how-it-works',
        start: 'top 70%',
        toggleActions: 'play none none reverse'
    }
});

gsap.from('.how-it-works .section-title', {
    y: 40,
    opacity: 0,
    duration: 0.7,
    scrollTrigger: {
        trigger: '.how-it-works',
        start: 'top 70%',
        toggleActions: 'play none none reverse'
    }
});

// ============================================
// WHY CANZO - BENEFIT CARDS ANIMATION
// Cards slide up with stagger
// ============================================
const benefitCards = document.querySelectorAll('.benefit-card');

gsap.set(benefitCards, {
    y: 80,
    opacity: 0
});

gsap.to(benefitCards, {
    y: 0,
    opacity: 1,
    duration: 0.9,
    stagger: 0.15,
    ease: 'power3.out',
    scrollTrigger: {
        trigger: '.benefits-grid',
        start: 'top 75%',
        end: 'bottom 20%',
        toggleActions: 'play none none reverse'
    }
});

// Section header animation
gsap.from('.why-canzo .section-tag', {
    y: 30,
    opacity: 0,
    duration: 0.6,
    scrollTrigger: {
        trigger: '.why-canzo',
        start: 'top 70%',
        toggleActions: 'play none none reverse'
    }
});

gsap.from('.why-canzo .section-title', {
    y: 40,
    opacity: 0,
    duration: 0.7,
    scrollTrigger: {
        trigger: '.why-canzo',
        start: 'top 70%',
        toggleActions: 'play none none reverse'
    }
});

// ============================================
// TESTIMONIALS ANIMATION
// Cards fade in with stagger
// ============================================
const testimonialCards = document.querySelectorAll('.testimonial-card');

gsap.set(testimonialCards, {
    y: 50,
    opacity: 0
});

gsap.to(testimonialCards, {
    y: 0,
    opacity: 1,
    duration: 0.7,
    stagger: 0.15,
    ease: 'power3.out',
    scrollTrigger: {
        trigger: '.testimonials-grid',
        start: 'top 80%',
        toggleActions: 'play none none reverse'
    }
});

// Section header animation
gsap.from('.testimonials .section-tag', {
    y: 30,
    opacity: 0,
    duration: 0.6,
    scrollTrigger: {
        trigger: '.testimonials',
        start: 'top 70%',
        toggleActions: 'play none none reverse'
    }
});

gsap.from('.testimonials .section-title', {
    y: 40,
    opacity: 0,
    duration: 0.7,
    scrollTrigger: {
        trigger: '.testimonials',
        start: 'top 70%',
        toggleActions: 'play none none reverse'
    }
});

// ============================================
// FINAL CTA SECTION ANIMATION
// Dramatic entrance with scale and fade
// ============================================
const ctaContent = document.querySelector('.cta-content');

gsap.set(ctaContent, {
    scale: 0.9,
    y: 60,
    opacity: 0
});

gsap.to(ctaContent, {
    scale: 1,
    y: 0,
    opacity: 1,
    duration: 1.2,
    ease: 'power3.out',
    scrollTrigger: {
        trigger: '.final-cta',
        start: 'top 60%',
        end: 'top 30%',
        scrub: 1
    }
});

// Animate CTA buttons separately
gsap.set('.cta-actions .btn', {
    y: 30,
    opacity: 0
});

gsap.to('.cta-actions .btn', {
    y: 0,
    opacity: 1,
    duration: 0.6,
    stagger: 0.15,
    ease: 'power2.out',
    scrollTrigger: {
        trigger: '.final-cta',
        start: 'top 40%',
        toggleActions: 'play none none reverse'
    }
});

// ============================================
// FOOTER ANIMATION
// Simple fade in
// ============================================
gsap.from('.footer-grid > *', {
    y: 40,
    opacity: 0,
    duration: 0.6,
    stagger: 0.1,
    ease: 'power2.out',
    scrollTrigger: {
        trigger: '.footer',
        start: 'top 85%',
        toggleActions: 'play none none reverse'
    }
});

// ============================================
// PARALLAX EFFECTS
// Subtle depth on scroll for key elements
// ============================================
if (!isMobile) {
    // Hero parallax
    gsap.to('.hero-content', {
        y: 100,
        ease: 'none',
        scrollTrigger: {
            trigger: '.hero',
            start: 'top top',
            end: 'bottom top',
            scrub: true
        }
    });

    // Background gradient parallax
    gsap.to('.hero-bg', {
        y: -50,
        ease: 'none',
        scrollTrigger: {
            trigger: '.hero',
            start: 'top top',
            end: 'bottom top',
            scrub: true
        }
    });
}

// ============================================
// REFRESH SCROLLTRIGGER ON RESIZE
// Ensures animations recalculate on viewport change
// ============================================
let resizeTimer;
window.addEventListener('resize', () => {
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(() => {
        ScrollTrigger.refresh();
    }, 250);
});

// ============================================
// SMOOTH SCROLL FOR ANCHOR LINKS
// ============================================
document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function(e) {
        e.preventDefault();
        const target = document.querySelector(this.getAttribute('href'));
        if (target) {
            gsap.to(window, {
                duration: 1,
                scrollTo: {
                    y: target,
                    offsetY: 80
                },
                ease: 'power3.inOut'
            });
        }
    });
});

console.log('Canzo website loaded. Scroll animations initialized.');
