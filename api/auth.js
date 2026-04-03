// api/auth.js
// POST /api/auth  → { token, expiresAt }
// Validates hardcoded credentials stored in Vercel env vars.

const jwt = require('jsonwebtoken');
const { handleCors } = require('./_sheets');

module.exports = async function handler(req, res) {
  if (handleCors(req, res)) return;

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { username, password } = req.body ?? {};

  if (!username || !password) {
    return res.status(400).json({ error: 'Username and password are required' });
  }

  // Credentials are stored in Vercel environment variables.
  // Set ADMIN_USERNAME and ADMIN_PASSWORD in your Vercel project settings.
  const validUsername = process.env.ADMIN_USERNAME;
  const validPassword = process.env.ADMIN_PASSWORD;

  if (!validUsername || !validPassword) {
    console.error('ADMIN_USERNAME or ADMIN_PASSWORD env vars not set');
    return res.status(500).json({ error: 'Server misconfiguration' });
  }

  if (username !== validUsername || password !== validPassword) {
    // Artificial delay to slow brute-force attempts
    await new Promise((r) => setTimeout(r, 500));
    return res.status(401).json({ error: 'Invalid credentials' });
  }

  const expiresIn = 8 * 60 * 60; // 8 hours in seconds
  const expiresAt = Date.now() + expiresIn * 1000;

  const token = jwt.sign(
    { sub: username, iat: Math.floor(Date.now() / 1000) },
    process.env.JWT_SECRET,
    { expiresIn }
  );

  return res.status(200).json({ token, expiresAt });
};
