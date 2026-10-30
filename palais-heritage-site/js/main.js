// Palais Héritage — scroll journey from the blue-hour facade into the Great Hall.
import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';

/* ------------------------------------------------------------------ *
 * Catalogue. Names, prices and sizes are also stored on each product
 * inside hall.glb (Blender custom properties); the model's values win.
 * ------------------------------------------------------------------ */
const PRODUCTS = {
  product_01: { name: 'Velvet Embroidered Gown', price: '$2,850', sizes: 'XS, S, M, L, XL' },
  product_02: { name: 'Burgundy Leather Top-Handle Bag', price: '$2,450', sizes: 'One size' },
  product_03: { name: 'Diamond Cascade Necklace', price: '$12,800', sizes: 'One size' },
  product_04: { name: 'Gold Satin Crystal Pumps', price: '$1,250', sizes: 'EU 36, 37, 38, 39, 40, 41' },
  product_05: { name: 'Gold Skeleton Watch', price: '$9,400', sizes: 'One size' },
  product_06: { name: 'Navy Velvet Embroidered Blazer', price: '$1,980', sizes: 'S, M, L, XL' },
  product_07: { name: 'Navy Velvet Crest Loafers', price: '$890', sizes: 'EU 40, 41, 42, 43, 44, 45' },
  product_08: { name: 'Emerald Chandelier Earrings', price: '$6,200', sizes: 'One size' },
  product_09: { name: 'Crystal Atomiser Parfum', price: '$380', sizes: '50 ml, 100 ml' },
  product_10: { name: 'Baroque Silk Twill Scarf', price: '$420', sizes: '90 × 90 cm' },
};

/* Camera stations through the hall (three.js coordinates, metres). */
const STATIONS = [
  { title: 'The Entrance',          pos: [0, 4.0, 3.4],      look: [0, 4.6, -20] },
  { title: 'The Great Hall',        pos: [0, 5.2, -3.5],     look: [0, 9.0, -34] },
  { title: 'Velvet Embroidered Gown', id: 'product_01', pos: [1.8, 3.9, -10.0], look: [0, 3.4, -15] },
  { title: 'Navy Velvet Embroidered Blazer', id: 'product_06', pos: [3.0, 3.7, -4.4], look: [6.5, 3.4, -8] },
  { title: 'Baroque Silk Twill Scarf', id: 'product_10', pos: [3.3, 3.7, -13.5], look: [6.5, 3.3, -17] },
  { title: 'Burgundy Leather Top-Handle Bag', id: 'product_02', pos: [-3.3, 3.4, -14.1], look: [-6.5, 2.6, -17] },
  { title: 'Diamond Cascade Necklace', id: 'product_03', pos: [-14.2, 4.0, -12], look: [-16.45, 3.85, -12] },
  { title: 'Gold Skeleton Watch', id: 'product_05', pos: [-14.2, 3.9, -24], look: [-16.45, 3.75, -24] },
  { title: 'Emerald Chandelier Earrings', id: 'product_08', pos: [-14.2, 3.9, -36], look: [-16.45, 3.8, -36] },
  { title: 'The Grand Staircase',   pos: [0, 5.0, -26.5],    look: [0, 8.5, -46] },
  { title: 'Navy Velvet Crest Loafers', id: 'product_07', pos: [14.2, 3.8, -36], look: [16.45, 3.6, -36] },
  { title: 'Crystal Atomiser Parfum', id: 'product_09', pos: [14.2, 3.9, -24], look: [16.45, 3.75, -24] },
  { title: 'Gold Satin Crystal Pumps', id: 'product_04', pos: [14.2, 3.9, -12], look: [16.45, 3.7, -12] },
];
const N = STATIONS.length;
const ROMAN = ['I','II','III','IV','V','VI','VII','VIII','IX','X','XI','XII','XIII'];

const $ = (id) => document.getElementById(id);
const clamp = (v, a, b) => Math.min(b, Math.max(a, v));
const smooth = (a, b, v) => { const t = clamp((v - a) / (b - a), 0, 1); return t * t * (3 - 2 * t); };
const reduceMotion = matchMedia('(prefers-reduced-motion: reduce)').matches;

/* ------------------------------ Scroll track ------------------------------ */
const track = $('track');
let VH = innerHeight;
const HERO_LEN = 1.5;            // viewport heights spent on the facade + doors
function layoutTrack() {
  VH = innerHeight;
  track.style.height = `${(HERO_LEN + (N - 1) + 1) * VH}px`;
}
layoutTrack();
function stationScrollY(i) { return Math.round((HERO_LEN + i) * VH); }

