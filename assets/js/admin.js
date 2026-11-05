// Medico admin: app shell, API client, shared UI helpers, command palette,
// and the Overview, Inquiries, Pictures, Site text and Settings views.
// Articles, AI writer and Products live in admin-content.js.
(() => {
  /* ---------------- Icons (Lucide-style strokes) ---------------- */
  const ICONS = {
    overview: '<path d="M3 13h8V3H3zM13 21h8V11h-8zM13 3v6h8V3zM3 21h8v-6H3z"/>',
    articles: '<path d="M14 3H6a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V9z"/><path d="M14 3v6h6M8 13h8M8 17h5"/>',
    writer: '<path d="M12 3l1.9 5.1L19 10l-5.1 1.9L12 17l-1.9-5.1L5 10l5.1-1.9z"/><path d="M19 15l.8 2.2L22 18l-2.2.8L19 21l-.8-2.2L16 18l2.2-.8z"/>',
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
    whatsapp: '<path d="M4 20l1.3-3.9A8 8 0 1 1 8 19.1z"/><path d="M9 9.5c0 3 2.5 5.5 5.5 5.5l1-1.5-2-1-1 .8a4 4 0 0 1-1.8-1.8l.8-1-1-2z"/>',
    image: '<rect x="3" y="4" width="18" height="16" rx="2"/><circle cx="9" cy="10" r="2"/><path d="M21 16l-5-5-9 9"/>',
  };
  const icon = (name) => `<svg class="i" viewBox="0 0 24 24" aria-hidden="true">${ICONS[name] || ''}</svg>`;

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

  async function api(method, path, body) {
    const res = await fetch(`/api/admin/${path}`, {
      method, credentials: 'same-origin',
      headers: body !== undefined ? { 'Content-Type': 'application/json' } : {},
      body: body !== undefined ? JSON.stringify(body) : undefined,
    });
    if (res.status === 401 && !path.startsWith('login')) {
      location.replace(`/admin-login.html?next=${encodeURIComponent(location.pathname + location.hash)}`);
      throw new Error('Please sign in again.');
    }
    const type = res.headers.get('content-type') || '';
    if (!type.includes('json')) { if (!res.ok) throw new Error(`Request failed (${res.status}).`); return res.text(); }
    const json = await res.json();
    if (!res.ok || json.ok === false) throw Object.assign(new Error(json.error || `Request failed (${res.status}).`), { status: res.status, body: json });
    return json;
  }

  function toast(message, { error = false, action, onAction, ms = 3800 } = {}) {
    const el = document.createElement('div');
    el.className = `toast${error ? ' is-error' : ''}`;
    el.innerHTML = `<span>${h(message)}</span>${action ? `<button type="button">${h(action)}</button>` : ''}`;
    if (action) el.querySelector('button').onclick = () => { el.remove(); onAction(); };
    $('#toasts').appendChild(el);
    setTimeout(() => el.remove(), ms);
  }
  const toastError = (err) => toast(err.message || String(err), { error: true, ms: 6000 });

  /** Run fn with the button in a busy state. */
  async function busy(btn, fn) {
    if (btn) { btn.classList.add('is-busy'); btn.disabled = true; }
    try { return await fn(); } finally { if (btn) { btn.classList.remove('is-busy'); btn.disabled = false; } }
  }

  /** Modal dialog. Returns { el, body, close, done } where done resolves with the close value. */
  function modal({ title, body = '', foot = '', wide = false, full = false }) {
    const el = document.createElement('dialog');
    if (wide) el.classList.add('is-wide');
    if (full) el.classList.add('is-full');
    el.innerHTML = `<div class="dialog-head"><h2>${h(title)}</h2><span class="spacer"></span><button type="button" class="btn btn-ghost btn-icon btn-sm" data-close aria-label="Close">${icon('x')}</button></div>
      <div class="dialog-body">${body}</div>${foot ? `<div class="dialog-foot">${foot}</div>` : ''}`;
    document.body.appendChild(el);
    let resolve;
    const done = new Promise((r) => { resolve = r; });
    const close = (value) => { el.close(); el.remove(); resolve(value); };
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
    if (!/^image\//.test(file.type)) throw new Error('Please choose an image file.');
    const bmp = await createImageBitmap(file);
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

  /** Picture library picker: choose an existing picture or upload a new one. Resolves to a URL or null. */
  async function pickMedia(title = 'Choose a picture') {
    const m = modal({ title, wide: true, body: `<div class="toolbar-row"><button class="btn btn-primary" data-upload>${icon('upload')}Upload new</button><span class="muted small">Pictures are resized to WebP in your browser before upload.</span></div><div class="photo-grid" data-grid>${'<div class="skel" style="height:140px"></div>'.repeat(6)}</div>` });
    const grid = $('[data-grid]', m.el);
    $('[data-upload]', m.el).onclick = async (e) => {
      const files = await pickFiles();
      if (!files.length) return;
      await busy(e.currentTarget, async () => { try { const up = await uploadFile(files[0]); m.close(up.url); } catch (err) { toastError(err); } });
    };
    try {
      const { data } = await api('GET', 'media');
      grid.innerHTML = data.length ? data.map((p) => `<button type="button" class="photo" data-url="${h(p.url)}"><img src="${h(p.url)}" alt="" loading="lazy"><span>${h(p.name || '')}</span></button>`).join('')
        : '<div class="empty" style="grid-column:1/-1"><h3>No pictures yet</h3><p>Upload the first one.</p></div>';
      grid.onclick = (e) => { const b = e.target.closest('[data-url]'); if (b) m.close(b.dataset.url); };
    } catch (err) { grid.innerHTML = `<p class="muted">${h(err.message)}</p>`; }
    return m.done;
  }

  /* ---------------- Shell, routing ---------------- */
  const NAV = [
    ['overview', 'Overview'], ['articles', 'Articles'], ['writer', 'AI writer'], ['products', 'Products'],
    ['inquiries', 'Inquiries'], ['media', 'Pictures'], ['copy', 'Site text'], ['settings', 'Settings'],
  ];
  const views = {};
  let leaveGuard = null; // returns true if it is OK to leave the current view

  function renderNav(active) {
    $('#nav').innerHTML = NAV.map(([id, label]) => `<a href="#${id}" data-nav="${id}"${id === active ? ' aria-current="page"' : ''}>${icon(id)}<span>${label}</span>${id === 'inquiries' && state.newInquiries ? `<span class="count">${state.newInquiries}</span>` : ''}</a>`).join('');
  }
  const state = { newInquiries: 0, me: null };

  function setHeader(title, actionsHtml = '') {
    $('#title').innerHTML = title;
    $('#actions').innerHTML = actionsHtml;
    document.title = `${$('#title').textContent} | Medico Admin`;
  }

  async function route() {
    const [name, ...rest] = location.hash.replace(/^#/, '').split('/');
    const view = views[name] ? name : 'overview';
    const navId = { article: 'articles', product: 'products' }[view] || view;
    renderNav(navId);
    $('#app').classList.remove('is-menu-open');
    $('.scrim')?.remove();
    leaveGuard = null;
    const el = $('#view');
    el.className = 'view';
    el.innerHTML = '';
    window.scrollTo(0, 0);
    try { await views[view](el, rest.map(decodeURIComponent)); } catch (err) { el.innerHTML = `<div class="notice notice-accent">${icon('alert')}<span>${h(err.message)}</span></div>`; }
  }

  window.addEventListener('beforeunload', (e) => { if (leaveGuard && !leaveGuard()) { e.preventDefault(); e.returnValue = ''; } });
  let lastHash = location.hash;
  window.addEventListener('hashchange', () => {
    if (leaveGuard && !leaveGuard() && !confirm('You have unsaved changes. Leave this page?')) { history.replaceState(null, '', lastHash || '#overview'); return; }
    lastHash = location.hash;
    route();
  });

  // Sidebar: collapse (desktop) and drawer (mobile)
  $$('.side-foot [data-icon], [data-icon]').forEach((el) => { if (!el.querySelector('svg')) el.insertAdjacentHTML('afterbegin', icon(el.dataset.icon)); });
  try { if (localStorage.getItem('medico_admin_collapsed') === '1') $('#app').classList.add('is-collapsed'); } catch { /* private mode */ }
  $('#collapse').onclick = (e) => {
    e.preventDefault();
    const on = $('#app').classList.toggle('is-collapsed');
    try { localStorage.setItem('medico_admin_collapsed', on ? '1' : '0'); } catch { /* private mode */ }
  };
  $('#menu').onclick = () => {
    $('#app').classList.add('is-menu-open');
    const scrim = Object.assign(document.createElement('div'), { className: 'scrim' });
    scrim.onclick = () => { $('#app').classList.remove('is-menu-open'); scrim.remove(); };
    document.body.appendChild(scrim);
  };
  $('#logout').onclick = async (e) => { e.preventDefault(); await api('POST', 'logout', {}).catch(() => {}); location.replace('/admin-login.html'); };

  /* ---------------- Command palette ---------------- */
  const isMac = /Mac|iPhone|iPad/.test(navigator.platform);
  $('#kbd-hint').textContent = isMac ? '⌘K' : 'Ctrl K';
  let paletteItems = [];
  let paletteIndex = 0;
  let paletteCache = null;
  const baseCommands = () => [
    ...NAV.map(([id, label]) => ({ group: 'Go to', label, icon: id, run: () => { location.hash = id; } })),
    { group: 'Actions', label: 'New article', icon: 'plus', hint: 'N', run: () => { location.hash = 'article/new'; } },
    { group: 'Actions', label: 'Write an article with AI', icon: 'writer', run: () => { location.hash = 'writer'; } },
    { group: 'Actions', label: 'Add a product', icon: 'plus', run: () => { location.hash = 'product/new'; } },
    { group: 'Actions', label: 'Upload pictures', icon: 'upload', run: () => { location.hash = 'media'; setTimeout(() => $('[data-upload-many]')?.click(), 300); } },
    { group: 'Actions', label: 'Open the website', icon: 'external', run: () => window.open('/', '_blank', 'noopener') },
    { group: 'Actions', label: 'Toggle sidebar', icon: 'sidebar', run: () => $('#collapse').click() },
    { group: 'Actions', label: 'Sign out', icon: 'logout', run: () => $('#logout').click() },
  ];
  async function loadPaletteCache() {
    if (paletteCache) return paletteCache;
    try {
      const [posts, products] = await Promise.all([api('GET', 'posts'), api('GET', 'products')]);
      paletteCache = [
        ...posts.data.map((p) => ({ group: 'Articles', label: p.title, icon: 'articles', hint: p.status, run: () => { location.hash = `article/${encodeURIComponent(p.id)}`; } })),
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
    }).join('') : '<li class="group">No matches</li>';
    $('#palette-list [aria-selected="true"]')?.scrollIntoView({ block: 'nearest' });
  }
  async function openPalette() {
    const d = $('#palette');
    if (d.open) return;
    $('#palette-input').value = '';
    paletteIndex = 0;
    drawPalette();
    d.showModal();
    $('#palette-input').focus();
    await loadPaletteCache();
    if (d.open) drawPalette();
  }
  const runPalette = (i) => { const c = paletteItems[i]; if (!c) return; $('#palette').close(); c.run(); };
  $('#open-palette').onclick = openPalette;
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
  const skeletonRows = (n = 6) => Array.from({ length: n }, () => `<div class="skel-row"><div class="skel" style="width:44px;height:32px"></div><div style="flex:1;display:grid;gap:8px"><div class="skel" style="width:${40 + Math.random() * 40}%"></div><div class="skel" style="width:30%;height:10px"></div></div></div>`).join('');
  const emptyState = (iconName, title, text, actionHtml = '') => `<div class="empty">${icon(iconName)}<h3>${h(title)}</h3><p>${h(text)}</p>${actionHtml}</div>`;
  const statusBadge = (p) => {
    if (p.status === 'published' && p.published_at && new Date(p.published_at) > new Date()) return '<span class="badge badge-soft">Scheduled</span>';
    return p.status === 'published' ? '<span class="badge badge-solid">Live</span>' : '<span class="badge">Draft</span>';
  };

  /* ---------------- Overview ---------------- */
  views.overview = async (el) => {
    setHeader('Overview', `<a class="btn btn-primary" href="#writer">${icon('writer')}<span class="desktop-only">Write with AI</span></a>`);
    el.innerHTML = `<div class="stats">${'<div class="stat"><div class="skel" style="width:60%"></div><div class="skel" style="height:28px;width:40%;margin-top:10px"></div></div>'.repeat(4)}</div>${skeletonRows(4)}`;
    const { data: d } = await api('GET', 'overview');
    state.newInquiries = d.inquiries_new;
    renderNav('overview');
    const max = Math.max(1, ...d.daily.map((x) => x.n));
    const run = d.lastRun;
    const runText = !run ? 'No runs yet' : run.status === 'failed' ? 'Failed' : run.status === 'running' ? 'Running' : run.status === 'skipped' ? 'Skipped' : 'Succeeded';
    el.innerHTML = `
      ${!d.ai ? `<div class="notice notice-accent">${icon('alert')}<span><strong>AI writer not configured:</strong> add GROQ_API_KEY in Vercel. Everything else works.</span></div>` : ''}
      ${!d.cron ? `<div class="notice">${icon('clock')}<span>The daily article does not run yet: add <span class="mono">CRON_SECRET</span> in Vercel. You can still write articles any time from the AI writer.</span></div>` : ''}
      <div class="stats">
        <a class="stat" href="#inquiries"><div class="stat-label">${icon('inquiries')}Inquiries this week</div><div class="stat-value">${d.inquiries_week}</div><div class="stat-sub">${d.inquiries_new} new, not yet handled</div>
          <div class="bars" aria-label="Inquiries per day, last 14 days">${d.daily.map((x, i) => `<span title="${h(x.day)}: ${x.n}" style="height:${(x.n / max) * 100}%"${i === d.daily.length - 1 ? ' class="is-today"' : ''}></span>`).join('')}</div></a>
        <a class="stat" href="#articles"><div class="stat-label">${icon('articles')}Articles live</div><div class="stat-value">${d.posts_live}</div><div class="stat-sub">${d.posts_month} published in the last 30 days</div></a>
        <a class="stat" href="#articles/review"><div class="stat-label">${icon('eye')}Waiting for review</div><div class="stat-value">${d.posts_unreviewed + d.posts_draft}</div><div class="stat-sub">${d.posts_draft} drafts, ${d.posts_unreviewed} AI articles not reviewed</div></a>
        <a class="stat" href="#writer/history"><div class="stat-label">${icon('writer')}Last writer run</div><div class="stat-value" style="font-size:20px;margin-top:10px">${runText}</div><div class="stat-sub">${run ? `${h(ago(run.created_at))}${run.topic ? ` · ${h(run.topic)}` : ''}` : 'Write the first article from the AI writer'}</div></a>
      </div>
      <div class="cols">
        <section class="card"><div class="card-head"><h2>Needs your review</h2><span class="spacer"></span><a class="btn btn-sm" href="#articles">All articles</a></div>
          ${d.review.length ? `<ul class="list">${d.review.map((p) => `<li>${p.ai_generated ? '<span class="badge badge-ghost">AI</span>' : ''}<a href="#article/${encodeURIComponent(p.id)}" class="truncate">${h(p.title)}</a><span class="spacer"></span>${p.status === 'draft' ? '<span class="badge">Draft</span>' : '<span class="badge badge-accent">Not reviewed</span>'}<span class="muted small">${h(ago(p.created_at))}</span></li>`).join('')}</ul>`
            : emptyState('check', 'All caught up', 'Nothing is waiting for review.', '<a class="btn" href="#writer">Write a new article</a>')}
        </section>
        <section class="card"><div class="card-head"><h2>Latest inquiries</h2><span class="spacer"></span><a class="btn btn-sm" href="#inquiries">Inbox</a></div>
          ${d.inquiries.length ? `<ul class="list">${d.inquiries.map((i) => `<li><div style="min-width:0"><strong>${h(i.name)}</strong><div class="muted small truncate">${h(i.interest || i.phone)}</div></div><span class="spacer"></span>${i.status === 'new' ? '<span class="badge badge-solid">New</span>' : `<span class="badge">${h(i.status)}</span>`}<span class="muted small">${h(ago(i.created_at))}</span></li>`).join('')}</ul>`
            : emptyState('inquiries', 'No inquiries yet', 'Requests from the website contact forms will appear here.')}
        </section>
      </div>
      <h3 class="section-title">At a glance</h3>
      <div class="stats">
        <a class="stat" href="#products"><div class="stat-label">Products shown</div><div class="stat-value">${d.products_live}</div><div class="stat-sub">${d.products_total - d.products_live} hidden</div></a>
        <a class="stat" href="#writer/topics"><div class="stat-label">Active writer topics</div><div class="stat-value">${d.topics}</div></a>
        <a class="stat" href="#media"><div class="stat-label">Pictures</div><div class="stat-value">${d.pictures}</div><div class="stat-sub">${bytes(d.picture_bytes)}</div></a>
        <a class="stat" href="#copy"><div class="stat-label">Edited text blocks</div><div class="stat-value">${d.copy_overrides}</div></a>
      </div>`;
  };

  /* ---------------- Inquiries ---------------- */
  views.inquiries = async (el, [filter = 'new']) => {
    setHeader('Inquiries');
    el.innerHTML = `<div class="tabs" role="tablist">${['new', 'handled', 'archived', 'all'].map((f) => `<button role="tab" aria-selected="${f === filter}" data-f="${f}">${f[0].toUpperCase() + f.slice(1)}</button>`).join('')}</div>
      <div class="toolbar-row"><input class="input" data-search placeholder="Search name, phone, message" aria-label="Search inquiries"></div><div data-list>${skeletonRows()}</div>`;
    $$('[data-f]', el).forEach((b) => { b.onclick = () => { location.hash = `inquiries/${b.dataset.f}`; }; });
    const { data } = await api('GET', `inquiries${filter === 'all' ? '' : `?status=${filter}`}`);
    const list = $('[data-list]', el);
    const draw = () => {
      const q = $('[data-search]', el).value.trim().toLowerCase();
      const rows = data.filter((i) => !q || [i.name, i.phone, i.email, i.message, i.organisation, i.interest].some((f) => f && f.toLowerCase().includes(q)));
      if (!rows.length) { list.innerHTML = emptyState('inquiries', filter === 'new' ? 'No new inquiries' : 'Nothing here', filter === 'new' ? 'New requests from the website will show up here.' : 'Try another tab.'); return; }
      list.innerHTML = `<table class="table stack"><thead><tr><th>From</th><th>Interest</th><th>Message</th><th>Received</th><th></th></tr></thead><tbody>${rows.map((i) => {
        const wa = String(i.phone).replace(/\D/g, '').replace(/^0+/, '');
        const waNum = wa.length === 10 ? `91${wa}` : wa;
        return `<tr data-id="${h(i.id)}">
          <td class="title-cell" data-label="From">${h(i.name)}<small><a href="tel:${h(i.phone)}">${h(i.phone)}</a>${i.email ? ` · <a href="mailto:${h(i.email)}">${h(i.email)}</a>` : ''}${i.organisation ? ` · ${h(i.organisation)}` : ''}</small></td>
          <td data-label="Interest">${h(i.interest || '')}</td>
          <td data-label="Message"><div class="small" style="max-width:360px;white-space:pre-wrap">${h(i.message || '')}</div>${i.page ? `<div class="muted small">from ${h(i.page)}</div>` : ''}${i.notes ? `<div class="small" style="margin-top:4px"><span class="badge badge-ghost">Note</span> ${h(i.notes)}</div>` : ''}</td>
          <td data-label="Received" class="small">${h(fmtDate(i.created_at, true))}<div class="muted">${i.status === 'new' ? '<span class="badge badge-solid">New</span>' : `<span class="badge">${h(i.status)}</span>`}</div></td>
          <td class="actions">
            <a class="btn btn-sm btn-icon" href="https://wa.me/${h(waNum)}" target="_blank" rel="noopener" aria-label="WhatsApp">${icon('whatsapp')}</a>
            ${i.status === 'new' ? `<button class="btn btn-sm" data-act="handled">${icon('check')}Handled</button>` : '<button class="btn btn-sm" data-act="new">Reopen</button>'}
            <button class="btn btn-sm btn-ghost" data-act="note">Note</button>
            ${i.status !== 'archived' ? '<button class="btn btn-sm btn-ghost" data-act="archived">Archive</button>' : ''}
            <button class="btn btn-sm btn-ghost btn-icon btn-danger" data-act="delete" aria-label="Delete">${icon('trash')}</button>
          </td></tr>`;
      }).join('')}</tbody></table>`;
    };
    draw();
    $('[data-search]', el).addEventListener('input', debounce(draw, 150));
    list.addEventListener('click', async (e) => {
      const btn = e.target.closest('[data-act]');
      if (!btn) return;
      const id = btn.closest('tr').dataset.id;
      const item = data.find((x) => x.id === id);
      const act = btn.dataset.act;
      try {
        if (act === 'delete') {
          if (!(await confirmBox('Delete inquiry?', `The inquiry from <strong>${h(item.name)}</strong> will be removed permanently.`, { ok: 'Delete', danger: true }))) return;
          data.splice(data.indexOf(item), 1); draw();
          await api('DELETE', `inquiries?id=${encodeURIComponent(id)}`);
          toast('Inquiry deleted');
        } else if (act === 'note') {
          const m = modal({ title: `Note on ${item.name}`, body: `<textarea class="textarea" data-note rows="4">${h(item.notes || '')}</textarea>`, foot: '<button class="btn" data-close>Cancel</button><button class="btn btn-primary" data-ok>Save note</button>' });
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
          toast(act === 'handled' ? 'Marked as handled' : act === 'new' ? 'Moved back to New' : 'Archived');
        }
      } catch (err) { toastError(err); route(); }
    });
  };

  /* ---------------- Pictures ---------------- */
  views.media = async (el) => {
    setHeader('Pictures', `<button class="btn btn-primary" data-upload-many>${icon('upload')}<span class="desktop-only">Upload</span></button>`);
    el.innerHTML = `<p class="muted small" data-total></p><div class="photo-grid" data-grid>${'<div class="skel" style="height:150px"></div>'.repeat(8)}</div>`;
    const load = async () => {
      const { data } = await api('GET', 'media');
      $('[data-total]', el).textContent = `${data.length} pictures · ${bytes(data.reduce((s, p) => s + p.bytes, 0))} · resized in the browser before upload`;
      $('[data-grid]', el).innerHTML = data.length ? data.map((p) => `<div class="photo media-tile" data-id="${h(p.id)}" data-url="${h(p.url)}"><img src="${h(p.url)}" alt="${h(p.name || '')}" loading="lazy">
          <span>${h(p.name || 'picture')} · ${bytes(p.bytes)}${p.width ? ` · ${p.width}×${p.height}` : ''}${p.credit?.text ? `<br>${h(p.credit.text)}` : ''}</span>
          <div class="tile-actions"><button class="btn btn-sm btn-icon" data-copy aria-label="Copy address">${icon('copyIcon')}</button><button class="btn btn-sm btn-icon btn-danger" data-del aria-label="Delete">${icon('trash')}</button></div></div>`).join('')
        : `<div style="grid-column:1/-1">${emptyState('media', 'No pictures yet', 'Upload product photos, article covers and inline images.', `<button class="btn btn-primary" data-upload-many>${icon('upload')}Upload pictures</button>`)}</div>`;
    };
    const upload = async (btn) => {
      const files = await pickFiles(true);
      if (!files.length) return;
      await busy(btn, async () => {
        let done = 0;
        for (const f of files) { try { await uploadFile(f); done++; } catch (err) { toastError(err); } }
        if (done) toast(`${done} picture${done > 1 ? 's' : ''} uploaded`);
        await load();
      });
    };
    document.addEventListener('click', function onUp(e) {
      if (!el.isConnected) { document.removeEventListener('click', onUp); return; }
      const b = e.target.closest('[data-upload-many]'); if (b) upload(b);
    });
    $('[data-grid]', el).addEventListener('click', async (e) => {
      const tile = e.target.closest('[data-id]');
      if (!tile) return;
      if (e.target.closest('[data-copy]')) { await navigator.clipboard.writeText(location.origin + tile.dataset.url).catch(() => {}); toast('Address copied'); return; }
      if (!e.target.closest('[data-del]')) return;
      try {
        await api('DELETE', `media?id=${tile.dataset.id}`);
        tile.remove(); toast('Picture deleted');
      } catch (err) {
        if (err.body && err.body.inUse && await confirmBox('Picture in use', `${h(err.message)}<br><br>Pages using it will show a broken image until you change them.`, { ok: 'Delete anyway', danger: true })) {
          await api('DELETE', `media?id=${tile.dataset.id}&force=1`); tile.remove(); toast('Picture deleted');
        } else if (!err.body?.inUse) toastError(err);
      }
    });
    await load();
  };

  /* ---------------- Site text ---------------- */
  views.copy = async (el) => {
    setHeader('Site text');
    el.innerHTML = `<div class="notice">${icon('copy')}<span>Every block of text on the public pages that has an edit key is listed here. Your change replaces the text on the live site within about five minutes. <strong>Reset</strong> brings back the original wording from the page file. Inline formatting allowed: <span class="mono">&lt;strong&gt; &lt;em&gt; &lt;br&gt; &lt;a href&gt; &lt;span class&gt;</span>.</span></div>
      <div class="toolbar-row"><input class="input" data-search placeholder="Search text or key" aria-label="Search site text"><label class="switch small"><input type="checkbox" data-edited> Edited only</label><span class="spacer"></span><span class="muted small" data-count></span></div><div data-list>${skeletonRows()}</div>`;
    const { data } = await api('GET', 'copy');
    const list = $('[data-list]', el);
    const strip = (s) => String(s || '').replace(/<[^>]+>/g, '').replace(/\s+/g, ' ').trim();
    const draw = () => {
      const q = $('[data-search]', el).value.trim().toLowerCase();
      const editedOnly = $('[data-edited]', el).checked;
      const rows = data.fields.filter((f) => (!editedOnly || f.value !== null) && (!q || [f.key, f.label, strip(f.default), strip(f.value)].some((x) => x && x.toLowerCase().includes(q))));
      $('[data-count]', el).textContent = `${rows.length} of ${data.fields.length} blocks`;
      if (!data.fields.length) { list.innerHTML = emptyState('copy', 'No editable text found', 'The public pages do not have data-copy keys yet.'); return; }
      const groups = [...new Set(rows.map((f) => f.group))];
      list.innerHTML = groups.map((g) => {
        const fields = rows.filter((f) => f.group === g);
        const byPrefix = [...new Set(fields.map((f) => f.key.split('.').slice(0, 2).join('.')))];
        return `<section class="card" style="margin-bottom:16px"><div class="card-head"><h2>${h(g)}</h2><span class="muted small">${fields.length}</span></div><div class="card-body">${byPrefix.map((p) => `<h3 class="section-title" style="margin-top:0">${h(p)}</h3>${fields.filter((f) => f.key.split('.').slice(0, 2).join('.') === p).map((f) => `
          <div class="field" data-key="${h(f.key)}">
            <label>${h(f.label || f.key.split('.').slice(2).join(' ') || f.key)} <span class="mono muted">${h(f.key)}</span>${f.value !== null ? '<span class="badge badge-soft">Edited</span>' : ''}${f.pages.length > 1 ? `<span class="muted small">on ${f.pages.length} pages</span>` : ''}</label>
            <textarea class="textarea" rows="${Math.min(6, Math.max(1, Math.ceil(strip(f.value ?? f.default).length / 90)))}" style="min-height:0">${h(f.value ?? f.default)}</textarea>
            <div class="row"><button class="btn btn-sm btn-primary" data-save disabled>Save</button>${f.value !== null ? '<button class="btn btn-sm btn-ghost" data-reset>Reset to original</button>' : ''}${f.value !== null ? `<span class="muted small">Original: ${h(strip(f.default).slice(0, 140))}</span>` : ''}</div>
          </div>`).join('')}`).join('')}</div></section>`;
      }).join('') + (data.orphans.length ? `<section class="card"><div class="card-head"><h2>Edits for text that is no longer on any page</h2></div><ul class="list">${data.orphans.map((o) => `<li><span class="mono">${h(o.key)}</span><span class="truncate muted">${h(strip(o.value))}</span><span class="spacer"></span><button class="btn btn-sm" data-orphan="${h(o.key)}">Remove</button></li>`).join('')}</ul></section>` : '');
    };
    draw();
    $('[data-search]', el).addEventListener('input', debounce(draw, 150));
    $('[data-edited]', el).addEventListener('change', draw);
    list.addEventListener('input', (e) => { const f = e.target.closest('[data-key]'); if (f) $('[data-save]', f).disabled = false; });
    list.addEventListener('click', async (e) => {
      const orphan = e.target.closest('[data-orphan]');
      if (orphan) { await api('DELETE', `copy?key=${encodeURIComponent(orphan.dataset.orphan)}`); data.orphans = data.orphans.filter((o) => o.key !== orphan.dataset.orphan); draw(); toast('Removed'); return; }
      const box = e.target.closest('[data-key]');
      if (!box) return;
      const field = data.fields.find((f) => f.key === box.dataset.key);
      if (e.target.closest('[data-save]')) {
        const value = $('textarea', box).value;
        await busy(e.target.closest('[data-save]'), async () => {
          try { const r = await api('PUT', 'copy', { key: field.key, value }); field.value = r.data.value; draw(); toast('Saved. The live page updates within about five minutes.'); } catch (err) { toastError(err); }
        });
      }
      if (e.target.closest('[data-reset]')) {
        const prev = field.value;
        field.value = null; draw();
        try {
          await api('DELETE', `copy?key=${encodeURIComponent(field.key)}`);
          toast('Original text restored', { action: 'Undo', onAction: async () => { await api('PUT', 'copy', { key: field.key, value: prev }); field.value = prev; draw(); } });
        } catch (err) { field.value = prev; draw(); toastError(err); }
      }
    });
  };

  /* ---------------- Settings ---------------- */
  views.settings = async (el) => {
    setHeader('Settings', '<button class="btn btn-primary" data-save-settings>Save</button>');
    el.innerHTML = skeletonRows(8);
    const res = await api('GET', 'settings');
    const s = res.data;
    const input = (key, label, hint = '', type = 'text') => `<div class="field"><label for="s-${key}">${label}</label><input class="input" id="s-${key}" data-k="${key}" type="${type}" value="${h(s[key])}">${hint ? `<span class="hint">${hint}</span>` : ''}</div>`;
    el.innerHTML = `
      <section class="card" style="margin-bottom:16px"><div class="card-head"><h2>Setup checklist</h2></div><div class="card-body"><ul class="checklist">${res.checks.map((c) => `<li class="${c.done ? 'is-done' : 'is-warn'}"><span class="state">${c.done ? icon('check') : '!'}</span><span><strong>${h(c.label)}</strong>${c.done ? '' : `<br><span class="muted">${h(c.fix)}</span>`}</span></li>`).join('')}</ul></div></section>
      <section class="card" style="margin-bottom:16px"><div class="card-head"><h2>AI writer</h2></div><div class="card-body">
        <div class="row" style="margin-bottom:14px;gap:24px">
          <label class="switch"><input type="checkbox" data-k="blog_auto_enabled" ${s.blog_auto_enabled ? 'checked' : ''}> Write an article automatically on the schedule</label>
          <label class="switch"><input type="checkbox" data-k="blog_auto_publish" ${s.blog_auto_publish ? 'checked' : ''}> Publish automatic articles straight away</label>
        </div>
        <p class="hint" style="margin-top:-6px">Off is recommended for medical content: automatic articles wait in drafts. Even when published, AI articles stay hidden from Google until you mark them reviewed.</p>
        <div class="grid-3">
          <div class="field"><label for="s-every">Write every</label><select class="select" id="s-every" data-k="blog_every_days" data-num>${[1, 2, 3, 7].map((n) => `<option value="${n}"${s.blog_every_days === n ? ' selected' : ''}>${n === 1 ? 'day' : `${n} days`}</option>`).join('')}</select></div>
          <div class="field"><label for="s-len">Article length</label><select class="select" id="s-len" data-k="blog_length">${[['short', 'Short (700 to 900 words)'], ['medium', 'Medium (1100 to 1400)'], ['long', 'Long (1600 to 2000)']].map(([v, l]) => `<option value="${v}"${s.blog_length === v ? ' selected' : ''}>${l}</option>`).join('')}</select></div>
          ${input('ai_model', 'AI model', 'Fallbacks are tried automatically.')}
        </div>
        ${input('blog_region', 'Region the articles focus on')}
        <div class="field"><label for="s-extra">Extra instructions for every article</label><textarea class="textarea" id="s-extra" data-k="blog_extra_instructions">${h(s.blog_extra_instructions)}</textarea></div>
      </div></section>
      <section class="card" style="margin-bottom:16px"><div class="card-head"><h2>Business details</h2><span class="muted small">Used in structured data, llms.txt and as the only company facts the AI writer may state</span></div><div class="card-body">
        <div class="grid-2">${input('business_name', 'Business name')}${input('founder', 'Founder')}</div>
        <div class="grid-3">${input('phone', 'Phone')}${input('whatsapp', 'WhatsApp number', 'Digits with country code, e.g. 919419008453')}${input('email', 'Email', '', 'email')}</div>
        ${input('address_street', 'Street address')}
        <div class="grid-3">${input('address_city', 'City')}${input('address_region', 'Region')}${input('address_postcode', 'PIN code')}</div>
        <div class="grid-3">${input('hours', 'Opening hours (text)')}${input('opens', 'Opens (HH:MM)')}${input('closes', 'Closes (HH:MM)')}</div>
        ${input('map_url', 'Map link', '', 'url')}
        <div class="grid-3">${input('gstin', 'GSTIN')}${input('founded', 'Founded (year)')}${input('partners_count', 'Healthcare partners')}</div>
        ${input('brands', 'Authorised brands')}
        <div class="field"><label for="s-services">Services (separate with semicolons)</label><textarea class="textarea" id="s-services" data-k="services">${h(s.services)}</textarea></div>
        <div class="field"><label for="s-sameas">Business profiles (one https:// link per line)</label><textarea class="textarea" id="s-sameas" data-k="same_as" data-list placeholder="https://www.google.com/maps/place/...&#10;https://www.facebook.com/...">${h((s.same_as || []).join('\n'))}</textarea><span class="hint">Google Business Profile, Facebook, Instagram, LinkedIn, JustDial and similar. Used as sameAs in structured data.</span></div>
      </div></section>
      <p class="muted small">Signed in as ${h(state.me?.email || '')}. The admin password is set with ADMIN_PASSWORD in Vercel.</p>`;
    const save = async (btn) => busy(btn, async () => {
      const patch = {};
      $$('[data-k]', el).forEach((f) => {
        const k = f.dataset.k;
        if (f.type === 'checkbox') patch[k] = f.checked;
        else if ('num' in f.dataset) patch[k] = Number(f.value);
        else if ('list' in f.dataset) patch[k] = f.value.split(/\s+/).map((x) => x.trim()).filter(Boolean);
        else patch[k] = f.value;
      });
      try { await api('PUT', 'settings', patch); toast('Settings saved'); } catch (err) { toastError(err); }
    });
    $('[data-save-settings]').onclick = (e) => save(e.currentTarget);
    el.addEventListener('keydown', (e) => { if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 's') { e.preventDefault(); save($('[data-save-settings]')); } });
  };

  /* ---------------- Boot ---------------- */
  window.Admin = { api, toast, toastError, busy, modal, confirmBox, pickMedia, pickFiles, uploadFile, icon, h, $, $$, fmtDate, ago, debounce, views, setHeader, skeletonRows, emptyState, statusBadge, state, route, setLeaveGuard: (fn) => { leaveGuard = fn; }, invalidatePalette: () => { paletteCache = null; } };

  (async () => {
    try { state.me = (await api('GET', 'me')).data; } catch { return; }
    api('GET', 'overview').then((r) => { state.newInquiries = r.data.inquiries_new; const cur = location.hash.replace('#', '').split('/')[0] || 'overview'; renderNav({ article: 'articles', product: 'products' }[cur] || cur); }).catch(() => {});
    // admin-content.js registers its views synchronously after this file, so route on the next tick
    setTimeout(route, 0);
  })();
})();
