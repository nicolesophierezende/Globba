# International Grocery Map of Turin – Project Plan

*A web app to find international grocery stores and the products they sell*

- **Name candidates:** Mercatlas or Globba (to be decided)
- **City:** Turin (Torino), Italy
- **Status:** Planning complete, ready to start building
- **Date:** November 2026

---

## 1. The idea

An interactive map of Turin showing grocery stores that sell international products (Latin American, Asian, Middle Eastern, African and more). Each store has a pin colored by region. Tapping a pin shows the store's name, address, category and phone number. Next to each store name there is a search icon: the user can search for a product and see whether that store has it.

### Who it is for

- **International students and newcomers** who don't know the city yet and miss products from home.
- **People who cook food from other cultures** and don't know where to find ingredients.
- **Long-term residents** looking for products from other cuisines or stores closer to home.

### What makes it different

Google Maps lists stores but not what they sell, and much of this knowledge lives in WhatsApp and Facebook groups. This app combines a map organized by region with a search for specific products. The product search is the core of the idea.

---

## 2. Name candidates

| | Mercatlas | Globba |
|---|---|---|
| **Meaning** | "Mercato" + "atlas": a world atlas of markets | From "global": short and playful |
| **Strengths** | Says what the app does. Works in Italian and English. Sounds trustworthy and helps with Google search. | Short, fun and memorable. Fits the colorful, friendly style. Great for a logo. |
| **Weaknesses** | A bit longer; may be misspelled at first. | Doesn't explain the app on its own, so it needs a tagline. More likely to be used already. |
| **Tagline (IT)** | "Il mondo in dispensa, qui a Torino" | "Il tuo mondo, dietro l'angolo" |
| **Tagline (EN)** | "The world's ingredients, right here in Turin" | "Your world, around the corner" |

### Checklist before choosing

- [ ] Is the **.com** domain free? Backups: get[name].com, [name].app, or a .it domain.
- [ ] Are the **Instagram and TikTok** handles free?
- [ ] Does a quick **Google search** show another business using a similar name?

---

## 3. Decisions made

| Topic | Decision |
|---|---|
| Type of product | Web app (PWA) that also has real pages for each store and product, so Google can find them. |
| Launch city | Turin only. |
| Store types | Grocery stores only in the first version. |
| Categories | Grouped by region. Grouping by country can come later. |
| Languages | Italian and English at launch. More languages later, based on user groups. |
| Product data | Added manually by the project owner at first. |
| Prices | Not in the first version. Later shown as "approximate price," updated by store owners once they join. |
| Map view | Shows all of Turin and zooms to the user's current location. |
| Accounts | No accounts in the first version. Later: accounts with saved stores (heart icon) and a preferences quiz. |
| Design | Colorful and user-friendly, but as clean and minimal as possible. Mobile first. |
| Build method | Vibe coding: built mostly with AI, one feature at a time. |
| Budget | Free tools only. |
| Success | People actually using the app, and the app working well. |

---

## 4. Region categories (proposal)

A starting list to confirm or adjust. Each region gets its own pin color.

| Color | Region | Examples |
|---|---|---|
| Orange-red `#E85D3A` | Latin American | Peru, Mexico, Colombia, Brazil, Caribbean |
| Pink `#D94F8A` | East & Southeast Asian | China, Japan, Korea, Philippines, Thailand |
| Yellow-orange `#F2A541` | South Asian | India, Pakistan, Bangladesh, Sri Lanka |
| Teal `#14918A` | Middle Eastern & North African | Morocco, Egypt, Tunisia, Lebanon, Turkey |
| Purple `#8E5BB5` | Sub-Saharan African | Nigeria, Senegal, Ghana, Ivory Coast |
| Blue `#3B82C4` | Eastern European | Romania, Albania, Moldova, Ukraine, Poland |

> Still to decide: how to show a store that fits two regions (for example a split-color pin, or one main region with a second tag).

---

## 5. Features

### First version (MVP)

| Area | Feature |
|---|---|
| Map | Map of all of Turin with colored pins by region, zooming to the user's location. |
| Map | Popup with store name, address, region and phone number. |
| Map | "Near me" button, list view next to the map, and pin clustering for busy areas. |
| Map | "Directions" button that opens Google Maps or Apple Maps. |
| Map | Filter stores by region. |
| Store | Opening hours, WhatsApp button and "last checked" date. |
| Search | Search icon next to each store name to check for a product in that store. |
| Search | General product search: which stores have this product? |
| Search | Synonyms in several languages (e.g. masa harina / farina di mais nixtamalizzato / Maseca). |
| Search | Typo tolerance ("kimci" still finds kimchi). |
| Search | Availability levels: usually available, sometimes, seasonal. |
| Search | "Can't find it? Request it" button to learn what people want. |
| Pages | One page per store and per product, readable by Google and shareable by link. |
| App | Installable on the phone home screen (PWA). Italian and English. |
| Legal | Privacy policy (GDPR). Privacy-friendly analytics without tracking cookies. |
| Analytics | Track searches, especially searches with no results. |