/* ------------------------------ Renderer ------------------------------ */
const canvas = $('hall');
let renderer;
try {
  renderer = new THREE.WebGLRenderer({ canvas, antialias: true, powerPreference: 'high-performance' });
} catch (e) {
  const fb = $('fallback');
  fb.hidden = false;
  fb.textContent = 'Your browser could not open the 3D hall. Use the menu to browse the collection.';
}
const scene = new THREE.Scene();
scene.background = new THREE.Color(0x0f1116);
const camera = new THREE.PerspectiveCamera(52, innerWidth / innerHeight, 0.05, 400);

if (renderer) {
  renderer.setPixelRatio(Math.min(devicePixelRatio || 1, 1.75));
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 0.82;
  const pm = new THREE.PMREMGenerator(renderer);
  scene.environment = pm.fromScene(new RoomEnvironment(renderer), 0.04).texture;
}

/* Warm lighting for the hall */
scene.add(new THREE.HemisphereLight(0xfff0dc, 0x40201a, 0.3));
const chandelier = new THREE.PointLight(0xffd7a0, 340, 0, 2);
chandelier.position.set(0, 15.2, -25);
scene.add(chandelier);
[[0, 18, -8, 150], [0, 18, -42, 130]].forEach(([x, y, z, i]) => {
  const l = new THREE.PointLight(0xffe2bd, i, 0, 2); l.position.set(x, y, z); scene.add(l);
});
[[-15.2, 6.2, -24], [15.2, 6.2, -24]].forEach(([x, y, z]) => {
  const l = new THREE.PointLight(0xffd6a4, 60, 26, 1.6); l.position.set(x, y, z); scene.add(l);
});
function spotOn(target, from, intensity = 110) {
  const s = new THREE.SpotLight(0xfff1dc, intensity, 18, Math.PI / 7, 0.6, 1.6);
  s.position.set(...from); s.target.position.set(...target);
  scene.add(s, s.target);
}
spotOn([0, 3, -15], [0, 10, -11], 180);
spotOn([6.5, 3, -8], [4, 9, -6]);
spotOn([6.5, 3, -17], [4, 9, -15]);
spotOn([-6.5, 2.6, -17], [-4, 9, -15]);

/* ------------------------------ Model ------------------------------ */
const products = new Map();      // id -> { root, meshes, halo, center, data }
const pickables = [];
let hallReady = false;
let floorMesh = null;

const haloTexture = (() => {
  const c = document.createElement('canvas'); c.width = c.height = 256;
  const g = c.getContext('2d');
  const grd = g.createRadialGradient(128, 128, 30, 128, 128, 128);
  grd.addColorStop(0.0, 'rgba(196,164,104,0)');
  grd.addColorStop(0.55, 'rgba(196,164,104,0.10)');
  grd.addColorStop(0.78, 'rgba(226,196,130,0.55)');
  grd.addColorStop(0.86, 'rgba(196,164,104,0.22)');
  grd.addColorStop(1.0, 'rgba(196,164,104,0)');
  g.fillStyle = grd; g.fillRect(0, 0, 256, 256);
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; return t;
})();

const loadNote = $('loadNote');
if (renderer) {
  new GLTFLoader().load('assets/hall.glb', (gltf) => {
    const root = gltf.scene;
    root.traverse((o) => {
      if (o.isMesh) {
        const mats = Array.isArray(o.material) ? o.material : [o.material];
        mats.forEach((m) => {
          if ('envMapIntensity' in m) m.envMapIntensity = m.metalness > 0.5 ? 0.8 : 0.18;
          if (m.transparent) m.depthWrite = false;
        });
      }
    });
    scene.add(root);
    root.updateMatrixWorld(true);
    floorMesh = root.getObjectByName('Floor_Checker') || null;

    root.traverse((o) => {
      const id = o.userData && o.userData.product_id;
      if (!id) return;
      const data = { ...PRODUCTS[id], ...pick(o.userData, ['name', 'price', 'sizes']) };
      const meshes = [];
      o.traverse((m) => { if (m.isMesh) { m.userData.pid = id; meshes.push(m); pickables.push(m); } });
      const box = new THREE.Box3().setFromObject(o);
      const center = box.getCenter(new THREE.Vector3());
      const size = box.getSize(new THREE.Vector3());
      const halo = new THREE.Sprite(new THREE.SpriteMaterial({
        map: haloTexture, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, opacity: 0.5,
      }));
      const s = Math.max(size.x, size.y, size.z) * 1.55;
      halo.scale.set(s, s, 1);
      halo.position.copy(center);
      halo.renderOrder = 10;
      halo.userData.base = s;
      scene.add(halo);
      products.set(id, { root: o, meshes, halo, center, data, hover: 0 });
    });
    buildCollection(); buildDock();
    hallReady = true;
    loadNote.textContent = 'The Great Hall is ready';
    setTimeout(() => { loadNote.textContent = ''; }, 2400);
  }, (ev) => {
    if (ev.total) loadNote.textContent = `Preparing the Great Hall · ${Math.round(ev.loaded / ev.total * 100)}%`;
  }, () => {
    loadNote.textContent = 'The hall could not be loaded. Check that hall.glb sits in the assets folder.';
  });
} else {
  loadNote.textContent = '';
}
function pick(src, keys) { const o = {}; keys.forEach((k) => { if (src[k]) o[k] = src[k]; }); return o; }

