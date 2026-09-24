// Conexión directa. La API debe permitir por CORS el origen de esta página.
// No coloques claves privadas en este archivo.
const API_URL = 'https://quality.somee.com/productos';
const grid = document.getElementById('product-grid');
const status = document.getElementById('catalog-status');
const count = document.getElementById('catalog-count');
const retry = document.getElementById('retry');
let products = [];
let loaded = false;
const categories = {'dragon-ball':'Dragon Ball','one-piece':'One Piece','naruto':'Naruto'};
document.getElementById('year').textContent = new Date().getFullYear();
function categoryOf(p) {
  const explicit=String(p.categoria || p.serie || '').toLowerCase().replaceAll(' ','-');
  if (categories[explicit]) return explicit;
  // Si se añade categoria o serie en la API, ese dato tiene prioridad.
  const name=String(p.nombre || '').toUpperCase();
  if (/GOKU|VEGETA|GOGETA|GOHAN|PICCOLO|ROSHI|FREEZER|FRIEZA|BILLS|COOLER|DENDE|TRUNKS|VEGITO|KRILIN|BROLY|BULMA|MAJIN/.test(name)) return 'dragon-ball';
  if (/LUFFY|KATAKURI|ZORO|SANJI|NAMI|CHOPPER|SHANKS|ROBIN|USOPP|FRANKY|BROOK|JINBE|KAIDO|PORTGAS/.test(name)) return 'one-piece';
  if (/NARUTO|SASUKE|SAKURA|KAKASHI|ITACHI|GAARA|HINATA|MADARA|MINATO|JIRAIYA|OBITO/.test(name)) return 'naruto';
  return '';
}
function el(tag, className, text) {
  const node = document.createElement(tag);
  if (className) node.className = className;
  if (text !== undefined) node.textContent = String(text);
  return node;
}
function safeImage(value) {
  try { const u=new URL(value); return u.protocol === 'https:' ? u.href : ''; } catch { return ''; }
}
function card(p) {
  const article=el('article','product');
  const visual=el('div','product-image');
  const fallback=()=>{const old=visual.querySelector('img');if(old)old.remove();visual.append(el('span','image-fallback','Imagen no disponible'));};
  const url=safeImage(p.imagen);
  if(url) {const img=el('img');img.src=url;img.alt=String(p.nombre||'Figura de colección');img.loading='lazy';img.decoding='async';img.referrerPolicy='no-referrer';img.addEventListener('error',fallback,{once:true});visual.append(img);} else fallback();
  const category=categoryOf(p);
  if(category)visual.append(el('span','tag',categories[category].toUpperCase()));
  const details=el('div','product-description');
  details.append(el('h3','',p.nombre||'Figura de colección'));
  if(typeof p.descripcion==='string' && p.descripcion.trim()) details.append(el('span','',p.descripcion.trim()));
  const priceLine=el('div','product-line');
  const price=p.precio===null || p.precio==='' ? NaN : Number(p.precio);
  priceLine.append(el('span','product-price',Number.isFinite(price)&&price>=0?new Intl.NumberFormat('es-PE',{style:'currency',currency:'PEN'}).format(price):'Precio por confirmar'));
  priceLine.append(el('span','tiny-symbol','✦'));
  details.append(priceLine);article.append(visual,details);return article;
}
function currentCategory(){return categories[location.hash.slice(1)] ? location.hash.slice(1) : '';}
function render() {
  if(!loaded)return;
  const category=currentCategory();
  const visible=category?products.filter(p=>categoryOf(p)===category):products;
  grid.replaceChildren(...visible.map(card));
  count.textContent=(category?categories[category]+' · ':'')+visible.length+' '+(visible.length===1?'figura':'figuras');
  status.textContent=visible.length?'':category?'Todavía no hay figuras de '+categories[category]+' en el catálogo. Explora las demás colecciones desde el menú.':'Pronto encontrarás nuevas figuras aquí.';
}
function navigate() {
  const hash=location.hash||'#inicio';
  document.querySelectorAll('nav a').forEach(a=>{const selected=a.getAttribute('href')===hash;a.classList.toggle('active',selected);if(selected)a.setAttribute('aria-current','location');else a.removeAttribute('aria-current');});
  render();
  if(currentCategory())document.getElementById('colecciones').scrollIntoView({behavior:matchMedia('(prefers-reduced-motion: reduce)').matches?'instant':'smooth'});
}
async function loadProducts() {
  retry.hidden=true;loaded=false;grid.replaceChildren();grid.setAttribute('aria-busy','true');count.textContent='';status.textContent='Cargando figuras…';
  try {
    const response=await fetch(API_URL,{headers:{Accept:'application/json'},signal:AbortSignal.timeout(25000),cache:'no-store'});
    if(!response.ok)throw new Error('Catalog unavailable');
    const data=await response.json();
    if(!Array.isArray(data))throw new Error('Invalid catalog');
    products=data.filter(p=>p && typeof p==='object');loaded=true;render();
  } catch {status.textContent='No pudimos cargar las figuras en este momento. Inténtalo nuevamente en unos segundos.';retry.hidden=false;}
  finally {grid.setAttribute('aria-busy','false');}
}
retry.addEventListener('click',loadProducts);
window.addEventListener('hashchange',navigate);
document.querySelectorAll('a[href^="#"]').forEach(a=>a.addEventListener('click',()=>{if(a.hash===location.hash)navigate();}));
navigate();loadProducts();
