require('dotenv').config();
const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const app = express();
const PORT = process.env.PORT || 8082;

// Verify Admin Credentials on Startup
if (!process.env.ADMIN_EMAIL || !process.env.ADMIN_PASSWORD) {
    console.warn('\n[WARNING] ADMIN_EMAIL or ADMIN_PASSWORD not found in environment variables.');
    console.warn('Admin login will not function until these are set.\n');
}

app.use(cors());
app.use(bodyParser.json({ limit: '100mb' })); // Support large images
app.use(express.static(path.join(__dirname)));

const BLOG_ASSETS_DIR = path.join(__dirname, 'Blog Assets');

// Top-Tier Security: Active Tokens
const activeTokens = new Set();

// Security Middleware
function requireAuth(req, res, next) {
    const authHeader = req.headers['authorization'];
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(401).json({ success: false, message: 'Unauthorized: Missing or invalid token' });
    }
    const token = authHeader.split(' ')[1];
    if (!activeTokens.has(token)) {
        return res.status(401).json({ success: false, message: 'Unauthorized: Invalid or expired token' });
    }
    next();
}

// Ensure base dir exists
if (!fs.existsSync(BLOG_ASSETS_DIR)) {
    fs.mkdirSync(BLOG_ASSETS_DIR, { recursive: true });
}

// Helper to save base64 to file
function saveBase64File(base64Str, targetPath) {
    if (!base64Str || !base64Str.startsWith('data:')) return false;
    try {
        const parts = base64Str.split(';base64,');
        if (parts.length !== 2) return false;
        const data = Buffer.from(parts[1], 'base64');
        fs.writeFileSync(targetPath, data);
        return true;
    } catch (e) {
        console.error("Failed to save file:", e);
        return false;
    }
}

function saveBase64Image(base64Str, targetPath) {
    return saveBase64File(base64Str, targetPath);
}

// Admin Login Endpoint
app.post('/api/login', (req, res) => {
    const { email, password } = req.body;
    
    // Use environment variables (configured via .env or hosting provider)
    const adminEmail = process.env.ADMIN_EMAIL;
    const adminPassword = process.env.ADMIN_PASSWORD;

    // Reject login if server isn't configured with credentials
    if (!adminEmail || !adminPassword) {
        return res.status(500).json({ success: false, message: 'Server configuration error: Missing admin credentials' });
    }

    // Server-side credential check
    if (email === adminEmail && password === adminPassword) {
        const token = crypto.randomBytes(32).toString('hex');
        activeTokens.add(token);
        res.json({ success: true, token });
    } else {
        res.status(401).json({ success: false, message: 'Invalid credentials' });
    }
});

app.post('/api/verify-token', (req, res) => {
    const { token } = req.body;
    if (token && activeTokens.has(token)) {
        res.json({ success: true });
    } else {
        res.status(401).json({ success: false });
    }
});

app.post('/api/save-blog', requireAuth, (req, res) => {
    try {
        const blog = req.body;
        
        // Create safe folder name from title
        const safeTitle = blog.title.replace(/[^a-z0-9 ]/gi, '').trim().substring(0, 50);
        
        const blogDir = path.join(BLOG_ASSETS_DIR, safeTitle);
        const imagesDir = path.join(blogDir, 'Images');
        
        if (!fs.existsSync(blogDir)) fs.mkdirSync(blogDir, { recursive: true });
        if (!fs.existsSync(imagesDir)) fs.mkdirSync(imagesDir, { recursive: true });

        // Save Main Image
        if (blog.image && blog.image.startsWith('data:image')) {
            const extMatches = blog.image.match(/^data:image\/([A-Za-z-+\/]+);base64,/);
            const ext = (extMatches && extMatches[1] === 'jpeg') ? 'jpg' : (extMatches ? extMatches[1] : 'png');
            const filename = `main.${ext}`;
            const targetPath = path.join(imagesDir, filename);
            
            if (saveBase64Image(blog.image, targetPath)) {
                // Update object with relative URL (using forward slashes for web)
                blog.image = `Blog Assets/${safeTitle}/Images/${filename}`.replace(/\\/g, '/');
            }
        }

        // Save Gallery Images
        if (blog.galleryImages && Array.isArray(blog.galleryImages)) {
            blog.galleryImages = blog.galleryImages.map((b64, idx) => {
                if (b64.startsWith('data:image')) {
                    const extMatches = b64.match(/^data:image\/([A-Za-z-+\/]+);base64,/);
                    const ext = (extMatches && extMatches[1] === 'jpeg') ? 'jpg' : (extMatches ? extMatches[1] : 'png');
                    const filename = `gallery_${Date.now()}_${idx + 1}.${ext}`;
                    const targetPath = path.join(imagesDir, filename);
                    
                    if (saveBase64Image(b64, targetPath)) {
                        return `Blog Assets/${safeTitle}/Images/${filename}`.replace(/\\/g, '/');
                    }
                }
                return b64; // Return original if not base64
            });
        }

        // Send back the modified blog object (now containing file paths instead of base64 strings)
        res.json({ success: true, blog });

    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, error: error.message });
    }
});

