// Lớp hiển thị Three.js: renderer, camera, ánh sáng, cảnh. Chỉ ĐỌC game state để vẽ, không sửa luật chơi.

import * as THREE from 'three';
import { MapControls } from 'three/addons/controls/MapControls.js';
import { CONFIG } from '../config.js';
import { hexToWorld, key, worldToHex } from '../sim/hex.js';
import { buildTerrainMesh, levelY } from './terrain.js';
import { buildFlora, buildRuinDebris } from './flora.js';
import { buildVillage } from './village.js';
import { buildStairs } from './stairs.js';
import { buildTemple, buildGate } from './props/temple.js';
import { buildGhost } from './ghost.js';
import { createLamps } from './lamps.js';
import { createSky } from './sky.js';
import { applyFakeLight, fakeLightUniforms } from './fakelight.js';

export function createView(container, state) {
  const renderer = new THREE.WebGLRenderer({ antialias: true, powerPreference: 'high-performance' });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, CONFIG.view.maxPixelRatio));
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  container.appendChild(renderer.domElement);

  const scene = new THREE.Scene();
  const S = CONFIG.terrainView.hexSize;
  const centerY = levelY(CONFIG.terrain.templeLevel);

  // Camera + điều khiển
  const camera = new THREE.PerspectiveCamera(CONFIG.camera.fov, 1, 0.5, 500);
  const c = CONFIG.camera;
  camera.position.setFromSphericalCoords(c.distance, c.polarAngle, c.azimuth);
  camera.position.y += centerY;
  const controls = new MapControls(camera, renderer.domElement);
  Object.assign(controls, {
    enableDamping: true, dampingFactor: 0.1, screenSpacePanning: false,
    minDistance: c.minDistance, maxDistance: c.maxDistance, minPolarAngle: c.minPolarAngle, maxPolarAngle: c.maxPolarAngle,
  });
  controls.target.set(0, centerY, 0);
  controls.update();

  // Ánh sáng: môi trường + một đèn mặt trời/trăng đổ bóng
  const hemi = new THREE.HemisphereLight(0xffffff, 0xb9c7a0, 1.5);
  scene.add(hemi);
  const mapExtent = CONFIG.terrain.radius * S * 1.8;
  const sun = new THREE.DirectionalLight(0xfff4e0, 2.0);
  sun.castShadow = true;
  sun.shadow.mapSize.set(2048, 2048);
  Object.assign(sun.shadow.camera, { left: -mapExtent, right: mapExtent, top: mapExtent, bottom: -mapExtent, near: 1, far: mapExtent * 4 });
  sun.shadow.bias = -0.0008;
  sun.shadow.normalBias = 0.02;
  scene.add(sun);
  const sky = createSky(scene, { sun, hemi }, mapExtent);

  // Cảnh tĩnh
  const terrain = buildTerrainMesh(state.map);
  const flora = buildFlora(state.map);
  const stairs = buildStairs(state.map);
  scene.add(terrain, flora.object, stairs);
  applyFakeLight(terrain, { aura: true });
  applyFakeLight(stairs);

  // Đồ đổ nát quanh đền: chỉ hiện khi đền còn hoang
  const templeFrame = new THREE.Object3D();
  templeFrame.position.set(0, centerY, 0);
  templeFrame.rotation.y = CONFIG.temple.rotation;
  let debris = null;
  const debrisReady = buildRuinDebris(templeFrame).then((mesh) => {
    debris = mesh;
    scene.add(mesh);
  }).catch((e) => console.warn('Thiếu đồ đổ nát', e));

  // Đền + cổng: dựng lại khi trạng thái đổi
  const lamps = createLamps('temple');
  scene.add(lamps.object);
  const village = buildVillage(state.map);
  scene.add(village.object);
  let templeGroup = null;
  let builtCondition = -1;
  function rebuildTemple(condition) {
    if (templeGroup) scene.remove(templeGroup);
    templeGroup = new THREE.Group();
    templeGroup.name = 'temple-site';
    const rot = CONFIG.temple.rotation;
    const temple = buildTemple({ condition });
    temple.position.set(0, centerY, 0);
    temple.rotation.y = rot;
    const [gq, gr] = CONFIG.temple.gateHex;
    const [gx, gz] = hexToWorld(gq, gr, S);
    const gate = buildGate({ condition });
    gate.position.set(gx, levelY(state.map.tiles[key(gq, gr)].h), gz);
    gate.rotation.y = rot;
    templeGroup.add(temple, gate);
    applyFakeLight(templeGroup);
    scene.add(templeGroup);
    templeGroup.updateMatrixWorld(true);
    const spots = [];
    for (const g of [temple, gate]) for (const p of g.userData.lampSpots) spots.push(g.localToWorld(p.clone()));
    lamps.set(spots);
    builtCondition = condition;
  }

  // Ma: lượn ngay ngoài mép vùng pháp lực. Vùng nhỏ thì ma kéo sát đền, vùng nở ra thì ma bị đẩy lùi.
  const ghosts = [];
  const GHOST_ANGLES = [0.4, 2.3, 4.2];
  for (const [i, ang] of GHOST_ANGLES.entries()) {
    const g = buildGhost({ phase: i * 2.3 });
    g.angle = ang;
    g.extra = 1.0 + i * 0.35;
    scene.add(g.object);
    ghosts.push(g);
  }
  const ghostHome = new THREE.Vector3();
  function groundY(x, z) {
    const [q, r] = worldToHex(x, z, S);
    const t = state.map.tiles[key(q, r)];
    return t ? levelY(t.h) : CONFIG.terrainView.waterY;
  }
  let auraNow = -1;

  fakeLightUniforms.uAuraCenter.value.set(0, centerY, 0);

  function resize() {
    const w = container.clientWidth || window.innerWidth;
    const h = container.clientHeight || window.innerHeight;
    renderer.setSize(w, h, false);
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
  }
  window.addEventListener('resize', resize);
  resize();

  const view = {
    renderer, scene, camera, controls, lights: { hemi, sun }, render, resize, onFrame: null, night: 0,
    ready: Promise.all([flora.ready, debrisReady, village.ready]),
  };

  function render(st, dt) {
    const cond = st.temple.condition;
    if (cond !== builtCondition) rebuildTemple(cond);
    if (debris) debris.visible = cond < 0.5;
    const s = sky.update(st.clock.t);
    view.night = s.night;
    const auraTarget = THREE.MathUtils.lerp(CONFIG.aura.minRadius, CONFIG.aura.maxRadius, cond);
    auraNow = auraNow < 0 ? auraTarget : THREE.MathUtils.damp(auraNow, auraTarget, 2, dt);
    fakeLightUniforms.uAuraRadius.value = auraNow;
    lamps.update(s.night);
    village.update(s.night);
    for (const g of ghosts) {
      g.angle += dt * 0.05;
      const r = auraNow + g.extra;
      const x = Math.cos(g.angle) * r;
      const z = Math.sin(g.angle) * r;
      g.place(ghostHome.set(x, groundY(x, z), z), 0.45);
      g.update(dt, s.night);
    }
    controls.update();
    if (view.onFrame) view.onFrame(dt);
    renderer.render(scene, camera);
  }

  return view;
}
