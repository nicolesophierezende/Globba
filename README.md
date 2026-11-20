# Globba

*Il tuo mondo, dietro l’angolo* – a map of international grocery stores in Turin, with product search.

This folder has everything needed to put Globba online as a website that can also be installed on a phone (PWA). The map app looks and works the same as the original prototype (kept in `prototype/index.html` for reference).

## What's included

| Part | Where | What it does |
|---|---|---|
| Map app | `/` | The prototype: map, colored pins, region filters, product search with synonyms and typo tolerance, store sheet, IT/EN. |
| Store pages | `/negozi/<store>/`, `/en/stores/<store>/` | One page per store for Google and for sharing. |
| Product pages | `/prodotti/<product>/`, `/en/products/<product>/` | "Where to buy X in Turin" pages. |
| Lists | `/negozi/`, `/prodotti/` (+ English) | All stores by region, all products. |
| Privacy policy | `/privacy/`, `/en/privacy/` | GDPR text (fill in your name and email). |
| Admin | `/admin/` | Private page to add/edit stores, products and what each store sells, and to read product requests and searches with no results. |
| Install on phone | `manifest.webmanifest`, `sw.js`, icons | "Add to home screen", works offline for pages already visited. |
| SEO | `sitemap.xml`, `robots.txt`, page titles/descriptions, Google business data | Lets Google find every store and product. |
| Database | `supabase/schema.sql` | Tables and security rules (only you can edit). |
| Hosting | `netlify.toml`, `.github/workflows/rebuild.yml` | Netlify settings and a nightly rebuild. |
| AI brief | `CLAUDE.md` | The project brief that AI tools read at the start of every session. |

Without Supabase, the site runs with the invented sample stores, so you can try everything right away.

---

## Step 1 – Run it on your computer

You need [Node.js](https://nodejs.org) 20 or newer (the LTS version is fine).

```bash
npm install
```

```bash
npm run dev
```

Open http://localhost:4321. Changes to files show up immediately. To build the final site into `dist/`, run `npm run build`.

## Step 2 – Database (Supabase, free)

1. Create a project at [supabase.com](https://supabase.com). Choose an **EU region** (e.g. Frankfurt) for GDPR.
2. Open **SQL Editor → New query**, paste all of `supabase/schema.sql`, click **Run**.
3. Optional, to start with the sample stores: run `supabase/seed-sample.sql` the same way. (Delete them before launch.)
4. Make yourself the admin:
   - **Authentication → Users → Add user → Send invitation** with your email.
   - In the SQL Editor run (with your email):
     ```sql
     insert into public.admins (email) values ('your-email@example.com');
     ```
5. **Authentication → URL Configuration**: set *Site URL* to your site address (e.g. `https://globba.netlify.app`) and add `https://globba.netlify.app/admin/` and `http://localhost:4321/admin/` to *Redirect URLs*.
6. Copy **Project URL** and the **anon / publishable key** (Project Settings → API). Copy `.env.example` to `.env` and paste them:
   ```
   PUBLIC_SUPABASE_URL=https://xxxx.supabase.co
   PUBLIC_SUPABASE_ANON_KEY=eyJ...
   ```
   The anon key is safe to be public; the security rules protect the data. **Never** use the `service_role` key in this project.

## Step 3 – Put it online (Netlify, free)

1. Push this repository to GitHub (already done if you're reading this there).
2. On [netlify.com](https://netlify.com): **Add new site → Import an existing project → GitHub →** choose this repository. Netlify reads `netlify.toml`, so no build settings are needed.
3. **Site configuration → Environment variables**: add `PUBLIC_SUPABASE_URL`, `PUBLIC_SUPABASE_ANON_KEY`, `PUBLIC_CONTACT_EMAIL`, `PUBLIC_OWNER_NAME` (and `SITE_URL` once you have a custom domain).
4. **Deploys → Trigger deploy**. Every push to GitHub also deploys automatically.
5. Nightly rebuild (so store pages pick up admin changes): **Site configuration → Build & deploy → Build hooks → Add build hook**, copy the URL; on GitHub, **Settings → Secrets and variables → Actions → New repository secret** named `NETLIFY_BUILD_HOOK` with that URL. The daily build also keeps the free Supabase project from pausing.

If Supabase is unreachable during a build, the build stops on purpose and the previous version stays online (it never replaces your real stores with the samples).

## Step 4 – Add your stores

Go to `/admin/`, enter your email, click the link you receive.

- **Stores**: name, address → **Find on map** (or click the map), regions, phone, hours, products with availability. Press **Today** after each visit to update "last checked" (stores not checked for 60+ days show a warning to visitors).
- **Products**: Italian and English name plus synonyms (other languages, brands, spellings). Synonyms are what make the search find things.
- **Requests & searches**: what people asked for and searched without results.

Changes appear on the map immediately. Store and product pages update at the next build (nightly, or **Trigger deploy** in Netlify).

Prefer a spreadsheet? `data/stores.csv`, `data/products.csv` and `data/inventory.csv` have the exact columns. Fill them in and import them in Supabase (**Table Editor → table → Insert → Import data from CSV**): products first, then stores, then inventory. Regions are written like `{latam}` or `{africa,latam}`.

## Before launch – checklist

- [ ] Final name and domain (`SITE_URL`). If you change the name, update `src/config.js`, `public/manifest.webmanifest` and the logo text.
- [ ] Real email and name in the privacy policy (`PUBLIC_CONTACT_EMAIL`, `PUBLIC_OWNER_NAME`), and read `src/components/Privacy.astro` once.
- [ ] Remove the sample stores from Supabase.
- [ ] Optional statistics: create a free [GoatCounter](https://www.goatcounter.com) site and set `PUBLIC_GOATCOUNTER_CODE` (no cookies, no banner needed).
- [ ] Submit `https://your-site/sitemap.xml` in [Google Search Console](https://search.google.com/search-console).
- [ ] Test on a real phone: install to home screen, "Near me", Directions, WhatsApp, Call.

## How data flows

```
Supabase ──(build)──▶ Astro ──▶ static pages on Netlify (fast, Google-friendly)
    │
    └──(in the browser)──▶ map app loads fresh data, so admin edits show at once
Visitors ──▶ "Request this product" / searches with no results ──▶ Supabase (insert only)
```

## Project structure

```
src/
  pages/index.astro        the map app
  pages/negozi, prodotti, en/…   store, product, list and privacy pages
  pages/admin/             admin page
  scripts/app.js           map app logic (from the prototype)
  scripts/admin.js         admin logic
  styles/app.css           map app styles (from the prototype)
  lib/data.js              loads data from Supabase or the sample file
  data/sample.js           invented sample stores
  components/, layouts/    shared pieces of the content pages
  config.js                name, taglines, contact, page addresses
public/                    manifest, service worker, icons
supabase/                  schema.sql (tables + security), seed-sample.sql
scripts/make-seed.mjs      regenerates seed-sample.sql and the CSV templates
prototype/index.html       the original single-file prototype
```
