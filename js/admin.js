// MEKOTEX WEBSITE MANAGEMENT SYSTEM — administrator panel.
// Every control here calls the server, which authenticates, authorises, validates and stores the change.
import { getBackend, probeVideo, fmtBytes, fmtDur, fmtDate } from './media.js';

const $ = (s, el = document) => el.querySelector(s);
const $$ = (s, el = document) => [...el.querySelectorAll(s)];
const esc = (s) => String(s ?? '').replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
const H = { 'X-Requested-With': 'mekotex' };
async function api(method, url, body) {
  const r = await fetch(url, { method, credentials: 'same-origin', headers: body instanceof FormData ? H : { ...H, 'Content-Type': 'application/json' }, body: body instanceof FormData ? body : body !== undefined ? JSON.stringify(body) : undefined });
  let d = null; try { d = await r.json(); } catch (_) { /* */ }
  if (!r.ok) { const e = new Error(d?.error || `Request failed (${r.status})`); e.status = r.status; e.body = d; throw e; }
  return d;
}
const fmtTime = (iso) => { try { return new Date(iso).toLocaleString('en-GB', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' }); } catch (_) { return ''; } };
const ckeyCrop = (c) => c ? c.map(n => +n.toFixed(4)).join(',') : '';

let root, be, hooks, me, REG, S = null, section = 'overview', busy = false, videos = [];
const SECTIONS = [
  ['overview', 'Dashboard Overview'], ['homepage', 'Homepage Management'], ['images', 'All Website Images'], ['hero', 'Homepage Video'], ['ceovideo', 'CEO Message Video'], ['videos', 'Company Videos'],
  ['texts', 'Text & Content Editor'], ['pages', 'Website Pages'], ['library', 'Media Library'], ['quality', 'Image Quality & Display'], ['preview', 'Live Website Preview'],
  ['publish', 'Publish Changes'], ['activity', 'Activity History'], ['settings', 'Admin Settings'],
];

export async function mountAdmin(el, h) {
  root = el; hooks = h; root.innerHTML = `<div class="adm-center"><span class="spinner" aria-hidden="true"></span><p class="muted">Checking access…</p></div>`;
  be = await getBackend();
  if (be.mode !== 'server') return shell(`<h1>Admin login needs the Mekotex web server</h1><p>You are viewing the <b>preview copy</b> of the website. It has no server behind it, so the Admin ID / Password page cannot open here. No data has been lost.</p><p>The admin panel opens at <b>https://your-domain/#admin</b> as soon as the website package is deployed on a server (Node.js 18+ with HTTPS). The steps are in <b>DEPLOY.md</b> inside the package.</p>`, true);
  try { me = await be.me(); } catch (_) { me = null; }
  if (!me) return renderLogin();
  if (me.mustChange) return renderChangePassword(true);
  renderDashboard();
}
function shell(inner, narrow) { root.innerHTML = `<div class="adm-auth ${narrow ? 'narrow' : ''}"><img src="img/logo-mekotex.png" alt="Mekotex" class="adm-logo" width="104" height="52"><p class="kicker">MEKOTEX WEBSITE MANAGEMENT SYSTEM</p>${inner}<p class="adm-back"><a href="#home">← Back to website</a></p></div>`; }

// ── Login & passwords ──────────────────────────────────────────────
function renderLogin(msg = '') {
  shell(`<h1>Administrator sign in</h1>
  <form class="adm-form" data-login novalidate>
    <label>Admin ID / Username<input name="username" autocomplete="username" required autocapitalize="none" spellcheck="false"></label>
    <label>Password<span class="pw"><input name="password" type="password" autocomplete="current-password" required><button type="button" class="pw-t" data-pwt aria-label="Show password">Show</button></span></label>
    <p class="form-err" role="alert" data-lerr>${esc(msg)}</p>
    <button class="btn btn-navy btn-block" type="submit">Sign in</button>
  </form><p class="muted small">Authorised administrator access only. Sign-in attempts are limited and recorded.</p>`, true);
  const f = $('[data-login]', root); f.elements.username.focus(); wirePw(root);
  f.addEventListener('submit', async (e) => {
    e.preventDefault(); const u = f.elements.username.value.trim(), p = f.elements.password.value; const err = $('[data-lerr]', root);
    f.elements.username.setAttribute('aria-invalid', String(!u)); f.elements.password.setAttribute('aria-invalid', String(!p));
    if (!u || !p) { err.textContent = !u && !p ? 'Enter your Admin ID and password.' : !u ? 'Enter your Admin ID.' : 'Enter your password.'; return; }
    const b = f.querySelector('[type=submit]'); b.disabled = true; b.textContent = 'Signing in…'; err.textContent = '';
    try { me = await be.login(u, p); f.elements.password.value = ''; me.mustChange ? renderChangePassword(true) : renderDashboard(); }
    catch (ex) { err.textContent = ex.message; b.disabled = false; b.textContent = 'Sign in'; f.elements.password.select(); }
  });
}
function wirePw(scope) { $$('[data-pwt]', scope).forEach(t => t.addEventListener('click', () => { const i = t.previousElementSibling; const show = i.type === 'password'; i.type = show ? 'text' : 'password'; t.textContent = show ? 'Hide' : 'Show'; t.setAttribute('aria-label', show ? 'Hide password' : 'Show password'); })); }
function pwForm(forced) {
  return `<form class="adm-form" data-cpw novalidate>${forced ? '<div class="adm-note">For security, replace the temporary password before using the dashboard.</div>' : ''}
    <label>Current password<span class="pw"><input name="current" type="password" autocomplete="current-password" required><button type="button" class="pw-t" data-pwt aria-label="Show password">Show</button></span></label>
    <label>New password<span class="pw"><input name="next" type="password" autocomplete="new-password" required minlength="12"><button type="button" class="pw-t" data-pwt aria-label="Show password">Show</button></span></label>
    <label>Confirm new password<input name="confirm" type="password" autocomplete="new-password" required></label>
    <p class="muted small">At least 12 characters, with upper-case and lower-case letters and a number.</p>
    <p class="form-err" role="alert" data-cerr></p><button class="btn btn-navy ${forced ? 'btn-block' : ''}" type="submit">Change password</button></form>`;
}
function wireCpw(scope, forced) {
  const f = $('[data-cpw]', scope); wirePw(scope);
  f.addEventListener('submit', async (e) => {
    e.preventDefault(); const err = $('[data-cerr]', scope); const c = f.elements.current.value, n = f.elements.next.value, k = f.elements.confirm.value;
    if (n !== k) { err.className = 'form-err'; err.textContent = 'The new passwords do not match.'; return; }
    if (n.length < 12 || !/[a-z]/.test(n) || !/[A-Z]/.test(n) || !/\d/.test(n)) { err.className = 'form-err'; err.textContent = 'Use at least 12 characters with upper-case, lower-case and a number.'; return; }
    const b = f.querySelector('[type=submit]'); b.disabled = true; err.textContent = '';
    try { await be.changePassword(c, n); me.mustChange = false; f.reset(); if (forced) renderDashboard('Password changed. Welcome to the dashboard.'); else { err.className = 'form-ok'; err.textContent = 'Password changed.'; } }
    catch (ex) { err.className = 'form-err'; err.textContent = ex.message; }
    b.disabled = false;
  });
}
function renderChangePassword(forced) { shell(`<h1>Set a new password</h1>${pwForm(forced)}<p><button class="linkish" data-out>Sign out</button></p>`, true); wireCpw(root, forced); $('[data-out]', root).addEventListener('click', signOut); $('[name=current]', root).focus(); }
async function signOut() { try { await be.logout(); } catch (_) { /* */ } me = null; S = null; renderLogin('You have been signed out.'); }
async function guard(fn) { try { return await fn(); } catch (ex) { if (ex.status === 401) { me = null; renderLogin('Your session has ended. Please sign in again.'); throw Object.assign(new Error(''), { handled: true }); } if (ex.body?.mustChange) { renderChangePassword(true); throw Object.assign(new Error(''), { handled: true }); } throw ex; } }

// ── Data ───────────────────────────────────────────────────────────
async function load() {
  if (!REG) REG = await (await fetch('cms/registry.json', { cache: 'no-cache' })).json();
  S = await guard(() => api('GET', 'api/admin/cms'));
  S.mediaById = Object.fromEntries(S.media.map(m => [m.id, m]));
  videos = await guard(() => be.listAll());
  updateBadge();
}
const draft = () => S.draft, pub = () => S.published;
const textVal = (k, layer = draft()) => k in layer.texts ? layer.texts[k] : (REG.texts[k]?.default ?? '');
function resolveSlot(slot, layer = draft()) {
  const o = layer.images[slot]; const d = REG.images[slot]?.default || null; const base = o?.media ? o : d; if (!base?.media) return null;
  const m = S.mediaById[base.media]; return { media: base.media, crop: base.crop || m?.crop || null, fit: o?.fit || 'cover', fx: o?.fx ?? 50, fy: o?.fy ?? 50, zoom: o?.zoom ?? 1, overridden: !!o };
}
const imgUrl = (media, w = 600, crop) => { const m = S.mediaById[media]; const c = crop === undefined ? m?.crop : crop; return `img/${encodeURIComponent(media)}?w=${w}${c ? `&c=${ckeyCrop(c)}` : '&c=none'}&preview=1`; };
const cropPx = (m, c) => c ? [Math.round((c[2] - c[0]) * m.w), Math.round((c[3] - c[1]) * m.h)] : [m.w, m.h];
const pageName = (p) => REG.pageTitle[p] || p;
async function saveDraft(body, okMsg) { const r = await guard(() => api('PUT', 'api/admin/cms/draft', body)); S.draft = r.draft; S.changes = r.changes; updateBadge(); if (okMsg) flash(okMsg); pingPreview(); return r; }
function updateBadge() { const n = S?.changes?.length || 0; const cp = $('[data-cpub]', root); if (cp) cp.disabled = !n; const b = $('[data-pubbadge]', root); if (b) { b.textContent = n; b.hidden = !n; } const t = $('[data-pubtop]', root); if (t) t.disabled = !n; }
function flash(t, kind = 'ok') { const f = $('[data-flash]', root); if (!f) return; f.textContent = t; f.className = 'adm-flash ' + (t ? kind : ''); clearTimeout(flash._t); if (t && kind === 'ok') flash._t = setTimeout(() => { f.textContent = ''; f.className = 'adm-flash'; }, 6000); }
const fail = (ex) => { if (!ex.handled) flash(ex.message, 'err'); };
function pingPreview() { $$('iframe[data-pv]', root).forEach(f => f.contentWindow?.postMessage('mekotex:reload-preview', location.origin)); }

// ── Shell ──────────────────────────────────────────────────────────
async function renderDashboard(msg = '') {
  root.innerHTML = `<div class="adm"><header class="adm-top"><div class="adm-top-in">
      <div class="adm-brand"><img src="img/logo-mekotex-white.png" alt="Mekotex" width="80" height="40"><span>MEKOTEX WEBSITE MANAGEMENT SYSTEM</span></div>
      <div class="adm-user"><button class="btn btn-amber btn-sm" data-pubtop disabled>Publish changes <span class="pill" data-pubbadge hidden>0</span></button><a class="btn btn-line btn-sm" href="./" target="_blank" rel="noopener">View website</a><span class="adm-who">${esc(me.username)}</span><button class="btn btn-line btn-sm" data-signout>Sign out</button></div></div></header>
    <div class="adm-layout"><nav class="adm-side" aria-label="Admin sections"><label class="sr" for="adm-sel">Section</label><select id="adm-sel" class="adm-sel" data-secsel>${SECTIONS.map(([k, t]) => `<option value="${k}">${t}</option>`).join('')}</select><ul>${SECTIONS.map(([k, t], i) => `<li><button data-sec="${k}"><span>${String(i + 1).padStart(2, '0')}</span>${t}</button></li>`).join('')}</ul></nav>
    <main class="adm-main"><div class="adm-flash" data-flash role="status" aria-live="polite"></div><div data-panel><div class="adm-center"><span class="spinner"></span></div></div></main></div>
    <div class="adm-modal" data-modal hidden role="dialog" aria-modal="true"><div class="adm-modal-in" data-modalin></div></div></div>`;
  $('[data-signout]', root).onclick = signOut;
  $('[data-pubtop]', root).onclick = () => go('publish');
  $$('[data-sec]', root).forEach(b => b.onclick = () => go(b.dataset.sec));
  $('[data-secsel]', root).onchange = (e) => go(e.target.value);
  $('[data-modal]', root).addEventListener('mousedown', (e) => { if (e.target.matches('[data-modal]')) closeModal(); });
  try { await load(); } catch (ex) { if (!ex.handled) $('[data-panel]', root).innerHTML = `<div class="adm-card"><p class="form-err">${esc(ex.message)}</p></div>`; return; }
  if (msg) flash(msg); go(section);
}
function go(sec) {
  section = sec; $$('[data-sec]', root).forEach(b => b.setAttribute('aria-current', String(b.dataset.sec === sec))); $('[data-secsel]', root).value = sec;
  const p = $('[data-panel]', root); p.innerHTML = '';
  const fn = { overview, homepage, images: imagesPanel, hero: heroPanel, ceovideo: ceoPanel, videos: videosPanel, texts: textsPanel, pages: pagesPanel, library: libraryPanel, quality: qualityPanel, preview: previewPanel, publish: publishPanel, activity: activityPanel, settings: settingsPanel }[sec];
  Promise.resolve(fn(p)).catch(fail); $('.adm-main', root).scrollTop = 0; window.scrollTo(0, 0);
}
const head = (t, sub = '', actions = '') => `<div class="adm-head"><div><h1>${t}</h1>${sub ? `<p class="muted">${sub}</p>` : ''}</div>${actions ? `<div class="adm-head-act">${actions}</div>` : ''}</div>`;

// ── 1. Overview ────────────────────────────────────────────────────
function overview(p) {
  const imgOver = Object.keys(draft().images).length, txtOver = Object.keys(draft().texts).length; const vpub = videos.filter(v => v.published).length;
  const hero = draft().settings.heroVideo ? videos.find(v => v.id === draft().settings.heroVideo) : null; const pubHero = pub().settings.heroVideo ? videos.find(v => v.id === pub().settings.heroVideo) : null;
  p.innerHTML = head('Dashboard Overview', 'Everything on the Mekotex website, managed from one place.') + `
  <div class="adm-stats">
    <div><b>${Object.keys(REG.images).length}</b><span>Image placements on the website</span></div>
    <div><b>${(draft().gallery || REG.gallery).length}</b><span>Gallery photographs</span></div>
    <div><b>${Object.keys(REG.texts).length}</b><span>Editable text fields</span></div>
    <div><b>${S.media.length}</b><span>Images in the media library</span></div>
    <div><b>${videos.length}</b><span>Videos (${vpub} published)</span></div>
    <div class="${S.changes.length ? 'warn' : ''}"><b>${S.changes.length}</b><span>Unpublished changes</span></div>
  </div>
  <div class="adm-grid2">
    <div class="adm-card"><h2>Publishing</h2>
      <p>${S.publishedAt ? `Last published <b>${fmtTime(S.publishedAt)}</b> by ${esc(S.publishedBy)}.` : 'The website shows its original approved content. Nothing has been published from the panel yet.'}</p>
      <p>${S.changes.length ? `<b>${S.changes.length}</b> change(s) are saved as a draft and are <b>not yet visible</b> to visitors.` : 'There are no unpublished changes.'}</p>
      <div class="dlg-btns" style="justify-content:flex-start"><button class="btn btn-navy" data-go="publish" ${S.changes.length ? '' : 'disabled'}>Review &amp; publish</button><button class="btn btn-line-dark" data-go="preview">Live preview</button></div></div>
    <div class="adm-card"><h2>Homepage video</h2>
      <p>${pubHero ? `Live: <b>${esc(pubHero.title)}</b>` : 'Live: none (the homepage shows the hero photograph).'}</p>
      ${(hero?.id || null) !== (pubHero?.id || null) ? `<p class="warn">Draft: ${hero ? esc(hero.title) : 'none'} — publish to apply.</p>` : ''}
      <button class="btn btn-line-dark" data-go="hero">Manage homepage video</button></div>
    <div class="adm-card"><h2>Content customised</h2><p>${imgOver} image placement(s) and ${txtOver} text field(s) differ from the original website content.</p><div class="dlg-btns" style="justify-content:flex-start"><button class="btn btn-line-dark" data-go="images">Images</button><button class="btn btn-line-dark" data-go="texts">Texts</button></div></div>
    <div class="adm-card"><h2>Recent activity</h2><ul class="adm-act">${S.activity.slice(0, 7).map(a => `<li><span>${fmtTime(a.at)}</span><b>${esc(a.action)}</b> ${esc(a.detail)} <em>${esc(a.user)}</em></li>`).join('') || '<li>No activity yet.</li>'}</ul><button class="linkish" data-go="activity">Full history</button></div>
  </div>`;
  $$('[data-go]', p).forEach(b => b.onclick = () => go(b.dataset.go));
}

// ── Slot cards (shared by Homepage and All Website Images) ─────────
function slotCard(slot) {
  const reg = REG.images[slot]; const r = resolveSlot(slot); const m = r ? S.mediaById[r.media] : null;
  const p = pub().images[slot], d = draft().images[slot]; const status = JSON.stringify(p) !== JSON.stringify(d) ? ['draft', 'Changed – not published'] : d ? ['live', 'Changed – live'] : ['orig', 'Original'];
  const others = m ? (S.usage[m.id] || []).filter(u => u.slot !== slot && !u.slot.startsWith('gallery.')).map(u => locLabel(u.slot)) : [];
  const inGallery = m ? (S.usage[m.id] || []).some(u => u.slot.startsWith('gallery.')) : false;
  const [cw, ch] = m && r ? cropPx(m, r.crop) : [0, 0];
  return `<article class="slot" data-slot="${esc(slot)}">
    <div class="slot-img ${m?.alpha ? 'alpha' : ''}">${r ? `<img src="${imgUrl(r.media, 480, r.crop)}" alt="" loading="lazy" style="object-fit:${r.fit === 'contain' || m?.alpha ? 'contain' : 'cover'};object-position:${r.fx}% ${r.fy}%">` : `<span class="tex tex-${reg.texture || 'fabric'}"></span><em>Texture (no photo)</em>`}</div>
    <div class="slot-b"><span class="badge ${status[0] === 'draft' ? 'draft' : status[0] === 'live' ? 'live' : ''}">${status[1]}</span>
      <h3>${esc(reg.position)}</h3><p class="slot-loc">${esc(pageName(reg.page))} › ${esc(reg.section)}</p>
      <p class="adm-meta">${m ? `${esc(m.name)} · ${cw} × ${ch} px shown${r.crop ? ' (cropped)' : ''} · ${r.fit}` : 'No image assigned'}</p>
      ${reg.locations.length > 1 ? `<p class="small">Appears in: ${reg.locations.map(l => `${esc(pageName(l.page))} › ${esc(l.section)}`).join('; ')}</p>` : ''}
      ${others.length || inGallery ? `<p class="small muted">Same photo also used: ${[...others.slice(0, 4), inGallery ? 'Photo Gallery' : ''].filter(Boolean).map(esc).join('; ')}${others.length > 4 ? ` +${others.length - 4} more` : ''}</p>` : ''}
      <div class="slot-acts"><button class="btn btn-sm btn-navy" data-act="replace">Replace</button><button class="btn btn-sm btn-line-dark" data-act="edit" ${r ? '' : 'disabled'}>Edit display</button><button class="btn btn-sm btn-line-dark" data-act="view">Preview on website</button><button class="btn btn-sm btn-line-dark" data-act="restore" ${d ? '' : 'disabled'}>Restore original</button></div></div></article>`;
}
const locLabel = (slot) => { const r = REG.images[slot]; return r ? `${pageName(r.page)} › ${r.section} › ${r.position}` : slot === 'home.hero.video' ? 'Homepage hero video' : slot === 'ceo.video' ? 'CEO Message video' : slot === 'ceo.video.poster' ? 'CEO Message video poster' : slot.startsWith('gallery.') ? `Photo Gallery › photo ${slot.slice(8)}` : slot; };
function wireSlots(p, rerender) {
  p.addEventListener('click', async (e) => {
    const b = e.target.closest('[data-act]'); const card = e.target.closest('[data-slot]'); if (!b || !card) return; const slot = card.dataset.slot;
    if (b.dataset.act === 'replace') pickImage(async (mid) => { try { await saveDraft({ images: { [slot]: { media: mid } }, note: `Replaced image: ${locLabel(slot)}` }, 'Image replaced in the draft. Preview, then publish to make it live.'); await reloadUsage(); rerender(); } catch (ex) { fail(ex); } });
    if (b.dataset.act === 'edit') imageEditor({ slot, onSaved: rerender });
    if (b.dataset.act === 'view') openPreview(REG.images[slot].page, slot);
    if (b.dataset.act === 'restore') { try { await saveDraft({ images: { [slot]: null }, note: `Restored original image: ${locLabel(slot)}` }, 'Original image restored in the draft.'); await reloadUsage(); rerender(); } catch (ex) { fail(ex); } }
  });
}
async function reloadUsage() { const d = await guard(() => api('GET', 'api/admin/cms')); Object.assign(S, d); S.mediaById = Object.fromEntries(S.media.map(m => [m.id, m])); updateBadge(); }
function openPreview(page, slot) { window.open(`./?preview=1${slot ? `&slot=${encodeURIComponent(slot)}` : ''}#${page === 'header' || page === 'footer' ? 'home' : page}`, '_blank', 'noopener'); }

// ── 2. Homepage ────────────────────────────────────────────────────
function homepage(p) {
  const slots = Object.keys(REG.images).filter(k => REG.images[k].page === 'home' || REG.images[k].locations.some(l => l.page === 'home'));
  const heroKeys = Object.keys(REG.texts).filter(k => REG.texts[k].page === 'home' && REG.texts[k].section === 'Hero' && !k.startsWith('ui.'));
  p.innerHTML = head('Homepage Management', 'The hero, its text and buttons, and every image on the homepage.', `<button class="btn btn-line-dark" data-pv>Preview homepage</button>`) +
    `<div class="adm-card"><h2>Hero video</h2><p>${pub().settings.heroVideo ? `Live: <b>${esc(videos.find(v => v.id === pub().settings.heroVideo)?.title || '')}</b>` : 'No uploaded hero video is live; the bundled corporate film is shown.'}</p><button class="btn btn-navy" data-go="hero">Set homepage hero video</button></div>
    <div class="adm-card"><h2>Hero text &amp; buttons</h2><div data-tedit></div></div>
    <h2 class="adm-h2">Homepage images</h2><div class="slots" data-slots>${slots.map(slotCard).join('')}</div>
    <div class="adm-card"><h2>Other homepage text</h2><p>Section headings, figures, paragraphs and button labels are in the Text &amp; Content Editor.</p><button class="btn btn-line-dark" data-gotexts>Edit homepage text</button></div>`;
  textEditorInto($('[data-tedit]', p), heroKeys);
  $('[data-pv]', p).onclick = () => openPreview('home'); $('[data-go]', p).onclick = () => go('hero'); $('[data-gotexts]', p).onclick = () => { textFilter.page = 'home'; go('texts'); };
  wireSlots($('[data-slots]', p), () => go('homepage'));
}

// ── 3. All website images ──────────────────────────────────────────
const imgFilter = { page: 'all', q: '', status: 'all' };
function imagesPanel(p) {
  const pages = [...new Set(Object.values(REG.images).map(i => i.page))];
  p.innerHTML = head('All Website Images', `Every image placement on the website (${Object.keys(REG.images).length}) plus the ${(draft().gallery || REG.gallery).length} gallery photographs. Replacing or editing an image changes that exact place on the website.`) + `
  <div class="adm-filters"><label>Page<select data-fpage><option value="all">All pages</option>${pages.map(pg => `<option value="${pg}" ${imgFilter.page === pg ? 'selected' : ''}>${esc(pageName(pg))}</option>`).join('')}<option value="gallery" ${imgFilter.page === 'gallery' ? 'selected' : ''}>Photo Gallery</option></select></label>
  <label>Status<select data-fstat><option value="all">All</option><option value="changed" ${imgFilter.status === 'changed' ? 'selected' : ''}>Changed</option><option value="draft" ${imgFilter.status === 'draft' ? 'selected' : ''}>Not yet published</option></select></label>
  <label class="grow">Search<input type="search" data-fq value="${esc(imgFilter.q)}" placeholder="Section, position or file name"></label></div><div data-imglist></div>`;
  const render = () => {
    const box = $('[data-imglist]', p);
    if (imgFilter.page === 'gallery') return galleryManager(box);
    const q = imgFilter.q.toLowerCase();
    const slots = Object.keys(REG.images).filter(k => { const r = REG.images[k]; if (imgFilter.page !== 'all' && r.page !== imgFilter.page && !r.locations.some(l => l.page === imgFilter.page)) return false;
      if (imgFilter.status === 'changed' && !draft().images[k]) return false; if (imgFilter.status === 'draft' && JSON.stringify(draft().images[k]) === JSON.stringify(pub().images[k])) return false;
      if (q) { const m = resolveSlot(k); const hay = `${r.section} ${r.position} ${pageName(r.page)} ${m ? S.mediaById[m.media]?.name : ''}`.toLowerCase(); if (!hay.includes(q)) return false; } return true; });
    const groups = {}; slots.forEach(k => { const r = REG.images[k]; const g = `${pageName(r.page)}`; (groups[g] = groups[g] || []).push(k); });
    box.innerHTML = Object.entries(groups).map(([g, ks]) => `<h2 class="adm-h2">${esc(g)} <span class="muted small">${ks.length}</span></h2><div class="slots">${ks.map(slotCard).join('')}</div>`).join('') + (imgFilter.page === 'all' ? `<h2 class="adm-h2">Photo Gallery</h2><div class="adm-card"><p>${(draft().gallery || REG.gallery).length} photographs. Choose “Photo Gallery” in the page filter to manage them.</p><button class="btn btn-line-dark" data-gal>Manage gallery photographs</button></div>` : '') || '<p class="muted">No images match.</p>';
    $('[data-gal]', box)?.addEventListener('click', () => { imgFilter.page = 'gallery'; imagesPanel(p); });
  };
  $('[data-fpage]', p).onchange = (e) => { imgFilter.page = e.target.value; render(); };
  $('[data-fstat]', p).onchange = (e) => { imgFilter.status = e.target.value; render(); };
  $('[data-fq]', p).oninput = (e) => { imgFilter.q = e.target.value; render(); };
  wireSlots($('[data-imglist]', p), () => render());
  render();
}
function galleryManager(box) {
  const list = (draft().gallery || REG.gallery).map(g => ({ ...g })); const cats = Object.keys(REG.texts).filter(k => k.startsWith('gcats.')).map(k => [k.slice(6), textVal(k)]);
  box.innerHTML = `<div class="adm-card"><p>Add, replace, remove, reorder and caption the photographs on the Photo Gallery page. Changes are saved as a draft.</p><div class="dlg-btns" style="justify-content:flex-start"><button class="btn btn-navy" data-gadd>Add photographs</button>${draft().gallery ? '<button class="btn btn-line-dark" data-greset>Restore original gallery</button>' : ''}<button class="btn btn-line-dark" data-gpv>Preview gallery</button></div></div>
  <div class="glist">${list.map((g, i) => { const m = S.mediaById[g.media]; return `<div class="gitem" data-i="${i}"><img src="${imgUrl(g.media, 320)}" alt="" loading="lazy"><div><input data-gcap value="${esc(g.caption)}" aria-label="Caption" placeholder="Caption"><select data-gcat aria-label="Category">${cats.map(([k, t]) => `<option value="${k}" ${k === g.cat ? 'selected' : ''}>${esc(t)}</option>`).join('')}</select><small class="muted">${esc(m?.name || g.media)}</small></div><div class="gbtns"><button class="btn btn-sm btn-line-dark" data-gup ${i ? '' : 'disabled'} aria-label="Move up">↑</button><button class="btn btn-sm btn-line-dark" data-gdown ${i < list.length - 1 ? '' : 'disabled'} aria-label="Move down">↓</button><button class="btn btn-sm btn-line-dark" data-grep>Replace</button><button class="btn btn-sm btn-danger-line" data-grm>Remove</button></div></div>`; }).join('')}</div>
  <div class="adm-sticky"><span class="muted small" data-gstate>No unsaved changes</span><button class="btn btn-navy" data-gsave disabled>Save gallery draft</button></div>`;
  const dirty = () => { $('[data-gsave]', box).disabled = false; $('[data-gstate]', box).textContent = 'Unsaved changes'; };
  const save = async () => { try { await saveDraft({ gallery: list, note: 'Gallery updated' }, 'Gallery saved as a draft.'); await reloadUsage(); galleryManager(box); } catch (ex) { fail(ex); } };
  box.oninput = (e) => { const it = e.target.closest('[data-i]'); if (!it) return; const g = list[+it.dataset.i]; if (e.target.matches('[data-gcap]')) g.caption = e.target.value; if (e.target.matches('[data-gcat]')) g.cat = e.target.value; dirty(); };
  box.onchange = box.oninput;
  box.onclick = (e) => {
    const it = e.target.closest('[data-i]'); const i = it ? +it.dataset.i : -1;
    if (e.target.matches('[data-gsave]')) return save();
    if (e.target.matches('[data-gpv]')) return openPreview('gallery');
    if (e.target.matches('[data-greset]')) return (async () => { try { await saveDraft({ gallery: null, note: 'Gallery restored to original' }, 'Original gallery restored in the draft.'); galleryManager(box); } catch (ex) { fail(ex); } })();
    if (e.target.matches('[data-gadd]')) return pickImage((mid) => { list.unshift({ media: mid, cat: 'site', caption: S.mediaById[mid]?.caption || '' }); save(); }, { multi: true, onMulti: (ids) => { ids.reverse().forEach(mid => list.unshift({ media: mid, cat: 'site', caption: S.mediaById[mid]?.caption || '' })); save(); } });
    if (i < 0) return;
    if (e.target.matches('[data-gup]')) { [list[i - 1], list[i]] = [list[i], list[i - 1]]; save(); }
    if (e.target.matches('[data-gdown]')) { [list[i + 1], list[i]] = [list[i], list[i + 1]]; save(); }
    if (e.target.matches('[data-grm]')) { list.splice(i, 1); save(); }
    if (e.target.matches('[data-grep]')) pickImage((mid) => { list[i].media = mid; save(); });
  };
}

// ── Image picker (library + upload) ────────────────────────────────
function pickImage(onPick, opts = {}) {
  const m = openModal(`<h2>Choose an image</h2><div class="adm-filters"><label class="grow">Search<input type="search" data-pq placeholder="File name or caption"></label><label>Show<select data-pf><option value="all">All images</option><option value="original">Original Mekotex photographs</option><option value="upload">Uploaded images</option><option value="used">Used on the website</option><option value="unused">Not used yet</option></select></label><label class="btn btn-navy upbtn">Upload new image<input type="file" accept="image/jpeg,image/png,image/webp,image/avif,image/tiff" multiple data-pup></label></div>
    <p class="small muted" data-pmsg></p>${opts.multi ? '<p class="small">Select one or more photographs, then press “Add selected”.</p>' : ''}<div class="pick" data-pick></div>${opts.multi ? '<div class="dlg-btns"><button class="btn btn-navy" data-padd disabled>Add selected</button></div>' : ''}`, 'wide');
  const sel = new Set();
  const render = () => {
    const q = $('[data-pq]', m).value.toLowerCase(), f = $('[data-pf]', m).value;
    const items = S.media.filter(x => x.kind === 'image' && (!q || `${x.name} ${x.caption}`.toLowerCase().includes(q)) && (f === 'all' || (f === 'original' && x.source === 'original') || (f === 'upload' && x.source === 'upload') || (f === 'used' && S.usage[x.id]?.length) || (f === 'unused' && !S.usage[x.id]?.length)))
      .sort((a, b) => (b.source === 'upload') - (a.source === 'upload') || String(b.createdAt).localeCompare(String(a.createdAt)) || a.name.localeCompare(b.name));
    $('[data-pick]', m).innerHTML = items.map(x => `<button class="pk ${sel.has(x.id) ? 'on' : ''}" data-mid="${esc(x.id)}" title="${esc(x.name)}"><img src="${imgUrl(x.id, 320)}" alt="" loading="lazy"><span>${esc(x.name)}</span><small>${x.w}×${x.h}${S.usage[x.id]?.length ? ` · used ${S.usage[x.id].length}×` : ''}</small></button>`).join('') || '<p class="muted">No images match.</p>';
  };
  $('[data-pq]', m).oninput = render; $('[data-pf]', m).onchange = render;
  $('[data-pick]', m).onclick = (e) => { const b = e.target.closest('[data-mid]'); if (!b) return; if (opts.multi) { sel.has(b.dataset.mid) ? sel.delete(b.dataset.mid) : sel.add(b.dataset.mid); b.classList.toggle('on'); $('[data-padd]', m).disabled = !sel.size; return; } closeModal(); onPick(b.dataset.mid); };
  if (opts.multi) $('[data-padd]', m).onclick = () => { closeModal(); opts.onMulti([...sel]); };
  $('[data-pup]', m).onchange = async (e) => {
    const files = [...e.target.files]; if (!files.length) return; const msg = $('[data-pmsg]', m); msg.textContent = `Uploading ${files.length} image(s)…`;
    try { const fd = new FormData(); files.forEach(f => fd.append('images', f)); const r = await guard(() => api('POST', 'api/admin/media', fd)); await reloadUsage(); msg.textContent = `${r.media.length} image(s) uploaded and stored as originals.`; if (!opts.multi && r.media.length === 1) { closeModal(); onPick(r.media[0].id); return; } r.media.forEach(x => sel.add(x.id)); render(); if (opts.multi) $('[data-padd]', m).disabled = !sel.size; }
    catch (ex) { msg.textContent = ex.message; }
  };
  render();
}

// ── Image editor (crop, zoom, focal point, fit, desktop & mobile preview) ──
function aspectsFor(slot) {
  const r = REG.images[slot]; const pos = r?.position || '';
  if (/hero background/i.test(pos)) return [16 / 9, null]; if (/Page header/i.test(pos)) return [21 / 9, 4 / 5]; if (/Section background/i.test(pos)) return [21 / 9, 9 / 16];
  if (/logo/i.test(pos)) return [null, null]; if (slot.startsWith('cap.')) return [16 / 10, 16 / 10]; if (slot.startsWith('product.')) return [16 / 7, 16 / 9];
  if (slot.startsWith('ceo.')) return [4 / 5, 16 / 10]; if (slot.startsWith('contact.factory')) return [null, null]; return [4 / 3, 4 / 3];
}
function imageEditor({ slot, mediaDefault, onSaved }) {
  // mediaDefault: edit a library image's own display correction (applies wherever it is used without its own crop)
  const r = slot ? resolveSlot(slot) : null; const mid = slot ? r.media : mediaDefault; const m = S.mediaById[mid]; if (!m) return;
  const st = slot ? { crop: (draft().images[slot]?.crop || r.crop || [0, 0, 1, 1]).slice(), fit: r.fit, fx: r.fx, fy: r.fy, zoom: r.zoom } : { crop: (m.crop || [0, 0, 1, 1]).slice(), fit: 'cover', fx: 50, fy: 50, zoom: 1 };
  const [desk, mob] = slot ? aspectsFor(slot) : [16 / 9, 4 / 5];
  const md = openModal(`<h2>${slot ? `Edit display — ${esc(REG.images[slot].position)}` : `Display correction — ${esc(m.name)}`}</h2>
    <p class="small muted">${slot ? `${esc(pageName(REG.images[slot].page))} › ${esc(REG.images[slot].section)} · ` : ''}${esc(m.name)} · original ${m.w} × ${m.h} px. Cropping only trims the edges; the original file is never changed.</p>
    <div class="ed"><div class="ed-l"><div class="ed-tools"><span class="small"><b>Crop</b></span><select data-asp aria-label="Crop shape"><option value="free">Free crop</option>${desk ? '<option value="desk">Match desktop shape</option>' : ''}<option value="orig">Original shape</option></select><button class="btn btn-sm btn-line-dark" data-crop-reset>Use full photo</button>${m.crop && slot ? '<button class="btn btn-sm btn-line-dark" data-crop-def>Use screen-border correction</button>' : ''}</div>
      <div class="crop-stage" data-stage><img src="api/admin/media/${encodeURIComponent(mid)}/original" alt="Original photograph" draggable="false"><div class="crop-dim"></div><div class="crop-box" data-box>${['nw', 'n', 'ne', 'e', 'se', 's', 'sw', 'w'].map(h => `<span class="ch ch-${h}" data-h="${h}"></span>`).join('')}<i class="focal" data-focal></i></div></div>
      <p class="small muted" data-cropinfo></p></div>
    <div class="ed-r">${slot ? `<fieldset class="ed-fit"><legend class="small"><b>Display mode</b></legend>${[['cover', 'Cover', 'fills the area'], ['contain', 'Contain', 'whole photo, may show bands'], ['natural', 'Natural', 'original shape']].map(([v, t, s]) => `<label><input type="radio" name="fit" value="${v}" ${st.fit === v ? 'checked' : ''}> ${t} <small class="muted">${s}</small></label>`).join('')}</fieldset>
      <label class="small"><b>Zoom</b> <output data-zv>${st.zoom.toFixed(2)}×</output><input type="range" min="1" max="3" step="0.05" value="${st.zoom}" data-zoom></label>
      <p class="small"><b>Focal point</b> — click a preview to choose what stays in view. <output data-fv>${Math.round(st.fx)}%, ${Math.round(st.fy)}%</output></p>` : '<p class="small">This correction becomes the default framing of this photograph everywhere it is used (unless a placement has its own crop).</p>'}
      <div class="pv-wrap"><div><small>Desktop</small><div class="pv pv-d" data-pvd style="${desk ? `aspect-ratio:${desk}` : ''}"><img alt="" data-pimg></div></div><div><small>Mobile</small><div class="pv pv-m" data-pvm style="${mob ? `aspect-ratio:${mob}` : ''}"><img alt="" data-pimg></div></div></div></div></div>
    <p class="form-err" data-eerr></p>
    <div class="dlg-btns"><button class="btn btn-line-dark" data-cancel>Cancel</button>${slot ? '<button class="btn btn-line-dark" data-replace>Replace image</button>' : ''}<button class="btn btn-line-dark" data-restore>${slot ? 'Restore original' : 'Remove correction'}</button><button class="btn btn-line-dark" data-pvsite>${slot ? 'Save & preview on website' : 'Save & preview'}</button><button class="btn btn-navy" data-save>Save changes</button></div>`, 'wide');
  const stage = $('[data-stage]', md), box = $('[data-box]', md), stageImg = $('img', stage);
  const ratio = () => { const v = $('[data-asp]', md).value; return v === 'desk' ? desk * m.h / m.w : v === 'orig' ? 1 : null; }; // in normalised units w/h
  const drawBox = () => { const [x0, y0, x1, y1] = st.crop; Object.assign(box.style, { left: x0 * 100 + '%', top: y0 * 100 + '%', width: (x1 - x0) * 100 + '%', height: (y1 - y0) * 100 + '%' }); const f = $('[data-focal]', md); f.style.left = st.fx + '%'; f.style.top = st.fy + '%'; f.hidden = !slot; const [cw, ch] = cropPx(m, st.crop); $('[data-cropinfo]', md).textContent = `Shown area: ${cw} × ${ch} px${cw >= 3840 ? ' (4K-wide)' : cw >= 1920 ? ' (full-HD-wide)' : cw >= 1280 ? ' (HD-wide)' : ' (below HD width — may look soft on large screens)'}`; };
  let pvT; const drawPv = () => { clearTimeout(pvT); pvT = setTimeout(() => { $$('[data-pimg]', md).forEach(img => { img.src = imgUrl(mid, 800, st.crop); img.style.cssText = `object-fit:${st.fit === 'contain' ? 'contain' : 'cover'};object-position:${st.fx}% ${st.fy}%;${st.zoom > 1 ? `transform:scale(${st.zoom});transform-origin:${st.fx}% ${st.fy}%;` : ''}`; }); $$('.pv', md).forEach((pv, i) => { const a = [desk, mob][i]; const [cw, ch] = cropPx(m, st.crop); pv.style.aspectRatio = (st.fit === 'natural' || !a) ? `${cw}/${ch}` : a; pv.classList.toggle('img-contain', st.fit === 'contain'); }); }, 250); };
  const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
  let drag = null;
  stage.addEventListener('pointerdown', (e) => { const h = e.target.dataset.h; if (!h && e.target !== box && !e.target.closest('[data-box]')) return; e.preventDefault(); stage.setPointerCapture(e.pointerId); drag = { h: h || 'move', x: e.clientX, y: e.clientY, c: st.crop.slice() }; });
  stage.addEventListener('pointermove', (e) => {
    if (!drag) return; const rc = stage.getBoundingClientRect(); const dx = (e.clientX - drag.x) / rc.width, dy = (e.clientY - drag.y) / rc.height; let [x0, y0, x1, y1] = drag.c; const MIN = 0.06;
    if (drag.h === 'move') { const w = x1 - x0, hh = y1 - y0; x0 = clamp(x0 + dx, 0, 1 - w); y0 = clamp(y0 + dy, 0, 1 - hh); x1 = x0 + w; y1 = y0 + hh; }
    else { if (drag.h.includes('w')) x0 = clamp(x0 + dx, 0, x1 - MIN); if (drag.h.includes('e')) x1 = clamp(x1 + dx, x0 + MIN, 1); if (drag.h.includes('n')) y0 = clamp(y0 + dy, 0, y1 - MIN); if (drag.h.includes('s')) y1 = clamp(y1 + dy, y0 + MIN, 1);
      const R = ratio(); if (R) { const w = x1 - x0; let hh = w / R; if (drag.h.includes('n')) { y0 = clamp(y1 - hh, 0, y1 - MIN); hh = y1 - y0; } else { y1 = clamp(y0 + hh, y0 + MIN, 1); hh = y1 - y0; } const nw = hh * R; if (drag.h.includes('w')) x0 = x1 - nw; else x1 = x0 + nw; x0 = clamp(x0, 0, 1); x1 = clamp(x1, 0, 1); } }
    st.crop = [x0, y0, x1, y1].map(n => +n.toFixed(4)); drawBox();
  });
  const endDrag = () => { if (drag) { drag = null; drawPv(); } }; stage.addEventListener('pointerup', endDrag); stage.addEventListener('pointercancel', endDrag);
  $('[data-asp]', md).onchange = () => { const R = ratio(); if (!R) return; let [x0, y0, x1, y1] = st.crop; const cx = (x0 + x1) / 2, cy = (y0 + y1) / 2; let w = x1 - x0, hh = w / R; if (hh > 1) { hh = 1; w = hh * R; } if (w > 1) { w = 1; hh = w / R; } x0 = clamp(cx - w / 2, 0, 1 - w); y0 = clamp(cy - hh / 2, 0, 1 - hh); st.crop = [x0, y0, x0 + w, y0 + hh].map(n => +n.toFixed(4)); drawBox(); drawPv(); };
  $('[data-crop-reset]', md).onclick = () => { st.crop = [0, 0, 1, 1]; drawBox(); drawPv(); };
  $('[data-crop-def]', md)?.addEventListener('click', () => { st.crop = m.crop.slice(); drawBox(); drawPv(); });
  if (slot) {
    $$('input[name=fit]', md).forEach(i => i.onchange = () => { st.fit = i.value; drawPv(); });
    $('[data-zoom]', md).oninput = (e) => { st.zoom = +e.target.value; $('[data-zv]', md).textContent = st.zoom.toFixed(2) + '×'; drawPv(); };
    $$('.pv', md).forEach(pv => pv.addEventListener('click', (e) => { const rc = pv.getBoundingClientRect(); st.fx = Math.round(clamp((e.clientX - rc.left) / rc.width * 100, 0, 100)); st.fy = Math.round(clamp((e.clientY - rc.top) / rc.height * 100, 0, 100)); $('[data-fv]', md).textContent = `${st.fx}%, ${st.fy}%`; drawBox(); drawPv(); }));
  }
  const full = (c) => c[0] <= 0.0001 && c[1] <= 0.0001 && c[2] >= 0.9999 && c[3] >= 0.9999;
  const save = async () => {
    const err = $('[data-eerr]', md); err.textContent = '';
    try {
      if (slot) { const sameAsDefault = JSON.stringify(st.crop) === JSON.stringify(m.crop || [0, 0, 1, 1]); await saveDraft({ images: { [slot]: { media: mid, crop: sameAsDefault ? null : st.crop, fit: st.fit, fx: st.fx, fy: st.fy, zoom: st.zoom } }, note: `Image display edited: ${locLabel(slot)}` }, 'Display settings saved as a draft.'); }
      else { await guard(() => api('PATCH', `api/admin/media/${encodeURIComponent(mid)}`, { crop: full(st.crop) ? null : st.crop })); await reloadUsage(); flash('Display correction saved. It applies wherever this photograph uses its default framing (after publishing for placements on the live site).'); }
      return true;
    } catch (ex) { if (!ex.handled) err.textContent = ex.message; return false; }
  };
  $('[data-save]', md).onclick = async () => { if (await save()) { closeModal(); onSaved?.(); } };
  $('[data-pvsite]', md).onclick = async () => { if (await save()) { openPreview(slot ? REG.images[slot].page : 'gallery', slot); } };
  $('[data-cancel]', md).onclick = closeModal;
  $('[data-restore]', md).onclick = async () => { try { if (slot) await saveDraft({ images: { [slot]: null }, note: `Restored original image: ${locLabel(slot)}` }, 'Original image restored in the draft.'); else { await guard(() => api('PATCH', `api/admin/media/${encodeURIComponent(mid)}`, { crop: null })); await reloadUsage(); flash('Display correction removed; the full original photograph is used.'); } closeModal(); onSaved?.(); } catch (ex) { fail(ex); } };
  $('[data-replace]', md)?.addEventListener('click', () => { closeModal(); pickImage(async (nid) => { try { await saveDraft({ images: { [slot]: { media: nid } }, note: `Replaced image: ${locLabel(slot)}` }, 'Image replaced in the draft.'); await reloadUsage(); onSaved?.(); imageEditor({ slot, onSaved }); } catch (ex) { fail(ex); } }); });
  stageImg.onload = () => { drawBox(); drawPv(); }; drawBox(); drawPv();
}

// Modal helpers
function openModal(html, size = '') { const m = $('[data-modal]', root); const inn = $('[data-modalin]', m); inn.className = 'adm-modal-in ' + size; inn.innerHTML = `<button class="lb-x dark" data-mclose aria-label="Close">×</button>${html}`; m.hidden = false; document.body.classList.add('noscroll'); $('[data-mclose]', m).onclick = closeModal; m.onkeydown = (e) => { if (e.key === 'Escape') closeModal(); }; setTimeout(() => (inn.querySelector('input, select, textarea, button:not([data-mclose])') || inn).focus?.(), 30); return inn; }
function closeModal() { const m = $('[data-modal]', root); if (!m || m.hidden) return; $$('video', m).forEach(v => { v.pause(); v.removeAttribute('src'); v.load(); }); m.hidden = true; document.body.classList.remove('noscroll'); }
function confirmBox(title, msg, yes = 'Delete') { return new Promise((resolve) => { const d = document.querySelector('[data-dlg]'); $('[data-dlgt]', d).textContent = title; $('[data-dlgm]', d).textContent = msg; $('[data-dlgyes]', d).textContent = yes; d.hidden = false; const no = $('[data-dlgno]', d), y = $('[data-dlgyes]', d); no.focus(); const done = (r) => { d.hidden = true; no.onclick = y.onclick = null; d.onkeydown = null; resolve(r); }; no.onclick = () => done(false); y.onclick = () => done(true); d.onkeydown = (e) => { if (e.key === 'Escape') done(false); }; }); }

// ── 4. Homepage hero video ─────────────────────────────────────────
function heroPanel(p) {
  const dId = draft().settings.heroVideo || null, pId = pub().settings.heroVideo || null; const hist = (pub().settings.heroHistory || []).map(id => videos.find(v => v.id === id)).filter(Boolean);
  const ytOf = (l) => l.settings.heroYouTube || null; const ytD = ytOf(draft()), ytL = ytOf(pub());
  const vRow = (v) => `<label class="hv ${v.id === dId ? 'on' : ''}"><input type="radio" name="hero" value="${esc(v.id)}" ${v.id === dId ? 'checked' : ''}><span class="hv-th">${v.thumb ? `<img src="${esc(v.thumb)}" alt="">` : ''}</span><span><b>${esc(v.title)}</b><small>${esc(v.category)} · ${v.duration ? fmtDur(v.duration) : ''} · ${fmtBytes(v.size)}${v.id === pId ? ' · <em class="badge live">Live on homepage</em>' : ''}${v.id === dId && v.id !== pId ? ' · <em class="badge draft">Selected – not published</em>' : ''}</small></span><button type="button" class="btn btn-sm btn-line-dark" data-hpv="${esc(v.id)}">Preview</button><button type="button" class="btn btn-sm btn-line-dark" data-hpost="${esc(v.id)}">Poster image</button></label>`;
  p.innerHTML = head('Set Homepage Hero Video', 'Only one video is shown at a time. It plays in a loop behind the homepage heading, with sound once the visitor taps or clicks the page (browsers do not allow sound before that). If nothing is selected here, the bundled Mekotex corporate film (site/video/mekotex-corporate.mp4) is shown.') + `
  <div class="adm-card"><div class="hv-state"><div><small class="muted">Live now</small><p><b>${pId ? esc(videos.find(v => v.id === pId)?.title || '—') : 'None selected — bundled corporate film shown'}</b></p></div><div><small class="muted">Draft selection</small><p><b>${dId ? esc(videos.find(v => v.id === dId)?.title || '—') : 'None'}</b>${dId !== pId ? ' <span class="badge draft">not published</span>' : ''}</p></div></div>
  <div class="dlg-btns" style="justify-content:flex-start"><button class="btn btn-navy" data-hpub ${dId !== pId || ytD !== ytL ? '' : 'disabled'}>Publish homepage video</button><button class="btn btn-line-dark" data-hnone ${dId ? '' : 'disabled'}>Unpublish (show photograph)</button>${hist.length ? `<button class="btn btn-line-dark" data-hprev>Restore previous: ${esc(hist[0].title)}</button>` : ''}<button class="btn btn-line-dark" data-hview>Preview homepage</button></div></div>
  <div class="adm-card"><h2>YouTube video in the hero</h2><p class="small muted">Optional. Plays muted in a loop instead of the bundled film. A click on the picture opens the video on YouTube. An uploaded hero video selected below takes priority over the YouTube video.</p>
  <p>Live: <b>${ytL ? `youtu.be/${esc(ytL)}` : 'None'}</b> · Draft: <b>${ytD ? `youtu.be/${esc(ytD)}` : 'None'}</b>${ytD !== ytL ? ' <span class="badge draft">not published</span>' : ''}</p>
  <form data-hytf style="margin-top:14px"><label>YouTube link<input name="url" type="url" inputmode="url" placeholder="https://www.youtube.com/watch?v=…" value="${ytD ? `https://www.youtube.com/watch?v=${esc(ytD)}` : ''}" required></label><p class="form-err" data-hyerr></p><div class="dlg-btns" style="justify-content:flex-start"><button class="btn btn-navy">Save YouTube link</button><button type="button" class="btn btn-line-dark" data-hytnone ${ytD ? '' : 'disabled'}>Remove YouTube video</button></div></form></div>
  <div class="adm-card"><h2>Choose the hero video</h2>${videos.length ? `<div class="hvlist">${videos.map(vRow).join('')}</div>` : '<p class="muted">No videos uploaded yet.</p>'}
  <p class="small muted">Hero videos are served from the Mekotex server and do not need to be listed on the public Videos page. Recommended: MP4 (H.264), 1920×1080 or 3840×2160, 15–40 seconds, no sound needed.</p></div>
  <div class="adm-card"><h2>Upload a new hero video</h2><div data-hup></div></div>`;
  $$('input[name=hero]', p).forEach(i => i.onchange = async () => { try { await saveDraft({ settings: { heroVideo: i.value }, note: 'Homepage hero video selected' }, 'Hero video selected as a draft. Publish to show it on the homepage.'); heroPanel(p); } catch (ex) { fail(ex); } });
  $('[data-hpub]', p).onclick = () => publishNow('Homepage hero video', () => heroPanel(p));
  $('[data-hytf]', p).onsubmit = async (e) => { e.preventDefault(); const err = $('[data-hyerr]', p); err.textContent = ''; try { await saveDraft({ settings: { heroYouTube: e.target.elements.url.value }, note: 'Homepage hero YouTube link' }, 'YouTube link saved as a draft. Publish to show it on the homepage.'); heroPanel(p); } catch (ex) { err.textContent = ex.message || 'Could not save the link.'; } };
  $('[data-hytnone]', p).onclick = async () => { try { await saveDraft({ settings: { heroYouTube: null }, note: 'Homepage hero YouTube video removed' }, 'YouTube video removed from the draft. Publish to apply.'); heroPanel(p); } catch (ex) { fail(ex); } };
  $('[data-hnone]', p).onclick = async () => { try { await saveDraft({ settings: { heroVideo: null }, note: 'Homepage hero video removed' }, 'Hero video removed from the draft. Publish to show the photograph again.'); heroPanel(p); } catch (ex) { fail(ex); } };
  $('[data-hprev]', p)?.addEventListener('click', async () => { try { await saveDraft({ settings: { heroVideo: hist[0].id }, note: 'Previous homepage video restored' }, 'Previous hero video restored to the draft. Publish to apply.'); heroPanel(p); } catch (ex) { fail(ex); } });
  $('[data-hview]', p).onclick = () => openPreview('home');
  $$('[data-hpv]', p).forEach(b => b.onclick = (e) => { e.preventDefault(); previewVideo(videos.find(v => v.id === b.dataset.hpv)); });
  $$('[data-hpost]', p).forEach(b => b.onclick = (e) => { e.preventDefault(); const v = videos.find(x => x.id === b.dataset.hpost); posterUpload(v, () => heroPanel(p)); });
  uploader($('[data-hup]', p), { asHero: true, done: () => heroPanel(p) });
}
function posterUpload(v, done) {
  const m = openModal(`<h2>Poster image — ${esc(v.title)}</h2><p>The poster is shown before the video starts and on devices that do not autoplay video.</p>${v.thumb ? `<img src="${esc(v.thumb)}" alt="" class="poster-now">` : ''}<form class="adm-form" data-pf><label>Upload poster (JPG, PNG or WebP)<input type="file" name="thumb" accept="image/jpeg,image/png,image/webp" required></label><p class="form-err" data-perr></p><div class="dlg-btns"><button type="button" class="btn btn-line-dark" data-cancel>Cancel</button><button class="btn btn-navy">Save poster</button></div></form>`);
  $('[data-cancel]', m).onclick = closeModal;
  $('[data-pf]', m).onsubmit = async (e) => { e.preventDefault(); const f = e.target.elements.thumb.files[0]; if (!f) { $('[data-perr]', m).textContent = 'Choose an image.'; return; } try { await guard(() => be.replaceThumb(v.id, f)); videos = await be.listAll(); hooks.invalidateVideos(); closeModal(); flash('Poster image saved.'); done(); } catch (ex) { $('[data-perr]', m).textContent = ex.message; } };
}
async function publishNow(what, done) { try { const r = await guard(() => api('POST', 'api/admin/cms/publish', { note: what })); flash(`Published (version ${r.version}). The public website now shows the change.`); await load(); hooks.invalidateVideos(); done?.(); } catch (ex) { fail(ex); } }
function previewVideo(v) { openModal(`<h2>${esc(v.title)}</h2><div class="adm-pv"><video controls playsinline preload="metadata" ${v.thumb ? `poster="${esc(v.thumb)}"` : ''} src="${esc(v.video)}"></video></div><p class="muted small">${v.published ? 'Published on the Videos page.' : 'Not published on the Videos page.'}</p>`, 'wide'); }


// ── CEO message video (upload or YouTube link) ─────────────────────
function ceoPanel(p) {
  const d = draft().settings.ceoVideo || null, l = pub().settings.ceoVideo || null; const same = JSON.stringify(d) === JSON.stringify(l) && (draft().settings.ceoPoster || null) === (pub().settings.ceoPoster || null);
  const name = (c) => !c ? 'None' : c.type === 'youtube' ? `YouTube link (${c.yt})` : `Uploaded video: ${videos.find(v => v.id === c.id)?.title || '—'}`;
  const posterId = draft().settings.ceoPoster || null; const mode = d?.type || 'youtube';
  const textKeys = ['ceo.videoTitle', 'ceo.name', 'ceo.title', 'ceo.message'];
  const vRow = (v) => `<label class="hv ${d?.type === 'upload' && d.id === v.id ? 'on' : ''}"><input type="radio" name="ceov" value="${esc(v.id)}" ${d?.type === 'upload' && d.id === v.id ? 'checked' : ''}><span class="hv-th">${v.thumb ? `<img src="${esc(v.thumb)}" alt="">` : ''}</span><span><b>${esc(v.title)}</b><small>${v.duration ? fmtDur(v.duration) : ''} · ${fmtBytes(v.size)}</small></span><button type="button" class="btn btn-sm btn-line-dark" data-cpv="${esc(v.id)}">Preview</button><button type="button" class="btn btn-sm btn-line-dark" data-cpost="${esc(v.id)}">Poster image</button></label>`;
  p.innerHTML = head('CEO Message Video', 'Show a video on the CEO’s Message page: upload a video file or paste a YouTube link. Visitors press play to watch it inside the page; it never starts with sound by itself.') + `
  <div class="adm-card"><div class="hv-state"><div><small class="muted">Live now</small><p><b>${esc(name(l))}</b></p></div><div><small class="muted">Draft</small><p><b>${esc(name(d))}</b>${same ? '' : ' <span class="badge draft">not published</span>'}</p></div></div>
    <div class="dlg-btns" style="justify-content:flex-start"><button class="btn btn-navy" data-cpub ${S.changes.some(c => c.key === 'ceoVideo' || c.key === 'ceoPoster' || c.key.startsWith('ceo.')) ? '' : 'disabled'}>Publish CEO message</button><button class="btn btn-line-dark" data-cview>Preview CEO page</button><button class="btn btn-line-dark" data-cnone ${d ? '' : 'disabled'}>Remove video</button></div></div>
  <div class="adm-card"><h2>1. Choose the video</h2><div class="seg" role="group" aria-label="Video source"><button type="button" class="${mode === 'youtube' ? 'on' : ''}" data-cm="youtube">YouTube link</button><button type="button" class="${mode === 'upload' ? 'on' : ''}" data-cm="upload">Upload a video</button></div>
    <div data-cyt ${mode === 'youtube' ? '' : 'hidden'}><form class="adm-form" data-ytf style="margin-top:14px"><label>YouTube link<input name="url" type="url" inputmode="url" placeholder="https://www.youtube.com/watch?v=…" value="${d?.type === 'youtube' ? `https://www.youtube.com/watch?v=${esc(d.yt)}` : ''}" required></label><p class="form-err" data-yerr></p><div class="dlg-btns" style="justify-content:flex-start"><button class="btn btn-navy">Use this YouTube video</button></div></form>
      ${d?.type === 'youtube' ? `<div class="ceo-adm-pv"><iframe src="https://www.youtube-nocookie.com/embed/${esc(d.yt)}?rel=0" title="YouTube preview" allow="encrypted-media; picture-in-picture; fullscreen" allowfullscreen></iframe></div>
      <p class="small"><b>Poster image:</b> ${posterId ? esc(S.mediaById[posterId]?.name || '') : 'YouTube’s own thumbnail'} <button type="button" class="linkish" data-cposter>Choose from media library</button>${posterId ? ' · <button type="button" class="linkish" data-cposterx>Use YouTube thumbnail</button>' : ''}</p>` : ''}</div>
    <div data-cup ${mode === 'upload' ? '' : 'hidden'} style="margin-top:14px">${videos.length ? `<div class="hvlist">${videos.map(vRow).join('')}</div>` : '<p class="muted">No videos uploaded yet.</p>'}<h3 style="margin:18px 0 10px">Upload a new video</h3><div data-cupl></div></div></div>
  <div class="adm-card"><h2>2. Title and written message</h2><p class="small muted">The written message is optional and appears under the video. Only publish text approved by the CEO.</p><div data-ctexts></div></div>`;
  textEditorInto($('[data-ctexts]', p), textKeys);
  const re = () => ceoPanel(p); const set = async (body, msg) => { try { await saveDraft({ settings: body, note: 'CEO message video' }, msg); re(); } catch (ex) { fail(ex); } };
  $$('[data-cm]', p).forEach(b => b.onclick = () => { $$('[data-cm]', p).forEach(x => x.classList.toggle('on', x === b)); $('[data-cyt]', p).hidden = b.dataset.cm !== 'youtube'; $('[data-cup]', p).hidden = b.dataset.cm !== 'upload'; });
  $('[data-ytf]', p).onsubmit = async (e) => { e.preventDefault(); const err = $('[data-yerr]', p); err.textContent = ''; try { await saveDraft({ settings: { ceoVideo: { type: 'youtube', url: e.target.elements.url.value } }, note: 'CEO message video: YouTube link' }, 'YouTube video saved as a draft. Preview it, then publish.'); re(); } catch (ex) { if (!ex.handled) err.textContent = ex.message; } };
  $$('input[name=ceov]', p).forEach(i => i.onchange = () => set({ ceoVideo: { type: 'upload', id: i.value }, ceoPoster: null }, 'Video selected as a draft. Preview it, then publish.'));
  $$('[data-cpv]', p).forEach(b => b.onclick = (e) => { e.preventDefault(); previewVideo(videos.find(v => v.id === b.dataset.cpv)); });
  $$('[data-cpost]', p).forEach(b => b.onclick = (e) => { e.preventDefault(); posterUpload(videos.find(v => v.id === b.dataset.cpost), re); });
  $('[data-cposter]', p)?.addEventListener('click', () => pickImage((mid) => set({ ceoPoster: mid }, 'Poster image saved as a draft.')));
  $('[data-cposterx]', p)?.addEventListener('click', () => set({ ceoPoster: null }, 'YouTube thumbnail will be used.'));
  $('[data-cnone]', p).onclick = () => set({ ceoVideo: null, ceoPoster: null }, 'Video removed from the draft. Publish to remove it from the website.');
  $('[data-cview]', p).onclick = () => openPreview('ceo');
  $('[data-cpub]', p).onclick = () => publishNow('CEO message', re);
  uploader($('[data-cupl]', p), { done: async () => { const v = videos[0]; if (v) await set({ ceoVideo: { type: 'upload', id: v.id }, ceoPoster: null }, `“${v.title}” uploaded and selected as a draft. Preview it, then publish.`); else re(); } });
}

// ── 5. Company videos ──────────────────────────────────────────────
function videosPanel(p) {
  const pubN = videos.filter(v => v.published).length;
  p.innerHTML = head('Company Videos', 'Videos for the public Videos page. Only published videos are visible to visitors.') + `
  <div class="adm-stats s4"><div><b>${videos.length}</b><span>Total videos</span></div><div><b>${pubN}</b><span>Published</span></div><div><b>${videos.length - pubN}</b><span>Unpublished</span></div><div><b>${fmtBytes(videos.reduce((a, v) => a + (v.size || 0), 0))}</b><span>Storage used</span></div></div>
  <div class="adm-card"><h2>Upload a video</h2><div data-vup></div></div>
  ${videos.length ? `<div class="adm-list">${videos.map(vrow).join('')}</div>` : '<div class="adm-card adm-empty"><h3>No videos yet</h3><p class="muted">Upload the first Mekotex video. It stays private until you publish it.</p></div>'}`;
  uploader($('[data-vup]', p), { done: () => videosPanel(p) });
  p.onclick = async (e) => {
    const b = e.target.closest('[data-vact]'); if (!b || busy) return; const v = videos.find(x => x.id === b.dataset.id); if (!v) return; const act = b.dataset.vact;
    if (act === 'preview') return previewVideo(v);
    if (act === 'edit') return editVideo(v, () => videosPanel(p));
    if (act === 'delete') { if (!(await confirmBox('Delete this video?', `“${v.title}” and its files will be removed permanently${v.published ? ' and taken off the public website' : ''}. This cannot be undone.`))) return; }
    busy = true; b.disabled = true;
    try { if (act === 'delete') await guard(() => be.remove(v.id)); else await guard(() => be.update(v.id, { published: act === 'publish' })); videos = await be.listAll(); hooks.invalidateVideos(); flash(act === 'delete' ? `“${v.title}” was deleted.` : act === 'publish' ? `“${v.title}” is now live on the Videos page.` : `“${v.title}” was unpublished.`); videosPanel(p); }
    catch (ex) { fail(ex); b.disabled = false; } busy = false;
  };
}
const vrow = (v) => `<article class="adm-row"><div class="adm-thumb">${v.thumb ? `<img src="${esc(v.thumb)}" alt="" loading="lazy">` : '<span>No thumbnail</span>'}${v.duration ? `<em>${fmtDur(v.duration)}</em>` : ''}</div>
  <div class="adm-info"><div class="adm-badges"><span class="badge ${v.published ? 'live' : 'draft'}">${v.published ? 'Published' : 'Unpublished'}</span><span class="badge">${esc(v.category)}</span><span class="badge ok">${v.status === 'ready' ? 'Ready' : esc(v.status || 'Processing')}</span>${pub().settings.heroVideo === v.id ? '<span class="badge live">Homepage hero</span>' : ''}</div>
  <h3>${esc(v.title)}</h3>${v.description ? `<p>${esc(v.description).slice(0, 220)}${v.description.length > 220 ? '…' : ''}</p>` : ''}<p class="adm-meta">${esc(v.mime || '')} · ${fmtBytes(v.size)}${v.originalName ? ' · ' + esc(v.originalName) : ''} · Uploaded ${fmtDate(v.createdAt)}${v.published && v.publishedAt ? ' · Published ' + fmtDate(v.publishedAt) : ''}</p></div>
  <div class="adm-acts"><button class="btn btn-sm btn-line-dark" data-vact="preview" data-id="${esc(v.id)}">Preview</button><button class="btn btn-sm btn-line-dark" data-vact="edit" data-id="${esc(v.id)}">Edit</button>${v.published ? `<button class="btn btn-sm btn-line-dark" data-vact="unpublish" data-id="${esc(v.id)}">Unpublish</button>` : `<button class="btn btn-sm btn-navy" data-vact="publish" data-id="${esc(v.id)}">Publish</button>`}<button class="btn btn-sm btn-danger-line" data-vact="delete" data-id="${esc(v.id)}">Delete</button></div></article>`;
function editVideo(v, done) {
  const m = openModal(`<h2>Edit video</h2><form class="adm-form" data-edit novalidate><label>Title<input name="title" maxlength="140" required value="${esc(v.title)}"></label><label>Description<textarea name="description" rows="5" maxlength="2000">${esc(v.description || '')}</textarea></label><label>Category<select name="category">${be.categories.map(c => `<option ${c === v.category ? 'selected' : ''}>${esc(c)}</option>`).join('')}</select></label><label>Replace thumbnail / poster <span class="muted small">(optional)</span><input name="thumb" type="file" accept="image/jpeg,image/png,image/webp"></label><p class="form-err" role="alert" data-eerr></p><div class="dlg-btns"><button type="button" class="btn btn-line-dark" data-cancel>Cancel</button><button class="btn btn-navy" type="submit">Save changes</button></div></form>`);
  const f = $('[data-edit]', m); $('[data-cancel]', m).onclick = closeModal;
  f.onsubmit = async (e) => { e.preventDefault(); const title = f.elements.title.value.trim(); if (!title) { $('[data-eerr]', m).textContent = 'Enter a title.'; return; } const b = f.querySelector('[type=submit]'); b.disabled = true;
    try { await guard(() => be.update(v.id, { title, description: f.elements.description.value.trim(), category: f.elements.category.value })); const t = f.elements.thumb.files[0]; if (t) await guard(() => be.replaceThumb(v.id, t)); videos = await be.listAll(); hooks.invalidateVideos(); closeModal(); flash('Video saved.'); done(); } catch (ex) { $('[data-eerr]', m).textContent = ex.message; b.disabled = false; } };
}
function uploader(box, { asHero = false, done }) {
  box.innerHTML = `<form class="adm-upload" data-up novalidate><div class="adm-up-grid"><div>
    <label class="drop" data-drop><input type="file" name="video" accept="video/mp4,video/webm,video/quicktime" data-vfile><span class="drop-in"><svg viewBox="0 0 48 48" aria-hidden="true"><path d="M24 31V12m0 0-8 8m8-8 8 8M10 34v4h28v-4" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"/></svg><b>Choose a video</b><span>or drag it here · MP4, WebM or MOV · up to ${be.maxVideoMB} MB</span></span></label>
    <div class="fileinfo" data-finfo hidden></div><div class="thumbbox" data-tbox hidden><p class="small"><b>Poster / thumbnail</b> <span class="muted" data-tsrc></span></p><img alt="Thumbnail preview" data-timg><label class="small">Upload a poster image<input type="file" name="thumb" accept="image/jpeg,image/png,image/webp" data-tfile></label></div></div>
    <div class="adm-form"><label>Title<input name="title" maxlength="140" required></label><label>Description<textarea name="description" rows="4" maxlength="2000"></textarea></label><label>Category<select name="category">${be.categories.map(c => `<option>${esc(c)}</option>`).join('')}</select></label>
    <label class="check"><input type="checkbox" name="publish"> Publish on the public Videos page</label>${asHero ? '<label class="check"><input type="checkbox" name="hero" checked> Select as the homepage hero video (draft)</label>' : ''}<p class="muted small">Unpublished videos are stored privately and visible only to administrators.</p></div></div>
    <div class="prog" data-prog hidden><div class="prog-track"><div class="prog-bar" data-pbar></div></div><p class="small" data-pstat aria-live="polite"></p></div><p class="form-err" role="alert" data-uerr></p>
    <div class="dlg-btns"><button type="button" class="btn btn-line-dark" data-ucancel hidden>Cancel upload</button><button class="btn btn-navy" type="submit" data-usubmit>Upload video</button></div></form>`;
  const f = $('[data-up]', box); let probe = null, customThumb = null; const vfile = $('[data-vfile]', box), drop = $('[data-drop]', box);
  const pick = async (file) => {
    const err = $('[data-uerr]', box); err.textContent = ''; probe = null; if (!file) return;
    if (!/^video\/(mp4|webm|quicktime)$/.test(file.type)) { err.textContent = 'Choose an MP4, WebM or MOV video.'; return; }
    if (file.size > be.maxVideoMB * 1024 * 1024) { err.textContent = `This file is ${fmtBytes(file.size)}. The limit is ${be.maxVideoMB} MB.`; return; }
    const fi = $('[data-finfo]', box); fi.hidden = false; fi.innerHTML = `<p><b>${esc(file.name)}</b></p><p class="muted small">Reading video…</p>`;
    probe = await probeVideo(file); probe.file = file;
    fi.innerHTML = `<p><b>${esc(file.name)}</b></p><dl><dt>Type</dt><dd>${esc(file.type)}</dd><dt>Size</dt><dd>${fmtBytes(file.size)}</dd><dt>Duration</dt><dd>${probe.duration ? fmtDur(probe.duration) : 'Unknown'}</dd><dt>Resolution</dt><dd>${probe.width ? `${probe.width} × ${probe.height}${probe.width >= 3840 ? ' (4K)' : probe.width >= 1920 ? ' (Full HD)' : probe.width >= 1280 ? ' (HD)' : ''}` : 'Unknown'}</dd></dl>${probe.playable ? '' : '<p class="small warn">This browser cannot preview the file. It will still upload; check that it plays after publishing.</p>'}`;
    if (!f.elements.title.value) f.elements.title.value = file.name.replace(/\.[^.]+$/, '').replace(/[_-]+/g, ' ').trim(); showThumb();
  };
  const showThumb = () => { const t = customThumb || probe?.thumb; $('[data-tbox]', box).hidden = !probe; const im = $('[data-timg]', box); if (t) { im.src = URL.createObjectURL(t); im.hidden = false; } else im.hidden = true; $('[data-tsrc]', box).textContent = customThumb ? '(uploaded)' : t ? '(captured from the video)' : '(none)'; };
  vfile.onchange = () => pick(vfile.files[0]);
  $('[data-tfile]', box).onchange = (e) => { customThumb = e.target.files[0] || null; showThumb(); };
  ['dragover', 'dragenter'].forEach(ev => drop.addEventListener(ev, (e) => { e.preventDefault(); drop.classList.add('over'); }));
  ['dragleave', 'drop'].forEach(ev => drop.addEventListener(ev, (e) => { e.preventDefault(); drop.classList.remove('over'); }));
  drop.addEventListener('drop', (e) => { const file = e.dataTransfer.files[0]; if (file) pick(file); });
  $('[data-ucancel]', box).onclick = () => be.cancelUpload();
  f.onsubmit = async (e) => {
    e.preventDefault(); const err = $('[data-uerr]', box); err.textContent = '';
    if (!probe?.file) { err.textContent = 'Choose a video file first.'; return; }
    const title = f.elements.title.value.trim(); if (!title) { err.textContent = 'Enter a title.'; f.elements.title.focus(); return; }
    const prog = $('[data-prog]', box), bar = $('[data-pbar]', box), st = $('[data-pstat]', box); prog.hidden = false; prog.classList.remove('done', 'fail');
    const sub = $('[data-usubmit]', box), cancel = $('[data-ucancel]', box); sub.disabled = true; cancel.hidden = false; $$('input, textarea, select', f).forEach(i => i.disabled = true);
    const set = (u, t) => { bar.style.transform = `scaleX(${Math.max(0.02, u)})`; st.textContent = t; }; set(0, 'Starting upload…');
    try {
      const wantHero = asHero && f.elements.hero?.checked;
      const v = await guard(() => be.upload({ video: probe.file, thumb: customThumb || probe.thumb, title, description: f.elements.description.value.trim(), category: f.elements.category.value, duration: probe.duration, publish: f.elements.publish.checked }, (u) => set(u, u < 1 ? `Uploading… ${Math.round(u * 100)}% of ${fmtBytes(probe.file.size)}` : 'Processing and saving…')));
      set(1, 'Upload complete — saved on the server.'); prog.classList.add('done'); videos = await be.listAll(); hooks.invalidateVideos();
      if (wantHero) await saveDraft({ settings: { heroVideo: v.id }, note: 'Homepage hero video selected' });
      flash(`“${v.title}” was uploaded${v.published ? ' and published' : ''}.${wantHero ? ' It is selected as the homepage video — publish to make it live.' : ''}`); setTimeout(done, 600);
    } catch (ex) { if (ex.handled) return; prog.classList.add('fail'); st.textContent = ex.cancelled ? 'Upload cancelled.' : 'Upload failed.'; err.textContent = ex.cancelled ? '' : ex.message; sub.disabled = false; cancel.hidden = true; $$('input, textarea, select', f).forEach(i => i.disabled = false); }
  };
}

// ── 6. Text & content editor ───────────────────────────────────────
const textFilter = { page: 'home', q: '' };
function textsPanel(p) {
  const pages = REG.pages.map(x => x.id).concat(['header', 'footer']);
  p.innerHTML = head('Text & Content Editor', 'Every heading, paragraph, button label, caption, figure and contact detail on the website. Save as a draft, preview, then publish.') + `
  <div class="adm-filters"><label>Page<select data-tpage><option value="all">All pages</option>${pages.map(pg => `<option value="${pg}" ${textFilter.page === pg ? 'selected' : ''}>${esc(pageName(pg))}</option>`).join('')}</select></label><label class="grow">Search<input type="search" data-tq value="${esc(textFilter.q)}" placeholder="Search text on the website"></label><button class="btn btn-line-dark" data-tpv>Preview this page</button></div><div data-tlist></div>`;
  const render = () => { const q = textFilter.q.toLowerCase(); const keys = Object.keys(REG.texts).filter(k => { const t = REG.texts[k]; if (k.startsWith('page.')) return false; if (textFilter.page !== 'all' && t.page !== textFilter.page) return false; if (q) return `${t.section} ${t.label} ${textVal(k)}`.toLowerCase().includes(q); return true; }).sort((a, b) => REG.texts[a].o - REG.texts[b].o); textEditorInto($('[data-tlist]', p), keys, true); };
  $('[data-tpage]', p).onchange = (e) => { textFilter.page = e.target.value; render(); }; $('[data-tq]', p).oninput = (e) => { textFilter.q = e.target.value; render(); };
  $('[data-tpv]', p).onclick = () => openPreview(['all', 'header', 'footer'].includes(textFilter.page) ? 'home' : textFilter.page);
  render();
}
function textEditorInto(box, keys, grouped) {
  if (!keys.length) { box.innerHTML = '<p class="muted">No text fields match.</p>'; return; }
  const groups = {}; keys.forEach(k => { const t = REG.texts[k]; const g = grouped ? `${pageName(t.page)} › ${t.section}` : ''; (groups[g] = groups[g] || []).push(k); });
  const field = (k) => { const t = REG.texts[k]; const v = textVal(k); const pv = textVal(k, pub()); const changedDraft = v !== pv; const custom = k in draft().texts && draft().texts[k] !== t.default;
    return `<div class="tf" data-k="${esc(k)}"><label><span class="tf-l">${esc(t.label)} ${changedDraft ? '<em class="badge draft">not published</em>' : custom ? '<em class="badge live">edited</em>' : ''}</span>${t.multiline || v.length > 90 || v.includes('\n') ? `<textarea rows="${Math.min(10, Math.max(3, Math.ceil(v.length / 90) + (v.match(/\n/g) || []).length))}" data-tv>${esc(v)}</textarea>` : `<input data-tv value="${esc(v)}">`}</label>${custom || k in draft().texts ? `<button type="button" class="linkish small" data-tdef title="Original: ${esc(t.default)}">Restore original</button>` : ''}</div>`; };
  box.innerHTML = Object.entries(groups).map(([g, ks]) => `<section class="adm-card tgroup">${g ? `<h2>${esc(g)}</h2>` : ''}${ks.map(field).join('')}<div class="tg-btns"><span class="small muted" data-tstate></span><button type="button" class="btn btn-line-dark btn-sm" data-tcancel disabled>Cancel</button><button type="button" class="btn btn-navy btn-sm" data-tsave disabled>Save draft</button></div></section>`).join('');
  box.oninput = (e) => { const g = e.target.closest('.tgroup'); if (!g) return; e.target.closest('.tf').classList.add('dirty'); $('[data-tsave]', g).disabled = false; $('[data-tcancel]', g).disabled = false; $('[data-tstate]', g).textContent = 'Unsaved changes'; };
  box.onclick = async (e) => {
    const g = e.target.closest('.tgroup'); if (!g) return;
    if (e.target.matches('[data-tcancel]')) { textEditorInto(box, keys, grouped); return; }
    if (e.target.matches('[data-tdef]')) { const k = e.target.closest('.tf').dataset.k; try { await saveDraft({ texts: { [k]: null }, note: `Text restored: ${REG.texts[k].label}` }, 'Original text restored in the draft.'); textEditorInto(box, keys, grouped); } catch (ex) { fail(ex); } return; }
    if (e.target.matches('[data-tsave]')) {
      const texts = {}; $$('.tf.dirty', g).forEach(f => { const k = f.dataset.k; const v = $('[data-tv]', f).value; texts[k] = v === REG.texts[k].default ? null : v; });
      try { await saveDraft({ texts, note: `${Object.keys(texts).length} text field(s) edited` }, 'Text saved as a draft. Preview, then publish to make it live.'); textEditorInto(box, keys, grouped); } catch (ex) { fail(ex); }
    }
  };
}

// ── 7. Website pages ───────────────────────────────────────────────
function pagesPanel(p) {
  const navKey = (id) => Object.keys(REG.texts).find(k => k.startsWith('header.') && REG.texts[k].default === REG.pageTitle[id].replace('Manufacturing ', '').replace('Products & Services', 'Products').replace('Photo Gallery', 'Gallery').replace('Company Videos', 'Videos').replace("CEO's Message", "CEO's Message"));
  p.innerHTML = head('Website Pages', 'Show or hide pages, rename their menu labels and set their search-engine title and description.') + `<div class="pg-list">${REG.pages.map(pg => { const nk = navKey(pg.id); const hidden = !!draft().pages[pg.id]?.hidden; return `<div class="adm-card pg" data-pg="${pg.id}"><div class="pg-h"><h2>${esc(pg.title)}</h2>${pg.id === 'home' ? '<span class="badge">Always visible</span>' : `<label class="switch"><input type="checkbox" data-vis ${hidden ? '' : 'checked'}> <span>${hidden ? 'Hidden from visitors' : 'Visible to visitors'}</span></label>`}<button class="btn btn-sm btn-line-dark" data-ppv>Preview</button></div>
    <div class="adm-form row2">${nk ? `<label>Menu label<input data-k="${esc(nk)}" value="${esc(textVal(nk))}"></label>` : '<div></div>'}<label>Browser / search title<input data-k="page.${pg.id}.seoTitle" value="${esc(textVal(`page.${pg.id}.seoTitle`))}"></label></div>
    <div class="adm-form"><label>Search description<textarea rows="2" data-k="page.${pg.id}.seoDesc">${esc(textVal(`page.${pg.id}.seoDesc`))}</textarea></label></div><div class="tg-btns"><button class="btn btn-navy btn-sm" data-psave disabled>Save draft</button></div></div>`; }).join('')}</div>`;
  p.oninput = (e) => { const c = e.target.closest('[data-pg]'); if (c) $('[data-psave]', c).disabled = false; if (e.target.matches('[data-vis]')) e.target.nextElementSibling.textContent = e.target.checked ? 'Visible to visitors' : 'Hidden from visitors'; };
  p.onclick = async (e) => { const c = e.target.closest('[data-pg]'); if (!c) return; const id = c.dataset.pg;
    if (e.target.matches('[data-ppv]')) return openPreview(id);
    if (e.target.matches('[data-psave]')) { const texts = {}; $$('[data-k]', c).forEach(i => { const k = i.dataset.k; texts[k] = i.value === REG.texts[k].default ? null : i.value; }); const vis = $('[data-vis]', c); const body = { texts, note: `Page settings: ${REG.pageTitle[id]}` }; if (vis) body.pages = { [id]: vis.checked ? null : { hidden: true } };
      try { await saveDraft(body, 'Page settings saved as a draft.'); e.target.disabled = true; } catch (ex) { fail(ex); } } };
}

// ── 8. Media library ───────────────────────────────────────────────
const libF = { kind: 'image', f: 'all', q: '' };
function libraryPanel(p) {
  p.innerHTML = head('Central Media Library', 'All original photographs, uploaded images and videos. Originals are stored untouched; the website uses optimised copies generated from them.', `<label class="btn btn-navy upbtn">Upload images<input type="file" accept="image/jpeg,image/png,image/webp,image/avif,image/tiff" multiple data-lup></label>`) + `
  <div class="adm-filters"><label>Type<select data-lk><option value="image" ${libF.kind === 'image' ? 'selected' : ''}>Images (${S.media.length})</option><option value="video" ${libF.kind === 'video' ? 'selected' : ''}>Videos (${videos.length})</option></select></label><label>Show<select data-lf><option value="all">All</option><option value="original">Original Mekotex photographs</option><option value="upload">Uploaded</option><option value="used">Used on the website</option><option value="unused">Not used</option></select></label><label class="grow">Search<input type="search" data-lq value="${esc(libF.q)}" placeholder="File name or caption"></label></div><p class="small muted" data-lmsg></p><div data-llist></div>`;
  $('[data-lf]', p).value = libF.f;
  const render = () => {
    const box = $('[data-llist]', p); const q = libF.q.toLowerCase();
    if (libF.kind === 'video') { box.innerHTML = `<div class="libgrid">${videos.filter(v => !q || v.title.toLowerCase().includes(q)).map(v => { const used = S.usage[v.id]?.length; return `<article class="libc"><div class="libc-img">${v.thumb ? `<img src="${esc(v.thumb)}" alt="" loading="lazy">` : ''}</div><div class="libc-b"><b>${esc(v.title)}</b><small>${esc(v.originalName || '')}</small><small>${esc(v.mime)} · ${fmtBytes(v.size)} · ${v.duration ? fmtDur(v.duration) : '—'} · uploaded ${fmtDate(v.createdAt)}</small><small>${v.published ? '<span class="badge live">Published</span>' : '<span class="badge draft">Unpublished</span>'} ${used ? '<span class="badge live">Homepage hero</span>' : ''}</small></div></article>`; }).join('')}</div><p class="small"><button class="linkish" data-gv>Manage videos</button></p>`; $('[data-gv]', box).onclick = () => go('videos'); return; }
    const items = S.media.filter(x => (!q || `${x.name} ${x.caption}`.toLowerCase().includes(q)) && (libF.f === 'all' || (libF.f === 'original' && x.source === 'original') || (libF.f === 'upload' && x.source === 'upload') || (libF.f === 'used' && S.usage[x.id]?.length) || (libF.f === 'unused' && !S.usage[x.id]?.length))).sort((a, b) => a.name.localeCompare(b.name));
    box.innerHTML = `<div class="libgrid">${items.map(x => { const u = S.usage[x.id] || []; return `<article class="libc" data-mid="${esc(x.id)}"><button class="libc-img" data-ldet aria-label="Details of ${esc(x.name)}"><img src="${imgUrl(x.id, 400)}" alt="" loading="lazy"></button><div class="libc-b"><b>${esc(x.name)}</b><small>${x.w} × ${x.h} px · ${fmtBytes(x.size)} · ${esc((x.mime || '').replace('image/', '').toUpperCase())}</small><small>${x.source === 'original' ? 'Original Mekotex photograph' : `Uploaded ${fmtDate(x.createdAt)}`}${x.crop ? ' · screen border corrected' : ''}</small><small>${u.length ? `<span class="badge live">Used in ${u.length} place${u.length > 1 ? 's' : ''}</span>` : '<span class="badge">Not used</span>'}</small></div></article>`; }).join('')}</div>`;
  };
  $('[data-lk]', p).onchange = (e) => { libF.kind = e.target.value; render(); }; $('[data-lf]', p).onchange = (e) => { libF.f = e.target.value; render(); }; $('[data-lq]', p).oninput = (e) => { libF.q = e.target.value; render(); };
  $('[data-llist]', p).onclick = (e) => { const c = e.target.closest('[data-ldet]'); if (c) mediaDetails(c.closest('[data-mid]').dataset.mid, () => libraryPanel(p)); };
  $('[data-lup]', p).onchange = async (e) => { const files = [...e.target.files]; if (!files.length) return; const msg = $('[data-lmsg]', p); msg.textContent = `Uploading ${files.length} image(s)…`; try { const fd = new FormData(); files.forEach(f => fd.append('images', f)); const r = await guard(() => api('POST', 'api/admin/media', fd)); await reloadUsage(); flash(`${r.media.length} image(s) uploaded. Originals are stored unchanged.`); libraryPanel(p); } catch (ex) { msg.textContent = ''; fail(ex); } };
  render();
}
function mediaDetails(id, done) {
  const x = S.mediaById[id]; const u = S.usage[id] || [];
  const m = openModal(`<h2>${esc(x.name)}</h2><div class="md"><div><img src="${imgUrl(id, 1000)}" alt="" class="md-img"><p class="small muted">Shown with its display correction${x.crop ? '' : ' (none — full photograph)'}.</p></div><div>
    <dl class="md-dl"><dt>File type</dt><dd>${esc(x.mime)}</dd><dt>Original size</dt><dd>${x.w} × ${x.h} px · ${fmtBytes(x.size)}</dd><dt>Resolution class</dt><dd>${x.w >= 3840 ? '4K-capable' : x.w >= 1920 ? 'Full HD' : x.w >= 1280 ? 'HD' : 'Below HD'} (native — never upscaled)</dd><dt>Source</dt><dd>${x.source === 'original' ? 'Original Mekotex photograph' : `Uploaded by ${esc(x.by)} on ${fmtDate(x.createdAt)}`}</dd><dt>Display correction</dt><dd>${x.crop ? `Cropped to ${cropPx(x, x.crop).join(' × ')} px (${esc(x.cropSource || 'screen border removed')})` : 'None'}</dd><dt>Used on the website</dt><dd>${u.length ? `<ul class="md-use">${u.map(w => `<li>${esc(locLabel(w.slot))} ${w.layer === 'draft' ? '<em class="badge draft">draft only</em>' : w.layer === 'published' ? '<em class="badge">live only</em>' : ''}</li>`).join('')}</ul>` : 'Not used'}</dd></dl>
    <label class="adm-form small"><b>Caption</b><input data-mcap value="${esc(x.caption || '')}"></label>
    <div class="dlg-btns" style="justify-content:flex-start;flex-wrap:wrap"><button class="btn btn-sm btn-navy" data-mcrop>Edit display correction</button><a class="btn btn-sm btn-line-dark" href="api/admin/media/${encodeURIComponent(id)}/original" target="_blank" rel="noopener">View original file</a><button class="btn btn-sm btn-line-dark" data-msave>Save caption</button><button class="btn btn-sm btn-danger-line" data-mdel ${u.length || x.source === 'original' ? 'disabled' : ''}>Delete</button></div>
    ${x.source === 'original' ? '<p class="small muted">Original Mekotex photographs are protected and cannot be deleted.</p>' : u.length ? '<p class="small muted">In use on the website — replace it there before deleting.</p>' : ''}<p class="form-err" data-merr></p></div></div>`, 'wide');
  $('[data-mcrop]', m).onclick = () => { closeModal(); imageEditor({ mediaDefault: id, onSaved: done }); };
  $('[data-msave]', m).onclick = async () => { try { await guard(() => api('PATCH', `api/admin/media/${encodeURIComponent(id)}`, { caption: $('[data-mcap]', m).value })); await reloadUsage(); flash('Caption saved.'); } catch (ex) { $('[data-merr]', m).textContent = ex.message; } };
  $('[data-mdel]', m).onclick = async () => { if (!(await confirmBox('Delete this image?', `“${x.name}” will be removed from the media library permanently.`))) return; try { await guard(() => api('DELETE', `api/admin/media/${encodeURIComponent(id)}`)); await reloadUsage(); closeModal(); flash('Image deleted.'); done(); } catch (ex) { $('[data-merr]', m).textContent = ex.message; } };
}

// ── 9. Image quality & display ─────────────────────────────────────
function qualityPanel(p) {
  const q = Object.assign({}, S.defaultQuality, draft().settings.quality || {});
  const used = [...new Set(Object.keys(REG.images).map(k => resolveSlot(k)).filter(Boolean).map(r => r.media).concat((draft().gallery || REG.gallery).map(g => g.media)))].map(id => S.mediaById[id]).filter(Boolean);
  const cls = (w) => w >= 3840 ? ['4K', 'live'] : w >= 1920 ? ['Full HD', 'ok'] : w >= 1280 ? ['HD', ''] : ['Below HD', 'draft'];
  const counts = { '4K': 0, 'Full HD': 0, HD: 0, 'Below HD': 0 }; used.forEach(m => counts[cls(cropPx(m, m.crop)[0])[0]]++);
  p.innerHTML = head('Image Quality & Display Settings', 'How photographs are delivered: responsive sizes, modern formats, gentle compression, no artificial sharpening and no upscaling.') + `
  <div class="adm-card"><form class="adm-form" data-qf><div class="row2"><label>Largest image width delivered<select name="maxWidth">${[1600, 2000, 2560, 3840].map(w => `<option value="${w}" ${q.maxWidth === w ? 'selected' : ''}>${w}px${w === 3840 ? ' (4K)' : ''}</option>`).join('')}</select></label><div></div></div>
    <label class="check"><input type="checkbox" name="avif" ${q.avif ? 'checked' : ''}> Serve AVIF to browsers that support it (smallest files)</label><label class="check"><input type="checkbox" name="enhance" ${q.enhance !== false ? 'checked' : ''}> Clean up photographs taken from a screen (gentle clarity and contrast; originals are not changed)</label><label class="check"><input type="checkbox" name="webp" ${q.webp ? 'checked' : ''}> Serve WebP to browsers that support it</label>
    <div class="row3"><label>AVIF quality <output>${q.avifQ}</output><input type="range" name="avifQ" min="40" max="90" value="${q.avifQ}"></label><label>WebP quality <output>${q.webpQ}</output><input type="range" name="webpQ" min="60" max="95" value="${q.webpQ}"></label><label>JPEG quality <output>${q.jpegQ}</output><input type="range" name="jpegQ" min="70" max="95" value="${q.jpegQ}"></label></div>
    <p class="small muted">Defaults keep natural detail and colour (4:4:4 colour, high quality). Each browser receives the size that fits its screen; JPEG is the fallback for older browsers.</p>
    <div class="dlg-btns" style="justify-content:flex-start"><button class="btn btn-navy">Save draft</button><button type="button" class="btn btn-line-dark" data-qreset>Restore recommended</button></div></form></div>
  <div class="adm-card"><h2>Resolution of photographs in use (${used.length})</h2><p>${Object.entries(counts).map(([k, n]) => `<span class="badge ${cls(k === '4K' ? 4000 : k === 'Full HD' ? 2000 : k === 'HD' ? 1300 : 0)[1]}">${k}: ${n}</span>`).join(' ')}</p>
    <p class="small">These photographs were supplied as photos of a computer screen at 2016 × 1512 px. After removing the screen border they are about 1,700–2,000 px wide — Full HD class at best. <b>They are delivered at their full native resolution but are not 4K</b>, and the system does not upscale or artificially sharpen them. Upload the original camera or drone files (or 4K video stills) to get genuine 4K quality; the pipeline already supports up to 3840 px.</p>
    <div class="qtable"><table><thead><tr><th>Photograph</th><th>Original</th><th>Displayed area</th><th>Class</th></tr></thead><tbody>${used.sort((a, b) => cropPx(b, b.crop)[0] - cropPx(a, a.crop)[0]).map(m => { const [w, h] = cropPx(m, m.crop); const c = cls(w); return `<tr><td>${esc(m.name)}</td><td>${m.w}×${m.h}</td><td>${w}×${h}</td><td><span class="badge ${c[1]}">${c[0]}</span></td></tr>`; }).join('')}</tbody></table></div></div>`;
  const f = $('[data-qf]', p); f.oninput = (e) => { if (e.target.type === 'range') e.target.previousElementSibling.textContent = e.target.value; };
  f.onsubmit = async (e) => { e.preventDefault(); const q2 = { maxWidth: +f.elements.maxWidth.value, avif: f.elements.avif.checked, webp: f.elements.webp.checked, enhance: f.elements.enhance.checked, avifQ: +f.elements.avifQ.value, webpQ: +f.elements.webpQ.value, jpegQ: +f.elements.jpegQ.value }; try { await saveDraft({ settings: { quality: q2 }, note: 'Image quality settings changed' }, 'Quality settings saved as a draft. Publish to apply them to the public site.'); } catch (ex) { fail(ex); } };
  $('[data-qreset]', p).onclick = async () => { try { await saveDraft({ settings: { quality: null }, note: 'Image quality settings restored' }, 'Recommended settings restored in the draft.'); qualityPanel(p); } catch (ex) { fail(ex); } };
}

// ── 10. Live preview ───────────────────────────────────────────────
let pvState = { page: 'home', dev: 'desktop' };
function previewPanel(p) {
  const devs = { desktop: 1366, tablet: 820, mobile: 390 };
  p.innerHTML = head('Live Website Preview', 'The website exactly as visitors will see it after you publish — including all unpublished draft changes.', `<button class="btn btn-navy" data-go="publish">Publish changes</button>`) + `
  <div class="adm-filters"><label>Page<select data-pp>${REG.pages.map(pg => `<option value="${pg.id}" ${pvState.page === pg.id ? 'selected' : ''}>${esc(pg.title)}</option>`).join('')}</select></label><div class="seg" role="group" aria-label="Device">${Object.keys(devs).map(d => `<button class="${pvState.dev === d ? 'on' : ''}" data-dev="${d}">${d[0].toUpperCase() + d.slice(1)}</button>`).join('')}</div><button class="btn btn-line-dark" data-pr>Reload</button><button class="btn btn-line-dark" data-pn>Open in new tab</button></div>
  <div class="pvframe" data-pf><div class="pvframe-in" style="width:${devs[pvState.dev]}px"><iframe data-pv title="Website preview" src="./?preview=1#${pvState.page}"></iframe></div></div>`;
  const fit = () => { const box = $('[data-pf]', p); const inn = $('.pvframe-in', p); const w = devs[pvState.dev]; const s = Math.min(1, (box.clientWidth - 2) / w); inn.style.transform = `scale(${s})`; inn.style.height = `${Math.round(820 / s)}px`; box.style.height = `${Math.round(820)}px`; };
  $('[data-pp]', p).onchange = (e) => { pvState.page = e.target.value; $('iframe', p).src = `./?preview=1#${pvState.page}`; };
  $$('[data-dev]', p).forEach(b => b.onclick = () => { pvState.dev = b.dataset.dev; previewPanel(p); });
  $('[data-pr]', p).onclick = () => { $('iframe', p).contentWindow.location.reload(); }; $('[data-pn]', p).onclick = () => openPreview(pvState.page); $('[data-go]', p).onclick = () => go('publish');
  fit(); addEventListener('resize', fit, { once: true });
}

// ── 11. Publish ────────────────────────────────────────────────────
async function publishPanel(p) {
  await reloadUsage(); if (section !== 'publish') return; const ch = S.changes;
  const show = (v) => v == null ? '<em class="muted">original</em>' : typeof v === 'string' ? esc(v.length > 160 ? v.slice(0, 160) + '…' : v) : esc(v.media ? `${S.mediaById[v.media]?.name || v.media}${v.crop ? ' (cropped)' : ''}${v.fit && v.fit !== 'cover' ? ` · ${v.fit}` : ''}${v.zoom > 1 ? ` · zoom ${v.zoom}×` : ''}` : typeof v === 'object' ? JSON.stringify(v) : String(v));
  const ceoName = (c) => !c ? 'none' : c.type === 'youtube' ? `YouTube video ${c.yt}` : `Uploaded: ${videos.find(v => v.id === c.id)?.title || c.id}`;
  const heroName = (id) => id ? videos.find(v => v.id === id)?.title || id : 'none';
  p.innerHTML = head('Publish Changes', 'Review the draft, publish it to the public website, or roll back to an earlier version.') + `
  <div class="adm-card">${ch.length ? `<h2>${ch.length} unpublished change(s)</h2><ul class="chg">${ch.map(c => `<li><span class="badge">${c.type}</span> <b>${esc(c.label)}</b>${c.type === 'text' ? `<div class="chg-d"><del>${show(c.from)}</del><ins>${show(c.to)}</ins></div>` : c.type === 'image' ? `<div class="chg-d"><del>${show(c.from)}</del><ins>${show(c.to)}</ins></div>` : c.key === 'ceoVideo' ? `<div class="chg-d"><del>${esc(ceoName(c.from))}</del><ins>${esc(ceoName(c.to))}</ins></div>` : c.key === 'heroVideo' ? `<div class="chg-d"><del>${esc(heroName(c.from))}</del><ins>${esc(heroName(c.to))}</ins></div>` : ''}</li>`).join('')}</ul>
    <form class="adm-form" data-pubf><label>Note for the history (optional)<input name="note" maxlength="200" placeholder="e.g. New homepage video and updated CEO message"></label><div class="dlg-btns" style="justify-content:flex-start"><button class="btn btn-line-dark" type="button" data-pvw>Preview first</button><button class="btn btn-line-dark" type="button" data-disc>Cancel all draft changes</button><button class="btn btn-amber">Publish to the website</button></div></form>` : '<h2>Everything is published</h2><p class="muted">There are no draft changes. The public website matches the latest version.</p>'}</div>
  <div class="adm-card"><h2>Version history</h2>${S.versions.length ? `<div class="qtable"><table class="vtable"><thead><tr><th>Version</th><th>Published</th><th>By</th><th>Changes</th><th>Note</th><th></th></tr></thead><tbody>${S.versions.map((v, i) => `<tr><td>${v.v}${i === 0 ? ' <span class="badge live">live</span>' : ''}</td><td>${fmtTime(v.at)}</td><td>${esc(v.by)}</td><td>${v.changes}</td><td>${esc(v.note)}</td><td><button class="btn btn-sm btn-line-dark" data-rest="${v.v}">Load as draft</button></td></tr>`).join('')}</tbody></table></div><p class="small muted">“Load as draft” copies that version into the draft. Review it in the preview, then publish to restore it.</p>` : '<p class="muted">No versions yet. Each publish creates a restorable version.</p>'}</div>`;
  $('[data-pubf]', p)?.addEventListener('submit', async (e) => { e.preventDefault(); const b = e.target.querySelector('.btn-amber'); b.disabled = true; b.textContent = 'Publishing…'; try { const r = await guard(() => api('POST', 'api/admin/cms/publish', { note: e.target.elements.note.value })); await load(); hooks.invalidateVideos(); flash(`Published version ${r.version}. Changes are now live on the public website.`); publishPanel(p); } catch (ex) { fail(ex); b.disabled = false; b.textContent = 'Publish to the website'; } });
  $('[data-pvw]', p)?.addEventListener('click', () => go('preview'));
  $('[data-disc]', p)?.addEventListener('click', async () => { if (!(await confirmBox('Cancel all draft changes?', `${ch.length} unpublished change(s) will be discarded. The draft returns to the published website.`, 'Discard changes'))) return; try { await guard(() => api('POST', 'api/admin/cms/discard')); await load(); flash('Draft changes discarded.'); publishPanel(p); } catch (ex) { fail(ex); } });
  $$('[data-rest]', p).forEach(b => b.onclick = async () => { if (!(await confirmBox(`Load version ${b.dataset.rest} as the draft?`, 'Your current unpublished changes will be replaced by this version. Nothing changes on the public website until you publish.', 'Load version'))) return; try { await guard(() => api('POST', `api/admin/cms/restore/${b.dataset.rest}`)); await load(); flash(`Version ${b.dataset.rest} loaded as the draft. Preview it, then publish.`); publishPanel(p); } catch (ex) { fail(ex); } });
}

// ── 12. Activity ───────────────────────────────────────────────────
async function activityPanel(p) {
  const { activity } = await guard(() => api('GET', 'api/admin/activity')); if (section !== 'activity') return;
  p.innerHTML = head('Activity History', 'Sign-ins, edits, uploads and publications, newest first.') + `<div class="adm-card"><div class="qtable"><table><thead><tr><th>When</th><th>Who</th><th>Action</th><th>Details</th></tr></thead><tbody>${activity.map(a => `<tr><td class="nowrap">${fmtTime(a.at)}</td><td>${esc(a.user)}</td><td><b>${esc(a.action)}</b></td><td>${esc(a.detail)}</td></tr>`).join('') || '<tr><td colspan="4">No activity yet.</td></tr>'}</tbody></table></div></div>`;
}

// ── 13. Settings ───────────────────────────────────────────────────
function settingsPanel(p) {
  p.innerHTML = head('Admin Settings') + `<div class="adm-grid2"><div class="adm-card"><h2>Change password</h2>${pwForm(false)}</div><div class="adm-card"><h2>Session</h2><p>Signed in as <b>${esc(me.username)}</b>. Sessions end automatically after 8 hours or when you sign out.</p><button class="btn btn-line-dark" data-so2>Sign out</button>
    <h2 style="margin-top:28px">Storage</h2><p class="small">Original files, optimised images, videos and all content are stored on the Mekotex server (data folder). Originals are never modified. Back up the data folder regularly.</p></div></div>`;
  wireCpw(p, false); $('[data-so2]', p).onclick = signOut;
}
