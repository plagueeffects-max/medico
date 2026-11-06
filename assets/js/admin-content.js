// Medico admin: Articles (list + editor), AI writer, Products.
(() => {
  const { api, toast, toastError, busy, modal, confirmBox, pickMedia, pickFiles, uploadFile, icon, h, $, $$, fmtDate, ago, debounce, views, setHeader, skeletonRows, emptyState, statusBadge } = window.Admin;
  const CATEGORIES = ['Clinical Insights', 'Product Guides', 'Healthcare Infrastructure', 'Patient Care', 'Industry News'];
  const MARKER_RE = /\[(NEEDS SOURCE|FLAG[^\]]*)\]/g;
  const toLocalInput = (d) => { if (!d) return ''; const x = new Date(d); return new Date(x.getTime() - x.getTimezoneOffset() * 60000).toISOString().slice(0, 16); };

  /* ================= Articles list ================= */
  const needsReview = (p) => (p.ai_generated && !p.reviewed_at) || p.has_markers;
  views.articles = async (el, [filter = 'all'] = []) => {
    setHeader('Articles', `<a class="btn" href="#writer">${icon('writer')}<span class="desktop-only">Write with AI</span></a><a class="btn btn-primary" href="#article/new">${icon('plus')}<span class="desktop-only">New article</span></a>`);
    const FILTERS = [['all', 'All'], ['live', 'Live'], ['draft', 'Drafts'], ['review', 'Needs review']];
    const MATCH = { all: () => true, live: (p) => p.status === 'published', draft: (p) => p.status === 'draft', review: (p) => p.status === 'draft' || needsReview(p), ai: (p) => p.ai_generated };
    if (!MATCH[filter]) filter = 'all';
    el.innerHTML = `
      <div class="tabs" role="tablist">
        ${FILTERS.map(([f, l]) => `<button role="tab" aria-selected="${f === filter}" data-f="${f}">${l}<span class="tab-pill-count" data-c="${f}"></span></button>`).join('')}
      </div>
      <div class="toolbar-row">
        <div class="search-box-wrap">
          ${icon('search')}
          <input class="input" type="search" data-search placeholder="Search articles" aria-label="Search articles">
        </div>
        <select class="select toolbar-select-wrap" data-cat aria-label="Topic">
          <option value="">All topics</option>
          ${CATEGORIES.map((c) => `<option>${h(c)}</option>`).join('')}
        </select>
        <span class="toolbar-count" data-count></span>
      </div>
      <div data-list>${skeletonRows()}</div>`;
    $$('[data-f]', el).forEach((b) => { b.onclick = () => { location.hash = `articles/${b.dataset.f}`; }; });
    const { data } = await api('GET', 'posts');
    const list = $('[data-list]', el);

    const draw = () => {
      for (const [f] of FILTERS) { const pill = $(`[data-c="${f}"]`, el); if (pill) pill.textContent = data.filter(MATCH[f]).length; }
      const q = $('[data-search]', el).value.trim().toLowerCase();
      const cat = $('[data-cat]', el).value;
      const rows = data.filter((p) => MATCH[filter](p) && (!cat || p.category === cat) && (!q || `${p.title} ${p.excerpt} ${p.topic || ''}`.toLowerCase().includes(q)));
      $('[data-count]', el).textContent = q || cat || filter !== 'all' ? `${rows.length} of ${data.length}` : window.Admin.plural(data.length, 'article');
      if (!rows.length) {
        list.innerHTML = !data.length
          ? emptyState('articles', 'No articles yet', 'Articles help people find you on Google. Let the AI write a first draft, or write one yourself.', `<a class="btn btn-primary" href="#writer">${icon('writer')}Write with AI</a><a class="btn" href="#article/new">${icon('plus')}Write it myself</a>`)
          : filter === 'review' && !q && !cat
            ? emptyState('checkCircle', 'Nothing waiting for review', 'Every article has been checked. New AI drafts will show up here.', '<a class="btn" href="#articles">See all articles</a>')
            : filter === 'draft' && !q && !cat
              ? emptyState('articles', 'No drafts', 'Drafts are articles that are not on the website yet.', `<a class="btn btn-primary" href="#writer">${icon('writer')}Write with AI</a>`)
              : emptyState('search', 'No articles match', 'Try another word, or pick a different tab.', '<a class="btn" href="#articles">Show all articles</a>');
        return;
      }
      list.innerHTML = `<div class="table-card"><table class="table stack cards">
        <thead><tr><th style="width:72px"><span class="visually-hidden">Picture</span></th><th>Article</th><th>Status</th><th>Date</th><th style="text-align:right"><span class="visually-hidden">Actions</span></th></tr></thead>
        <tbody>${rows.map((p) => `
          <tr class="is-link" data-id="${h(p.id)}">
            <td class="cell-thumb"><img class="article-cover-thumb" src="${h(p.cover_image || '/images/blog-featured-icu.webp')}" alt="" loading="lazy"></td>
            <td class="title-cell">
              <a class="row-title" href="#article/${encodeURIComponent(p.id)}">${h(p.title || 'Untitled')}</a>
              <small>${h(p.category || '')}${p.is_featured ? ' · Featured' : ''}${p.ai_generated ? ' · Written by AI' : ''}</small>
            </td>
            <td class="cell-status"><div class="row-tight">${statusBadge(p)}</div></td>
            <td class="cell-date small muted">${h(fmtDate(p.published_at || p.created_at))}</td>
            <td class="actions">
              <button class="btn btn-sm" data-act="${p.status === 'published' ? 'unpublish' : 'publish'}">${p.status === 'published' ? 'Unpublish' : 'Publish'}</button>
              ${p.status === 'published' ? `<a class="btn btn-sm btn-ghost btn-icon" href="/blog/${encodeURIComponent(p.slug)}" target="_blank" rel="noopener" aria-label="See it on the website">${icon('external')}</a>` : ''}
              <button class="btn btn-sm btn-ghost btn-icon btn-danger" data-act="delete" aria-label="Delete ${h(p.title)}">${icon('trash')}</button>
            </td>
          </tr>`).join('')}</tbody></table></div>`;
    };
    draw();
    $('[data-search]', el).addEventListener('input', debounce(draw, 150));
    $('[data-cat]', el).addEventListener('change', draw);
    list.addEventListener('click', async (e) => {
      const tr = e.target.closest('tr[data-id]');
      if (!tr) return;
      const act = e.target.closest('[data-act]')?.dataset.act;
      if (e.target.closest('a')) return;
      const p = data.find((x) => x.id === tr.dataset.id);
      if (!act) { location.hash = `article/${encodeURIComponent(p.id)}`; return; }
      try {
        if (act === 'delete') {
          if (!(await confirmBox('Delete this article?', `<strong>${h(p.title)}</strong> will be removed for good.${p.status === 'published' ? ' Anyone with the link will see "page not found". To take it off the website but keep it, use Unpublish instead.' : ''}`, { ok: 'Delete', danger: true }))) return;
          data.splice(data.indexOf(p), 1); draw();
          await api('DELETE', `posts?id=${encodeURIComponent(p.id)}`);
          toast('Article deleted');
        } else {
          const status = act === 'publish' ? 'published' : 'draft';
          if (status === 'published' && p.has_markers && !(await confirmBox('Some sentences still need checking', 'This article still has yellow markers where the AI was unsure. Visitors never see the markers, but the sentences behind them may not be backed up. Publish anyway?', { ok: 'Publish anyway' }))) return;
          p.status = status; if (status === 'published' && !p.published_at) p.published_at = new Date().toISOString(); draw();
          await api('PATCH', 'posts', { id: p.id, status });
          toast(status === 'published' ? (p.ai_generated && !p.reviewed_at ? 'Published. Google will see it once you mark it as reviewed.' : 'Published. Live in about 5 minutes.') : 'Taken off the website. It is now a draft.');
        }
        window.Admin.invalidatePalette();
      } catch (err) { toastError(err); views.articles(el, [filter]); }
    });
  };

  /* ================= Article editor ================= */
  function richEditor(host, html) {
    host.innerHTML = `<div class="rte">
      <div class="rte-bar" role="toolbar" aria-label="Formatting">
        <div class="rte-btn-group">
          <button type="button" data-cmd="formatBlock" data-arg="h2" title="Section heading (H2)">H2</button>
          <button type="button" data-cmd="formatBlock" data-arg="h3" title="Subsection (H3)">H3</button>
          <button type="button" data-cmd="formatBlock" data-arg="p" title="Body paragraph">¶</button>
        </div>
        <span class="sep"></span>
        <div class="rte-btn-group">
          <button type="button" data-cmd="bold" title="Bold (Ctrl+B)"><b>B</b></button>
          <button type="button" data-cmd="italic" title="Italic (Ctrl+I)"><i>I</i></button>
          <button type="button" data-cmd="strikeThrough" title="Strikethrough"><s>S</s></button>
        </div>
        <span class="sep"></span>
        <div class="rte-btn-group">
          <button type="button" data-cmd="insertUnorderedList" title="Bulleted list">${icon('listBullet') || '•'}</button>
          <button type="button" data-cmd="insertOrderedList" title="Numbered list">${icon('listNumber') || '1.'}</button>
          <button type="button" data-cmd="formatBlock" data-arg="blockquote" title="Quote / Callout">${icon('quote') || '“ ”'}</button>
        </div>
        <span class="sep"></span>
        <div class="rte-btn-group">
          <button type="button" data-cmd="callout" title="Insert clinical takeaway note">${icon('callout') || '💡'} Note</button>
          <button type="button" data-cmd="table" title="Insert comparison table">${icon('table') || 'Table'}</button>
          <button type="button" data-cmd="divider" title="Insert horizontal divider line">—</button>
        </div>
        <span class="sep"></span>
        <div class="rte-btn-group">
          <button type="button" data-cmd="link" title="Link (Ctrl+K)">${icon('link')}</button>
          <button type="button" data-cmd="image" title="Insert picture">${icon('image')}</button>
          <button type="button" data-cmd="removeFormat" title="Clear formatting">Tx</button>
        </div>
        <span class="spacer"></span>
        <button type="button" data-cmd="markers" title="Jump to the next yellow marker (a sentence the AI was unsure about)" aria-label="Next yellow marker">${icon('alert')}<span data-marker-count></span></button>
        <button type="button" data-cmd="source" class="desktop-only" title="Edit as code (for your web developer)">&lt;/&gt;</button>
      </div>
      <div class="rte-body" contenteditable="true" data-placeholder="Start writing here…" spellcheck="true"></div>
      <textarea class="rte-source" hidden spellcheck="false" aria-label="HTML source"></textarea>
      <div class="rte-footer">
        <span class="rte-footer-item" data-word-count>0 words</span>
        <span>·</span>
        <span class="rte-footer-item" data-read-calc>~1 min read</span>
        <span>·</span>
        <span class="rte-footer-item" data-marker-status>No yellow markers</span>
        <span class="rte-footer-hints desktop-only">Ctrl+B Bold · Ctrl+I Italic · Ctrl+K Link · Ctrl+S Save</span>
      </div>
    </div>`;
    const body = $('.rte-body', host);
    const source = $('.rte-source', host);
    const onChange = [];
    const highlight = () => {
      // Wrap markers so they stand out; <mark> is stripped by the server sanitizer on save
      const walker = document.createTreeWalker(body, NodeFilter.SHOW_TEXT);
      const hits = [];
      for (let n = walker.nextNode(); n; n = walker.nextNode()) if (MARKER_RE.test(n.nodeValue) && !n.parentElement.closest('mark')) hits.push(n);
      MARKER_RE.lastIndex = 0;
      for (const n of hits) {
        const frag = document.createElement('span');
        frag.innerHTML = h(n.nodeValue).replace(MARKER_RE, '<mark class="marker">$&</mark>');
        n.replaceWith(...frag.childNodes);
      }
      const count = $$('mark.marker', body).length;
      $('[data-marker-count]', host).textContent = count ? ` ${count}` : '';
      updateStats();
    };
    const updateStats = () => {
      const text = (source.hidden ? body.innerText : source.value) || '';
      const words = text.trim().split(/\s+/).filter(Boolean).length;
      const mins = Math.max(1, Math.round(words / 200));
      $('[data-word-count]', host).textContent = `${words} word${words === 1 ? '' : 's'}`;
      $('[data-read-calc]', host).textContent = `~${mins} min read`;
      const count = $$('mark.marker', body).length;
      $('[data-marker-status]', host).textContent = count ? `${count} yellow marker${count === 1 ? '' : 's'} to check` : 'No yellow markers';
    };
    const updateToolbarStates = () => {
      try {
        $$('[data-cmd="bold"]', host).forEach(b => b.classList.toggle('is-active', document.queryCommandState('bold')));
        $$('[data-cmd="italic"]', host).forEach(b => b.classList.toggle('is-active', document.queryCommandState('italic')));
        $$('[data-cmd="strikeThrough"]', host).forEach(b => b.classList.toggle('is-active', document.queryCommandState('strikeThrough')));
        $$('[data-cmd="insertUnorderedList"]', host).forEach(b => b.classList.toggle('is-active', document.queryCommandState('insertUnorderedList')));
        $$('[data-cmd="insertOrderedList"]', host).forEach(b => b.classList.toggle('is-active', document.queryCommandState('insertOrderedList')));
        const sel = window.getSelection();
        if (sel && sel.anchorNode) {
          const node = sel.anchorNode.nodeType === 1 ? sel.anchorNode : sel.anchorNode.parentElement;
          const tag = node ? node.closest('h2, h3, blockquote, p')?.tagName?.toLowerCase() : '';
          $$('[data-cmd="formatBlock"]', host).forEach(b => b.classList.toggle('is-active', b.dataset.arg === tag));
        }
      } catch {}
    };
    const getHtml = () => (source.hidden ? body.innerHTML : source.value).replace(/<\/?mark[^>]*>/g, '');
    const setHtml = (v) => { body.innerHTML = v || ''; source.value = v || ''; highlight(); };
    setHtml(html);
    const changed = () => { onChange.forEach((fn) => fn()); updateStats(); };
    body.addEventListener('input', changed);
    source.addEventListener('input', changed);
    body.addEventListener('blur', highlight);
    body.addEventListener('keyup', updateToolbarStates);
    body.addEventListener('mouseup', updateToolbarStates);
    body.addEventListener('paste', (e) => {
      // Paste as clean HTML: drop styles and classes; the server sanitizes again on save
      const html = e.clipboardData.getData('text/html');
      if (!html) return;
      e.preventDefault();
      const clean = html.replace(/<(style|script|meta|link)[\s\S]*?(<\/\1>|>)/gi, '').replace(/\s(style|class|id|data-[\w-]+)="[^"]*"/gi, '').replace(/<\/?(span|font|o:p|div)[^>]*>/gi, '');
      document.execCommand('insertHTML', false, clean);
    });
    body.addEventListener('keydown', (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') { e.preventDefault(); e.stopPropagation(); run('link'); }
    });
    let markerIndex = 0;
    async function run(cmd, arg) {
      if (cmd === 'source') {
        if (source.hidden) { source.value = getHtml(); source.hidden = false; body.hidden = true; source.focus(); }
        else { setHtml(source.value); source.hidden = true; body.hidden = false; body.focus(); }
        return;
      }
      if (cmd === 'markers') {
        const marks = $$('mark.marker', body);
        if (!marks.length) { toast('No yellow markers left. Nice work.'); return; }
        const m = marks[markerIndex++ % marks.length];
        m.scrollIntoView({ block: 'center', behavior: 'smooth' });
        const r = document.createRange(); r.selectNodeContents(m); const s = getSelection(); s.removeAllRanges(); s.addRange(r);
        return;
      }
      body.focus();
      if (cmd === 'link') {
        const url = prompt('Link address (https://… or /page.html). Leave empty to remove the link.');
        if (url === null) return;
        document.execCommand(url ? 'createLink' : 'unlink', false, url);
      } else if (cmd === 'image') {
        const sel = getSelection(); const range = sel.rangeCount ? sel.getRangeAt(0) : null;
        const url = await pickMedia('Insert a picture');
        if (!url) return;
        const alt = prompt('Describe the picture for screen readers and Google (alt text):', '') || '';
        body.focus(); if (range) { sel.removeAllRanges(); sel.addRange(range); }
        document.execCommand('insertHTML', false, `<img src="${h(url)}" alt="${h(alt)}">`);
      } else if (cmd === 'callout') {
        document.execCommand('insertHTML', false, '<blockquote><strong>Clinical takeaway:</strong> Enter key clinical observation, protocol or dosage recommendation.</blockquote><p><br></p>');
      } else if (cmd === 'divider') {
        document.execCommand('insertHTML', false, '<hr><p><br></p>');
      } else if (cmd === 'table') {
        document.execCommand('insertHTML', false, '<table><thead><tr><th>Feature / Spec</th><th>Recommended Standard</th><th>Clinical Benefit</th></tr></thead><tbody><tr><td>Pressure Range</td><td>4 – 20 cmH2O</td><td>Auto-titrating algorithm for patient comfort</td></tr><tr><td>Noise Level</td><td>&lt; 28 dBA</td><td>Ultra-quiet bedside operation</td></tr></tbody></table><p><br></p>');
      } else document.execCommand(cmd, false, arg ? `<${arg}>` : undefined);
      changed();
      updateToolbarStates();
    }
    $('.rte-bar', host).addEventListener('mousedown', (e) => { if (e.target.closest('button')) e.preventDefault(); });
    $('.rte-bar', host).addEventListener('click', (e) => { const b = e.target.closest('[data-cmd]'); if (b) run(b.dataset.cmd, b.dataset.arg); });
    return { getHtml, setHtml, highlight, onChange: (fn) => onChange.push(fn), countMarkers: () => (getHtml().match(MARKER_RE) || []).length };
  }

  views.article = async (el, [id = 'new'] = []) => {
    el.classList.add('view-wide');
    const isNew = id === 'new';
    setHeader(`<span class="crumb">Articles /</span> ${isNew ? 'New article' : 'Edit'}`);
    el.innerHTML = `<div class="editor"><div>${skeletonRows(3)}</div><div>${skeletonRows(4)}</div></div>`;
    let post = isNew ? { title: '', slug: '', excerpt: '', content: '', status: 'draft', category: 'Product Guides', author: 'Medico Team', faq: [], gallery_images: [], is_featured: false } : (await api('GET', `posts?id=${encodeURIComponent(id)}`)).data;
    if (!el.isConnected) return;
    const checks = post.checks || null;
    let dirty = false;
    window.Admin.setLeaveGuard(() => !dirty);

    let viewMode = localStorage.getItem('medico_editor_mode') || 'split';
    if (window.innerWidth < 1180 && viewMode === 'split') viewMode = 'edit';

    const renderHeader = () => {
      setHeader(`<span class="crumb">Articles /</span> ${isNew ? 'New article' : h(post.title || 'Untitled')}`, `
        <div class="view-mode-switcher desktop-only">
          <button type="button" class="view-mode-btn ${viewMode === 'edit' ? 'is-active' : ''}" data-mode="edit" title="Focused editing view">${icon('edit')}<span>Edit</span></button>
          <button type="button" class="view-mode-btn ${viewMode === 'split' ? 'is-active' : ''}" data-mode="split" title="Edit with a live preview beside it">${icon('split')}<span>Side by side</span></button>
          <button type="button" class="view-mode-btn ${viewMode === 'preview' ? 'is-active' : ''}" data-mode="preview" title="Full live preview">${icon('eye')}<span>Preview</span></button>
        </div>
        <span class="muted small desktop-only" data-saved style="margin-left:6px">${isNew ? '' : `Saved ${h(ago(post.updated_at))}`}</span>
        <button class="btn btn-primary" data-save title="Save article (Ctrl+S)">${icon('check')}<span>Save</span></button>`);
      $$('.view-mode-btn').forEach((btn) => {
        btn.onclick = () => {
          viewMode = btn.dataset.mode;
          localStorage.setItem('medico_editor_mode', viewMode);
          applyMode();
          renderHeader();
        };
      });
      $('[data-save]').onclick = (e) => save(e.currentTarget);
    };

    el.innerHTML = `<div class="editor mode-${viewMode}" data-editor-root>
      <div class="editor-main-col">
        <div class="editor-split-tabs">
          <button type="button" class="is-active" data-pane-btn="content">Article text</button>
          <button type="button" data-pane-btn="settings">Publishing, picture and Google</button>
        </div>

        <div data-pane="content">
          <input class="input input-lg" data-f="title" placeholder="Article title" value="${h(post.title)}" aria-label="Title">
          <textarea class="textarea" data-f="excerpt" rows="2" placeholder="Short summary: one or two sentences on what the reader will learn" style="min-height:0;margin:8px 0 16px" aria-label="Subheading">${h(post.excerpt || '')}</textarea>
          <div data-rte></div>
          <div class="card" style="margin-top:18px">
            <div class="card-head">
              <h3>Questions and answers</h3>
              <span class="muted small desktop-only">Shown at the end of the article and to Google</span>
              <span class="spacer"></span>
              <button class="btn btn-sm" data-faq-add>${icon('plus')}Add question</button>
            </div>
            <div class="card-body" data-faq></div>
          </div>
        </div>

        <div data-pane="settings" style="display:none">
          <div data-split-settings-mount style="display:flex;flex-direction:column;gap:14px"></div>
        </div>
      </div>

      <aside class="editor-side" data-editor-side>
        <section class="card"><div class="card-head"><h3>Publish</h3><span class="spacer"></span>${isNew ? '' : statusBadge(post)}</div><div class="card-body">
          <div class="field"><label for="a-status">Status</label><select class="select" id="a-status" data-f="status"><option value="draft">Draft (only you can see it)</option><option value="published">Published (on the website)</option></select></div>
          <div class="field"><label for="a-date">Publish date and time</label><input class="input" id="a-date" type="datetime-local" data-f="published_at" value="${h(toLocalInput(post.published_at))}"><span class="hint">Pick a future time to publish it later. Leave empty to publish now.</span></div>
          <label class="switch" style="margin-bottom:10px"><input type="checkbox" data-f="is_featured" ${post.is_featured ? 'checked' : ''}> Show at the top of the blog page</label>
          <label class="switch"><input type="checkbox" data-f="reviewed" ${!post.ai_generated || post.reviewed_at ? 'checked' : ''}> Reviewed by a person</label>
          <p class="hint" style="margin:6px 0 0">${post.ai_generated ? 'Written by AI. Google only sees it after you switch this on.' : 'Articles you write yourself count as reviewed.'}</p>
          <div class="row" style="margin-top:14px">
            ${!isNew && post.status === 'published' ? `<a class="btn btn-sm" href="/blog/${encodeURIComponent(post.slug)}" target="_blank" rel="noopener">${icon('external')}View live</a>` : ''}
            ${!isNew && post.blog_type ? `<a class="btn btn-sm" href="#writer/post/${encodeURIComponent(post.id)}">${icon('refresh')}Regenerate</a>` : ''}
            ${!isNew ? `<button class="btn btn-sm btn-ghost btn-danger" data-delete>${icon('trash')}Delete</button>` : ''}
          </div>
        </div></section>
        <section class="card"><div class="card-head"><h3>Before publishing</h3><span class="spacer"></span><span data-check-badge></span></div><div class="card-body"><ul class="checklist" data-checklist></ul>${checks ? `<details style="margin-top:10px"><summary class="small" style="cursor:pointer">What the AI writer noted</summary><div class="small" style="margin-top:8px">
          ${(checks.typeChecks || []).length ? `<strong>Checks for this kind of article</strong><ul>${checks.typeChecks.map((c) => `<li>${h(c)}</li>`).join('')}</ul>` : ''}
          <strong>Changes from the plan</strong><p>${h(checks.outlineDeviations || 'None')}</p>
          ${(checks.untraceableNumbers || []).length ? `<strong>Numbers the AI could not trace to your details</strong><ul>${checks.untraceableNumbers.map((c) => `<li>${h(c)}</li>`).join('')}</ul>` : ''}
          ${(checks.guessedInputs || []).length ? `<strong>Details the AI guessed</strong><p>${h(checks.guessedInputs.join(', '))}</p>` : ''}
        </div></details>` : ''}</div></section>
        <section class="card"><div class="card-head"><h3>Cover picture</h3></div><div class="card-body">
          <div class="cover-box" data-cover></div>
          <div class="row" style="margin-top:10px"><button class="btn btn-sm" data-cover-find>${icon('search')}Find a free photo</button><button class="btn btn-sm" data-cover-upload>${icon('upload')}Upload</button><button class="btn btn-sm btn-ghost" data-cover-library>My pictures</button></div>
          <div class="field" style="margin-top:12px"><label for="a-credit">Photo credit</label><input class="input" id="a-credit" data-f="credit_text" value="${h(post.cover_credit?.text || '')}" placeholder="Photo: Name / Source, licence"><input class="input" data-f="credit_url" value="${h(post.cover_credit?.url || '')}" placeholder="https://link-to-the-photo-page" aria-label="Credit link" style="margin-top:6px"></div>
        </div></section>
        <section class="card"><div class="card-head"><h3>How it looks on Google</h3></div><div class="card-body">
          <div class="serp" data-serp></div>
          <div class="field" style="margin-top:12px"><label for="a-slug">Web address <span class="counter" data-c="slug"></span></label><input class="input mono" id="a-slug" data-f="slug" value="${h(post.slug || '')}" placeholder="made-from-the-title">${post.status === 'published' ? '<span class="hint">Changing this on a live article breaks links people already shared.</span>' : '<span class="hint">Made from the title automatically. Only change it if you need to.</span>'}</div>
          <div class="field"><label for="a-mt">Google title <span class="counter" data-c="meta_title"></span></label><input class="input" id="a-mt" data-f="meta_title" value="${h(post.meta_title || '')}" placeholder="Leave empty to use the article title"></div>
          <div class="field"><label for="a-md">Google description <span class="counter" data-c="meta_description"></span></label><textarea class="textarea" id="a-md" data-f="meta_description" rows="3" style="min-height:0" placeholder="Leave empty to use the short summary">${h(post.meta_description || '')}</textarea></div>
        </div></section>
        <section class="card"><div class="card-head"><h3>Details</h3></div><div class="card-body">
          <div class="field"><label for="a-cat">Topic</label><input class="input" id="a-cat" data-f="category" list="a-cats" value="${h(post.category || '')}"><datalist id="a-cats">${CATEGORIES.map((c) => `<option value="${h(c)}">`).join('')}</datalist></div>
          <div class="field"><label for="a-author">Author</label><input class="input" id="a-author" data-f="author" value="${h(post.author || 'Medico Team')}"></div>
          <div class="field"><label for="a-rt">Reading time</label><input class="input" id="a-rt" data-f="read_time" value="${h(post.read_time || '')}" placeholder="Worked out automatically"></div>
          <div class="field"><label>Gallery pictures</label><div class="row" data-gallery></div><button class="btn btn-sm" data-gallery-add style="margin-top:8px">${icon('plus')}Add picture</button></div>
          ${post.topic ? `<p class="small muted">Written about: ${h(post.topic)}</p>` : ''}
          ${(post.source_urls || []).length ? `<p class="small muted">Sources: ${post.source_urls.map((s) => `<a href="${h(s.url)}" target="_blank" rel="noopener">${h(s.source || s.title)}</a>`).join(', ')}</p>` : ''}
          ${post.review_notes ? `<p class="small muted">${h(post.review_notes)}</p>` : ''}
        </div></section>
      </aside>

      <!-- Live Preview Studio Panel -->
      <div class="live-preview-panel">
        <div class="preview-panel-header">
          <div class="preview-status-indicator" data-preview-status>
            <span class="sync-dot"></span>
            <span>Live preview</span>
          </div>
          <div class="preview-viewport-toggle">
            <button type="button" class="preview-viewport-btn" data-vp="desktop" title="Computer view">${icon('monitor')} Computer</button>
            <button type="button" class="preview-viewport-btn is-active" data-vp="mobile" title="Phone view">${icon('smartphone')} Phone</button>
          </div>
          <button type="button" class="btn btn-sm btn-ghost btn-icon" data-preview-reload title="Reload live preview">${icon('refresh')}</button>
          <button type="button" class="btn btn-sm btn-ghost btn-icon" data-preview-external title="Open full preview in new tab">${icon('external')}</button>
        </div>
        <div class="preview-frame-container">
          <div class="device-stage is-iphone" data-frame-wrap>
            <!-- EldoraUI MacBook Pro Device Frame -->
            <div class="mockup-macbook">
              <div class="macbook-lid">
                <div class="macbook-camera-notch" aria-hidden="true">
                  <span class="macbook-lens"></span>
                  <span class="macbook-sensor"></span>
                </div>
                <div class="macbook-screen"></div>
              </div>
              <div class="macbook-base" aria-hidden="true">
                <div class="macbook-thumb-notch"></div>
              </div>
              <div class="macbook-shadow" aria-hidden="true"></div>
            </div>

            <!-- MagicUI iPhone 15 Pro Device Frame -->
            <div class="mockup-iphone">
              <div class="iphone-chassis">
                <span class="iphone-btn-silent" aria-hidden="true"></span>
                <span class="iphone-btn-vol-up" aria-hidden="true"></span>
                <span class="iphone-btn-vol-down" aria-hidden="true"></span>
                <span class="iphone-btn-power" aria-hidden="true"></span>
                <div class="iphone-screen">
                  <div class="iphone-dynamic-island" aria-hidden="true">
                    <span class="island-camera"></span>
                    <span class="island-sensor"></span>
                  </div>
                  <div class="iphone-screen-viewport" data-iphone-screen>
                    <iframe class="preview-frame" title="Live Article Preview" sandbox="allow-scripts allow-same-origin"></iframe>
                  </div>
                  <div class="iphone-home-indicator" aria-hidden="true"></div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>`;

    renderHeader();

    const f = (k) => $(`[data-f="${k}"]`, el);
    f('status').value = post.status;
    const editor = richEditor($('[data-rte]', el), post.content);
    let cover = { url: post.cover_image || '' };
    let gallery = [...(post.gallery_images || [])];
    let faq = [...(post.faq || [])];

    const drawCover = () => { $('[data-cover]', el).innerHTML = cover.url ? `<img src="${h(cover.url)}" alt="">` : `<div class="cover-empty">${icon('image')}</div>`; };
    const drawGallery = () => { $('[data-gallery]', el).innerHTML = gallery.map((g, i) => `<span style="position:relative"><img class="thumb" src="${h(g)}" alt=""><button class="btn btn-sm btn-icon btn-ghost" data-gal-del="${i}" aria-label="Remove" style="position:absolute;top:-8px;right:-10px;background:#fff">${icon('x')}</button></span>`).join(''); };
    const drawFaq = () => {
      $('[data-faq]', el).innerHTML = faq.length ? faq.map((q, i) => `<div class="field" data-faq-i="${i}" style="border-bottom:1px dashed var(--line);padding-bottom:12px"><div class="row"><input class="input" data-q value="${h(q.q)}" placeholder="Question" style="flex:1"><button class="btn btn-sm btn-ghost btn-icon btn-danger" data-faq-del aria-label="Remove">${icon('trash')}</button></div><textarea class="textarea" data-a rows="2" placeholder="Answer in 2 to 4 plain sentences">${h(q.a)}</textarea></div>`).join('')
        : '<p class="muted small" style="margin:0">No questions yet. Questions added here appear at the end of the article (unless the body already contains them) and as FAQ structured data.</p>';
    };
    const counters = { slug: 80, meta_title: 60, meta_description: 155 };
    const drawMeta = () => {
      for (const [k, max] of Object.entries(counters)) { const n = f(k).value.length; const c = $(`[data-c="${k}"]`, el); if (c) { c.textContent = `${n}/${max}`; c.classList.toggle('is-over', n > max); } }
      const title = f('meta_title').value || f('title').value || 'Article title';
      const desc = f('meta_description').value || f('excerpt').value || 'Your short summary appears here.';
      const serp = $('[data-serp]', el);
      if (serp) serp.innerHTML = `<div class="serp-url">${h(location.host)} › blog › ${h(f('slug').value || 'new-article')}</div><div class="serp-title">${h(title.slice(0, 65))} | Medico Insights</div><div class="serp-desc">${h(desc.slice(0, 160))}</div>`;
    };
    const drawChecklist = () => {
      const html = editor.getHtml();
      const text = html.replace(/<[^>]+>/g, ' ');
      const words = text.split(/\s+/).filter(Boolean).length;
      const needs = (html.match(/\[NEEDS SOURCE\]/g) || []).length;
      const flags = (html.match(/\[FLAG/g) || []).length;
      const unverified = (text.match(/\bUnverified\b/g) || []).length;
      const dashes = (html.match(/—/g) || []).length;
      const colonHeads = (html.match(/<h[23]>[^<]*:[^<]*<\/h[23]>/g) || []).length;
      const banned = ['furthermore', 'moreover', 'additionally', 'nevertheless', 'consequently', 'thus', 'hence', 'in order to', 'when it comes to', "it's important to note", "in today's world", 'at the end of the day', 'in conclusion'].filter((w) => new RegExp(`\\b${w.replace(/'/g, "['’]")}\\b`, 'i').test(text));
      const items = [
        [needs === 0, needs ? `${needs} sentence${needs > 1 ? 's' : ''} marked [NEEDS SOURCE]: add where the fact comes from, or soften it` : 'No [NEEDS SOURCE] markers'],
        [flags === 0, flags ? `${flags} [FLAG] marker${flags > 1 ? 's' : ''}: fill in the missing detail` : 'No [FLAG] markers'],
        [unverified === 0, unverified ? `${unverified} "Unverified" value${unverified > 1 ? 's' : ''} in the text or tables` : 'No "Unverified" values'],
        [!(checks?.untraceableNumbers || []).length, (checks?.untraceableNumbers || []).length ? `${checks.untraceableNumbers.length} number(s) the AI could not trace to your details (see notes below)` : 'Every number comes from your details'],
        [banned.length === 0, banned.length ? `Stiff words to replace: ${banned.join(', ')}` : 'No stiff filler words'],
        [dashes === 0, dashes ? `${dashes} long dash${dashes > 1 ? 'es' : ''} (—) to replace with a comma or full stop` : 'No long dashes'],
        [colonHeads === 0, colonHeads ? `${colonHeads} heading${colonHeads > 1 ? 's' : ''} with a colon (:) to reword` : 'Headings read naturally'],
        [Boolean(f('meta_description').value || f('excerpt').value), 'Short summary written'],
        [Boolean(cover.url), 'Cover picture chosen'],
        [!post.ai_generated || f('reviewed').checked, 'Reviewed by a person'],
      ];
      const open = items.filter(([ok]) => !ok).length;
      const cl = $('[data-checklist]', el);
      if (cl) cl.innerHTML = items.map(([ok, label]) => `<li class="${ok ? 'is-done' : 'is-warn'}"><span class="state">${ok ? icon('check') : '!'}</span><span>${h(label)}</span></li>`).join('') + `<li><span class="state"></span><span class="muted">${words} words</span></li>`;
      const badge = $('[data-check-badge]', el);
      if (badge) badge.innerHTML = open ? `<span class="chip chip-review">${open} to check</span>` : '<span class="chip chip-solid">Ready</span>';
      return { needs, flags, unverified, open };
    };
    drawCover(); drawGallery(); drawFaq(); drawMeta(); drawChecklist();

    const markDirty = () => { dirty = true; $('[data-saved]') && ($('[data-saved]').textContent = 'Unsaved changes'); };
    el.addEventListener('input', (e) => {
      if (e.target.closest('[data-faq-i]')) { const box = e.target.closest('[data-faq-i]'); faq[Number(box.dataset.faqI)] = { q: $('[data-q]', box).value, a: $('[data-a]', box).value }; }
      markDirty(); drawMeta(); refreshPreview();
    });
    el.addEventListener('change', () => { markDirty(); drawChecklist(); refreshPreview(); });
    editor.onChange(debounce(() => { drawChecklist(); refreshPreview(); }, 400));
    editor.onChange(markDirty);

    $('[data-faq-add]', el).onclick = () => { faq.push({ q: '', a: '' }); drawFaq(); markDirty(); $$('[data-q]', el).pop().focus(); };
    $('[data-faq]', el).addEventListener('click', (e) => { if (e.target.closest('[data-faq-del]')) { faq.splice(Number(e.target.closest('[data-faq-i]').dataset.faqI), 1); drawFaq(); markDirty(); refreshPreview(); } });
    $('[data-gallery-add]', el).onclick = async () => { const url = await pickMedia('Add to gallery'); if (url) { gallery.push(url); drawGallery(); markDirty(); } };
    $('[data-gallery]', el).addEventListener('click', (e) => { const b = e.target.closest('[data-gal-del]'); if (b) { gallery.splice(Number(b.dataset.galDel), 1); drawGallery(); markDirty(); } });
    const setCover = (url, credit) => { cover = { url }; f('credit_text').value = credit?.text || ''; f('credit_url').value = credit?.url || ''; drawCover(); drawChecklist(); markDirty(); refreshPreview(); };
    $('[data-cover-upload]', el).onclick = async (e) => { const files = await pickFiles(); if (!files.length) return; await busy(e.currentTarget, async () => { try { setCover((await uploadFile(files[0])).url, null); toast('Cover uploaded'); } catch (err) { toastError(err); } }); };
    $('[data-cover-library]', el).onclick = async () => { const url = await pickMedia('Choose a cover'); if (url) setCover(url, null); };
    $('[data-cover-find]', el).onclick = () => coverFinder(f('title').value || post.topic || '', setCover);

    const collect = () => ({
      id: post.id, title: f('title').value.trim(), excerpt: f('excerpt').value.trim(), content: editor.getHtml(), slug: f('slug').value.trim(),
      status: f('status').value, published_at: f('published_at').value ? new Date(f('published_at').value).toISOString() : '',
      is_featured: f('is_featured').checked, reviewed: f('reviewed').checked, category: f('category').value.trim(), author: f('author').value.trim(),
      read_time: f('read_time').value.trim(), meta_title: f('meta_title').value.trim(), meta_description: f('meta_description').value.trim(),
      cover_image: cover.url, cover_credit: f('credit_text').value.trim() ? { text: f('credit_text').value.trim(), url: f('credit_url').value.trim() } : null,
      gallery_images: gallery, faq: faq.filter((q) => q.q.trim() && q.a.trim()),
    });

    async function save(btn) {
      const data = collect();
      if (!data.title) { toast('Please give the article a title.', { error: true }); f('title').focus(); return; }
      const c = drawChecklist();
      if (data.status === 'published' && post.status !== 'published' && (c.needs || c.flags) &&
          !(await confirmBox('Some sentences still need checking', `${c.needs + c.flags} yellow marker(s) remain. Visitors never see the markers, but the sentences behind them may not be backed up. Publish anyway?`, { ok: 'Publish anyway' }))) return;
      await busy(btn, async () => {
        try {
          const r = await api(isNew ? 'POST' : 'PUT', 'posts', data);
          dirty = false;
          window.Admin.invalidatePalette();
          toast(data.status === 'published' ? (post.ai_generated && !data.reviewed ? 'Saved and published. Google will see it once you mark it as reviewed.' : 'Saved and published. Live in about 5 minutes.') : 'Draft saved. Only you can see it.');
          if (isNew) { location.hash = `article/${encodeURIComponent(r.data.id)}`; return; }
          post = { ...post, ...data, slug: r.data.slug, updated_at: new Date().toISOString() };
          f('slug').value = r.data.slug;
          $('[data-saved]') && ($('[data-saved]').textContent = 'Saved just now');
        } catch (err) { toastError(err); }
      });
    }
    el.addEventListener('keydown', (e) => { if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 's') { e.preventDefault(); save($('[data-save]')); } });
    $('[data-delete]', el)?.addEventListener('click', async () => {
      if (!(await confirmBox('Delete this article?', `<strong>${h(post.title)}</strong> will be removed for good.`, { ok: 'Delete', danger: true }))) return;
      await api('DELETE', `posts?id=${encodeURIComponent(post.id)}`); dirty = false; toast('Article deleted'); location.hash = 'articles';
    });

    // Split mode tabs & pane switching
    const applyMode = () => {
      const root = $('[data-editor-root]', el);
      if (!root) return;
      root.className = `editor mode-${viewMode}`;
      const side = $('[data-editor-side]', el);
      const mount = $('[data-split-settings-mount]', el);
      if (viewMode === 'split') {
        const activePane = $('[data-pane-btn].is-active', el)?.dataset.paneBtn || 'content';
        $('[data-pane="content"]', el).style.display = activePane === 'content' ? '' : 'none';
        $('[data-pane="settings"]', el).style.display = activePane === 'settings' ? '' : 'none';
        if (activePane === 'settings' && side && mount && !mount.children.length) {
          while (side.firstChild) mount.appendChild(side.firstChild);
        }
      } else {
        if (mount && side && mount.children.length) {
          while (mount.firstChild) side.appendChild(mount.firstChild);
        }
        $('[data-pane="content"]', el).style.display = '';
        $('[data-pane="settings"]', el).style.display = 'none';
      }
      refreshPreview();
    };

    $$('[data-pane-btn]', el).forEach((btn) => {
      btn.onclick = () => {
        $$('[data-pane-btn]', el).forEach((b) => b.classList.remove('is-active'));
        btn.classList.add('is-active');
        applyMode();
      };
    });

    // Live preview refresh
    const refreshPreview = debounce(async () => {
      const frame = $('iframe.preview-frame', el);
      if (!frame || viewMode === 'edit') return;
      const indicator = $('[data-preview-status]', el);
      if (indicator) indicator.classList.add('is-syncing');
      try {
        const payload = collect();
        const res = await fetch('/api/admin/preview', {
          method: 'POST',
          credentials: 'same-origin',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        });
        const y = frame.contentWindow?.scrollY || 0;
        frame.srcdoc = await res.text();
        frame.onload = () => {
          try { frame.contentWindow?.scrollTo(0, y); } catch {}
        };
      } catch (err) {
        console.warn('Live preview refresh error:', err);
      } finally {
        if (indicator) indicator.classList.remove('is-syncing');
      }
    }, 450);

    // Viewport switcher inside live preview panel (MacBook Pro vs iPhone 15 Pro)
    $$('[data-vp]', el).forEach((btn) => {
      btn.onclick = () => {
        $$('[data-vp]', el).forEach((b) => b.classList.remove('is-active'));
        btn.classList.add('is-active');
        const isMobile = btn.dataset.vp === 'mobile' || btn.dataset.vp === '390px';
        const stage = $('[data-frame-wrap]', el);
        const frame = $('iframe.preview-frame', el);
        const macScreen = $('.macbook-screen', el);
        const iphoneScreen = $('[data-iphone-screen]', el);
        if (!stage || !frame) return;

        if (isMobile) {
          stage.classList.remove('is-macbook');
          stage.classList.add('is-iphone');
          if (iphoneScreen && frame.parentElement !== iphoneScreen) {
            iphoneScreen.appendChild(frame);
          }
        } else {
          stage.classList.remove('is-iphone');
          stage.classList.add('is-macbook');
          if (macScreen && frame.parentElement !== macScreen) {
            macScreen.appendChild(frame);
          }
        }
        refreshPreview();
      };
    });
    $('[data-preview-reload]', el)?.addEventListener('click', () => refreshPreview());
    $('[data-preview-external]', el)?.addEventListener('click', async () => {
      try {
        const res = await fetch('/api/admin/preview', {
          method: 'POST',
          credentials: 'same-origin',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(collect())
        });
        const html = await res.text();
        const blob = new Blob([html], { type: 'text/html' });
        const url = URL.createObjectURL(blob);
        window.open(url, '_blank');
      } catch (err) { toastError(err); }
    });

    applyMode();
  };

  /** Cover finder: free, commercially usable photos with attribution (Openverse, Wikimedia, Pexels). */
  function coverFinder(initial, onPick) {
    const m = modal({ title: 'Find a cover photo', wide: true, body: `<form class="toolbar-row" data-form><input class="input" data-q value="${h(initial)}" placeholder="What should the photo show? e.g. oxygen concentrator" style="max-width:none;flex:1"><button class="btn btn-primary">${icon('search')}Search</button></form>
      <p class="muted small" style="margin-top:-6px">From Openverse, Wikimedia Commons${''} and Pexels (when configured). Only licences that allow commercial use, always credited under the photo.</p><div class="photo-grid" data-grid></div>` });
    const grid = $('[data-grid]', m.el);
    let results = [];
    const search = async () => {
      const q = $('[data-q]', m.el).value.trim();
      if (q.length < 2) return;
      grid.innerHTML = '<div class="skel" style="height:150px"></div>'.repeat(6);
      try {
        results = (await api('GET', `covers?q=${encodeURIComponent(q)}`)).data;
        grid.innerHTML = results.length ? results.map((c, i) => `<button type="button" class="photo" data-i="${i}"><img src="${h(c.thumb)}" alt="${h(c.title)}" loading="lazy" referrerpolicy="no-referrer"><span>${h(c.credit)}</span></button>`).join('')
          : '<div class="empty" style="grid-column:1/-1"><h3>No usable photos</h3><p>Try simpler words, such as "hospital ward" or "medical equipment".</p></div>';
      } catch (err) { grid.innerHTML = `<p class="muted">${h(err.message)}</p>`; }
    };
    $('[data-form]', m.el).onsubmit = (e) => { e.preventDefault(); search(); };
    grid.onclick = async (e) => {
      const b = e.target.closest('[data-i]');
      if (!b) return;
      const c = results[Number(b.dataset.i)];
      b.style.opacity = '.5';
      try {
        const r = await api('POST', 'covers', { url: c.full, title: c.title, credit: c.credit, creditUrl: c.creditUrl });
        onPick(r.data.url, r.data.credit); m.close(true); toast('Cover saved to your picture library');
      } catch (err) { b.style.opacity = ''; toastError(err); }
    };
    if (initial) search();
  }

  /* ================= AI writer ================= */
  views.writer = async (el, [tab = 'write', postId]) => {
    setHeader('AI writer');
    el.innerHTML = skeletonRows(4);
    const { data: W } = await api('GET', 'writer');
    const TABS = [['write', 'Write an article'], ['topics', 'Daily topics'], ['history', 'Past runs']];
    el.innerHTML = `${!W.configured ? `<div class="notice">${icon('info')}<span><strong>The AI writer is not switched on yet.</strong> Ask your web developer to add the AI key. Until then you can still add topics and <a href="#article/new">write articles yourself</a>.</span></div>` : ''}
      <div class="tabs" role="tablist">${TABS.map(([t, l]) => `<button role="tab" aria-selected="${t === tab || (tab === 'post' && t === 'write')}" data-t="${t}">${l}</button>`).join('')}</div><div data-pane></div>`;
    $$('[data-t]', el).forEach((b) => { b.onclick = () => { location.hash = `writer/${b.dataset.t}`; }; });
    const pane = $('[data-pane]', el);
    if (tab === 'topics') return writerTopics(pane, W);
    if (tab === 'history') return writerHistory(pane, W);
    return writerFlow(pane, W, tab === 'post' ? postId : null);
  };

  const MARKER_HELP = `<section class="marker-help">
      <h3>${icon('info')}About the yellow markers</h3>
      <p>The AI is told to use only your business facts. When it is unsure, it leaves a yellow marker for you to check. It can still get details wrong, so read every draft before publishing:</p>
      <ul>
        <li><mark class="marker">[NEEDS SOURCE]</mark> a sentence that needs proof. Add where the fact comes from, or soften it.</li>
        <li><mark class="marker">[FLAG]</mark> a detail the AI did not have, such as a price or a model number. Fill it in.</li>
      </ul>
      <p class="muted">Visitors never see the markers, even if you publish with some left in.</p>
    </section>`;

  async function writerFlow(pane, W, regenId) {
    const s = { keywords: '', tags: new Set(), type: '', details: {}, guessed: [], outline: null, news: [], useNews: false, outlineFirst: false, postId: regenId };
    if (regenId) {
      try {
        const p = (await api('GET', `posts?id=${encodeURIComponent(regenId)}`)).data;
        Object.assign(s, { keywords: p.topic || p.title, type: p.blog_type || '', outline: p.outline || null, regenTitle: p.title });
      } catch (err) { toastError(err); }
    }
    try {
      const pre = JSON.parse(sessionStorage.getItem('medico_writer_prefill') || 'null');
      sessionStorage.removeItem('medico_writer_prefill');
      if (pre) {
        Object.assign(s, { keywords: pre.keywords || '', type: pre.type || '' });
        if (pre.keywords) {
          pre.keywords.split(/[,·+]/).map(k => k.trim()).filter(Boolean).forEach(k => s.tags.add(k));
        }
      }
    } catch { /* ignore */ }
    const typeOf = (id) => W.types.find((t) => t.id === id);
    const ai = W.configured;

    const KEYWORD_CATEGORIES = [
      {
        name: 'Clinical Equipment',
        tags: [
          'Oxygen Concentrator',
          'Philips EverFlo',
          'BiPAP & CPAP Systems',
          'ICU Patient Monitor',
          'Defibrillator / AED',
          'Schiller ECG 12-Channel',
          'Anaesthesia Workstation',
          'OT Cautery / Diathermy',
          'Pulse Oximeter & Nebulizer',
          'Hospital ICU Bed'
        ]
      },
      {
        name: 'Regional Context (J&K)',
        tags: [
          'Kashmir Winter Readiness',
          'Sub-zero Temperature Care',
          'Power Cuts & Inverter Sizing',
          'Srinagar Home Care Setup',
          'District Hospitals & Clinics',
          '24/7 Biomedical Support'
        ]
      },
      {
        name: 'Angle & Reader Intent',
        tags: [
          "Complete Buyer's Guide",
          'Emergency Readiness Checklist',
          'Preventive Maintenance & AMC',
          'Patient Family Operating Guide',
          'Clinical Specification Comparison'
        ]
      }
    ];

    const IDEAS = [
      { text: 'Oxygen concentrator backup during winter power cuts in Kashmir', type: 'problem_solution', label: 'Winter oxygen backup', tags: ['Oxygen Concentrator', 'Kashmir Winter Readiness', 'Power Cuts & Inverter Sizing'] },
      { text: 'Setting up a CPAP or BiPAP machine at home for sleep apnea', type: 'how_to', label: 'CPAP at home', tags: ['BiPAP & CPAP Systems', 'Patient Family Operating Guide'] },
      { text: 'Getting an ICU ready: monitors and equipment checklist in Jammu and Kashmir', type: 'guide', label: 'ICU checklist', tags: ['ICU Patient Monitor', 'Defibrillator / AED', 'District Hospitals & Clinics'] },
      { text: 'How to choose a defibrillator for a clinic or hospital', type: 'comparison', label: 'Choosing a defibrillator', tags: ['Defibrillator / AED', "Complete Buyer's Guide"] },
    ];
    let lastError = '';

    function getCombinedTopic() {
      const tagList = Array.from(s.tags);
      if (!tagList.length) return s.keywords.trim();
      if (!s.keywords.trim()) return `Clinical guide covering: ${tagList.join(', ')}`;
      const hasTagsAlready = tagList.some(t => s.keywords.toLowerCase().includes(t.toLowerCase()));
      if (hasTagsAlready) return s.keywords.trim();
      return `${s.keywords.trim()} (Focus keywords: ${tagList.join(', ')})`;
    }

    function readForm() {
      const kw = $('[data-kw]', pane); if (kw) s.keywords = kw.value;
      $$('[data-d]', pane).forEach((x) => { s.details[x.dataset.d] = x.value; });
      const n = $('[data-news]', pane); if (n) s.useNews = n.checked;
      const o = $('[data-outline-first]', pane); if (o) s.outlineFirst = o.checked;
      const kwd = $('[data-kw-details]', pane); if (kwd) s.kwOpen = kwd.open;
    }

    function drawCompose() {
      const t = typeOf(s.type);
      const advOpen = Boolean(s.type || s.outlineFirst || s.useNews);
      const selectedTagsArr = Array.from(s.tags);

      pane.innerHTML = `
        ${s.postId ? `<div class="notice">${icon('refresh')}<span>Writing a new version of <strong>${h(s.regenTitle || 'this article')}</strong>. It replaces the text and marks the article as not reviewed. The picture and web address stay the same.</span></div>` : ''}
        ${lastError ? `<div class="notice notice-accent">${icon('alert')}<span><strong>The draft could not be finished.</strong> ${h(lastError)}</span></div>` : ''}
        <section class="card writer-card"><div class="card-body">
          <label for="w-kw" class="writer-label">What should the article be about?</label>
          <textarea class="textarea" id="w-kw" data-kw rows="3" placeholder="Click keywords below or type a topic, e.g. Oxygen concentrator backup during Kashmir winter power cuts">${h(s.keywords)}</textarea>

          <!-- Collapsible Interactive Keyword Selector -->
          <details class="kw-collapsible" data-kw-details ${s.kwOpen ? 'open' : ''}>
            <summary class="kw-collapsible-summary">
              <span class="kw-summary-left">
                <span class="kw-icon-wrap">${icon('writer')}</span>
                <strong>Select keywords to guide AI article</strong>
                <span class="muted small">(Optional · click to expand)</span>
              </span>
              <span class="spacer"></span>
              <span class="kw-badge ${selectedTagsArr.length ? 'is-active' : ''}">${selectedTagsArr.length ? `${selectedTagsArr.length} keywords active` : 'Browse topics'}</span>
              <svg class="kw-summary-chevron i" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="6 9 12 15 18 9"/></svg>
            </summary>

            <div class="kw-selector-box">
              <div class="kw-header">
                <span class="kw-header-title">Choose from clinical and local topics:</span>
                ${selectedTagsArr.length ? `<button type="button" class="kw-clear-btn" data-kw-clear>Clear selected (${selectedTagsArr.length})</button>` : ''}
              </div>

              ${selectedTagsArr.length ? `
                <div class="kw-selected-cloud">
                  <span class="small muted" style="margin-right:4px">Targeting:</span>
                  ${selectedTagsArr.map(tag => `<span class="kw-selected-tag">${h(tag)}<button type="button" class="kw-tag-del" data-tag-remove="${h(tag)}" aria-label="Remove ${h(tag)}">&times;</button></span>`).join('')}
                </div>` : ''}

              ${KEYWORD_CATEGORIES.map(cat => `
                <div class="kw-category-section">
                  <div class="kw-category-label">${h(cat.name)}</div>
                  <div class="kw-pill-grid">
                    ${cat.tags.map(tag => {
                      const isSel = s.tags.has(tag);
                      return `<button type="button" class="kw-pill-btn${isSel ? ' is-selected' : ''}" data-kw-tag="${h(tag)}">
                        <svg class="kw-pill-icon i" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="20 6 9 17 4 12"/></svg>
                        <span>${h(tag)}</span>
                      </button>`;
                    }).join('')}
                  </div>
                </div>`).join('')}

              <div class="kw-custom-adder">
                <input type="text" class="kw-custom-input" placeholder="Add custom keyword (press Enter)..." data-custom-kw>
                <button type="button" class="btn btn-sm" data-add-custom-kw>${icon('plus')}Add keyword</button>
              </div>
            </div>
          </details>

          <div class="quick-chip-row"><span class="muted small">Quick prompts:</span>${IDEAS.map((q, i) => `<button type="button" class="quick-chip" data-idea="${i}">${h(q.label)}</button>`).join('')}</div>
          <div class="writer-go">
            <button class="btn btn-primary btn-lg" data-go ${ai ? '' : 'disabled'}>${icon('writer')}${s.outlineFirst ? 'Plan the article' : 'Generate draft'}</button>
            <span class="muted small">Takes about 30 seconds. Draft opens in live phone preview. Nothing published until approved.</span>
          </div>
          <details class="advanced" data-adv ${advOpen ? 'open' : ''}>
            <summary>Advanced options</summary>
            <p class="hint">All optional. Without them the AI picks sensible settings by itself.</p>
            <div class="label" style="margin:12px 0 8px">Kind of article</div>
            <div class="type-grid">
              <button type="button" class="type-card" data-type="" aria-pressed="${!s.type}"><strong>Let the AI choose</strong><span>Best for most topics.</span></button>
              ${W.types.map((x) => `<button type="button" class="type-card" data-type="${x.id}" aria-pressed="${x.id === s.type}"><strong>${h(x.label)}</strong><span>${h(x.useFor)}</span></button>`).join('')}
            </div>
            ${t ? `<div class="type-details"><div class="row" style="justify-content:space-between;margin-bottom:8px"><strong>Details for "${h(t.label)}"</strong><button class="btn btn-sm" data-infer ${ai ? '' : 'disabled'}>${icon('writer')}Fill in from my topic</button></div>
              <p class="hint" style="margin:0 0 12px">Real numbers, model names and prices make the article stronger. Leave anything you do not know empty.</p>
              ${t.fields.map((fl) => `<div class="field"><label for="d-${fl.key}">${h(fl.label)}${s.guessed.includes(fl.key) && s.details[fl.key] ? '<span class="chip">Guessed by AI, please check</span>' : ''}</label>
                ${fl.type === 'textarea' ? `<textarea class="textarea" id="d-${fl.key}" data-d="${fl.key}" rows="3">${h(s.details[fl.key] || '')}</textarea>` : `<input class="input" id="d-${fl.key}" data-d="${fl.key}" value="${h(s.details[fl.key] || '')}">`}
                ${fl.hint ? `<span class="hint">${h(fl.hint)}</span>` : ''}</div>`).join('')}</div>` : ''}
            <label class="switch switch-row"><input type="checkbox" data-news ${s.useNews ? 'checked' : ''}><span><strong>Use recent news</strong><small>The AI looks up recent news reports on the topic and links to them.</small></span></label>
            <label class="switch switch-row"><input type="checkbox" data-outline-first ${s.outlineFirst ? 'checked' : ''}><span><strong>Let me check the plan first</strong><small>See the list of headings before the AI writes, and change them if you like.</small></span></label>
          </details>
        </div></section>
        ${MARKER_HELP}`;

      $('[data-kw]', pane).addEventListener('input', (e) => { s.keywords = e.target.value; });

      // Keyword chip click handlers
      $$('[data-kw-tag]', pane).forEach(btn => {
        btn.onclick = () => {
          readForm();
          const tag = btn.dataset.kwTag;
          if (s.tags.has(tag)) {
            s.tags.delete(tag);
          } else {
            s.tags.add(tag);
            if (!s.keywords.trim()) {
              s.keywords = Array.from(s.tags).join(' · ');
            } else if (!s.keywords.toLowerCase().includes(tag.toLowerCase())) {
              s.keywords = `${s.keywords.trim()}, ${tag}`;
            }
          }
          drawCompose();
        };
      });

      // Remove individual tag from cloud
      $$('[data-tag-remove]', pane).forEach(btn => {
        btn.onclick = () => {
          readForm();
          s.tags.delete(btn.dataset.tagRemove);
          drawCompose();
        };
      });

      // Clear all keywords
      $('[data-kw-clear]', pane)?.addEventListener('click', () => {
        readForm();
        s.tags.clear();
        drawCompose();
      });

      // Custom tag input adder
      const customInput = $('[data-custom-kw]', pane);
      const addCustom = () => {
        const val = customInput?.value.trim();
        if (val) {
          readForm();
          s.tags.add(val);
          if (!s.keywords.trim()) s.keywords = val;
          else if (!s.keywords.toLowerCase().includes(val.toLowerCase())) s.keywords = `${s.keywords.trim()}, ${val}`;
          drawCompose();
        }
      };
      customInput?.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') { e.preventDefault(); addCustom(); }
      });
      $('[data-add-custom-kw]', pane)?.addEventListener('click', addCustom);

      pane.querySelector('.quick-chip-row').onclick = (e) => {
        const b = e.target.closest('[data-idea]'); if (!b) return;
        const q = IDEAS[Number(b.dataset.idea)];
        s.keywords = q.text;
        s.tags.clear();
        if (q.tags) q.tags.forEach(t => s.tags.add(t));
        drawCompose();
        $('[data-kw]', pane)?.focus();
      };

      pane.querySelector('.type-grid').onclick = (e) => {
        const b = e.target.closest('[data-type]'); if (!b) return;
        readForm(); s.type = b.dataset.type; s.guessed = []; drawCompose();
        $('.type-details', pane)?.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
      };
      $$('[data-d]', pane).forEach((x) => x.addEventListener('input', () => { s.guessed = s.guessed.filter((k) => k !== x.dataset.d); }));
      $('[data-outline-first]', pane).onchange = (e) => { s.outlineFirst = e.target.checked; $('[data-go]', pane).lastChild.textContent = s.outlineFirst ? 'Plan the article' : 'Generate draft'; };
      $('[data-infer]', pane)?.addEventListener('click', (e) => busy(e.currentTarget, async () => {
        readForm();
        const fullTopic = getCombinedTopic();
        if (fullTopic.length < 2) { toast('First pick keywords or type what the article should be about.', { error: true }); $('[data-kw]', pane).focus(); return; }
        try { await infer(); drawCompose(); toast('Details filled in. Please check them.'); } catch (err) { toastError(err); }
      }));
      $('[data-go]', pane).onclick = (e) => {
        readForm();
        const fullTopic = getCombinedTopic();
        if (fullTopic.length < 3) { toast('Please select at least one keyword or type a topic first.', { error: true }); $('[data-kw]', pane).focus(); return; }
        lastError = '';
        if (s.outlineFirst) busy(e.currentTarget, planFirst); else generate();
      };
    }

    async function infer() {
      const fullTopic = getCombinedTopic();
      const r = (await api('POST', 'writer', { action: 'infer', keywords: fullTopic, type: s.type || undefined })).data;
      Object.assign(s, { type: r.type, details: { ...r.details, ...Object.fromEntries(Object.entries(s.details).filter(([, v]) => v && v.trim())) }, guessed: r.guessed });
    }
    const hasDetails = () => Object.values(s.details).some((v) => v && String(v).trim());

    async function planFirst() {
      try {
        if (!s.type || !hasDetails()) await infer();
        const fullTopic = getCombinedTopic();
        const r = (await api('POST', 'writer', { action: 'outline', type: s.type, details: s.details, guessed: s.guessed, useNews: s.useNews, topic: fullTopic })).data;
        s.outline = r.outline; s.news = r.news; drawOutline();
      } catch (err) { lastError = window.Admin.friendly(err.message); drawCompose(); }
    }

    function progress(stepsDone) {
      const STEPS = ['Understanding your keywords & topic', 'Writing clinical content', 'Checking facts and choosing cover photo', 'Opening in phone preview'];
      pane.innerHTML = `<section class="card writer-progress" aria-live="polite"><div class="card-body">
        <h3>Writing your article…</h3>
        <p class="muted">This usually takes 20 to 40 seconds. Please keep this page open.</p>
        <ol class="progress-steps">${STEPS.map((l, i) => `<li class="${i < stepsDone ? 'is-done' : i === stepsDone ? 'is-on' : ''}"><span class="state">${i < stepsDone ? icon('check') : i + 1}</span>${l}</li>`).join('')}</ol>
      </div></section>${MARKER_HELP}`;
    }

    async function generate() {
      let timer;
      try {
        progress(0);
        if (!s.type || (!hasDetails() && !s.outline)) await infer();
        progress(1);
        timer = setTimeout(() => progress(2), 18000);
        const fullTopic = getCombinedTopic();
        const r = (await api('POST', 'writer', { action: 'write', type: s.type, details: s.details, guessed: s.guessed, outline: s.outline, news: s.news, useNews: s.useNews && !s.outline, topic: fullTopic || s.details.keyword, postId: s.postId || undefined })).data;
        clearTimeout(timer);
        progress(3);
        window.Admin.invalidatePalette();
        toast('Your draft is ready. Check the yellow markers, then publish.');
        location.hash = `article/${encodeURIComponent(r.id)}`;
      } catch (err) {
        clearTimeout(timer);
        const msg = window.Admin.friendly(err.message);
        lastError = msg === 'Something went wrong. Please try again.' ? 'The AI writer did not answer in time. Please try again in a minute.' : msg;
        s.outline && s.outlineFirst ? drawOutline() : drawCompose();
      }
    }

    function drawOutline() {
      const o = s.outline;
      pane.innerHTML = `
        ${lastError ? `<div class="notice notice-accent">${icon('alert')}<span><strong>The draft could not be finished.</strong> ${h(lastError)}</span></div>` : ''}
        <section class="card" style="margin-bottom:16px"><div class="card-head"><div><h3>The plan for your article</h3><p class="card-sub">Change any heading, move them up or down, then tap Write the article.</p></div></div><div class="card-body">
          <div class="field"><label for="o-h1">Article title</label><input class="input" id="o-h1" data-h1 value="${h(o.h1)}"></div>
          <div class="label" style="margin-bottom:4px">Sections</div>
          <div data-rows></div><button class="btn btn-sm" data-add style="margin-top:8px">${icon('plus')}Add a section</button>
        </div></section>
        ${o.missingInputs && o.missingInputs.length ? `<div class="notice">${icon('info')}<div><strong>Details that would make it stronger</strong><ul style="margin:6px 0 0;padding-left:18px">${o.missingInputs.map((x) => `<li>${h(x)}</li>`).join('')}</ul><span class="small muted">You can go back and add them, or write anyway: missing details become yellow [FLAG] markers.</span></div></div>` : ''}
        ${s.news.length ? `<div class="notice">${icon('articles')}<div><strong>${window.Admin.plural(s.news.length, 'news report')} will be used and linked</strong><ul style="margin:6px 0 0;padding-left:18px">${s.news.map((n) => `<li>${h(n.title)} <span class="muted">(${h(n.source)})</span></li>`).join('')}</ul></div></div>` : ''}
        ${o.coverageMap && o.coverageMap.length ? `<details class="advanced" style="margin-bottom:16px"><summary>How this compares with other websites</summary><div style="overflow:auto"><table class="table"><thead><tr><th>Topic</th><th>Others cover it</th><th>What they miss</th><th>Our angle</th></tr></thead><tbody>${o.coverageMap.map((c) => `<tr><td>${h(c.topic)}</td><td>${h(c.topPagesCover)}</td><td class="small">${h(c.gap)}</td><td class="small">${h(c.ourAngle)}</td></tr>`).join('')}</tbody></table></div></details>` : ''}
        <div class="row sticky-actions"><button class="btn btn-primary" data-approve>${icon('check')}Write the article</button><button class="btn" data-regen>${icon('refresh')}Make a new plan</button><button class="btn btn-ghost" data-back>Back</button></div>`;
      const rows = $('[data-rows]', pane);
      const drawRows = () => {
        rows.innerHTML = o.sections.map((sec, i) => `<div class="outline-row ${sec.level === 'h3' ? 'is-h3' : ''}" data-i="${i}">
          <select class="select" data-k="level" aria-label="Heading size"><option value="h2"${sec.level === 'h2' ? ' selected' : ''}>Main</option><option value="h3"${sec.level === 'h3' ? ' selected' : ''}>Sub</option></select>
          <input class="input" data-k="heading" value="${h(sec.heading)}" aria-label="Heading">
          <input class="input words" data-k="words" type="number" min="0" value="${h(sec.words)}" aria-label="About how many words">
          <button class="btn btn-sm btn-ghost btn-icon up" data-move="-1" aria-label="Move up">${icon('arrowUp')}</button>
          <button class="btn btn-sm btn-ghost btn-icon" data-move="1" aria-label="Move down">${icon('arrowDown')}</button>
          <button class="btn btn-sm btn-ghost btn-icon btn-danger" data-del aria-label="Remove section">${icon('x')}</button></div>`).join('');
      };
      drawRows();
      rows.addEventListener('input', (e) => { const r = e.target.closest('[data-i]'); const k = e.target.dataset.k; if (r && k) o.sections[Number(r.dataset.i)][k] = k === 'words' ? Number(e.target.value) : e.target.value; });
      rows.addEventListener('change', (e) => { if (e.target.dataset.k === 'level') drawRows(); });
      rows.addEventListener('click', (e) => {
        const r = e.target.closest('[data-i]'); if (!r) return; const i = Number(r.dataset.i);
        if (e.target.closest('[data-del]')) { o.sections.splice(i, 1); drawRows(); }
        const mv = e.target.closest('[data-move]'); if (mv) { const j = i + Number(mv.dataset.move); if (j >= 0 && j < o.sections.length) { [o.sections[i], o.sections[j]] = [o.sections[j], o.sections[i]]; drawRows(); } }
      });
      $('[data-add]', pane).onclick = () => { o.sections.push({ level: 'h2', heading: '', words: 150, keyword: '', drawsOn: '' }); drawRows(); $$('[data-k="heading"]', rows).pop().focus(); };
      $('[data-h1]', pane).oninput = (e) => { o.h1 = e.target.value; };
      $('[data-back]', pane).onclick = () => { lastError = ''; drawCompose(); };
      $('[data-regen]', pane).onclick = (e) => busy(e.currentTarget, async () => {
        try { const r = (await api('POST', 'writer', { action: 'outline', type: s.type, details: s.details, guessed: s.guessed, useNews: s.useNews, topic: s.keywords })).data; s.outline = r.outline; s.news = r.news; lastError = ''; drawOutline(); toast('New plan ready'); } catch (err) { toastError(err); }
      });
      $('[data-approve]', pane).onclick = () => { o.sections = o.sections.filter((x) => x.heading.trim()); lastError = ''; generate(); };
    }
    drawCompose();
  }

  async function writerTopics(pane, W) {
    const [{ data }, settings] = await Promise.all([api('GET', 'topics'), api('GET', 'settings').then((r) => r.data).catch(() => null)]);
    const typeOpts = (sel) => `<option value="">Let the AI choose</option>${W.types.map((t) => `<option value="${t.id}"${t.id === sel ? ' selected' : ''}>${h(t.label)}</option>`).join('')}`;
    const autoOn = settings ? settings.blog_auto_enabled : null;
    const every = settings?.blog_every_days === 1 ? 'every day' : settings?.blog_every_days === 7 ? 'once a week' : settings ? `every ${settings.blog_every_days} days` : 'every day';
    const draw = () => {
      pane.innerHTML = `
        <p class="page-lead">Write one draft automatically ${every} about these topics. The writer takes turns, picking the topic it used least recently. Drafts wait for you under Articles.</p>
        <div class="notice">${icon(W.cron && autoOn ? 'checkCircle' : 'clock')}<span>${!W.cron ? '<strong>Daily writing is not switched on yet.</strong> Your web developer needs to turn on the daily schedule.' : autoOn ? `<strong>Daily drafts are on.</strong> One new draft ${every}.` : '<strong>Daily drafts are off.</strong> Turn them on in <a href="#settings">Settings</a>.'}</span></div>
        <form class="card" data-new style="margin-bottom:16px"><div class="card-head"><h3>Add a topic</h3></div><div class="card-body">
          <div class="field"><label for="t-kw">Topic</label><input class="input" id="t-kw" name="keyword" placeholder="For example: ventilator maintenance" required></div>
          <div class="field"><label for="t-notes">What to cover (optional)</label><input class="input" id="t-notes" name="notes" placeholder="For example: mention our yearly service plans"></div>
          <details class="advanced"><summary>Advanced options</summary><div class="field" style="margin-top:12px"><label for="t-type">Kind of article</label><select class="select" id="t-type" name="blog_type">${typeOpts('')}</select></div></details>
          <button class="btn btn-primary" style="margin-top:12px">${icon('plus')}Add topic</button>
        </div></form>
        ${data.length ? `<h3 class="section-title">Your topics (${data.length})</h3><div class="topic-list">${data.map((t) => `<div class="topic card" data-id="${h(t.id)}"><div class="card-body">
          <div class="field"><label class="visually-hidden" for="tk-${h(t.id)}">Topic</label><input class="input topic-title" id="tk-${h(t.id)}" data-k="keyword" value="${h(t.keyword)}"></div>
          <div class="field"><label class="visually-hidden" for="tn-${h(t.id)}">What to cover</label><input class="input" id="tn-${h(t.id)}" data-k="notes" value="${h(t.notes)}" placeholder="What to cover (optional)"></div>
          <div class="field"><label class="small muted" for="tt-${h(t.id)}">Kind of article</label><select class="select" id="tt-${h(t.id)}" data-k="blog_type">${typeOpts(t.blog_type)}</select></div>
          <div class="topic-foot">
            <label class="switch"><input type="checkbox" data-k="is_active" ${t.is_active ? 'checked' : ''}><span>Use for daily drafts</span></label>
            <span class="muted small">${t.times_used ? `Used ${window.Admin.plural(t.times_used, 'time')}${t.last_used_at ? `, last ${h(ago(t.last_used_at))}` : ''}` : 'Not used yet'}</span>
            <span class="spacer"></span>
            <button class="btn btn-sm" data-write ${W.configured ? '' : 'disabled'}>${icon('writer')}Write now</button>
            <button class="btn btn-sm btn-ghost btn-icon btn-danger" data-del aria-label="Delete topic ${h(t.keyword)}">${icon('trash')}</button>
          </div></div></div>`).join('')}</div>`
          : emptyState('writer', 'No topics yet', 'Add the subjects your customers care about, for example "oxygen concentrators" or "hospital beds". The writer will take turns writing about them.')}`;
      $('[data-new]', pane).onsubmit = async (e) => {
        e.preventDefault();
        const fd = Object.fromEntries(new FormData(e.target));
        try { data.push((await api('POST', 'topics', fd)).data); draw(); toast('Topic added'); } catch (err) { toastError(err); }
      };
    };
    draw();
    const save = debounce(async (card) => {
      const t = data.find((x) => x.id === card.dataset.id);
      Object.assign(t, { keyword: $('[data-k="keyword"]', card).value, notes: $('[data-k="notes"]', card).value, blog_type: $('[data-k="blog_type"]', card).value || null, is_active: $('[data-k="is_active"]', card).checked });
      try { await api('PUT', 'topics', t); toast('Topic saved'); } catch (err) { toastError(err); }
    }, 700);
    pane.addEventListener('input', (e) => { const c = e.target.closest('.topic[data-id]'); if (c && e.target.type !== 'checkbox') save(c); });
    pane.addEventListener('change', (e) => { const c = e.target.closest('.topic[data-id]'); if (c && (e.target.type === 'checkbox' || e.target.tagName === 'SELECT')) save(c); });
    pane.addEventListener('click', async (e) => {
      const card = e.target.closest('.topic[data-id]'); if (!card) return;
      const t = data.find((x) => x.id === card.dataset.id);
      if (e.target.closest('[data-del]')) {
        if (!(await confirmBox('Delete this topic?', `<strong>${h(t.keyword)}</strong> will be removed. Articles already written about it stay.`, { ok: 'Delete', danger: true }))) return;
        data.splice(data.indexOf(t), 1); draw(); await api('DELETE', `topics?id=${encodeURIComponent(t.id)}`).then(() => toast('Topic deleted')).catch(toastError);
      }
      if (e.target.closest('[data-write]')) {
        sessionStorage.setItem('medico_writer_prefill', JSON.stringify({ keywords: `${t.keyword}. ${t.notes || ''}`.trim(), type: t.blog_type || '' }));
        location.hash = 'writer/write';
      }
    });
  }

  async function writerHistory(pane, W) {
    const runs = W.runs;
    const STATUS = { failed: 'Did not finish', running: 'Writing…', published: 'Published', draft: 'Draft saved', skipped: 'Skipped' };
    pane.innerHTML = `<div class="toolbar-row"><span class="muted">Every article the AI writer worked on, newest first.</span><span class="spacer"></span><button class="btn" data-auto ${W.configured ? '' : 'disabled'}>${icon('refresh')}Write today's draft now</button></div>
      ${runs.length ? `<div class="run-list">${runs.map((r) => `<div class="run">
        <div class="run-main">${r.post_id && r.title ? `<a href="#article/${encodeURIComponent(r.post_id)}">${h(r.title)}</a>` : `<strong>${h(r.topic || 'Article')}</strong>`}
          <span class="muted small">${h(fmtDate(r.created_at, true))} · ${r.trigger === 'auto' ? 'Daily automatic draft' : 'Started by you'}${r.status === 'failed' && r.message ? ` · ${h(window.Admin.friendly(r.message))}` : ''}</span></div>
        <span class="chip${r.status === 'published' ? ' chip-solid' : r.status === 'failed' ? ' chip-review' : ''}">${STATUS[r.status] || h(r.status)}</span>
      </div>`).join('')}</div>`
        : emptyState('clock', 'Nothing written yet', 'Articles the AI writes will be listed here.', `<a class="btn btn-primary" href="#writer/write">${icon('writer')}Write an article</a>`)}`;
    $('[data-auto]', pane).onclick = (e) => busy(e.currentTarget, async () => {
      try { const r = (await api('POST', 'writer', { action: 'auto' })).data; toast(window.Admin.friendly(r.message), { error: r.status === 'failed' }); views.writer($('#view'), ['history']); } catch (err) { toastError(err); }
    });
  }

  /* ================= Products ================= */
  views.products = async (el) => {
    setHeader('Products', `<a class="btn btn-primary" href="#product/new">${icon('plus')}<span class="desktop-only">Add product</span></a>`);
    el.innerHTML = `
      <p class="page-lead">The equipment shown in your online catalogue. Switch <strong>Shown</strong> off to hide a product without deleting it. Tap a product to change it.</p>
      <div class="toolbar-row">
        <div class="search-box-wrap">${icon('search')}<input class="input" type="search" data-search placeholder="Search by name or brand" aria-label="Search products"></div>
        <select class="select toolbar-select-wrap" data-cat aria-label="Category"><option value="">All categories</option></select>
        <span class="toolbar-count" data-product-count></span>
      </div>
      <div data-list>${skeletonRows()}</div>`;
    const { data } = await api('GET', 'products');
    const cats = [...new Set(data.map((p) => p.category).filter(Boolean))];
    $('[data-cat]', el).insertAdjacentHTML('beforeend', cats.map((c) => `<option>${h(c)}</option>`).join(''));
    const list = $('[data-list]', el);
    const countEl = $('[data-product-count]', el);
    const draw = () => {
      const q = $('[data-search]', el).value.trim().toLowerCase();
      const cat = $('[data-cat]', el).value;
      const rows = data.filter((p) => (!cat || p.category === cat) && (!q || `${p.title} ${p.brand} ${p.description}`.toLowerCase().includes(q)));
      countEl.textContent = q || cat ? `${rows.length} of ${data.length}` : `${window.Admin.plural(data.length, 'product')} · ${data.filter((p) => p.is_visible).length} shown`;
      list.innerHTML = rows.length ? `<div class="table-card"><table class="table stack cards"><thead><tr><th style="width:60px"><span class="visually-hidden">Picture</span></th><th>Product</th><th>Category</th><th>Availability</th><th>Shown</th><th><span class="visually-hidden">Actions</span></th></tr></thead><tbody>${rows.map((p) => `
        <tr class="is-link" data-id="${h(p.id)}">
          <td class="cell-thumb"><img class="thumb" src="${h(p.main_image || '/images/products/oxygen.webp')}" alt="" loading="lazy"></td>
          <td class="title-cell"><a class="row-title" href="#product/${encodeURIComponent(p.id)}">${h(p.title)}</a><small class="truncate">${h(p.brand || '')}${p.brand && p.description ? ' · ' : ''}${h(p.description || '')}</small></td>
          <td class="cell-date small">${h(p.category || 'General')}</td>
          <td class="cell-status"><span class="chip${p.stock === 'In Stock' ? ' chip-solid' : ''}">${h(p.stock === 'In Stock' ? 'In stock' : p.stock || 'In stock')}</span></td>
          <td class="cell-switch"><label class="switch"><input type="checkbox" data-visible ${p.is_visible ? 'checked' : ''} aria-label="Show ${h(p.title)} on the website"><span class="mobile-only">Shown on website</span></label></td>
          <td class="actions"><a class="btn btn-sm btn-ghost btn-icon" href="/product/${encodeURIComponent(p.id)}" target="_blank" rel="noopener" aria-label="See it on the website">${icon('external')}</a><button class="btn btn-sm btn-ghost btn-icon btn-danger" data-del aria-label="Delete ${h(p.title)}">${icon('trash')}</button></td>
        </tr>`).join('')}</tbody></table></div>`
        : data.length ? emptyState('search', 'No products match', 'Try another word or category.', '<button class="btn" data-clear>Show all products</button>')
          : emptyState('products', 'No products yet', 'Add the equipment you sell so customers can find it and ask for a quote.', `<a class="btn btn-primary" href="#product/new">${icon('plus')}Add your first product</a>`);
    };
    draw();
    $('[data-search]', el).addEventListener('input', debounce(draw, 150));
    $('[data-cat]', el).addEventListener('change', draw);
    list.addEventListener('click', async (e) => {
      if (e.target.closest('[data-clear]')) { $('[data-search]', el).value = ''; $('[data-cat]', el).value = ''; draw(); return; }
      const tr = e.target.closest('tr[data-id]'); if (!tr || e.target.closest('a')) return;
      const p = data.find((x) => x.id === tr.dataset.id);
      if (e.target.closest('[data-visible]')) {
        const prev = p.is_visible; p.is_visible = e.target.checked;
        try { await api('PUT', 'products', { ...toProductBody(p), is_visible: p.is_visible }); toast(p.is_visible ? 'Shown on the website' : 'Hidden from the website'); draw(); } catch (err) { p.is_visible = prev; draw(); toastError(err); }
        return;
      }
      if (e.target.closest('label.switch')) return;
      if (e.target.closest('[data-del]')) {
        if (!(await confirmBox('Delete this product?', `<strong>${h(p.title)}</strong> will be removed from your catalogue for good. To keep it for later, switch off <strong>Shown</strong> instead.`, { ok: 'Delete', danger: true }))) return;
        data.splice(data.indexOf(p), 1); draw();
        await api('DELETE', `products?id=${encodeURIComponent(p.id)}`).then(() => toast('Product deleted')).catch(toastError);
        return;
      }
      location.hash = `product/${encodeURIComponent(p.id)}`;
    });
  };

  const toProductBody = (p) => ({
    id: p.id, title: p.title, category: p.category, brand: p.brand, price: p.price, originalPrice: p.original_price, stock: p.stock, description: p.description,
    mainImage: p.main_image, galleryImages: p.gallery_images, features: p.features, longDescription: p.long_description, specifications: p.specifications,
    inTheBox: p.in_the_box, sku: p.sku, sort_order: p.sort_order, is_visible: p.is_visible,
  });

  views.product = async (el, [id = 'new']) => {
    const isNew = id === 'new';
    setHeader(`<span class="crumb">Products /</span> ${isNew ? 'New product' : 'Edit'}`);
    el.innerHTML = skeletonRows(5);
    const [all, one] = await Promise.all([api('GET', 'products'), isNew ? null : api('GET', `products?id=${encodeURIComponent(id)}`)]);
    if (!el.isConnected) return;
    const p = one ? one.data : { title: '', category: '', brand: '', stock: 'In Stock', description: '', features: [], specifications: [], gallery_images: [], is_visible: true, sort_order: all.data.length + 1 };
    if (!p) throw new Error('Product not found.');
    const cats = [...new Set(all.data.map((x) => x.category).filter(Boolean))];
    const brands = [...new Set(all.data.map((x) => x.brand).filter(Boolean))];
    let dirty = false;
    window.Admin.setLeaveGuard(() => !dirty);
    let main = p.main_image || '';
    let gallery = [...(p.gallery_images || [])];
    let specs = [...(p.specifications || [])];
    setHeader(`<span class="crumb">Products /</span> ${isNew ? 'New product' : h(p.title)}`, `${isNew ? '' : `<a class="btn" href="/product/${encodeURIComponent(p.id)}" target="_blank" rel="noopener">${icon('external')}<span class="desktop-only">See on website</span></a>`}<button class="btn btn-primary" data-save title="Ctrl+S">${icon('check')}<span>Save</span></button>`);
    const inp = (k, label, v, extra = '', hint = '') => `<div class="field"><label for="p-${k}">${label}</label><input class="input" id="p-${k}" data-f="${k}" value="${h(v ?? '')}" ${extra}>${hint ? `<span class="hint">${hint}</span>` : ''}</div>`;
    el.innerHTML = `<div class="editor view-editor">
      <div class="editor-main-col" style="display:flex;flex-direction:column;gap:20px">
        <!-- Basic Identity Card -->
        <section class="card">
          <div class="card-head">
            <h3>Basics</h3>
          </div>
          <div class="card-body">
            ${inp('title', 'Product name', p.title, 'placeholder="For example: Philips EverFlo 5L Oxygen Concentrator"')}
            <div class="field">
              <label for="p-desc">Short description</label>
              <textarea class="textarea" id="p-desc" data-f="description" rows="2" placeholder="One or two sentences about what it does and who it is for">${h(p.description)}</textarea>
              <span class="hint">Shown under the name in the catalogue and on Google.</span>
            </div>
            <div class="field">
              <label for="p-feat">Key points (one per line)</label>
              <textarea class="textarea" id="p-feat" data-f="features" rows="4" placeholder="Continuous 24/7 oxygen delivery&#10;Integrated OPI oxygen purity indicator&#10;Quiet 45 dBA operation&#10;Lightweight 14 kg design">${h((p.features || []).join('\n'))}</textarea>
              <span class="hint">Shown as a ticked list on the product page.</span>
            </div>
          </div>
        </section>

        <!-- Clinical Overview & Details Card -->
        <section class="card">
          <div class="card-head">
            <h3>Full description</h3>
          </div>
          <div class="card-body">
            <p class="hint" style="margin-top:0;margin-bottom:12px">Optional. A longer explanation shown on the product page. Box expands as you type or drag to resize.</p>
            <div data-rte class="rte-compact-adaptive"></div>
          </div>
        </section>

        <!-- Technical Specifications Card -->
        <section class="card">
          <div class="card-head">
            <h3>Specifications</h3>
            <span class="spacer"></span>
            <button class="btn btn-sm btn-ghost" data-spec-add>${icon('plus')}Add a row</button>
          </div>
          <div class="card-body">
            <div data-specs></div>
          </div>
        </section>

        <!-- In the Box Card -->
        <section class="card">
          <div class="card-head">
            <h3>What's in the box</h3>
          </div>
          <div class="card-body">
            <div class="field" style="margin-bottom:0">
              <textarea class="textarea" id="p-box" data-f="in_the_box" rows="3" placeholder="For example: main unit, nasal cannula, user manual, warranty card">${h(p.in_the_box || '')}</textarea>
              <span class="hint">Optional. Everything the customer receives.</span>
            </div>
          </div>
        </section>
      </div>

      <!-- Right Side Column -->
      <aside class="editor-side">
        <!-- Visibility Card -->
        <section class="card">
          <div class="card-head">
            <h3>On the website</h3>
          </div>
          <div class="card-body">
            <label class="switch" style="margin-bottom:14px">
              <input type="checkbox" data-f="is_visible" ${p.is_visible ? 'checked' : ''}>
              <span style="font-weight:600;color:var(--ink)">Shown to visitors</span>
            </label>
            ${inp('sort_order', 'Position in the catalogue', p.sort_order, 'type="number" inputmode="numeric"', 'Lower numbers come first.')}
            ${!isNew ? `<div style="border-top:1px solid var(--line-2);padding-top:14px;margin-top:14px"><button class="btn btn-sm btn-ghost btn-danger" data-delete style="width:100%">${icon('trash')}Delete product</button></div>` : ''}
          </div>
        </section>

        <!-- Main Picture Card -->
        <section class="card">
          <div class="card-head">
            <h3>Pictures</h3>
          </div>
          <div class="card-body">
            <label class="label" style="margin-bottom:6px">Main picture</label>
            <div class="cover-box" data-main></div>
            <div class="row" style="margin-top:10px">
              <button class="btn btn-sm" data-main-upload>${icon('upload')}Upload</button>
              <button class="btn btn-sm btn-ghost" data-main-library>My pictures</button>
            </div>
            
            <div class="field" style="margin-top:16px;border-top:1px solid var(--line-2);padding-top:14px">
              <label>More pictures</label>
              <div class="row" data-gallery style="margin-top:6px;gap:8px"></div>
              <button class="btn btn-sm btn-ghost" data-gallery-add style="margin-top:10px">${icon('plus')}Add a picture</button>
            </div>
          </div>
        </section>

        <!-- Catalogue Details & Pricing Card -->
        <section class="card">
          <div class="card-head">
            <h3>Category and price</h3>
          </div>
          <div class="card-body">
            <div class="field">
              <label for="p-category">Category</label>
              <input class="input" id="p-category" data-f="category" list="p-cats" value="${h(p.category)}" placeholder="Pick or type a category">
              <datalist id="p-cats">${cats.map((c) => `<option value="${h(c)}">`).join('')}</datalist>
            </div>
            <div class="field">
              <label for="p-brand">Brand</label>
              <input class="input" id="p-brand" data-f="brand" list="p-brands" value="${h(p.brand)}" placeholder="For example: Philips">
              <datalist id="p-brands">${brands.map((c) => `<option value="${h(c)}">`).join('')}</datalist>
            </div>
            <div class="field">
              <label for="p-stock">Availability</label>
              <select class="select" id="p-stock" data-f="stock">
                <option value="In Stock"${p.stock === 'In Stock' ? ' selected' : ''}>In Stock</option>
                <option value="Order on Request"${p.stock === 'Order on Request' ? ' selected' : ''}>Order on Request</option>
                <option value="Out of Stock"${p.stock === 'Out of Stock' ? ' selected' : ''}>Out of Stock</option>
              </select>
            </div>
            ${inp('sku', 'Model code (optional)', p.sku, 'placeholder="For example: PH-EVF-5L"')}
            <div class="grid-2">
              ${inp('price', 'Price (₹)', p.price, 'type="number" inputmode="numeric" min="0" placeholder="Optional"')}
              ${inp('original_price', 'Old price (₹)', p.original_price, 'type="number" inputmode="numeric" min="0" placeholder="Optional"')}
            </div>
            <p class="hint" style="margin-top:4px;line-height:1.4">Leave the price empty to show "Ask for a quote" instead. Fill in the old price only to show a discount.</p>
          </div>
        </section>
      </aside>
    </div>`;
    const f = (k) => $(`[data-f="${k}"]`, el);
    const longEditor = richEditor($('[data-rte]', el), p.long_description || '');
    const drawMain = () => { $('[data-main]', el).innerHTML = main ? `<img src="${h(main)}" alt="">` : `<div class="cover-empty">${icon('image')}</div>`; };
    const drawGallery = () => { $('[data-gallery]', el).innerHTML = gallery.map((g, i) => `<span style="position:relative"><img class="thumb" src="${h(g)}" alt=""><button class="btn btn-sm btn-icon btn-ghost" data-gal-del="${i}" aria-label="Remove" style="position:absolute;top:-8px;right:-10px;background:#fff">${icon('x')}</button></span>`).join(''); };
    const drawSpecs = () => {
      $('[data-specs]', el).innerHTML = specs.length
        ? `<div style="display:flex;flex-direction:column;gap:8px">${specs.map((s, i) => `
          <div class="row spec-row" data-spec="${i}" style="flex-wrap:nowrap;gap:10px">
            <input class="input" data-sk="label" value="${h(s.label)}" placeholder="Name, e.g. Weight" aria-label="Specification name" style="flex:1.2;min-width:0">
            <input class="input" data-sk="value" value="${h(s.value)}" placeholder="Value, e.g. 14 kg" aria-label="Specification value" style="flex:1.8;min-width:0">
            <button class="btn btn-sm btn-ghost btn-icon btn-danger" data-spec-del aria-label="Remove specification" title="Remove row">${icon('trash')}</button>
          </div>`).join('')}</div>`
        : '<div class="muted small" style="text-align:center;padding:18px 0">No specifications yet. Tap <strong>Add a row</strong> to add things like size, weight or power.</div>';
    };
    drawMain(); drawGallery(); drawSpecs();
    const dirtyOn = () => { dirty = true; };
    el.addEventListener('input', (e) => { const r = e.target.closest('[data-spec]'); if (r) specs[Number(r.dataset.spec)][e.target.dataset.sk] = e.target.value; dirtyOn(); });
    longEditor.onChange(dirtyOn);
    $('[data-spec-add]', el).onclick = () => { specs.push({ label: '', value: '' }); drawSpecs(); dirtyOn(); };
    $('[data-specs]', el).onclick = (e) => { if (e.target.closest('[data-spec-del]')) { specs.splice(Number(e.target.closest('[data-spec]').dataset.spec), 1); drawSpecs(); dirtyOn(); } };
    $('[data-main-upload]', el).onclick = async (e) => { const files = await pickFiles(); if (!files.length) return; await busy(e.currentTarget, async () => { try { main = (await uploadFile(files[0], 1400)).url; drawMain(); dirtyOn(); } catch (err) { toastError(err); } }); };
    $('[data-main-library]', el).onclick = async () => { const u = await pickMedia('Main picture'); if (u) { main = u; drawMain(); dirtyOn(); } };
    $('[data-gallery-add]', el).onclick = async () => { const u = await pickMedia('Add to gallery'); if (u) { gallery.push(u); drawGallery(); dirtyOn(); } };
    $('[data-gallery]', el).onclick = (e) => { const b = e.target.closest('[data-gal-del]'); if (b) { gallery.splice(Number(b.dataset.galDel), 1); drawGallery(); dirtyOn(); } };
    const save = (btn) => busy(btn, async () => {
      const body = {
        id: p.id, title: f('title').value.trim(), description: f('description').value.trim(), features: f('features').value.split('\n').map((x) => x.trim()).filter(Boolean),
        longDescription: longEditor.getHtml(), specifications: specs.filter((s) => s.label.trim()), inTheBox: f('in_the_box').value,
        is_visible: f('is_visible').checked, sort_order: Number(f('sort_order').value) || 0, mainImage: main, galleryImages: gallery,
        category: f('category').value.trim(), brand: f('brand').value.trim(), stock: f('stock').value.trim(), sku: f('sku').value.trim(), price: f('price').value, originalPrice: f('original_price').value,
      };
      if (!body.title) { toast('Please give the product a name.', { error: true }); return; }
      try {
        const r = await api(isNew ? 'POST' : 'PUT', 'products', body);
        dirty = false; window.Admin.invalidatePalette(); toast('Product saved. Live in about 5 minutes.');
        if (isNew) location.hash = `product/${encodeURIComponent(r.data.id)}`;
      } catch (err) { toastError(err); }
    });
    $('[data-save]').onclick = (e) => save(e.currentTarget);
    el.addEventListener('keydown', (e) => { if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 's') { e.preventDefault(); save($('[data-save]')); } });
    $('[data-delete]', el)?.addEventListener('click', async () => {
      if (!(await confirmBox('Delete this product?', `<strong>${h(p.title)}</strong> will be removed for good. To keep it for later, switch off "Shown to visitors" instead.`, { ok: 'Delete', danger: true }))) return;
      await api('DELETE', `products?id=${encodeURIComponent(p.id)}`); dirty = false; toast('Product deleted'); location.hash = 'products';
    });
  };
})();
