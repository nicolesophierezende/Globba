// sitemap.xml: the list of pages for Google.
import { loadData } from '../lib/data.js';
import { paths } from '../config.js';

export async function GET({ site }) {
  const { S, P } = await loadData();
  const base = site ? site.href.replace(/\/$/, '') : '';
  const urls = ['/', paths.stores('it'), paths.stores('en'), paths.products('it'), paths.products('en'), paths.privacy('it'), paths.privacy('en')];
  for (const s of S) urls.push(paths.store('it', s.id), paths.store('en', s.id));
  for (const id of Object.keys(P)) if (S.some((s) => s.inv[id])) urls.push(paths.product('it', id), paths.product('en', id));
  const lastmod = Object.fromEntries(S.flatMap((s) => [[paths.store('it', s.id), s.chk], [paths.store('en', s.id), s.chk]]));
  const body = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls
    .map((u) => `  <url><loc>${base}${u}</loc>${lastmod[u] ? `<lastmod>${lastmod[u]}</lastmod>` : ''}</url>`)
    .join('\n')}\n</urlset>\n`;
  return new Response(body, { headers: { 'Content-Type': 'application/xml' } });
}
