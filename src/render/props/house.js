// Nhà dân dựng bằng code, cùng ngôn ngữ với đền: nền thấp, tường vôi, cột gỗ, mái cong nhẹ.
// level 0: mái rơm (dân mới đến, nghèo) · level 1: mái ngói · level 2: mái ngói + hiên + chum nước.
// Trả về MỘT geometry (màu theo đỉnh, vật liệu một mặt) để dựng InstancedMesh theo (variant, level).

import * as THREE from 'three';
import { seeded, colored, limb, blob, merge } from './geo.js';
import { curvedRoof } from './temple.js';

const C = {
  base: 0xcfc3aa,
  wall: [0xe8dcc2, 0xefe6d2],
  post: 0x8a6a55,
  door: 0x5a4038,
  window: 0x6b4f45,
  thatch: [0xcfae6a, 0xb8954f],
  tile: [0xb5654a, 0x8e4a37],
  jar: 0x9b6a50,
};

// variant 0: nhà nhỏ vuông · 1: nhà dài có hiên · 2: nhà chữ L thấp
export function buildHouseGeometry({ variant = 0, level = 1, seed = 1 } = {}) {
  const rnd = seeded(seed * 31 + variant * 7 + level);
  const parts = [];
  const V = (x, y, z) => new THREE.Vector3(x, y, z);
  const dims = [[0.85, 0.65], [1.3, 0.7], [1.0, 0.8]][variant % 3];
  const [w, d] = dims;
  const wallH = 0.42;
  const y0 = 0.08;

  parts.push(colored(new THREE.BoxGeometry(w + 0.16, y0, d + 0.2).translate(0, y0 / 2, 0.02), C.base));
  parts.push(colored(new THREE.BoxGeometry(w, wallH, d).translate(0, y0 + wallH / 2, 0), level === 0 ? C.wall[0] : C.wall[1]));
  // Cửa và cửa sổ (mặt trước +z)
  parts.push(colored(new THREE.BoxGeometry(0.2, 0.3, 0.02).translate(variant === 1 ? -0.25 : 0, y0 + 0.15, d / 2 + 0.005), C.door));
  const wins = variant === 1 ? [0.15, 0.45] : [-0.3, 0.3].filter((x) => Math.abs(x) < w / 2 - 0.1);
  for (const x of wins) {
    if (variant !== 1 && x === 0) continue;
    parts.push(colored(new THREE.BoxGeometry(0.16, 0.12, 0.02).translate(x, y0 + 0.25, d / 2 + 0.005), C.window));
  }
  // Cột góc
  for (const sx of [-1, 1]) for (const sz of [-1, 1]) {
    parts.push(colored(new THREE.BoxGeometry(0.05, wallH, 0.05).translate(sx * w / 2, y0 + wallH / 2, sz * d / 2), C.post));
  }

  // Hiên trước (nhà dài, hoặc mọi nhà ở level 2)
  const porch = variant === 1 || level >= 2;
  if (porch) {
    for (const x of [-w / 2 + 0.06, w / 2 - 0.06]) {
      parts.push(colored(limb(V(x, y0, d / 2 + 0.22), V(x, y0 + wallH, d / 2 + 0.22), 0.025, 0.022, 5), C.post));
    }
  }

  // Mái: rơm (dày, dốc, không cong) hoặc ngói (cong nhẹ)
  const roofD = d + (porch ? 0.5 : 0.25);
  const roofZ = porch ? 0.12 : 0;
  const thatched = level === 0;
  const roof = curvedRoof({
    w: w + 0.3, d: roofD, h: thatched ? 0.42 : 0.34, ridge: w * 0.55,
    lift: thatched ? 0 : 0.07, sag: thatched ? 0 : 0.03,
    color: thatched ? C.thatch[0] : C.tile[0], edgeColor: thatched ? C.thatch[1] : C.tile[1],
    rnd, underside: true,
  });
  roof.translate(0, y0 + wallH, roofZ);
  roof.deleteAttribute('normal'); // gộp được với các phần chỉ có position + color
  parts.push(roof);

  // Chum nước cạnh nhà (level 2)
  if (level >= 2) {
    parts.push(colored(blob(0.08, 0, rnd, { sy: 1.1, jitter: 0.1 }).translate(w / 2 + 0.15, 0.09, d / 2 + 0.05), C.jar));
  }
  // Nhà chữ L: thêm chái nhỏ bên hông
  if (variant === 2) {
    parts.push(colored(new THREE.BoxGeometry(0.4, 0.32, 0.45).translate(-w / 2 - 0.18, y0 + 0.16, -0.1), C.wall[1]));
    const side = curvedRoof({ w: 0.55, d: 0.6, h: 0.22, ridge: 0.2, lift: thatched ? 0 : 0.04, color: thatched ? C.thatch[0] : C.tile[0], edgeColor: thatched ? C.thatch[1] : C.tile[1], rnd, underside: true });
    side.translate(-w / 2 - 0.18, y0 + 0.32, -0.1);
    side.deleteAttribute('normal');
    parts.push(side);
  }
  return merge(parts);
}
