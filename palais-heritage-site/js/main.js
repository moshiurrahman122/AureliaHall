// Palais Héritage — scroll journey across the town square, through the doors and into the Great Hall.
import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';

import { PRODUCTS as CATALOG, PRODUCT_LIST, sizesOf } from './catalog.js';
import { CONTACT } from './shop-config.js';
import { cart, mountCart } from './shop.js';

/* Catalogue lives in catalog.js (shared with the Collection and product pages).
   Names, prices and sizes are also stored on each product inside hall.glb; the model's values win. */
const PRODUCTS = Object.fromEntries(Object.entries(CATALOG).map(([id, p]) => [id, { name: p.name, price: p.price, sizes: p.sizes }]));

/* Camera stations (three.js coordinates, metres). The first ones walk across the square outside. */
const OUTSIDE = [
  { title: 'Palais Héritage',       pos: [0, 6.0, 78],       look: [0, 15, 10], outside: true },
  { title: 'The Fountain Square',   pos: [12.5, 3.6, 57],    look: [-1, 6, 28], outside: true },
  { title: 'The Town Hall',         pos: [2, 2.8, 30],       look: [0, 13, 0], outside: true },
  { title: 'The Porch',             pos: [0, 2.9, 14],       look: [0, 5, 0], outside: true },
];
const HALL0 = OUTSIDE.length;          // index of the first stop inside
const STATIONS = [
  ...OUTSIDE,
  { title: 'The Entrance',          pos: [0, 4.0, 3.4],      look: [0, 4.6, -20] },
  { title: 'The Great Hall',        pos: [0, 5.2, -3.5],     look: [0, 9.0, -34] },
  { title: 'Velvet Embroidered Gown', id: 'product_01', pos: [1.8, 3.9, -10.0], look: [0, 3.4, -15] },
  { title: 'Navy Velvet Embroidered Blazer', id: 'product_06', pos: [3.0, 3.7, -4.4], look: [6.5, 3.4, -8] },
  { title: 'Baroque Silk Twill Scarf', id: 'product_10', pos: [3.3, 3.7, -13.5], look: [6.5, 2.95, -17] },
  { title: 'Burgundy Leather Top-Handle Bag', id: 'product_02', pos: [-3.3, 3.4, -14.1], look: [-6.5, 3.2, -17] },
  { title: 'Ruby Cascade Necklace', id: 'product_03', pos: [-14.0, 4.1, -12], look: [-16.45, 4.0, -12] },
  { title: 'Gold Dress Watch', id: 'product_05', pos: [-14.2, 3.9, -24], look: [-16.45, 3.9, -24] },
  { title: 'Ruby Chandelier Earrings', id: 'product_08', pos: [-14.2, 3.9, -36], look: [-16.45, 3.85, -36] },
  { title: 'The Grand Staircase',   pos: [0, 5.0, -26.5],    look: [0, 8.5, -46] },
  { title: 'Navy Velvet Crest Loafers', id: 'product_07', pos: [14.2, 3.8, -36], look: [16.45, 3.8, -36] },
  { title: 'Crystal Flacon Parfum', id: 'product_09', pos: [14.2, 3.9, -24], look: [16.45, 3.9, -24] },
  { title: 'Gold Satin Crystal Pumps', id: 'product_04', pos: [14.2, 3.9, -12], look: [16.45, 3.8, -12] },
];
const N = STATIONS.length;
const ROMAN = ['I','II','III','IV','V','VI','VII','VIII','IX','X','XI','XII','XIII','XIV','XV'];

const $ = (id) => document.getElementById(id);
const clamp = (v, a, b) => Math.min(b, Math.max(a, v));
const smooth = (a, b, v) => { const t = clamp((v - a) / (b - a), 0, 1); return t * t * (3 - 2 * t); };
const reduceMotion = matchMedia('(prefers-reduced-motion: reduce)').matches;

/* ------------------------------ Scroll track ------------------------------ */
const track = $('track');
let VH = innerHeight;
function layoutTrack() {
  VH = innerHeight;
  track.style.height = `${N * VH}px`;            // one screen of scrolling per stop
}
layoutTrack();
function stationScrollY(i) { return Math.round(i * VH); }

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
const camera = new THREE.PerspectiveCamera(52, innerWidth / innerHeight, 0.2, 1600);
camera.position.set(...OUTSIDE[0].pos); camera.lookAt(...OUTSIDE[0].look);

if (renderer) {
  renderer.setPixelRatio(Math.min(devicePixelRatio || 1, 1.75));
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 0.82;
  const pm = new THREE.PMREMGenerator(renderer);
  scene.environment = pm.fromScene(new RoomEnvironment(renderer), 0.04).texture;
}