/* Camera paths through the stations */
const posCurve = new THREE.CatmullRomCurve3(STATIONS.map((s) => new THREE.Vector3(...s.pos)), false, 'catmullrom', 0.35);
const lookCurve = new THREE.CatmullRomCurve3(STATIONS.map((s) => new THREE.Vector3(...s.look)), false, 'catmullrom', 0.35);

/* ------------------------------ Scroll state ------------------------------ */
const heroZoom = $('heroZoom'), doorL = $('doorL'), doorR = $('doorR'), doorGlow = $('doorGlow');
const heroCopy = $('heroCopy'), scrollCue = $('scrollCue'), flash = $('flash'), header = $('header');
const chapter = $('chapter'), chapterStep = $('chapterStep'), chapterTitle = $('chapterTitle'), chapterHint = $('chapterHint');
const progressNav = $('progress');

STATIONS.forEach((s, i) => {
  const b = document.createElement('button');
  b.type = 'button'; b.setAttribute('aria-label', s.title);
  b.addEventListener('click', () => goToStation(i));
  progressNav.appendChild(b);
});
const dots = [...progressNav.children];

let targetT = 0, curT = 0;         // station parameter (0..N-1), smoothed
let heroT = 0;
let currentStation = -1;

function readScroll() {
  const y = scrollY;
  heroT = clamp(y / (HERO_LEN * VH), 0, 1);
  targetT = clamp((y - HERO_LEN * VH) / VH, 0, N - 1);
}
addEventListener('scroll', readScroll, { passive: true });

function applyHero() {
  const z = heroT;
  const zoom = 1 + 6.5 * Math.pow(smooth(0.05, 1, z), 1.6);
  heroZoom.style.transform = `scale(${zoom})`;
  const open = smooth(0.14, 0.62, z);
  doorL.style.transform = `rotateY(${-104 * open}deg)`;
  doorR.style.transform = `rotateY(${104 * open}deg)`;
  doorGlow.style.opacity = (0.15 + 0.85 * open).toFixed(3);
  heroCopy.style.opacity = (1 - smooth(0, 0.22, z)).toFixed(3);
  heroCopy.style.transform = `translateY(${-40 * smooth(0, 0.3, z)}px)`;
  scrollCue.style.opacity = (1 - smooth(0, 0.12, z)).toFixed(3);
  const fade = smooth(0.74, 0.98, z) * (hallReady ? 1 : 0);
  flash.style.opacity = (Math.sin(Math.PI * smooth(0.66, 1, z)) * 0.9).toFixed(3);
  canvas.style.opacity = fade.toFixed(3);
  header.classList.toggle('is-glass', scrollY > 40);
  const inHall = z >= 0.98 && hallReady;
  chapter.classList.toggle('is-on', inHall);
  progressNav.classList.toggle('is-on', inHall && mode === 'tour');
  hallUi.classList.toggle('is-on', inHall);
  canvas.style.pointerEvents = inHall ? 'auto' : 'none';
}

function stationParam(t) {
  // dwell at each station: ease within each segment
  const i = Math.floor(t), f = t - i;
  const e = f * f * (3 - 2 * f);
  return clamp(i + e, 0, N - 1);
}

function updateChapter() {
  const idx = Math.round(curT);
  if (idx === currentStation) return;
  currentStation = idx;
  const s = STATIONS[idx];
  chapterStep.textContent = `Room ${ROMAN[idx]} of ${ROMAN[N - 1]}`;
  chapterTitle.textContent = s.id && products.get(s.id) ? products.get(s.id).data.name : s.title;
  chapterHint.textContent = s.id ? 'Select the piece to see sizes and price' : (idx === 0 ? 'Keep scrolling to walk through the hall' : 'Look for the gold halo around each piece');
  dots.forEach((d, i) => d.setAttribute('aria-current', i === idx ? 'true' : 'false'));
}

