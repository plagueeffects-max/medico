// Blog Data Management Module

// Clear old DB format to load the new detailed dummy data
if (localStorage.getItem('medico_blogs_v3') !== 'true') {
    localStorage.removeItem('medico_blogs');
    localStorage.setItem('medico_blogs_v3', 'true');
}

const detailedContent = `
    <p>We are thrilled to announce our participation in the upcoming <strong>RE ALFA SKIMS 2025</strong> symposium. This event promises to be a landmark gathering for respiratory care professionals, focusing on the latest advancements in pulmonary diagnostics and therapeutic interventions.</p>

    <h2>Oscillometry: The Future of Pulmonary Function Testing</h2>
    <p>One of the key highlights of the event will be a deep dive into <em>Oscillometry</em>, presented by renowned expert Dr. Rahul Sharma. Traditional spirometry has long been the gold standard, but oscillometry offers a non-invasive, effort-independent method to assess lung mechanics. This is particularly beneficial for pediatric, elderly, and critically ill patients.</p>

    <h3>What to Expect at Our Booth</h3>
    <p>Medico Scientific Service Centre will be showcasing our latest suite of respiratory equipment, including:</p>
    <ul>
        <li><strong>Next-Gen CPAP/BiPAP Machines:</strong> Featuring advanced auto-titration algorithms and integrated heated humidification for optimal patient comfort and compliance.</li>
        <li><strong>High-Flow Nasal Cannula (HFNC) Systems:</strong> Essential for managing acute hypoxemic respiratory failure, providing precise oxygen delivery.</li>
        <li><strong>Portable Oxygen Concentrators:</strong> Lightweight and durable solutions for active patients requiring long-term oxygen therapy.</li>
    </ul>

    <p>Our team of clinical specialists will be on hand to provide live demonstrations, answer technical questions, and discuss how our equipment can integrate seamlessly into your clinical workflows to improve patient outcomes.</p>
`;

