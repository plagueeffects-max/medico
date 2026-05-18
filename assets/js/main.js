// --- Navbar Scroll Effect & Mobile Nav (Debounced) ---
const nav = document.getElementById('navbar');
const debounce = (fn, delay) => {
    let timeout;
    return (...args) => {
        clearTimeout(timeout);
        timeout = setTimeout(() => fn.apply(this, args), delay);
    };
};
const handleNavScroll = () => {
    if (window.scrollY > 50) {
        nav.classList.add('scrolled');
    } else {
        nav.classList.remove('scrolled');
    }
};
window.addEventListener('scroll', debounce(handleNavScroll, 50), { passive: true });

const hamburger = document.getElementById('hamburger');
const navLinks = document.querySelector('.nav-links');
const navLinksItems = document.querySelectorAll('.nav-link');

if (hamburger && navLinks) {
    hamburger.addEventListener('click', () => {
        navLinks.classList.toggle('nav-active');
        hamburger.classList.toggle('toggle');
    });

    navLinksItems.forEach(link => {
        link.addEventListener('click', () => {
            navLinks.classList.remove('nav-active');
            hamburger.classList.remove('toggle');
        });
    });
}

// --- Scroll Reveal Observer (unchanged) ---
const revealElements = document.querySelectorAll('.reveal');
const revealObserver = new IntersectionObserver((entries, observer) => {
    entries.forEach(entry => {
        if (entry.isIntersecting) {
            entry.target.classList.add('active');
            observer.unobserve(entry.target);
        }
    });
}, { threshold: 0.1, rootMargin: "0px 0px -50px 0px" });
revealElements.forEach(el => revealObserver.observe(el));

// --- Number Counting Animation ---
const counters = document.querySelectorAll('.number');
let hasCounted = false;

const countUp = () => {
    counters.forEach(counter => {
        const target = +counter.getAttribute('data-target');
        const suffix = counter.getAttribute('data-suffix') || '';
        const duration = 2000;
        const increment = target / (duration / 16);

        let current = 0;
        const updateCounter = () => {
            current += increment;
            if (current < target) {
                counter.innerText = Math.ceil(current) + suffix;
                requestAnimationFrame(updateCounter);
            } else {
                counter.innerText = target + suffix;
            }
        };
        updateCounter();
    });
};

const statsSection = document.getElementById('stats-section');
const statsObserver = new IntersectionObserver((entries) => {
    if (entries[0].isIntersecting && !hasCounted) {
        countUp();
        hasCounted = true;
    }
}, { threshold: 0.5 });
if (statsSection) statsObserver.observe(statsSection);

// --- Hover Reveal & 3D Parallax Grid Effect (unchanged) ---
const parallaxMap = [
    { card: '.ac-1', parallax: 'equipment-parallax',   props: ['--px',  '--py']  },
    { card: '.ac-2', parallax: 'equipment-parallax-2', props: ['--px2', '--py2'] },
    { card: '.ac-3', parallax: 'equipment-parallax-3', props: ['--px3', '--py3'] },
    { card: '.ac-4', parallax: 'equipment-parallax-4', props: ['--px4', '--py4'] },
    { card: '.ac-5', parallax: 'equipment-parallax-5', props: ['--px5', '--py5'] },
    { card: '.ac-6', parallax: 'equipment-parallax-6', props: ['--px6', '--py6'] },
    { card: '.ac-7', parallax: 'equipment-parallax-7', props: ['--px7', '--py7'] },
];

parallaxMap.forEach(({ card, parallax, props }) => {
    const cardEl = document.querySelector(card);
    const parallaxEl = document.getElementById(parallax);
    if (!cardEl || !parallaxEl) return;

    let rafPending = false;
    let lastE = null;

    cardEl.addEventListener('mouseenter', () => parallaxEl.classList.add('active'));

    cardEl.addEventListener('mousemove', e => {
        if (!cardEl.closest('#catalogue-grid')) return;
        lastE = e;
        if (rafPending) return;
        rafPending = true;
        requestAnimationFrame(() => {
            if (!lastE) { rafPending = false; return; }
            const rect = cardEl.getBoundingClientRect();
            const x = lastE.clientX - rect.left;
            const y = lastE.clientY - rect.top;
            const centerX = rect.width / 2;
            const centerY = rect.height / 2;

            const rotateX = ((y - centerY) / centerY) * -8;
            const rotateY = ((x - centerX) / centerX) * 8;

            cardEl.style.transform = `perspective(1000px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) scale3d(1.02, 1.02, 1.02)`;
            cardEl.style.transition = 'none';

            const moveX = ((x - centerX) / centerX) * -30;
            const moveY = ((y - centerY) / centerY) * -30;
            parallaxEl.style.setProperty(props[0], `${moveX}px`);
            parallaxEl.style.setProperty(props[1], `${moveY}px`);
            rafPending = false;
        });
    });

    cardEl.addEventListener('mouseleave', () => {
        rafPending = false;
        lastE = null;
        parallaxEl.classList.remove('active');
        cardEl.style.transform = `perspective(1000px) rotateX(0) rotateY(0) scale3d(1, 1, 1)`;
        cardEl.style.transition = 'transform 0.5s cubic-bezier(0.16, 1, 0.3, 1)';
        parallaxEl.style.setProperty(props[0], '0px');
        parallaxEl.style.setProperty(props[1], '0px');
    });
});

