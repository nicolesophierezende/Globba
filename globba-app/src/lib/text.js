// Small helpers shared by the content pages.
export const AV = {
  it: { u: 'Di solito disponibile', s: 'A volte', z: 'Stagionale' },
  en: { u: 'Usually in stock', s: 'Sometimes', z: 'Seasonal' },
};
export const fill = (R, r) => (r.length === 1 ? R[r[0]].c : `conic-gradient(${R[r[0]].c} 0 50%, ${R[r[1]].c} 0)`);
export const daysAgo = (d) => Math.round((Date.now() - new Date(d + 'T12:00:00')) / 864e5);
export const fmtDate = (d, lang) => new Date(d + 'T12:00:00').toLocaleDateString(lang === 'en' ? 'en-GB' : 'it-IT', { day: 'numeric', month: 'long', year: 'numeric' });
export const norm = (s) => s.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').trim();
/** Other names for a product (other language + synonyms), without duplicates. */
export function aka(p, lang) {
  const main = norm(p[lang]);
  const seen = new Set([main]);
  return [p[lang === 'it' ? 'en' : 'it'], ...p.s].filter((v) => { const n = norm(v); if (seen.has(n)) return false; seen.add(n); return true; });
}
export const icons = {
  pin: '<path d="M12 21s-7-6.2-7-11.5A7 7 0 0 1 19 9.5C19 14.8 12 21 12 21z"/><circle cx="12" cy="9.5" r="2.5"/>',
  clock: '<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>',
  check: '<path d="M5 12.5l4.5 4.5L19 7.5"/>',
  phone: '<path d="M5 4h4l2 5-2.5 1.5a11 11 0 0 0 5 5L15 13l5 2v4a2 2 0 0 1-2 2A16 16 0 0 1 3 6a2 2 0 0 1 2-2z"/>',
  dir: '<path d="M12 2 21 12 12 22 3 12z"/><path d="M9 13v-2h5V9l2.5 2.5L14 14v-2"/>',
  wa: '<path d="M4 20l1.3-4A8 8 0 1 1 8 18.7z"/><path d="M9 9.5c0 3 2.5 5.5 5.5 5.5l1-1.5-2-1-1 .8a4 4 0 0 1-1.8-1.8l.8-1-1-2z"/>',
  map: '<path d="M9 4 3 6v14l6-2 6 2 6-2V4l-6 2z"/><path d="M9 4v14M15 6v14"/>',
};
export const svg = (k, s = 20) => `<svg width="${s}" height="${s}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${icons[k]}</svg>`;
