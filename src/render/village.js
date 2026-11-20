// Vẽ khu dân cư: nhà mái bằng (lắp từ khối Kenney Modular, sơn mỗi nhà một màu) xen nhà mái ngói (dựng bằng code),
// sân trước có lối đá, hàng rào, chậu cây, rau; biển hiệu; đèn hiên; đường đi bộ và đèn đường.
// Mọi thứ tĩnh gộp thành MỘT mesh (1 draw call); chữ biển hiệu là một mesh dùng chung texture; đèn là 2 nhóm.

import * as THREE from 'three';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';
import { CONFIG } from '../config.js';
import { hexToWorld, key, neighbor, distance } from '../sim/hex.js';
import { canStep } from '../sim/terrain.js';
import { levelY } from './terrain.js';
import { loadGeometry } from './models.js';
import { buildHouseGeometry } from './props/house.js';
import { colored, limb } from './props/geo.js';
import { withFakeLight } from './fakelight.js';
import { createLamps } from './lamps.js';

const V = CONFIG.village;
const S = CONFIG.terrainView.hexSize;
const CELL_H = 0.63; // chiều cao một tầng Modular
const PATH_COLOR = 0xd9c9a6;
const POST_COLOR = 0x5d5650;
const BOARD_COLOR = 0x6b4f45;
const up = new THREE.Vector3(0, 1, 0);

// Bản sao chỉ còn position + color (để gộp), sơn lại các màu khoá
function prep(geo, repaint) {
  // Dựng lại thuộc tính dạng Float32 thuần (thuộc tính từ GLTFLoader có thể khác kiểu → mergeGeometries từ chối)
  const src = geo.index ? geo.toNonIndexed() : geo;
  // Đọc qua getX/Y/Z: GLB xuất từ gltf-transform có thuộc tính xếp xen kẽ (interleaved), .array là cả bộ đệm chung
  const g = new THREE.BufferGeometry();
  const p = src.attributes.position;
  const c = src.attributes.color;
  const n = p.count;
  const P = new Float32Array(n * 3);
  const C = new Float32Array(n * 3).fill(1);
  for (let i = 0; i < n; i++) {
    P[i * 3] = p.getX(i); P[i * 3 + 1] = p.getY(i); P[i * 3 + 2] = p.getZ(i);
    if (c) { C[i * 3] = c.getX(i); C[i * 3 + 1] = c.getY(i); C[i * 3 + 2] = c.getZ(i); }
  }
  g.setAttribute('position', new THREE.BufferAttribute(P, 3));
  g.setAttribute('color', new THREE.BufferAttribute(C, 3));
  if (repaint) {
    const col = g.attributes.color;
    for (let i = 0; i < col.count; i++) {
      for (const [from, to] of repaint) {
        if (Math.abs(col.getX(i) - from.r) < 0.01 && Math.abs(col.getY(i) - from.g) < 0.01 && Math.abs(col.getZ(i) - from.b) < 0.01) {
          col.setXYZ(i, to.r, to.g, to.b);
          break;
        }
      }
    }
  }
  return g;
}