function goToStation(i) {
  scrollTo({ top: stationScrollY(i), behavior: reduceMotion ? 'auto' : 'smooth' });
}

/* ------------------------------ Pointer ------------------------------ */
const ray = new THREE.Raycaster();
const ndc = new THREE.Vector2();
const tooltip = $('tooltip');
let hoverId = null, mx = 0, my = 0, down = null;

function pickAt(x, y) {
  if (!pickables.length) return null;
  ndc.set((x / innerWidth) * 2 - 1, -(y / innerHeight) * 2 + 1);
  ray.setFromCamera(ndc, camera);
  const hit = ray.intersectObjects(pickables, false)[0];
  return hit && hit.distance < 30 ? hit.object.userData.pid : null;
}
addEventListener('pointermove', (e) => {
  mx = e.clientX / innerWidth - 0.5; my = e.clientY / innerHeight - 0.5;
  if (e.pointerType !== 'mouse' || canvas.style.pointerEvents !== 'auto') return;
  hoverId = pickAt(e.clientX, e.clientY);
  canvas.style.cursor = hoverId ? 'pointer' : 'default';
  if (hoverId) {
    tooltip.hidden = false;
    tooltip.textContent = products.get(hoverId).data.name;
    tooltip.style.left = `${e.clientX}px`; tooltip.style.top = `${e.clientY}px`;
  } else tooltip.hidden = true;
});
/* Drag to look around (any direction). A drag inside the hall switches to free exploring. */
canvas.addEventListener('pointerdown', (e) => {
  down = { x: e.clientX, y: e.clientY, lx: e.clientX, ly: e.clientY, dragging: false, id: e.pointerId, type: e.pointerType };
});
addEventListener('pointermove', (e) => {
  if (!down || e.pointerId !== down.id) return;
  const dx = e.clientX - down.lx, dy = e.clientY - down.ly;
  if (!down.dragging && Math.hypot(e.clientX - down.x, e.clientY - down.y) > 8) {
    // on touch in guided mode, a mostly vertical swipe stays a page scroll
    if (mode === 'tour' && down.type !== 'mouse' && Math.abs(e.clientY - down.y) > Math.abs(e.clientX - down.x)) { down = null; return; }
    down.dragging = true; enterFree();
    try { canvas.setPointerCapture(e.pointerId); } catch (err) { /* not capturable */ }
  }
  if (down.dragging) {
    free.yaw += dx * 0.0042; free.pitch = clamp(free.pitch + dy * 0.0034, -0.85, 0.75);
    free.fly = null; canvas.style.cursor = 'grabbing';
  }
  down.lx = e.clientX; down.ly = e.clientY;
});
addEventListener('pointerup', (e) => {
  if (!down || e.pointerId !== down.id) return;
  const wasDrag = down.dragging; down = null;
  canvas.style.cursor = hoverId ? 'pointer' : 'default';
  if (wasDrag || e.target !== canvas) return;
  const id = pickAt(e.clientX, e.clientY);
  if (id) { openCard(id); return; }
  closeCard();
  const floorPoint = pickFloor(e.clientX, e.clientY);
  if (floorPoint) { enterFree(); walkTo(floorPoint); }
});
canvas.addEventListener('pointerleave', () => { hoverId = null; tooltip.hidden = true; });

function pickFloor(x, y) {
  if (!floorMesh) return null;
  ndc.set((x / innerWidth) * 2 - 1, -(y / innerHeight) * 2 + 1);
  ray.setFromCamera(ndc, camera);
  const hit = ray.intersectObject(floorMesh, true)[0];
  return hit && hit.distance < 40 ? hit.point : null;
}

/* ------------------------------ Free exploring ------------------------------ *
 * Guided tour: scrolling moves the camera between stations.
 * Explore: drag to look, W A S D / arrows / pad to walk, click the floor to walk there,
 * or pick any piece from the dock to fly straight to it.
 * --------------------------------------------------------------------------- */