// --- Custom Red Particle Engine ---
const canvas = document.getElementById('particle-canvas');
if (canvas) {
    const ctx = canvas.getContext('2d');
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;

    let particlesArray = [];
    let particleRafId = null;
    let particleRunning = false;

    class Particle {
        constructor() {
            this.x = Math.random() * canvas.width;
            this.y = canvas.height + Math.random() * 100;
            this.size = Math.random() * 3 + 1;
            this.speedY = Math.random() * -1 - 0.5;
            this.speedX = Math.random() * 1 - 0.5;
            const colors = [
                'rgba(211, 47, 47, 0.4)', 'rgba(211, 47, 47, 0.1)',
                'rgba(100, 100, 100, 0.2)',
                'rgba(76, 175, 80, 0.4)', 'rgba(76, 175, 80, 0.15)'
            ];
            this.color = colors[Math.floor(Math.random() * colors.length)];
        }
        update() {
            this.y += this.speedY;
            this.x += this.speedX;
            if (this.y < -10) {
                this.y = canvas.height + 10;
                this.x = Math.random() * canvas.width;
            }
        }
        draw() {
            ctx.beginPath();
            ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
            ctx.fillStyle = this.color;
            ctx.fill();
        }
    }

    function initParticles() {
        particlesArray = [];
        for (let i = 0; i < 50; i++) {
            particlesArray.push(new Particle());
        }
    }

    function animateParticles() {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        for (let i = 0; i < particlesArray.length; i++) {
            particlesArray[i].update();
            particlesArray[i].draw();
        }
        particleRafId = requestAnimationFrame(animateParticles);
    }

    function startParticles() {
        if (particleRunning) return;
        particleRunning = true;
        animateParticles();
    }

    function stopParticles() {
        if (!particleRunning) return;
        particleRunning = false;
        cancelAnimationFrame(particleRafId);
        particleRafId = null;
    }

    initParticles();
    startParticles();

    // Pause when tab is hidden, resume when visible
    document.addEventListener('visibilitychange', () => {
        document.hidden ? stopParticles() : startParticles();
    });

    // Pause when hero sticky area scrolls out of view
    const heroStickyEl = document.querySelector('.hero-sticky') || document.querySelector('.hero');
    if (heroStickyEl) {
        new IntersectionObserver(entries => {
            entries[0].isIntersecting ? startParticles() : stopParticles();
        }, { threshold: 0 }).observe(heroStickyEl);
    }

    window.addEventListener('resize', () => {
        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;
        initParticles();
    });
}

