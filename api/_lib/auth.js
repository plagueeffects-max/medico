// Admin sign-in: ADMIN_EMAIL + ADMIN_PASSWORD from the environment, an HMAC-signed,
// expiring, HttpOnly session cookie, constant-time comparisons and DB-backed rate limiting.
const crypto = require('crypto');
const { query } = require('./db');
const { cookies, ipHash } = require('./http');

const COOKIE = 'medico_admin';
const MAX_AGE = 7 * 24 * 60 * 60; // seconds
const MAX_FAILS = 8; // per IP per 15 minutes

/** Signing key. ADMIN_SESSION_SECRET is preferred; without it a key is derived from ADMIN_PASSWORD. */
function secret() {
  if (process.env.ADMIN_SESSION_SECRET) return process.env.ADMIN_SESSION_SECRET;
  if (process.env.ADMIN_PASSWORD) return crypto.createHash('sha256').update(`medico-session:${process.env.ADMIN_PASSWORD}`).digest('hex');
  return '';
}

const same = (a, b) => crypto.timingSafeEqual(
  crypto.createHash('sha256').update(String(a)).digest(),
  crypto.createHash('sha256').update(String(b)).digest()
);
const sign = (payload) => crypto.createHmac('sha256', secret()).update(payload).digest('base64url');

function createToken(email) {
  const payload = Buffer.from(JSON.stringify({ sub: email, exp: Date.now() + MAX_AGE * 1000 })).toString('base64url');
  return `${payload}.${sign(payload)}`;
}

function verifyToken(token) {
  if (!token || !secret()) return null;
  const [payload, sig] = String(token).split('.');
  if (!payload || !sig || !same(sig, sign(payload))) return null;
  try {
    const data = JSON.parse(Buffer.from(payload, 'base64url').toString('utf8'));
    return typeof data.exp === 'number' && Date.now() < data.exp ? data : null;
  } catch { return null; }
}

const cookieHeader = (value, maxAge) =>
  `${COOKIE}=${value}; Path=/; HttpOnly; SameSite=Lax; Max-Age=${maxAge}${process.env.VERCEL ? '; Secure' : ''}`;

const session = (req) => verifyToken(cookies(req)[COOKIE]);

function checkCredentials(email, password) {
  const e = process.env.ADMIN_EMAIL;
  const p = process.env.ADMIN_PASSWORD;
  if (!e || !p) return false;
  // Evaluate both so timing does not reveal which one was wrong
  const okEmail = same(String(email || '').trim().toLowerCase(), e.trim().toLowerCase());
  const okPass = same(String(password || ''), p);
  return okEmail && okPass;
}

async function tooManyFails(req) {
  const [{ n }] = await query(`SELECT count(*)::int AS n FROM medico_login_attempts WHERE ip_hash = $1 AND created_at > now() - interval '15 minutes'`, [ipHash(req)]);
  return n >= MAX_FAILS;
}
async function recordFail(req) {
  await query('INSERT INTO medico_login_attempts (ip_hash) VALUES ($1)', [ipHash(req)]);
  // Housekeeping: old attempts are useless
  await query(`DELETE FROM medico_login_attempts WHERE created_at < now() - interval '1 day'`);
}
const clearFails = (req) => query('DELETE FROM medico_login_attempts WHERE ip_hash = $1', [ipHash(req)]);

module.exports = { COOKIE, MAX_AGE, secret, createToken, verifyToken, cookieHeader, session, checkCredentials, tooManyFails, recordFail, clearFails };

if (require.main === module) {
  const assert = require('assert');
  process.env.ADMIN_SESSION_SECRET = 'test-secret';
  const t = createToken('a@b.c');
  assert(verifyToken(t));
  assert(!verifyToken(t.replace(/.$/, (c) => (c === 'A' ? 'B' : 'A'))));
  assert(!verifyToken('x.y'));
  const expired = Buffer.from(JSON.stringify({ sub: 'a', exp: Date.now() - 1 })).toString('base64url');
  assert(!verifyToken(`${expired}.${sign(expired)}`));
  console.log('auth ok');
}