const defaultBlogs = [
    {
        id: "1",
        title: "RE ALFA SKIMS 2025: Advanced Pulmonary Diagnostics",
        subheading: "Exploring the future of respiratory care and Oscillometry at the premier medical symposium.",
        category: "Industry News",
        author: "Medico Team",
        date: "2025-11-20",
        time: "10:00",
        image: "images/insight-skims.webp",
        galleryImages: ["images/6card.webp", "images/3card.webp", "images/7card.webp"],
        content: detailedContent,
        featured: false
    },
    {
        id: "2",
        title: "ALFA 2025: Annual Lung Function Assessment",
        subheading: "Understanding the latest protocols for assessing respiratory health in post-operative patients.",
        category: "Clinical Insights",
        author: "Dr. Naseer Andrabi",
        date: "2025-11-03",
        time: "14:30",
        image: "images/insight-alfa.webp",
        galleryImages: [],
        content: "<p>Join us for the Annual Lung Function Assessment program where we will discuss the latest protocols for assessing respiratory health in post-operative patients. The session will cover spirometry interpretation, diffusion capacity, and practical workshops on equipment calibration.</p>",
        featured: false
    },
    {
        id: "icu-readiness",
        title: "Strengthening ICU Readiness in Jammu & Kashmir",
        subheading: "Key infrastructure and equipment essentials for building resilient critical care units.",
        category: "Healthcare Infrastructure",
        author: "Medico Team",
        date: "2025-10-18",
        image: "images/blog-featured-icu.webp",
        galleryImages: [],
        featured: true,
        content: `
    <p>Critical care in Jammu &amp; Kashmir has to work through long winters, power interruptions and long transfer distances. An ICU that is ready for those conditions is planned around reliability as much as capability.</p>
    <h2>Start with monitoring</h2>
    <p>Every ICU bed needs a multi-parameter patient monitor covering ECG, SpO2, non-invasive blood pressure and temperature, with invasive pressure and capnography where the case mix calls for it. A central station lets a small night team watch every bed at once.</p>
    <h2>Plan ventilation and oxygen together</h2>
    <p>Ventilators, high-flow systems and NIV devices all depend on a stable oxygen supply. Pair them with a realistic oxygen plan: pipeline, cylinder banks and concentrators as backup, with alarms that someone will actually hear.</p>
    <h2>Power is part of the equipment</h2>
    <ul>
        <li>Online UPS for monitors and ventilators</li>
        <li>Devices with internal batteries that are tested, not assumed</li>
        <li>Clear labelling of which sockets are on backup power</li>
    </ul>
    <h2>Maintenance keeps beds open</h2>
    <p>A preventive maintenance schedule and an annual maintenance contract mean faults are found during service visits, not during a night shift. Ask your supplier how fast an engineer can reach your district and whether spare parts are held locally.</p>`
    },
    {
        id: "oxygen-therapy",
        title: "Choosing the Right Oxygen Therapy Solution for Home Care",
        subheading: "A guide to oxygen concentrators, their benefits and what to check before buying.",
        category: "Product Updates",
        author: "Medico Team",
        date: "2025-10-02",
        image: "images/products/oxygen-conc.webp",
        galleryImages: [],
        content: `
    <p>Home oxygen should always follow a doctor's prescription. Once you know the flow rate and how many hours a day are needed, choosing equipment becomes much simpler.</p>
    <h2>Concentrator or cylinder?</h2>
    <p>A stationary oxygen concentrator draws oxygen from room air and runs on electricity, so it suits patients who need oxygen for many hours each day. Cylinders need no power and are useful as backup during outages or for travel.</p>
    <h2>What to check</h2>
    <ul>
        <li><strong>Flow rate:</strong> the concentrator must deliver the prescribed litres per minute, with headroom.</li>
        <li><strong>Purity indicator:</strong> a built-in oxygen sensor warns if concentration drops.</li>
        <li><strong>Noise and heat:</strong> the unit may run next to a bed through the night.</li>
        <li><strong>Service:</strong> filters need regular cleaning and the unit needs periodic checks.</li>
    </ul>
    <p>Our team can help you match a concentrator to the prescription, show your family how to use it, and keep it serviced.</p>`
    },
    {
        id: "surgical-outcomes",
        title: "The Role of Advanced Surgical Equipment in Better Outcomes",
        subheading: "How minimally invasive technologies support precision, safety and recovery.",
        category: "Clinical Insights",
        author: "Medico Team",
        date: "2025-09-21",
        image: "images/blog-surgical-lights.webp",
        galleryImages: [],
        content: `
    <p>Minimally invasive surgery has changed what patients can expect after an operation: smaller incisions, less pain and shorter hospital stays. The instruments and theatre equipment behind it matter as much as the technique.</p>
    <h2>Visibility first</h2>
    <p>Good surgical lighting and clear laparoscopic imaging reduce fatigue for the surgical team and help them work precisely over long procedures.</p>
    <h2>Instruments that suit the case mix</h2>
    <p>Quality laparoscopic instruments and electrosurgical units give consistent performance across general, gynaecological and urological procedures. Reusable instruments need validated cleaning and sterilisation workflows.</p>
    <h2>Training and support</h2>
    <p>New equipment delivers its benefit only when theatre staff are confident with it. Hands-on orientation at installation and access to technical support afterwards keep theatres running.</p>`
    },
    {
        id: "sleep-apnea",
        title: "Understanding Sleep Apnea and NIV Therapy",
        subheading: "How non-invasive ventilation can improve sleep quality and respiratory health.",
        category: "Patient Care",
        author: "Medico Team",
        date: "2025-09-05",
        image: "images/blog-sleep-apnea.webp",
        galleryImages: [],
        content: `
    <p>Obstructive sleep apnoea happens when the airway repeatedly narrows or closes during sleep. Loud snoring, choking at night and daytime sleepiness are common signs. Diagnosis needs a sleep study and a doctor's assessment.</p>
    <h2>How CPAP helps</h2>
    <p>A CPAP device delivers gentle, steady air pressure through a mask, keeping the airway open through the night. Auto-adjusting devices change pressure as needed during sleep.</p>
    <h2>When BiPAP is used</h2>
    <p>BiPAP gives a higher pressure when breathing in and a lower one when breathing out. Doctors may prescribe it for patients who need extra ventilatory support, such as some people with COPD.</p>
    <h2>Making therapy stick</h2>
    <ul>
        <li>A well-fitted mask matters more than any other setting.</li>
        <li>Heated humidification reduces dryness and congestion.</li>
        <li>Regular follow-up helps adjust settings and solve problems early.</li>
    </ul>`
    },
    {
        id: "anaesthesia-guide",
        title: "Anaesthesia Workstations: Features to Look For",
        subheading: "A practical guide for hospitals selecting an anaesthesia system for safe and efficient care.",
        category: "Clinical Insights",
        author: "Medico Team",
        date: "2025-08-19",
        image: "images/blog-anaesthesia.webp",
        galleryImages: [],
        content: `
    <p>An anaesthesia workstation is one of the most safety-critical pieces of equipment in a hospital. The right choice depends on your case mix, patient population and the support available after purchase.</p>
    <h2>Ventilation modes</h2>
    <p>Look for volume and pressure control modes suitable for both adult and paediatric patients, with accurate low tidal volume delivery.</p>
    <h2>Gas delivery and monitoring</h2>
    <ul>
        <li>Precise flow control and reliable vaporisers</li>
        <li>Integrated monitoring of airway pressure, volumes and gases</li>
        <li>Clear alarms and fail-safe oxygen protections</li>
    </ul>
    <h2>Daily checks and service</h2>
    <p>Built-in self-tests make pre-use checks quicker and more consistent. Confirm that calibration, preventive maintenance and spare parts are available locally.</p>`
    },
    {
        id: "importance-of-amc",
        title: "The Importance of AMC for Medical Equipment",
        subheading: "How regular maintenance protects reliability, safety and equipment life.",
        category: "Industry News",
        author: "Medico Team",
        date: "2025-08-02",
        image: "images/blog-biomedical-amc.webp",
        galleryImages: [],
        content: `
    <p>An annual maintenance contract (AMC) turns maintenance from an emergency into a schedule. For hospitals and clinics, that means fewer breakdowns and equipment that stays ready when patients need it.</p>
    <h2>What an AMC covers</h2>
    <ul>
        <li>Scheduled preventive maintenance visits</li>
        <li>Calibration and performance checks</li>
        <li>Priority breakdown support</li>
        <li>Service records for audits and accreditation</li>
    </ul>
    <h2>Why it pays off</h2>
    <p>Small faults found during a routine visit are cheaper and faster to fix than failures in the middle of a procedure. Regular servicing also extends the working life of expensive equipment.</p>
    <p>Medico offers maintenance and AMC support for the equipment we supply across Jammu &amp; Kashmir.</p>`
    }
];

