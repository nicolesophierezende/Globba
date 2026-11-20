// Globba main app (map, search, store sheet). Same behavior as the original prototype;
// the data now comes from the page (built from Supabase or the sample file) instead of being hard-coded.
import { hasSupabase, loadFromSupabase, insertPublic } from '../lib/data.js';

(function(){
// ---------- Data ----------
let {R,P,S,sample}=JSON.parse(document.getElementById('globba-data').textContent);
const TODAY=new Date();

// ---------- Text ----------
const T={
 it:{tag:'Il tuo mondo, dietro l’angolo',ph:'Cerca un prodotto: kimchi, masa harina, ghee…',all:'Tutte',stores:n=>n===1?'1 negozio':`${n} negozi`,
  near:'Vicino a me',directions:'Percorso',call:'Chiama',wa:'WhatsApp',share:'Copia link',copied:'Link copiato',
  checked:'Verificato',ago:d=>d<=0?'oggi':d===1?'ieri':`${d} giorni fa`,stale:'Dati verificati più di 60 giorni fa: meglio chiamare prima di andare.',
  products:'Prodotti principali',searchHere:'Cerca un prodotto qui…',
  noRes:q=>`Nessun prodotto trovato per “${q}”.`,reqHint:'Dicci cosa cerchi: ci aiuta a sapere cosa chiedere ai negozi.',request:'Richiedi questo prodotto',requested:'Richiesta salvata. Grazie!',
  foundIn:n=>n===1?'In 1 negozio':`In ${n} negozi`,notHere:'Questo prodotto non risulta qui.',
  av:{u:'Di solito disponibile',s:'A volte',z:'Stagionale'},locating:'Cerco la tua posizione…',locFail:'Posizione non disponibile: controlla i permessi del browser.',
  outside:'Sei fuori Torino: ti mostro la città.',sample:'Prototipo: i negozi sono esempi inventati, non reali.',close:'Chiudi',
  noFilter:'Nessun negozio per questi filtri.',results:'Prodotti trovati',showAll:'Mostra tutti',filters:'Filtra per regione',
  inStore:n=>`Cerca un prodotto da ${n}`,zin:'Ingrandisci',zout:'Riduci',map:'Mappa di Torino',dec:',',reset:'Torna a tutta Torino',noMapT:'La mappa non si è caricata',noMap:'Questo browser o anteprima blocca le immagini della mappa. Apri il file direttamente nel browser oppure pubblicalo su Netlify: le strade appariranno.'},
 en:{tag:'Your world, around the corner',ph:'Search a product: kimchi, masa harina, ghee…',all:'All',stores:n=>n===1?'1 store':`${n} stores`,
  near:'Near me',directions:'Directions',call:'Call',wa:'WhatsApp',share:'Copy link',copied:'Link copied',
  checked:'Checked',ago:d=>d<=0?'today':d===1?'yesterday':`${d} days ago`,stale:'Last checked over 60 days ago: call before you go.',
  products:'Key products',searchHere:'Search a product here…',
  noRes:q=>`No products found for “${q}”.`,reqHint:'Tell us what you’re looking for: it helps us know what to ask stores.',request:'Request this product',requested:'Request saved. Thank you!',
  foundIn:n=>n===1?'In 1 store':`In ${n} stores`,notHere:'This product isn’t listed here.',
  av:{u:'Usually in stock',s:'Sometimes',z:'Seasonal'},locating:'Finding your location…',locFail:'Location unavailable: check your browser permissions.',
  outside:'You’re outside Turin, so here’s the city.',sample:'Prototype: stores are invented examples, not real.',close:'Close',
  noFilter:'No stores match these filters.',results:'Products found',showAll:'Show all',filters:'Filter by region',
  inStore:n=>`Search a product at ${n}`,zin:'Zoom in',zout:'Zoom out',map:'Map of Turin',dec:'.',reset:'Back to all of Turin',noMapT:'The map didn’t load',noMap:'This browser or preview blocks the map images. Open the file directly in your browser or put it on Netlify, and the streets will appear.'}
};
let lang='it';
try{const s=localStorage.getItem('globba-lang');if(s==='en'||s==='it')lang=s;}catch(e){}
{const u=new URLSearchParams(location.search).get('lang');if(u==='en'||u==='it'){lang=u;try{localStorage.setItem('globba-lang',lang);}catch(e){}}}
const t=()=>T[lang];

// ---------- Helpers ----------
const $=s=>document.querySelector(s);
const esc=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const norm=s=>s.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/[^\p{L}\p{N} ]/gu,' ').replace(/\s+/g,' ').trim();
function lev(a,b){const m=a.length,n=b.length;if(!m)return n;if(!n)return m;let p=Array.from({length:n+1},(_,i)=>i);
  for(let i=1;i<=m;i++){const c=[i];for(let j=1;j<=n;j++)c[j]=Math.min(p[j]+1,c[j-1]+1,p[j-1]+(a[i-1]===b[j-1]?0:1));p=c;}return p[n];}
const pname=id=>P[id][lang];
const pterms=id=>[P[id].it,P[id].en,...P[id].s].map(norm);
function matchProducts(q){
  q=norm(q);if(q.length<2)return[];
  const tol=q.length>=7?2:q.length>=4?1:0,out=[];
  for(const id in P){let best=99;
    for(const term of pterms(id)){
      if(term.startsWith(q)){best=Math.min(best,0);continue;}
      if(term.includes(q)){best=Math.min(best,1);continue;}
      if(!tol)continue;
      for(const w of term.split(' ').concat(term)){
        const d=Math.min(lev(q,w),w.length>q.length?lev(q,w.slice(0,q.length)):99);
        if(d<=tol)best=Math.min(best,2+d);
      }}
    if(best<99)out.push({id,score:best});}
  return out.sort((a,b)=>a.score-b.score||pname(a.id).localeCompare(pname(b.id))).map(o=>o.id);
}
const daysAgo=d=>Math.round((TODAY-new Date(d+'T12:00:00'))/864e5);
function km(a,b){const r=Math.PI/180,dl=(b.lat-a.lat)*r,dn=(b.lng-a.lng)*r;const x=Math.sin(dl/2)**2+Math.cos(a.lat*r)*Math.cos(b.lat*r)*Math.sin(dn/2)**2;return 12742*Math.asin(Math.sqrt(x));}
function fmtDist(s){if(!me)return'';const d=km(me,s);return d<1?`${Math.round(d*100)*10} m`:`${d.toFixed(1).replace('.',t().dec)} km`;}
const fill=r=>r.length===1?R[r[0]].c:`conic-gradient(${R[r[0]].c} 0 50%, ${R[r[1]].c} 0)`;
const swatch=r=>`<span class="swatch" style="background:${fill(r)}" aria-hidden="true"></span>`;
const regionNames=r=>r.map(k=>R[k][lang]).join(', ');

// ---------- State ----------
let active=new Set(), query='', selected=null, me=null;
const storeOk=s=>!active.size||s.r.some(k=>active.has(k));

// ---------- Map (Leaflet + OpenStreetMap) ----------
const mapEl=$('#map');
const TURIN=[45.0694,7.6861];
const START_Z=()=>innerWidth<600?13:14;
const map=L.map('lmap',{zoomControl:false,zoomSnap:0.5,zoomDelta:1,wheelPxPerZoomLevel:90,minZoom:11,maxZoom:19,
  maxBounds:[[44.93,7.45],[45.20,7.90]],maxBoundsViscosity:0.8}).setView(TURIN,START_Z());
L.control.zoom({position:'topleft'}).addTo(map);
const ATTR='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>';
const ESRI={name:'esri',url:'https://server.arcgisonline.com/ArcGIS/rest/services/World_Street_Map/MapServer/tile/{z}/{y}/{x}',o:{maxZoom:19,attribution:'Tiles &copy; Esri, HERE, Garmin, '+ATTR}};
const OSMFR={name:'osmfr',url:'https://{s}.tile.openstreetmap.fr/osmfr/{z}/{x}/{y}.png',o:{subdomains:'abc',maxZoom:19,attribution:ATTR+' &copy; OSM France'}};
const OSM={name:'osm',url:'https://tile.openstreetmap.org/{z}/{x}/{y}.png',o:{maxZoom:19,attribution:ATTR}};
// CARTO was removed: it now shows "API key required" images instead of the map.
// Opened as a local file, OpenStreetMap refuses to answer, so it goes last there.
const SOURCES=location.protocol==='file:'?[ESRI,OSMFR,OSM]:[ESRI,OSM,OSMFR];
let srcIdx=0,tiles=null,loaded=0,failed=0,waitT=null;
function nextSource(){ if(srcIdx<SOURCES.length-1)useSource(srcIdx+1); else $('#mapmsg').hidden=false; }
function useSource(i){
  if(tiles)map.removeLayer(tiles);
  clearTimeout(waitT);loaded=0;failed=0;srcIdx=i;
  const src=SOURCES[i];
  tiles=L.tileLayer(src.url,src.o).addTo(map);
  tiles.on('tileload',()=>{loaded++;clearTimeout(waitT);$('#mapmsg').hidden=true;});
  tiles.on('tileerror',()=>{failed++;if(!loaded&&failed>=3)nextSource();});
  waitT=setTimeout(()=>{if(!loaded)nextSource();},6000);
  console.info('Globba map source:',src.name);
}
useSource(0);
const cluster=L.markerClusterGroup({showCoverageOnHover:false,maxClusterRadius:42,
  iconCreateFunction:c=>L.divIcon({html:String(c.getChildCount()),className:'cluster'+(query?' dim':''),iconSize:[40,40]})});
const loose=L.layerGroup();
map.addLayer(cluster);map.addLayer(loose);
let meMarker=null;
function render(){
  cluster.clearLayers();loose.clearLayers();
  const hits=query?new Set(storesFor(matchProducts(query)).map(s=>s.id)):null;
  for(const s of S.filter(storeOk)){
    const dim=!!(hits&&!hits.has(s.id)),sel=selected===s.id;
    const m=L.marker([s.lat,s.lng],{title:s.n,alt:s.n,zIndexOffset:sel?1000:dim?0:500,
      icon:L.divIcon({className:'',html:`<span class="pin${sel?' sel':''}${dim?' dim':''}" style="background:${fill(s.r)}"></span>`,iconSize:[30,30],iconAnchor:[15,15]})});
    m.on('click',()=>openStore(s.id));
    (sel||(hits&&!dim)?loose:cluster).addLayer(m);
  }
}
function focusStore(s){
  const desk=matchMedia('(min-width:900px)').matches,z=Math.max(map.getZoom(),15);
  const pt=map.project([s.lat,s.lng],z).add([desk?220:0,0]);
  map.setView(map.unproject(pt,z),z);
}
let toastT;function toast(m){const el=$('#toast');el.textContent=m;el.classList.add('on');clearTimeout(toastT);toastT=setTimeout(()=>el.classList.remove('on'),2800);}
$('#reset').onclick=()=>map.setView(TURIN,START_Z());
$('#near').onclick=()=>{
  if(!navigator.geolocation){toast(t().locFail);return;}
  toast(t().locating);
  navigator.geolocation.getCurrentPosition(p=>{
    const {latitude:lat,longitude:lng}=p.coords;
    if(lat>44.98&&lat<45.14&&lng>7.56&&lng<7.80){
      me={lat,lng};if(meMarker)meMarker.remove();
      meMarker=L.marker([lat,lng],{interactive:false,icon:L.divIcon({className:'',html:'<span class="me"></span>',iconSize:[18,18],iconAnchor:[9,9]})}).addTo(map);
      map.setView([lat,lng],15);toast(t().near);
    } else {map.setView(TURIN,START_Z());toast(t().outside);}
    renderPanel();
  },()=>toast(t().locFail),{enableHighAccuracy:true,timeout:9000});
};

// ---------- Panel ----------
const footer=()=>{const en=lang==='en',l=(h,x)=>`<a href="${h}" style="color:inherit">${x}</a>`;
  return`<p class="note">${l(en?'/en/stores/':'/negozi/',en?'All stores':'Tutti i negozi')} · ${l(en?'/en/products/':'/prodotti/',en?'All products':'Tutti i prodotti')} · ${l(en?'/en/privacy/':'/privacy/','Privacy')}</p>`;};
function storesFor(ids){const set=new Set();ids.forEach(id=>S.forEach(s=>{if(s.inv[id]&&storeOk(s))set.add(s);}));return[...set];}
const byDist=a=>me?a.slice().sort((x,y)=>km(me,x)-km(me,y)):a;
function storeRow(s,extra){
  return`<div class="store">${swatch(s.r)}
    <button class="main" data-open="${s.id}"><div class="name">${esc(s.n)}</div><div class="meta">${esc(extra||regionNames(s.r)+', '+s.a)}</div></button>
    ${extra?'':`<span class="dist">${fmtDist(s)}</span>`}
    <button class="iconbtn" data-instore="${s.id}" aria-label="${esc(t().inStore(s.n))}" title="${esc(t().inStore(s.n))}">
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round"><circle cx="10.5" cy="10.5" r="6.5"/><path d="m20 20-4.5-4.5"/></svg></button>
  </div>`;
}
function renderPanel(){
  const el=$('#panel');
  if(!query){
    const list=byDist(S.filter(storeOk));
    el.innerHTML=`<div class="panelhead"><h2>${t().stores(list.length)}</h2>${active.size?`<button class="linkbtn" data-clear>${t().showAll}</button>`:''}</div>`+
      (list.length?list.map(s=>storeRow(s)).join(''):`<p class="sub">${t().noFilter}</p>`)+(sample?`<p class="note">${t().sample}</p>`:'')+footer();
    return;
  }
  const ids=matchProducts(query).slice(0,6);
  if(!ids.length){
    logMiss(query);
    el.innerHTML=`<div class="empty"><p><strong>${esc(t().noRes(query))}</strong></p><p class="hint">${t().reqHint}</p><button class="primary" data-request>${t().request}</button></div>`;
    return;
  }
  el.innerHTML=`<div class="panelhead"><h2>${t().results}</h2></div>`+ids.map(id=>{
    const st=byDist(S.filter(s=>s.inv[id]&&storeOk(s)));
    const aka=[P[id][lang==='it'?'en':'it'],...P[id].s].filter((v,i,a)=>norm(v)!==norm(pname(id))&&a.findIndex(x=>norm(x)===norm(v))===i).slice(0,3).join(', ');
    return`<article class="product" id="p-${id}"><h3>${esc(pname(id))}</h3><div class="aka">${esc(aka)}</div>
      <div class="sub" style="font-size:14px;font-weight:700;margin-bottom:2px">${t().foundIn(st.length)}</div>
      ${st.map(s=>`<div class="store">${swatch(s.r)}<button class="main" data-open="${s.id}" data-p="${id}"><div class="name">${esc(s.n)}</div><div class="meta">${esc(s.a)}${me?', '+fmtDist(s):''}</div></button><span class="avail ${s.inv[id]}">${t().av[s.inv[id]]}</span></div>`).join('')}
    </article>`;
  }).join('');
}
$('#panel').addEventListener('click',e=>{
  const b=e.target.closest('button');if(!b)return;
  if(b.dataset.open)openStore(b.dataset.open,b.dataset.p);
  else if(b.dataset.instore)openStore(b.dataset.instore,null,true);
  else if('clear' in b.dataset){active.clear();renderChips();renderPanel();render();}
  else if('request' in b.dataset){
    try{const k='globba-requests';const a=JSON.parse(localStorage.getItem(k)||'[]');a.push({q:query,at:new Date().toISOString()});localStorage.setItem(k,JSON.stringify(a));}catch(err){}
    insertPublic('product_requests',{query:query.slice(0,200),lang}).catch(()=>{});
    track('request');
    b.outerHTML=`<p><strong>${t().requested}</strong></p>`;
  }
});

// ---------- Chips ----------
function renderChips(){
  const c=$('#chips');c.setAttribute('aria-label',t().filters);
  c.innerHTML=`<button class="chip" data-r="" aria-pressed="${!active.size}">${t().all}</button>`+
    Object.keys(R).map(k=>`<button class="chip" data-r="${k}" aria-pressed="${active.has(k)}"><span class="dot" style="background:${R[k].c}"></span>${R[k][lang]}</button>`).join('');
}
$('#chips').addEventListener('click',e=>{
  const b=e.target.closest('.chip');if(!b)return;const k=b.dataset.r;
  if(!k)active.clear();else active.has(k)?active.delete(k):active.add(k);
  renderChips();renderPanel();render();
});

// ---------- Search ----------
const q=$('#q');
q.addEventListener('input',()=>{query=q.value.trim();$('#qclear').hidden=!query;renderPanel();render();});
$('#qclear').onclick=e=>{e.preventDefault();q.value='';query='';$('#qclear').hidden=true;renderPanel();render();q.focus();};

// ---------- Store sheet ----------
const sheet=$('#sheet'),scrim=$('#scrim');
const ic={pin:'<path d="M12 21s-7-6.2-7-11.5A7 7 0 0 1 19 9.5C19 14.8 12 21 12 21z"/><circle cx="12" cy="9.5" r="2.5"/>',
  clock:'<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>',check:'<path d="M5 12.5l4.5 4.5L19 7.5"/>',phone:'<path d="M5 4h4l2 5-2.5 1.5a11 11 0 0 0 5 5L15 13l5 2v4a2 2 0 0 1-2 2A16 16 0 0 1 3 6a2 2 0 0 1 2-2z"/>',
  dir:'<path d="M12 2 21 12 12 22 3 12z"/><path d="M9 13v-2h5V9l2.5 2.5L14 14v-2"/>',wa:'<path d="M4 20l1.3-4A8 8 0 1 1 8 18.7z"/><path d="M9 9.5c0 3 2.5 5.5 5.5 5.5l1-1.5-2-1-1 .8a4 4 0 0 1-1.8-1.8l.8-1-1-2z"/>',
  link:'<path d="M10 14a4.5 4.5 0 0 0 6.4 0l3-3a4.5 4.5 0 0 0-6.4-6.4l-1 1"/><path d="M14 10a4.5 4.5 0 0 0-6.4 0l-3 3a4.5 4.5 0 0 0 6.4 6.4l1-1"/>'};
const svg=(k,s=20)=>`<svg width="${s}" height="${s}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${ic[k]}</svg>`;
let lastFocus=null;
function openStore(id,pid,focusSearch){
  const s=S.find(x=>x.id===id);if(!s)return;
  lastFocus=document.activeElement;selected=id;
  const d=daysAgo(s.chk);
  sheet.innerHTML=`<div class="bar" style="background:${s.r.length>1?`linear-gradient(90deg,${R[s.r[0]].c} 50%,${R[s.r[1]].c} 50%)`:R[s.r[0]].c}"></div><div class="grab"></div>
    <button class="iconbtn close" data-close aria-label="${t().close}"><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round"><path d="M6 6l12 12M18 6 6 18"/></svg></button>
    <h2 id="sheettitle">${esc(s.n)}</h2>
    <div class="tags">${s.r.map(k=>`<span class="tag"><span class="dot" style="background:${R[k].c}"></span>${R[k][lang]}</span>`).join('')}</div>
    <div class="rows">
      <div>${svg('pin',18)}<span>${esc(s.a)}, Torino${me?` <span class="dist">(${fmtDist(s)})</span>`:''}</span></div>
      <div>${svg('clock',18)}<span>${esc(s.h[lang==='it'?0:1])}</span></div>
      <div>${svg('check',18)}<span>${t().checked} ${t().ago(d)}</span></div>
    </div>
    ${d>60?`<div class="stale">${t().stale}</div>`:''}
    <div class="actions">
      <a href="https://www.google.com/maps/dir/?api=1&destination=${s.lat},${s.lng}" target="_blank" rel="noopener">${svg('dir')}${t().directions}</a>
      <a href="https://wa.me/${(s.wa||s.ph).replace(/\D/g,'')}" target="_blank" rel="noopener">${svg('wa')}${t().wa}</a>
      <a href="tel:${s.ph.replace(/\s/g,'')}">${svg('phone')}${t().call}</a>
      <button data-share>${svg('link')}<span>${t().share}</span></button>
    </div>
    <h3>${t().products}</h3>
    <label class="instore"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round"><circle cx="10.5" cy="10.5" r="6.5"/><path d="m20 20-4.5-4.5"/></svg>
      <input id="iq" type="search" placeholder="${esc(t().searchHere)}" aria-label="${esc(t().inStore(s.n))}" value="${esc(pid?'':(query||''))}"></label>
    <div class="plist" id="plist"></div>`;
  const draw=()=>{
    const v=$('#iq').value.trim();
    const all=Object.keys(s.inv);
    const ms=v?matchProducts(v):null;
    let list=ms?all.filter(id=>ms.includes(id)):all;
    if(pid&&!v)list=[pid,...all.filter(x=>x!==pid)];
    $('#plist').innerHTML=list.length?list.map(id=>`<div class="prow${id===pid||(ms&&ms.includes(id))?' hit':''}"><div><div class="pn">${esc(pname(id))}</div><div class="ps">${esc(P[id].s.slice(0,2).join(', '))}</div></div><span class="avail ${s.inv[id]}">${t().av[s.inv[id]]}</span></div>`).join('')
      :`<p class="ps" style="padding:10px 2px">${t().notHere}</p>`;
  };
  $('#iq').addEventListener('input',draw);draw();
  sheet.classList.add('on');scrim.classList.add('on');
  focusStore(s);render();
  if(location.hash!=='#s-'+id)history.replaceState(null,'','#s-'+id);
  setTimeout(()=>(focusSearch?$('#iq'):sheet.querySelector('[data-close]')).focus(),60);
}
function closeStore(){
  sheet.classList.remove('on');scrim.classList.remove('on');selected=null;render();
  if(location.hash)history.replaceState(null,'',location.pathname+location.search);
  if(lastFocus&&lastFocus.focus)lastFocus.focus();
}
sheet.addEventListener('click',async e=>{
  const b=e.target.closest('button');if(!b)return;
  if('close' in b.dataset)closeStore();
  if('share' in b.dataset){const url=location.href.split('#')[0]+'#s-'+selected;
    try{await navigator.clipboard.writeText(url);b.querySelector('span').textContent=t().copied;}catch(err){prompt(t().share,url);}}
});
scrim.onclick=closeStore;
document.addEventListener('keydown',e=>{if(e.key==='Escape'&&sheet.classList.contains('on'))closeStore();});

// ---------- Language ----------
function applyLang(){
  document.documentElement.lang=lang;
  document.querySelectorAll('.lang button').forEach(b=>b.setAttribute('aria-pressed',b.dataset.l===lang));
  $('#tagline').textContent=t().tag;q.placeholder=t().ph;q.setAttribute('aria-label',t().ph);
  $('#nearlbl').textContent=t().near;$('#reset').setAttribute('aria-label',t().reset);$('#reset').title=t().reset;
  $('#mapmsg').innerHTML=`<strong>${t().noMapT}</strong>${t().noMap}`;
  mapEl.setAttribute('aria-label',t().map);
  renderChips();renderPanel();render();
  if(selected){const id=selected;openStore(id);}
}
document.querySelector('.lang').addEventListener('click',e=>{const b=e.target.closest('button');if(!b)return;lang=b.dataset.l;try{localStorage.setItem('globba-lang',lang);}catch(err){}applyLang();});

// ---------- Hash routes ----------
function route(){
  const h=location.hash.slice(1);
  if(h.startsWith('s-')&&S.some(s=>s.id===h.slice(2)))openStore(h.slice(2));
  else if(h.startsWith('p-')&&P[h.slice(2)]){q.value=pname(h.slice(2));query=q.value;$('#qclear').hidden=false;renderPanel();render();}
}
window.addEventListener('hashchange',route);

// ---------- Init ----------
if(matchMedia('(min-width:900px)').matches)$('#app').classList.add('desk');
applyLang();route();
let rt;window.addEventListener('resize',()=>{clearTimeout(rt);rt=setTimeout(()=>map.invalidateSize(),120);});

// ---------- Analytics (privacy-friendly, no cookies) ----------
// Searches with no results are saved (text only) so you know what people look for.
let missT,lastMiss='';
function logMiss(v){
  clearTimeout(missT);
  missT=setTimeout(()=>{const n=norm(v);if(n.length<3||n===lastMiss||norm(query)!==n)return;lastMiss=n;
    insertPublic('search_misses',{query:v.slice(0,200),lang}).catch(()=>{});track('search-no-results');},1500);
}
function track(ev){try{window.goatcounter&&window.goatcounter.count&&window.goatcounter.count({path:'event/'+ev,title:ev,event:true});}catch(e){}}

// ---------- Fresh data ----------
// The page ships with the data from the last build; if Supabase is connected, newer data
// (for example a store you just edited in /admin) is loaded in the background.
if(hasSupabase&&!sample){
  loadFromSupabase().then(d=>{
    if(!d.S.length)return;
    R=d.R;P=d.P;S=d.S;
    for(const k of [...active])if(!R[k])active.delete(k);
    if(selected&&!S.some(s=>s.id===selected))closeStore();
    renderChips();renderPanel();render();
  }).catch(()=>{});
}
})();