/* Daylight for the square; it fades out as the visitor walks indoors. */
const sun = new THREE.DirectionalLight(0xfff0d8, 2.4);
sun.position.set(-60, 90, 70);
const skyFill = new THREE.HemisphereLight(0xcfe2ff, 0x5b4a38, 0.75);
scene.add(sun, skyFill);

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
// One warm spot per alcove, angled down from the hall side onto the piece on display.
[-12, -24, -36].forEach((z) => {
  [-1, 1].forEach((side) => {
    const s = new THREE.SpotLight(0xffe6c4, 80, 9, Math.PI / 6.5, 0.55, 1.4);
    s.position.set(side * 14.6, 7.4, z + 0.6); s.target.position.set(side * 16.45, 3.75, z);
    scene.add(s, s.target);
  });
});

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
const loader = new GLTFLoader();
let extReady = false, extRoot = null, hallRoot = null;
const treeMeshes = [];
const animated = { water: [], flags: [], sky: null };
function tuneMaterials(root) {
  root.traverse((o) => {
    if (!o.isMesh) return;
    const mats = Array.isArray(o.material) ? o.material : [o.material];
    mats.forEach((m) => {
      if ('envMapIntensity' in m) m.envMapIntensity = m.metalness > 0.5 ? 0.8 : 0.18;
      if (m.transparent) m.depthWrite = false;
      // Neon gold alcove strips: keep the colour vivid, and let the soft glow behind them add light.
      // Perfume: thick clear crystal over amber parfum, refracting what is behind it.
      if (m.name === 'Parfum_Glass2' && m.isMeshPhysicalMaterial) {
        m.transmission = 1; m.thickness = 0.05; m.ior = 1.52; m.roughness = 0.02; m.metalness = 0;
        m.specularIntensity = 1; m.clearcoat = 1; m.clearcoatRoughness = 0.02; m.envMapIntensity = 1.4;
        m.color.set(0xffffff); m.attenuationColor.set(0xf4f1ea); m.attenuationDistance = 0.6;
        m.transparent = false; m.depthWrite = true;
      }
      if (m.name === 'Parfum_Liquid2' && m.isMeshPhysicalMaterial) {
        m.transmission = 0.92; m.thickness = 0.1; m.ior = 1.36; m.roughness = 0.04; m.metalness = 0;
        m.color.set(0xf0b36a); m.attenuationColor.set(0xc8641c); m.attenuationDistance = 0.12; m.envMapIntensity = 1.2;
        m.transparent = false; m.depthWrite = true;
      }
      if (m.name === 'Parfum_Gold' || m.name === 'Parfum_Gold_Brushed') m.envMapIntensity = 1.3;
      if (m.name === 'Velvet_Bust' && !m.userData.lifted) { m.color.multiplyScalar(1.6); m.userData.lifted = true; }
      if (m.name === 'Alcove_Neon') { m.toneMapped = false; m.emissiveIntensity = 1.6; }
      if (m.name === 'Neon_Glow') {
        m.transparent = true; m.depthWrite = false; m.toneMapped = false;
        m.blending = THREE.AdditiveBlending; m.color.set(0x000000);
        m.emissive.set(0xffae22); m.emissiveIntensity = 0.9;
        if (m.map) { m.alphaMap = null; } o.renderOrder = 5;
      }
    });
  });
}
function loadOutside() {
  return new Promise((resolve) => {
    loader.load(ASSET_EXTERIOR, (gltf) => {
      extRoot = gltf.scene;
      tuneMaterials(extRoot);
      extRoot.traverse((o) => {
        if (!o.isMesh) return;
        const mats = Array.isArray(o.material) ? o.material : [o.material];
        mats.forEach((m) => {
          const n = m.name || '';
          // Pools are drawn solid so they never swap order with the falls; foam and falls sit on top.
          if (n === 'Water') { m.transparent = false; m.depthWrite = true; m.opacity = 1; m.alphaTest = 0;
            m.polygonOffset = true; m.polygonOffsetFactor = -2; m.polygonOffsetUnits = -4; o.renderOrder = 1; }
          if (n === 'Water_Fall' || n === 'Foam') { m.transparent = true; m.depthWrite = false;
            m.polygonOffset = true; m.polygonOffsetFactor = n === 'Foam' ? -4 : -3; m.polygonOffsetUnits = n === 'Foam' ? -8 : -6;
            o.renderOrder = n === 'Foam' ? 3 : 2; }
          if (/^(Water_Fall|Water|Foam)$/.test(n) && m.map) {
            m.map.wrapS = m.map.wrapT = THREE.RepeatWrapping; m.map.needsUpdate = true;
            const speed = n === 'Water_Fall' ? [0, 1.0] : n === 'Foam' ? [0.02, 0.06] : [0.03, 0.02];
            if (!animated.water.find((w) => w.map === m.map)) animated.water.push({ map: m.map, speed });
            if (m.emissiveMap && m.emissiveMap !== m.map) { m.emissiveMap.wrapS = m.emissiveMap.wrapT = THREE.RepeatWrapping; animated.water.push({ map: m.emissiveMap, speed }); }
          }
          if (n === 'Sky_Dome') { m.toneMapped = false; m.fog = false; }
        });
        // Street lamps on the square: neon gold glass that stays gold in daylight.
        if (Array.isArray(o.material)) {
          o.material = o.material.map((m) => {
            if (m.name !== 'Alcove_Neon') return m;
            const g = m.clone(); g.name = 'Lamp_Neon_Gold';
            g.color.set(0x1a1004); g.emissive.setRGB(1, 0.54, 0.07); g.emissiveIntensity = 1.15; g.toneMapped = false;
            return g;
          });
        } else if (o.material && o.material.name === 'Alcove_Neon') {
          const g = o.material.clone(); g.name = 'Lamp_Neon_Gold';
          g.color.set(0x1a1004); g.emissive.setRGB(1, 0.54, 0.07); g.emissiveIntensity = 1.15; g.toneMapped = false;
          o.material = g;
        }
        if (o.name.startsWith('Flag_')) {
          const pos = o.geometry.attributes.position;
          o.geometry = o.geometry.clone();
          const base = Float32Array.from(o.geometry.attributes.position.array);
          let minX = Infinity; for (let i = 0; i < pos.count; i++) minX = Math.min(minX, base[i * 3]);
          animated.flags.push({ mesh: o, base, minX });
        }
        if (o.name.startsWith('Sky_Dome')) { animated.sky = o; o.frustumCulled = false; }
      });
      scene.add(extRoot);
      Promise.resolve().finally(() => {             // trees left out to keep the square light
        extReady = true;
        $('heroZoom').classList.add('is-hidden');
        resolve();
      });
    }, (ev) => {
      if (ev.total) loadNote.textContent = `Preparing the square · ${Math.round(ev.loaded / ev.total * 100)}%`;
    }, () => { loadNote.textContent = 'The square could not be loaded. Check the assets folder.'; resolve(); });
  });
}
function loadTrees() {
  return Promise.all([
    new Promise((res, rej) => loader.load(ASSET_TREE, res, undefined, rej)),
    fetch(ASSET_TREE_LIST).then((r) => r.json()),
  ]).then(([gltf, list]) => {
    const dummy = new THREE.Object3D();
    gltf.scene.updateMatrixWorld(true);
    gltf.scene.traverse((o) => {
      if (!o.isMesh) return;
      const mat = o.material;
      if (mat.transparent || mat.alphaTest || (mat.map && /leaves/i.test(mat.name))) {
        mat.transparent = false; mat.alphaTest = 0.45; mat.depthWrite = true; mat.side = THREE.DoubleSide;
      }
      mat.envMapIntensity = 0.25;
      const inst = new THREE.InstancedMesh(o.geometry, mat, list.length);
      list.forEach(([x, y, z, rot, sc], i) => {
        dummy.position.set(x, y, z); dummy.rotation.set(0, rot, 0); dummy.scale.setScalar(sc);
        dummy.updateMatrix();
        inst.setMatrixAt(i, dummy.matrix.clone().multiply(o.matrixWorld));
      });
      inst.instanceMatrix.needsUpdate = true;
      inst.computeBoundingSphere();
      scene.add(inst); treeMeshes.push(inst);
    });
  }).catch(() => { /* trees are decoration; carry on without them */ });
}
const ASSET_EXTERIOR = 'assets/exterior.glb', ASSET_TREE = 'assets/tree.glb', ASSET_TREE_LIST = 'assets/trees.json', ASSET_HALL = 'assets/hall.glb';
if (renderer) loadOutside().then(() => loadHall());
function loadHall() {
  loader.load(ASSET_HALL, (gltf) => {
    const root = gltf.scene; hallRoot = root;
    tuneMaterials(root);
    scene.add(root);
    buildDoors(root);
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
    requestAnimationFrame(() => { try { renderThumbs(); } catch (e) { /* pictures are optional */ } });
    loadNote.textContent = '';
  }, (ev) => {
    if (ev.total && scrollY < VH * 0.3) loadNote.textContent = `Preparing the Great Hall · ${Math.round(ev.loaded / ev.total * 100)}%`;
  }, () => {
    loadNote.textContent = 'The hall could not be loaded. Check that hall.glb sits in the assets folder.';
  });
}
if (!renderer) loadNote.textContent = '';
function pick(src, keys) { const o = {}; keys.forEach((k) => { if (src[k]) o[k] = src[k]; }); return o; }