const PRODUCTS_DIR = path.join(__dirname, 'Products');
if (!fs.existsSync(PRODUCTS_DIR)) {
    fs.mkdirSync(PRODUCTS_DIR, { recursive: true });
}

app.post('/api/save-product', requireAuth, (req, res) => {
    try {
        const product = req.body;
        
        // Create safe folder names
        const safeCategory = (product.category || 'Uncategorized').replace(/[^a-z0-9 -]/gi, '').trim();
        const safeSubcategory = (product.subcategory || 'General').replace(/[^a-z0-9 -]/gi, '').trim();
        const safeTitle = product.title.replace(/[^a-z0-9 -]/gi, '').trim().substring(0, 50);
        
        const categoryDir = path.join(PRODUCTS_DIR, safeCategory);
        const subcategoryDir = path.join(categoryDir, safeSubcategory);
        const productDir = path.join(subcategoryDir, safeTitle);
        const imagesDir = path.join(productDir, 'Images');
        
        if (!fs.existsSync(categoryDir)) fs.mkdirSync(categoryDir, { recursive: true });
        if (!fs.existsSync(subcategoryDir)) fs.mkdirSync(subcategoryDir, { recursive: true });
        if (!fs.existsSync(productDir)) fs.mkdirSync(productDir, { recursive: true });
        if (!fs.existsSync(imagesDir)) fs.mkdirSync(imagesDir, { recursive: true });

        // Save Main Image
        if (product.mainImage && product.mainImage.startsWith('data:image')) {
            const extMatches = product.mainImage.match(/^data:image\/([A-Za-z-+\/]+);base64,/);
            const ext = (extMatches && extMatches[1] === 'jpeg') ? 'jpg' : (extMatches ? extMatches[1] : 'png');
            const filename = `main.${ext}`;
            const targetPath = path.join(imagesDir, filename);
            
            if (saveBase64Image(product.mainImage, targetPath)) {
                product.mainImage = `Products/${safeCategory}/${safeSubcategory}/${safeTitle}/Images/${filename}`.replace(/\\/g, '/');
            }
        }

        // Save Gallery Images
        if (product.gallery && Array.isArray(product.gallery)) {
            product.gallery = product.gallery.map((b64, idx) => {
                if (b64 && typeof b64 === 'string' && b64.startsWith('data:image')) {
                    const extMatches = b64.match(/^data:image\/([A-Za-z-+\/]+);base64,/);
                    const ext = (extMatches && extMatches[1] === 'jpeg') ? 'jpg' : (extMatches ? extMatches[1] : 'png');
                    const filename = `gallery_${Date.now()}_${idx + 1}.${ext}`;
                    const targetPath = path.join(imagesDir, filename);
                    
                    if (saveBase64Image(b64, targetPath)) {
                        return `Products/${safeCategory}/${safeSubcategory}/${safeTitle}/Images/${filename}`.replace(/\\/g, '/');
                    }
                }
                return b64;
            });
        }

        // Save Brochure
        if (product.brochure && product.brochure.startsWith('data:application/pdf')) {
            const filename = `brochure_${Date.now()}.pdf`;
            const targetPath = path.join(productDir, filename);
            if (saveBase64File(product.brochure, targetPath)) {
                product.brochure = `Products/${safeCategory}/${safeSubcategory}/${safeTitle}/${filename}`.replace(/\\/g, '/');
            }
        }

        // Save JSON data
        const dataPath = path.join(productDir, 'data.json');
        fs.writeFileSync(dataPath, JSON.stringify(product, null, 4));

        res.json({ success: true, product });

    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, error: error.message });
    }
});

app.listen(PORT, () => {
    console.log(`\n==========================================`);
    console.log(`Medico CMS Local Server Running!`);
    console.log(`Access the site at: http://localhost:${PORT}`);
    console.log(`==========================================\n`);
});
