# Globba – project brief (read this first)

Globba is a mobile-first web app (PWA) that maps international grocery stores in Turin (Torino) and lets people search for a product to see which stores sell it. Italian and English. Full plan: `Globba.md`.

## Tools
- **Astro** (static site) → `npm run dev` to work locally, `npm run build` to build into `dist/`.
- **Leaflet + markercluster** loaded from cdnjs; map tiles from CARTO, with Esri / OSM France / OSM as fallbacks.
- **Supabase** (database + admin login). Schema and security rules: `supabase/schema.sql`.
- **Netlify** hosting (`netlify.toml`). A GitHub Action (`.github/workflows/rebuild.yml`) rebuilds every night.
- Free tools only. Built one feature at a time with AI.

## Where things are
- `src/pages/index.astro` – the map app page (markup identical to the original prototype in `prototype/index.html`).
- `src/styles/app.css` – the app's styles (copied unchanged from the prototype). Design: colorful but clean, mobile first.
- `src/scripts/app.js` – the app logic: map, pins, region chips, product search (synonyms, typo tolerance), store sheet, language switch, "request this product".
- `src/lib/data.js` – loads data from Supabase (or `src/data/sample.js` when Supabase is not set). Turns rows into the compact `R` (regions), `P` (products), `S` (stores) objects used everywhere.
- `src/components/StorePage.astro`, `ProductPage.astro`, `ListPage.astro`, `Privacy.astro` – the Google-friendly pages; thin route files are in `src/pages/negozi`, `prodotti`, `en/...`.
- `src/pages/admin/index.astro` + `src/scripts/admin.js` – private admin (email login link, only emails in the `admins` table can edit).
- `public/` – manifest, service worker (`sw.js`), icons.

## Rules
- Do not change the look or behavior of the map app unless asked. Keep the colors in `:root` of `app.css`.
- Every user-facing text exists in Italian and English (`T` object in `app.js`, and the `en` checks in components).
- Security: visitors can only read stores/products and insert into `product_requests` / `search_misses`. All writes need `is_admin()`. Never put the Supabase service_role key in the site.
- Page addresses: `/negozi/<id>/` and `/en/stores/<id>/`, `/prodotti/<id>/` and `/en/products/<id>/`.
- Availability codes: `u` usually, `s` sometimes, `z` seasonal.
