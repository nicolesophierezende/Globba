// General settings. Change these when the name and domain are final.
export const SITE = {
  name: 'Globba',
  city: 'Torino',
  // Used in the privacy policy. Replace with a real address before launch.
  contactEmail: import.meta.env.PUBLIC_CONTACT_EMAIL || 'ciao@globba.app',
  // Who is responsible for the data (privacy policy). Replace before launch.
  owner: import.meta.env.PUBLIC_OWNER_NAME || 'Il team di Globba',
  goatcounter: import.meta.env.PUBLIC_GOATCOUNTER_CODE || '',
  themeColor: '#551B81',
  description: {
    it: 'Mappa dei negozi alimentari internazionali di Torino: cerca un prodotto (kimchi, masa harina, ghee…) e scopri dove trovarlo.',
    en: 'Map of international grocery stores in Turin: search a product (kimchi, masa harina, ghee…) and find where to buy it.',
  },
  tagline: { it: 'Il tuo mondo, dietro l’angolo', en: 'Your world, around the corner' },
};

// Page addresses in each language.
export const paths = {
  home: (l) => (l === 'en' ? '/?lang=en' : '/'),
  stores: (l) => (l === 'en' ? '/en/stores/' : '/negozi/'),
  store: (l, id) => (l === 'en' ? `/en/stores/${id}/` : `/negozi/${id}/`),
  products: (l) => (l === 'en' ? '/en/products/' : '/prodotti/'),
  product: (l, id) => (l === 'en' ? `/en/products/${id}/` : `/prodotti/${id}/`),
  privacy: (l) => (l === 'en' ? '/en/privacy/' : '/privacy/'),
};