// --- Option A: Pinned Hero Scroll Sequence (Apple-style) ---
(function () {
    const heroSection   = document.querySelector('.hero');
    const heroContent   = document.querySelector('.hero-content');
    const heroVid       = document.querySelector('.hero-video');
    const scrollIndic   = document.querySelector('.scroll-indicator');
    if (!heroSection || !heroContent) return;

    const isMobile = () => window.innerWidth <= 768;

    const updateHero = () => {
        const scrolled = window.scrollY;
        const vh = window.innerHeight;

        if (isMobile()) {
            // Mobile: simple fade — hero is 100vh so standard fade
            if (scrolled < vh) {
                const p = scrolled / (vh * 0.7);
                heroContent.style.opacity = Math.max(0, 1 - p);
                heroContent.style.transform = `translateY(${scrolled * 0.25}px)`;
                heroContent.style.filter = 'none';
            }
            return;
        }

        // Desktop: 200vh hero → scroll zone = 1 × vh (extra 100vh of sticky range)
        const scrollZone = vh;
        const progress = Math.max(0, Math.min(1, scrolled / scrollZone));

        if (progress <= 0.35) {
            // Phase 1 — fully visible, gentle upward drift + indicator fades
            const p = progress / 0.35;
            heroContent.style.opacity = '1';
            heroContent.style.transform = `translateY(${-p * 18}px)`;
            heroContent.style.filter = 'none';
            if (heroVid) heroVid.style.transform = `translate(-50%, -50%) scale(${1 + p * 0.03})`;
            if (scrollIndic) scrollIndic.style.opacity = `${Math.max(0, 1 - p * 3)}`;
        } else if (progress <= 0.72) {
            // Phase 2 — content scatters + video zooms in
            const p = (progress - 0.35) / 0.37;
            const eased = p * p;
            heroContent.style.opacity = `${Math.max(0, 1 - eased)}`;
            heroContent.style.transform = `translateY(${-18 - eased * 55}px)`;
            heroContent.style.filter = eased > 0.05 ? `blur(${(eased * 7).toFixed(1)}px)` : 'none';
            if (heroVid) heroVid.style.transform = `translate(-50%, -50%) scale(${1.03 + p * 0.08})`;
            if (scrollIndic) scrollIndic.style.opacity = '0';
        } else {
            // Phase 3 — fully cleared
            heroContent.style.opacity = '0';
            heroContent.style.transform = 'translateY(-73px)';
            heroContent.style.filter = 'blur(7px)';
            if (heroVid) heroVid.style.transform = 'translate(-50%, -50%) scale(1.11)';
            if (scrollIndic) scrollIndic.style.opacity = '0';
        }
    };

    let ticking = false;
    window.addEventListener('scroll', () => {
        if (ticking) return;
        ticking = true;
        requestAnimationFrame(() => { updateHero(); ticking = false; });
    }, { passive: true });

    // On resize, reset video transform if switching to mobile
    window.addEventListener('resize', () => {
        if (isMobile() && heroVid) heroVid.style.transform = '';
    });
})();

// --- Custom Cinematic Smooth Scroll ---
document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function (e) {
        const targetId = this.getAttribute('href');
        if (targetId === '#') return;
        
        const targetElement = document.querySelector(targetId);
        if (targetElement) {
            e.preventDefault();
            let offset = 120; // Default clearance for the sticky navbar
            
            // For the About Us section, dynamically center it vertically so the bottom button is fully visible
            if (targetId === '#about-us') {
                const elementHeight = targetElement.offsetHeight;
                const windowHeight = window.innerHeight;
                if (elementHeight < windowHeight - 90) {
                    offset = (windowHeight - elementHeight) / 2;
                } else {
                    offset = 60; // Push it up slightly if it's very tall to reveal the bottom
                }
            }

            const targetPosition = targetElement.getBoundingClientRect().top + window.pageYOffset - offset;
            const startPosition = window.pageYOffset;
            const distance = targetPosition - startPosition;
            
            // 2200ms duration for maximum cinematic, luxurious ease
            const duration = 2200; 
            let start = null;

            // easeInOutQuint easing curve for an extreme, buttery-smooth Awwwards feel
            function ease(t, b, c, d) {
                t /= d / 2;
                if (t < 1) return c / 2 * t * t * t * t * t + b;
                t -= 2;
                return c / 2 * (t * t * t * t * t + 2) + b;
            }

            function animation(currentTime) {
                if (start === null) start = currentTime;
                const timeElapsed = currentTime - start;
                const run = ease(timeElapsed, startPosition, distance, duration);
                window.scrollTo(0, run);
                if (timeElapsed < duration) {
                    requestAnimationFrame(animation);
                }
            }

            requestAnimationFrame(animation);
        }
    });
});

// --- Framer-Style Scroll Text Reveal ---
const scrollRevealContainers = document.querySelectorAll('.scroll-text-reveal');