function signAtlas(texts) {
  const c = document.createElement('canvas');
  c.width = 256;
  c.height = 64 * texts.length;
  const g = c.getContext('2d');
  texts.forEach((t, i) => {
    g.fillStyle = ['#f4efe4', '#f2d98a', '#bcd9e0', '#f0c4b8'][i % 4];
    g.fillRect(0, i * 64, 256, 64);
    g.strokeStyle = '#6b4f45';
    g.lineWidth = 6;
    g.strokeRect(3, i * 64 + 3, 250, 58);
    g.fillStyle = '#7a2e22';
    g.font = 'bold 34px system-ui, sans-serif';
    g.textAlign = 'center';
    g.textBaseline = 'middle';
    g.fillText(t, 128, i * 64 + 34, 236);
  });
  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

export function buildVillage(map) {
  const group = new THREE.Group();
  group.name = 'village';
  const houseLamps = createLamps('houses', { shape: 'bulb', glowSize: 0.7, dayColor: new THREE.Color(0xd8d0c0) });
  const streetLamps = createLamps('street', { shape: 'bulb', glowSize: 1.3, dayColor: new THREE.Color(0xd8d0c0) });
  group.add(houseLamps.object, streetLamps.object);

  const M = CONFIG.villageModels;
  const all = [...M.cells, ...M.roof, ...M.extras, ...M.garden];
  const ready = Promise.all(all.map((p) => loadGeometry(p).then((g) => [p, g]))).then((pairs) => {
    const G = Object.fromEntries(pairs);
    const parts = [];
    const signQuads = [];
    const houseLampPts = [];
    const streetLampPts = [];
    const v = map.village;
    const wallKey = new THREE.Color(CONFIG.colorKeys.wall);
    const accentKey = new THREE.Color(CONFIG.colorKeys.accent);
    const m = new THREE.Matrix4();
    const tmp = new THREE.Matrix4();
    const q = new THREE.Quaternion();

    for (const h of v.houses) {
      const tile = map.tiles[key(h.q, h.r)];
      const [cx, cz] = hexToWorld(h.q, h.r, S);
      const y = levelY(tile.h);
      const theta = Math.PI / 2 - (h.facing * Math.PI) / 3; // mặt tiền (+z cục bộ) quay về hướng facing
      const base = new THREE.Matrix4().compose(new THREE.Vector3(cx, y, cz), q.setFromAxisAngle(up, theta), new THREE.Vector3(1, 1, 1));
      const world = (lx, ly, lz) => new THREE.Vector3(lx, ly, lz).applyMatrix4(base);
      // Đặt một geometry theo toạ độ cục bộ của ô nhà
      const put = (geo, lx, ly, lz, rot = 0, sx = 1, sy = sx, sz = sx, repaint) => {
        tmp.compose(new THREE.Vector3(lx, ly, lz), new THREE.Quaternion().setFromAxisAngle(up, rot), new THREE.Vector3(sx, sy, sz));
        m.multiplyMatrices(base, tmp);
        parts.push(prep(geo, repaint).applyMatrix4(m));
      };
      const zHouse = -V.setback;
      let doorX = 0;
      let frontZ;

      if (h.style === 'flat') {
        const s = V.flatScale;
        const xs = h.wide ? [-0.5, 0.5] : [0];
        const repaint = [[wallKey, new THREE.Color(V.paints[h.paint])], [accentKey, new THREE.Color(V.accents[h.accent])]];
        const shop = h.sign !== null;
        doorX = xs[0] * s;
        for (let f = 0; f < h.floors; f++) {
          xs.forEach((x, i) => {
            let piece;
            if (f === 0) piece = i === 0 ? 'modular/building-door' : shop ? 'modular/building-window-awnings' : 'modular/building-window';
            else piece = (h.paint + i) % 2 ? 'modular/building-window-balcony' : 'modular/building-windows';
            put(G[piece], x * s, f * CELL_H * s, zHouse, 0, s, s, s, repaint);
          });
        }
        put(G['modular/door-brown'], doorX, 0, zHouse + 0.47 * s, 0, s);
        put(G['modular/roof-flat-top'], 0, h.floors * CELL_H * s, zHouse, 0, s * xs.length * 0.95, s, s, repaint);
        if (h.paint % 2 === 0) put(G['modular/detail-ac-a'], 0.22 * s, h.floors * CELL_H * s + 0.02, zHouse - 0.25 * s, 0, s * 1.2);
        frontZ = zHouse + 0.5 * s;
        houseLampPts.push(world(doorX + 0.2 * s, 0.48 * s, frontZ + 0.04));
      } else {
        const ts = V.tileScale;
        const geo = buildHouseGeometry({ variant: h.variant, level: h.level, seed: h.q * 31 + h.r });
        put(geo, 0, 0, zHouse, 0, ts);
        doorX = (h.variant === 1 ? -0.25 : 0) * ts;
        frontZ = zHouse + [0.325, 0.35, 0.4][h.variant] * ts;
        houseLampPts.push(world(doorX + 0.17 * ts, 0.42 * ts, frontZ + 0.03));
      }

      // Sân trước: lối đá, hàng rào thấp, chậu cây, hoa, rau
      const pathS = 0.3;
      for (const z of [frontZ + 0.14, frontZ + 0.36, 0.66]) put(G['nature/path_stone'], doorX, 0, z, Math.PI / 2, pathS);
      for (const x of [-0.5, -0.24, 0.24, 0.5]) {
        if (Math.abs(x - doorX) < 0.2) continue;
        put(G['nature/fence_simpleLow'], x, 0, 0.68, 0, 0.26);
      }
      put(G['nature/pot_small'], doorX - 0.2, 0, frontZ + 0.08, 0, 0.6);
      const side = doorX > 0 ? -1 : 1;
      if ((h.q + h.r) % 2 === 0) {
        for (const [dx, dz] of [[0, 0], [0.16, 0], [0, 0.16], [0.16, 0.16]]) put(G['nature/crops_leafsStageB'], side * (0.3 + dx), 0, frontZ + 0.12 + dz, 0, 0.35);
      } else {
        for (const [dx, dz, f] of [[0, 0.1, 'nature/flower_redA'], [0.14, 0.2, 'nature/flower_yellowA'], [0.26, 0.08, 'nature/flower_purpleA'], [0.08, 0.32, 'nature/plant_flatShort']]) {
          put(G[f], side * (0.28 + dx), 0, frontZ + dz, 0, 0.7);
        }
      }

      // Biển hiệu ở góc sân
      if (h.sign !== null) {
        const sx = -side * 0.42;
        for (const dx of [-0.17, 0.17]) parts.push(prep(colored(limb(world(sx + dx, 0, 0.5), world(sx + dx, 0.42, 0.5), 0.015, 0.015, 4), POST_COLOR)));
        put(colored(new THREE.BoxGeometry(0.42, 0.15, 0.03), BOARD_COLOR), sx, 0.34, 0.5);
        signQuads.push({ m: new THREE.Matrix4().multiplyMatrices(base, new THREE.Matrix4().makeTranslation(sx, 0.34, 0.517)), index: h.sign });
      }
    }

    // Đường đi bộ: dải đất nén từ tâm ô ra mép, nối các ô đường với nhau và với sân đền
    const roadSet = new Set(v.roads.map((r) => key(r.q, r.r)));
    const court = (t) => distance(t.q, t.r, 0, 0) <= CONFIG.flora.clearRadius;
    const pathCol = new THREE.Color(PATH_COLOR);
    const strip = (tile, d, width = 0.3) => {
      const [cx, cz] = hexToWorld(tile.q, tile.r, S);
      const a = (Math.PI / 3) * d;
      const ex = cx + Math.cos(a) * S * 0.866;
      const ez = cz + Math.sin(a) * S * 0.866;
      const px = (-Math.sin(a) * width) / 2;
      const pz = (Math.cos(a) * width) / 2;
      const yy = levelY(tile.h) + 0.012;
      const A = new THREE.Vector3(cx + px, yy, cz + pz);
      const B = new THREE.Vector3(ex + px, yy, ez + pz);
      const C = new THREE.Vector3(ex - px, yy, ez - pz);
      const D = new THREE.Vector3(cx - px, yy, cz - pz);
      const upward = new THREE.Vector3().subVectors(B, A).cross(new THREE.Vector3().subVectors(C, A)).y > 0;
      const tris = upward ? [A, B, C, A, C, D] : [A, C, B, A, D, C];
      const g = new THREE.BufferGeometry().setFromPoints(tris);
      g.setAttribute('color', new THREE.Float32BufferAttribute(tris.flatMap(() => [pathCol.r, pathCol.g, pathCol.b]), 3));
      parts.push(prep(g));
    };
    const houseSet = new Set(v.houses.map((h) => key(h.q, h.r)));
    for (const r of v.roads) {
      const tile = map.tiles[key(r.q, r.r)];
      if (tile.ramp !== null) continue;
      let toCourt = false;
      for (let d = 0; d < 6; d++) {
        const [nq, nr] = neighbor(r.q, r.r, d);
        const n = map.tiles[key(nq, nr)];
        if (!n || !canStep(tile, n, d)) continue;
        const kn = key(nq, nr);
        const linkHouse = houseSet.has(kn) && v.houses.some((h) => h.q === nq && h.r === nr && neighbor(nq, nr, h.facing).join() === [r.q, r.r].join());
        if (roadSet.has(kn) || linkHouse || (!court(tile) && court(n) && !toCourt)) {
          strip(tile, d);
          if (court(n) && !roadSet.has(kn)) toCourt = true;
        }
      }
      // Tâm ô: đĩa nhỏ cho chỗ nối mượt
      const [cx, cz] = hexToWorld(r.q, r.r, S);
      parts.push(prep(colored(new THREE.CircleGeometry(0.17, 6).rotateX(-Math.PI / 2).translate(cx, levelY(tile.h) + 0.013, cz), PATH_COLOR)));
    }
    // Lối từ cổng vào bậc đền
    const [gq, gr] = CONFIG.temple.gateHex;
    const gate = map.tiles[key(gq, gr)];
    for (let d = 0; d < 6; d++) {
      const [nq, nr] = neighbor(gq, gr, d);
      if (distance(nq, nr, 0, 0) < distance(gq, gr, 0, 0) && distance(nq, nr, 0, 0) === 1 && nq === 0) strip(gate, d, 0.36);
    }
    {
      const [x1, z1] = hexToWorld(0, 1, S);
      const t1 = map.tiles[key(0, 1)];
      for (let d = 0; d < 6; d++) {
        const [nq, nr] = neighbor(0, 1, d);
        if (nq === gq && nr === gr) strip(t1, d, 0.36);
      }
      parts.push(prep(colored(new THREE.CircleGeometry(0.2, 6).rotateX(-Math.PI / 2).translate(x1, levelY(t1.h) + 0.013, z1), PATH_COLOR)));
    }

    // Đèn đường: cột ở mép ô, phía không có đường
    for (const l of v.lamps) {
      const tile = map.tiles[key(l.q, l.r)];
      const [cx, cz] = hexToWorld(l.q, l.r, S);
      let side = 0;
      for (let d = 0; d < 6; d++) { const [nq, nr] = neighbor(l.q, l.r, d); if (!roadSet.has(key(nq, nr))) { side = d; break; } }
      const a = (Math.PI / 3) * side + 0.5;
      const x = cx + Math.cos(a) * 0.45;
      const z = cz + Math.sin(a) * 0.45;
      const y0 = levelY(tile.h);
      parts.push(prep(colored(limb(new THREE.Vector3(x, y0, z), new THREE.Vector3(x, y0 + 0.78, z), 0.022, 0.016, 5), POST_COLOR)));
      const hx = x - Math.cos(a) * 0.12;
      const hz = z - Math.sin(a) * 0.12;
      parts.push(prep(colored(limb(new THREE.Vector3(x, y0 + 0.76, z), new THREE.Vector3(hx, y0 + 0.8, hz), 0.012, 0.012, 4), POST_COLOR)));
      parts.push(prep(colored(new THREE.ConeGeometry(0.06, 0.05, 6).translate(hx, y0 + 0.81, hz), POST_COLOR)));
      streetLampPts.push(new THREE.Vector3(hx, y0 + 0.77, hz));
    }

    const geo = mergeGeometries(parts);
    geo.computeVertexNormals();
    const mesh = new THREE.Mesh(geo, withFakeLight(new THREE.MeshLambertMaterial({ vertexColors: true })));
    mesh.name = 'village-static';
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    group.add(mesh);

    // Chữ biển hiệu: mọi tấm một mesh, một texture
    if (signQuads.length) {
      const pos = [];
      const uv = [];
      const n = V.signs.length;
      for (const { m: sm, index } of signQuads) {
        const w = 0.19;
        const hh = 0.065;
        const v0 = 1 - (index + 1) / n;
        const v1 = 1 - index / n;
        const corners = [[-w, -hh, 0, v0], [w, -hh, 1, v0], [w, hh, 1, v1], [-w, hh, 0, v1]].map(([x, yy, u, vv]) => [new THREE.Vector3(x, yy, 0).applyMatrix4(sm), u, vv]);
        for (const i of [0, 1, 2, 0, 2, 3]) { const [p, u, vv] = corners[i]; pos.push(p.x, p.y, p.z); uv.push(u, vv); }
      }
      const g = new THREE.BufferGeometry();
      g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
      g.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2));
      g.computeVertexNormals();
      const signs = new THREE.Mesh(g, withFakeLight(new THREE.MeshLambertMaterial({ map: signAtlas(V.signs) })));
      signs.name = 'village-signs';
      group.add(signs);
    }

    houseLamps.set(houseLampPts.map((p) => ({ x: p.x, y: p.y, z: p.z, radius: 0.75, strength: 0.6 })));
    streetLamps.set(streetLampPts.map((p) => ({ x: p.x, y: p.y, z: p.z, radius: 1.2, strength: 0.75 })));
  });

  return {
    object: group,
    ready,
    update(night) {
      houseLamps.update(night);
      streetLamps.update(night);
    },
  };
}
