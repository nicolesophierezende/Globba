// Creates supabase/seed-sample.sql (the invented sample stores) and the CSV templates in data/.
// Run with: node scripts/make-seed.mjs
import { writeFileSync, mkdirSync } from 'node:fs';
import { P, S } from '../src/data/sample.js';

const q = (v) => (v == null || v === '' ? 'null' : `'${String(v).replace(/'/g, "''")}'`);
const arr = (a) => `array[${a.map(q).join(',')}]::text[]`;
let sql = '-- Sample data (invented stores). Optional: run after schema.sql to try the app.\n-- Delete it later with: delete from stores; delete from products;\n\n';
sql += 'insert into public.products (id, name_it, name_en, synonyms) values\n' +
  Object.entries(P).map(([id, p]) => `  (${q(id)}, ${q(p.it)}, ${q(p.en)}, ${arr(p.s)})`).join(',\n') + '\non conflict (id) do nothing;\n\n';
sql += 'insert into public.stores (id, name, address, lat, lng, phone, regions, hours_it, hours_en, last_checked) values\n' +
  S.map((s) => `  (${q(s.id)}, ${q(s.n)}, ${q(s.a)}, ${s.lat}, ${s.lng}, ${q(s.ph)}, ${arr(s.r)}, ${q(s.h[0])}, ${q(s.h[1])}, ${q(s.chk)})`).join(',\n') + '\non conflict (id) do nothing;\n\n';
sql += 'insert into public.inventory (store_id, product_id, availability) values\n' +
  S.flatMap((s) => Object.entries(s.inv).map(([p, a]) => `  (${q(s.id)}, ${q(p)}, ${q(a)})`)).join(',\n') + '\non conflict do nothing;\n';
writeFileSync(new URL('../supabase/seed-sample.sql', import.meta.url), sql);

// CSV templates with the same columns as the database (for the spreadsheet phase).
const csv = (rows) => rows.map((r) => r.map((v) => { v = v == null ? '' : String(v); return /[",\n]/.test(v) ? `"${v.replace(/"/g, '""')}"` : v; }).join(',')).join('\n') + '\n';
const pg = (a) => `{${a.map((v) => `"${v.replace(/"/g, '\\"')}"`).join(',')}}`;
mkdirSync(new URL('../data/', import.meta.url), { recursive: true });
writeFileSync(new URL('../data/stores.csv', import.meta.url), csv([
  ['id', 'name', 'address', 'lat', 'lng', 'phone', 'whatsapp', 'regions', 'hours_it', 'hours_en', 'last_checked', 'published', 'notes'],
  ...S.slice(0, 2).map((s) => [s.id, s.n, s.a, s.lat, s.lng, s.ph, '', pg(s.r), s.h[0], s.h[1], s.chk, 'true', 'EXAMPLE ROW – delete']),
]));
writeFileSync(new URL('../data/products.csv', import.meta.url), csv([
  ['id', 'name_it', 'name_en', 'synonyms'],
  ...Object.entries(P).slice(0, 3).map(([id, p]) => [id, p.it, p.en, pg(p.s)]),
]));
writeFileSync(new URL('../data/inventory.csv', import.meta.url), csv([
  ['store_id', 'product_id', 'availability'],
  ...Object.entries(S[0].inv).slice(0, 3).map(([p, a]) => [S[0].id, p, a]),
]));
console.log('Wrote supabase/seed-sample.sql and data/*.csv');
