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

    const { email, password } = req.body;

    const adminEmail = process.env.ADMIN_EMAIL;
    const adminPassword = process.env.ADMIN_PASSWORD;

    if (!adminEmail || !adminPassword) {
        return res.status(500).json({ success: false, message: 'Server configuration error: ADMIN_EMAIL or ADMIN_PASSWORD not set in environment variables.' });
    }

    if (email === adminEmail && password === adminPassword) {
        const token = generateToken();
        return res.json({ success: true, token });
    } else {
        return res.status(401).json({ success: false, message: 'Invalid email or password.' });
    }
};
