// Groq chat completions over plain fetch (OpenAI-compatible API), JSON mode, model fallback.
const ENDPOINT = 'https://api.groq.com/openai/v1/chat/completions';
// Same family MDF uses; the admin-chosen model goes first
const FALLBACK_MODELS = ['openai/gpt-oss-120b', 'llama-3.3-70b-versatile', 'openai/gpt-oss-20b'];

const configured = () => Boolean(process.env.GROQ_API_KEY && process.env.GROQ_API_KEY.trim());

function parseJson(text) {
  const s = String(text || '');
  const json = s.slice(s.indexOf('{'), s.lastIndexOf('}') + 1);
  return JSON.parse(json);
}

async function call(model, system, user, maxTokens, timeoutMs) {
  const body = {
    model,
    messages: [{ role: 'system', content: system }, { role: 'user', content: user }],
    temperature: 0.6,
    max_completion_tokens: maxTokens,
    response_format: { type: 'json_object' },
  };
  if (model.startsWith('openai/gpt-oss')) Object.assign(body, { reasoning_effort: 'low', include_reasoning: false });
  for (let attempt = 0; ; attempt++) {
    const res = await fetch(ENDPOINT, {
      method: 'POST',
      headers: { Authorization: `Bearer ${process.env.GROQ_API_KEY.trim()}`, 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
      signal: AbortSignal.timeout(timeoutMs),
    });
    if (res.status === 429 && attempt === 0) {
      const wait = Number(res.headers.get('retry-after'));
      if (wait > 0 && wait <= 10) { await new Promise((r) => setTimeout(r, wait * 1000)); continue; }
    }
    if (!res.ok) {
      const detail = (await res.text().catch(() => '')).slice(0, 200);
      throw new Error(`Groq ${model} returned ${res.status}${detail ? `: ${detail}` : ''}`);
    }
    const data = await res.json();
    return data.choices?.[0]?.message?.content || '';
  }
}

/**
 * Ask for a JSON object. Tries the preferred model, then the fallbacks; a reply that is
 * not valid JSON (or fails `accept`) counts as a failure and moves to the next model.
 */
async function askJson({ model, system, user, maxTokens = 4000, timeoutMs = 28000, accept = () => true, deadline = Infinity }) {
  if (!configured()) throw new Error('AI writer not configured: add GROQ_API_KEY.');
  const models = [...new Set([model, ...FALLBACK_MODELS].filter(Boolean))];
  let lastError;
  for (const m of models) {
    const left = deadline - Date.now();
    if (left < 8000) break;
    try {
      const raw = parseJson(await call(m, system, user, maxTokens, Math.min(timeoutMs, left - 2000)));
      if (accept(raw)) return { raw, model: m };
      lastError = new Error('The AI reply was incomplete.');
    } catch (err) {
      lastError = err;
    }
  }
  throw new Error(`The AI could not finish: ${lastError ? lastError.message : 'out of time'}`);
}

module.exports = { askJson, configured, parseJson, FALLBACK_MODELS };
