// Giao diện gắn vào thế giới 3D: thanh tiến độ trên đầu nhân vật, chữ bay lên (+pháp lực), thông báo giữa màn hình.
// Đọc state.events rồi xoá.

import * as THREE from 'three';
import { CONFIG } from '../config.js';
import { playerOf } from '../sim/people.js';
import { worldToHex } from '../sim/hex.js';
import { levelY } from '../render/terrain.js';

const ZONE_NAMES = ['khu sân trước bên trái', 'khu sân trước bên phải', 'khu phía sau đền'];

export function createWorldUi(state, view) {
  const layer = document.createElement('div');
  layer.id = 'world-ui';
  document.body.appendChild(layer);
  const bar = document.createElement('div');
  bar.className = 'work-bar';
  bar.innerHTML = '<div></div>';
  layer.appendChild(bar);
  const floats = [];
  const v = new THREE.Vector3();

  const toScreen = (x, y, z) => {
    v.set(x, y, z).project(view.camera);
    const r = view.renderer.domElement.getBoundingClientRect();
    return [r.left + ((v.x + 1) / 2) * r.width, r.top + ((1 - v.y) / 2) * r.height, v.z < 1];
  };
  const groundY = (x, z) => {
    const t = state.map.tiles[worldToHex(x, z, CONFIG.terrainView.hexSize).join(',')];
    return t ? levelY(t.h) : 0;
  };

  function floatText(text, x, y, z, cls = '') {
    const el = document.createElement('div');
    el.className = `float-text ${cls}`;
    el.textContent = text;
    layer.appendChild(el);
    floats.push({ el, x, y, z, age: 0 });
  }

  function toast(text) {
    const el = document.createElement('div');
    el.className = 'toast';
    el.textContent = text;
    layer.appendChild(el);
    setTimeout(() => el.classList.add('out'), 2200);
    setTimeout(() => el.remove(), 2800);
  }

  return {
    update(dt) {
      // Sự kiện mới
      for (const e of state.events.splice(0)) {
        if (e.type === 'cleaned') floatText(`+${e.power} pháp lực`, e.x, groundY(e.x, e.z) + 0.4, e.z);
        if (e.type === 'donation') floatText(`+${e.amount}`, e.x, groundY(e.x, e.z) + 0.45, e.z, 'money');
        if (e.type === 'zoneDone') toast(`Đã dọn sạch ${ZONE_NAMES[e.zone]}! +${e.power} pháp lực, +${e.prestige} uy tín`);
      }
      // Thanh tiến độ trên đầu nhân vật chính khi đang làm việc
      const p = playerOf(state);
      const task = p && p.task;
      if (task && task.active) {
        const d = state.temple.debris.find((x) => x.id === task.id);
        const pos = view.positionOf(p);
        const [sx, sy, vis] = toScreen(pos.x, pos.y + CONFIG.people.height * 1.6, pos.z);
        bar.style.display = vis ? 'block' : 'none';
        bar.style.transform = `translate(${sx - 24}px, ${sy - 8}px)`;
        bar.firstChild.style.width = `${Math.min(100, (task.progress / d.work) * 100)}%`;
      } else bar.style.display = 'none';
      // Chữ bay lên rồi mờ
      for (let i = floats.length - 1; i >= 0; i--) {
        const f = floats[i];
        f.age += dt;
        const [sx, sy, vis] = toScreen(f.x, f.y + f.age * 0.35, f.z);
        f.el.style.transform = `translate(${sx}px, ${sy}px) translate(-50%, -50%)`;
        f.el.style.opacity = String(Math.max(0, 1 - f.age / 1.4));
        f.el.style.display = vis ? 'block' : 'none';
        if (f.age > 1.4) { f.el.remove(); floats.splice(i, 1); }
      }
    },
  };
}
