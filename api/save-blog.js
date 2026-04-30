const crypto = require('crypto');

function generateToken() {
    if (!process.env.ADMIN_PASSWORD) return null;
    return crypto.createHash('sha256').update(process.env.ADMIN_PASSWORD).digest('hex');
}

function requireAuth(req) {
    const authHeader = req.headers['authorization'];
    if (!authHeader || !authHeader.startsWith('Bearer ')) return false;
    const token = authHeader.split(' ')[1];
    const validToken = generateToken();
    return validToken && token === validToken;
}

module.exports = (req, res) => {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

    if (req.method === 'OPTIONS') return res.status(200).end();
    if (req.method !== 'POST') return res.status(405).json({ success: false, message: 'Method not allowed' });

    if (!requireAuth(req)) {
        return res.status(401).json({ success: false, message: 'Unauthorized' });
    }

    // NOTE: On Vercel, the filesystem is read-only.
    // This endpoint acknowledges the request and returns the blog data
    // with base64 images preserved (since we cannot write to disk).
    // Images are stored in localStorage via the frontend.
    const blog = req.body;

    if (!blog || !blog.title) {
        return res.status(400).json({ success: false, message: 'Invalid blog data.' });
    }

    // Return the blog as-is; frontend will save to localStorage
    return res.json({ success: true, blog });
};
