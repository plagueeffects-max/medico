// Blog data for Medico Insights.
// Articles come from the API (/api/posts). The bundled defaultBlogs below are only a
// fallback for when the API is unreachable (opened from disk, database down).

// The old localStorage copy of the articles is no longer used; free the space.
try { ['medico_blogs', 'medico_blogs_seeded', 'medico_blogs_v5'].forEach((k) => localStorage.removeItem(k)); } catch (e) { /* private mode */ }

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
    // 1. Industry News (1 article) - Featured
    {
        id: "1",
        title: "RE ALFA SKIMS 2025: Advanced Pulmonary Diagnostics",
        subheading: "Exploring the future of respiratory care and Oscillometry at the premier medical symposium.",
        category: "Industry News",
        author: "Medico Team",
        date: "2025-11-20",
        time: "10:00",
        readTime: "6 min read",
        image: "images/blog-featured-icu.webp",
        galleryImages: ["images/products/critical-care.webp", "images/products/oxygen-conc.webp"],
        content: detailedContent,
        featured: true
    },

    // 2. Product Guides (3 articles)
    {
        id: "oxygen-therapy",
        title: "Choosing the Right Oxygen Therapy Solution for Home Care",
        subheading: "A guide to oxygen concentrators, their benefits and what to check before buying.",
        category: "Product Guides",
        author: "Medico Team",
        date: "2025-11-15",
        readTime: "4 min read",
        image: "images/products/oxygen-conc.webp",
        galleryImages: [],
        featured: false,
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
    </ul>`
    },
    {
        id: "schiller-defigard",
        title: "Schiller Defigard Series: What's New for Emergency Care",
        subheading: "Exploring new features and portability enhancements in defibrillation technology.",
        category: "Product Guides",
        author: "Medico Team",
        date: "2025-11-08",
        readTime: "3 min read",
        image: "images/products/emergency.webp",
        galleryImages: [],
        featured: false,
        content: `
    <p>Emergency response in Jammu &amp; Kashmir requires equipment that withstands transit across demanding terrain. The Schiller Defigard Touch 7 combines multiparameter monitoring with high-energy biphasic defibrillation in an ultra-compact chassis.</p>
    <h2>Touchscreen simplicity in critical seconds</h2>
    <p>With an intuitive interface responsive even with clinical gloves, paramedics and emergency physicians can switch from AED to manual defibrillation, pacing, or diagnostic 12-lead ECG instantly.</p>`
    },
    {
        id: "patient-monitoring-guide",
        title: "Multi-Parameter Patient Monitors: A Comprehensive Buyer's Guide",
        subheading: "Key specifications, modularity and connectivity considerations for clinical setups.",
        category: "Product Guides",
        author: "Medico Team",
        date: "2025-10-12",
        readTime: "5 min read",
        image: "images/products/critical-care.webp",
        galleryImages: [],
        featured: false,
        content: `
    <p>Selecting patient monitors requires balancing current acuity needs with future clinical expansion. Modularity ensures that capnography, invasive blood pressure, and cardiac output can be added without replacing base hardware.</p>`
    },

    // 3. Clinical Insights (4 articles)
    {
        id: "surgical-outcomes",
        title: "The Role of Advanced Surgical Equipment in Better Outcomes",
        subheading: "How minimally invasive technologies support precision, safety and recovery.",
        category: "Clinical Insights",
        author: "Medico Team",
        date: "2025-11-12",
        readTime: "5 min read",
        image: "images/blog-surgical-lights.webp",
        galleryImages: [],
        featured: false,
        content: `
    <p>Minimally invasive surgery has changed what patients can expect after an operation: smaller incisions, less pain and shorter hospital stays. The instruments and theatre equipment behind it matter as much as the technique.</p>
    <h2>Visibility first</h2>
    <p>Good surgical lighting and clear laparoscopic imaging reduce fatigue for the surgical team and help them work precisely over long procedures.</p>`
    },
    {
        id: "minimally-invasive",
        title: "Minimally Invasive Surgery: Tools that Make a Difference",
        subheading: "A closer look at advanced instrumentation shaping modern surgical precision.",
        category: "Clinical Insights",
        author: "Medico Team",
        date: "2025-10-25",
        readTime: "5 min read",
        image: "images/products/surgical.webp",
        galleryImages: [],
        featured: false,
        content: `
    <p>Electrosurgical generators, ultrasonic dissectors, and high-definition laparoscopes now form the backbone of modern operating suites. Dependable tactile feedback and ergonomic instrument balance ensure surgeon endurance during complex procedures.</p>`
    },
    {
        id: "anaesthesia-guide",
        title: "Anaesthesia Workstations: Features to Look For",
        subheading: "A practical guide for hospitals selecting an anaesthesia system for safe and efficient care.",
        category: "Clinical Insights",
        author: "Medico Team",
        date: "2025-10-05",
        readTime: "4 min read",
        image: "images/products/anaesthesia.webp",
        galleryImages: [],
        featured: false,
        content: `
    <p>An anaesthesia workstation is one of the most safety-critical pieces of equipment in a hospital. Look for volume and pressure control modes suitable for both adult and paediatric patients, with accurate low tidal volume delivery.</p>`
    },
    {
        id: "alfa-assessment",
        title: "ALFA 2025: Annual Lung Function Assessment Protocols",
        subheading: "Understanding the latest protocols for assessing respiratory health in post-operative patients.",
        category: "Clinical Insights",
        author: "Dr. Naseer Andrabi",
        date: "2025-09-28",
        readTime: "4 min read",
        image: "images/insight-alfa.webp",
        galleryImages: [],
        featured: false,
        content: `
    <p>Spirometry interpretation and diffusion capacity testing require calibrated pneumotachographs and strict environmental control. We review the 2025 standards for lung mechanics evaluation in high-altitude environments.</p>`
    },

    // 4. Healthcare Infrastructure (2 articles)
    {
        id: "icu-readiness",
        title: "Strengthening ICU Readiness in Jammu & Kashmir",
        subheading: "Key infrastructure and equipment essentials for building resilient critical care units.",
        category: "Healthcare Infrastructure",
        author: "Medico Team",
        date: "2025-10-20",
        readTime: "6 min read",
        image: "images/blog-featured-icu.webp",
        galleryImages: [],
        featured: false,
        content: `
    <p>Critical care in Jammu &amp; Kashmir has to work through long winters, power interruptions and long transfer distances. An ICU that is ready for those conditions is planned around reliability as much as capability.</p>
    <h2>Start with monitoring</h2>
    <p>Every ICU bed needs a multi-parameter patient monitor covering ECG, SpO2, non-invasive blood pressure and temperature, with invasive pressure and capnography where the case mix calls for it.</p>`
    },
    {
        id: "biomedical-infrastructure",
        title: "Biomedical Equipment Maintenance in High-Altitude Hospitals",
        subheading: "Managing sub-zero ambient temperatures and oxygen concentrator sieve bed protection.",
        category: "Healthcare Infrastructure",
        author: "Medico Team",
        date: "2025-09-15",
        readTime: "5 min read",
        image: "images/blog-biomedical-amc.webp",
        galleryImages: [],
        featured: false,
        content: `
    <p>Sub-zero winter conditions impact medical electronics, battery run-times, and pneumatic sensors. Regular preventative servicing and genuine OEM filters prevent moisture build-up and preserve device lifespan.</p>`
    },

    // 5. Patient Care (2 articles)
    {
        id: "sleep-apnea",
        title: "Understanding Sleep Apnea and NIV Therapy",
        subheading: "How non-invasive ventilation can improve sleep quality and respiratory health.",
        category: "Patient Care",
        author: "Medico Team",
        date: "2025-11-02",
        readTime: "4 min read",
        image: "images/blog-sleep-apnea.webp",
        galleryImages: [],
        featured: false,
        content: `
    <p>Obstructive sleep apnoea happens when the airway repeatedly narrows or closes during sleep. Loud snoring, choking at night and daytime sleepiness are common signs.</p>
    <h2>How CPAP helps</h2>
    <p>A CPAP device delivers gentle, steady air pressure through a mask, keeping the airway open through the night.</p>`
    },
    {
        id: "home-respiratory-care",
        title: "Managing Chronic Respiratory Illness at Home: Family Guide",
        subheading: "Practical guidelines for oxygen concentrator operation, hygiene and alarm management.",
        category: "Patient Care",
        author: "Medico Team",
        date: "2025-09-08",
        readTime: "4 min read",
        image: "images/products/sleep.webp",
        galleryImages: [],
        featured: false,
        content: `
    <p>Families caring for chronic COPD patients require clear instructions on nasal cannula replacement, distilled water humidifier bottle cleaning, and oxygen purity checks.</p>`
    }
];

const BlogDB = {
  _promise: null,

  /** All published articles, newest first. Resolves to the bundled defaults if the API fails. */
  load() {
    if (this._promise) return this._promise;
    const root = (u) => (!u || /^(https?:|data:|\/)/i.test(u) ? u : `/${u}`);
    const norm = (b) => ({ ...b, image: root(b.image), galleryImages: (b.galleryImages || []).map(root) });
    this._promise = (async () => {
      try {
        const ssr = document.getElementById('ssr-posts') || document.getElementById('ssr-post');
        if (ssr) {
          const data = JSON.parse(ssr.textContent);
          if (Array.isArray(data.posts) && data.posts.length) return data.posts.map(norm);
        }
      } catch (e) { /* fall through to the API */ }
      try {
        const res = await fetch('/api/posts', { headers: { Accept: 'application/json' } });
        const json = await res.json();
        if (json.success && Array.isArray(json.posts) && json.posts.length) return json.posts.map(norm);
      } catch (e) { /* offline or API down */ }
      return defaultBlogs.map(norm);
    })();
    return this._promise;
  },

  async getBlog(idOrSlug) {
    return (await this.load()).find((b) => b.id === idOrSlug || b.slug === idOrSlug);
  },

  /** Canonical article URL. */
  url(b) {
    return `/blog/${encodeURIComponent(b.slug || b.id)}`;
  }
};