const EYE = 3.75;                       // eye height above the hall floor (floor is at y = 2.0)
let mode = 'tour';
let blend = 1;                          // 0..1 ease when returning from free exploring to the tour
const snap = { pos: new THREE.Vector3(), quat: new THREE.Quaternion() };
const free = { pos: new THREE.Vector3(0, EYE, -3), yaw: 0, pitch: 0, fly: null };
const keys = new Set();
const OBSTACLES = [                     // [x, z, radius] on the hall floor
  [0, -15, 1.05], [6.5, -8, 0.6], [6.5, -17, 0.7], [-6.5, -17, 0.6],
  ...[-8, -16, -24, -32, -40].flatMap((z) => [[-13.2, z, 0.6], [13.2, z, 0.6]]),
];
function constrain(p) {
  p.y = EYE;
  if (p.z > -1.2) p.x = clamp(p.x, -2.1, 2.1);         // doorway and porch
  p.x = clamp(p.x, -15.0, 15.0);                       // stop at the alcove shelves
  p.z = clamp(p.z, -30.6, 3.4);                         // the staircase rises beyond -31
  for (const [ox, oz, r] of OBSTACLES) {
    const dx = p.x - ox, dz = p.z - oz, d = Math.hypot(dx, dz);
    if (d < r && d > 1e-4) { p.x = ox + dx / d * r; p.z = oz + dz / d * r; }
  }
  return p;
}
function yawPitchFrom(pos, target) {
  const d = new THREE.Vector3().subVectors(target, pos);
  return { yaw: Math.atan2(-d.x, -d.z), pitch: Math.atan2(d.y, Math.hypot(d.x, d.z)) };
}
function enterFree() {
  if (mode === 'free' || !hallReady || heroT < 0.98) return;
  mode = 'free';
  const dir = camera.getWorldDirection(new THREE.Vector3());
  free.pos.copy(camera.position);
  free.yaw = Math.atan2(-dir.x, -dir.z);
  free.pitch = Math.asin(clamp(dir.y, -1, 1));
  blend = 1;
  document.documentElement.classList.add('is-exploring');
  canvas.style.touchAction = 'none';
  syncModeUi();
}
function exitFree() {
  if (mode !== 'free') return;
  // resume the guided tour at the station nearest to where the visitor is standing
  let best = 1, bd = Infinity;
  STATIONS.forEach((s, i) => { const d = free.pos.distanceTo(new THREE.Vector3(...s.pos)); if (i > 0 && d < bd) { bd = d; best = i; } });
  mode = 'tour'; blend = 0;
  snap.pos.copy(camera.position); snap.quat.copy(camera.quaternion);
  document.documentElement.classList.remove('is-exploring');
  canvas.style.touchAction = 'pan-y';
  scrollTo({ top: stationScrollY(best), behavior: 'auto' });
  readScroll(); curT = targetT; currentStation = -1;
  syncModeUi();
}
function flyTo(pos, look, then) {
  const to = yawPitchFrom(new THREE.Vector3(...pos), new THREE.Vector3(...look));
  let dyaw = to.yaw - free.yaw; dyaw = Math.atan2(Math.sin(dyaw), Math.cos(dyaw));
  free.fly = {
    p0: free.pos.clone(), p1: new THREE.Vector3(pos[0], EYE, pos[2]),
    y0: free.yaw, y1: free.yaw + dyaw, a0: free.pitch, a1: to.pitch,
    t: 0, dur: reduceMotion ? 0.01 : clamp(free.pos.distanceTo(new THREE.Vector3(...pos)) / 7, 0.9, 2.6), then,
  };
}
function walkTo(point) {
  const target = constrain(new THREE.Vector3(point.x, EYE, point.z));
  free.fly = { p0: free.pos.clone(), p1: target, y0: free.yaw, y1: free.yaw, a0: free.pitch, a1: free.pitch,
    t: 0, dur: reduceMotion ? 0.01 : clamp(free.pos.distanceTo(target) / 5, 0.5, 3), then: null };
}
function goToProduct(id) {
  const s = STATIONS.find((x) => x.id === id); if (!s) return;
  closeCard();
  if (!hallReady || heroT < 0.98) {            // still outside: take the tour route in
    const i = STATIONS.indexOf(s); pendingOpen = { id, station: i }; goToStation(i); return;
  }
  enterFree();
  flyTo(s.pos, s.look, () => openCard(id));
}
function updateFree(dt) {
  if (free.fly) {
    const f = free.fly; f.t += dt / f.dur;
    const k = f.t >= 1 ? 1 : 1 - Math.pow(1 - f.t, 3);
    free.pos.lerpVectors(f.p0, f.p1, k);
    free.yaw = f.y0 + (f.y1 - f.y0) * k; free.pitch = f.a0 + (f.a1 - f.a0) * k;
    if (f.t >= 1) { free.fly = null; if (f.then) f.then(); }
  } else {
    const fwd = (keys.has('w') || keys.has('arrowup') || pad.has('fwd') ? 1 : 0) - (keys.has('s') || keys.has('arrowdown') || pad.has('back') ? 1 : 0);
    const side = (keys.has('d') ? 1 : 0) - (keys.has('a') ? 1 : 0);
    const turn = (keys.has('arrowleft') || pad.has('left') ? 1 : 0) - (keys.has('arrowright') || pad.has('right') ? 1 : 0);
    free.yaw += turn * dt * 1.6;
    if (fwd || side) {
      const sp = 4.2 * dt;
      free.pos.x += (-Math.sin(free.yaw) * fwd + Math.cos(free.yaw) * side) * sp;
      free.pos.z += (-Math.cos(free.yaw) * fwd - Math.sin(free.yaw) * side) * sp;
    }
  }
  constrain(free.pos);
  camera.position.copy(free.pos);
  camera.rotation.set(free.pitch, free.yaw, 0, 'YXZ');
}

