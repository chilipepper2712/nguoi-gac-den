// Nhà khối kiểu Godus: hộp vuông tường kem, mái ngói đất nung thấp (hoặc mái bằng có gờ, hoặc mái rơm),
// cửa sổ nhỏ tối, cửa gỗ, nền đá mỏng. Kiểu ghép: 'square' (1 khối vuông), 'rect' (2 khối liền = chữ nhật),
// 'stagger' (2 khối vuông ghép so le, cao thấp khác nhau).
// Đơn vị: người cao CONFIG.people.height (~0.26); mặt tiền +z. Trả về một geometry màu theo đỉnh.

import * as THREE from 'three';
import { seeded, colored, merge } from './geo.js';

export const BLOCK = 0.5;      // cạnh khối vuông
export const FLOOR_H = 0.36;   // chiều cao một tầng

const C = {
  base: 0xcfc3aa,
  window: 0x4a3a35,
  door: 0x6b4536,
  tile: [0xc0694a, 0xa8573d],   // ngói: mặt, viền
  flat: [0xe2dccf, 0xcfc8ba],   // mái bằng: mặt, gờ
  thatch: [0xcfae6a, 0xb8954f],
};

// Mái hông thấp phủ hộp w×d (w ≥ d), chìa ra `over`. Nóc chạy theo trục x; hộp vuông thì nóc co thành chóp.
function hipRoof(w, d, h, over, color, edge) {
  const ex = w / 2 + over;
  const ez = d / 2 + over;
  const r = Math.max(0, (w - d) / 2) * 0.9;
  const V = (x, y, z) => new THREE.Vector3(x, y, z);
  const A = V(-ex, 0, ez); const B = V(ex, 0, ez); const Cc = V(ex, 0, -ez); const D = V(-ex, 0, -ez);
  const R1 = V(-r, h, 0); const R2 = V(r, h, 0);
  const tris = [[A, B, R2], [A, R2, R1], [Cc, D, R1], [Cc, R1, R2], [B, Cc, R2], [D, A, R1]];
  const pos = [];
  const n = new THREE.Vector3();
  for (const [p, q, t] of tris) {
    n.subVectors(q, p).cross(new THREE.Vector3().subVectors(t, p));
    if (n.lengthSq() < 1e-10) continue; // tam giác suy biến khi nóc là chóp
    for (const v of n.y >= 0 ? [p, q, t] : [p, t, q]) pos.push(v.x, v.y, v.z);
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
  return [colored(g, color), colored(new THREE.BoxGeometry(ex * 2, 0.035, ez * 2).translate(0, -0.012, 0), edge)];
}

function windows(parts, w, d, x0, z0, y0, floors, skipFront) {
  for (let f = 0; f < floors; f++) {
    const y = y0 + f * FLOOR_H + FLOOR_H * 0.52;
    if (!(skipFront && f === 0)) parts.push(colored(new THREE.BoxGeometry(0.1, 0.1, 0.012).translate(x0, y, z0 + d / 2 + 0.004), C.window));
    for (const sx of [-1, 1]) parts.push(colored(new THREE.BoxGeometry(0.012, 0.1, 0.1).translate(x0 + sx * (w / 2 + 0.004), y, z0), C.window));
    parts.push(colored(new THREE.BoxGeometry(0.1, 0.1, 0.012).translate(x0, y, z0 - d / 2 - 0.004), C.window));
  }
}

// opts: { shape, floors: [f0, f1], roof: 'hip'|'flat'|'thatch', wall: hex, seed }
// Trả về { geometry, door: [x, z], lamp: [x, y, z] } — toạ độ cục bộ
export function buildBlockHouse({ shape = 'square', floors = [1, 1], roof = 'hip', wall = 0xf2ebdd, seed = 1 } = {}) {
  const rnd = seeded(seed);
  const parts = [];
  const blocks = shape === 'rect'
    ? [{ x: 0, z: 0, w: BLOCK * 1.9, d: BLOCK, f: floors[0] }]
    : shape === 'stagger'
      ? [{ x: -BLOCK * 0.32, z: BLOCK * 0.22, w: BLOCK, d: BLOCK, f: floors[0] }, { x: BLOCK * 0.36, z: -BLOCK * 0.3, w: BLOCK * 0.9, d: BLOCK * 0.9, f: floors[1] }]
      : [{ x: 0, z: 0, w: BLOCK, d: BLOCK, f: floors[0] }];

  const plinth = 0.03;
  blocks.forEach((b, i) => {
    const h = b.f * FLOOR_H;
    parts.push(colored(new THREE.BoxGeometry(b.w + 0.06, plinth, b.d + 0.06).translate(b.x, plinth / 2, b.z), C.base));
    // tường hơi lệch tông theo khối cho đỡ phẳng
    const wc = new THREE.Color(wall).multiplyScalar(i === 0 ? 1 : 0.95 + rnd() * 0.04).getHex();
    parts.push(colored(new THREE.BoxGeometry(b.w, h, b.d).translate(b.x, plinth + h / 2, b.z), wc));
    windows(parts, b.w, b.d, b.x, b.z, plinth, b.f, i === 0);
    const top = plinth + h;
    if (roof === 'flat') {
      parts.push(colored(new THREE.BoxGeometry(b.w + 0.05, 0.05, b.d + 0.05).translate(b.x, top + 0.025, b.z), C.flat[1]));
      parts.push(colored(new THREE.BoxGeometry(b.w - 0.04, 0.012, b.d - 0.04).translate(b.x, top + 0.052, b.z), C.flat[0]));
    } else {
      const [col, edge] = roof === 'thatch' ? C.thatch : C.tile;
      const rh = roof === 'thatch' ? 0.26 : 0.16;
      for (const g of hipRoof(b.w, b.d, rh, 0.06, col, edge)) parts.push(g.translate(b.x, top + 0.02, b.z));
    }
  });

  // Cửa ở khối đầu, mặt trước
  const b0 = blocks[0];
  const doorX = b0.x + (shape === 'rect' ? -BLOCK * 0.45 : 0);
  parts.push(colored(new THREE.BoxGeometry(0.13, 0.22, 0.015).translate(doorX, plinth + 0.11, b0.z + b0.d / 2 + 0.006), C.door));
  return {
    geometry: merge(parts),
    door: [doorX, b0.z + b0.d / 2],
    lamp: [doorX + 0.12, plinth + 0.27, b0.z + b0.d / 2 + 0.03],
  };
}
