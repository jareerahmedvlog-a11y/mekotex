// Media layer for the Videos page, editable page content and the admin dashboard.
// Back end: the MEKOTEX Node server (server/server.js): username/password login, hashed passwords,
// HttpOnly sessions, rate limiting. Without it (static hosting) the site shows its published defaults.
// No credentials exist in this file or anywhere else in the front end.

const API = 'api/';
const H = { 'X-Requested-With': 'mekotex' };
export const CATEGORIES = ['Corporate', 'Factory Tour', 'Manufacturing', 'Products', 'Sustainability', 'Events', 'Other'];

async function j(res) {
  let body = null; try { body = await res.json(); } catch (_) { /* empty */ }
  if (!res.ok) { const e = new Error(body?.error || `Request failed (${res.status})`); e.status = res.status; e.body = body; throw e; }
  return body;
}
const withTimeout = (p, ms) => Promise.race([p, new Promise((_, r) => setTimeout(() => r(new Error('timeout')), ms))]);

// ── Server back end ─────────────────────────────────────────────────────────
function serverBackend(info) {
  return {
    mode: 'server', info, maxVideoMB: info.maxVideoMB, categories: info.categories || CATEGORIES,
    async listPublished() { return (await j(await fetch(API + 'videos', { credentials: 'same-origin' }))).videos; },
    async getContent() { return (await j(await fetch(API + 'content'))).content || {}; },
    async me() { const r = await fetch(API + 'auth/me', { credentials: 'same-origin' }); if (r.status === 401) return null; return (await j(r)).user; },
    async login(username, password) { return (await j(await fetch(API + 'auth/login', { method: 'POST', credentials: 'same-origin', headers: { ...H, 'Content-Type': 'application/json' }, body: JSON.stringify({ username, password }) }))).user; },
    async logout() { await fetch(API + 'auth/logout', { method: 'POST', credentials: 'same-origin', headers: H }); },
    async changePassword(current, next) { return j(await fetch(API + 'auth/change-password', { method: 'POST', credentials: 'same-origin', headers: { ...H, 'Content-Type': 'application/json' }, body: JSON.stringify({ current, next }) })); },
    async listAll() { return (await j(await fetch(API + 'admin/videos', { credentials: 'same-origin' }))).videos; },
    upload({ video, thumb, title, description, category, duration, publish }, onProgress) {
      return new Promise((resolve, reject) => {
        const fd = new FormData();
        fd.append('title', title); fd.append('description', description); fd.append('category', category);
        if (duration) fd.append('duration', String(duration)); fd.append('publish', publish ? '1' : '0');
        fd.append('video', video, video.name || 'video.mp4'); if (thumb) fd.append('thumb', thumb, thumb.name || 'thumbnail.jpg');
        const x = new XMLHttpRequest(); x.open('POST', API + 'admin/videos'); x.withCredentials = true; x.setRequestHeader('X-Requested-With', 'mekotex');
        x.upload.onprogress = (e) => e.lengthComputable && onProgress?.(e.loaded / e.total);
        x.onload = () => { let b = null; try { b = JSON.parse(x.responseText); } catch (_) { /* */ } if (x.status >= 200 && x.status < 300) resolve(b.video); else { const e = new Error(b?.error || `Upload failed (${x.status})`); e.status = x.status; reject(e); } };
        x.onerror = () => reject(new Error('Network error during upload. Check the connection and try again.'));
        x.onabort = () => reject(Object.assign(new Error('Upload cancelled.'), { cancelled: true }));
        x.send(fd); this._xhr = x;
      });
    },
    cancelUpload() { this._xhr?.abort(); },
    async update(id, patch) { return (await j(await fetch(API + 'admin/videos/' + encodeURIComponent(id), { method: 'PATCH', credentials: 'same-origin', headers: { ...H, 'Content-Type': 'application/json' }, body: JSON.stringify(patch) }))).video; },
    async replaceThumb(id, blob) { const fd = new FormData(); fd.append('thumb', blob, blob.name || 'thumbnail.jpg'); return (await j(await fetch(API + 'admin/videos/' + encodeURIComponent(id) + '/thumb', { method: 'PUT', credentials: 'same-origin', headers: H, body: fd }))).video; },
    async remove(id) { await j(await fetch(API + 'admin/videos/' + encodeURIComponent(id), { method: 'DELETE', credentials: 'same-origin', headers: H })); },
    async saveContent(c) { return (await j(await fetch(API + 'admin/content', { method: 'PUT', credentials: 'same-origin', headers: { ...H, 'Content-Type': 'application/json' }, body: JSON.stringify(c) }))).content; },
  };
}

// ── Detection ───────────────────────────────────────────────────────────────
let backendP = null;
export function getBackend() {
  if (backendP) return backendP;
  backendP = (async () => {
    try {
      const r = await withTimeout(fetch(API + 'health', { credentials: 'same-origin' }), 4000);
      if (r.ok && (r.headers.get('content-type') || '').includes('json')) { const info = await r.json(); if (info?.service === 'mekotex-media') return serverBackend(info); }
    } catch (_) { /* not self-hosted */ }
    return { mode: 'none', categories: CATEGORIES, async listPublished() { return []; }, async getContent() { return {}; }, async me() { return null; } };
  })();
  return backendP;
}

// ── Helpers shared by the dashboard ─────────────────────────────────────────
export function probeVideo(file) {
  return new Promise((resolve) => {
    const url = URL.createObjectURL(file); const v = document.createElement('video'); v.preload = 'metadata'; v.muted = true; v.playsInline = true; v.src = url;
    let done = false; const finish = (r) => { if (done) return; done = true; resolve(r); setTimeout(() => URL.revokeObjectURL(url), 500); };
    const fail = () => finish({ duration: null, width: null, height: null, thumb: null, playable: false });
    v.onerror = fail; setTimeout(fail, 15000);
    v.onloadedmetadata = () => { const d = v.duration; v.currentTime = Math.min(isFinite(d) ? d * 0.15 : 1, 3); };
    v.onseeked = () => {
      try {
        const w = Math.min(1280, v.videoWidth || 1280), h = Math.round(w * (v.videoHeight || 720) / (v.videoWidth || 1280));
        const c = document.createElement('canvas'); c.width = w; c.height = h; c.getContext('2d').drawImage(v, 0, 0, w, h);
        c.toBlob((b) => finish({ duration: isFinite(v.duration) ? v.duration : null, width: v.videoWidth, height: v.videoHeight, thumb: b ? new File([b], 'auto-thumbnail.jpg', { type: 'image/jpeg' }) : null, playable: true }), 'image/jpeg', 0.84);
      } catch (_) { finish({ duration: isFinite(v.duration) ? v.duration : null, width: v.videoWidth, height: v.videoHeight, thumb: null, playable: true }); }
    };
  });
}
export const fmtBytes = (n) => n == null ? '—' : n < 1024 * 1024 ? `${(n / 1024).toFixed(0)} KB` : n < 1024 ** 3 ? `${(n / 1024 / 1024).toFixed(1)} MB` : `${(n / 1024 ** 3).toFixed(2)} GB`;
export const fmtDur = (s) => { if (!s && s !== 0) return ''; s = Math.round(s); const m = Math.floor(s / 60), r = s % 60; return m >= 60 ? `${Math.floor(m / 60)}:${String(m % 60).padStart(2, '0')}:${String(r).padStart(2, '0')}` : `${m}:${String(r).padStart(2, '0')}`; };
export const fmtDate = (iso) => { try { return new Date(iso).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }); } catch (_) { return ''; } };
