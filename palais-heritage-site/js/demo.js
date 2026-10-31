/* Palais Héritage — showreel mode.
   Open the site with ?demo (e.g. https://your-site.vercel.app/?demo) and it plays the whole journey by itself:
   the preloader, the walk across the square, through the doors, choosing pieces, the Collection grid, the cart,
   and back to the square. A soft gold cursor shows each click. Made for screen recordings. */

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const ease = (t) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);
const easeSine = (t) => -(Math.cos(Math.PI * t) - 1) / 2;
const $ = (s) => document.querySelector(s);

function tween(ms, fn, curve = ease) {
  return new Promise((resolve) => {
    const t0 = performance.now();
    const step = (now) => {
      const k = Math.min(1, (now - t0) / ms);
      fn(curve(k), k);
      if (k < 1) requestAnimationFrame(step); else resolve();
    };
    requestAnimationFrame(step);
  });
}

/* ---------- the on-screen cursor ---------- */
function makeCursor() {
  const st = document.createElement('style');
  st.textContent = `
    html.demo, html.demo * { cursor: none !important; }
    .demo-cursor { position: fixed; left: 0; top: 0; z-index: 1000; pointer-events: none; width: 0; height: 0; opacity: 0; transition: opacity .6s; }
    .demo-cursor.on { opacity: 1; }
    .demo-cursor i { position: absolute; left: -15px; top: -15px; width: 30px; height: 30px; border-radius: 50%;
      border: 1.5px solid #C4A468; background: rgba(196,164,104,.12); box-shadow: 0 0 18px rgba(196,164,104,.45), inset 0 0 6px rgba(196,164,104,.3);
      transition: transform .18s cubic-bezier(.22,.7,.18,1); }
    .demo-cursor b { position: absolute; left: -3px; top: -3px; width: 6px; height: 6px; border-radius: 50%; background: #f3dfae; box-shadow: 0 0 8px #C4A468; }
    .demo-cursor.press i { transform: scale(.72); }
    .demo-ripple { position: fixed; z-index: 999; pointer-events: none; width: 30px; height: 30px; margin: -15px 0 0 -15px; border-radius: 50%;
      border: 1.5px solid #C4A468; animation: demoRipple .7s cubic-bezier(.22,.7,.18,1) forwards; }
    @keyframes demoRipple { from { transform: scale(.6); opacity: .9; } to { transform: scale(2.6); opacity: 0; } }
    .show-tile.demo-hover .show-frame img { transform: scale(1.05); }
    .show-tile.demo-hover .show-frame::after { border-color: rgba(196,164,104,.85); }
    .btn-primary.demo-hover { filter: brightness(1.15); }`;
  document.head.appendChild(st);
  document.documentElement.classList.add('demo');
  const el = document.createElement('div'); el.className = 'demo-cursor'; el.innerHTML = '<i></i><b></b>';
  document.body.appendChild(el);
  const pos = { x: innerWidth * 0.5, y: innerHeight * 0.62 };
  const place = () => { el.style.transform = `translate(${pos.x}px, ${pos.y}px)`; };
  place();
  return {
    show() { el.classList.add('on'); }, hide() { el.classList.remove('on'); },
    get pos() { return pos; },
    async move(x, y, ms = 900) {
      const x0 = pos.x, y0 = pos.y;
      // a slight arc feels like a hand, not a robot
      const bend = Math.min(60, Math.hypot(x - x0, y - y0) * 0.12);
      await tween(ms, (k) => {
        pos.x = x0 + (x - x0) * k + Math.sin(Math.PI * k) * bend * 0.4;
        pos.y = y0 + (y - y0) * k - Math.sin(Math.PI * k) * bend;
        place();
      });
    },
    async click() {
      el.classList.add('press');
      const r = document.createElement('div'); r.className = 'demo-ripple';
      r.style.left = `${pos.x}px`; r.style.top = `${pos.y}px`; document.body.appendChild(r);
      setTimeout(() => r.remove(), 800);
      await sleep(140); el.classList.remove('press');
    },
  };
}

const centerOf = (el) => { const r = el.getBoundingClientRect(); return [r.left + r.width / 2, r.top + r.height / 2]; };

