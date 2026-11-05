// Admin-controlled settings, stored as key/value rows in medico_admin_settings.
const { query, hasDb, withTimeout } = require('./db');

const SETTINGS_DEFAULTS = {
  // Article writer
  blog_auto_enabled: true,
  // Medical content: AI drafts wait for a person by default. Even when on, posts stay noindex until reviewed.
  blog_auto_publish: false,
  blog_every_days: 1,
  blog_region: 'Jammu and Kashmir',
  blog_length: 'medium',
  blog_extra_instructions: '',
  ai_model: 'openai/gpt-oss-120b',

  // Business facts: fed into JSON-LD, llms.txt and the writer's allowed facts
  business_name: 'Medico Scientific Service Centre',
  phone: '+91 94190 08453',
  whatsapp: '919419008453',
  email: 'medicosgr@gmail.com',
  address_street: '2nd Floor, Iqbal Complex, Opposite Iqbal Park, Shergarhi',
  address_city: 'Srinagar',
  address_region: 'Jammu and Kashmir',
  address_postcode: '190008',
  hours: 'Mon to Sun, 9:00 AM to 8:00 PM',
  opens: '09:00',
  closes: '20:00',
  map_url: 'https://www.google.com/maps/search/?api=1&query=Medico+Scientific+Service+Centre+Iqbal+Complex+Shergarhi+Srinagar+190008',
  gstin: '01AALPI4731K1ZV',
  founded: '2000',
  founder: 'Syed Naseer Ahmad Andrabi',
  partners_count: '100+',
  brands: 'Philips (respiratory and sleep therapy), Schiller (diagnostics), Shalya (surgical equipment)',
  services: 'Equipment supply and installation; staff training and clinical orientation; preventive maintenance and AMC; repair and calibration; 7-days-a-week technical support',
  same_as: [],
};

async function getSettings() {
  const out = { ...SETTINGS_DEFAULTS };
  if (!hasDb()) return out;
  const rows = await withTimeout(query('SELECT key, value FROM medico_admin_settings WHERE key = ANY($1)', [Object.keys(SETTINGS_DEFAULTS)]));
  for (const { key, value } of rows) {
    const def = SETTINGS_DEFAULTS[key];
    if (Array.isArray(def) ? Array.isArray(value) : typeof value === typeof def) out[key] = value;
  }
  return out;
}

/** Settings for public pages: never throws, falls back to the defaults. */
const getSettingsSafe = () => getSettings().catch(() => ({ ...SETTINGS_DEFAULTS }));

/** Save only known keys whose type matches the default. */
async function saveSettings(patch) {
  const entries = Object.entries(patch || {}).filter(([k, v]) => {
    const def = SETTINGS_DEFAULTS[k];
    return k in SETTINGS_DEFAULTS && (Array.isArray(def) ? Array.isArray(v) : typeof v === typeof def);
  });
  for (const [key, value] of entries) {
    await query(
      `INSERT INTO medico_admin_settings (key, value, updated_at) VALUES ($1, $2::jsonb, now())
       ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value, updated_at = now()`,
      [key, JSON.stringify(value)]
    );
  }
  return entries.length;
}

module.exports = { SETTINGS_DEFAULTS, getSettings, getSettingsSafe, saveSettings };
