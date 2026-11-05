// Medico admin: Articles (list + editor), AI writer, Products.
(() => {
  const { api, toast, toastError, busy, modal, confirmBox, pickMedia, pickFiles, uploadFile, icon, h, $, $$, fmtDate, ago, debounce, views, setHeader, skeletonRows, emptyState, statusBadge } = window.Admin;
  const CATEGORIES = ['Clinical Insights', 'Product Guides', 'Healthcare Infrastructure', 'Patient Care', 'Industry News'];
  const MARKER_RE = /\[(NEEDS SOURCE|FLAG[^\]]*)\]/g;
  const toLocalInput = (d) => { if (!d) return ''; const x = new Date(d); return new Date(x.getTime() - x.getTimezoneOffset() * 60000).toISOString().slice(0, 16); };

  /* ================= Articles list ================= */
  views.articles = async (el, [filter = 'all']) => {
    setHeader('Articles', `<a class="btn" href="#writer">${icon('writer')}<span class="desktop-only">Write with AI</span></a><a class="btn btn-primary" href="#article/new">${icon('plus')}<span class="desktop-only">New article</span></a>`);
    const FILTERS = [['all', 'All'], ['live', 'Live'], ['draft', 'Drafts'], ['review', 'Needs review'], ['ai', 'AI written']];
    el.innerHTML = `<div class="tabs" role="tablist">${FILTERS.map(([f, l]) => `<button role="tab" aria-selected="${f === filter}" data-f="${f}">${l}</button>`).join('')}</div>
      <div class="toolbar-row"><input class="input" data-search placeholder="Search articles  ( / )" aria-label="Search articles"><select class="select" data-cat style="max-width:220px" aria-label="Category"><option value="">All categories</option>${CATEGORIES.map((c) => `<option>${h(c)}</option>`).join('')}</select></div><div data-list>${skeletonRows()}</div>`;
    $$('[data-f]', el).forEach((b) => { b.onclick = () => { location.hash = `articles/${b.dataset.f}`; }; });
    const { data } = await api('GET', 'posts');
    const list = $('[data-list]', el);
    const match = (p) => ({
      all: true, live: p.status === 'published', draft: p.status === 'draft',
      review: p.status === 'draft' || (p.ai_generated && !p.reviewed_at) || p.has_markers, ai: p.ai_generated,
    }[filter]);
    const draw = () => {
      const q = $('[data-search]', el).value.trim().toLowerCase();
      const cat = $('[data-cat]', el).value;
      const rows = data.filter((p) => match(p) && (!cat || p.category === cat) && (!q || `${p.title} ${p.excerpt} ${p.topic || ''}`.toLowerCase().includes(q)));
      if (!rows.length) { list.innerHTML = emptyState('articles', data.length ? 'No articles match' : 'No articles yet', data.length ? 'Try another filter or search.' : 'Write one yourself or let the AI draft it.', `<a class="btn btn-primary" href="#article/new">${icon('plus')}New article</a> <a class="btn" href="#writer">${icon('writer')}Write with AI</a>`); return; }
      list.innerHTML = `<table class="table stack"><thead><tr><th></th><th>Title</th><th>Status</th><th>Category</th><th>Date</th><th></th></tr></thead><tbody>${rows.map((p) => `
        <tr class="is-link" data-id="${h(p.id)}">
          <td><img class="thumb" src="${h(p.cover_image || '/images/blog-featured-icu.webp')}" alt="" loading="lazy"></td>
          <td class="title-cell">${h(p.title)}${p.is_featured ? ` <span class="badge badge-soft">${icon('star')}Featured</span>` : ''}<small class="truncate">/blog/${h(p.slug)}</small></td>
          <td data-label="Status"><div class="row" style="gap:4px">${statusBadge(p)}${p.ai_generated ? (p.reviewed_at ? '<span class="badge badge-ghost">AI · reviewed</span>' : '<span class="badge badge-accent">AI · not reviewed</span>') : ''}${p.has_markers ? '<span class="badge badge-accent">Markers</span>' : ''}</div></td>
          <td data-label="Category" class="small">${h(p.category)}</td>
          <td data-label="Date" class="small muted">${h(fmtDate(p.published_at || p.created_at))}</td>
          <td class="actions">
            <button class="btn btn-sm" data-act="${p.status === 'published' ? 'unpublish' : 'publish'}">${p.status === 'published' ? 'Unpublish' : 'Publish'}</button>
            ${p.status === 'published' ? `<a class="btn btn-sm btn-ghost btn-icon" href="/blog/${encodeURIComponent(p.slug)}" target="_blank" rel="noopener" aria-label="View live">${icon('external')}</a>` : ''}
            <button class="btn btn-sm btn-ghost btn-icon btn-danger" data-act="delete" aria-label="Delete">${icon('trash')}</button>
          </td></tr>`).join('')}</tbody></table>`;
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
          if (!(await confirmBox('Delete article?', `<strong>${h(p.title)}</strong> will be removed permanently.${p.status === 'published' ? ' Its web address will stop working.' : ''}`, { ok: 'Delete', danger: true }))) return;
          data.splice(data.indexOf(p), 1); draw();
          await api('DELETE', `posts?id=${encodeURIComponent(p.id)}`);
          toast('Article deleted');
        } else {
          const status = act === 'publish' ? 'published' : 'draft';
          if (status === 'published' && p.has_markers && !(await confirmBox('Open writer markers', 'This article still contains [NEEDS SOURCE] or [FLAG] markers. Visitors never see them, but the claims behind them are unsupported. Publish anyway?', { ok: 'Publish anyway' }))) return;
          p.status = status; if (status === 'published' && !p.published_at) p.published_at = new Date().toISOString(); draw();
          await api('PATCH', 'posts', { id: p.id, status });
          toast(status === 'published' ? (p.ai_generated && !p.reviewed_at ? 'Published. Still hidden from Google until marked reviewed.' : 'Published') : 'Moved to drafts');
        }
        window.Admin.invalidatePalette();
      } catch (err) { toastError(err); views.articles(el, [filter]); }
    });
  };

  /* ================= Article editor ================= */
  function richEditor(host, html) {
    host.innerHTML = `<div class="rte">
      <div class="rte-bar" role="toolbar" aria-label="Formatting">
        <button type="button" data-cmd="formatBlock" data-arg="h2" title="Heading">H2</button>
        <button type="button" data-cmd="formatBlock" data-arg="h3" title="Subheading">H3</button>
        <button type="button" data-cmd="formatBlock" data-arg="p" title="Paragraph">¶</button>
        <span class="sep"></span>
        <button type="button" data-cmd="bold" title="Bold (Ctrl+B)"><b>B</b></button>
        <button type="button" data-cmd="italic" title="Italic (Ctrl+I)"><i>I</i></button>
        <button type="button" data-cmd="insertUnorderedList" title="Bulleted list">• List</button>
        <button type="button" data-cmd="insertOrderedList" title="Numbered list">1. List</button>
        <button type="button" data-cmd="formatBlock" data-arg="blockquote" title="Quote">“ ”</button>
        <button type="button" data-cmd="link" title="Link (Ctrl+K inside the editor)">${icon('link')}</button>
        <button type="button" data-cmd="image" title="Insert picture">${icon('image')}</button>
        <button type="button" data-cmd="table" title="Insert table">Table</button>
        <span class="sep"></span>
        <button type="button" data-cmd="removeFormat" title="Clear formatting">Tx</button>
        <span class="spacer"></span>
        <button type="button" data-cmd="markers" title="Jump to the next writer marker">${icon('alert')}<span data-marker-count></span></button>
        <button type="button" data-cmd="source" title="Edit HTML">&lt;/&gt;</button>
      </div>
      <div class="rte-body" contenteditable="true" data-placeholder="Start writing…" spellcheck="true"></div>
      <textarea class="rte-source" hidden spellcheck="false" aria-label="HTML source"></textarea>
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
    };
    const getHtml = () => (source.hidden ? body.innerHTML : source.value).replace(/<\/?mark[^>]*>/g, '');
    const setHtml = (v) => { body.innerHTML = v || ''; source.value = v || ''; highlight(); };
    setHtml(html);
    const changed = () => onChange.forEach((fn) => fn());
    body.addEventListener('input', changed);
    source.addEventListener('input', changed);
    body.addEventListener('blur', highlight);
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
        if (!marks.length) { toast('No writer markers left'); return; }
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
      } else if (cmd === 'table') {
        document.execCommand('insertHTML', false, '<table><thead><tr><th>Option</th><th>Best for</th><th>Limitation</th></tr></thead><tbody><tr><td>&nbsp;</td><td>&nbsp;</td><td>&nbsp;</td></tr></tbody></table><p><br></p>');
      } else document.execCommand(cmd, false, arg ? `<${arg}>` : undefined);
      changed();
    }
    $('.rte-bar', host).addEventListener('mousedown', (e) => { if (e.target.closest('button')) e.preventDefault(); });
    $('.rte-bar', host).addEventListener('click', (e) => { const b = e.target.closest('[data-cmd]'); if (b) run(b.dataset.cmd, b.dataset.arg); });
    return { getHtml, setHtml, highlight, onChange: (fn) => onChange.push(fn), countMarkers: () => (getHtml().match(MARKER_RE) || []).length };
  }

  views.article = async (el, [id = 'new']) => {
    el.classList.add('view-wide');
    const isNew = id === 'new';
    setHeader(`<span class="crumb">Articles /</span> ${isNew ? 'New article' : 'Edit'}`);
    el.innerHTML = `<div class="editor"><div>${skeletonRows(3)}</div><div>${skeletonRows(4)}</div></div>`;
    let post = isNew ? { title: '', slug: '', excerpt: '', content: '', status: 'draft', category: 'Product Guides', author: 'Medico Team', faq: [], gallery_images: [], is_featured: false } : (await api('GET', `posts?id=${encodeURIComponent(id)}`)).data;
    const checks = post.checks || null;
    let dirty = false;
    window.Admin.setLeaveGuard(() => !dirty);

    setHeader(`<span class="crumb">Articles /</span> ${isNew ? 'New article' : h(post.title || 'Untitled')}`, `
      <span class="muted small desktop-only" data-saved>${isNew ? '' : `Saved ${h(ago(post.updated_at))}`}</span>
      <button class="btn" data-preview>${icon('eye')}<span class="desktop-only">Preview</span></button>
      <button class="btn btn-primary" data-save title="Ctrl+S">Save</button>`);

    el.innerHTML = `<div class="editor">
      <div>
        <input class="input input-lg" data-f="title" placeholder="Article title" value="${h(post.title)}" aria-label="Title">
        <textarea class="textarea" data-f="excerpt" rows="2" placeholder="Subheading: one or two sentences on what the reader gets" style="min-height:0;margin:8px 0 16px" aria-label="Subheading">${h(post.excerpt || '')}</textarea>
        <div data-rte></div>
        <div class="card" style="margin-top:16px"><div class="card-head"><h3>Frequently asked questions</h3><span class="muted small">Shown in the article and as FAQ structured data</span><span class="spacer"></span><button class="btn btn-sm" data-faq-add>${icon('plus')}Add</button></div><div class="card-body" data-faq></div></div>
      </div>
      <aside class="editor-side">
        <section class="card"><div class="card-head"><h3>Publish</h3><span class="spacer"></span>${isNew ? '' : statusBadge(post)}</div><div class="card-body">
          <div class="field"><label for="a-status">Status</label><select class="select" id="a-status" data-f="status"><option value="draft">Draft (not on the site)</option><option value="published">Published</option></select></div>
          <div class="field"><label for="a-date">Publish date and time</label><input class="input" id="a-date" type="datetime-local" data-f="published_at" value="${h(toLocalInput(post.published_at))}"><span class="hint">A future time schedules the article. Empty means now.</span></div>
          <label class="switch" style="margin-bottom:10px"><input type="checkbox" data-f="is_featured" ${post.is_featured ? 'checked' : ''}> Featured on the Insights page</label>
          <label class="switch"><input type="checkbox" data-f="reviewed" ${!post.ai_generated || post.reviewed_at ? 'checked' : ''}> Reviewed by a person</label>
          <p class="hint" style="margin:6px 0 0">${post.ai_generated ? 'AI article: Google can index it only once this is on.' : 'Articles you write yourself count as reviewed.'}</p>
          <div class="row" style="margin-top:14px">
            ${!isNew && post.status === 'published' ? `<a class="btn btn-sm" href="/blog/${encodeURIComponent(post.slug)}" target="_blank" rel="noopener">${icon('external')}View live</a>` : ''}
            ${!isNew && post.blog_type ? `<a class="btn btn-sm" href="#writer/post/${encodeURIComponent(post.id)}">${icon('refresh')}Regenerate</a>` : ''}
            ${!isNew ? `<button class="btn btn-sm btn-ghost btn-danger" data-delete>${icon('trash')}Delete</button>` : ''}
          </div>
        </div></section>
        <section class="card"><div class="card-head"><h3>Before publishing</h3><span class="spacer"></span><span data-check-badge></span></div><div class="card-body"><ul class="checklist" data-checklist></ul>${checks ? `<details style="margin-top:10px"><summary class="small" style="cursor:pointer">Writer report (${h(checks.type || '')}, ${h(checks.model || '')})</summary><div class="small" style="margin-top:8px">
          ${(checks.typeChecks || []).length ? `<strong>Type checks</strong><ul>${checks.typeChecks.map((c) => `<li>${h(c)}</li>`).join('')}</ul>` : ''}
          <strong>Outline deviations</strong><p>${h(checks.outlineDeviations || 'None')}</p>
          ${(checks.untraceableNumbers || []).length ? `<strong>Numbers not found in your inputs</strong><ul>${checks.untraceableNumbers.map((c) => `<li>${h(c)}</li>`).join('')}</ul>` : ''}
          ${(checks.guessedInputs || []).length ? `<strong>Inputs the AI guessed</strong><p>${h(checks.guessedInputs.join(', '))}</p>` : ''}
        </div></details>` : ''}</div></section>
        <section class="card"><div class="card-head"><h3>Cover picture</h3></div><div class="card-body">
          <div class="cover-box" data-cover></div>
          <div class="row" style="margin-top:10px"><button class="btn btn-sm" data-cover-find>${icon('search')}Find a photo</button><button class="btn btn-sm" data-cover-upload>${icon('upload')}Upload</button><button class="btn btn-sm btn-ghost" data-cover-library>Library</button></div>
          <div class="field" style="margin-top:12px"><label for="a-credit">Photo credit</label><input class="input" id="a-credit" data-f="credit_text" value="${h(post.cover_credit?.text || '')}" placeholder="Photo: Name / Source, licence"><input class="input" data-f="credit_url" value="${h(post.cover_credit?.url || '')}" placeholder="https://link-to-the-photo-page" aria-label="Credit link" style="margin-top:6px"></div>
        </div></section>
        <section class="card"><div class="card-head"><h3>Search and sharing</h3></div><div class="card-body">
          <div class="serp" data-serp></div>
          <div class="field" style="margin-top:12px"><label for="a-slug">Web address <span class="counter" data-c="slug"></span></label><input class="input mono" id="a-slug" data-f="slug" value="${h(post.slug || '')}" placeholder="made-from-the-title">${post.status === 'published' ? '<span class="hint">Changing the address of a live article breaks old links.</span>' : ''}</div>
          <div class="field"><label for="a-mt">Meta title <span class="counter" data-c="meta_title"></span></label><input class="input" id="a-mt" data-f="meta_title" value="${h(post.meta_title || '')}" placeholder="Defaults to the title"></div>
          <div class="field"><label for="a-md">Meta description <span class="counter" data-c="meta_description"></span></label><textarea class="textarea" id="a-md" data-f="meta_description" rows="3" style="min-height:0" placeholder="Defaults to the subheading">${h(post.meta_description || '')}</textarea></div>
        </div></section>
        <section class="card"><div class="card-head"><h3>Details</h3></div><div class="card-body">
          <div class="field"><label for="a-cat">Category</label><input class="input" id="a-cat" data-f="category" list="a-cats" value="${h(post.category || '')}"><datalist id="a-cats">${CATEGORIES.map((c) => `<option value="${h(c)}">`).join('')}</datalist></div>
          <div class="field"><label for="a-author">Author</label><input class="input" id="a-author" data-f="author" value="${h(post.author || 'Medico Team')}"></div>
          <div class="field"><label for="a-rt">Read time</label><input class="input" id="a-rt" data-f="read_time" value="${h(post.read_time || '')}" placeholder="Worked out automatically"></div>
          <div class="field"><label>Gallery pictures</label><div class="row" data-gallery></div><button class="btn btn-sm" data-gallery-add style="margin-top:8px">${icon('plus')}Add picture</button></div>
          ${post.topic ? `<p class="small muted">Writer topic: ${h(post.topic)}</p>` : ''}
          ${(post.source_urls || []).length ? `<p class="small muted">Sources: ${post.source_urls.map((s) => `<a href="${h(s.url)}" target="_blank" rel="noopener">${h(s.source || s.title)}</a>`).join(', ')}</p>` : ''}
          ${post.review_notes ? `<p class="small muted">${h(post.review_notes)}</p>` : ''}
        </div></section>
      </aside></div>`;

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
      for (const [k, max] of Object.entries(counters)) { const n = f(k).value.length; const c = $(`[data-c="${k}"]`, el); c.textContent = `${n}/${max}`; c.classList.toggle('is-over', n > max); }
      const title = f('meta_title').value || f('title').value || 'Article title';
      const desc = f('meta_description').value || f('excerpt').value || 'The subheading appears here when no meta description is set.';
      $('[data-serp]', el).innerHTML = `<div class="serp-url">${h(location.host)} › blog › ${h(f('slug').value || 'new-article')}</div><div class="serp-title">${h(title.slice(0, 65))} | Medico Insights</div><div class="serp-desc">${h(desc.slice(0, 160))}</div>`;
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
        [needs === 0, needs ? `${needs} [NEEDS SOURCE] marker${needs > 1 ? 's' : ''}: add a source or soften the claim` : 'No [NEEDS SOURCE] markers'],
        [flags === 0, flags ? `${flags} [FLAG] block${flags > 1 ? 's' : ''}: supply the missing detail` : 'No [FLAG] blocks'],
        [unverified === 0, unverified ? `${unverified} "Unverified" value${unverified > 1 ? 's' : ''} in the text or tables` : 'No "Unverified" values'],
        [!(checks?.untraceableNumbers || []).length, (checks?.untraceableNumbers || []).length ? `${checks.untraceableNumbers.length} number(s) the AI used that are not in your inputs (see writer report)` : 'Every number traceable to your inputs'],
        [banned.length === 0, banned.length ? `Banned words: ${banned.join(', ')}` : 'No banned connectors or fillers'],
        [dashes === 0, dashes ? `${dashes} em dash${dashes > 1 ? 'es' : ''}` : 'No em dashes'],
        [colonHeads === 0, colonHeads ? `${colonHeads} heading${colonHeads > 1 ? 's' : ''} with a colon` : 'Headings read naturally'],
        [Boolean(f('meta_description').value || f('excerpt').value), 'Meta description or subheading set'],
        [Boolean(cover.url), 'Cover picture chosen'],
        [!post.ai_generated || f('reviewed').checked, 'Reviewed by a person'],
      ];
      const open = items.filter(([ok]) => !ok).length;
      $('[data-checklist]', el).innerHTML = items.map(([ok, label]) => `<li class="${ok ? 'is-done' : 'is-warn'}"><span class="state">${ok ? icon('check') : '!'}</span><span>${h(label)}</span></li>`).join('') + `<li><span class="state"></span><span class="muted">${words} words</span></li>`;
      $('[data-check-badge]', el).innerHTML = open ? `<span class="badge badge-accent">${open} open</span>` : '<span class="badge badge-solid">Ready</span>';
      return { needs, flags, unverified, open };
    };
    drawCover(); drawGallery(); drawFaq(); drawMeta(); drawChecklist();

    const markDirty = () => { dirty = true; $('[data-saved]') && ($('[data-saved]').textContent = 'Unsaved changes'); };
    el.addEventListener('input', (e) => {
      if (e.target.closest('[data-faq-i]')) { const box = e.target.closest('[data-faq-i]'); faq[Number(box.dataset.faqI)] = { q: $('[data-q]', box).value, a: $('[data-a]', box).value }; }
      markDirty(); drawMeta(); refreshPreview();
    });
    el.addEventListener('change', () => { markDirty(); drawChecklist(); });
    editor.onChange(debounce(() => { drawChecklist(); refreshPreview(); }, 400));
    editor.onChange(markDirty);

    $('[data-faq-add]', el).onclick = () => { faq.push({ q: '', a: '' }); drawFaq(); markDirty(); $$('[data-q]', el).pop().focus(); };
    $('[data-faq]', el).addEventListener('click', (e) => { if (e.target.closest('[data-faq-del]')) { faq.splice(Number(e.target.closest('[data-faq-i]').dataset.faqI), 1); drawFaq(); markDirty(); } });
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
          !(await confirmBox('Publish with open markers?', `${c.needs + c.flags} writer marker(s) remain. Visitors never see the markers, but the claims behind them are unsupported.`, { ok: 'Publish anyway' }))) return;
      await busy(btn, async () => {
        try {
          const r = await api(isNew ? 'POST' : 'PUT', 'posts', data);
          dirty = false;
          window.Admin.invalidatePalette();
          toast(data.status === 'published' ? (post.ai_generated && !data.reviewed ? 'Saved and live. Hidden from Google until reviewed.' : 'Saved and live') : 'Draft saved');
          if (isNew) { location.hash = `article/${encodeURIComponent(r.data.id)}`; return; }
          post = { ...post, ...data, slug: r.data.slug, updated_at: new Date().toISOString() };
          f('slug').value = r.data.slug;
          $('[data-saved]') && ($('[data-saved]').textContent = 'Saved just now');
        } catch (err) { toastError(err); }
      });
    }
    $('[data-save]').onclick = (e) => save(e.currentTarget);
    el.addEventListener('keydown', (e) => { if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 's') { e.preventDefault(); save($('[data-save]')); } });
    $('[data-delete]', el)?.addEventListener('click', async () => {
      if (!(await confirmBox('Delete article?', `<strong>${h(post.title)}</strong> will be removed permanently.`, { ok: 'Delete', danger: true }))) return;
      await api('DELETE', `posts?id=${encodeURIComponent(post.id)}`); dirty = false; toast('Article deleted'); location.hash = 'articles';
    });

    // Live preview: the real article template, re-rendered as you type
    let previewFrame = null;
    const refreshPreview = debounce(async () => {
      if (!previewFrame || !previewFrame.isConnected) return;
      try {
        const res = await fetch('/api/admin/preview', { method: 'POST', credentials: 'same-origin', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(collect()) });
        const y = previewFrame.contentWindow?.scrollY || 0;
        previewFrame.srcdoc = await res.text();
        previewFrame.onload = () => previewFrame.contentWindow.scrollTo(0, y);
      } catch { /* keep the last preview */ }
    }, 700);
    $('[data-preview]').onclick = () => {
      const m = modal({ title: 'Preview (updates as you type)', full: true, body: `<div class="row" style="padding:8px 12px;border-bottom:1px solid var(--line-2)"><button class="btn btn-sm" data-w="100%">Desktop</button><button class="btn btn-sm" data-w="390px">Phone</button><span class="muted small">Writer markers are hidden, exactly as visitors see it.</span></div><div style="height:calc(100% - 46px);display:flex;justify-content:center;background:var(--frame)"><iframe title="Article preview" style="border:0;width:100%;height:100%;background:#fff"></iframe></div>` });
      previewFrame = $('iframe', m.el);
      $$('[data-w]', m.el).forEach((b) => { b.onclick = () => { previewFrame.style.width = b.dataset.w; }; });
      refreshPreview();
    };
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
    const TABS = [['write', 'Write'], ['topics', 'Topics'], ['history', 'History']];
    el.innerHTML = `${!W.configured ? `<div class="notice notice-accent">${icon('alert')}<span><strong>AI writer not configured: add GROQ_API_KEY</strong> in Vercel (free key from console.groq.com). You can still manage topics and write articles yourself.</span></div>` : ''}
      <div class="tabs" role="tablist">${TABS.map(([t, l]) => `<button role="tab" aria-selected="${t === tab || (tab === 'post' && t === 'write')}" data-t="${t}">${l}</button>`).join('')}</div><div data-pane></div>`;
    $$('[data-t]', el).forEach((b) => { b.onclick = () => { location.hash = `writer/${b.dataset.t}`; }; });
    const pane = $('[data-pane]', el);
    if (tab === 'topics') return writerTopics(pane, W);
    if (tab === 'history') return writerHistory(pane, W);
    return writerFlow(pane, W, tab === 'post' ? postId : null);
  };

  async function writerFlow(pane, W, regenId) {
    const s = { mode: 'keywords', keywords: '', type: '', details: {}, guessed: [], outline: null, news: [], useNews: false, postId: regenId, step: 1 };
    if (regenId) {
      try {
        const p = (await api('GET', `posts?id=${encodeURIComponent(regenId)}`)).data;
        Object.assign(s, { keywords: p.topic || p.title, type: p.blog_type || '', outline: p.outline || null, regenTitle: p.title });
      } catch (err) { toastError(err); }
    }
    const typeOf = (id) => W.types.find((t) => t.id === id);
    const steps = () => `<div class="steps">${['Details', 'Outline', 'Draft'].map((l, i) => `<span class="${s.step === i + 1 ? 'is-on' : ''}"><b>${i + 1}</b>${l}</span>`).join('')}</div>`;
    const ai = W.configured;

    function drawDetails() {
      s.step = 1;
      const t = typeOf(s.type);
      pane.innerHTML = `${steps()}
        ${s.postId ? `<div class="notice">${icon('refresh')}<span>Regenerating <strong>${h(s.regenTitle || 'article')}</strong>. The new draft replaces its text and marks it as not reviewed; the cover and address stay.</span></div>` : ''}
        <div class="card" style="margin-bottom:16px"><div class="card-body">
          <div class="field"><label for="w-kw">Just keywords</label><textarea class="textarea" id="w-kw" data-kw rows="2" style="min-height:0" placeholder="Any words or phrases, e.g. oxygen concentrator power cut winter backup">${h(s.keywords)}</textarea>
          <span class="hint">The AI picks the blog type (unless you choose one below) and fills in reasonable details. Guessed details are marked, and facts it cannot know become [FLAG] markers instead of inventions.</span></div>
          <div class="row"><button class="btn btn-primary" data-infer ${ai ? '' : 'disabled'}>${icon('writer')}Fill in details from keywords</button></div>
        </div></div>
        <h3 class="section-title">Blog type ${t ? '' : '<span class="muted small">(or let the AI pick from keywords)</span>'}</h3>
        <div class="type-grid">${W.types.map((x) => `<button type="button" class="type-card" data-type="${x.id}" aria-pressed="${x.id === s.type}"><strong>${h(x.label)}</strong><span>${h(x.useFor)}</span></button>`).join('')}</div>
        ${t ? `<div class="card" style="margin-bottom:16px"><div class="card-head"><h3>My details: ${h(t.label)}</h3><span class="muted small">Every field is optional</span></div><div class="card-body">
          ${t.fields.map((fl) => `<div class="field"><label for="d-${fl.key}">${h(fl.label)}${s.guessed.includes(fl.key) && s.details[fl.key] ? '<span class="badge badge-accent">Guessed by AI</span>' : ''}</label>
            ${fl.type === 'textarea' ? `<textarea class="textarea" id="d-${fl.key}" data-d="${fl.key}" rows="3">${h(s.details[fl.key] || '')}</textarea>` : `<input class="input" id="d-${fl.key}" data-d="${fl.key}" value="${h(s.details[fl.key] || '')}">`}
            ${fl.hint ? `<span class="hint">${h(fl.hint)}</span>` : ''}</div>`).join('')}
          <label class="switch"><input type="checkbox" data-news ${s.useNews ? 'checked' : ''}> Use recent news reports as sources (Google News, cited at the end)</label>
        </div></div>
        <div class="row"><button class="btn btn-primary" data-outline ${ai ? '' : 'disabled'}>Create outline</button><button class="btn" data-direct ${ai ? '' : 'disabled'}>Write directly</button><span class="muted small">Outline first lets you approve the structure. Writing directly skips that step.</span></div>` : ''}`;
      const readDetails = () => { $$('[data-d]', pane).forEach((x) => { s.details[x.dataset.d] = x.value; }); s.keywords = $('[data-kw]', pane).value; const n = $('[data-news]', pane); if (n) s.useNews = n.checked; };
      $('[data-kw]', pane).addEventListener('input', (e) => { s.keywords = e.target.value; });
      pane.querySelector('.type-grid').onclick = (e) => { const b = e.target.closest('[data-type]'); if (!b) return; readDetails(); s.type = b.dataset.type; drawDetails(); };
      $$('[data-d]', pane).forEach((x) => x.addEventListener('input', () => { s.guessed = s.guessed.filter((k) => k !== x.dataset.d); }));
      $('[data-infer]', pane).onclick = (e) => busy(e.currentTarget, async () => {
        readDetails();
        if (s.keywords.trim().length < 2) { toast('Type a few words first.', { error: true }); return; }
        try {
          const r = (await api('POST', 'writer', { action: 'infer', keywords: s.keywords, type: s.type || undefined })).data;
          Object.assign(s, { type: r.type, details: { ...r.details }, guessed: r.guessed });
          drawDetails();
          toast(`${typeOf(r.type).label}: ${r.reason || 'details filled in'}`);
        } catch (err) { toastError(err); }
      });
      $('[data-outline]', pane)?.addEventListener('click', (e) => busy(e.currentTarget, async () => {
        readDetails();
        try {
          const r = (await api('POST', 'writer', { action: 'outline', type: s.type, details: s.details, guessed: s.guessed, useNews: s.useNews, topic: s.keywords })).data;
          s.outline = r.outline; s.news = r.news; drawOutline();
        } catch (err) { toastError(err); }
      }));
      $('[data-direct]', pane)?.addEventListener('click', () => { readDetails(); s.outline = null; write(); });
    }

    function drawOutline() {
      s.step = 2;
      const o = s.outline;
      pane.innerHTML = `${steps()}
        <div class="card" style="margin-bottom:16px"><div class="card-head"><h3>Outline</h3><span class="muted small">Edit anything, then approve</span></div><div class="card-body">
          <div class="field"><label for="o-h1">H1</label><input class="input" id="o-h1" data-h1 value="${h(o.h1)}"></div>
          <div data-rows></div><button class="btn btn-sm" data-add style="margin-top:8px">${icon('plus')}Add section</button>
        </div></div>
        ${o.coverageMap && o.coverageMap.length ? `<div class="card" style="margin-bottom:16px"><div class="card-head"><h3>Coverage map</h3></div><div style="overflow:auto"><table class="table"><thead><tr><th>Topic</th><th>Top pages cover it</th><th>Gap</th><th>Our angle</th></tr></thead><tbody>${o.coverageMap.map((c) => `<tr><td>${h(c.topic)}</td><td>${h(c.topPagesCover)}</td><td class="small">${h(c.gap)}</td><td class="small">${h(c.ourAngle)}</td></tr>`).join('')}</tbody></table></div></div>` : ''}
        ${o.missingInputs && o.missingInputs.length ? `<div class="notice">${icon('alert')}<div><strong>Missing inputs that would make this stronger</strong><ul style="margin:6px 0 0;padding-left:18px">${o.missingInputs.map((x) => `<li>${h(x)}</li>`).join('')}</ul><span class="small muted">You can go back and add them, or write anyway: gaps become [FLAG] markers.</span></div></div>` : ''}
        ${s.news.length ? `<div class="notice">${icon('articles')}<div><strong>${s.news.length} news report(s) will be used and cited</strong><ul style="margin:6px 0 0;padding-left:18px">${s.news.map((n) => `<li>${h(n.title)} <span class="muted">(${h(n.source)})</span></li>`).join('')}</ul></div></div>` : ''}
        <div class="row"><button class="btn btn-primary" data-approve>${icon('check')}Approve and write</button><button class="btn" data-regen>${icon('refresh')}Regenerate outline</button><button class="btn btn-ghost" data-back>Back to details</button></div>`;
      const rows = $('[data-rows]', pane);
      const drawRows = () => {
        rows.innerHTML = o.sections.map((sec, i) => `<div class="outline-row ${sec.level === 'h3' ? 'is-h3' : ''}" data-i="${i}">
          <select class="select" data-k="level" aria-label="Level"><option value="h2"${sec.level === 'h2' ? ' selected' : ''}>H2</option><option value="h3"${sec.level === 'h3' ? ' selected' : ''}>H3</option></select>
          <input class="input" data-k="heading" value="${h(sec.heading)}" aria-label="Heading">
          <input class="input words" data-k="words" type="number" min="0" value="${h(sec.words)}" aria-label="Words">
          <button class="btn btn-sm btn-ghost btn-icon up" data-move="-1" aria-label="Move up">${icon('arrowUp')}</button>
          <button class="btn btn-sm btn-ghost btn-icon" data-move="1" aria-label="Move down">${icon('arrowDown')}</button>
          <button class="btn btn-sm btn-ghost btn-icon btn-danger" data-del aria-label="Remove">${icon('x')}</button>
          <div class="meta"><input class="input small" data-k="keyword" value="${h(sec.keyword)}" placeholder="Keyword for this section"><input class="input small" data-k="drawsOn" value="${h(sec.drawsOn)}" placeholder="Draws on which detail"></div></div>`).join('');
      };
      drawRows();
      rows.addEventListener('input', (e) => { const r = e.target.closest('[data-i]'); const k = e.target.dataset.k; if (r && k) o.sections[Number(r.dataset.i)][k] = k === 'words' ? Number(e.target.value) : e.target.value; if (k === 'level') drawRows(); });
      rows.addEventListener('change', (e) => { if (e.target.dataset.k === 'level') drawRows(); });
      rows.addEventListener('click', (e) => {
        const r = e.target.closest('[data-i]'); if (!r) return; const i = Number(r.dataset.i);
        if (e.target.closest('[data-del]')) { o.sections.splice(i, 1); drawRows(); }
        const mv = e.target.closest('[data-move]'); if (mv) { const j = i + Number(mv.dataset.move); if (j >= 0 && j < o.sections.length) { [o.sections[i], o.sections[j]] = [o.sections[j], o.sections[i]]; drawRows(); } }
      });
      $('[data-add]', pane).onclick = () => { o.sections.push({ level: 'h2', heading: '', words: 150, keyword: '', drawsOn: '' }); drawRows(); $$('[data-k="heading"]', rows).pop().focus(); };
      $('[data-h1]', pane).oninput = (e) => { o.h1 = e.target.value; };
      $('[data-back]', pane).onclick = drawDetails;
      $('[data-regen]', pane).onclick = (e) => busy(e.currentTarget, async () => {
        try { const r = (await api('POST', 'writer', { action: 'outline', type: s.type, details: s.details, guessed: s.guessed, useNews: s.useNews, topic: s.keywords })).data; s.outline = r.outline; s.news = r.news; drawOutline(); toast('New outline ready'); } catch (err) { toastError(err); }
      });
      $('[data-approve]', pane).onclick = () => { o.sections = o.sections.filter((x) => x.heading.trim()); write(); };
    }

    async function write() {
      s.step = 3;
      pane.innerHTML = `${steps()}<div class="card"><div class="card-body"><p style="margin:0 0 6px"><strong>Writing the full draft…</strong></p><p class="muted small" style="margin:0">Usually 15 to 40 seconds. It then picks a credited cover photo and opens in the editor.</p><div class="progress-lines">${'<div class="skel"></div>'.repeat(3)}<div class="skel" style="width:70%"></div>${'<div class="skel"></div>'.repeat(2)}<div class="skel" style="width:45%"></div></div></div></div>`;
      try {
        const r = (await api('POST', 'writer', { action: 'write', type: s.type, details: s.details, guessed: s.guessed, outline: s.outline, news: s.news, useNews: s.useNews && !s.outline, topic: s.keywords || s.details.keyword, postId: s.postId || undefined })).data;
        window.Admin.invalidatePalette();
        toast('Draft ready. Review the checklist before publishing.');
        location.hash = `article/${encodeURIComponent(r.id)}`;
      } catch (err) {
        toastError(err);
        s.outline ? drawOutline() : drawDetails();
      }
    }
    drawDetails();
  }

  async function writerTopics(pane, W) {
    const { data } = await api('GET', 'topics');
    const typeOpts = (sel) => `<option value="">AI picks</option>${W.types.map((t) => `<option value="${t.id}"${t.id === sel ? ' selected' : ''}>${h(t.label)}</option>`).join('')}`;
    const draw = () => {
      pane.innerHTML = `<p class="muted">The daily article takes the active topic that was used least recently, picks its blog type and writes a draft${W.cron ? '' : ' (once CRON_SECRET is set)'}.</p>
        <form class="card" data-new style="margin-bottom:16px"><div class="card-body"><div class="grid-3"><div class="field"><label for="t-kw">Topic</label><input class="input" id="t-kw" name="keyword" placeholder="e.g. Ventilator maintenance" required></div><div class="field"><label for="t-type">Blog type</label><select class="select" id="t-type" name="blog_type">${typeOpts('')}</select></div><div class="field"><label for="t-notes">Notes for the writer</label><input class="input" id="t-notes" name="notes" placeholder="What to cover"></div></div><button class="btn btn-primary">${icon('plus')}Add topic</button></div></form>
        ${data.length ? `<table class="table stack"><thead><tr><th>Topic</th><th>Type</th><th>Used</th><th>Active</th><th></th></tr></thead><tbody>${data.map((t) => `<tr data-id="${h(t.id)}">
          <td class="title-cell"><input class="input" data-k="keyword" value="${h(t.keyword)}" aria-label="Topic"><input class="input small" data-k="notes" value="${h(t.notes)}" placeholder="Notes" aria-label="Notes" style="margin-top:4px"></td>
          <td data-label="Type"><select class="select" data-k="blog_type" aria-label="Type">${typeOpts(t.blog_type)}</select></td>
          <td data-label="Used" class="small muted">${t.times_used}×${t.last_used_at ? `<br>${h(ago(t.last_used_at))}` : ''}</td>
          <td data-label="Active"><label class="switch"><input type="checkbox" data-k="is_active" ${t.is_active ? 'checked' : ''} aria-label="Active"></label></td>
          <td class="actions"><button class="btn btn-sm" data-write ${W.configured ? '' : 'disabled'}>${icon('writer')}Write now</button><button class="btn btn-sm btn-ghost btn-icon btn-danger" data-del aria-label="Delete">${icon('trash')}</button></td></tr>`).join('')}</tbody></table>`
          : emptyState('writer', 'No topics yet', 'Add subjects you want articles about.')}`;
      $('[data-new]', pane).onsubmit = async (e) => {
        e.preventDefault();
        const fd = Object.fromEntries(new FormData(e.target));
        try { data.push((await api('POST', 'topics', fd)).data); draw(); toast('Topic added'); } catch (err) { toastError(err); }
      };
    };
    draw();
    const save = debounce(async (tr) => {
      const t = data.find((x) => x.id === tr.dataset.id);
      Object.assign(t, { keyword: $('[data-k="keyword"]', tr).value, notes: $('[data-k="notes"]', tr).value, blog_type: $('[data-k="blog_type"]', tr).value || null, is_active: $('[data-k="is_active"]', tr).checked });
      try { await api('PUT', 'topics', t); toast('Topic saved'); } catch (err) { toastError(err); }
    }, 600);
    pane.addEventListener('input', (e) => { const tr = e.target.closest('tr[data-id]'); if (tr) save(tr); });
    pane.addEventListener('change', (e) => { const tr = e.target.closest('tr[data-id]'); if (tr && e.target.tagName !== 'INPUT') save(tr); else if (tr && e.target.type === 'checkbox') save(tr); });
    pane.addEventListener('click', async (e) => {
      const tr = e.target.closest('tr[data-id]'); if (!tr) return;
      const t = data.find((x) => x.id === tr.dataset.id);
      if (e.target.closest('[data-del]')) {
        if (!(await confirmBox('Delete topic?', `<strong>${h(t.keyword)}</strong> will be removed. Articles already written stay.`, { ok: 'Delete', danger: true }))) return;
        data.splice(data.indexOf(t), 1); draw(); await api('DELETE', `topics?id=${encodeURIComponent(t.id)}`).catch(toastError);
      }
      if (e.target.closest('[data-write]')) {
        sessionStorage.setItem('medico_writer_prefill', JSON.stringify({ keywords: `${t.keyword}. ${t.notes || ''}`.trim(), type: t.blog_type || '' }));
        location.hash = 'writer/write';
      }
    });
  }

  async function writerHistory(pane, W) {
    const runs = W.runs;
    pane.innerHTML = `<div class="toolbar-row"><span class="muted">Every writer run, newest first.</span><span class="spacer"></span><button class="btn" data-auto ${W.configured ? '' : 'disabled'}>${icon('refresh')}Run the daily job now</button></div>
      ${runs.length ? `<table class="table stack"><thead><tr><th>When</th><th>Trigger</th><th>Type</th><th>Topic</th><th>Status</th><th>Result</th></tr></thead><tbody>${runs.map((r) => `<tr>
        <td data-label="When" class="small">${h(fmtDate(r.created_at, true))}</td>
        <td data-label="Trigger"><span class="badge">${r.trigger === 'auto' ? 'Daily' : 'Manual'}</span></td>
        <td data-label="Type" class="small">${h((W.types.find((t) => t.id === r.blog_type) || {}).label || r.blog_type || '')}</td>
        <td data-label="Topic" class="small">${h(r.topic || '')}</td>
        <td data-label="Status">${r.status === 'failed' ? '<span class="badge badge-accent">Failed</span>' : r.status === 'running' ? '<span class="badge badge-ghost">Running</span>' : r.status === 'published' ? '<span class="badge badge-solid">Published</span>' : r.status === 'draft' ? '<span class="badge">Draft</span>' : `<span class="badge badge-soft">${h(r.status)}</span>`}</td>
        <td data-label="Result" class="small">${r.post_id && r.title ? `<a href="#article/${encodeURIComponent(r.post_id)}">${h(r.title)}</a>` : ''}<div class="muted">${h(r.message || '')}</div></td></tr>`).join('')}</tbody></table>`
        : emptyState('clock', 'No runs yet', 'Write your first article to see it here.', '<a class="btn btn-primary" href="#writer/write">Write an article</a>')}`;
    $('[data-auto]', pane).onclick = (e) => busy(e.currentTarget, async () => {
      try { const r = (await api('POST', 'writer', { action: 'auto' })).data; toast(r.message, { error: r.status === 'failed' }); views.writer($('#view'), ['history']); } catch (err) { toastError(err); }
    });
  }

  // Prefill from "Write now" on a topic
  const origWriter = views.writer;
  views.writer = async (el, args) => {
    await origWriter(el, args);
    const pre = sessionStorage.getItem('medico_writer_prefill');
    if (pre && (!args[0] || args[0] === 'write')) {
      sessionStorage.removeItem('medico_writer_prefill');
      const p = JSON.parse(pre);
      const kw = $('[data-kw]', el);
      if (kw) { kw.value = p.keywords; kw.dispatchEvent(new Event('input')); if (p.type) $(`[data-type="${p.type}"]`, el)?.click(); }
    }
  };

  /* ================= Products ================= */
  views.products = async (el) => {
    setHeader('Products', `<a class="btn btn-primary" href="#product/new">${icon('plus')}<span class="desktop-only">Add product</span></a>`);
    el.innerHTML = `<div class="toolbar-row"><input class="input" data-search placeholder="Search products  ( / )" aria-label="Search products"><select class="select" data-cat style="max-width:240px" aria-label="Category"><option value="">All categories</option></select></div><div data-list>${skeletonRows()}</div>`;
    const { data } = await api('GET', 'products');
    const cats = [...new Set(data.map((p) => p.category).filter(Boolean))];
    $('[data-cat]', el).insertAdjacentHTML('beforeend', cats.map((c) => `<option>${h(c)}</option>`).join(''));
    const list = $('[data-list]', el);
    const draw = () => {
      const q = $('[data-search]', el).value.trim().toLowerCase();
      const cat = $('[data-cat]', el).value;
      const rows = data.filter((p) => (!cat || p.category === cat) && (!q || `${p.title} ${p.brand} ${p.description}`.toLowerCase().includes(q)));
      list.innerHTML = rows.length ? `<table class="table stack"><thead><tr><th></th><th>Product</th><th>Category</th><th>Brand</th><th>Availability</th><th>Shown</th><th></th></tr></thead><tbody>${rows.map((p) => `
        <tr class="is-link" data-id="${h(p.id)}"><td><img class="thumb" src="${h(p.main_image || '/images/products/oxygen.webp')}" alt="" loading="lazy"></td>
        <td class="title-cell">${h(p.title)}<small class="truncate">${h(p.description)}</small></td>
        <td data-label="Category" class="small">${h(p.category)}</td><td data-label="Brand" class="small">${h(p.brand)}</td>
        <td data-label="Availability">${p.stock === 'In Stock' ? '<span class="badge badge-solid">In stock</span>' : `<span class="badge">${h(p.stock)}</span>`}</td>
        <td data-label="Shown"><label class="switch"><input type="checkbox" data-visible ${p.is_visible ? 'checked' : ''} aria-label="Shown on the website"></label></td>
        <td class="actions"><a class="btn btn-sm btn-ghost btn-icon" href="/product/${encodeURIComponent(p.id)}" target="_blank" rel="noopener" aria-label="View">${icon('external')}</a><button class="btn btn-sm btn-ghost btn-icon btn-danger" data-del aria-label="Delete">${icon('trash')}</button></td></tr>`).join('')}</tbody></table>`
        : emptyState('products', data.length ? 'No products match' : 'No products yet', data.length ? 'Try another search.' : 'Add the first product to the catalogue.', `<a class="btn btn-primary" href="#product/new">${icon('plus')}Add product</a>`);
    };
    draw();
    $('[data-search]', el).addEventListener('input', debounce(draw, 150));
    $('[data-cat]', el).addEventListener('change', draw);
    list.addEventListener('click', async (e) => {
      const tr = e.target.closest('tr[data-id]'); if (!tr || e.target.closest('a')) return;
      const p = data.find((x) => x.id === tr.dataset.id);
      if (e.target.closest('[data-visible]')) {
        const prev = p.is_visible; p.is_visible = e.target.checked;
        try { await api('PUT', 'products', { ...toProductBody(p), is_visible: p.is_visible }); toast(p.is_visible ? 'Shown on the website' : 'Hidden from the website'); } catch (err) { p.is_visible = prev; draw(); toastError(err); }
        return;
      }
      if (e.target.closest('label.switch')) return;
      if (e.target.closest('[data-del]')) {
        if (!(await confirmBox('Delete product?', `<strong>${h(p.title)}</strong> will be removed from the catalogue permanently. Hiding it keeps it for later.`, { ok: 'Delete', danger: true }))) return;
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
    const p = one ? one.data : { title: '', category: '', brand: '', stock: 'In Stock', description: '', features: [], specifications: [], gallery_images: [], is_visible: true, sort_order: all.data.length + 1 };
    if (!p) throw new Error('Product not found.');
    const cats = [...new Set(all.data.map((x) => x.category).filter(Boolean))];
    const brands = [...new Set(all.data.map((x) => x.brand).filter(Boolean))];
    let dirty = false;
    window.Admin.setLeaveGuard(() => !dirty);
    let main = p.main_image || '';
    let gallery = [...(p.gallery_images || [])];
    let specs = [...(p.specifications || [])];
    setHeader(`<span class="crumb">Products /</span> ${isNew ? 'New product' : h(p.title)}`, `${isNew ? '' : `<a class="btn" href="/product/${encodeURIComponent(p.id)}" target="_blank" rel="noopener">${icon('external')}<span class="desktop-only">View</span></a>`}<button class="btn btn-primary" data-save title="Ctrl+S">Save</button>`);
    const inp = (k, label, v, extra = '') => `<div class="field"><label for="p-${k}">${label}</label><input class="input" id="p-${k}" data-f="${k}" value="${h(v ?? '')}" ${extra}></div>`;
    el.innerHTML = `<div class="editor"><div>
        ${inp('title', 'Product name', p.title)}
        <div class="field"><label for="p-desc">Short description</label><textarea class="textarea" id="p-desc" data-f="description" rows="2">${h(p.description)}</textarea></div>
        <div class="field"><label for="p-feat">Key features (one per line)</label><textarea class="textarea" id="p-feat" data-f="features" rows="4">${h((p.features || []).join('\n'))}</textarea></div>
        <div class="field"><label>Overview (shown in the Overview tab)</label><div data-rte></div></div>
        <div class="card" style="margin-bottom:16px"><div class="card-head"><h3>Specifications</h3><span class="spacer"></span><button class="btn btn-sm" data-spec-add>${icon('plus')}Add row</button></div><div class="card-body" data-specs></div></div>
        <div class="field"><label for="p-box">In the box (HTML allowed: lists, bold)</label><textarea class="textarea" id="p-box" data-f="in_the_box" rows="3">${h(p.in_the_box || '')}</textarea></div>
      </div><aside class="editor-side">
        <section class="card"><div class="card-head"><h3>Visibility</h3></div><div class="card-body">
          <label class="switch"><input type="checkbox" data-f="is_visible" ${p.is_visible ? 'checked' : ''}> Shown on the website</label>
          ${inp('sort_order', 'Position in the catalogue', p.sort_order, 'type="number"')}
          ${!isNew ? `<button class="btn btn-sm btn-ghost btn-danger" data-delete>${icon('trash')}Delete product</button>` : ''}
        </div></section>
        <section class="card"><div class="card-head"><h3>Main picture</h3></div><div class="card-body"><div class="cover-box" data-main></div><div class="row" style="margin-top:10px"><button class="btn btn-sm" data-main-upload>${icon('upload')}Upload</button><button class="btn btn-sm btn-ghost" data-main-library>Library</button></div>
          <div class="field" style="margin-top:12px"><label>Gallery</label><div class="row" data-gallery></div><button class="btn btn-sm" data-gallery-add style="margin-top:8px">${icon('plus')}Add picture</button></div></div></section>
        <section class="card"><div class="card-head"><h3>Catalogue details</h3></div><div class="card-body">
          <div class="field"><label for="p-category">Category</label><input class="input" id="p-category" data-f="category" list="p-cats" value="${h(p.category)}"><datalist id="p-cats">${cats.map((c) => `<option value="${h(c)}">`).join('')}</datalist></div>
          <div class="field"><label for="p-brand">Brand</label><input class="input" id="p-brand" data-f="brand" list="p-brands" value="${h(p.brand)}"><datalist id="p-brands">${brands.map((c) => `<option value="${h(c)}">`).join('')}</datalist></div>
          <div class="field"><label for="p-stock">Availability</label><input class="input" id="p-stock" data-f="stock" list="p-stocks" value="${h(p.stock)}"><datalist id="p-stocks"><option value="In Stock"><option value="Order on Request"><option value="Out of Stock"></datalist></div>
          ${inp('sku', 'SKU / model number', p.sku)}
          <div class="grid-2">${inp('price', 'Price (₹)', p.price, 'type="number" min="0"')}${inp('original_price', 'Was (₹)', p.original_price, 'type="number" min="0"')}</div>
          <p class="hint" style="margin-top:-6px">Leave the price empty to show "request a quote" only. Prices shown publicly should be real.</p>
        </div></section>
      </aside></div>`;
    const f = (k) => $(`[data-f="${k}"]`, el);
    const longEditor = richEditor($('[data-rte]', el), p.long_description || '');
    const drawMain = () => { $('[data-main]', el).innerHTML = main ? `<img src="${h(main)}" alt="">` : `<div class="cover-empty">${icon('image')}</div>`; };
    const drawGallery = () => { $('[data-gallery]', el).innerHTML = gallery.map((g, i) => `<span style="position:relative"><img class="thumb" src="${h(g)}" alt=""><button class="btn btn-sm btn-icon btn-ghost" data-gal-del="${i}" aria-label="Remove" style="position:absolute;top:-8px;right:-10px;background:#fff">${icon('x')}</button></span>`).join(''); };
    const drawSpecs = () => { $('[data-specs]', el).innerHTML = specs.length ? specs.map((s, i) => `<div class="row" data-spec="${i}" style="margin-bottom:6px;flex-wrap:nowrap"><input class="input" data-sk="label" value="${h(s.label)}" placeholder="Label"><input class="input" data-sk="value" value="${h(s.value)}" placeholder="Value"><button class="btn btn-sm btn-ghost btn-icon btn-danger" data-spec-del aria-label="Remove">${icon('x')}</button></div>`).join('') : '<p class="muted small" style="margin:0">No specifications yet.</p>'; };
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
        dirty = false; window.Admin.invalidatePalette(); toast('Product saved');
        if (isNew) location.hash = `product/${encodeURIComponent(r.data.id)}`;
      } catch (err) { toastError(err); }
    });
    $('[data-save]').onclick = (e) => save(e.currentTarget);
    el.addEventListener('keydown', (e) => { if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 's') { e.preventDefault(); save($('[data-save]')); } });
    $('[data-delete]', el)?.addEventListener('click', async () => {
      if (!(await confirmBox('Delete product?', `<strong>${h(p.title)}</strong> will be removed permanently.`, { ok: 'Delete', danger: true }))) return;
      await api('DELETE', `products?id=${encodeURIComponent(p.id)}`); dirty = false; toast('Product deleted'); location.hash = 'products';
    });
  };
})();
