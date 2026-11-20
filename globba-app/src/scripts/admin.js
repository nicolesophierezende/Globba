// Globba admin: log in with an email link, then add/edit stores, products and inventory.
import { createClient } from '@supabase/supabase-js';
import { SUPABASE_URL, SUPABASE_KEY, hasSupabase } from '../lib/data.js';

const $ = (s, el = document) => el.querySelector(s);
const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const slug = (s) => s.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 60);
const today = () => new Date().toISOString().slice(0, 10);
const AV = { u: 'Usually', s: 'Sometimes', z: 'Seasonal' };
const TURIN = [45.0694, 7.6861];

if (hasSupabase) start();

function start() {
  const db = createClient(SUPABASE_URL, SUPABASE_KEY);
  let regions = [], products = [], stores = [], inventory = [];
  let tab = 'stores';

  const flash = (text, kind = 'ok') => {
    $('#flash').innerHTML = text ? `<div class="msg ${kind}">${esc(text)}</div>` : '';
    if (text) window.scrollTo({ top: 0, behavior: 'smooth' });
  };
  const fail = (e) => { console.error(e); flash(e.message || String(e), 'err'); };

  // ---------- Login ----------
  $('#loginform').addEventListener('submit', async (e) => {
    e.preventDefault();
    const email = $('#email').value.trim();
    const { error } = await db.auth.signInWithOtp({ email, options: { emailRedirectTo: location.origin + '/admin/', shouldCreateUser: false } });
    $('#loginmsg').innerHTML = error
      ? `<div class="msg err">${esc(error.message)}</div>`
      : `<div class="msg ok">Check your inbox: we sent a login link to ${esc(email)}.</div>`;
  });
  $('#logout').onclick = async () => { await db.auth.signOut(); location.reload(); };

  db.auth.onAuthStateChange((_ev, session) => { setTimeout(() => show(session), 0); });

  let shown = null;
  async function show(session) {
    const email = session?.user?.email || null;
    if (email === shown) return;
    shown = email;
    $('#login').hidden = !!session;
    $('#app').hidden = true;
    $('#who').hidden = !session;
    if (!session) return;
    $('#whoemail').textContent = email;
    const { data: ok, error } = await db.rpc('is_admin');
    if (error) return fail(error);
    if (!ok) {
      $('#app').hidden = false;
      $('.tabs').hidden = true;
      $('#view').innerHTML = `<div class="card"><h2 style="margin-top:0">Not an admin</h2><p>${esc(email)} is not in the <code>admins</code> table. Add it in Supabase (SQL Editor) with:</p><pre style="white-space:pre-wrap">insert into public.admins (email) values ('${esc(email)}');</pre><p>Then reload this page.</p></div>`;
      return;
    }
    $('#app').hidden = false;
    await loadAll();
    render();
  }

  async function loadAll() {
    const [r, p, s, i] = await Promise.all([
      db.from('regions').select('*').order('sort'),
      db.from('products').select('*').order('name_it'),
      db.from('stores').select('*').order('name'),
      db.from('inventory').select('*'),
    ]);
    for (const x of [r, p, s, i]) if (x.error) throw x.error;
    regions = r.data; products = p.data; stores = s.data; inventory = i.data;
  }
  const regionById = (id) => regions.find((r) => r.id === id);
  const fill = (rs) => {
    const c = rs.map((k) => regionById(k)?.color || '#ccc');
    return c.length > 1 ? `conic-gradient(${c[0]} 0 50%, ${c[1]} 0)` : c[0];
  };

  // ---------- Tabs ----------
  $('.tabs').addEventListener('click', (e) => {
    const b = e.target.closest('button'); if (!b) return;
    tab = b.dataset.tab; flash('');
    document.querySelectorAll('.tabs button').forEach((x) => x.setAttribute('aria-pressed', x === b));
    render();
  });
  // "Edit" buttons in the lists
  $('#view').addEventListener('click', (e) => {
    const b = e.target.closest('[data-edit]'); if (!b) return;
    if (tab === 'stores') storeForm(stores.find((s) => s.id === b.dataset.edit));
    else if (tab === 'products') productForm(products.find((p) => p.id === b.dataset.edit));
  });
  function render() {
    if (tab === 'stores') storeList();
    else if (tab === 'products') productList();
    else requests();
  }

  // ---------- Stores ----------
  function storeList(filter = '') {
    const f = slug(filter);
    const list = stores.filter((s) => !f || slug(s.name + ' ' + s.address).includes(f));
    $('#view').innerHTML = `<div class="card">
      <div class="toolbar"><input type="search" id="sf" placeholder="Filter stores…" value="${esc(filter)}"><button class="btn" id="newstore">+ New store</button></div>
      <p class="muted" style="margin:10px 0 0">${stores.length} stores · Changes show on the map right away; store and product pages update at the next build (automatic every night).</p>
      <div style="margin-top:6px">${list.map((s) => {
        const n = inventory.filter((i) => i.store_id === s.id).length;
        const old = (Date.now() - new Date(s.last_checked)) / 864e5 > 60;
        return `<div class="row"><span class="swatch" style="background:${fill(s.regions)}"></span>
          <div class="main"><div class="name">${esc(s.name)}${s.published ? '' : ' <span class="muted">(hidden)</span>'}</div>
          <div class="meta">${esc(s.address)} · ${n} products · checked ${esc(s.last_checked)}${old ? ' ⚠️' : ''}</div></div>
          <button class="btn ghost" data-edit="${esc(s.id)}">Edit</button></div>`;
      }).join('') || '<p class="muted">No stores yet.</p>'}</div></div>`;
    $('#sf').addEventListener('input', (e) => { const v = e.target.value; storeList(v); const el = $('#sf'); el.focus(); el.setSelectionRange(v.length, v.length); });
    $('#newstore').onclick = () => storeForm(null);
  }

  let pickMap = null;
  function storeForm(s) {
    const isNew = !s;
    s = s || { id: '', name: '', address: '', lat: null, lng: null, phone: '', whatsapp: '', regions: [regions[0]?.id], hours_it: '', hours_en: '', last_checked: today(), published: true, notes: '' };
    const inv = Object.fromEntries(inventory.filter((i) => i.store_id === s.id).map((i) => [i.product_id, i.availability]));
    const regionOpts = (sel, blank) => (blank ? '<option value="">—</option>' : '') + regions.map((r) => `<option value="${r.id}" ${r.id === sel ? 'selected' : ''}>${esc(r.name_en)}</option>`).join('');
    $('#view').innerHTML = `<form class="card" id="sform">
      <div class="toolbar" style="justify-content:space-between;margin-bottom:10px"><button type="button" class="linkbtn" id="back">← All stores</button>
        ${isNew ? '' : `<a href="/negozi/${esc(s.id)}/" target="_blank" rel="noopener">Public page ↗</a>`}</div>
      <h2 style="margin:0 0 12px">${isNew ? 'New store' : esc(s.name)}</h2>
      <div class="grid">
        <label class="f">Name<input type="text" name="name" required value="${esc(s.name)}"></label>
        <label class="f">Page address (id) <span class="h">Letters, numbers and dashes. ${isNew ? 'Filled from the name.' : 'Cannot be changed.'}</span>
          <input type="text" name="id" required pattern="[a-z0-9-]+" value="${esc(s.id)}" ${isNew ? '' : 'readonly'}></label>
        <label class="f full">Address <span class="h">Street and number, without “Torino”.</span>
          <div class="toolbar"><input type="text" name="address" required value="${esc(s.address)}"><button type="button" class="btn ghost" id="geo">Find on map</button></div></label>
        <div class="full"><div id="pickmap"></div><p class="muted" style="font-size:13px;margin:4px 0 0">Drag the pin or click the map to adjust the position.</p></div>
        <label class="f">Latitude<input type="number" step="any" name="lat" required value="${s.lat ?? ''}"></label>
        <label class="f">Longitude<input type="number" step="any" name="lng" required value="${s.lng ?? ''}"></label>
        <label class="f">Main region (pin color)<select name="r1" required>${regionOpts(s.regions[0])}</select></label>
        <label class="f">Second region <span class="h">Optional: the pin is split in two colors.</span><select name="r2">${regionOpts(s.regions[1] || '', true)}</select></label>
        <label class="f">Phone<input type="text" name="phone" value="${esc(s.phone)}" placeholder="+39 011 …"></label>
        <label class="f">WhatsApp <span class="h">Only if different from the phone.</span><input type="text" name="whatsapp" value="${esc(s.whatsapp)}" placeholder="+39 3…"></label>
        <label class="f">Opening hours (Italian)<input type="text" name="hours_it" value="${esc(s.hours_it)}" placeholder="Lun–Sab 9–20"></label>
        <label class="f">Opening hours (English)<input type="text" name="hours_en" value="${esc(s.hours_en)}" placeholder="Mon–Sat 9–20"></label>
        <label class="f">Last checked<div class="toolbar"><input type="date" name="last_checked" required value="${esc(s.last_checked)}"><button type="button" class="btn ghost" id="today">Today</button></div></label>
        <label class="f" style="align-self:end;display:flex;gap:8px;align-items:center"><input type="checkbox" name="published" ${s.published ? 'checked' : ''}> Visible on the site</label>
        <label class="f full">Private notes <span class="h">Not shown on the site.</span><textarea name="notes" rows="2">${esc(s.notes)}</textarea></label>
      </div>
      <h3 style="margin:20px 0 8px">Products in this store</h3>
      <div class="toolbar" style="margin-bottom:8px"><input type="search" id="pf" placeholder="Filter products…"><label style="display:flex;gap:6px;align-items:center;font-size:14px"><input type="checkbox" id="onlyon"> Only selected</label></div>
      <div class="inv" id="inv">${products.map((p) => `<div class="row ${inv[p.id] ? 'on' : ''}" data-p="${esc(p.id)}" data-k="${esc(slug([p.name_it, p.name_en, ...p.synonyms].join(' ')))}">
          <div class="main"><div class="name">${esc(p.name_it)}</div><div class="meta">${esc(p.name_en)}${p.synonyms.length ? ' · ' + esc(p.synonyms.slice(0, 3).join(', ')) : ''}</div></div>
          <select name="inv:${esc(p.id)}"><option value="">—</option>${Object.entries(AV).map(([k, v]) => `<option value="${k}" ${inv[p.id] === k ? 'selected' : ''}>${v}</option>`).join('')}</select></div>`).join('') || '<p class="muted">Add products in the Products tab first.</p>'}</div>
      <div class="toolbar" style="margin-top:16px;justify-content:space-between">
        <button class="btn" id="save">Save store</button>
        ${isNew ? '' : '<button type="button" class="btn danger" id="del">Delete store</button>'}
      </div>
    </form>`;
    const form = $('#sform');
    $('#back').onclick = () => { flash(''); storeList(); };
    $('#today').onclick = () => { form.last_checked.value = today(); };
    if (isNew) form.name.addEventListener('input', () => { form.id.value = slug(form.name.value); });

    // Product filter
    const filterInv = () => {
      const f = slug($('#pf').value), only = $('#onlyon').checked;
      document.querySelectorAll('#inv .row').forEach((r) => {
        r.hidden = (f && !r.dataset.k.includes(f)) || (only && !r.querySelector('select').value);
      });
    };
    $('#pf').addEventListener('input', filterInv);
    $('#onlyon').addEventListener('change', filterInv);
    $('#inv').addEventListener('change', (e) => { const r = e.target.closest('.row'); if (r) r.classList.toggle('on', !!e.target.value); });

    // Map picker
    if (pickMap) { pickMap.remove(); pickMap = null; }
    let marker = null;
    if (window.L) {
      const start = s.lat != null ? [s.lat, s.lng] : TURIN;
      pickMap = L.map('pickmap').setView(start, s.lat != null ? 16 : 12);
      L.tileLayer('https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png', { subdomains: 'abcd', maxZoom: 20, attribution: '&copy; OpenStreetMap &copy; CARTO' }).addTo(pickMap);
      const place = (lat, lng, zoom) => {
        const color = regionById(form.r1.value)?.color || '#551B81';
        const icon = L.divIcon({ className: '', html: `<span class="pin" style="background:${color}"></span>`, iconSize: [26, 26], iconAnchor: [13, 13] });
        if (!marker) { marker = L.marker([lat, lng], { draggable: true, icon }).addTo(pickMap); marker.on('dragend', () => { const p = marker.getLatLng(); setLL(p.lat, p.lng); }); }
        else { marker.setLatLng([lat, lng]); marker.setIcon(icon); }
        if (zoom) pickMap.setView([lat, lng], zoom);
      };
      const setLL = (lat, lng) => { form.lat.value = lat.toFixed(6); form.lng.value = lng.toFixed(6); };
      if (s.lat != null) place(s.lat, s.lng);
      pickMap.on('click', (e) => { setLL(e.latlng.lat, e.latlng.lng); place(e.latlng.lat, e.latlng.lng); });
      form.r1.addEventListener('change', () => { if (marker) { const p = marker.getLatLng(); place(p.lat, p.lng); } });
      for (const n of ['lat', 'lng']) form[n].addEventListener('change', () => { const a = +form.lat.value, b = +form.lng.value; if (a && b) place(a, b, 16); });
      $('#geo').onclick = async () => {
        const q = form.address.value.trim(); if (!q) return;
        try {
          const res = await fetch(`https://nominatim.openstreetmap.org/search?format=json&limit=1&countrycodes=it&viewbox=7.55,45.15,7.80,44.98&bounded=1&q=${encodeURIComponent(q + ', Torino')}`, { headers: { 'Accept-Language': 'it' } });
          const [hit] = await res.json();
          if (!hit) { flash('Address not found: check the spelling, or place the pin by clicking on the map.', 'err'); return; }
          setLL(+hit.lat, +hit.lon); place(+hit.lat, +hit.lon, 17); flash('');
        } catch (e) { fail(e); }
      };
    } else {
      $('#pickmap').outerHTML = '<p class="muted">Map not available: type the coordinates (right-click the place in Google Maps to copy them).</p>';
      $('#geo').hidden = true;
    }

    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      const btn = $('#save'); btn.disabled = true;
      try {
        const r = [form.r1.value, form.r2.value].filter((v, i, a) => v && a.indexOf(v) === i);
        const row = {
          id: form.id.value.trim(), name: form.name.value.trim(), address: form.address.value.trim(),
          lat: +form.lat.value, lng: +form.lng.value, phone: form.phone.value.trim() || null, whatsapp: form.whatsapp.value.trim() || null,
          regions: r, hours_it: form.hours_it.value.trim() || null, hours_en: form.hours_en.value.trim() || null,
          last_checked: form.last_checked.value, published: form.published.checked, notes: form.notes.value.trim() || null,
        };
        if (!(row.lat > 44.9 && row.lat < 45.2 && row.lng > 7.4 && row.lng < 7.95)) throw new Error('The position is outside Turin: use “Find on map” or click on the map.');
        if (isNew && stores.some((x) => x.id === row.id)) throw new Error(`A store with the id “${row.id}” already exists.`);
        const q = isNew ? db.from('stores').insert(row) : db.from('stores').update(row).eq('id', row.id);
        const { error } = await q; if (error) throw error;
        const want = [...form.querySelectorAll('#inv select')].filter((x) => x.value).map((x) => ({ store_id: row.id, product_id: x.name.slice(4), availability: x.value }));
        const del = inventory.filter((i) => i.store_id === row.id && !want.some((w) => w.product_id === i.product_id)).map((i) => i.product_id);
        if (del.length) { const { error: e2 } = await db.from('inventory').delete().eq('store_id', row.id).in('product_id', del); if (e2) throw e2; }
        if (want.length) { const { error: e3 } = await db.from('inventory').upsert(want); if (e3) throw e3; }
        await loadAll();
        flash(`Saved “${row.name}”.`);
        storeForm(stores.find((x) => x.id === row.id));
      } catch (err) { fail(err); btn.disabled = false; }
    });
    if (!isNew) $('#del').onclick = async () => {
      if (!confirm(`Delete “${s.name}” and its product list? This cannot be undone.`)) return;
      const { error } = await db.from('stores').delete().eq('id', s.id);
      if (error) return fail(error);
      await loadAll(); flash(`Deleted “${s.name}”.`); storeList();
    };
  }

  // ---------- Products ----------
  function productList(filter = '') {
    const f = slug(filter);
    const list = products.filter((p) => !f || slug([p.name_it, p.name_en, ...p.synonyms].join(' ')).includes(f));
    $('#view').innerHTML = `<div class="card">
      <div class="toolbar"><input type="search" id="prf" placeholder="Filter products…" value="${esc(filter)}"><button class="btn" id="newprod">+ New product</button></div>
      <p class="muted" style="margin:10px 0 0">${products.length} products. Add synonyms in every language people might type (e.g. masa harina, Maseca, farina di mais nixtamalizzato).</p>
      <div style="margin-top:6px">${list.map((p) => {
        const n = inventory.filter((i) => i.product_id === p.id).length;
        return `<div class="row"><div class="main"><div class="name">${esc(p.name_it)} <span class="muted">/ ${esc(p.name_en)}</span></div>
          <div class="meta">${esc(p.synonyms.join(', ') || '—')}</div></div><span class="muted" style="font-size:14px">${n} stores</span>
          <button class="btn ghost" data-edit="${esc(p.id)}">Edit</button></div>`;
      }).join('') || '<p class="muted">No products yet.</p>'}</div></div>`;
    $('#prf').addEventListener('input', (e) => { const v = e.target.value; productList(v); const el = $('#prf'); el.focus(); el.setSelectionRange(v.length, v.length); });
    $('#newprod').onclick = () => productForm(null);
  }

  function productForm(p) {
    const isNew = !p;
    p = p || { id: '', name_it: '', name_en: '', synonyms: [] };
    $('#view').innerHTML = `<form class="card" id="pform">
      <div class="toolbar" style="justify-content:space-between;margin-bottom:10px"><button type="button" class="linkbtn" id="back">← All products</button>
        ${isNew ? '' : `<a href="/prodotti/${esc(p.id)}/" target="_blank" rel="noopener">Public page ↗</a>`}</div>
      <h2 style="margin:0 0 12px">${isNew ? 'New product' : esc(p.name_it)}</h2>
      <div class="grid">
        <label class="f">Name in Italian<input type="text" name="name_it" required value="${esc(p.name_it)}"></label>
        <label class="f">Name in English<input type="text" name="name_en" required value="${esc(p.name_en)}"></label>
        <label class="f">Page address (id) <span class="h">${isNew ? 'Filled from the English name.' : 'Cannot be changed.'}</span>
          <input type="text" name="id" required pattern="[a-z0-9-]+" value="${esc(p.id)}" ${isNew ? '' : 'readonly'}></label>
        <label class="f full">Synonyms <span class="h">Other names, brands and spellings, separated by commas.</span>
          <textarea name="synonyms" rows="2">${esc(p.synonyms.join(', '))}</textarea></label>
      </div>
      <div class="toolbar" style="margin-top:16px;justify-content:space-between">
        <button class="btn" id="save">Save product</button>
        ${isNew ? '' : '<button type="button" class="btn danger" id="del">Delete product</button>'}
      </div></form>`;
    const form = $('#pform');
    $('#back').onclick = () => { flash(''); productList(); };
    if (isNew) form.name_en.addEventListener('input', () => { form.id.value = slug(form.name_en.value); });
    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      const row = { id: form.id.value.trim(), name_it: form.name_it.value.trim(), name_en: form.name_en.value.trim(),
        synonyms: form.synonyms.value.split(',').map((x) => x.trim()).filter(Boolean) };
      try {
        if (isNew && products.some((x) => x.id === row.id)) throw new Error(`A product with the id “${row.id}” already exists.`);
        const { error } = isNew ? await db.from('products').insert(row) : await db.from('products').update(row).eq('id', row.id);
        if (error) throw error;
        await loadAll(); flash(`Saved “${row.name_it}”.`); productList();
      } catch (err) { fail(err); }
    });
    if (!isNew) $('#del').onclick = async () => {
      const n = inventory.filter((i) => i.product_id === p.id).length;
      if (!confirm(`Delete “${p.name_it}”? It will also be removed from ${n} stores.`)) return;
      const { error } = await db.from('products').delete().eq('id', p.id);
      if (error) return fail(error);
      await loadAll(); flash(`Deleted “${p.name_it}”.`); productList();
    };
  }

  // ---------- Requests & missed searches ----------
  async function requests() {
    $('#view').innerHTML = '<div class="card muted">Loading…</div>';
    const since = new Date(Date.now() - 90 * 864e5).toISOString();
    const [a, b] = await Promise.all([
      db.from('product_requests').select('query,lang,created_at').gte('created_at', since).order('created_at', { ascending: false }).limit(2000),
      db.from('search_misses').select('query,lang,created_at').gte('created_at', since).order('created_at', { ascending: false }).limit(2000),
    ]);
    if (a.error || b.error) return fail(a.error || b.error);
    const group = (rows) => {
      const m = new Map();
      for (const r of rows) { const k = slug(r.query); if (!k) continue; const g = m.get(k) || { q: r.query, n: 0, last: r.created_at }; g.n++; m.set(k, g); }
      return [...m.values()].sort((x, y) => y.n - x.n);
    };
    const table = (rows, empty) => rows.length ? rows.map((g) => `<div class="row"><span class="count">${g.n}</span><div class="main"><div class="name">${esc(g.q)}</div><div class="meta">last ${new Date(g.last).toLocaleDateString('it-IT')}</div></div></div>`).join('') : `<p class="muted">${empty}</p>`;
    $('#view').innerHTML = `
      <div class="card"><h2 style="margin-top:0">Product requests <span class="muted" style="font-size:15px">(last 90 days)</span></h2>
        <p class="muted" style="margin-top:0">People tapped “Request this product”. Good ideas for what to ask stores, or synonyms to add.</p>${table(group(a.data), 'No requests yet.')}</div>
      <div class="card"><h2 style="margin-top:0">Searches with no results <span class="muted" style="font-size:15px">(last 90 days)</span></h2>
        <p class="muted" style="margin-top:0">If a product exists under another name, add this word as a synonym.</p>${table(group(b.data), 'No missed searches yet.')}</div>`;
  }
}
