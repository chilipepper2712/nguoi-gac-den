// Khởi động: tạo state, tạo view, chạy vòng lặp khung hình.

import { createState } from './sim/state.js';
import { tickClock } from './sim/clock.js';
import { tickPeople, tickPlayer, commandMove, playerOf } from './sim/people.js';
import { createTapInput } from './ui/input.js';
import { createHud } from './ui/hud.js';
import { createWorldUi } from './ui/worldui.js';
import { tickTasks, commandClean, debrisWorld } from './sim/temple.js';
import { worldToHex, hexToWorld } from './sim/hex.js';
import { levelY } from './render/terrain.js';
import { CONFIG } from './config.js';
import { createView } from './render/view.js';
import { createDevPanel } from './ui/devpanel.js';
import { openTalisman } from './ui/talisman.js';
import * as THREE from 'three';

const params = new URLSearchParams(location.search);
const seed = Number(params.get('seed')) || 1;
const debug = params.get('debug') === '1';

const state = createState({ seed });
// Tham số URL để xem nhanh: ?t=0.9 (giờ trong ngày), ?temple=1 (đền đã sửa), ?pause=1
if (params.has('t')) state.clock.t = Number(params.get('t'));
if (params.has('temple') && Number(params.get('temple')) > 0.5) {
  state.temple.condition = 1;
  for (const d of state.temple.debris) d.done = true;
  state.temple.zonesDone = state.temple.zonesDone.map(() => true);
  state.stats.power = CONFIG.aura.fullPower;
}
if (params.get('pause') === '1') state.clock.paused = true;

const view = createView(document.getElementById('stage'), state);
const status = document.getElementById('status');
// ?dist=20 đặt khoảng cách camera ban đầu (chụp cận cảnh)
if (params.has('dist')) {
  const { camera, controls } = view;
  camera.position.sub(controls.target).setLength(Number(params.get('dist'))).add(controls.target);
  controls.update();
}
// ?look=q,r cho camera nhìn vào một ô (chụp kiểm tra)
if (params.has('look')) {
  const [lq, lr] = params.get('look').split(',').map(Number);
  const S = 1;
  const x = S * Math.sqrt(3) * (lq + lr / 2);
  const z = S * 1.5 * lr;
  const { camera, controls } = view;
  const off = camera.position.clone().sub(controls.target);
  controls.target.set(x, controls.target.y, z);
  camera.position.copy(controls.target).add(off);
  controls.update();
}
// ?az=độ xoay camera quanh điểm nhìn (0 = nhìn từ phía +z)
if (params.has('az')) {
  const { camera, controls } = view;
  const off = camera.position.clone().sub(controls.target);
  const sph = new THREE.Spherical().setFromVector3(off);
  sph.theta = (Number(params.get('az')) * Math.PI) / 180;
  camera.position.copy(controls.target).add(new THREE.Vector3().setFromSpherical(sph));
  controls.update();
}
const panel = params.get('panel') === '0' ? null : createDevPanel(state);

const hud = createHud(state);
const worldUi = createWorldUi(state, view);
if (!debug) document.getElementById('hud').hidden = true;

// Chạm trên bản đồ: trúng đồ đổ nát chưa dọn (theo khoảng cách trên màn hình) → đi tới dọn; không thì đi tới ô đó
function pickDebris(sx, sy) {
  const r = view.renderer.domElement.getBoundingClientRect();
  let best = null;
  for (const d of state.temple.debris) {
    if (d.done) continue;
    const [x, z] = debrisWorld(d);
    const v = new THREE.Vector3(x, levelY(CONFIG.terrain.templeLevel) + 0.1, z).project(view.camera);
    const dist = Math.hypot(((v.x + 1) / 2) * r.width - sx, ((1 - v.y) / 2) * r.height - sy);
    if (dist < CONFIG.input.pickRadius && (!best || dist < best.dist)) best = { d, dist };
  }
  return best && best.d;
}
createTapInput(view, ({ point, screen }) => {
  const player = playerOf(state);
  const d = pickDebris(screen.x, screen.y);
  if (d) {
    if (commandClean(state, player.id, d.id)) {
      const [x, z] = debrisWorld(d);
      view.showMarker(x, levelY(CONFIG.terrain.templeLevel), z);
    }
    return;
  }
  if (!point) return;
  player.task = null; // đi chỗ khác thì bỏ việc đang làm
  const [q, r] = worldToHex(point.x, point.z, CONFIG.terrainView.hexSize);
  const dest = commandMove(state, player.id, q, r);
  if (!dest) return;
  const [x, z] = hexToWorld(dest[0], dest[1], CONFIG.terrainView.hexSize);
  view.showMarker(x, levelY(state.map.tiles[`${dest[0]},${dest[1]}`].h), z);
});
// ?trace=1|3 mở ngay màn vẽ bùa; &glyph=song,nui ép hình (để chụp kiểm tra); &power=0..2
if (params.has('trace')) {
  openTalisman({
    count: Number(params.get('trace')) || 1,
    power: Number(params.get('power') ?? 2),
    glyphs: params.get('glyph') ? params.get('glyph').split(',') : null,
    time: params.has('time') ? Number(params.get('time')) : undefined,
  });
}

// Cảnh thử asset (không phải gameplay)
let labReady = Promise.resolve();
if (params.get('lab') === 'props') {
  labReady = import('./render/lab-props.js').then((m) => m.setupPropsLab(view, state, params));
}

let last = performance.now();
let frames = 0;
let fpsFrames = 0;
let fpsTime = 0;

function frame(now) {
  const dt = Math.min((now - last) / 1000, 0.1);
  last = now;
  // Đang mở màn phủ (vẽ bùa): không mô phỏng, không vẽ cảnh 3D
  if (document.body.dataset.overlay && frames > 3) { last = now; requestAnimationFrame(frame); return; }
  tickClock(state, dt);
  // Di chuyển nội suy mỗi khung (rẻ); tìm đường chỉ khi một người chọn điểm đến mới
  if (!state.clock.paused || params.get('walk') === '1') tickPeople(state, dt * (state.clock.paused ? 1 : state.clock.speed));
  if (!state.clock.paused || params.get('walk') === '1') { tickPlayer(state, dt); tickTasks(state, dt); }
  view.render(state, dt);
  if (panel) panel.update();
  hud.update();
  worldUi.update(dt);
  frames += 1;
  // tools/shot.mjs chờ cờ này trước khi chụp màn hình
  if (frames === 3) Promise.all([labReady, view.ready]).then(() => { window.__ready = true; });

  if (debug) {
    fpsFrames += 1;
    fpsTime += dt;
    if (fpsTime >= 0.5) {
      const info = view.renderer.info.render;
      status.textContent = `seed ${seed} · ${Math.round(fpsFrames / fpsTime)} fps · ${info.calls} draw calls · ${(info.triangles / 1000).toFixed(1)}k tam giác`;
      fpsFrames = 0;
      fpsTime = 0;
    }
  }
  requestAnimationFrame(frame);
}
requestAnimationFrame(frame);

// Để debug trong console
window.__game = { state, view };
