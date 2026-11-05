// Framework-agnostic request/response helpers, so the same handlers run on Vercel and in server.js.
const crypto = require('crypto');

const MAX_BODY = 4 * 1024 * 1024; // Vercel caps request bodies at 4.5 MB

/** Query params from the URL, merged with any the router added (Vercel route dest / Express). */
function getQuery(req) {
  const out = Object.fromEntries(new URL(req.url || '/', 'http://x').searchParams);
  if (req.query && typeof req.query === 'object') for (const [k, v] of Object.entries(req.query)) if (!(k in out)) out[k] = Array.isArray(v) ? v[0] : v;
  if (req.medicoParams) Object.assign(out, req.medicoParams);
  return out;
}

const pathOf = (req) => new URL(req.url || '/', 'http://x').pathname;

/** JSON body: uses a body the platform already parsed, otherwise reads the stream. */
async function readBody(req) {
  if (req.body !== undefined && req.body !== null) {
    if (Buffer.isBuffer(req.body)) return parse(req.body.toString('utf8'));
    if (typeof req.body === 'string') return parse(req.body);
    return req.body;
  }
  const chunks = [];
  let size = 0;
  for await (const chunk of req) {
    size += chunk.length;
    if (size > MAX_BODY) throw Object.assign(new Error('Request is too large.'), { status: 413 });
    chunks.push(chunk);
  }
  return parse(Buffer.concat(chunks).toString('utf8'));
}
function parse(text) {
  if (!text) return {};
  try { return JSON.parse(text); } catch { throw Object.assign(new Error('Invalid JSON body.'), { status: 400 }); }
}

function send(res, status, body, headers = {}) {
  res.statusCode = status;
  for (const [k, v] of Object.entries(headers)) res.setHeader(k, v);
  if (typeof body === 'string' || Buffer.isBuffer(body)) return res.end(body);
  if (!res.getHeader('Content-Type')) res.setHeader('Content-Type', 'application/json; charset=utf-8');
  return res.end(JSON.stringify(body));
}

function cookies(req) {
  const out = {};
  for (const part of String(req.headers.cookie || '').split(';')) {
    const i = part.indexOf('=');
    if (i > 0) out[part.slice(0, i).trim()] = decodeURIComponent(part.slice(i + 1).trim());
  }
  return out;
}

const clientIp = (req) =>
  String(req.headers['x-forwarded-for'] || '').split(',')[0].trim() || req.headers['x-real-ip'] || req.socket?.remoteAddress || 'unknown';

/** Stored instead of the raw IP address. */
const ipHash = (req) => crypto.createHash('sha256').update(`medico:${clientIp(req)}`).digest('hex');

const siteUrl = () => (process.env.SITE_URL || 'https://medico-inky.vercel.app').replace(/\/+$/, '');

module.exports = { getQuery, pathOf, readBody, send, cookies, clientIp, ipHash, siteUrl };
