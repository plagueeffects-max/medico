// --- Navbar Scroll Effect & Mobile Nav ---
window.addEventListener('scroll', () => {
    const nav = document.getElementById('navbar');
    if (window.scrollY > 50) {
        nav.classList.add('scrolled');
    } else {
        nav.classList.remove('scrolled');
    }
});

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

// --- Scroll Reveal Observer ---
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
        const duration = 2000;
        const increment = target / (duration / 16);

        let current = 0;
        const updateCounter = () => {
            current += increment;
            if (current < target) {
                counter.innerText = Math.ceil(current) + (target > 50 ? '+' : '');
                requestAnimationFrame(updateCounter);
            } else {
                counter.innerText = target + '+';
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

// --- Hover Reveal Effect for Parallax Image ---
const ac1Card = document.querySelector('.ac-1');
const equipParallax = document.getElementById('equipment-parallax');
if (ac1Card && equipParallax) {
    ac1Card.addEventListener('mouseenter', () => {
        equipParallax.classList.add('active');
    });
    ac1Card.addEventListener('mouseleave', () => {
        equipParallax.classList.remove('active');
    });
}

const ac2Card = document.querySelector('.ac-2');
const equipParallax2 = document.getElementById('equipment-parallax-2');
if (ac2Card && equipParallax2) {
    ac2Card.addEventListener('mouseenter', () => {
        equipParallax2.classList.add('active');
    });
    ac2Card.addEventListener('mouseleave', () => {
        equipParallax2.classList.remove('active');
    });
}

const ac3Card = document.querySelector('.ac-3');
const equipParallax3 = document.getElementById('equipment-parallax-3');
if (ac3Card && equipParallax3) {
    ac3Card.addEventListener('mouseenter', () => {
        equipParallax3.classList.add('active');
    });
    ac3Card.addEventListener('mouseleave', () => {
        equipParallax3.classList.remove('active');
    });
}

const ac4Card = document.querySelector('.ac-4');
const equipParallax4 = document.getElementById('equipment-parallax-4');
if (ac4Card && equipParallax4) {
    ac4Card.addEventListener('mouseenter', () => {
        equipParallax4.classList.add('active');
    });
    ac4Card.addEventListener('mouseleave', () => {
        equipParallax4.classList.remove('active');
    });
}

const ac5Card = document.querySelector('.ac-5');
const equipParallax5 = document.getElementById('equipment-parallax-5');
if (ac5Card && equipParallax5) {
    ac5Card.addEventListener('mouseenter', () => {
        equipParallax5.classList.add('active');
    });
    ac5Card.addEventListener('mouseleave', () => {
        equipParallax5.classList.remove('active');
    });
}

const ac6Card = document.querySelector('.ac-6');
const equipParallax6 = document.getElementById('equipment-parallax-6');
if (ac6Card && equipParallax6) {
    ac6Card.addEventListener('mouseenter', () => {
        equipParallax6.classList.add('active');
    });
    ac6Card.addEventListener('mouseleave', () => {
        equipParallax6.classList.remove('active');
    });
}

const ac7Card = document.querySelector('.ac-7');
const equipParallax7 = document.getElementById('equipment-parallax-7');
if (ac7Card && equipParallax7) {
    ac7Card.addEventListener('mouseenter', () => {
        equipParallax7.classList.add('active');
    });
    ac7Card.addEventListener('mouseleave', () => {
        equipParallax7.classList.remove('active');
    });
}

// --- 3D Parallax Grid Effect ---
const cards = document.querySelectorAll('.aww-card');
cards.forEach(card => {
    card.addEventListener('mousemove', e => {
        if (!card.closest('#catalogue-grid')) return;

        const rect = card.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;

        const centerX = rect.width / 2;
        const centerY = rect.height / 2;

        const rotateX = ((y - centerY) / centerY) * -8; // Max 8 deg
        const rotateY = ((x - centerX) / centerX) * 8;

        card.style.transform = `perspective(1000px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) scale3d(1.02, 1.02, 1.02)`;
        card.style.transition = 'none';

        if (card.classList.contains('ac-1') && typeof equipParallax !== 'undefined' && equipParallax) {
            const moveX = ((x - centerX) / centerX) * -30;
            const moveY = ((y - centerY) / centerY) * -30;
            equipParallax.style.setProperty('--px', `${moveX}px`);
            equipParallax.style.setProperty('--py', `${moveY}px`);
        }
        
        if (card.classList.contains('ac-2') && typeof equipParallax2 !== 'undefined' && equipParallax2) {
            const moveX = ((x - centerX) / centerX) * -30;
            const moveY = ((y - centerY) / centerY) * -30;
            equipParallax2.style.setProperty('--px2', `${moveX}px`);
            equipParallax2.style.setProperty('--py2', `${moveY}px`);
        }

        if (card.classList.contains('ac-3') && typeof equipParallax3 !== 'undefined' && equipParallax3) {
            const moveX = ((x - centerX) / centerX) * -30;
            const moveY = ((y - centerY) / centerY) * -30;
            equipParallax3.style.setProperty('--px3', `${moveX}px`);
            equipParallax3.style.setProperty('--py3', `${moveY}px`);
        }

        if (card.classList.contains('ac-4') && typeof equipParallax4 !== 'undefined' && equipParallax4) {
            const moveX = ((x - centerX) / centerX) * -30;
            const moveY = ((y - centerY) / centerY) * -30;
            equipParallax4.style.setProperty('--px4', `${moveX}px`);
            equipParallax4.style.setProperty('--py4', `${moveY}px`);
        }

        if (card.classList.contains('ac-5') && typeof equipParallax5 !== 'undefined' && equipParallax5) {
            const moveX = ((x - centerX) / centerX) * -30;
            const moveY = ((y - centerY) / centerY) * -30;
            equipParallax5.style.setProperty('--px5', `${moveX}px`);
            equipParallax5.style.setProperty('--py5', `${moveY}px`);
        }

        if (card.classList.contains('ac-6') && typeof equipParallax6 !== 'undefined' && equipParallax6) {
            const moveX = ((x - centerX) / centerX) * -30;
            const moveY = ((y - centerY) / centerY) * -30;
            equipParallax6.style.setProperty('--px6', `${moveX}px`);
            equipParallax6.style.setProperty('--py6', `${moveY}px`);
        }

        if (card.classList.contains('ac-7') && typeof equipParallax7 !== 'undefined' && equipParallax7) {
            const moveX = ((x - centerX) / centerX) * -30;
            const moveY = ((y - centerY) / centerY) * -30;
            equipParallax7.style.setProperty('--px7', `${moveX}px`);
            equipParallax7.style.setProperty('--py7', `${moveY}px`);
        }
    });

    card.addEventListener('mouseleave', () => {
        if (!card.closest('#catalogue-grid')) return;

        card.style.transform = `perspective(1000px) rotateX(0) rotateY(0) scale3d(1, 1, 1)`;
        card.style.transition = 'transform 0.5s cubic-bezier(0.16, 1, 0.3, 1)';

        if (card.classList.contains('ac-1') && typeof equipParallax !== 'undefined' && equipParallax) {
            equipParallax.style.setProperty('--px', '0px');
            equipParallax.style.setProperty('--py', '0px');
        }
        
        if (card.classList.contains('ac-2') && typeof equipParallax2 !== 'undefined' && equipParallax2) {
            equipParallax2.style.setProperty('--px2', '0px');
            equipParallax2.style.setProperty('--py2', '0px');
        }
        
        if (card.classList.contains('ac-3') && typeof equipParallax3 !== 'undefined' && equipParallax3) {
            equipParallax3.style.setProperty('--px3', '0px');
            equipParallax3.style.setProperty('--py3', '0px');
        }

        if (card.classList.contains('ac-4') && typeof equipParallax4 !== 'undefined' && equipParallax4) {
            equipParallax4.style.setProperty('--px4', '0px');
            equipParallax4.style.setProperty('--py4', '0px');
        }
        
        if (card.classList.contains('ac-5') && typeof equipParallax5 !== 'undefined' && equipParallax5) {
            equipParallax5.style.setProperty('--px5', '0px');
            equipParallax5.style.setProperty('--py5', '0px');
        }

        if (card.classList.contains('ac-6') && typeof equipParallax6 !== 'undefined' && equipParallax6) {
            equipParallax6.style.setProperty('--px6', '0px');
            equipParallax6.style.setProperty('--py6', '0px');
        }

        if (card.classList.contains('ac-7') && typeof equipParallax7 !== 'undefined' && equipParallax7) {
            equipParallax7.style.setProperty('--px7', '0px');
            equipParallax7.style.setProperty('--py7', '0px');
        }
    });
});

// --- Custom Red Particle Engine ---
const canvas = document.getElementById('particle-canvas');
if (canvas) {
    const ctx = canvas.getContext('2d');
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;

    let particlesArray = [];

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
        requestAnimationFrame(animateParticles);
    }

    initParticles();
    animateParticles();

    window.addEventListener('resize', () => {
        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;
        initParticles();
    });
}

// --- Cinematic Hero Scroll Parallax & Blur ---
const heroContent = document.querySelector('.hero-content');
if (heroContent) {
    window.addEventListener('scroll', () => {
        // requestAnimationFrame for performance
        window.requestAnimationFrame(() => {
            const scrolled = window.scrollY;
            if (scrolled < window.innerHeight) {
                // Fade out by 60% of viewport height
                const opacity = 1 - (scrolled / (window.innerHeight * 0.6));
                // Blur increases as you scroll
                const blur = (scrolled / 80);
                // Move down slightly slower than the scroll (parallax)
                const yPos = scrolled * 0.4;
                
                heroContent.style.opacity = Math.max(0, opacity);
                heroContent.style.transform = `translateY(${yPos}px)`;
                if (blur > 0.1) {
                    heroContent.style.filter = `blur(${Math.min(blur, 15)}px)`;
                } else {
                    heroContent.style.filter = 'none';
                }
            }
        });
    }, { passive: true });
}

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
                // Start muted
                span.style.color = 'rgba(71, 85, 105, 0.25)';
                span.style.transition = 'color 0.3s cubic-bezier(0.16, 1, 0.3, 1)';
                // If it's inside a strong tag, store a flag so we can make it darker when highlighted
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
    
    window.addEventListener('scroll', () => {
        const rect = container.getBoundingClientRect();
        const windowHeight = window.innerHeight;
        
        // The effect starts when the container enters the bottom 85% of the viewport
        // and finishes when it reaches the top 35%
        const start = windowHeight * 0.85;
        const end = windowHeight * 0.35;
        
        let progress = (start - rect.top) / (start - end);
        progress = Math.max(0, Math.min(1, progress));
        
        const highlightCount = Math.floor(progress * words.length);
        
        words.forEach((word, index) => {
            if (index < highlightCount) {
                word.style.color = word.dataset.strong ? 'var(--text-dark)' : '#475569';
            } else {
                word.style.color = 'rgba(71, 85, 105, 0.25)';
            }
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

// --- Dynamic Year Auto-Updater ---
document.addEventListener('DOMContentLoaded', () => {
    const currentYear = new Date().getFullYear();
    const yearElements = document.querySelectorAll('.current-year');
    
    yearElements.forEach(el => {
        el.textContent = currentYear;
    });
});

// --- Typewriter Effect ---
document.addEventListener('DOMContentLoaded', () => {
    const typewriterElements = document.querySelectorAll('.typewriter-subtitle');
    typewriterElements.forEach(element => {
        const textToType = element.getAttribute('data-text');
        if (!textToType) return;
        
        element.innerHTML = '';
        let i = 0;
        
        function typeWriter() {
            if (i < textToType.length) {
                element.innerHTML += textToType.charAt(i);
                i++;
                setTimeout(typeWriter, 50); // Typing speed
            } else {
                element.classList.add('typewriter-done');
            }
        }
        
        // Wait 1.2s for the main MEDICO text to animate in before starting
        setTimeout(typeWriter, 1200);
    });
});