scrollRevealContainers.forEach(container => {
    // Split text nodes into spans to animate word-by-word
    const walkDOM = (node, func) => {
        if (node.nodeType === 3) {
            func(node);
        } else if (node.nodeType === 1 && node.nodeName !== 'SCRIPT' && !node.classList.contains('scroll-word')) {
            Array.from(node.childNodes).forEach(child => walkDOM(child, func));
        }
    };

    walkDOM(container, (node) => {
        const text = node.nodeValue;
        if (!text.trim()) return;

        const words = text.split(/(\s+)/);
        const fragment = document.createDocumentFragment();

        words.forEach(word => {
            if (word.trim()) {
                const span = document.createElement('span');
                span.className = 'scroll-word';
                span.textContent = word;
                span.style.color = 'rgba(71, 85, 105, 0.25)';
                span.style.transition = 'color 0.3s cubic-bezier(0.16, 1, 0.3, 1)';
                if (node.parentNode.tagName === 'STRONG') {
                    span.dataset.strong = 'true';
                }
                fragment.appendChild(span);
            } else {
                fragment.appendChild(document.createTextNode(word));
            }
        });

        node.parentNode.replaceChild(fragment, node);
    });

    const words = container.querySelectorAll('.scroll-word');

    let scrollWordTicking = false;
    window.addEventListener('scroll', () => {
        if (scrollWordTicking) return;
        scrollWordTicking = true;
        requestAnimationFrame(() => {
            const rect = container.getBoundingClientRect();
            const windowHeight = window.innerHeight;
            const start = windowHeight * 0.85;
            const end = windowHeight * 0.35;

            let progress = (start - rect.top) / (start - end);
            progress = Math.max(0, Math.min(1, progress));

            const highlightCount = Math.floor(progress * words.length);

            words.forEach((word, index) => {
                word.style.color = index < highlightCount
                    ? (word.dataset.strong ? 'var(--text-dark)' : '#475569')
                    : 'rgba(71, 85, 105, 0.25)';
            });
            scrollWordTicking = false;
        });
    }, { passive: true });

    // Trigger once on load
    window.dispatchEvent(new Event('scroll'));
});

// --- Pro Typewriter Effect & Star Animations ---
const testimonials = document.querySelectorAll('.t-text');

// Prepare Stars
const starContainers = document.querySelectorAll('.stars');
starContainers.forEach(container => {
    const starsText = container.textContent.trim();
    container.textContent = '';
    for(let i=0; i<starsText.length; i++) {
        const starSpan = document.createElement('span');
        starSpan.textContent = starsText[i];
        // Start grayed out and smaller
        starSpan.style.opacity = '0.15';
        starSpan.style.transform = 'scale(0.8)';
        starSpan.style.display = 'inline-block';
        starSpan.style.color = 'inherit';
        starSpan.style.transition = 'opacity 0.4s cubic-bezier(0.16, 1, 0.3, 1), transform 0.4s cubic-bezier(0.16, 1, 0.3, 1), color 0.4s';
        container.appendChild(starSpan);
    }
});

const typeWriterObserver = new IntersectionObserver((entries, observer) => {
    entries.forEach((entry, index) => {
        if (entry.isIntersecting) {
            const el = entry.target;
            const text = el.getAttribute('data-text');
            if (!text) return;
            
            el.removeAttribute('data-text');
            
            const typer = document.createElement('span');
            typer.style.position = 'absolute';
            typer.style.top = '0';
            typer.style.left = '0';
            typer.style.right = '0';
            
            const currentText = document.createTextNode('');
            const cursor = document.createElement('span');
            cursor.className = 'typewriter-cursor';
            cursor.textContent = '|';
            
            typer.appendChild(currentText);
            typer.appendChild(cursor);
            el.appendChild(typer);
            
            let i = 0;
            const card = el.closest('.testimonial-card');
            const stars = card ? card.querySelectorAll('.stars span') : [];
            
            const type = () => {
                if (i < text.length) {
                    currentText.nodeValue += text.charAt(i);
                    i++;
                    
                    // Synchronize stars with typing progress (1 to 5 stars)
                    const progress = i / text.length;
                    const starsToFill = Math.floor(progress * 5); // 0 to 5
                    
                    stars.forEach((star, sIndex) => {
                        // Only trigger the CSS animation if it hasn't been triggered yet
                        if (sIndex < starsToFill && star.style.opacity !== '1') {
                            star.style.opacity = '1';
                            star.style.transform = 'scale(1)';
                            star.style.color = '#fbbf24'; // Fill with gold
                        }
                    });
                    
                    const speed = 15 + Math.random() * 20; 
                    setTimeout(type, speed);
                } else {
                    // Ensure all 5 stars are fully lit exactly when text finishes
                    stars.forEach((star) => {
                        star.style.opacity = '1';
                        star.style.transform = 'scale(1)';
                        star.style.color = '#fbbf24';
                    });
                    
                    setTimeout(() => {
                        cursor.style.transition = 'opacity 0.5s';
                        cursor.style.opacity = '0';
                        setTimeout(() => cursor.remove(), 500);
                    }, 2500);
                }
            };
            
            // Strongly stagger and randomize start times so they don't type in sync
            const startDelay = 300 + (index * 400) + Math.random() * 400;
            setTimeout(type, startDelay);
            observer.unobserve(el);
        }
    });
}, { threshold: 0.2 });

