// Chạm / bấm trên bản đồ: phân biệt chạm (ra lệnh) với kéo, xoay, zoom (điều khiển camera).
// Chạm = nhấc tay nhanh, gần như không di chuyển, chỉ một ngón. Trả về điểm trúng trên địa hình.

import * as THREE from 'three';
import { CONFIG } from '../config.js';

export function createTapInput(view, onTap) {
  const el = view.renderer.domElement;
  const ray = new THREE.Raycaster();
  const ndc = new THREE.Vector2();
  const downs = new Map();
  let multi = false;

  el.addEventListener('pointerdown', (e) => {
    downs.set(e.pointerId, { x: e.clientX, y: e.clientY, t: performance.now() });
    if (downs.size > 1) multi = true;
  });
  const up = (e) => {
    const d = downs.get(e.pointerId);
    downs.delete(e.pointerId);
    if (!d) return;
    const wasMulti = multi;
    if (downs.size === 0) multi = false;
    if (wasMulti || e.type === 'pointercancel') return;
    const moved = Math.hypot(e.clientX - d.x, e.clientY - d.y);
    if (moved > CONFIG.input.tapMaxMove || performance.now() - d.t > CONFIG.input.tapMaxMs) return;
    const r = el.getBoundingClientRect();
    ndc.set(((e.clientX - r.left) / r.width) * 2 - 1, -((e.clientY - r.top) / r.height) * 2 + 1);
    ray.setFromCamera(ndc, view.camera);
    const hit = ray.intersectObject(view.terrain, false)[0];
    onTap({ point: hit ? hit.point : null, screen: { x: e.clientX - r.left, y: e.clientY - r.top } });
  };
  el.addEventListener('pointerup', up);
  el.addEventListener('pointercancel', up);
}
