const express = require('express');
const path = require('path');
const bodyParser = require('body-parser');
const cors = require('cors');
const crypto = require('crypto');
require('dotenv').config();

<<<<<<< HEAD
// Load environment variables manually
if (fs.existsSync(path.join(__dirname, '.env'))) {
    const envConfig = fs.readFileSync(path.join(__dirname, '.env'), 'utf-8').replace(/\r/g, '').split('\n');
    envConfig.forEach(line => {
        const parts = line.split('=');
        if (parts.length >= 2) {
            const key = parts[0].trim();
            const value = parts.slice(1).join('=').trim().replace(/['"]/g, '');
            if (key) process.env[key] = value;
        }
    });
}

=======
>>>>>>> ad1eac739fa9ccd63c3cb8f44f80420da82a8cdb
const app = express();
const PORT = process.env.PORT || 8082;

// Middleware
app.use(cors());
app.use(bodyParser.json({ limit: '50mb' }));
app.use(bodyParser.urlencoded({ limit: '50mb', extended: true }));

// Serve static files
app.use(express.static(path.join(__dirname, './')));
app.use('/assets', express.static(path.join(__dirname, 'assets')));
app.use('/images', express.static(path.join(__dirname, 'images')));
app.use('/Products', express.static(path.join(__dirname, 'Products')));
app.use('/Blog Assets', express.static(path.join(__dirname, 'Blog Assets')));

// Helper: Generate Token (Same as Vercel API)
function generateToken() {
    if (!process.env.ADMIN_PASSWORD) return null;
    return crypto.createHash('sha256').update(process.env.ADMIN_PASSWORD).digest('hex');
}

// --- LOCAL API ROUTES (Mirroring Vercel) ---

// Login Endpoint
app.post('/api/login', (req, res) => {
    const { email, password } = req.body;
    
    if (email === process.env.ADMIN_EMAIL && password === process.env.ADMIN_PASSWORD) {
        const token = generateToken();
        return res.json({ success: true, token });
    }
    
    res.status(401).json({ success: false, message: 'Invalid credentials' });
});

// Verify Token Endpoint
app.post('/api/verify-token', (req, res) => {
    const { token } = req.body;
    const validToken = generateToken();
    
    if (token && token === validToken) {
        return res.json({ success: true });
    }
    
    res.status(401).json({ success: false, message: 'Invalid session' });
});

// Save Blog/Product (Local mock)
app.post('/api/save-blog', (req, res) => {
    res.json({ success: true, message: 'Saved to local session (On Vercel this uses Serverless logic)' });
});

app.post('/api/save-product', (req, res) => {
    res.json({ success: true, message: 'Saved to local session' });
});

// Start Server
app.listen(PORT, () => {
    console.log(`
🚀 Medico Local Server Running!
-------------------------------
URL: http://localhost:${PORT}
Admin Email: ${process.env.ADMIN_EMAIL}
    `);
});
