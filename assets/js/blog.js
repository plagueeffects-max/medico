/* =====================================================
   Medico Scientific Service Centre — Blog Interactions (blog.js)
   Category filtering, Search, Newsletter & Header controls
   ===================================================== */

document.addEventListener('DOMContentLoaded', () => {
    // 1. Header scroll & mobile drawer
    const header = document.getElementById('site-header');
    if (header) {
        const onScroll = () => header.classList.toggle('is-scrolled', window.scrollY > 8);
        window.addEventListener('scroll', onScroll, { passive: true });
        onScroll();
    }

    const menuToggle = document.getElementById('menu-toggle');
    const nav = document.getElementById('main-nav');
    if (menuToggle && nav) {
        const root = document.documentElement;
        const setMenu = (open) => {
            root.classList.toggle('menu-open', open);
            menuToggle.setAttribute('aria-expanded', String(open));
            menuToggle.setAttribute('aria-label', open ? 'Close menu' : 'Open menu');
        };
        menuToggle.addEventListener('click', () => setMenu(!root.classList.contains('menu-open')));
        nav.addEventListener('click', (e) => { if (e.target.closest('a, button')) setMenu(false); });
        document.addEventListener('keydown', (e) => { if (e.key === 'Escape') setMenu(false); });
        window.matchMedia('(min-width: 1081px)').addEventListener('change', (e) => { if (e.matches) setMenu(false); });
    }

    // 2. Category Filter & Search
    const categoryTabs = document.querySelectorAll('.category-tab-card');
    const articleCards = document.querySelectorAll('.article-card');
    const searchInput = document.getElementById('blogSearchInput');
    const searchBtn = document.getElementById('blogSearchBtn');

    let currentCategory = 'All';
    let currentSearch = '';

    function filterArticles() {
        articleCards.forEach(card => {
            const cardCategory = card.getAttribute('data-category') || '';
            const cardTitle = card.querySelector('.article-card-title')?.textContent?.toLowerCase() || '';
            const cardDesc = card.querySelector('.article-card-desc')?.textContent?.toLowerCase() || '';

            const matchesCategory = currentCategory === 'All' || cardCategory === currentCategory;
            const matchesSearch = !currentSearch || cardTitle.includes(currentSearch) || cardDesc.includes(currentSearch) || cardCategory.toLowerCase().includes(currentSearch);

            if (matchesCategory && matchesSearch) {
                card.style.display = 'flex';
            } else {
                card.style.display = 'none';
            }
        });
    }

    categoryTabs.forEach(tab => {
        tab.addEventListener('click', () => {
            categoryTabs.forEach(t => t.classList.remove('is-active'));
            tab.classList.add('is-active');
            currentCategory = tab.getAttribute('data-category') || 'All';
            filterArticles();
        });
    });

    if (searchInput) {
        searchInput.addEventListener('input', (e) => {
            currentSearch = e.target.value.trim().toLowerCase();
            filterArticles();
        });

        searchInput.addEventListener('keydown', (e) => {
            if (e.key === 'Enter') {
                e.preventDefault();
                currentSearch = searchInput.value.trim().toLowerCase();
                filterArticles();
                const latestSection = document.getElementById('latestArticles');
                if (latestSection) {
                    latestSection.scrollIntoView({ behavior: 'smooth' });
                }
            }
        });
    }

    if (searchBtn && searchInput) {
        searchBtn.addEventListener('click', () => {
            currentSearch = searchInput.value.trim().toLowerCase();
            filterArticles();
            const latestSection = document.getElementById('latestArticles');
            if (latestSection) {
                latestSection.scrollIntoView({ behavior: 'smooth' });
            }
        });
    }

    // 3. Newsletter Subscription
    const newsletterForm = document.getElementById('newsletterForm');
    const newsletterInput = document.getElementById('newsletterEmail');
    if (newsletterForm && newsletterInput) {
        newsletterForm.addEventListener('submit', (e) => {
            e.preventDefault();
            const email = newsletterInput.value.trim();
            if (!email || !email.includes('@')) {
                alert('Please enter a valid email address.');
                return;
            }
            const submitBtn = newsletterForm.querySelector('button[type="submit"]');
            const originalText = submitBtn.innerHTML;
            submitBtn.disabled = true;
            submitBtn.textContent = 'Subscribed!';
            submitBtn.style.background = '#10b981';
            setTimeout(() => {
                newsletterInput.value = '';
                submitBtn.disabled = false;
                submitBtn.innerHTML = originalText;
                submitBtn.style.background = '';
            }, 3000);
        });
    }
});
