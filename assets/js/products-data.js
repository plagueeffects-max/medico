const ProductsDB = {
    STORAGE_KEY: 'medico_products',

    getProducts: function() {
        const data = localStorage.getItem(this.STORAGE_KEY);
        return data ? JSON.parse(data) : [];
    },

    saveProducts: function(products) {
        localStorage.setItem(this.STORAGE_KEY, JSON.stringify(products));
    },

    addProduct: function(product) {
        const products = this.getProducts();
        product.id = Date.now().toString();
        product.createdAt = new Date().toISOString();
        products.push(product);
        this.saveProducts(products);
        return product;
    },

    updateProduct: function(id, updatedData) {
        const products = this.getProducts();
        const index = products.findIndex(p => p.id === id);
        if (index !== -1) {
            products[index] = { ...products[index], ...updatedData, updatedAt: new Date().toISOString() };
            this.saveProducts(products);
            return products[index];
        }
        return null;
    },

    deleteProduct: function(id) {
        let products = this.getProducts();
        products = products.filter(p => p.id !== id);
        this.saveProducts(products);
    },

    getProduct: function(id) {
        const products = this.getProducts();
        return products.find(p => p.id === id);
    },

    getCategories: function() {
        const data = localStorage.getItem(this.STORAGE_KEY + '_categories');
        if (!data) {
            const defaults = ['Oxygen Dynamics', 'Anaesthesia', 'Diagnostics', 'Emergency & Resuscitation', 'Critical Care', 'Sleep & NIV', 'Surgery'];
            this.saveCategories(defaults);
            return defaults;
        }
        return JSON.parse(data);
    },

    saveCategories: function(categories) {
        localStorage.setItem(this.STORAGE_KEY + '_categories', JSON.stringify(categories));
    },

    addCategory: function(category) {
        const cats = this.getCategories();
        if (!cats.includes(category)) {
            cats.push(category);
            this.saveCategories(cats);
        }
    },

    getSubcategories: function() {
        const data = localStorage.getItem(this.STORAGE_KEY + '_subcategories');
        if (!data) {
            return [];
        }
        return JSON.parse(data);
    },

    saveSubcategories: function(subcats) {
        localStorage.setItem(this.STORAGE_KEY + '_subcategories', JSON.stringify(subcats));
    },

    addSubcategory: function(subcat) {
        const subcats = this.getSubcategories();
        if (!subcats.includes(subcat)) {
            subcats.push(subcat);
            this.saveSubcategories(subcats);
        }
    },

    getProductsByCategory: function(category) {
        const products = this.getProducts();
        return products.filter(p => p.category === category);
    }
};

// Seed initial demo data if empty
if (ProductsDB.getProducts().length === 0) {
    ProductsDB.saveProducts([
        {
            id: "demo-prod-1",
            title: "Advanced Oxygen Concentrator 10L",
            category: "Oxygen Dynamics",
            subcategory: "Concentrators",
            price: 45000,
            originalPrice: 55000,
            description: "High-yield 10L oxygen concentrator designed for continuous uninterrupted respiratory support in ICU and homecare settings. Features dual-flow and low noise operation.",
            mainImage: "images/oxygen.gif",
            gallery: [],
            features: ["10 Liters/min capacity", "Purity indicator", "Low noise < 45dB"],
            stock: "In Stock",
            createdAt: new Date().toISOString()
        },
        {
            id: "demo-prod-2",
            title: "Neonatal CPAP Machine",
            category: "Sleep & NIV",
            subcategory: "Ventilation",
            price: 85000,
            originalPrice: 95000,
            description: "Advanced non-invasive ventilation (CPAP/BiPAP) machinery offering superior patient synchrony and comfort. Built-in humidifier and multiple ventilation modes.",
            mainImage: "images/sleep.mp4", // Or a fallback image
            gallery: [],
            features: ["Auto-CPAP mode", "Integrated Humidifier", "Data logging"],
            stock: "In Stock",
            createdAt: new Date().toISOString()
        }
    ]);
}
