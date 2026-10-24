/* =====================================================
   Medico Scientific Service Centre — Products Screen (shop.js)
   Interactive Filter, Search, Sorting, Grid & FAQ Controls
   ===================================================== */

document.addEventListener('DOMContentLoaded', () => {
    let currentCategory = 'All';
    let currentSearch = '';
    let selectedAvailability = [];
    let selectedBrands = [];
    let currentSort = 'featured';
    let isListView = false;
    let favourites = new Set(JSON.parse(localStorage.getItem('medico_favs') || '[]'));

    const searchInput = document.getElementById('equipmentSearch');
    const productGrid = document.getElementById('productGrid');
    const categoryList = document.getElementById('categoryFilterList');
    const resetBtn = document.getElementById('resetFiltersBtn');
    const sortSelect = document.getElementById('sortSelect');
    const btnGridView = document.getElementById('btnGridView');
    const btnListView = document.getElementById('btnListView');

    // Parse URL parameter for direct category linking (e.g. shop.html?category=Oxygen+Therapy)
    const urlParams = new URLSearchParams(window.location.search);
    const catParam = urlParams.get('category');
    if (catParam) {
        currentCategory = catParam;
    }

    // Initialize all data
    function init() {
        renderSidebarCategories();
        bindFilterEvents();
        bindFaqEvents();
        bindViewSwitchers();
        applyFilters();
    }

    // Render Categories in Sidebar with real counts
    function renderSidebarCategories() {
        const products = ProductsDB.getProducts();
        const categories = ProductsDB.getCategories();
        
        let html = `
            <li>
                <button type="button" class="category-btn ${currentCategory === 'All' ? 'is-active' : ''}" data-cat="All">
                    <span>All Products</span>
                    <span class="category-badge-count">${products.length} &rsaquo;</span>
                </button>
            </li>
        `;

        categories.forEach(cat => {
            const count = products.filter(p => p.category === cat).length;
            html += `
                <li>
                    <button type="button" class="category-btn ${currentCategory === cat ? 'is-active' : ''}" data-cat="${escapeHtml(cat)}">
                        <span>${escapeHtml(cat)}</span>
                        <span class="category-badge-count">${count}</span>
                    </button>
                </li>
            `;
        });

        categoryList.innerHTML = html;

        // Bind category button clicks
        categoryList.querySelectorAll('.category-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                categoryList.querySelectorAll('.category-btn').forEach(b => b.classList.remove('is-active'));
                btn.classList.add('is-active');
                currentCategory = btn.dataset.cat;
                applyFilters();
            });
        });
    }

    // Bind Filter Event Listeners
    function bindFilterEvents() {
        // Search
        if (searchInput) {
            searchInput.addEventListener('input', (e) => {
                currentSearch = e.target.value.trim().toLowerCase();
                applyFilters();
            });
        }

        // Availability checkboxes
        document.querySelectorAll('input[name="availability"]').forEach(cb => {
            cb.addEventListener('change', () => {
                selectedAvailability = Array.from(document.querySelectorAll('input[name="availability"]:checked')).map(el => el.value);
                applyFilters();
            });
        });

        // Brand checkboxes
        document.querySelectorAll('input[name="brand"]').forEach(cb => {
            cb.addEventListener('change', () => {
                selectedBrands = Array.from(document.querySelectorAll('input[name="brand"]:checked')).map(el => el.value);
                applyFilters();
            });
        });

        // Reset Filters button
        if (resetBtn) {
            resetBtn.addEventListener('click', () => {
                if (searchInput) searchInput.value = '';
                currentSearch = '';
                currentCategory = 'All';
                selectedAvailability = [];
                selectedBrands = [];
                currentSort = 'featured';
                if (sortSelect) sortSelect.value = 'featured';

                document.querySelectorAll('input[name="availability"]').forEach(cb => cb.checked = false);
                document.querySelectorAll('input[name="brand"]').forEach(cb => cb.checked = false);

                renderSidebarCategories();
                applyFilters();
            });
        }

        // Sort Select
        if (sortSelect) {
            sortSelect.addEventListener('change', (e) => {
                currentSort = e.target.value;
                applyFilters();
            });
        }
    }

    // View Switchers (Grid vs List)
    function bindViewSwitchers() {
        if (btnGridView && btnListView) {
            btnGridView.addEventListener('click', () => {
                btnGridView.classList.add('is-active');
                btnListView.classList.remove('is-active');
                productGrid.classList.remove('is-list-view');
                isListView = false;
            });

            btnListView.addEventListener('click', () => {
                btnListView.classList.add('is-active');
                btnGridView.classList.remove('is-active');
                productGrid.classList.add('is-list-view');
                isListView = true;
            });
        }
    }

    // Filter, Sort and Render Products
    function applyFilters() {
        let products = ProductsDB.getProducts();

        // 1. Category Filter
        if (currentCategory !== 'All') {
            products = products.filter(p => p.category === currentCategory);
        }

        // 2. Search Filter
        if (currentSearch) {
            products = products.filter(p => 
                p.title.toLowerCase().includes(currentSearch) ||
                p.category.toLowerCase().includes(currentSearch) ||
                (p.brand && p.brand.toLowerCase().includes(currentSearch)) ||
                (p.description && p.description.toLowerCase().includes(currentSearch))
            );
        }

        // 3. Availability Filter
        if (selectedAvailability.length > 0) {
            products = products.filter(p => selectedAvailability.includes(p.stock));
        }

        // 4. Brand Filter
        if (selectedBrands.length > 0) {
            products = products.filter(p => p.brand && selectedBrands.includes(p.brand));
        }

        // 5. Sorting
        if (currentSort === 'price-low') {
            products.sort((a, b) => a.price - b.price);
        } else if (currentSort === 'price-high') {
            products.sort((a, b) => b.price - a.price);
        } else if (currentSort === 'name-asc') {
            products.sort((a, b) => a.title.localeCompare(b.title));
        }

        renderProducts(products);
    }

    // Render Product Cards
    function renderProducts(items) {
        if (!productGrid) return;

        if (items.length === 0) {
            productGrid.innerHTML = `
                <div style="grid-column: 1 / -1; text-align: center; padding: 60px 20px; background: #fff; border-radius: 16px; border: 1px dashed #cbd5e1;">
                    <div style="font-size: 36px; margin-bottom: 12px;">🩺</div>
                    <h3 style="font-size: 18px; font-weight: 700; color: #0b1220; margin-bottom: 8px;">No clinical equipment found</h3>
                    <p style="font-size: 14px; color: #64748b; max-width: 400px; margin: 0 auto 20px;">Try adjusting your search query, clearing filters, or contacting our medical team directly.</p>
                    <button type="button" class="btn-hero-primary" onclick="document.getElementById('resetFiltersBtn').click()">Reset Filters</button>
                </div>
            `;
            return;
        }

        productGrid.innerHTML = items.map(p => {
            const isFav = favourites.has(p.id);
            const isOrder = p.stock === 'Order on Request';
            const brandTag = p.brand ? `<span class="brand-pill-tag">${escapeHtml(p.brand)}</span>` : '';

            return `
                <article class="item-card" data-id="${p.id}">
                    <div class="item-card-top">
                        <span class="stock-pill ${isOrder ? 'is-order' : ''}">
                            ${isOrder ? 'ORDER ON REQUEST' : 'IN STOCK'}
                        </span>
                        <button type="button" class="btn-wishlist-heart ${isFav ? 'is-favourited' : ''}" data-fav-id="${p.id}" aria-label="Save ${escapeHtml(p.title)}">
                            <svg viewBox="0 0 24 24" fill="${isFav ? 'currentColor' : 'none'}" stroke="currentColor" stroke-width="2"><path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z"/></svg>
                        </button>
                    </div>

                    <div class="item-card-media">
                        <img src="${escapeHtml(p.mainImage || 'images/products/oxygen.webp')}" alt="${escapeHtml(p.title)}" class="item-card-img" loading="lazy">
                    </div>

                    <div class="item-card-info">
                        <h3 class="item-card-title">${escapeHtml(p.title)}</h3>
                        <p class="item-card-desc">${escapeHtml(p.description || '')}</p>
                        <div class="item-card-tags">
                            ${brandTag}
                        </div>
                    </div>

                    <a href="product.html?id=${p.id}" class="btn-item-details">
                        <span>View details</span>
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M5 12h14"/><path d="m12 5 7 7-7 7"/></svg>
                    </a>
                </article>
            `;
        }).join('');

        // Bind heart wishlist clicks
        productGrid.querySelectorAll('.btn-wishlist-heart').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.preventDefault();
                e.stopPropagation();
                const id = btn.dataset.favId;
                if (favourites.has(id)) {
                    favourites.delete(id);
                    btn.classList.remove('is-favourited');
                    btn.querySelector('svg').setAttribute('fill', 'none');
                } else {
                    favourites.add(id);
                    btn.classList.add('is-favourited');
                    btn.querySelector('svg').setAttribute('fill', 'currentColor');
                }
                localStorage.setItem('medico_favs', JSON.stringify([...favourites]));
            });
        });
    }

    // FAQ Accordion Interaction
    function bindFaqEvents() {
        const accordionItems = document.querySelectorAll('.faq-accordion-item');
        accordionItems.forEach(item => {
            const header = item.querySelector('.faq-accordion-header');
            if (header) {
                header.addEventListener('click', () => {
                    const isOpen = item.classList.contains('is-open');
                    // Close others
                    accordionItems.forEach(other => {
                        if (other !== item) other.classList.remove('is-open');
                    });
                    item.classList.toggle('is-open', !isOpen);
                });
            }
        });
    }

    // Helper: Escape HTML
    function escapeHtml(str) {
        if (!str) return '';
        return String(str).replace(/[&<>"']/g, (c) => ({
            '&': '&amp;',
            '<': '&lt;',
            '>': '&gt;',
            '"': '&quot;',
            "'": '&#39;'
        }[c]));
    }

    // Site Header: Scroll Elevation & Mobile Menu Toggle
    function bindHeaderEvents() {
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
    }

    // Run init
    init();
    bindHeaderEvents();
});