export async function runDemo(P) {
  const cur = makeCursor();
  const go = async (el, ms = 900, after = 350) => {           // move to an element and click it
    if (!el) return;
    const [x, y] = centerOf(el);
    await cur.move(x, y, ms); await sleep(160); await cur.click();
    if (el.dispatchEvent) el.dispatchEvent(new MouseEvent('click', { bubbles: true, cancelable: true, view: window }));
    await sleep(after);
  };
  const waitFor = async (test, max = 15000) => { const t0 = performance.now(); while (!test() && performance.now() - t0 < max) await sleep(100); };
  const cardOpen = () => $('#card').classList.contains('is-open');
  const scrollToY = (y, ms) => { const y0 = scrollY; return tween(ms, (k) => scrollTo({ top: y0 + (y - y0) * k, behavior: 'instant' }), easeSine); };
  const sizeBtn = (label) => [...document.querySelectorAll('#cardSizes .size')].find((b) => b.textContent.trim() === label);
  const addPiece = async (size, id) => {
    await waitFor(cardOpen, 20000);
    if (!cardOpen() && id) P.openCard(id);          // slow machine: open it rather than wait forever
    await sleep(900);
    if (size) await go(sizeBtn(size), 800, 450);
    const add = $('#addBtn'); add.classList.add('demo-hover');
    await go(add, 800, 1300); add.classList.remove('demo-hover');
  };
  const viaWheel = async (id) => {
    const seg = document.querySelector(`.wheel-seg[data-id="${id}"]`);
    if (!seg) return P.goToProduct(id);
    const [x, y] = centerOf(seg);
    await cur.move(x, y, 1000);
    seg.dispatchEvent(new PointerEvent('pointerenter')); await sleep(650);
    await cur.click(); seg.dispatchEvent(new MouseEvent('click', { bubbles: true }));
    seg.dispatchEvent(new PointerEvent('pointerleave'));
    await cur.move(innerWidth * 0.5, innerHeight * 0.55, 1400);
  };

  // 1 · preloader, then a moment on the square
  await waitFor(() => P.ready && !document.body.classList.contains('is-loading'), 120000);
  await sleep(2400);
  cur.show(); await cur.move(innerWidth * 0.5, innerHeight * 0.78, 1200); await sleep(600);

  // 2 · walk across the square, through the doors, into the hall
  const H = P.HALL0;
  await scrollToY(P.stationScrollY(1), 3400); await sleep(700);
  await scrollToY(P.stationScrollY(2), 3000); await sleep(600);
  await scrollToY(P.stationScrollY(H - 1), 3200); await sleep(500);
  await scrollToY(P.stationScrollY(H), 3800); await sleep(1200);
  await scrollToY(P.stationScrollY(H + 1), 3400); await sleep(1600);
  await scrollToY(P.stationScrollY(H + 2), 3400); await sleep(900);

  // 3 · the gown: select it, choose a size, add to cart
  const gown = P.products.get('product_01');
  if (gown) {
    const v = gown.center.clone().project(P.camera);
    await cur.move((v.x + 1) / 2 * innerWidth, (1 - v.y) / 2 * innerHeight, 1100); await sleep(250); await cur.click();
    P.openCard('product_01');
  }
  await addPiece('M', 'product_01');

  // 4 · drag to look around the hall
  await cur.move(innerWidth * 0.55, innerHeight * 0.5, 800);
  let last = 0;
  await tween(2600, (k) => { const yaw = Math.sin(k * Math.PI) * 0.75; P.addLook(yaw - last, 0); last = yaw; cur.pos.x = innerWidth * 0.55 - Math.sin(k * Math.PI) * innerWidth * 0.16; document.querySelector('.demo-cursor').style.transform = `translate(${cur.pos.x}px, ${cur.pos.y}px)`; }, easeSine);
  await sleep(900);

  // 5 · fly to the necklace from the collection wheel
  await viaWheel('product_03');
  await addPiece(null, 'product_03');

  // 6 · the Collection grid over the hall, then the pumps
  await go($('#menuBtn'), 1000, 900);
  await go($('#openShowcase'), 800, 1400);
  const tiles = [...document.querySelectorAll('.show-tile')];
  for (const i of [0, 2, 5, 8]) {
    const t = tiles[i]; if (!t) continue;
    const [x, y] = centerOf(t.querySelector('.show-frame'));
    tiles.forEach((o) => o.classList.remove('demo-hover'));
    await cur.move(x, y, 750); t.classList.add('demo-hover'); await sleep(450);
  }
  tiles.forEach((o) => o.classList.remove('demo-hover'));
  const pumps = document.querySelector('.show-tile[data-id="product_04"]');
  if (pumps) { pumps.classList.add('demo-hover'); await go(pumps.querySelector('.show-frame'), 800, 200); }
  await cur.move(innerWidth * 0.5, innerHeight * 0.55, 1400);
  await addPiece('EU 38', 'product_04');

  // 7 · the perfume, 50 ml
  await viaWheel('product_09');
  await addPiece('50 ml', 'product_09');

  // 8 · the cart
  await go($('#cartBtn'), 1000, 3600);
  await go(document.querySelector('#cartDrawer [data-close].btn'), 900, 1000);

  // 9 · back to the square
  await go($('.brand'), 1200, 5200);
  cur.hide(); await sleep(1500);
  window.__demoDone = true; document.title = 'Showreel finished · Palais Héritage';
}
