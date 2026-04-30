const crypto = require('crypto');

function generateToken() {
    if (!process.env.ADMIN_PASSWORD) return null;
    return crypto.createHash('sha256').update(process.env.ADMIN_PASSWORD).digest('hex');
}

module.exports = (req, res) => {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    if (req.method === 'OPTIONS') return res.status(200).end();
    if (req.method !== 'POST') return res.status(405).json({ success: false, message: 'Method not allowed' });

    const { token } = req.body;
    const validToken = generateToken();

    if (!validToken) {
        return res.status(500).json({ success: false, message: 'Server not configured.' });
    }

    if (token && token === validToken) {
        return res.json({ success: true });
    } else {
        return res.status(401).json({ success: false, message: 'Invalid token.' });
    }
};
