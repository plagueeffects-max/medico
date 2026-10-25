const ProductsDB = {
    STORAGE_KEY: 'medico_products_v5',

    getProducts: function() {
        const data = localStorage.getItem(this.STORAGE_KEY);
        return data ? JSON.parse(data) : this.defaultProducts;
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
        return [
            'Oxygen Therapy',
            'Anaesthesia',
            'Diagnostics & Monitoring',
            'Emergency & Resuscitation',
            'Critical Care',
            'Sleep & NIV',
            'Surgical Equipment'
        ];
    },

    getBrands: function() {
        return ['Philips', 'Schiller', 'Shalya', 'ResMed', 'Medico', 'Mindray'];
    },

    defaultProducts: [
        {
            id: "prod-1",
            title: "Oxygen Therapy",
            category: "Oxygen Therapy",
            brand: "Medico",
            price: 45000,
            originalPrice: 52000,
            stock: "In Stock",
            description: "High-yield concentrators and portable oxygen systems for home and clinical use.",
            mainImage: "images/products/oxygen.webp",
            features: ["10L/min high-flow capacity", "Built-in oxygen purity sensor", "Continuous 24/7 duty cycle"]
        },
        {
            id: "prod-2",
            title: "Anaesthesia",
            category: "Anaesthesia",
            brand: "Mindray",
            price: 185000,
            originalPrice: 210000,
            stock: "In Stock",
            description: "Advanced anaesthesia workstations for safe and precise delivery.",
            mainImage: "images/products/anaesthesia.webp",
            features: ["Integrated ventilator modes", "Precision vaporizers", "Adult & pediatric compliance"]
        },
        {
            id: "prod-3",
            title: "Diagnostics & Monitoring",
            category: "Diagnostics & Monitoring",
            brand: "Philips",
            price: 78000,
            originalPrice: 88000,
            stock: "In Stock",
            description: "Patient monitors for accurate and continuous monitoring.",
            mainImage: "images/products/diagnostics.webp",
            features: ["Multi-parameter ECG & SpO2", "High-res touch display", "Central station telemetry"]
        },
        {
            id: "prod-4",
            title: "Emergency & Resuscitation",
            category: "Emergency & Resuscitation",
            brand: "Schiller",
            price: 125000,
            originalPrice: 140000,
            stock: "In Stock",
            description: "Life-saving resuscitation devices for emergency and trauma care.",
            mainImage: "images/products/emergency.webp",
            features: ["Biphasic defibrillation", "Manual & AED modes", "Rugged shock-proof chassis"]
        },
        {
            id: "prod-5",
            title: "Critical Care",
            category: "Critical Care",
            brand: "Philips",
            price: 145000,
            originalPrice: 160000,
            stock: "In Stock",
            description: "Advanced monitoring and life support systems for ICUs.",
            mainImage: "images/products/critical-care.webp",
            features: ["Invasive hemodynamic monitoring", "Arrhythmia detection", "Dual-battery backup"]
        },
        {
            id: "prod-6",
            title: "Sleep & NIV",
            category: "Sleep & NIV",
            brand: "ResMed",
            price: 68000,
            originalPrice: 78000,
            stock: "In Stock",
            description: "CPAP, BiPAP and ventilation systems for sleep apnea and respiratory support.",
            mainImage: "images/products/sleep.webp",
            features: ["Auto-titrating algorithm", "Climate control humidifier", "Quiet whisper motor"]
        },
        {
            id: "prod-7",
            title: "Philips EverFlo Concentrator",
            category: "Oxygen Therapy",
            brand: "Philips",
            price: 62000,
            originalPrice: 70000,
            stock: "In Stock",
            description: "Compact 5-liter clinical stationary oxygen concentrator with ultra-low power consumption.",
            mainImage: "images/products/oxygen-conc.webp",
            features: ["Lightweight 14kg footprint", "OPI oxygen percentage indicator", "Low maintenance design"]
        },
        {
            id: "prod-8",
            title: "Schiller Touch Multi-ECG",
            category: "Diagnostics & Monitoring",
            brand: "Schiller",
            price: 95000,
            originalPrice: 105000,
            stock: "In Stock",
            description: "High-definition 12-lead diagnostic electrocardiograph with automated measurement interpretation.",
            mainImage: "images/products/diagnostics.webp",
            features: ["12-lead simultaneous recording", "Thermal array printer", "DICOM & HL7 integration"]
        },
        {
            id: "prod-9",
            title: "Philips Intensive Care Station",
            category: "Critical Care",
            brand: "Philips",
            price: 210000,
            originalPrice: 235000,
            stock: "In Stock",
            description: "Advanced life-support ICU ventilator station engineered for complex acute respiratory distress.",
            mainImage: "images/products/critical-care.webp",
            features: ["Lung protective ventilation", "High-flow oxygen therapy mode", "Smart weaning automation"]
        },
        {
            id: "prod-10",
            title: "Shalya Electrosurgical Unit",
            category: "Surgical Equipment",
            brand: "Shalya",
            price: 155000,
            originalPrice: 175000,
            stock: "In Stock",
            description: "Digital microprocessor-controlled surgical diathermy generator with precision cut and coagulation.",
            mainImage: "images/products/surgical.webp",
            features: ["Monopolar & bipolar modes", "Endocut precision control", "Tissue response monitoring"]
        },
        {
            id: "prod-11",
            title: "Aeon 7200A Theatre Workstation",
            category: "Anaesthesia",
            brand: "Philips",
            price: 290000,
            originalPrice: 320000,
            stock: "Order on Request",
            description: "Comprehensive surgical theatre anaesthesia workstation with integrated electronic gas mixing.",
            mainImage: "images/products/anaesthesia.webp",
            features: ["Tidal volume down to 20ml", "Twin vaporizer manifold", "Heated breathing circuit"]
        },
        {
            id: "prod-12",
            title: "Portable Emergency Transport BiPAP",
            category: "Sleep & NIV",
            brand: "Medico",
            price: 52000,
            originalPrice: 60000,
            stock: "Order on Request",
            description: "Rugged mobile non-invasive ventilation device designed for transit care and high altitude use.",
            mainImage: "images/products/sleep.webp",
            features: ["Internal rechargeable battery", "Leak compensation technology", "Target tidal volume assurance"]
        }
    ]
};

// Seed or update database
(function() {
    if (!localStorage.getItem(ProductsDB.STORAGE_KEY)) {
        ProductsDB.saveProducts(ProductsDB.defaultProducts);
    }
})();
