export function GET({ site }) {
  const base = site ? site.href.replace(/\/$/, '') : '';
  return new Response(`User-agent: *\nAllow: /\nDisallow: /admin/\n${base ? `Sitemap: ${base}/sitemap.xml\n` : ''}`, { headers: { 'Content-Type': 'text/plain' } });
}