addEventListener('keydown', (e) => {
  const k = e.key.toLowerCase();
  if (!['w', 'a', 's', 'd', 'arrowup', 'arrowdown', 'arrowleft', 'arrowright'].includes(k)) return;
  if (e.target.closest && e.target.closest('input, textarea')) return;
  if (!hallReady || heroT < 0.98) return;
  enterFree(); keys.add(k); free.fly = null; e.preventDefault();
});
addEventListener('keyup', (e) => keys.delete(e.key.toLowerCase()));
addEventListener('blur', () => keys.clear());
canvas.addEventListener('wheel', (e) => {
  if (mode !== 'free') return;
  e.preventDefault(); free.fly = null;
  const step = clamp(-e.deltaY * 0.01, -1.2, 1.2);
  free.pos.x += -Math.sin(free.yaw) * step; free.pos.z += -Math.cos(free.yaw) * step;
}, { passive: false });

/* On-screen walking pad (touch and mouse) */
const pad = new Set();
document.querySelectorAll('[data-pad]').forEach((b) => {
  const dir = b.dataset.pad;
  const on = (e) => { e.preventDefault(); enterFree(); free.fly = null; pad.add(dir); };
  const off = () => pad.delete(dir);
  b.addEventListener('pointerdown', on); b.addEventListener('pointerup', off);
  b.addEventListener('pointerleave', off); b.addEventListener('pointercancel', off);
});

/* Product dock + mode switch */
const dock = $('dock'), modeBtn = $('modeBtn'), hallUi = $('hallUi');
function buildDock() {
  dock.innerHTML = '';
  STATIONS.forEach((s) => {
    if (!s.id) return;
    const d = dataFor(s.id);
    const b = document.createElement('button'); b.type = 'button'; b.className = 'dock-item'; b.dataset.id = s.id;
    b.innerHTML = '<span class="dock-num"></span><span class="dock-name"></span>';
    b.querySelector('.dock-num').textContent = s.id.slice(-2);
    b.querySelector('.dock-name').textContent = d.name;
    b.addEventListener('click', () => goToProduct(s.id));
    dock.appendChild(b);
  });
}
modeBtn.addEventListener('click', () => { if (mode === 'free') exitFree(); else enterFree(); });
function syncModeUi() {
  const exploring = mode === 'free';
  modeBtn.textContent = exploring ? 'Return to guided tour' : 'Explore freely';
  modeBtn.setAttribute('aria-pressed', String(exploring));
  $('movePad').hidden = !exploring;
  if (exploring) {
    chapterStep.textContent = 'Free exploring';
    chapterTitle.textContent = 'The Great Hall';
    chapterHint.textContent = matchMedia('(pointer: coarse)').matches
      ? 'Drag to look around · Tap the floor to walk there'
      : 'Drag to look around · W A S D or arrows to walk · Click the floor to walk there';
  } else currentStation = -1;
}
function markDock() {
  const id = openId || (mode === 'tour' && STATIONS[Math.round(curT)] ? STATIONS[Math.round(curT)].id : null);
  [...dock.children].forEach((c) => c.setAttribute('aria-current', String(c.dataset.id === id)));
}

/* ------------------------------ Product card ------------------------------ */
const card = $('card'), cardName = $('cardName'), cardPrice = $('cardPrice'), cardRef = $('cardRef');
const cardSizes = $('cardSizes'), addBtn = $('addBtn');
let openId = null, chosenSize = null;