/* Camera paths through the stations */
const posCurve = new THREE.CatmullRomCurve3(STATIONS.map((s) => new THREE.Vector3(...s.pos)), false, 'catmullrom', 0.35);
const lookCurve = new THREE.CatmullRomCurve3(STATIONS.map((s) => new THREE.Vector3(...s.look)), false, 'catmullrom', 0.35);

/* ------------------------------ Scroll state ------------------------------ */
const heroCopy = $('heroCopy'), scrollCue = $('scrollCue'), header = $('header');
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
let heroT = 0;                     // 0 outside, 1 once the visitor stands in the entrance
let currentStation = -1;

function readScroll() {
  const y = scrollY;
  targetT = clamp(y / VH, 0, N - 1);
  heroT = clamp(targetT - (HALL0 - 1), 0, 1);
}
addEventListener('scroll', () => {
  readScroll();
  if (mode === 'free' && performance.now() > ignoreScrollUntil) exitFree();
}, { passive: true });

function applyHero() {
  const z = targetT;
  heroCopy.style.opacity = (1 - smooth(0, 0.3, z)).toFixed(3);
  heroCopy.style.transform = `translateY(${-40 * smooth(0, 0.4, z)}px)`;
  scrollCue.style.opacity = (1 - smooth(0, 0.15, z)).toFixed(3);
  canvas.style.opacity = extReady ? '1' : '0';
  header.classList.toggle('is-glass', scrollY > 40);
  const touring = extReady && z > 0.45;
  chapter.classList.toggle('is-on', touring);
  progressNav.classList.remove('is-on');           // replaced by the collection wheel
  if (hallUi) hallUi.classList.toggle('is-on', touring && hallReady);
  canvas.style.pointerEvents = extReady ? 'auto' : 'none';
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
  chapterStep.textContent = s.outside ? 'The Square' : `Room ${ROMAN[idx - HALL0]} of ${ROMAN[N - 1 - HALL0]}`;
  chapterTitle.textContent = s.id && products.get(s.id) ? products.get(s.id).data.name : s.title;
  chapterHint.textContent = s.id ? 'Select the piece to see sizes and price · Drag to look around' : (s.outside ? 'Scroll to walk on · Drag to look around' : idx === HALL0 ? 'Scroll to walk the tour · Drag to look around' : 'Drag to look around · Select a glowing piece');
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
/* Drag to look around in any direction. Works on the guided tour and when exploring;
   scrolling keeps walking the tour. Movement is eased and carries a little momentum. */
const LOOK_SPEED_X = 0.0034, LOOK_SPEED_Y = 0.0028;
const lookVel = { x: 0, y: 0 };
function addLook(dyaw, dpitch) {
  const o = mode === 'free' ? free : tourOff;
  o.tyaw += dyaw;
  o.tpitch = clamp(o.tpitch + dpitch, mode === 'free' ? -0.85 : -0.7, mode === 'free' ? 0.75 : 0.6);
}
canvas.addEventListener('pointerdown', (e) => {
  down = { x: e.clientX, y: e.clientY, lx: e.clientX, ly: e.clientY, dragging: false, id: e.pointerId, type: e.pointerType, t: performance.now() };
  lookVel.x = lookVel.y = 0;
});
addEventListener('pointermove', (e) => {
  if (!down || e.pointerId !== down.id) return;
  const dx = e.clientX - down.lx, dy = e.clientY - down.ly;
  if (!down.dragging && Math.hypot(e.clientX - down.x, e.clientY - down.y) > 8) {
    // on touch in guided mode, a mostly vertical swipe stays a page scroll
    if (mode === 'tour' && down.type !== 'mouse' && Math.abs(e.clientY - down.y) > Math.abs(e.clientX - down.x)) { down = null; return; }
    down.dragging = true; free.fly = null;
    try { canvas.setPointerCapture(e.pointerId); } catch (err) { /* not capturable */ }
  }
  if (down.dragging) {
    const now = performance.now(), ms = Math.max(8, now - down.t);
    addLook(dx * LOOK_SPEED_X, dy * LOOK_SPEED_Y);
    // remember drag speed (per second) for momentum after release
    lookVel.x = lookVel.x * 0.6 + (dx * LOOK_SPEED_X / ms * 1000) * 0.4;
    lookVel.y = lookVel.y * 0.6 + (dy * LOOK_SPEED_Y / ms * 1000) * 0.4;
    down.t = now; canvas.style.cursor = 'grabbing';
  }
  down.lx = e.clientX; down.ly = e.clientY;
});
addEventListener('pointerup', (e) => {
  if (!down || e.pointerId !== down.id) return;
  const wasDrag = down.dragging;
  if (wasDrag && performance.now() - down.t > 90) { lookVel.x = lookVel.y = 0; }   // held still before letting go
  down = null;
  canvas.style.cursor = hoverId ? 'pointer' : 'default';
  if (wasDrag || e.target !== canvas) return;
  const id = pickAt(e.clientX, e.clientY);
  if (id) {
    const p = products.get(id);
    if (p && camera.position.distanceTo(p.center) > 7.5) goToProduct(id); else openCard(id);
    return;
  }
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
const free = { pos: new THREE.Vector3(0, EYE, -3), yaw: 0, pitch: 0, tyaw: 0, tpitch: 0, fly: null };
const tourOff = { yaw: 0, pitch: 0, tyaw: 0, tpitch: 0 };   // drag offset applied on top of the guided tour
let ignoreScrollUntil = 0;
const keys = new Set();
const OBSTACLES = [                     // [x, z, radius] on the hall floor
  [0, -15, 1.05], [6.5, -8, 0.6], [6.5, -17, 0.7], [-6.5, -17, 0.6],
  ...[-8, -16, -24, -32, -40].flatMap((z) => [[-13.2, z, 0.95], [13.2, z, 0.95]]),
];
const STAIR_Z = -30.6, AISLE_X = 12.7;   // the grand staircase fills the middle beyond STAIR_Z; side aisles run to the back wall
function constrain(p, prev) {
  p.y = EYE;
  if (p.z > -1.2) p.x = clamp(p.x, -2.1, 2.1);         // doorway and porch
  p.x = clamp(p.x, -15.0, 15.0);                       // stop at the alcove shelves
  p.z = clamp(p.z, -49.2, 3.4);
  if (p.z < STAIR_Z && Math.abs(p.x) < AISLE_X) {      // keep off the staircase
    if (prev && Math.abs(prev.x) >= AISLE_X - 0.05) p.x = Math.sign(prev.x || 1) * AISLE_X;
    else if (prev && prev.z < STAIR_Z) p.x = Math.sign(p.x || 1) * AISLE_X;
    else p.z = STAIR_Z;
  }
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
  free.yaw = free.tyaw = Math.atan2(-dir.x, -dir.z);
  free.pitch = free.tpitch = Math.asin(clamp(dir.y, -1, 1));
  tourOff.yaw = tourOff.tyaw = tourOff.pitch = tourOff.tpitch = 0;
  blend = 1;
  document.documentElement.classList.add('is-exploring');
  canvas.style.touchAction = 'none';
  syncModeUi();
}
function exitFree() {
  if (mode !== 'free') return;
  // resume the guided tour at the station nearest to where the visitor is standing
  let best = 1, bd = Infinity;
  STATIONS.forEach((s, i) => { const d = free.pos.distanceTo(new THREE.Vector3(...s.pos)); if (i > HALL0 && d < bd) { bd = d; best = i; } });
  mode = 'tour'; blend = 0;
  snap.pos.copy(camera.position); snap.quat.copy(camera.quaternion);
  document.documentElement.classList.remove('is-exploring');
  canvas.style.touchAction = 'pan-y';
  ignoreScrollUntil = performance.now() + 250;
  scrollTo({ top: stationScrollY(best), behavior: 'auto' });
  readScroll(); curT = targetT; currentStation = -1;
  syncModeUi();
}
/* Route along the floor: around the columns, through the side aisles, never across the staircase. */
function routeTo(from, to) {
  const pts = [from.clone()];
  const side = (v) => (Math.abs(v.x) > 12 ? Math.sign(v.x) : 0);
  const sFrom = side(from), sTo = side(to);
  const aisleX = 14.25;
  if (sFrom && from.z < -12 && sFrom !== sTo) pts.push(new THREE.Vector3(sFrom * 11.2, EYE, Math.max(from.z, -28) + 1.5));
  if (sTo && sFrom !== sTo) {
    const approachZ = Math.max(to.z + 4.2, -27.5);
    pts.push(new THREE.Vector3(sTo * 11.2, EYE, approachZ + 1.0));
    pts.push(new THREE.Vector3(sTo * aisleX, EYE, approachZ));
  }
  if (sTo && sFrom === sTo) pts.push(new THREE.Vector3(sTo * aisleX, EYE, (from.z + to.z) / 2));
  if (!sTo && from.z < -28 && sFrom) pts.push(new THREE.Vector3(sFrom * 11.2, EYE, -27));
  pts.push(to.clone());
  if (pts.length === 2) return { getPoint: (k) => new THREE.Vector3().lerpVectors(from, to, k), length: from.distanceTo(to) };
  const c = new THREE.CatmullRomCurve3(pts, false, 'centripetal');
  return { getPoint: (k) => c.getPointAt(k), length: c.getLength() };
}
function flyTo(pos, look, then) {
  const to = yawPitchFrom(new THREE.Vector3(...pos), new THREE.Vector3(...look));
  let dyaw = to.yaw - free.tyaw; dyaw = Math.atan2(Math.sin(dyaw), Math.cos(dyaw));
  const dest = new THREE.Vector3(pos[0], EYE, pos[2]);
  const route = routeTo(free.pos, dest);
  free.fly = {
    route, p0: free.pos.clone(), p1: dest,
    y0: free.tyaw, y1: free.tyaw + dyaw, a0: free.tpitch, a1: to.pitch,
    t: 0, dur: reduceMotion ? 0.01 : clamp(route.length / 7.5, 1.0, 3.6), then,
  };
}
function walkTo(point) {
  const target = constrain(new THREE.Vector3(point.x, EYE, point.z), free.pos);
  free.fly = { route: routeTo(free.pos, target), p0: free.pos.clone(), p1: target, y0: free.tyaw, y1: free.tyaw, a0: free.tpitch, a1: free.tpitch,
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
const prevPos = new THREE.Vector3();
function applyMomentum(dt) {
  if (down && down.dragging) return;
  if (Math.abs(lookVel.x) + Math.abs(lookVel.y) < 0.002) { lookVel.x = lookVel.y = 0; return; }
  addLook(lookVel.x * dt, lookVel.y * dt);
  const decay = Math.exp(-dt * 5.5);
  lookVel.x *= decay; lookVel.y *= decay;
}
function updateFree(dt) {
  prevPos.copy(free.pos);
  if (free.fly) {
    const f = free.fly; f.t += dt / f.dur;
    const tt = Math.min(1, f.t);
    const k = tt < 0.5 ? 4 * tt * tt * tt : 1 - Math.pow(-2 * tt + 2, 3) / 2;   // ease in and out
    if (f.route) free.pos.copy(f.route.getPoint(k)); else free.pos.lerpVectors(f.p0, f.p1, k);
    free.tyaw = f.y0 + (f.y1 - f.y0) * k; free.tpitch = f.a0 + (f.a1 - f.a0) * k;
    free.yaw = free.tyaw; free.pitch = free.tpitch;
    if (f.t >= 1) { free.fly = null; if (f.then) f.then(); }
  } else {
    const fwd = (keys.has('w') || keys.has('arrowup') || pad.has('fwd') ? 1 : 0) - (keys.has('s') || keys.has('arrowdown') || pad.has('back') ? 1 : 0);
    const side = (keys.has('d') ? 1 : 0) - (keys.has('a') ? 1 : 0);
    const turn = (keys.has('arrowleft') || pad.has('left') ? 1 : 0) - (keys.has('arrowright') || pad.has('right') ? 1 : 0);
    free.tyaw += turn * dt * 1.6;
    if (fwd || side) {
      const sp = 4.2 * dt;
      free.pos.x += (-Math.sin(free.yaw) * fwd + Math.cos(free.yaw) * side) * sp;
      free.pos.z += (-Math.cos(free.yaw) * fwd - Math.sin(free.yaw) * side) * sp;
    }
    applyMomentum(dt);
    const ease = 1 - Math.exp(-dt * 12);       // smooth look-around
    free.yaw += (free.tyaw - free.yaw) * ease;
    free.pitch += (free.tpitch - free.pitch) * ease;
  }
  if (!free.fly) constrain(free.pos, prevPos);
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
  // two-finger sideways swipe on a trackpad turns the view; up/down scrolling walks the tour
  if (Math.abs(e.deltaX) > Math.abs(e.deltaY) * 1.2 && hallReady && heroT >= 0.98) {
    e.preventDefault(); free.fly = null; addLook(-e.deltaX * 0.0022, 0); return;
  }
}, { passive: false });
addEventListener('wheel', (e) => {
  if (mode !== 'free' || Math.abs(e.deltaY) <= Math.abs(e.deltaX)) return;
  if (e.target.closest && e.target.closest('.drawer, .card, .wheel-wrap')) return;
  exitFree();                                    // scrolling always picks the guided tour back up
}, { passive: true });

/* On-screen walking pad (touch and mouse) */
const pad = new Set();
document.querySelectorAll('[data-pad]').forEach((b) => {
  const dir = b.dataset.pad;
  const on = (e) => { e.preventDefault(); enterFree(); free.fly = null; pad.add(dir); };
  const off = () => pad.delete(dir);
  b.addEventListener('pointerdown', on); b.addEventListener('pointerup', off);
  b.addEventListener('pointerleave', off); b.addEventListener('pointercancel', off);
});

/* Collection wheel (right) + tour / explore switch (left) */
const hallUi = $('hallUi'), wheel = $('wheel');
const modeTour = $('modeTour'), modeFree = $('modeFree'), modeSwitch = $('modeSwitch');
const wcNum = null, wcName = null, wcPrice = null;   // centre now holds the mode switch
const SVGNS = 'http://www.w3.org/2000/svg';
const thumbs = {};                       // product id -> data URL rendered from the 3D model
let wheelHover = null;

function sectorPath(a0, a1, r0, r1) {
  const p = (r, a) => `${(r * Math.sin(a)).toFixed(2)} ${(-r * Math.cos(a)).toFixed(2)}`;
  const large = a1 - a0 > Math.PI ? 1 : 0;
  return `M${p(r1, a0)} A${r1} ${r1} 0 ${large} 1 ${p(r1, a1)} L${p(r0, a1)} A${r0} ${r0} 0 ${large} 0 ${p(r0, a0)} Z`;
}
function buildDock() {                   // builds the wheel; name kept for the loaders that call it
  if (!wheel) return;
  const ids = STATIONS.filter((s) => s.id).map((s) => s.id);
  const n = ids.length, gap = 0.035, R0 = 58, R1 = 116;
  wheel.innerHTML = '';
  const defs = document.createElementNS(SVGNS, 'defs'); wheel.appendChild(defs);
  const ring = document.createElementNS(SVGNS, 'circle');
  ring.setAttribute('r', '118.5'); ring.setAttribute('class', 'wheel-rim'); wheel.appendChild(ring);
  ids.forEach((id, i) => {
    const a0 = (i / n) * Math.PI * 2 + gap / 2, a1 = ((i + 1) / n) * Math.PI * 2 - gap / 2, am = (a0 + a1) / 2;
    const d = dataFor(id);
    const clip = document.createElementNS(SVGNS, 'clipPath'); clip.id = `wclip-${id}`;
    const cp = document.createElementNS(SVGNS, 'path'); cp.setAttribute('d', sectorPath(a0, a1, R0, R1)); clip.appendChild(cp); defs.appendChild(clip);
    const g = document.createElementNS(SVGNS, 'g');
    g.setAttribute('class', 'wheel-seg'); g.setAttribute('tabindex', '0'); g.setAttribute('role', 'button');
    g.setAttribute('aria-label', `${d.name}, ${d.price}`); g.dataset.id = id;
    const tip = document.createElementNS(SVGNS, 'title'); tip.textContent = d.name; g.appendChild(tip);
    const bg = document.createElementNS(SVGNS, 'path'); bg.setAttribute('d', sectorPath(a0, a1, R0, R1)); bg.setAttribute('class', 'seg-bg'); g.appendChild(bg);
    const img = document.createElementNS(SVGNS, 'image');
    const cx = Math.sin(am) * (R0 + R1) / 2, cy = -Math.cos(am) * (R0 + R1) / 2, S = 74;
    img.setAttribute('x', (cx - S / 2).toFixed(1)); img.setAttribute('y', (cy - S / 2).toFixed(1));
    img.setAttribute('width', S); img.setAttribute('height', S);
    img.setAttribute('preserveAspectRatio', 'xMidYMid slice');
    img.setAttribute('clip-path', `url(#wclip-${id})`); img.setAttribute('class', 'seg-img');
    if (thumbs[id]) img.setAttribute('href', thumbs[id]);
    g.appendChild(img);
    const edge = document.createElementNS(SVGNS, 'path'); edge.setAttribute('d', sectorPath(a0, a1, R0, R1)); edge.setAttribute('class', 'seg-edge'); g.appendChild(edge);
    const num = document.createElementNS(SVGNS, 'text');
    num.setAttribute('x', (Math.sin(am) * (R1 - 9)).toFixed(1)); num.setAttribute('y', (-Math.cos(am) * (R1 - 9) + 2.5).toFixed(1));
    void num;
    const go = () => { goToProduct(id); };
    g.addEventListener('click', go);
    g.addEventListener('keydown', (e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); go(); } });
    g.addEventListener('pointerenter', () => { wheelHover = id; showWheelCenter(id); });
    g.addEventListener('pointerleave', () => { wheelHover = null; showWheelCenter(null); });
    g.addEventListener('focus', () => { wheelHover = id; showWheelCenter(id); });
    g.addEventListener('blur', () => { wheelHover = null; showWheelCenter(null); });
    wheel.appendChild(g);
  });
  showWheelCenter(null);
}
function showWheelCenter(id) {
  if (!wcNum) return;
  const shown = id || currentProductId();
  if (!shown) { wcNum.textContent = 'The Collection'; wcName.textContent = 'Select a piece'; wcPrice.textContent = ''; return; }
  const d = dataFor(shown);
  wcNum.textContent = `No. ${shown.slice(-2)}`; wcName.textContent = d.name; wcPrice.textContent = d.price;
}
function currentProductId() {
  return openId || (mode === 'tour' && STATIONS[Math.round(curT)] ? STATIONS[Math.round(curT)].id || null : null);
}
let lastMarked;
function markDock() {
  const id = currentProductId();
  if (id === lastMarked || !wheel) return; lastMarked = id;
  wheel.querySelectorAll('.wheel-seg').forEach((g) => g.classList.toggle('is-current', g.dataset.id === id));
  if (!wheelHover) showWheelCenter(null);
}

/* Product pictures for the wheel, rendered from the 3D hall itself */
function renderThumbs() {
  if (!renderer) return;
  const SIZE = 192;
  const rt = new THREE.WebGLRenderTarget(SIZE, SIZE, { colorSpace: THREE.SRGBColorSpace });
  const cam = new THREE.PerspectiveCamera(30, 1, 0.02, 60);
  const px = new Uint8Array(SIZE * SIZE * 4);
  const cv = document.createElement('canvas'); cv.width = cv.height = SIZE;
  const ctx = cv.getContext('2d'); const imgData = ctx.createImageData(SIZE, SIZE);
  const sunI = sun.intensity, skyI = skyFill.intensity, extVis = extRoot ? extRoot.visible : false;
  sun.intensity = 0; skyFill.intensity = 0; if (extRoot) extRoot.visible = false;
  const halos = []; products.forEach((p) => { halos.push([p.halo, p.halo.visible]); p.halo.visible = false; });
  products.forEach((p, id) => {
    const st = STATIONS.find((s) => s.id === id);
    const box = new THREE.Box3().setFromObject(p.root);
    const sphere = box.getBoundingSphere(new THREE.Sphere());
    const from = st ? new THREE.Vector3(...st.pos) : sphere.center.clone().add(new THREE.Vector3(0, 0.5, 3));
    const dir = from.clone().sub(sphere.center).setY(0.25 * from.clone().sub(sphere.center).length()).normalize();
    const dist = sphere.radius / Math.sin(THREE.MathUtils.degToRad(cam.fov / 2)) * 0.7;
    cam.position.copy(sphere.center).addScaledVector(dir, dist);
    cam.lookAt(sphere.center); cam.updateMatrixWorld();
    renderer.setRenderTarget(rt); renderer.render(scene, cam);
    renderer.readRenderTargetPixels(rt, 0, 0, SIZE, SIZE, px);
    for (let y = 0; y < SIZE; y++) imgData.data.set(px.subarray((SIZE - 1 - y) * SIZE * 4, (SIZE - y) * SIZE * 4), y * SIZE * 4);
    ctx.putImageData(imgData, 0, 0);
    thumbs[id] = cv.toDataURL('image/jpeg', 0.85);
  });
  renderer.setRenderTarget(null); rt.dispose();
  sun.intensity = sunI; skyFill.intensity = skyI; if (extRoot) extRoot.visible = extVis;
  halos.forEach(([h, v]) => { h.visible = v; });
  if (wheel) wheel.querySelectorAll('.wheel-seg').forEach((g) => {
    const im = g.querySelector('image'); if (thumbs[g.dataset.id]) im.setAttribute('href', thumbs[g.dataset.id]);
  });
}

/* Two-option switch: Guided Tour | Explore Freely */
if (modeTour) modeTour.addEventListener('click', () => { if (mode === 'free') exitFree(); });
if (modeFree) modeFree.addEventListener('click', () => {
  if (mode === 'free') return;
  if (heroT < 0.98) { pendingFree = true; goToStation(HALL0); }   // still in the square: walk in first
  else enterFree();
});
let pendingFree = false;
function syncModeUi() {
  const exploring = mode === 'free';
  if (modeSwitch) {
    modeTour.setAttribute('aria-checked', String(!exploring));
    modeFree.setAttribute('aria-checked', String(exploring));
    modeSwitch.classList.toggle('is-free', exploring);
  }
  if (exploring) {
    chapterStep.textContent = 'Free exploring';
    chapterTitle.textContent = 'The Great Hall';
    chapterHint.textContent = matchMedia('(pointer: coarse)').matches
      ? 'Drag to look around · Tap the floor to walk there'
      : 'Drag to look around · W A S D or arrows to walk · Click the floor to walk there · Scroll to continue the tour';
  } else currentStation = -1;
  lastMarked = undefined;
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
  const sizes = sizesOf(p.data);
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

/* ------------------------------ Cart (shared with every page: shop.js) ------------------------------ */
const dataFor = (id) => (products.get(id) || {}).data || PRODUCTS[id];

addBtn.addEventListener('click', () => {
  if (!openId || !chosenSize) return;
  cart.add(openId, chosenSize);
  showToast(`${dataFor(openId).name} added`);
  closeCard();
});
mountCart({
  linesEl: $('cartLines'), countEl: $('cartCount'), subtotalEl: $('subtotal'), noteEl: $('cartNote'), checkoutBtn: $('checkoutBtn'),
  emptyText: 'Nothing selected yet. Walk through the Great Hall and select a piece to add it here.',
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
document.querySelectorAll('[data-goto]').forEach((b) => b.addEventListener('click', () => {
  closeDrawers();
  if (Number(b.dataset.goto) === 0) returnToLanding(); else goToStation(Number(b.dataset.goto));
}));
/* ------------------------------ Overlays: the Collection grid and Contact ------------------------------ */
const overlays = [$('showcase'), $('contact')];
let overlayReturn = null;
function openOverlay(el) {
  closeDrawers(); closeCard();
  overlayReturn = document.activeElement;
  overlays.forEach((o) => { o.classList.toggle('is-open', o === el); o.setAttribute('aria-hidden', String(o !== el)); });
  document.documentElement.style.overflow = 'hidden';
  setTimeout(() => { const f = el.querySelector('.overlay-close'); if (f) f.focus(); }, 60);
}
function closeOverlays() {
  if (!overlays.some((o) => o.classList.contains('is-open'))) return;
  overlays.forEach((o) => { o.classList.remove('is-open'); o.setAttribute('aria-hidden', 'true'); });
  document.documentElement.style.overflow = '';
  if (overlayReturn && overlayReturn.focus) overlayReturn.focus();
}
overlays.forEach((o) => {
  o.addEventListener('click', (e) => { if (e.target === o) closeOverlays(); });
  o.querySelectorAll('[data-overlay-close]').forEach((b) => b.addEventListener('click', closeOverlays));
  // Let the panel scroll without walking the tour behind it.
  o.addEventListener('wheel', (e) => e.stopPropagation(), { passive: true });
});
$('openShowcase').addEventListener('click', () => openOverlay($('showcase')));
$('openContact').addEventListener('click', () => openOverlay($('contact')));

$('showcaseGrid').innerHTML = PRODUCT_LIST.map((p) => `
  <button class="show-tile" type="button" data-id="${p.id}">
    <span class="show-frame"><img src="${p.image}" alt="" loading="lazy" width="1000" height="1000"><span class="show-num">No. ${p.num}</span></span>
    <span class="show-meta"><span class="show-name">${p.name}</span><span class="show-price">${p.price}</span></span>
  </button>`).join('');
$('showcaseGrid').addEventListener('click', (e) => {
  const t = e.target.closest('.show-tile'); if (!t) return;
  overlayReturn = null; closeOverlays(); goToProduct(t.dataset.id);
});

$('mailLink').href = `mailto:${CONTACT.email}`; $('mailLink').textContent = CONTACT.email;
$('contactForm').addEventListener('submit', async (e) => {
  e.preventDefault();
  const f = e.target, status = $('fStatus');
  const bad = [...f.elements].find((el) => el.willValidate && !el.checkValidity());
  if (bad) { bad.focus(); status.textContent = bad.type === 'email' ? 'Please enter a valid email address.' : 'Please fill in your name, email and message.'; return; }
  const data = Object.fromEntries(new FormData(f));
  if (CONTACT.formEndpoint) {
    $('fSend').disabled = true; status.textContent = 'Sending…';
    try {
      const r = await fetch(CONTACT.formEndpoint, { method: 'POST', headers: { 'Content-Type': 'application/json', Accept: 'application/json' }, body: JSON.stringify(data) });
      if (!r.ok) throw new Error();
      f.reset(); status.textContent = 'Thank you. The concierge will reply within one working day.';
    } catch (err) { status.textContent = `That didn't send. Please email ${CONTACT.email}.`; }
    $('fSend').disabled = false;
  } else {
    const body = [`Name: ${data.name}`, `Email: ${data.email}`, data.phone && `Phone: ${data.phone}`, `Request: ${data.type}`].filter(Boolean).join('\n') + `\n\n${data.message}`;
    location.href = `mailto:${CONTACT.email}?subject=${encodeURIComponent(`${data.type} — ${data.name}`)}&body=${encodeURIComponent(body)}`;
    status.textContent = 'Your email app is opening with the request filled in.';
  }
});

/* Logo: a smooth way back to the landing view.
   From inside the hall the screen dips to the brand colour, the view resets to the square, then fades back in.
   From the square it glides back with an eased scroll. */
const veil = $('veil');
let returning = false;
function easeScrollTo(top, ms) {
  return new Promise((resolve) => {
    const from = scrollY, d = top - from, t0 = performance.now();
    const step = (now) => {
      const k = Math.min(1, (now - t0) / ms), e = k < 0.5 ? 4 * k * k * k : 1 - Math.pow(-2 * k + 2, 3) / 2;
      scrollTo(0, from + d * e);
      if (k < 1) requestAnimationFrame(step); else resolve();
    };
    requestAnimationFrame(step);
  });
}
const wait = (ms) => new Promise((r) => setTimeout(r, ms));
async function returnToLanding() {
  if (returning) return;
  returning = true;
  closeDrawers(); closeCard(); pendingOpen = null; pendingFree = false;
  if (reduceMotion || scrollY < 2) { if (mode === 'free') exitFree(); scrollTo(0, 0); returning = false; return; }
  if (mode === 'free' || targetT > HALL0 - 1) {
    veil.classList.add('is-on');
    await wait(650);
    if (mode === 'free') exitFree();
    ignoreScrollUntil = performance.now() + 400;
    scrollTo(0, Math.round(VH * 0.35));          // start a little forward, then settle back for a gentle arrival
    readScroll(); curT = targetT; tourOff.yaw = tourOff.tyaw = tourOff.pitch = tourOff.tpitch = 0;
    lookVel.x = lookVel.y = 0; blend = 1;
    await wait(80);
    veil.classList.remove('is-on');
    await easeScrollTo(0, 1600);
  } else {
    await easeScrollTo(0, Math.min(2200, 900 + scrollY / VH * 450));
  }
  returning = false;
}
document.querySelector('.brand').addEventListener('click', (e) => { e.preventDefault(); returnToLanding(); });
addEventListener('keydown', (e) => { if (e.key === 'Escape') { closeCard(); closeDrawers(); closeOverlays(); } });

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

/* Bronze doors: closed while you cross the square, they swing open as you reach the porch. */
const doors = { left: null, right: null, open: 0 };
function buildDoors(root) {
  const old = root.getObjectByName('Bronze_Doors');
  let bronze = null;
  if (old) { old.traverse((o) => { if (o.isMesh && !bronze) bronze = o.material; }); old.visible = false; }
  bronze = bronze || new THREE.MeshStandardMaterial({ color: 0x5a3a1e, metalness: 1, roughness: 0.35 });
  const gold = new THREE.MeshStandardMaterial({ color: 0xd8b048, metalness: 1, roughness: 0.22 });
  const dark = bronze.clone(); dark.color = new THREE.Color(0x3a2412);
  const W = 2.5, H = 8, T = 0.16;
  function leaf(sign) {
    const pivot = new THREE.Group();
    pivot.position.set(-sign * W, 2.0, -0.85);           // hinge at the outer edge of the doorway
    const g = new THREE.Group(); g.position.x = sign * W / 2; pivot.add(g);
    const add = (geo, mat, x, y, z) => { const m = new THREE.Mesh(geo, mat); m.position.set(x, y, z); g.add(m); return m; };
    add(new THREE.BoxGeometry(W, H, T), bronze, 0, H / 2, 0);
    [[1.6, 2.6], [4.6, 2.8], [7.1, 1.2]].forEach(([cy, ph]) => {
      [-1, 1].forEach((side) => {
        add(new THREE.BoxGeometry(W - 0.6, ph, 0.05), dark, 0, cy, side * (T / 2 + 0.02));
        const fr = new THREE.BoxGeometry(W - 0.5, 0.05, 0.04);
        add(fr, gold, 0, cy + ph / 2, side * (T / 2 + 0.04)); add(fr, gold, 0, cy - ph / 2, side * (T / 2 + 0.04));
        const fv = new THREE.BoxGeometry(0.05, ph, 0.04);
        add(fv, gold, -(W - 0.5) / 2, cy, side * (T / 2 + 0.04)); add(fv, gold, (W - 0.5) / 2, cy, side * (T / 2 + 0.04));
        const boss = new THREE.SphereGeometry(0.09, 16, 10);
        add(boss, gold, 0, cy, side * (T / 2 + 0.06));
      });
    });
    const ring = new THREE.TorusGeometry(0.16, 0.025, 8, 24);
    [-1, 1].forEach((side) => { add(ring, gold, sign * (W / 2 - 0.35), 4.2, side * (T / 2 + 0.1)); });
    scene.add(pivot);
    return pivot;
  }
  doors.left = leaf(1); doors.right = leaf(-1);
}
function updateDoors(dt) {
  if (!doors.left) return;
  // open while walking from the porch to the entrance; stay open once inside or when exploring
  const want = mode === 'free' ? 1 : smooth(HALL0 - 0.8, HALL0 - 0.25, curT);
  doors.open += (want - doors.open) * (reduceMotion ? 1 : Math.min(1, dt * 4));
  const a = doors.open * Math.PI * 0.6;
  doors.left.rotation.y = a; doors.right.rotation.y = -a;
}

/* Living details: flowing water, waving flags, drifting clouds, day light fading indoors. */
function animateWorld(dt, t) {
  updateDoors(dt);
  if (!reduceMotion) {
    animated.water.forEach((w) => { w.map.offset.x += w.speed[0] * dt; w.map.offset.y -= w.speed[1] * dt; });
    animated.flags.forEach((f) => {
      const a = f.mesh.geometry.attributes.position;
      for (let i = 0; i < a.count; i++) {
        const x = f.base[i * 3] - f.minX, y = f.base[i * 3 + 1];
        a.array[i * 3 + 2] = f.base[i * 3 + 2] + Math.sin(x * 2.2 - t * 3.4 + y * 0.6) * 0.11 * x;
        a.array[i * 3 + 1] = y - 0.03 * x * x;
      }
      a.needsUpdate = true;
    });
    if (animated.sky) animated.sky.rotation.y += dt * 0.0035;
  }
  const outside = smooth(-4, 5, camera.position.z);      // 1 in the square, 0 inside the hall
  sun.intensity = 2.4 * outside; skyFill.intensity = 0.75 * outside;
  renderer.toneMappingExposure = 0.82 + 0.1 * outside;
  if (extRoot) extRoot.visible = camera.position.z > -14;
  treeMeshes.forEach((m) => { m.visible = camera.position.z > -6; });
}

const clock = new THREE.Clock();
const look = new THREE.Vector3();
const tourQuat = new THREE.Quaternion();
const tourEuler = new THREE.Euler(0, 0, 0, 'YXZ');
function frame() {
  const rawDt = Math.min(0.25, clock.getDelta());
  const dt = Math.min(0.05, rawDt);
  const t = clock.elapsedTime;
  applyHero();
  curT += (targetT - curT) * (reduceMotion ? 1 : Math.min(1, dt * 3.2));
  if (renderer && extReady) {
    if (mode === 'free') {
      updateFree(rawDt);
    } else {
      const u = stationParam(curT) / (N - 1);
      camera.position.copy(posCurve.getPoint(u));
      look.copy(lookCurve.getPoint(u));
      if (!(down && down.dragging) && !tourOff.tyaw && !tourOff.tpitch) { look.x += mx * 0.6; look.y -= my * 0.35; }
      camera.lookAt(look);
      applyMomentum(dt);
      if (Math.abs(targetT - curT) > 0.015) {          // walking on: let the view drift back to the path
        const back = Math.exp(-dt * 2.2); tourOff.tyaw *= back; tourOff.tpitch *= back;
        if (Math.abs(tourOff.tyaw) < 1e-3) tourOff.tyaw = 0;
        if (Math.abs(tourOff.tpitch) < 1e-3) tourOff.tpitch = 0;
      }
      const ease = 1 - Math.exp(-dt * 12);
      tourOff.yaw += (tourOff.tyaw - tourOff.yaw) * ease;
      tourOff.pitch += (tourOff.tpitch - tourOff.pitch) * ease;
      if (tourOff.yaw || tourOff.pitch) {
        tourEuler.setFromQuaternion(camera.quaternion, 'YXZ');
        tourEuler.y += tourOff.yaw;
        tourEuler.x = clamp(tourEuler.x + tourOff.pitch, -1.2, 1.2);
        camera.quaternion.setFromEuler(tourEuler);
      }
      if (blend < 1) {
        blend = Math.min(1, blend + dt / 1.1);
        const k = blend * blend * (3 - 2 * blend);
        tourQuat.copy(camera.quaternion);
        camera.position.lerpVectors(snap.pos, camera.position.clone(), k);
        camera.quaternion.slerpQuaternions(snap.quat, tourQuat, k);
      }
    }
    markDock();
    animateWorld(dt, t);
    products.forEach((p, id) => {
      const target = (id === hoverId || id === openId) ? 1 : 0;
      p.hover += (target - p.hover) * Math.min(1, dt * 6);
      const pulse = reduceMotion ? 0.5 : 0.5 + 0.5 * Math.sin(t * 1.6 + p.center.z);
      p.halo.material.opacity = 0.22 + 0.22 * pulse + 0.4 * p.hover;
      const s = p.halo.userData.base * (1 + 0.05 * pulse + 0.08 * p.hover);
      p.halo.scale.set(s, s, 1);
    });
    renderer.render(scene, camera);
    if (targetT > 0.45 && mode === 'tour') updateChapter();
    if (pendingOpen && Math.abs(curT - pendingOpen.station) < 0.04) { openCard(pendingOpen.id); pendingOpen = null; }
    if (openId && !pendingOpen && mode === 'tour') {
      const here = STATIONS[Math.round(targetT)];
      if (!here || here.id !== openId) closeCard();       // scrolled on, or back out to the square
    }
    if (pendingFree && Math.abs(curT - HALL0) < 0.04) { pendingFree = false; enterFree(); }
  }
  requestAnimationFrame(frame);
}
requestAnimationFrame(frame);

// Small hook for testing and for wiring a store later.
/* Deep link from the Collection / product pages: index.html#product_03 walks straight to that piece. */
(function deepLink() {
  const m = /^#(product_\d\d)$/.exec(location.hash);
  if (!m) return;
  const go = () => { if (extReady && hallReady) { history.replaceState(null, '', location.pathname); goToProduct(m[1]); } else setTimeout(go, 300); };
  go();
})();

window.palais = { openCard, closeCard, goToStation, goToProduct, enterFree, exitFree, products, camera, get ready() { return extReady && hallReady; } };
