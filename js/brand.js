// ── Global branding component ───────────────────────────────────────
// One place for the "Powered by Jarries.com" mark. Any element with a data-brand="<variant>"
// attribute – on any page, in the admin panel, or in a section added later – is filled automatically.
// Variants: header · video · footer · admin · panel · section
export const BRAND = { label: 'Powered by', name: 'Jarries.com', url: 'https://jarries.com' };
export const brandMark = (variant = 'section') =>
  `<a class="jbrand jbrand-${variant}" href="${BRAND.url}" target="_blank" rel="noopener" aria-label="${BRAND.label} ${BRAND.name}"><span>${BRAND.label}</span> <b>${BRAND.name}</b></a>`;
export function mountBrand(root = document) {
  root.querySelectorAll('[data-brand]').forEach(el => { if (!el.firstElementChild) el.innerHTML = brandMark(el.dataset.brand || 'section'); });
}
export function initBrand() {
  mountBrand();
  new MutationObserver(() => { if (document.querySelector('[data-brand]:empty')) mountBrand(); }).observe(document.body, { childList: true, subtree: true });
}