function openCard(id) {
  const p = products.get(id); if (!p) return;
  openId = id;
  cardRef.textContent = `No. ${id.slice(-2)}`;
  cardName.textContent = p.data.name;
  cardPrice.textContent = p.data.price;
  const sizes = String(p.data.sizes).split(',').map((s) => s.trim()).filter(Boolean);
  chosenSize = sizes.length === 1 ? sizes[0] : null;
  cardSizes.innerHTML = '';
  sizes.forEach((s) => {
    const b = document.createElement('button');
    b.type = 'button'; b.className = 'size'; b.textContent = s;
    b.setAttribute('aria-pressed', String(s === chosenSize));
    b.addEventListener('click', () => {
      chosenSize = s;
      [...cardSizes.children].forEach((c) => c.setAttribute('aria-pressed', String(c === b)));
      syncAdd();
    });
    cardSizes.appendChild(b);
  });
  syncAdd();
  card.classList.add('is-open'); card.setAttribute('aria-hidden', 'false');
  tooltip.hidden = true;
}
function syncAdd() {
  addBtn.disabled = !chosenSize;
  addBtn.textContent = chosenSize ? 'Add to Cart' : 'Select a size';
}
function closeCard() {
  openId = null; card.classList.remove('is-open'); card.setAttribute('aria-hidden', 'true');
}
$('cardClose').addEventListener('click', closeCard);

/* ------------------------------ Cart ------------------------------ */
const CART_KEY = 'palais-heritage-cart';
let cart = [];
try { cart = JSON.parse(localStorage.getItem(CART_KEY) || '[]') || []; } catch (e) { cart = []; }
const saveCart = () => { try { localStorage.setItem(CART_KEY, JSON.stringify(cart)); } catch (e) { /* storage unavailable */ } };
const priceNum = (p) => Number(String(p).replace(/[^0-9.]/g, '')) || 0;
const money = (n) => '$' + n.toLocaleString('en-US');
const dataFor = (id) => (products.get(id) || {}).data || PRODUCTS[id];

addBtn.addEventListener('click', () => {
  if (!openId || !chosenSize) return;
  const line = cart.find((l) => l.id === openId && l.size === chosenSize);
  if (line) line.qty += 1; else cart.push({ id: openId, size: chosenSize, qty: 1 });
  saveCart(); renderCart();
  showToast(`${dataFor(openId).name} added`);
  closeCard();
});

const cartLines = $('cartLines'), cartCount = $('cartCount'), subtotalEl = $('subtotal');
function renderCart() {
  cartLines.innerHTML = '';
  let count = 0, total = 0;
  if (!cart.length) {
    const p = document.createElement('p'); p.className = 'cart-empty';
    p.textContent = 'Nothing selected yet. Walk through the Great Hall and select a piece to add it here.';
    cartLines.appendChild(p);
  }
  cart.forEach((l, idx) => {
    const d = dataFor(l.id); if (!d) return;
    count += l.qty; total += priceNum(d.price) * l.qty;
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
    row.querySelector('.sz').textContent = `Size ${l.size}`;
    const [minus, plus] = row.querySelectorAll('.qty button');
    row.querySelector('.qty span').textContent = l.qty;
    minus.addEventListener('click', () => { l.qty -= 1; if (l.qty <= 0) cart.splice(idx, 1); saveCart(); renderCart(); });
    plus.addEventListener('click', () => { l.qty += 1; saveCart(); renderCart(); });
    row.querySelector('.cart-remove').addEventListener('click', () => { cart.splice(idx, 1); saveCart(); renderCart(); });
    cartLines.appendChild(row);
  });
  cartCount.textContent = count;
  cartCount.dataset.empty = String(count === 0);
  subtotalEl.textContent = money(total);
}
renderCart();

$('checkoutBtn').addEventListener('click', () => {
  $('cartNote').textContent = cart.length
    ? 'Checkout connects to your store platform (Shopify or WooCommerce) in the next build.'
    : 'Add a piece first.';
});

