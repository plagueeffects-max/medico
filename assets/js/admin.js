// Medico admin: app shell, API client, shared UI helpers, command palette,
// and the Overview, Inquiries, Pictures, Site text and Settings views.
// Articles, AI writer and Products live in admin-content.js.
(() => {
  /* ---------------- Icons (Lucide-style strokes) ---------------- */
  const ICONS = {
    overview: '<path d="M3 13h8V3H3zM13 21h8V11h-8zM13 3v6h8V3zM3 21h8v-6H3z"/>',
    articles: '<path d="M14 3H6a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V9z"/><path d="M14 3v6h6M8 13h8M8 17h5"/>',
    writer: '<path d="M12 8V4H8"/><rect width="16" height="12" x="4" y="8" rx="2"/><path d="M2 14h2"/><path d="M20 14h2"/><path d="M15 13v2"/><path d="M9 13v2"/>',
    bot: '<path d="M12 8V4H8"/><rect width="16" height="12" x="4" y="8" rx="2"/><path d="M2 14h2"/><path d="M20 14h2"/><path d="M15 13v2"/><path d="M9 13v2"/>',
    products: '<path d="M21 8l-9-5-9 5v8l9 5 9-5z"/><path d="M3 8l9 5 9-5M12 13v8"/>',
    inquiries: '<path d="M4 4h16v12H7l-3 3z"/><path d="M8 9h8M8 12h5"/>',
    media: '<rect x="3" y="4" width="18" height="16" rx="2"/><circle cx="9" cy="10" r="2"/><path d="M21 16l-5-5-9 9"/>',
    copy: '<path d="M4 7V5h16v2M9 19h6M12 5v14"/>',
    settings: '<circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.7 1.7 0 0 0 .3 1.8l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.7 1.7 0 0 0-1.8-.3 1.7 1.7 0 0 0-1 1.5V21a2 2 0 1 1-4 0v-.1a1.7 1.7 0 0 0-1.1-1.5 1.7 1.7 0 0 0-1.8.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.7 1.7 0 0 0 .3-1.8 1.7 1.7 0 0 0-1.5-1H3a2 2 0 1 1 0-4h.1a1.7 1.7 0 0 0 1.5-1.1 1.7 1.7 0 0 0-.3-1.8l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.7 1.7 0 0 0 1.8.3H9a1.7 1.7 0 0 0 1-1.5V3a2 2 0 1 1 4 0v.1a1.7 1.7 0 0 0 1 1.5 1.7 1.7 0 0 0 1.8-.3l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.7 1.7 0 0 0-.3 1.8V9a1.7 1.7 0 0 0 1.5 1H21a2 2 0 1 1 0 4h-.1a1.7 1.7 0 0 0-1.5 1z"/>',
    external: '<path d="M14 4h6v6M20 4l-9 9M18 14v5a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V7a1 1 0 0 1 1-1h5"/>',
    sidebar: '<rect x="3" y="4" width="18" height="16" rx="2"/><path d="M9 4v16"/>',
    logout: '<path d="M15 4h4a1 1 0 0 1 1 1v14a1 1 0 0 1-1 1h-4M10 17l5-5-5-5M15 12H3"/>',
    menu: '<path d="M4 6h16M4 12h16M4 18h16"/>',
    search: '<circle cx="11" cy="11" r="7"/><path d="M20 20l-3.5-3.5"/>',
    plus: '<path d="M12 5v14M5 12h14"/>',
    check: '<path d="M5 12l5 5L20 7"/>',
    x: '<path d="M6 6l12 12M18 6L6 18"/>',
    trash: '<path d="M4 7h16M10 11v6M14 11v6M6 7l1 13h10l1-13M9 7V4h6v3"/>',
    upload: '<path d="M12 16V4M7 9l5-5 5 5M4 16v3a1 1 0 0 0 1 1h14a1 1 0 0 0 1-1v-3"/>',
    eye: '<path d="M2 12s3.6-7 10-7 10 7 10 7-3.6 7-10 7S2 12 2 12z"/><circle cx="12" cy="12" r="3"/>',
    link: '<path d="M10 14a4 4 0 0 0 5.7 0l3-3a4 4 0 0 0-5.7-5.7l-1 1M14 10a4 4 0 0 0-5.7 0l-3 3a4 4 0 0 0 5.7 5.7l1-1"/>',
    phone: '<path d="M5 3h4l2 5-2.5 1.5a11 11 0 0 0 6 6L16 13l5 2v4a2 2 0 0 1-2 2A17 17 0 0 1 3 5a2 2 0 0 1 2-2z"/>',
    mail: '<rect x="3" y="5" width="18" height="14" rx="2"/><path d="M3 7l9 6 9-6"/>',
    star: '<path d="M12 3l2.8 5.7 6.2.9-4.5 4.4 1 6.2L12 17.3 6.5 20.2l1-6.2L3 9.6l6.2-.9z"/>',
    clock: '<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>',
    alert: '<path d="M12 3l10 18H2z"/><path d="M12 10v4M12 17.5v.5"/>',
    refresh: '<path d="M20 11a8 8 0 0 0-14.9-3M4 4v4h4M4 13a8 8 0 0 0 14.9 3M20 20v-4h-4"/>',
    copyIcon: '<rect x="8" y="8" width="12" height="12" rx="2"/><path d="M16 8V5a1 1 0 0 0-1-1H5a1 1 0 0 0-1 1v10a1 1 0 0 0 1 1h3"/>',
    arrowUp: '<path d="M12 19V5M6 11l6-6 6 6"/>', arrowDown: '<path d="M12 5v14M6 13l6 6 6-6"/>',
    arrowRight: '<line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/>',
    trendingUp: '<polyline points="23 6 13.5 15.5 8.5 10.5 1 18"/><polyline points="17 6 23 6 23 12"/>',
    shieldCheck: '<path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/><polyline points="9 12 11 14 15 10"/>',
    checkCircle: '<path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/>',
    info: '<circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/>',
    sparkles: '<path d="M12 8V4H8"/><rect width="16" height="12" x="4" y="8" rx="2"/><path d="M2 14h2"/><path d="M20 14h2"/><path d="M15 13v2"/><path d="M9 13v2"/>',
    whatsapp: '<path d="M4 20l1.3-3.9A8 8 0 1 1 8 19.1z"/><path d="M9 9.5c0 3 2.5 5.5 5.5 5.5l1-1.5-2-1-1 .8a4 4 0 0 1-1.8-1.8l.8-1-1-2z"/>',
    image: '<rect x="3" y="4" width="18" height="16" rx="2"/><circle cx="9" cy="10" r="2"/><path d="M21 16l-5-5-9 9"/>',
    split: '<rect width="18" height="18" x="3" y="3" rx="2"/><path d="M12 3v18"/>',
    edit: '<path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>',
    monitor: '<rect width="20" height="14" x="2" y="3" rx="2"/><line x1="8" x2="16" y1="21" y2="21"/><line x1="12" x2="12" y1="17" y2="21"/>',
    smartphone: '<rect width="14" height="20" x="5" y="2" rx="2"/><line x1="12" x2="12.01" y1="18" y2="18"/>',
    table: '<rect width="18" height="18" x="3" y="3" rx="2"/><path d="M3 9h18M3 15h18M9 3v18M15 3v18"/>',
    quote: '<path d="M3 21c3 0 7-1 7-8V5c0-1.25-.756-2.017-2-2H4c-1.25 0-2 .75-2 1.972V11c0 1.25.75 2 2 2 1 0 1 0 1 1v1c0 1-1 2-2 2s-1 .008-1 1.031V20c0 1 0 1 1 1z"/><path d="M15 21c3 0 7-1 7-8V5c0-1.25-.757-2.017-2-2h-4c-1.25 0-2 .75-2 1.972V11c0 1.25.75 2 2 2 1 0 1 0 1 1v1c0 1-1 2-2 2s-1 .008-1 1.031V20c0 1 0 1 1 1z"/>',
    listBullet: '<line x1="8" x2="21" y1="6" y2="6"/><line x1="8" x2="21" y1="12" y2="12"/><line x1="8" x2="21" y1="18" y2="18"/><line x1="3" x2="3.01" y1="6" y2="6"/><line x1="3" x2="3.01" y1="12" y2="12"/><line x1="3" x2="3.01" y1="18" y2="18"/>',
    listNumber: '<line x1="10" x2="21" y1="6" y2="6"/><line x1="10" x2="21" y1="12" y2="12"/><line x1="10" x2="21" y1="18" y2="18"/><path d="M4 6h1v4M4 10h2M6 18H4c0-1 2-2 2-3s-1-1.5-2-1"/>',
    code: '<polyline points="16 18 22 12 16 6"/><polyline points="8 6 2 12 8 18"/>',
    callout: '<path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>',
    divider: '<line x1="3" x2="21" y1="12" y2="12"/>',
  };
  const icon = (name) => `<svg class="i" viewBox="0 0 24 24" aria-hidden="true">${ICONS[name] || ''}</svg>`;

  Object.assign(ICONS, {
    more: '<circle cx="5" cy="12" r="1.2"/><circle cx="12" cy="12" r="1.2"/><circle cx="19" cy="12" r="1.2"/>',
    chevronRight: '<path d="M9 6l6 6-6 6"/>',
    undo: '<path d="M9 14L4 9l5-5"/><path d="M4 9h10a6 6 0 0 1 0 12h-3"/>',
  });

  /* ---------------- Helpers ---------------- */
  const $ = (sel, root = document) => root.querySelector(sel);
  const $$ = (sel, root = document) => [...root.querySelectorAll(sel)];
  const h = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const fmtDate = (d, withTime = false) => {
    if (!d) return '';
    const x = new Date(d);
    if (isNaN(x)) return '';
    return x.toLocaleString('en-IN', { day: 'numeric', month: 'short', year: 'numeric', ...(withTime ? { hour: 'numeric', minute: '2-digit' } : {}), timeZone: 'Asia/Kolkata' });
  };
  const ago = (d) => {
    const s = (Date.now() - new Date(d)) / 1000;
    if (s < 60) return 'just now';
    if (s < 3600) return `${Math.round(s / 60)} min ago`;
    if (s < 86400) return `${Math.round(s / 3600)} h ago`;
    if (s < 86400 * 7) return `${Math.round(s / 86400)} d ago`;
    return fmtDate(d);
  };
  const bytes = (n) => (!n ? '0 KB' : n > 1e6 ? `${(n / 1e6).toFixed(1)} MB` : `${Math.max(1, Math.round(n / 1e3))} KB`);
  const debounce = (fn, ms = 300) => { let t; return (...a) => { clearTimeout(t); t = setTimeout(() => fn(...a), ms); }; };
  const plural = (n, one, many = `${one}s`) => `${n} ${n === 1 ? one : many}`;
  /** HTML fragment -> readable plain text (tags dropped, entities decoded). */
  const plainText = (s) => { const t = document.createElement('textarea'); t.innerHTML = String(s || '').replace(/<br\s*\/?>/gi, ' ').replace(/<[^>]+>/g, ''); return t.value.replace(/\s+/g, ' ').trim(); };

  /** Server messages are already plain; anything that looks technical becomes a calm, generic message. */
  function friendly(msg, status) {
    const m = String(msg || '');
    if (/\b429\b|rate.?limit|too many requests|quota/i.test(m)) return 'The AI writer is busy right now. Please try again in a minute.';
    if (/GROQ_API_KEY|AI writer not configured/i.test(m)) return 'The AI writer is not switched on yet. Ask your web developer to add the AI key.';
    if (/DATABASE|database is not connected/i.test(m)) return 'The website database is not reachable right now. Please try again in a minute.';
    if (!m || m.length > 220 || /[{}<>]|\bat\s+\S+\s*\(|Error:|TypeError|undefined|ECONN|ETIMEDOUT|fetch failed|stack/i.test(m)) {
      return status === 413 ? 'That file is too large. Please choose a smaller picture.' : 'Something went wrong. Please try again.';
    }
    return m;
  }

  async function api(method, path, body) {
    let res;
    try {
      res = await fetch(`/api/admin/${path}`, {
        method, credentials: 'same-origin',
        headers: body !== undefined ? { 'Content-Type': 'application/json' } : {},
        body: body !== undefined ? JSON.stringify(body) : undefined,
      });
    } catch {
      throw new Error('Could not reach the website. Check your internet connection and try again.');
    }
    if (res.status === 401 && !path.startsWith('login')) {
      location.replace(`/admin-login.html?next=${encodeURIComponent(location.pathname + location.hash)}`);
      throw new Error('Please sign in again.');
    }
    const type = res.headers.get('content-type') || '';
    if (!type.includes('json')) { if (!res.ok) throw Object.assign(new Error(friendly('', res.status)), { status: res.status }); return res.text(); }
    const json = await res.json().catch(() => ({ ok: false }));
    if (!res.ok || json.ok === false) throw Object.assign(new Error(friendly(json.error, res.status)), { status: res.status, body: json });
    return json;
  }

  function toast(message, { error = false, action, onAction, ms = 4200 } = {}) {
    const el = document.createElement('div');
    el.className = `toast${error ? ' is-error' : ''}`;
    el.innerHTML = `<span>${h(message)}</span>${action ? `<button type="button">${h(action)}</button>` : ''}`;
    if (action) el.querySelector('button').onclick = () => { el.remove(); onAction(); };
    $('#toasts').appendChild(el);
    setTimeout(() => el.remove(), action ? Math.max(ms, 7000) : ms);
  }
  const toastError = (err) => toast(friendly(err?.message || String(err)), { error: true, ms: 6500 });

  /** Run fn with the button in a busy state. */
  async function busy(btn, fn) {
    if (btn) { btn.classList.add('is-busy'); btn.disabled = true; }
    try { return await fn(); } finally { if (btn) { btn.classList.remove('is-busy'); btn.disabled = false; } }
  }

  /** Modal dialog (a bottom sheet on phones). Returns { el, body, close, done }. */
  function modal({ title, body = '', foot = '', wide = false, full = false }) {
    const el = document.createElement('dialog');
    if (wide) el.classList.add('is-wide');
    if (full) el.classList.add('is-full');
    el.innerHTML = `<div class="dialog-head"><h2>${h(title)}</h2><span class="spacer"></span><button type="button" class="btn btn-ghost btn-icon" data-close aria-label="Close">${icon('x')}</button></div>
      <div class="dialog-body">${body}</div>${foot ? `<div class="dialog-foot">${foot}</div>` : ''}`;
    document.body.appendChild(el);
    let resolve;
    const done = new Promise((r) => { resolve = r; });
    const close = (value) => { if (!el.isConnected) return; el.close(); el.remove(); resolve(value); };
    el.addEventListener('click', (e) => { if (e.target.closest('[data-close]')) close(null); if (e.target === el) close(null); });
    el.addEventListener('cancel', (e) => { e.preventDefault(); close(null); });
    el.showModal();
    return { el, body: $('.dialog-body', el), close, done };
  }

  function confirmBox(title, text, { ok = 'Confirm', danger = false } = {}) {
    const m = modal({ title, body: `<p style="margin:0">${text}</p>`, foot: `<button class="btn" data-close>Cancel</button><button class="btn ${danger ? 'btn-accent' : 'btn-primary'}" data-ok>${h(ok)}</button>` });
    $('[data-ok]', m.el).onclick = () => m.close(true);
    $('[data-ok]', m.el).focus();
    return m.done.then(Boolean);
  }

  /* ---------------- Images: shrink in the browser, upload, pick ---------------- */
  async function shrinkImage(file, maxW = 1600, quality = 0.82) {
    if (!/^image\//.test(file.type)) throw new Error(`"${file.name}" is not a picture. Please choose a JPG, PNG or WebP file.`);
    let bmp;
    try { bmp = await createImageBitmap(file); } catch { throw new Error(`"${file.name}" could not be opened. Please save it as JPG or PNG and try again.`); }
    const scale = Math.min(1, maxW / bmp.width);
    const canvas = document.createElement('canvas');
    canvas.width = Math.round(bmp.width * scale);
    canvas.height = Math.round(bmp.height * scale);
    canvas.getContext('2d').drawImage(bmp, 0, 0, canvas.width, canvas.height);
    let blob = await new Promise((r) => canvas.toBlob(r, 'image/webp', quality));
    if (!blob || blob.type !== 'image/webp') blob = await new Promise((r) => canvas.toBlob(r, 'image/jpeg', quality)); // Safari without WebP encoding
    const data = await new Promise((r) => { const fr = new FileReader(); fr.onload = () => r(String(fr.result).split(',')[1]); fr.readAsDataURL(blob); });
    return { data, mime: blob.type, width: canvas.width, height: canvas.height, name: file.name.replace(/\.[^.]+$/, '') };
  }
  async function uploadFile(file, maxW) {
    const img = await shrinkImage(file, maxW);
    return (await api('POST', 'media', img)).data;
  }
  const pickFiles = (multiple = false) => new Promise((resolve) => {
    const input = Object.assign(document.createElement('input'), { type: 'file', accept: 'image/*', multiple });
    input.onchange = () => resolve([...input.files]);
    input.click();
  });

  const ACCEPTED = 'JPG, PNG or WebP. Big photos are made smaller automatically.';
  const photoTile = (p, { actions = false } = {}) => `<div class="photo-tile" data-id="${h(p.id)}" data-url="${h(p.url)}">
      <button type="button" class="photo-tile-img" data-open aria-label="Open ${h(p.name || 'picture')}"><img src="${h(p.url)}" alt="${h(p.name || '')}" loading="lazy"></button>
      <div class="photo-tile-meta"><span class="photo-tile-name" title="${h(p.name || '')}">${h(p.name || 'Picture')}</span><span class="photo-tile-size">${bytes(p.bytes)}${p.width ? ` · ${p.width}×${p.height}` : ''}</span></div>
      ${actions ? `<div class="photo-tile-actions"><button type="button" class="btn btn-sm" data-copy>${icon('link')}Copy link</button><button type="button" class="btn btn-sm btn-icon btn-ghost btn-danger" data-del aria-label="Delete ${h(p.name || 'picture')}">${icon('trash')}</button></div>` : ''}
    </div>`;
  const dropZone = (big) => `<div class="dropzone${big ? ' is-big' : ''}" data-drop tabindex="-1">
      <div class="dropzone-icon">${icon('upload')}</div>
      <div class="dropzone-text"><strong>${big ? 'Add your first pictures' : 'Add more pictures'}</strong><span>${big ? 'Product photos, article covers and pictures for your pages. ' : ''}Drag them here, or choose them from your phone or computer.</span></div>
      <button type="button" class="btn btn-primary" data-upload-many>${icon('upload')}Choose pictures</button>
      <span class="dropzone-hint">${ACCEPTED}</span>
    </div>`;

  /** Picture library picker: choose an existing picture or upload a new one. Resolves to a URL or null. */
  async function pickMedia(title = 'Choose a picture') {
    const m = modal({ title, wide: true, body: `<div class="toolbar-row"><button class="btn btn-primary" data-upload>${icon('upload')}Upload a new picture</button><span class="muted small">Or tap a picture below to use it.</span></div><div class="photo-grid" data-grid>${'<div class="skel skel-tile"></div>'.repeat(6)}</div>` });
    const grid = $('[data-grid]', m.el);
    $('[data-upload]', m.el).onclick = async (e) => {
      const files = await pickFiles();
      if (!files.length) return;
      await busy(e.currentTarget, async () => { try { const up = await uploadFile(files[0]); m.close(up.url); } catch (err) { toastError(err); } });
    };
    try {
      const { data } = await api('GET', 'media');
      grid.innerHTML = data.length ? data.map((p) => photoTile(p)).join('')
        : `<div class="empty" style="grid-column:1/-1">${icon('media')}<h3>No pictures yet</h3><p>Upload one with the button above.</p></div>`;
      grid.onclick = (e) => { const b = e.target.closest('[data-url]'); if (b) m.close(b.dataset.url); };
    } catch (err) { grid.innerHTML = `<p class="muted">${h(friendly(err.message))}</p>`; }
    return m.done;
  }

  /* ---------------- Shell, routing ---------------- */
  const NAV = [
    ['overview', 'Overview'], ['inquiries', 'Enquiries'], ['articles', 'Articles'], ['writer', 'AI writer'],
    ['products', 'Products'], ['media', 'Pictures'], ['copy', 'Site text'], ['settings', 'Settings'],
  ];
  const TABBAR = ['overview', 'inquiries', 'articles', 'products'];
  const views = {};
  let leaveGuard = null; // returns true if it is OK to leave the current view
  const state = { newInquiries: 0, me: null };

  function renderNav(active) {
    const count = (id) => (id === 'inquiries' && state.newInquiries ? `<span class="count" aria-label="${state.newInquiries} new">${state.newInquiries}</span>` : '');
    $('#nav').innerHTML = NAV.map(([id, label]) => `<a href="#${id}" data-nav="${id}"${id === active ? ' aria-current="page"' : ''}>${icon(id)}<span>${label}</span>${count(id)}</a>`).join('');
    const inBar = TABBAR.includes(active);
    $('#tabbar').innerHTML = TABBAR.map((id) => `<a href="#${id}"${id === active ? ' aria-current="page"' : ''}>${icon(id)}<span>${NAV.find((n) => n[0] === id)[1]}</span>${count(id)}</a>`).join('')
      + `<button type="button" data-more${inBar ? '' : ' aria-current="page"'}>${icon('more')}<span>More</span></button>`;
    $('[data-more]', $('#tabbar')).onclick = openMenu;
  }

  function setHeader(title, actionsHtml = '', customPageTitle = '') {
    $('#title').innerHTML = title;
    $('#actions').innerHTML = actionsHtml;
    const raw = customPageTitle || $('#title').textContent.replace(/\s+/g, ' ').trim();
    const clean = raw.includes('/') ? raw.split('/').map((s) => s.trim()).filter(Boolean).reverse().join(' · ') : raw;
    document.title = `${clean || 'Admin'} | Admin | Medico`;
  }

  const closeMenu = () => { $('#app').classList.remove('is-menu-open'); $('.scrim')?.remove(); };
  function openMenu() {
    $('#app').classList.add('is-menu-open');
    const scrim = Object.assign(document.createElement('div'), { className: 'scrim' });
    scrim.onclick = closeMenu;
    document.body.appendChild(scrim);
  }

  function errorState(el, err) {
    el.innerHTML = `<div class="empty">${icon('alert')}<h3>This page could not load</h3><p>${h(friendly(err.message))}</p><button class="btn btn-primary" data-retry>${icon('refresh')}Try again</button></div>`;
    $('[data-retry]', el).onclick = route;
  }

  async function route() {
    const [name, ...rest] = location.hash.replace(/^#/, '').split('/');
    const view = views[name] ? name : 'overview';
    const navId = { article: 'articles', product: 'products' }[view] || view;
    renderNav(navId);
    closeMenu();
    leaveGuard = null;
    $('.savebar')?.remove();
    // Fresh element per visit, so a slow page that finishes loading late cannot draw over the next one
    const old = $('#view');
    const el = old.cloneNode(false);
    el.className = 'view';
    old.replaceWith(el);
    window.scrollTo(0, 0);
    try { await views[view](el, rest.map(decodeURIComponent)); } catch (err) { errorState(el, err); }
  }

  window.addEventListener('beforeunload', (e) => { if (leaveGuard && !leaveGuard()) { e.preventDefault(); e.returnValue = ''; } });
  let lastHash = location.hash;
  window.addEventListener('hashchange', () => {
    if (leaveGuard && !leaveGuard() && !confirm('You have changes that are not saved. Leave this page and lose them?')) { history.replaceState(null, '', lastHash || '#overview'); return; }
    lastHash = location.hash;
    route();
  });

  // Sidebar: collapse (desktop) and drawer (phones, opened from "More")
  $$('[data-icon]').forEach((el) => { if (!el.querySelector('svg')) el.insertAdjacentHTML('afterbegin', icon(el.dataset.icon)); });
  try { if (localStorage.getItem('medico_admin_collapsed') === '1') $('#app').classList.add('is-collapsed'); } catch { /* private mode */ }
  $('#collapse').onclick = (e) => {
    e.preventDefault();
    const on = $('#app').classList.toggle('is-collapsed');
    try { localStorage.setItem('medico_admin_collapsed', on ? '1' : '0'); } catch { /* private mode */ }
  };
  $('#side').addEventListener('click', (e) => { if (e.target.closest('a[href^="#"]:not(#collapse):not(#logout)')) closeMenu(); });
  $('#logout').onclick = async (e) => { e.preventDefault(); await api('POST', 'logout', {}).catch(() => {}); location.replace('/admin-login.html'); };

  /* ---------------- Command palette ---------------- */
  const isMac = /Mac|iPhone|iPad/.test(navigator.platform);
  $('#kbd-hint').textContent = isMac ? '⌘K' : 'Ctrl K';
  let paletteItems = [];
  let paletteIndex = 0;
  let paletteCache = null;
  const baseCommands = () => [
    ...NAV.map(([id, label]) => ({ group: 'Go to', label, icon: id, run: () => { location.hash = id; } })),
    { group: 'Do something', label: 'Write an article with AI', icon: 'writer', run: () => { location.hash = 'writer'; } },
    { group: 'Do something', label: 'Write an article myself', icon: 'plus', run: () => { location.hash = 'article/new'; } },
    { group: 'Do something', label: 'Add a product', icon: 'plus', run: () => { location.hash = 'product/new'; } },
    { group: 'Do something', label: 'Upload pictures', icon: 'upload', run: () => { location.hash = 'media'; setTimeout(() => $('[data-upload-many]')?.click(), 400); } },
    { group: 'Do something', label: 'Change text on the website', icon: 'copy', run: () => { location.hash = 'copy'; } },
    { group: 'Do something', label: 'Open the website', icon: 'external', run: () => window.open('/', '_blank', 'noopener') },
    { group: 'Do something', label: 'Sign out', icon: 'logout', run: () => $('#logout').click() },
  ];
  async function loadPaletteCache() {
    if (paletteCache) return paletteCache;
    try {
      const [posts, products] = await Promise.all([api('GET', 'posts'), api('GET', 'products')]);
      paletteCache = [
        ...posts.data.map((p) => ({ group: 'Articles', label: p.title, icon: 'articles', hint: p.status === 'published' ? 'Live' : 'Draft', run: () => { location.hash = `article/${encodeURIComponent(p.id)}`; } })),
        ...products.data.map((p) => ({ group: 'Products', label: p.title, icon: 'products', hint: p.category, run: () => { location.hash = `product/${encodeURIComponent(p.id)}`; } })),
      ];
    } catch { paletteCache = []; }
    return paletteCache;
  }
  function drawPalette() {
    const q = $('#palette-input').value.trim().toLowerCase();
    const all = [...baseCommands(), ...(paletteCache || [])];
    const words = q.split(/\s+/).filter(Boolean);
    paletteItems = all.filter((c) => words.every((w) => `${c.label} ${c.group}`.toLowerCase().includes(w))).slice(0, 40);
    if (!q) paletteItems = paletteItems.filter((c) => c.group !== 'Articles' && c.group !== 'Products');
    paletteIndex = Math.min(paletteIndex, Math.max(0, paletteItems.length - 1));
    let group = '';
    $('#palette-list').innerHTML = paletteItems.length ? paletteItems.map((c, i) => {
      const head = c.group !== group ? `<li class="group" role="presentation">${h((group = c.group))}</li>` : '';
      return `${head}<li role="option" data-i="${i}" aria-selected="${i === paletteIndex}">${icon(c.icon)}<span>${h(c.label)}</span>${c.hint ? `<small>${h(c.hint)}</small>` : ''}</li>`;
    }).join('') : '<li class="group">Nothing found. Try another word.</li>';
    $('#palette-list [aria-selected="true"]')?.scrollIntoView({ block: 'nearest' });
  }
  async function openPalette() {
    const d = $('#palette');
    if (d.open) return;
    $('#palette-input').value = '';
    paletteIndex = 0;
    drawPalette();
    d.showModal();
    if (matchMedia('(pointer: fine)').matches) $('#palette-input').focus();
    await loadPaletteCache();
    if (d.open) drawPalette();
  }
  const runPalette = (i) => { const c = paletteItems[i]; if (!c) return; $('#palette').close(); c.run(); };
  $('#open-palette').onclick = openPalette;
  $('#palette-close').onclick = () => $('#palette').close();
  $('#palette-input').addEventListener('input', () => { paletteIndex = 0; drawPalette(); });
  $('#palette-input').addEventListener('keydown', (e) => {
    if (e.key === 'ArrowDown') { e.preventDefault(); paletteIndex = Math.min(paletteItems.length - 1, paletteIndex + 1); drawPalette(); }
    if (e.key === 'ArrowUp') { e.preventDefault(); paletteIndex = Math.max(0, paletteIndex - 1); drawPalette(); }
    if (e.key === 'Enter') { e.preventDefault(); runPalette(paletteIndex); }
  });
  $('#palette-list').addEventListener('click', (e) => { const li = e.target.closest('[data-i]'); if (li) runPalette(Number(li.dataset.i)); });
  $('#palette').addEventListener('click', (e) => { if (e.target.id === 'palette') e.target.close(); });
  document.addEventListener('keydown', (e) => {
    if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') { e.preventDefault(); openPalette(); }
    const typing = /INPUT|TEXTAREA|SELECT/.test(document.activeElement.tagName) || document.activeElement.isContentEditable;
    if (!typing && !e.metaKey && !e.ctrlKey && !e.altKey && !document.querySelector('dialog[open]')) {
      if (e.key === 'n') { e.preventDefault(); location.hash = 'article/new'; }
      if (e.key === '/') { e.preventDefault(); $('[data-search]')?.focus(); }
    }
  });

  /* ---------------- Shared view bits ---------------- */
  const skeletonRows = (n = 6) => `<div class="skel-list" aria-label="Loading">${Array.from({ length: n }, (_, i) => `<div class="skel-row"><div class="skel" style="width:44px;height:32px"></div><div style="flex:1;display:grid;gap:8px"><div class="skel" style="width:${45 + ((i * 17) % 40)}%"></div><div class="skel" style="width:30%;height:10px"></div></div></div>`).join('')}</div>`;
  const emptyState = (iconName, title, text, actionHtml = '') => `<div class="empty">${icon(iconName)}<h3>${h(title)}</h3><p>${h(text)}</p>${actionHtml ? `<div class="empty-actions">${actionHtml}</div>` : ''}</div>`;
  /** Plain-word status chips for an article: Live / Scheduled / Draft, plus Needs review. */
  const statusBadge = (p) => {
    const main = p.status === 'published'
      ? (p.published_at && new Date(p.published_at) > new Date() ? '<span class="chip">Scheduled</span>' : '<span class="chip chip-solid">Live</span>')
      : '<span class="chip">Draft</span>';
    const review = (p.ai_generated && !p.reviewed_at) || p.has_markers ? '<span class="chip chip-review">Needs review</span>' : '';
    return main + review;
  };
  const waLink = (phone, name = '') => {
    const d = String(phone || '').replace(/\D/g, '').replace(/^0+/, '');
    if (!d) return '';
    const num = d.length === 10 ? `91${d}` : d;
    return `https://wa.me/${num}?text=${encodeURIComponent(`Hello${name ? ` ${name.split(' ')[0]}` : ''}, this is Medico Scientific Service Centre, replying to your enquiry.`)}`;
  };

  /** Fixed bar with Save / Discard that only shows while something is unsaved. */
  function saveBar({ onSave, onDiscard, text = 'Unsaved changes' }) {
    const bar = document.createElement('div');
    bar.className = 'savebar';
    bar.hidden = true;
    bar.innerHTML = `<span class="savebar-text">${h(text)}</span><span class="spacer"></span><button type="button" class="btn" data-discard>Discard</button><button type="button" class="btn btn-primary" data-save-bar>${icon('check')}Save changes</button>`;
    document.body.appendChild(bar);
    $('[data-save-bar]', bar).onclick = (e) => onSave(e.currentTarget);
    $('[data-discard]', bar).onclick = onDiscard;
    return { show: (on) => { bar.hidden = !on; document.body.classList.toggle('has-savebar', on); }, el: bar };
  }

  /* ---------------- 14-day sparkline ---------------- */
  function renderMiniSparkline(daily) {
    const max = Math.max(3, ...daily.map((x) => x.n || 0));
    const N = daily.length || 14;
    const W = 220; const H = 26; const step = W / N;
    const barW = Math.max(6, Math.min(10, step * 0.62));
    const base = H - 2;
    const bars = daily.map((x, i) => {
      const val = x.n || 0;
      const barX = i * step + (step - barW) / 2;
      const d = new Date(`${x.day}T00:00:00`);
      const tip = `${isNaN(d) ? x.day : d.toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'short' })}: ${plural(val, 'enquiry', 'enquiries')}`;
      const bh = val ? Math.max(5, (val / max) * (H - 6)) : 3;
      return `<g><title>${h(tip)}</title><rect class="kpi-spark-bar${val ? ' is-active' : ''}${i === N - 1 ? ' is-today' : ''}" x="${barX.toFixed(1)}" y="${(base - bh).toFixed(1)}" width="${barW.toFixed(1)}" height="${bh.toFixed(1)}" rx="1.5"/></g>`;
    }).join('');
    return `<svg class="kpi-spark-svg" viewBox="0 0 ${W} ${H}" preserveAspectRatio="none" role="img" aria-label="Enquiries per day, last 14 days">${bars}</svg>`;
  }

  /* ---------------- Overview ---------------- */
  views.overview = async (el) => {
    setHeader('Overview', `<a class="btn btn-primary" href="#writer">${icon('writer')}<span class="desktop-only">Write with AI</span></a>`);
    el.innerHTML = `<div class="todo-grid">${'<div class="todo-card"><div class="skel" style="width:50%;height:20px"></div><div class="skel" style="width:80%;margin-top:12px"></div><div class="skel" style="width:40%;height:36px;margin-top:16px"></div></div>'.repeat(2)}</div><div class="kpi-grid">${'<div class="kpi-card"><div class="skel" style="width:50%"></div><div class="skel" style="height:28px;width:30%;margin-top:10px"></div></div>'.repeat(4)}</div>`;

    const { data: d } = await api('GET', 'overview');
    if (!el.isConnected) return;
    state.newInquiries = d.inquiries_new;
    renderNav('overview');
    const waiting = d.posts_waiting ?? d.review.length;
    const hour = Number(new Date().toLocaleString('en-IN', { hour: 'numeric', hour12: false, timeZone: 'Asia/Kolkata' }));
    const greet = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening';
    const hidden = (k) => { try { return sessionStorage.getItem(`medico_dismiss_${k}`) === '1'; } catch { return false; } };

    const todos = [];
    if (d.inquiries_new) todos.push({ icon: 'inquiries', title: `${plural(d.inquiries_new, 'new enquiry', 'new enquiries')}`, text: 'People asked about your products or services. Call or WhatsApp them back.', href: '#inquiries', btn: 'Open enquiries' });
    if (waiting) todos.push({ icon: 'articles', title: `${plural(waiting, 'article')} waiting for you`, text: 'Read the draft, fix anything highlighted in yellow, then publish.', href: '#articles/review', btn: 'Review now' });

    el.innerHTML = `
      <div class="page-intro"><h2>${greet}</h2><p>${todos.length ? 'Here is what needs your attention.' : 'Nothing needs you right now. Your website is up to date.'}</p></div>
      <div class="todo-grid">
        ${todos.map((t) => `<a class="todo-card is-action" href="${t.href}"><div class="todo-icon">${icon(t.icon)}</div><div class="todo-body"><strong>${h(t.title)}</strong><span>${h(t.text)}</span></div><span class="btn btn-primary">${h(t.btn)}${icon('arrowRight')}</span></a>`).join('')}
        ${todos.length ? '' : `<div class="todo-card"><div class="todo-icon">${icon('checkCircle')}</div><div class="todo-body"><strong>You are all caught up</strong><span>No new enquiries and no articles waiting. A good time to write something new.</span></div><a class="btn btn-primary" href="#writer">${icon('writer')}Write an article</a></div>`}
      </div>

      <h3 class="section-title">At a glance</h3>
      <div class="kpi-grid">
        <a class="kpi-card" href="#inquiries/all">
          <span class="kpi-title">Enquiries this week</span>
          <div class="kpi-val" data-counter="${d.inquiries_week}">${d.inquiries_week}</div>
          <div class="kpi-spark-wrap" title="Enquiries per day, last 14 days">${renderMiniSparkline(d.daily)}</div>
        </a>
        <a class="kpi-card" href="#articles/live">
          <span class="kpi-title">Articles on the website</span>
          <div class="kpi-val" data-counter="${d.posts_live}">${d.posts_live}</div>
          <span class="kpi-sub">${d.posts_month ? `${d.posts_month} new in the last 30 days` : 'None new in the last 30 days'}</span>
        </a>
        <a class="kpi-card" href="#products">
          <span class="kpi-title">Products shown</span>
          <div class="kpi-val"><span data-counter="${d.products_live}">${d.products_live}</span><small> of ${d.products_total}</small></div>
          <span class="kpi-sub">${d.products_total - d.products_live ? `${d.products_total - d.products_live} hidden from visitors` : 'All products are visible'}</span>
        </a>
        <a class="kpi-card" href="#media">
          <span class="kpi-title">Pictures</span>
          <div class="kpi-val" data-counter="${d.pictures}">${d.pictures}</div>
          <span class="kpi-sub">${bytes(d.picture_bytes)} in total</span>
        </a>
      </div>

      <div class="cols">
        <section class="card queue-card">
          <div class="card-head"><h2>Waiting for review</h2><span class="spacer"></span><a class="btn btn-sm btn-ghost" href="#articles/review">See all</a></div>
          ${d.review.length ? `<ul class="queue-list">${d.review.map((p) => `
            <li class="queue-item">
              <div class="queue-main"><a href="#article/${encodeURIComponent(p.id)}" class="queue-title">${h(p.title)}</a>
                <div class="queue-sub">${statusBadge({ ...p, status: p.status })}<span class="muted small">${p.ai_generated ? 'Written by AI · ' : ''}${h(ago(p.created_at))}</span></div></div>
              <a class="btn btn-sm" href="#article/${encodeURIComponent(p.id)}">Review</a>
            </li>`).join('')}</ul>`
            : emptyState('checkCircle', 'Nothing to review', 'New drafts from you or the AI writer will appear here.', `<a class="btn btn-sm" href="#writer">${icon('writer')}Write with AI</a>`)}
        </section>
        <section class="card queue-card">
          <div class="card-head"><h2>Latest enquiries</h2><span class="spacer"></span><a class="btn btn-sm btn-ghost" href="#inquiries/all">See all</a></div>
          ${d.inquiries.length ? `<ul class="queue-list">${d.inquiries.map((i) => `
            <li class="queue-item">
              <div class="queue-main"><strong class="queue-title">${h(i.name)}</strong>
                <div class="queue-sub">${i.status === 'new' ? '<span class="chip chip-solid">New</span>' : `<span class="chip">${i.status === 'handled' ? 'Handled' : 'Archived'}</span>`}<span class="muted small truncate">${h(i.interest || 'General enquiry')} · ${h(ago(i.created_at))}</span></div></div>
              <div class="row-tight">
                ${i.phone ? `<a class="btn btn-sm btn-icon" href="tel:${h(i.phone)}" aria-label="Call ${h(i.name)}">${icon('phone')}</a>` : ''}
                ${waLink(i.phone, i.name) ? `<a class="btn btn-sm btn-icon" href="${h(waLink(i.phone, i.name))}" target="_blank" rel="noopener" aria-label="WhatsApp ${h(i.name)}">${icon('whatsapp')}</a>` : ''}
              </div>
            </li>`).join('')}</ul>`
            : emptyState('inquiries', 'No enquiries yet', 'When someone fills in the form on your website, it shows up here.')}
        </section>
      </div>

      <h3 class="section-title">Quick actions</h3>
      <div class="quick-grid">
        <a class="quick-card" href="#writer">${icon('writer')}<span>Write an article with AI</span></a>
        <a class="quick-card" href="#product/new">${icon('products')}<span>Add a product</span></a>
        <a class="quick-card" href="#media">${icon('upload')}<span>Upload pictures</span></a>
        <a class="quick-card" href="#copy">${icon('copy')}<span>Change website text</span></a>
      </div>

      ${!d.ai && !hidden('ai') ? `<div class="notice" data-banner="ai">${icon('info')}<span><strong>The AI writer is not switched on.</strong> Ask your web developer to add the AI key. Everything else works normally.</span><button type="button" class="btn btn-ghost btn-icon btn-sm" data-dismiss="ai" aria-label="Hide this message">${icon('x')}</button></div>` : ''}
      ${d.ai && !d.cron && !hidden('cron') ? `<div class="notice" data-banner="cron">${icon('clock')}<span><strong>Daily automatic articles are off.</strong> Your web developer needs to switch on the daily schedule. You can still write articles any time.</span><button type="button" class="btn btn-ghost btn-icon btn-sm" data-dismiss="cron" aria-label="Hide this message">${icon('x')}</button></div>` : ''}
    `;

    $$('[data-dismiss]', el).forEach((btn) => {
      btn.onclick = () => { try { sessionStorage.setItem(`medico_dismiss_${btn.dataset.dismiss}`, '1'); } catch { /* private mode */ } btn.closest('[data-banner]').remove(); };
    });
  };

  /* ---------------- Enquiries ---------------- */
  views.inquiries = async (el, [filter = 'new']) => {
    setHeader('Enquiries');
    const TABS = [['new', 'New'], ['handled', 'Handled'], ['archived', 'Archived'], ['all', 'All']];
    el.innerHTML = `
      <p class="page-lead">Messages people sent from the form on your website. Call or WhatsApp them, then tap <strong>Mark as handled</strong>.</p>
      <div class="tabs" role="tablist">${TABS.map(([f, l]) => `<button role="tab" aria-selected="${f === filter}" data-f="${f}">${l}</button>`).join('')}</div>
      <div class="toolbar-row"><div class="search-box-wrap">${icon('search')}<input class="input" type="search" data-search placeholder="Search name, phone or message" aria-label="Search enquiries"></div><span class="toolbar-count" data-count></span></div>
      <div data-list>${skeletonRows(4)}</div>`;
    $$('[data-f]', el).forEach((b) => { b.onclick = () => { location.hash = `inquiries/${b.dataset.f}`; }; });
    const { data } = await api('GET', `inquiries${filter === 'all' ? '' : `?status=${filter}`}`);
    const list = $('[data-list]', el);
    const STATUS = { new: 'New', handled: 'Handled', archived: 'Archived' };
    const draw = () => {
      const q = $('[data-search]', el).value.trim().toLowerCase();
      const rows = data.filter((i) => !q || [i.name, i.phone, i.email, i.message, i.organisation, i.interest].some((f) => f && f.toLowerCase().includes(q)));
      $('[data-count]', el).textContent = q ? `${rows.length} of ${data.length}` : plural(data.length, 'enquiry', 'enquiries');
      if (!rows.length) {
        list.innerHTML = q ? emptyState('search', 'No matches', 'Try a different name or number.')
          : filter === 'new' ? emptyState('checkCircle', 'No new enquiries', 'You have answered everyone. New messages from your website will appear here.', '<a class="btn" href="#inquiries/all">See all enquiries</a>')
          : emptyState('inquiries', 'Nothing here yet', 'Enquiries you move here will show up in this list.', '<a class="btn" href="#inquiries/new">Back to new enquiries</a>');
        return;
      }
      list.innerHTML = `<div class="enquiry-list">${rows.map((i) => `
        <article class="enquiry" data-id="${h(i.id)}">
          <header class="enquiry-head">
            <div class="enquiry-who"><strong>${h(i.name)}</strong><span class="muted small">${h(ago(i.created_at))}${i.organisation ? ` · ${h(i.organisation)}` : ''}</span></div>
            <span class="chip${i.status === 'new' ? ' chip-solid' : ''}">${STATUS[i.status] || h(i.status)}</span>
          </header>
          ${i.interest ? `<div class="enquiry-interest">${icon('products')}${h(i.interest)}</div>` : ''}
          ${i.message ? `<p class="enquiry-msg">${h(i.message)}</p>` : ''}
          <div class="enquiry-contact">${i.phone ? `<a href="tel:${h(i.phone)}">${h(i.phone)}</a>` : ''}${i.email ? `<a href="mailto:${h(i.email)}">${h(i.email)}</a>` : ''}${i.page ? `<span class="muted">Sent from ${h(i.page)}</span>` : ''}</div>
          ${i.notes ? `<div class="enquiry-note"><strong>Your note:</strong> ${h(i.notes)}</div>` : ''}
          <div class="enquiry-actions">
            ${i.phone ? `<a class="btn" href="tel:${h(i.phone)}">${icon('phone')}Call</a>` : ''}
            ${waLink(i.phone, i.name) ? `<a class="btn" href="${h(waLink(i.phone, i.name))}" target="_blank" rel="noopener">${icon('whatsapp')}WhatsApp</a>` : ''}
            ${i.status === 'new' ? `<button class="btn btn-primary" data-act="handled">${icon('check')}Mark as handled</button>` : '<button class="btn" data-act="new">Move back to new</button>'}
            <span class="spacer"></span>
            <button class="btn btn-ghost" data-act="note">${icon('edit')}${i.notes ? 'Edit note' : 'Add note'}</button>
            ${i.status !== 'archived' ? '<button class="btn btn-ghost" data-act="archived">Archive</button>' : ''}
            <button class="btn btn-ghost btn-icon btn-danger" data-act="delete" aria-label="Delete enquiry from ${h(i.name)}">${icon('trash')}</button>
          </div>
        </article>`).join('')}</div>`;
    };
    draw();
    $('[data-search]', el).addEventListener('input', debounce(draw, 150));
    list.addEventListener('click', async (e) => {
      const btn = e.target.closest('[data-act]');
      if (!btn) return;
      const id = btn.closest('[data-id]').dataset.id;
      const item = data.find((x) => x.id === id);
      const act = btn.dataset.act;
      try {
        if (act === 'delete') {
          if (!(await confirmBox('Delete this enquiry?', `The enquiry from <strong>${h(item.name)}</strong> will be removed for good. To keep it out of the way instead, use Archive.`, { ok: 'Delete', danger: true }))) return;
          data.splice(data.indexOf(item), 1); draw();
          await api('DELETE', `inquiries?id=${encodeURIComponent(id)}`);
          toast('Enquiry deleted');
        } else if (act === 'note') {
          const m = modal({ title: `Note about ${item.name}`, body: `<label class="label" for="note-box" style="margin-bottom:6px">Only you can see this note.</label><textarea class="textarea" id="note-box" data-note rows="4" placeholder="e.g. Called on Monday, sending a quote">${h(item.notes || '')}</textarea>`, foot: '<button class="btn" data-close>Cancel</button><button class="btn btn-primary" data-ok>Save note</button>' });
          $('[data-ok]', m.el).onclick = () => m.close($('[data-note]', m.el).value);
          const note = await m.done;
          if (note === null) return;
          item.notes = note; draw();
          await api('PATCH', 'inquiries', { id, status: item.status, notes: note });
          toast('Note saved');
        } else {
          const prev = item.status;
          item.status = act;
          if (filter !== 'all' && filter !== act) data.splice(data.indexOf(item), 1);
          draw();
          await api('PATCH', 'inquiries', { id, status: act });
          state.newInquiries = Math.max(0, state.newInquiries + (act === 'new' ? 1 : prev === 'new' ? -1 : 0));
          renderNav('inquiries');
          toast(act === 'handled' ? 'Marked as handled' : act === 'new' ? 'Moved back to new' : 'Archived', {
            action: 'Undo', onAction: async () => { try { await api('PATCH', 'inquiries', { id, status: prev }); route(); } catch (err) { toastError(err); } },
          });
        }
      } catch (err) { toastError(err); route(); }
    });
  };

  /* ---------------- Pictures ---------------- */
  views.media = async (el) => {
    setHeader('Pictures', `<button class="btn btn-primary" data-upload-many>${icon('upload')}<span class="desktop-only">Upload pictures</span></button>`);
    el.innerHTML = `<div data-media><div class="photo-grid">${'<div class="skel skel-tile"></div>'.repeat(8)}</div></div>`;
    let data = [];
    const root = $('[data-media]', el);
    const draw = () => {
      if (!data.length) { root.innerHTML = dropZone(true); return; }
      const q = $('[data-search]', root)?.value || '';
      root.innerHTML = `
        ${dropZone(false)}
        <div class="toolbar-row"><div class="search-box-wrap">${icon('search')}<input class="input" type="search" data-search placeholder="Search by name" aria-label="Search pictures" value="${h(q)}"></div><span class="toolbar-count">${plural(data.length, 'picture')} · ${bytes(data.reduce((s, p) => s + p.bytes, 0))}</span></div>
        <div class="photo-grid" data-grid></div>`;
      drawGrid();
      $('[data-search]', root).addEventListener('input', debounce(drawGrid, 120));
    };
    const drawGrid = () => {
      const q = ($('[data-search]', root)?.value || '').trim().toLowerCase();
      const rows = data.filter((p) => !q || (p.name || '').toLowerCase().includes(q));
      $('[data-grid]', root).innerHTML = rows.length ? rows.map((p) => photoTile(p, { actions: true })).join('') : `<div style="grid-column:1/-1">${emptyState('search', 'No pictures with that name', 'Try another word.')}</div>`;
    };
    const load = async () => { data = (await api('GET', 'media')).data; draw(); };

    const uploadMany = async (files, btn) => {
      files = files.filter(Boolean);
      if (!files.length) return;
      const status = document.createElement('div');
      status.className = 'notice';
      root.prepend(status);
      await busy(btn, async () => {
        let done = 0;
        for (const [n, f] of files.entries()) {
          status.innerHTML = `${icon('upload')}<span>Uploading ${n + 1} of ${files.length}…</span>`;
          try { await uploadFile(f); done++; } catch (err) { toastError(err); }
        }
        if (done) toast(`${plural(done, 'picture')} added`);
        await load();
      });
    };
    const remove = async (p) => {
      if (!(await confirmBox('Delete this picture?', `<strong>${h(p.name || 'This picture')}</strong> will be removed from your library.`, { ok: 'Delete', danger: true }))) return false;
      try {
        await api('DELETE', `media?id=${encodeURIComponent(p.id)}`);
      } catch (err) {
        if (!err.body?.inUse) { toastError(err); return false; }
        if (!(await confirmBox('This picture is being used', `${h(err.message)}<br><br>If you delete it, those places will show an empty space until you choose another picture.`, { ok: 'Delete anyway', danger: true }))) return false;
        await api('DELETE', `media?id=${encodeURIComponent(p.id)}&force=1`);
      }
      data = data.filter((x) => x.id !== p.id); draw(); toast('Picture deleted');
      return true;
    };
    const copyLink = async (p) => {
      try { await navigator.clipboard.writeText(location.origin + p.url); toast('Link copied. Paste it wherever you need the picture.'); } catch { prompt('Copy this link:', location.origin + p.url); }
    };
    const details = (p) => {
      const m = modal({ title: p.name || 'Picture', wide: true, body: `<img class="photo-detail-img" src="${h(p.url)}" alt="${h(p.name || '')}">
        <dl class="photo-detail-facts"><div><dt>Size</dt><dd>${bytes(p.bytes)}</dd></div>${p.width ? `<div><dt>Dimensions</dt><dd>${p.width} × ${p.height} pixels</dd></div>` : ''}${p.created_at ? `<div><dt>Added</dt><dd>${h(fmtDate(p.created_at))}</dd></div>` : ''}${p.credit?.text ? `<div><dt>Credit</dt><dd>${h(p.credit.text)}</dd></div>` : ''}</dl>`,
        foot: `<button class="btn btn-ghost btn-danger" data-del>${icon('trash')}Delete</button><span class="spacer"></span><a class="btn" href="${h(p.url)}" target="_blank" rel="noopener">${icon('external')}Open</a><button class="btn btn-primary" data-copy>${icon('link')}Copy link</button>` });
      $('[data-copy]', m.el).onclick = () => copyLink(p);
      $('[data-del]', m.el).onclick = async () => { if (await remove(p)) m.close(); };
    };

    // One delegated handler for the whole view (header button lives outside el)
    const onClick = (e) => {
      if (!el.isConnected) { document.removeEventListener('click', onClick); return; }
      const up = e.target.closest('[data-upload-many]');
      if (up) { pickFiles(true).then((files) => uploadMany(files, up)); return; }
      const tile = e.target.closest('.photo-tile');
      if (!tile || !el.contains(tile)) return;
      const p = data.find((x) => x.id === tile.dataset.id);
      if (e.target.closest('[data-copy]')) copyLink(p);
      else if (e.target.closest('[data-del]')) remove(p);
      else if (e.target.closest('[data-open]')) details(p);
    };
    document.addEventListener('click', onClick);
    el.addEventListener('dragover', (e) => { e.preventDefault(); $('[data-drop]', el)?.classList.add('is-over'); });
    el.addEventListener('dragleave', (e) => { if (!el.contains(e.relatedTarget)) $('[data-drop]', el)?.classList.remove('is-over'); });
    el.addEventListener('drop', (e) => { e.preventDefault(); $('[data-drop]', el)?.classList.remove('is-over'); uploadMany([...e.dataTransfer.files].filter((f) => /^image\//.test(f.type)), $('[data-drop] [data-upload-many]', el)); });
    await load();
  };

  /* ---------------- Site text ---------------- */
  // Friendly names for data-copy keys like "home.hero.badge" -> "Hero · small badge above the headline"
  const SECTION_NAMES = {
    hero: 'Top of the page', stats: 'Numbers strip', equipment: 'Equipment', services: 'Services', brands: 'Brands', about: 'About us',
    reviews: 'Reviews', faq: 'Questions and answers', insights: 'Latest articles', cta: 'Closing banner', founder: 'Founder', journey: 'Our journey',
    purpose: 'Our purpose', partners: 'Partners', visit: 'Visit us', browse: 'Browse products', consult: 'Advice box', commitment: 'Our promise',
    latest: 'Latest articles', news: 'News', topbar: 'Thin strip at the very top', menu: 'Phone menu', footer: 'Footer (bottom of every page)',
    dialog: 'Enquiry form', header: 'Header', nav: 'Menu', contact: 'Contact', team: 'Team', why: 'Why choose us', process: 'How it works',
  };
  const LEAF_NAMES = {
    badge: 'small badge above the headline', eyebrow: 'small label above the heading', title: 'heading', lead: 'text under the heading', body: 'paragraph',
    cta: 'button', cta2: 'second button', button: 'button', button2: 'second button', link: 'link', note: 'small note', address: 'address',
    hours: 'opening hours', phone: 'phone number', email: 'email address', about: 'short description', reviews: 'reviews line', subtitle: 'subheading', text: 'text', label: 'label',
  };
  const cap = (s) => s.charAt(0).toUpperCase() + s.slice(1);
  function copyName(f) {
    const [, sec = '', ...rest] = f.key.split('.');
    const section = SECTION_NAMES[sec] || cap(sec.replace(/[-_]/g, ' '));
    if (f.label) return { section, name: f.label };
    let name;
    if (rest.length === 2 && /^\d+$/.test(rest[0]) && /^(q|a)$/.test(rest[1])) name = `${rest[1] === 'q' ? 'Question' : 'Answer'} ${rest[0]}`;
    else if (rest.length === 2 && /^\d+$/.test(rest[0])) name = `Card ${rest[0]} · ${LEAF_NAMES[rest[1]] || rest[1]}`;
    else if (rest.length === 1 && /^\d+$/.test(rest[0])) name = `${sec === 'stats' ? 'Number' : 'Item'} ${rest[0]}`;
    else if (sec === 'hero' && rest[0] === 'title') name = 'Main headline';
    else name = rest.map((r) => LEAF_NAMES[r] || r.replace(/[-_]/g, ' ')).join(' · ') || 'Text';
    return { section, name: cap(name) };
  }
  const PAGE_ORDER = ['Home', 'About', 'Products', 'Blog', 'Header & footer'];

  views.copy = async (el, [pageArg] = []) => {
    setHeader('Site text');
    el.innerHTML = skeletonRows(6);
    const { data } = await api('GET', 'copy');
    const fields = data.fields.map((f) => ({ ...f, page: /^Shared/.test(f.group) ? 'Header & footer' : f.group, ...copyName(f) }));
    const pages = [...new Set(fields.map((f) => f.page))].sort((a, b) => ((PAGE_ORDER.indexOf(a) + 1) || 99) - ((PAGE_ORDER.indexOf(b) + 1) || 99));
    let page = pages.includes(pageArg) ? pageArg : pages[0];
    if (!fields.length) { el.innerHTML = emptyState('copy', 'No editable text found', 'Your web developer has not marked any text as editable yet.'); return; }

    el.innerHTML = `
      <p class="page-lead">Change the words on your website. Pick a page, then tap any text to edit it. Changes appear on the website within about 5 minutes.</p>
      <div class="copy-pages">
        <label class="visually-hidden" for="copy-page">Page</label>
        <div class="tabs" role="tablist" data-pages>${pages.map((p) => `<button role="tab" data-page="${h(p)}" aria-selected="${p === page}">${h(p)}</button>`).join('')}</div>
      </div>
      <div class="toolbar-row"><div class="search-box-wrap">${icon('search')}<input class="input" type="search" data-search placeholder="Find text on any page" aria-label="Find text"></div><span class="toolbar-count" data-count></span></div>
      <div data-list></div>`;
    const list = $('[data-list]', el);
    const current = (f) => (f.value !== null ? f.value : f.default);
    const draw = () => {
      const q = $('[data-search]', el).value.trim().toLowerCase();
      const rows = q ? fields.filter((f) => `${f.section} ${f.name} ${plainText(current(f))} ${f.key}`.toLowerCase().includes(q)) : fields.filter((f) => f.page === page);
      $$('[data-page]', el).forEach((b) => b.setAttribute('aria-selected', String(!q && b.dataset.page === page)));
      const edited = rows.filter((f) => f.value !== null).length;
      $('[data-count]', el).textContent = q ? `${plural(rows.length, 'match', 'matches')}` : edited ? `${edited} changed by you` : '';
      if (!rows.length) { list.innerHTML = emptyState('search', 'No text found', 'Try another word, or clear the search to browse by page.'); return; }
      const groups = [];
      for (const f of rows) {
        const g = `${q ? `${f.page} · ` : ''}${f.section}`;
        if (!groups.length || groups[groups.length - 1].title !== g) groups.push({ title: g, items: [] });
        groups[groups.length - 1].items.push(f);
      }
      list.innerHTML = groups.map((g) => `<section class="copy-section"><h3 class="copy-section-title">${h(g.title)}</h3><div class="copy-items">${g.items.map((f) => `
        <button type="button" class="copy-item" data-key="${h(f.key)}">
          <span class="copy-item-name">${h(f.name)}${f.value !== null ? '<span class="chip">Changed</span>' : ''}</span>
          <span class="copy-item-text">${h(plainText(current(f))) || '<em class="muted">Empty</em>'}</span>
          ${icon('chevronRight')}
        </button>`).join('')}</div></section>`).join('')
        + (data.orphans.length && !q ? `<section class="copy-section"><h3 class="copy-section-title">Old changes for text that is no longer on the website</h3><div class="copy-items">${data.orphans.map((o) => `<div class="copy-item is-static"><span class="copy-item-text">${h(plainText(o.value))}</span><button class="btn btn-sm" data-orphan="${h(o.key)}">Remove</button></div>`).join('')}</div></section>` : '');
    };
    draw();
    $('[data-pages]', el).addEventListener('click', (e) => { const b = e.target.closest('[data-page]'); if (!b) return; page = b.dataset.page; $('[data-search]', el).value = ''; draw(); });
    $('[data-search]', el).addEventListener('input', debounce(draw, 150));

    const save = async (f, value, { quiet = false } = {}) => {
      const prev = f.value;
      if (value === null) await api('DELETE', `copy?key=${encodeURIComponent(f.key)}`);
      else f.value = (await api('PUT', 'copy', { key: f.key, value })).data.value;
      if (value === null) f.value = null;
      draw();
      if (!quiet) {
        toast(value === null ? 'Original text is back. Live in about 5 minutes.' : 'Saved. Live on the website in about 5 minutes.', {
          action: 'Undo', onAction: () => save(f, prev, { quiet: true }).then(() => toast('Change undone')).catch(toastError),
        });
      }
    };

    const edit = (f) => {
      const value = current(f);
      const rich = /<(strong|b|em|i|a|span|br)\b/i.test(value);
      const m = modal({
        title: f.name,
        body: `<p class="copy-where">${h(f.page)} · ${h(f.section)}${f.pages.length > 1 ? ` · appears on ${f.pages.length} pages` : ''}</p>
          ${rich ? `<div class="mini-rte"><div class="mini-rte-bar"><button type="button" class="btn btn-sm" data-cmd="bold"><b>B</b> Bold</button><button type="button" class="btn btn-sm" data-cmd="link">${icon('link')}Link</button></div><div class="mini-rte-body" contenteditable="true" data-box aria-label="Text">${value}</div></div>`
            : `<textarea class="textarea copy-box" data-box rows="${Math.min(10, Math.max(3, Math.ceil(plainText(value).length / 40)))}" aria-label="Text">${h(plainText(value))}</textarea>`}
          ${f.value !== null ? `<details class="copy-original"><summary>Show the original text</summary><p>${h(plainText(f.default))}</p></details>` : ''}
          <p class="copy-tech">Technical name: <span class="mono">${h(f.key)}</span></p>`,
        foot: `${f.value !== null ? `<button class="btn btn-ghost" data-reset>${icon('undo')}Back to original</button>` : ''}<span class="spacer"></span><button class="btn" data-close>Cancel</button><button class="btn btn-primary" data-ok>${icon('check')}Save</button>`,
      });
      const box = $('[data-box]', m.el);
      if (rich) {
        box.addEventListener('paste', (e) => { e.preventDefault(); document.execCommand('insertText', false, e.clipboardData.getData('text/plain')); });
        $('.mini-rte-bar', m.el).addEventListener('mousedown', (e) => e.preventDefault());
        $('.mini-rte-bar', m.el).addEventListener('click', (e) => {
          const b = e.target.closest('[data-cmd]'); if (!b) return;
          box.focus();
          if (b.dataset.cmd === 'bold') document.execCommand('bold');
          else { const url = prompt('Link address (for example https://… or /shop.html). Leave empty to remove the link.'); if (url !== null) document.execCommand(url ? 'createLink' : 'unlink', false, url); }
        });
      }
      setTimeout(() => box.focus(), 50);
      $('[data-ok]', m.el).onclick = (e) => busy(e.currentTarget, async () => {
        const next = rich ? box.innerHTML.replace(/&nbsp;/g, ' ').trim() : h(box.value.trim()).replace(/&quot;/g, '"').replace(/&#39;/g, "'");
        if (next === value) { m.close(); return; }
        try { await save(f, next); m.close(); } catch (err) { toastError(err); }
      });
      $('[data-reset]', m.el)?.addEventListener('click', (e) => busy(e.currentTarget, async () => { try { await save(f, null); m.close(); } catch (err) { toastError(err); } }));
    };

    list.addEventListener('click', async (e) => {
      const orphan = e.target.closest('[data-orphan]');
      if (orphan) {
        try { await api('DELETE', `copy?key=${encodeURIComponent(orphan.dataset.orphan)}`); data.orphans = data.orphans.filter((o) => o.key !== orphan.dataset.orphan); draw(); toast('Removed'); } catch (err) { toastError(err); }
        return;
      }
      const item = e.target.closest('[data-key]');
      if (item) edit(fields.find((f) => f.key === item.dataset.key));
    });
  };

  /* ---------------- Settings ---------------- */
  views.settings = async (el) => {
    setHeader('Settings');
    el.innerHTML = skeletonRows(8);
    const res = await api('GET', 'settings');
    if (!el.isConnected) return;
    const s = res.data;
    const field = (key, label, hint = '', { type = 'text', placeholder = '', value = s[key], extra = '' } = {}) => `<div class="field"><label for="s-${key}">${label}</label><input class="input" id="s-${key}" data-k="${key}" type="${type}" value="${h(value)}"${placeholder ? ` placeholder="${h(placeholder)}"` : ''} ${extra}>${hint ? `<span class="hint">${hint}</span>` : ''}</div>`;
    const card = (title, sub, body) => `<section class="card settings-card"><div class="card-head"><div><h2>${title}</h2>${sub ? `<p class="card-sub">${sub}</p>` : ''}</div></div><div class="card-body">${body}</div></section>`;
    const openChecks = res.checks.filter((c) => !c.done);
    el.innerHTML = `
      <p class="page-lead">Your business details as Google and your visitors see them. Change anything, then tap <strong>Save changes</strong> at the bottom.</p>
      ${card('Business details', 'Shown in the footer, on Google, and used by the AI writer as the only facts it may state about you.', `
        ${field('business_name', 'Business name')}
        <div class="grid-2">${field('founder', 'Founder')}${field('founded', 'Year founded', 'For example 2000.', { type: 'text', extra: 'inputmode="numeric"' })}</div>
        <div class="grid-2">${field('partners_count', 'Number of hospitals and clinics you work with', 'For example 100+.')}${field('gstin', 'GST number')}</div>
        ${field('brands', 'Brands you sell', 'For example: Philips, Schiller, Shalya.')}
        <div class="field"><label for="s-services">Services you offer</label><textarea class="textarea" id="s-services" data-k="services" data-lines rows="5">${h(String(s.services || '').split(/\s*;\s*/).filter(Boolean).join('\n'))}</textarea><span class="hint">One service per line.</span></div>`)}
      ${card('Contact and WhatsApp', 'How customers reach you. Used on every page and in the enquiry form.', `
        <div class="grid-2">${field('phone', 'Phone number', 'As customers should dial it, for example +91 94190 08453.', { type: 'tel' })}${field('whatsapp', 'WhatsApp number', 'Numbers only, starting with 91. For example 919419008453.', { type: 'tel', extra: 'inputmode="numeric"' })}</div>
        ${field('email', 'Email address', '', { type: 'email' })}
        ${field('address_street', 'Street address', 'Building, floor and street.')}
        <div class="grid-3">${field('address_city', 'City')}${field('address_region', 'State or region')}${field('address_postcode', 'PIN code', '', { extra: 'inputmode="numeric"' })}</div>
        ${field('map_url', 'Google Maps link', 'Open your shop in Google Maps, tap Share, copy the link and paste it here.', { type: 'url' })}`)}
      ${card('Opening hours', 'Shown to visitors and to Google.', `
        ${field('hours', 'Opening hours as visitors read them', 'For example: Mon to Sun, 9:00 AM to 8:00 PM.')}
        <div class="grid-2">${field('opens', 'Opens at', 'Used by Google to show "Open now".', { type: 'time' })}${field('closes', 'Closes at', '', { type: 'time' })}</div>`)}
      ${card('Google and social media profiles', 'Links to your pages elsewhere help Google trust your business.', `
        <div class="field"><label for="s-sameas">Profile links</label><textarea class="textarea" id="s-sameas" data-k="same_as" data-list rows="4" placeholder="https://www.google.com/maps/place/…&#10;https://www.facebook.com/…">${h((s.same_as || []).join('\n'))}</textarea><span class="hint">One link per line, each starting with https://. For example your Google Business Profile, Facebook, Instagram or JustDial page.</span></div>`)}
      ${card('AI writer', 'How the automatic article writer behaves.', `
        <label class="switch switch-row"><input type="checkbox" data-k="blog_auto_enabled" ${s.blog_auto_enabled ? 'checked' : ''}><span><strong>Write drafts automatically</strong><small>The AI writes a new draft on the schedule below, using your <a href="#writer/topics">topics</a>.</small></span></label>
        <label class="switch switch-row"><input type="checkbox" data-k="blog_auto_publish" ${s.blog_auto_publish ? 'checked' : ''}><span><strong>Publish automatic drafts straight away</strong><small>Best left off for medical content: drafts then wait for you to check them. Even when on, Google only sees an AI article after you mark it as reviewed.</small></span></label>
        <div class="grid-2">
          <div class="field"><label for="s-every">How often</label><select class="select" id="s-every" data-k="blog_every_days" data-num>${[1, 2, 3, 7].map((n) => `<option value="${n}"${s.blog_every_days === n ? ' selected' : ''}>${n === 1 ? 'Every day' : n === 7 ? 'Once a week' : `Every ${n} days`}</option>`).join('')}</select></div>
          <div class="field"><label for="s-len">Article length</label><select class="select" id="s-len" data-k="blog_length">${[['short', 'Short (about 800 words)'], ['medium', 'Medium (about 1,200 words)'], ['long', 'Long (about 1,800 words)']].map(([v, l]) => `<option value="${v}"${s.blog_length === v ? ' selected' : ''}>${l}</option>`).join('')}</select></div>
        </div>
        ${field('blog_region', 'Area the articles are written for', 'For example Jammu and Kashmir.')}
        <div class="field"><label for="s-extra">Extra instructions for every article</label><textarea class="textarea" id="s-extra" data-k="blog_extra_instructions" rows="3" placeholder="For example: mention that we offer free installation in Srinagar.">${h(s.blog_extra_instructions)}</textarea><span class="hint">Optional. Plain sentences work best.</span></div>
        <details class="advanced"><summary>Technical option</summary>${field('ai_model', 'AI model name', 'Only change this if your web developer asks you to.')}</details>`)}
      <details class="card advanced-card"${openChecks.length ? '' : ''}>
        <summary><span><strong>Technical setup</strong><small>${openChecks.length ? `${plural(openChecks.length, 'item')} for your web developer` : 'Everything is set up'}</small></span>${icon('chevronRight')}</summary>
        <div class="card-body"><ul class="checklist">${res.checks.map((c) => `<li class="${c.done ? 'is-done' : 'is-warn'}"><span class="state">${c.done ? icon('check') : '!'}</span><span><strong>${h(c.label)}</strong>${c.done ? '' : `<br><span class="muted">${h(c.fix)}</span>`}</span></li>`).join('')}</ul></div>
      </details>
      <p class="muted small">Signed in as ${h(state.me?.email || '')}. To change the admin password, ask your web developer.</p>`;

    const read = () => {
      const patch = {};
      $$('[data-k]', el).forEach((f) => {
        const k = f.dataset.k;
        if (f.type === 'checkbox') patch[k] = f.checked;
        else if ('num' in f.dataset) patch[k] = Number(f.value);
        else if ('list' in f.dataset) patch[k] = f.value.split(/\s+/).map((x) => x.trim()).filter(Boolean);
        else if ('lines' in f.dataset) patch[k] = f.value.split('\n').map((x) => x.trim()).filter(Boolean).join('; ');
        else patch[k] = f.value;
      });
      return patch;
    };
    let saved = JSON.stringify(read());
    const isDirty = () => JSON.stringify(read()) !== saved;
    window.Admin.setLeaveGuard(() => !isDirty());
    const bar = saveBar({
      onSave: (btn) => busy(btn, async () => {
        const patch = read();
        const bad = patch.same_as.find((u) => !/^https:\/\//.test(u));
        if (bad) { toast(`This profile link must start with https:// : ${bad}`, { error: true, ms: 7000 }); $('#s-sameas').focus(); return; }
        try { await api('PUT', 'settings', patch); saved = JSON.stringify(patch); bar.show(false); toast('Settings saved. The website updates within about 5 minutes.'); } catch (err) { toastError(err); }
      }),
      onDiscard: () => { saved = ''; route(); },
    });
    const check = () => bar.show(isDirty());
    el.addEventListener('input', check);
    el.addEventListener('change', check);
    el.addEventListener('keydown', (e) => { if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 's') { e.preventDefault(); if (isDirty()) $('[data-save-bar]').click(); } });
  };

  /* ---------------- Boot ---------------- */
  window.Admin = { api, toast, toastError, friendly, busy, modal, confirmBox, pickMedia, pickFiles, uploadFile, icon, h, $, $$, fmtDate, ago, plural, plainText, debounce, views, setHeader, skeletonRows, emptyState, statusBadge, saveBar, state, route, setLeaveGuard: (fn) => { leaveGuard = fn; }, invalidatePalette: () => { paletteCache = null; } };

  (async () => {
    try { state.me = (await api('GET', 'me')).data; } catch { return; }
    api('GET', 'overview').then((r) => { state.newInquiries = r.data.inquiries_new; const cur = location.hash.replace('#', '').split('/')[0] || 'overview'; renderNav({ article: 'articles', product: 'products' }[cur] || cur); }).catch(() => {});
    // admin-content.js registers its views synchronously after this file, so route on the next tick
    setTimeout(route, 0);
  })();
})();
