import { defineConfig } from 'astro/config';

// SITE_URL: the public address, e.g. https://globba.app (Netlify sets URL automatically).
const site = process.env.SITE_URL || process.env.URL || 'https://globba.netlify.app';

export default defineConfig({
  site,
  output: 'static',
  trailingSlash: 'ignore',
  build: { format: 'directory' },
});