### Later versions

| Area | Feature |
|---|---|
| Accounts | User accounts, saved stores with a heart icon, and an onboarding preferences quiz (e.g. favorite cuisines). |
| Map | "Open now" filter and neighborhood filter (San Salvario, Aurora, Barriera di Milano...). |
| Store | Photos, payment methods, languages spoken, Instagram, delivery, halal or kosher certification. |
| Categories | Filter by country inside each region. |
| Prices | "Approximate price" per product, updated by store owners. |
| Community | "I found it here" and "Not available anymore" buttons; form to suggest a new store. |
| Content | Recipe guides, seasonal guides (Ramadan, Chinese New Year...) and cuisine guides linking to stores. |
| Business | "Claim your store" for owners, featured listings, promotions, QR window stickers. |
| Store types | Butchers, bakeries, hair and cosmetics shops, restaurants. |
| App | More languages, offline access to viewed stores, dark mode, other cities. |

---

## 6. Tools (all free)

| Tool | What it does |
|---|---|
| Astro | Framework that builds fast, Google-friendly pages and adds the interactive map only where needed. |
| Leaflet + OpenStreetMap | The map, colored pins and popups. Free, no credit card needed. |
| Supabase | Database for stores, regions and products; later user accounts. Free plan pauses after about a week of inactivity (one click to restart). |
| Netlify or Vercel | Free hosting and a free web address. |
| GitHub | Saves every working version so you can go back if something breaks. |
| Domain (optional) | Custom .com domain, around $10–15 per year. |

---

## 7. Data plan

Start collecting stores in a spreadsheet while the app is being built. The database will follow the same structure.

| Column | Notes |
|---|---|
| Store name | |
| Address | Used to place the pin on the map. |
| Phone / WhatsApp | |
| Region(s) | Allow more than one. |
| Opening hours | |
| Key products | Focus on important products, not the full inventory. Include synonyms. |
| Availability | Usually / sometimes / seasonal. |
| Last checked | Date of your last visit or confirmation. |

---

## 8. Building with AI (vibe coding)

- **One feature at a time.** Build it, test it, save it on GitHub, then move on.
- **Give context every session.** Paste a short project brief so the AI knows the app, the tools and what already works.
- **Describe problems clearly.** Copy the exact error, say what you expected and what happened.
- **Security first.** Make sure only you can edit the data. In Supabase this means Row Level Security rules. Ask the AI directly to check this.
- **Save versions.** If an AI change breaks the app, go back to the last working version.

---

## 9. Roadmap

| Step | What happens | Estimated time |
|---|---|---|
| 1. Name & setup | Choose the name, check the domain and social handles, create GitHub, Supabase and hosting accounts. | A few days |
| 2. Project brief | Write the short brief the AI will receive in every session. | 1 day |
| 3. Map | Map of Turin, colored pins, popups, region filter, user location. | 1–2 weeks |
| 4. Database & search | Stores and products in Supabase, product search with synonyms and availability levels. | 1–2 weeks |
| 5. Pages & languages | Store and product pages, Italian and English, PWA install. | 1 week |
| 6. Admin page | Private, protected page to add and edit stores and products. | 1 week |
| 7. Launch | Privacy policy, analytics, testing on phones, share in Turin groups. | A few days |
| In parallel | Visit stores and fill the spreadsheet. | Ongoing |

*Total for the first version: about 3–6 weeks of part-time work, plus data collection.*

---

## 10. Still to decide

- [ ] **Final name:** Mercatlas or Globba.
- [ ] **Store owners:** tell stores before listing them, or list first and contact later?
- [ ] **Data updates:** how often to recheck stores, and when to mark data as "may be outdated".
- [ ] **Two-region stores:** split-color pin or one main region?
- [ ] **Final region list** and colors.

---

## 11. What success looks like

People use the app and it works well. Simple signs to watch:

- Number of visitors each week, and how many come back.
- Number of product searches, and how many find a result.
- Visitors arriving from Google search.
- Products people request that aren't in the app yet.
