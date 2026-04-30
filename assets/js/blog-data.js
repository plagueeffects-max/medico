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
        <li style="margin-bottom:10px;"><strong>Next-Gen CPAP/BiPAP Machines:</strong> Featuring advanced auto-titration algorithms and integrated heated humidification for optimal patient comfort and compliance.</li>
        <li style="margin-bottom:10px;"><strong>High-Flow Nasal Cannula (HFNC) Systems:</strong> Essential for managing acute hypoxemic respiratory failure, providing precise oxygen delivery.</li>
        <li style="margin-bottom:10px;"><strong>Portable Oxygen Concentrators:</strong> Lightweight and durable solutions for active patients requiring long-term oxygen therapy.</li>
    </ul>

    <p>Our team of clinical specialists will be on hand to provide live demonstrations, answer technical questions, and discuss how our equipment can integrate seamlessly into your clinical workflows to improve patient outcomes.</p>
`;

const defaultBlogs = [
    {
        id: "1",
        title: "RE ALFA SKIMS 2025: Advanced Pulmonary Diagnostics",
        subheading: "Exploring the future of respiratory care and Oscillometry at the premier medical symposium.",
        author: "Medico Team",
        date: "2025-11-20",
        time: "10:00",
        image: "images/medico_shop.webp",
        galleryImages: ["images/6card.png", "images/3card.png", "images/7card.png"],
        content: detailedContent,
        featured: true
    },
    {
        id: "2",
        title: "ALFA 2025: Annual Lung Function Assessment",
        subheading: "Understanding the latest protocols for assessing respiratory health in post-operative patients.",
        author: "Dr. Naseer Andrabi",
        date: "2025-11-03",
        time: "14:30",
        image: "images/image2.png",
        galleryImages: [],
        content: "<p>Join us for the Annual Lung Function Assessment program where we will discuss the latest protocols for assessing respiratory health in post-operative patients. The session will cover spirometry interpretation, diffusion capacity, and practical workshops on equipment calibration.</p>",
        featured: false
    }
];

const BlogDB = {
    key: 'medico_blogs',

    init() {
        if (!localStorage.getItem(this.key)) {
            this.saveBlogs(defaultBlogs);
        }
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
