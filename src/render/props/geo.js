// Tiện ích dựng hình low-poly bằng code: tô màu theo đỉnh, nối khối, gộp.

import * as THREE from 'three';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';

// RNG cục bộ cho phần hình (không dùng cho luật chơi).
export function seeded(seed) {
  let s = seed >>> 0 || 1;
  return () => {
    s = (s + 0x6d2b79f5) >>> 0;
    let t = Math.imul(s ^ (s >>> 15), s | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

// Bỏ index, gắn một màu cho cả khối, chỉ giữ position + color (để gộp được với nhau).
export function colored(geo, hex) {
  const g = geo.index ? geo.toNonIndexed() : geo;
  for (const name of Object.keys(g.attributes)) if (name !== 'position') g.deleteAttribute(name);
  const c = new THREE.Color(hex);
  const n = g.attributes.position.count;
  const col = new Float32Array(n * 3);
  for (let i = 0; i < n; i++) col.set([c.r, c.g, c.b], i * 3);
  g.setAttribute('color', new THREE.BufferAttribute(col, 3));
  return g;
}

// Trụ nối hai điểm a → b, bán kính r0 ở a, r1 ở b.
export function limb(a, b, r0, r1, segments = 6) {
  const dir = new THREE.Vector3().subVectors(b, a);
  const len = dir.length();
  const geo = new THREE.CylinderGeometry(r1, r0, len, segments, 1);
  geo.translate(0, len / 2, 0);
  geo.applyQuaternion(new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 1, 0), dir.normalize()));
  geo.translate(a.x, a.y, a.z);
  return geo;
}

// Đa diện xô lệch đỉnh (giữ kín mặt: cùng một đỉnh thì lệch cùng một lượng).
export function blob(radius, detail, rnd, { sx = 1, sy = 1, sz = 1, jitter = 0.25, shape = 'ico' } = {}) {
  const geo = shape === 'dodeca' ? new THREE.DodecahedronGeometry(radius, detail) : new THREE.IcosahedronGeometry(radius, detail);
  const p = geo.attributes.position;
  const seen = new Map();
  for (let i = 0; i < p.count; i++) {
    const k = `${p.getX(i).toFixed(3)},${p.getY(i).toFixed(3)},${p.getZ(i).toFixed(3)}`;
    if (!seen.has(k)) seen.set(k, 1 - jitter / 2 + rnd() * jitter);
    const s = seen.get(k);
    p.setXYZ(i, p.getX(i) * s * sx, p.getY(i) * s * sy, p.getZ(i) * s * sz);
  }
  return geo;
}

// Gộp các khối đã tô màu thành một geometry flat-shaded.
export function merge(parts) {
  const geo = mergeGeometries(parts);
  geo.computeVertexNormals();
  geo.computeBoundingSphere();
  return geo;
}