testimonials.forEach(t => {
    const text = t.textContent.trim();
    t.setAttribute('data-text', text);
    t.textContent = '';
    
    const placeholder = document.createElement('span');
    placeholder.textContent = text;
    placeholder.style.visibility = 'hidden';
    t.style.position = 'relative';
    t.appendChild(placeholder);
    
    typeWriterObserver.observe(t);
});

/* ---- About Us: Premium Clip Reveal ---- */
(function () {
    const headline = document.querySelector('.about-us-headline');
    if (!headline) return;
    const obs = new IntersectionObserver(function (entries) {
        entries.forEach(function (entry) {
            if (entry.isIntersecting) {
                entry.target.classList.add('au-revealed');
                obs.unobserve(entry.target);
            }
        });
    }, { threshold: 0.4 });
    obs.observe(headline);
})();

// --- Category Card Video Lazy Autoplay ---
// Videos have preload="none" in HTML; play only when card scrolls into view
const categoryVideos = document.querySelectorAll('.aww-card video');
if (categoryVideos.length > 0) {
    const videoObserver = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            const video = entry.target;
            if (entry.isIntersecting) {
                if (video.readyState === 0) video.load();
                video.play().catch(() => {});
            } else {
                video.pause();
            }
        });
    }, { threshold: 0.25 });

    categoryVideos.forEach(video => videoObserver.observe(video));
}

// --- Hero Video Fade-In ---
const heroVideoEl = document.querySelector('.hero-video');
if (heroVideoEl) {
  const markReady = () => heroVideoEl.classList.add('is-ready');
  if (heroVideoEl.readyState >= 2) {
    markReady();
  } else {
    heroVideoEl.addEventListener('canplay', markReady, { once: true });
  }
}

// --- Dynamic Year Auto-Updater ---
document.addEventListener('DOMContentLoaded', () => {
    const currentYear = new Date().getFullYear();
    const yearElements = document.querySelectorAll('.current-year');

    yearElements.forEach(el => {
        el.textContent = currentYear;
    });
});

// --- Active Nav State ---
(function () {
    const path = window.location.pathname;
    document.querySelectorAll('.nav-link').forEach(link => {
        const href = link.getAttribute('href');
        if (!href || href.startsWith('#') || href.startsWith('mailto:')) return;
        const page = href.split('?')[0];
        const isHome = page === 'index.html' && (path === '/' || path.endsWith('/') || path.endsWith('index.html'));
        const isMatch = !isHome && path.endsWith(page);
        if (isHome || isMatch) link.classList.add('active');
    });
})();

// --- Typewriter Effect ---
document.addEventListener('DOMContentLoaded', () => {
    const typewriterElements = document.querySelectorAll('.typewriter-subtitle');
    typewriterElements.forEach(element => {
        const textToType = element.getAttribute('data-text');
        if (!textToType) return;
        
        element.innerHTML = '';
        element.classList.remove('typewriter-cursor');
        element.style.position = 'relative';
        
        const placeholder = document.createElement('span');
        placeholder.textContent = textToType;
        placeholder.style.visibility = 'hidden';
        element.appendChild(placeholder);
        
        const typer = document.createElement('span');
        typer.style.position = 'absolute';
        typer.style.top = '0';
        typer.style.left = '0';
        typer.style.right = '0';
        typer.style.whiteSpace = 'nowrap';
        
        const currentText = document.createTextNode('');
        const cursor = document.createElement('span');
        cursor.className = 'typewriter-cursor';
        cursor.textContent = '|';
        
        typer.appendChild(currentText);
        typer.appendChild(cursor);
        element.appendChild(typer);
        
        let i = 0;
        
        function typeWriter() {
            if (i < textToType.length) {
                currentText.nodeValue += textToType.charAt(i);
                i++;
                setTimeout(typeWriter, 50); // Typing speed
            } else {
                setTimeout(() => {
                    cursor.style.transition = 'opacity 0.5s';
                    cursor.style.opacity = '0';
                    setTimeout(() => cursor.remove(), 500);
                }, 1000);
            }
        }
        
        // Wait 1.2s for the main MEDICO text to animate in before starting
        setTimeout(typeWriter, 1200);
    });
});