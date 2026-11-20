// Loads Globba's data. Works both at build time (Node) and in the browser.
//
// If PUBLIC_SUPABASE_URL and PUBLIC_SUPABASE_ANON_KEY are set, data comes from Supabase.
// Otherwise the invented sample data in src/data/sample.js is used.
//
// The app works with three compact objects (the same shapes as the original prototype):
//   R: regions   { id: { c: color, it: name, en: name } }
//   P: products  { id: { it: name, en: name, s: [synonyms] } }
//   S: stores    [ { id, n, r:[regions], a, lat, lng, ph, wa, chk, h:[it,en], inv:{ productId: 'u'|'s'|'z' } } ]

import * as sample from '../data/sample.js';

export const SUPABASE_URL = (import.meta.env.PUBLIC_SUPABASE_URL || '').replace(/\/$/, '');
export const SUPABASE_KEY = import.meta.env.PUBLIC_SUPABASE_ANON_KEY || '';
export const hasSupabase = !!(SUPABASE_URL && SUPABASE_KEY);

const headers = () => ({ apikey: SUPABASE_KEY, Authorization: `Bearer ${SUPABASE_KEY}` });

async function get(path) {
  const res = await fetch(`${SUPABASE_URL}/rest/v1/${path}`, { headers: headers() });
  if (!res.ok) throw new Error(`Supabase ${path}: ${res.status} ${await res.text()}`);
  return res.json();
}

/** Turns Supabase rows into the compact R/P/S objects. */
export function fromRows({ regions, products, stores, inventory }) {
  const R = {};
  for (const r of regions.sort((a, b) => (a.sort ?? 0) - (b.sort ?? 0))) R[r.id] = { c: r.color, it: r.name_it, en: r.name_en };
  const P = {};
  for (const p of products) P[p.id] = { it: p.name_it, en: p.name_en, s: p.synonyms || [] };
  const S = stores.map((s) => ({
    id: s.id, n: s.name, r: (s.regions || []).filter((k) => R[k]).slice(0, 2), a: s.address,
    lat: s.lat, lng: s.lng, ph: s.phone || '', wa: s.whatsapp || '', chk: s.last_checked,
    h: [s.hours_it || '', s.hours_en || s.hours_it || ''], inv: {},
  })).filter((s) => s.r.length && s.lat != null && s.lng != null);
  const byId = Object.fromEntries(S.map((s) => [s.id, s]));
  // Stable order inside each store: usually available first, then sometimes, then seasonal.
  const rank = { u: 0, s: 1, z: 2 };
  inventory = inventory.slice().sort((a, b) => rank[a.availability] - rank[b.availability] || (P[a.product_id]?.it || '').localeCompare(P[b.product_id]?.it || ''));
  for (const i of inventory) if (byId[i.store_id] && P[i.product_id]) byId[i.store_id].inv[i.product_id] = i.availability;
  return { R, P, S, sample: false };
}

export async function loadFromSupabase() {
  const [regions, products, stores, inventory] = await Promise.all([
    get('regions?select=id,color,name_it,name_en,sort'),
    get('products?select=id,name_it,name_en,synonyms'),
    get('stores?select=*&published=eq.true&order=name'),
    get('inventory?select=store_id,product_id,availability'),
  ]);
  return fromRows({ regions, products, stores, inventory });
}

export function sampleData() {
  return { R: sample.R, P: sample.P, S: sample.S, sample: true };
}

let cache;
/** Build-time loader used by every page. */
export async function loadData() {
  if (cache) return cache;
  if (hasSupabase) {
    try { cache = await loadFromSupabase(); return cache; }
    catch (e) {
      if (import.meta.env.PROD && !import.meta.env.PUBLIC_ALLOW_SAMPLE_FALLBACK) throw e;
      console.warn('[globba] Supabase failed, using sample data:', e.message);
    }
  }
  cache = sampleData();
  return cache;
}

/** Saves a row in a public "insert only" table (product requests, searches with no results). */
export async function insertPublic(table, row) {
  if (!hasSupabase) return false;
  const res = await fetch(`${SUPABASE_URL}/rest/v1/${table}`, {
    method: 'POST',
    headers: { ...headers(), 'Content-Type': 'application/json', Prefer: 'return=minimal' },
    body: JSON.stringify(row),
    keepalive: true,
  });
  return res.ok;
}
