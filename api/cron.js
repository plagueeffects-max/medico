// Daily automatic article (Vercel Cron, see vercel.json). Vercel sends
// "Authorization: Bearer $CRON_SECRET" when CRON_SECRET is set; without it nothing runs.
const crypto = require('crypto');
const { send } = require('./_lib/http');
const { runAuto } = require('./_lib/ai/pipeline');
const { configured } = require('./_lib/ai/groq');

module.exports = async (req, res) => {
  const secret = process.env.CRON_SECRET;
  const given = String(req.headers.authorization || '');
  const expected = `Bearer ${secret}`;
  const okAuth = secret && given.length === expected.length && crypto.timingSafeEqual(Buffer.from(given), Buffer.from(expected));
  if (!okAuth) return send(res, 401, { ok: false, error: 'Unauthorized' });
  if (!configured()) return send(res, 200, { ok: false, status: 'skipped', message: 'AI writer not configured: add GROQ_API_KEY.' });
  const result = await runAuto();
  return send(res, result.status === 'failed' ? 500 : 200, { ok: result.status !== 'failed', ...result });
};
