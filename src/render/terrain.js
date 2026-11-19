// Dựng địa hình lục giác thành MỘT mesh duy nhất (1 draw call), flat shading, màu theo đỉnh.
// Chỉ đọc map từ src/sim/terrain.js.

import * as THREE from 'three';
import { CONFIG } from '../config.js';
import { key, neighbor, hexToWorld } from '../sim/hex.js';

const V = CONFIG.terrainView;
const APOTHEM = (Math.sqrt(3) / 2) * V.hexSize;

const COLORS = {
  grass: [0xc9d86a, 0xa9cf63, 0x86bd5b, 0x6aa653, 0x56914b], // theo bậc 0..4: thấp vàng hơn, cao xanh đậm hơn
  dirt: 0xd8b98a,
  rock: 0xa8a29a,
  templeGround: 0xe6dcc8,
  water: 0x8fd3e0,
  islandSide: 0xb89a74,  // thành đảo phía dưới mặt nước
};
const WALL_SHADE = 0.78;   // vách tối hơn mặt trên
const RAMP_SHADE = 0.94;

function topColor(tile) {
  if (tile.type === 'grass') return COLORS.grass[Math.min(tile.h, COLORS.grass.length - 1)];
  return COLORS[tile.type];
}

// Toạ độ góc k của ô (góc 60k − 30°), trong mặt phẳng (x, z).
function corner(cx, cz, k) {
  const a = (Math.PI / 180) * (60 * k - 30);
  return [cx + V.hexSize * Math.cos(a), cz + V.hexSize * Math.sin(a)];
}

export function levelY(h) {
  return h === 0 ? V.waterY : (h - 1) * V.levelHeight;
}

// Độ cao mặt trên của ô tại điểm (x, z) nằm trên ô (dốc thì nghiêng tuyến tính).
export function topYAt(tile, x, z) {
  if (!tile) return V.bottomY;
  const base = levelY(tile.h);
  if (tile.ramp === null || tile.type === 'water') return base;
  const [cx, cz] = hexToWorld(tile.q, tile.r, V.hexSize);
  const a = (Math.PI / 3) * tile.ramp;
  const proj = (x - cx) * Math.cos(a) + (z - cz) * Math.sin(a);
  const t = (proj / APOTHEM + 1) / 2;
  return base + t * V.levelHeight;
}

export function buildTerrainMesh(map) {
  const pos = [];
  const col = [];
  const c = new THREE.Color();
  const v0 = new THREE.Vector3();
  const v1 = new THREE.Vector3();
  const v2 = new THREE.Vector3();
  const nrm = new THREE.Vector3();

  // Thêm tam giác, tự sửa chiều quấn để pháp tuyến cùng phía `want`.
  function tri(a, b, cc, color, want) {
    v0.set(...a); v1.set(...b); v2.set(...cc);
    nrm.subVectors(v1, v0).cross(v2.clone().sub(v0));
    if (nrm.lengthSq() < 1e-12) return;
    const ordered = nrm.dot(want) >= 0 ? [a, b, cc] : [a, cc, b];
    for (const p of ordered) {
      pos.push(p[0], p[1], p[2]);
      col.push(color.r, color.g, color.b);
    }
  }

  const up = new THREE.Vector3(0, 1, 0);
  const out = new THREE.Vector3();

  for (const tile of Object.values(map.tiles)) {
    const [cx, cz] = hexToWorld(tile.q, tile.r, V.hexSize);
    const corners = Array.from({ length: 6 }, (_, k) => corner(cx, cz, k));
    const heights = corners.map(([x, z]) => topYAt(tile, x, z));
    const centerY = topYAt(tile, cx, cz);

    // Mặt trên: quạt 6 tam giác
    c.setHex(topColor(tile));
    if (tile.ramp !== null) c.multiplyScalar(RAMP_SHADE);
    for (let k = 0; k < 6; k++) {
      const k2 = (k + 1) % 6;
      tri([cx, centerY, cz], [corners[k][0], heights[k], corners[k][1]],
        [corners[k2][0], heights[k2], corners[k2][1]], c, up);
    }

    // Vách: cạnh d nằm giữa góc d và góc d+1, hướng ra phía ô kề d.
    for (let d = 0; d < 6; d++) {
      const k1 = d;
      const k2 = (d + 1) % 6;
      const nb = map.tiles[key(...neighbor(tile.q, tile.r, d))];
      const [x1, z1] = corners[k1];
      const [x2, z2] = corners[k2];
      const a1 = heights[k1];
      const a2 = heights[k2];
      const b1 = Math.min(a1, nb ? topYAt(nb, x1, z1) : V.bottomY);
      const b2 = Math.min(a2, nb ? topYAt(nb, x2, z2) : V.bottomY);
      if (a1 - b1 < 1e-4 && a2 - b2 < 1e-4) continue;

      const ang = (Math.PI / 3) * d;
      out.set(Math.cos(ang), 0, Math.sin(ang));
      // Vách giáp nước hoặc rìa bản đồ là thành đảo (màu đất); vách giữa hai bậc là màu mặt trên tối đi
      const outer = !nb || nb.type === 'water';
      c.setHex(outer ? COLORS.islandSide : topColor(tile)).multiplyScalar(WALL_SHADE);
      tri([x1, a1, z1], [x2, a2, z2], [x2, b2, z2], c, out);
      tri([x1, a1, z1], [x2, b2, z2], [x1, b1, z1], c, out);
    }
  }

  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
  geo.setAttribute('color', new THREE.Float32BufferAttribute(col, 3));
  geo.computeVertexNormals(); // không có index → mỗi tam giác pháp tuyến phẳng
  geo.computeBoundingSphere();

  const mat = new THREE.MeshLambertMaterial({ vertexColors: true });
  const mesh = new THREE.Mesh(geo, mat);
  mesh.receiveShadow = true;
  mesh.castShadow = true;
  mesh.name = 'terrain';
  return mesh;
}