const BlogDB = {
    key: 'medico_blogs',

    init() {
        // Seed each default article once; admin edits and deletions are kept
        const seededKey = 'medico_blogs_seeded';
        let seeded = [];
        try { seeded = JSON.parse(localStorage.getItem(seededKey)) || []; } catch (e) { seeded = []; }
        let stored = [];
        try { stored = JSON.parse(localStorage.getItem(this.key)) || []; } catch (e) { stored = []; }
        if (!localStorage.getItem(this.key)) seeded = [];
        const ids = new Set(stored.map(b => b.id));
        const fresh = defaultBlogs.filter(b => !seeded.includes(b.id) && !ids.has(b.id));
        if (fresh.length || !localStorage.getItem(this.key)) this.saveBlogs(stored.concat(fresh));
        localStorage.setItem(seededKey, JSON.stringify(defaultBlogs.map(b => b.id)));
    },

    getBlogs() {
        this.init();
        const data = localStorage.getItem(this.key);
        return data ? JSON.parse(data) : [];
    },

    saveBlogs(blogs) {
        try {
            localStorage.setItem(this.key, JSON.stringify(blogs));
        } catch (e) {
            alert("Storage quota exceeded! Try deleting old blogs or uploading smaller images.");
        }
    },

    getBlog(id) {
        return this.getBlogs().find(b => b.id === id);
    },

    addBlog(blog) {
        const blogs = this.getBlogs();
        blog.id = Date.now().toString();
        blogs.unshift(blog);
        this.saveBlogs(blogs);
        return blog;
    },

    updateBlog(id, updatedBlog) {
        let blogs = this.getBlogs();
        const index = blogs.findIndex(b => b.id === id);
        if (index !== -1) {
            blogs[index] = { ...blogs[index], ...updatedBlog };
            this.saveBlogs(blogs);
        }
    },

    deleteBlog(id) {
        let blogs = this.getBlogs();
        blogs = blogs.filter(b => b.id !== id);
        this.saveBlogs(blogs);
    }
};

// Initialize DB if empty
BlogDB.init();