/* ------------------------------ Drawers ------------------------------ */
const scrim = $('scrim'), cartDrawer = $('cartDrawer'), menuDrawer = $('menuDrawer');
function openDrawer(d) {
  closeCard(); [cartDrawer, menuDrawer].forEach((x) => { x.classList.toggle('is-open', x === d); x.setAttribute('aria-hidden', String(x !== d)); });
  scrim.classList.add('is-open'); $('cartNote').textContent = '';
}
function closeDrawers() {
  [cartDrawer, menuDrawer].forEach((x) => { x.classList.remove('is-open'); x.setAttribute('aria-hidden', 'true'); });
  scrim.classList.remove('is-open');
}
$('cartBtn').addEventListener('click', () => openDrawer(cartDrawer));
$('menuBtn').addEventListener('click', () => openDrawer(menuDrawer));
scrim.addEventListener('click', closeDrawers);
document.querySelectorAll('[data-close]').forEach((b) => b.addEventListener('click', closeDrawers));
document.querySelectorAll('[data-goto]').forEach((b) => b.addEventListener('click', () => { closeDrawers(); goToStation(Number(b.dataset.goto)); }));
$('aboutBtn').addEventListener('click', () => { $('aboutCopy').hidden = !$('aboutCopy').hidden; });
$('contactBtn').addEventListener('click', () => { $('contactCopy').hidden = !$('contactCopy').hidden; });
document.querySelector('.brand').addEventListener('click', (e) => { e.preventDefault(); closeDrawers(); scrollTo({ top: 0, behavior: reduceMotion ? 'auto' : 'smooth' }); });
addEventListener('keydown', (e) => { if (e.key === 'Escape') { closeCard(); closeDrawers(); } });

let pendingOpen = null;
function buildCollection() {
  const list = $('collection'); list.innerHTML = '';
  STATIONS.forEach((s, i) => {
    if (!s.id) return;
    const d = dataFor(s.id);
    const b = document.createElement('button'); b.type = 'button';
    b.innerHTML = '<span class="c-num"></span><span class="c-name"></span><span class="c-price"></span>';
    b.querySelector('.c-num').textContent = s.id.slice(-2);
    b.querySelector('.c-name').textContent = d.name;
    b.querySelector('.c-price').textContent = d.price;
    b.addEventListener('click', () => { closeDrawers(); goToProduct(s.id); });
    list.appendChild(b);
  });
}
buildCollection();
buildDock();

let toastTimer;
function showToast(msg) {
  const t = $('toast'); t.textContent = msg; t.classList.add('is-on');
  clearTimeout(toastTimer); toastTimer = setTimeout(() => t.classList.remove('is-on'), 2200);
}

/* ------------------------------ Loop ------------------------------ */
function resize() {
  layoutTrack(); readScroll();
  camera.aspect = innerWidth / innerHeight;
  camera.fov = camera.aspect < 0.8 ? 66 : 52;
  camera.updateProjectionMatrix();
  if (renderer) renderer.setSize(innerWidth, innerHeight, false);
}
addEventListener('resize', resize);
resize();
curT = targetT;

const clock = new THREE.Clock();
const look = new THREE.Vector3();
const tourQuat = new THREE.Quaternion();
function frame() {
  const rawDt = Math.min(0.25, clock.getDelta());
  const dt = Math.min(0.05, rawDt);
  const t = clock.elapsedTime;
  applyHero();
  curT += (targetT - curT) * (reduceMotion ? 1 : Math.min(1, dt * 3.2));
  if (heroT > 0.6 && renderer && hallReady) {
    if (mode === 'free') {
      updateFree(rawDt);
    } else {
      const u = stationParam(curT) / (N - 1);
      camera.position.copy(posCurve.getPoint(u));
      look.copy(lookCurve.getPoint(u));
      look.x += mx * 1.2; look.y -= my * 0.7;
      camera.lookAt(look);
      if (blend < 1) {
        blend = Math.min(1, blend + dt / 1.1);
        const k = blend * blend * (3 - 2 * blend);
        tourQuat.copy(camera.quaternion);
        camera.position.lerpVectors(snap.pos, camera.position.clone(), k);
        camera.quaternion.slerpQuaternions(snap.quat, tourQuat, k);
      }
    }
    markDock();
    products.forEach((p, id) => {
      const target = (id === hoverId || id === openId) ? 1 : 0;
      p.hover += (target - p.hover) * Math.min(1, dt * 6);
      const pulse = reduceMotion ? 0.5 : 0.5 + 0.5 * Math.sin(t * 1.6 + p.center.z);
      p.halo.material.opacity = 0.22 + 0.22 * pulse + 0.4 * p.hover;
      const s = p.halo.userData.base * (1 + 0.05 * pulse + 0.08 * p.hover);
      p.halo.scale.set(s, s, 1);
    });
    renderer.render(scene, camera);
    if (heroT >= 0.98 && mode === 'tour') updateChapter();
    if (pendingOpen && Math.abs(curT - pendingOpen.station) < 0.04) { openCard(pendingOpen.id); pendingOpen = null; }
  }
  requestAnimationFrame(frame);
}
requestAnimationFrame(frame);

// Small hook for testing and for wiring a store later.
window.palais = { openCard, closeCard, goToStation, goToProduct, enterFree, exitFree, products, camera };
