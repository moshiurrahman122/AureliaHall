/* Palais Héritage — cart and checkout, shared by every page.
   The cart lives in the browser (localStorage). At checkout, if Shopify is configured in shop-config.js,
   each line is matched to its Shopify variant (product handle + Size option) and the visitor is sent
   to Shopify's secure checkout. */
import { PRODUCTS, priceNum, money } from './catalog.js';
import { SHOPIFY } from './shop-config.js';

const KEY = 'palais-heritage-cart';
let lines = [];
try { lines = JSON.parse(localStorage.getItem(KEY) || '[]') || []; } catch (e) { lines = []; }
lines = lines.filter((l) => PRODUCTS[l.id] && l.qty > 0);
const subs = new Set();
const save = () => {
  try { localStorage.setItem(KEY, JSON.stringify(lines)); } catch (e) { /* storage unavailable */ }
  subs.forEach((f) => f(lines));
};
// Keep several open tabs in step.
addEventListener('storage', (e) => {
  if (e.key !== KEY) return;
  try { lines = JSON.parse(e.newValue || '[]') || []; } catch (err) { lines = []; }
  subs.forEach((f) => f(lines));
});

export const cart = {
  get lines() { return lines; },
  get count() { return lines.reduce((n, l) => n + l.qty, 0); },
  get total() { return lines.reduce((n, l) => n + priceNum(PRODUCTS[l.id].price) * l.qty, 0); },
  add(id, size, qty = 1) {
    const l = lines.find((x) => x.id === id && x.size === size);
    if (l) l.qty += qty; else lines.push({ id, size, qty });
    save();
  },
  setQty(i, q) { if (!lines[i]) return; if (q <= 0) lines.splice(i, 1); else lines[i].qty = q; save(); },
  remove(i) { lines.splice(i, 1); save(); },
  clear() { lines = []; save(); },
  subscribe(f) { subs.add(f); f(lines); return () => subs.delete(f); },
};

export const shopifyReady = () => Boolean(SHOPIFY.domain && SHOPIFY.storefrontToken);

async function storefront(query, variables) {
  const res = await fetch(`https://${SHOPIFY.domain}/api/${SHOPIFY.apiVersion}/graphql.json`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'X-Shopify-Storefront-Access-Token': SHOPIFY.storefrontToken },
    body: JSON.stringify({ query, variables }),
  });
  if (!res.ok) throw new Error(`Shopify answered ${res.status}`);
  const json = await res.json();
  if (json.errors && json.errors.length) throw new Error(json.errors[0].message);
  return json.data;
}

const VARIANTS = `query($handle: String!) { product(handle: $handle) { title variants(first: 100) { nodes {
  id availableForSale selectedOptions { name value } } } } }`;
const CREATE = `mutation($lines: [CartLineInput!]!) { cartCreate(input: { lines: $lines }) {
  cart { checkoutUrl } userErrors { message } } }`;

const norm = (s) => String(s).toLowerCase().replace(/\s+/g, ' ').replace(/[×x]/g, 'x').trim();
async function variantFor(line) {
  const p = PRODUCTS[line.id];
  const data = await storefront(VARIANTS, { handle: p.handle });
  if (!data.product) throw new Error(`“${p.name}” isn't in the Shopify store yet (handle: ${p.handle}).`);
  const all = data.product.variants.nodes;
  const want = norm(line.size);
  const v = all.find((x) => x.selectedOptions.some((o) => norm(o.value) === want))
    || (all.length === 1 ? all[0] : null);
  if (!v) throw new Error(`No “${line.size}” option for ${p.name} in Shopify.`);
  if (!v.availableForSale) throw new Error(`${p.name} (${line.size}) is sold out.`);
  return v.id;
}

/* Returns a message to show the visitor, or navigates away to Shopify checkout. */
export async function checkout() {
  if (!lines.length) return 'Add a piece first.';
  if (!shopifyReady()) return 'Checkout opens once the Shopify store is connected. Your selection is saved.';
  try {
    const cartLines = [];
    for (const l of lines) cartLines.push({ merchandiseId: await variantFor(l), quantity: l.qty });
    const data = await storefront(CREATE, { lines: cartLines });
    const err = data.cartCreate.userErrors[0];
    if (err) return err.message;
    location.href = data.cartCreate.cart.checkoutUrl;
    return 'Opening secure checkout…';
  } catch (e) {
    return e.message || 'Checkout is unavailable right now. Please try again.';
  }
}

/* Draws the cart into the drawer markup every page shares. */
export function mountCart({ linesEl, countEl, subtotalEl, noteEl, checkoutBtn, emptyText }) {
  const draw = () => {
    linesEl.innerHTML = '';
    if (!lines.length) {
      const p = document.createElement('p'); p.className = 'cart-empty';
      p.textContent = emptyText || 'Nothing selected yet.';
      linesEl.appendChild(p);
    }
    lines.forEach((l, i) => {
      const d = PRODUCTS[l.id];
      const row = document.createElement('div'); row.className = 'cart-line';
      row.innerHTML = `
        <div class="cart-line-name"></div>
        <div class="cart-line-price"></div>
        <div class="cart-line-meta"><span class="sz"></span>
          <span class="qty"><button type="button" aria-label="Decrease quantity">−</button><span></span><button type="button" aria-label="Increase quantity">+</button></span>
        </div>
        <button class="cart-remove" type="button">Remove</button>`;
      row.querySelector('.cart-line-name').textContent = d.name;
      row.querySelector('.cart-line-price').textContent = money(priceNum(d.price) * l.qty);
      row.querySelector('.sz').textContent = /size/i.test(l.size) ? l.size : `Size ${l.size}`;
      row.querySelector('.qty span').textContent = l.qty;
      const [minus, plus] = row.querySelectorAll('.qty button');
      minus.addEventListener('click', () => cart.setQty(i, l.qty - 1));
      plus.addEventListener('click', () => cart.setQty(i, l.qty + 1));
      row.querySelector('.cart-remove').addEventListener('click', () => cart.remove(i));
      linesEl.appendChild(row);
    });
    const n = cart.count;
    if (countEl) { countEl.textContent = n; countEl.dataset.empty = String(n === 0); }
    if (subtotalEl) subtotalEl.textContent = money(cart.total);
  };
  cart.subscribe(draw);
  if (checkoutBtn) checkoutBtn.addEventListener('click', async () => {
    checkoutBtn.disabled = true;
    if (noteEl) noteEl.textContent = shopifyReady() && lines.length ? 'Preparing your checkout…' : '';
    const msg = await checkout();
    if (noteEl) noteEl.textContent = msg;
    checkoutBtn.disabled = false;
  });
}
