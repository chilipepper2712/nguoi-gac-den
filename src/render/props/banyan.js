// Cây đa cổ thụ dựng bằng code: thân xoắn, rễ bạnh, cành, tán từ các khối đa diện, rễ phụ thõng xuống.
// Gộp thành một geometry (1 draw call), màu theo đỉnh, flat shading.

import * as THREE from 'three';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';

const PALETTE = {
  leaf: [0xa9c27e, 0x98b56f, 0xb8cd8c],
  bark: [0x9b7f74, 0xa88c80, 0x8c7268],
};

function seeded(seed) {
  let s = seed >>> 0 || 1;
  return () => {
    s = (s + 0x6d2b79f5) >>> 0;
    let t = Math.imul(s ^ (s >>> 15), s | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

// Chuẩn hoá một geometry: bỏ index, gắn màu đồng nhất, chỉ giữ position + color.
function finish(geo, hex) {
  const g = geo.index ? geo.toNonIndexed() : geo;
  for (const name of Object.keys(g.attributes)) if (name !== 'position') g.deleteAttribute(name);
  const c = new THREE.Color(hex);
  const n = g.attributes.position.count;
  const col = new Float32Array(n * 3);
  for (let i = 0; i < n; i++) col.set([c.r, c.g, c.b], i * 3);
  g.setAttribute('color', new THREE.BufferAttribute(col, 3));
  return g;
}

// Khối trụ nối hai điểm a → b.
function limb(a, b, r0, r1, segments = 6) {
  const dir = new THREE.Vector3().subVectors(b, a);
  const len = dir.length();
  const geo = new THREE.CylinderGeometry(r1, r0, len, segments, 1);
  geo.translate(0, len / 2, 0);
  geo.applyQuaternion(new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 1, 0), dir.normalize()));
  geo.translate(a.x, a.y, a.z);
  return geo;
}

// Cụm lá: đa diện bị bóp dẹt và xô lệch đỉnh cho hữu cơ.
function clump(center, radius, rnd) {
  const geo = new THREE.IcosahedronGeometry(radius, 1);
  const p = geo.attributes.position;
  const seen = new Map();
  for (let i = 0; i < p.count; i++) {
    const k = `${p.getX(i).toFixed(3)},${p.getY(i).toFixed(3)},${p.getZ(i).toFixed(3)}`;
    if (!seen.has(k)) seen.set(k, 0.85 + rnd() * 0.3);
    const s = seen.get(k);
    p.setXYZ(i, p.getX(i) * s, p.getY(i) * s * 0.62, p.getZ(i) * s);
  }
  geo.translate(center.x, center.y, center.z);
  return geo;
}

export function buildBanyan({ height = 2.6, seed = 7 } = {}) {
  const rnd = seeded(seed);
  const pick = (arr) => arr[Math.floor(rnd() * arr.length)];
  const parts = [];
  const H = height;
  const V = (x, y, z) => new THREE.Vector3(x * H, y * H, z * H);

  // Thân: ba nhánh thân quấn nhau
  for (let i = 0; i < 3; i++) {
    const a = (i / 3) * Math.PI * 2;
    const base = V(Math.cos(a) * 0.08, 0, Math.sin(a) * 0.08);
    const mid = V(Math.cos(a + 1.2) * 0.07, 0.3, Math.sin(a + 1.2) * 0.07);
    const top = V(Math.cos(a + 2.4) * 0.05, 0.55, Math.sin(a + 2.4) * 0.05);
    parts.push(finish(limb(base, mid, 0.09 * H, 0.07 * H), pick(PALETTE.bark)));
    parts.push(finish(limb(mid, top, 0.07 * H, 0.05 * H), pick(PALETTE.bark)));
  }

  // Rễ bạnh quanh gốc
  for (let i = 0; i < 6; i++) {
    const a = (i / 6) * Math.PI * 2 + rnd() * 0.4;
    const r = 0.22 + rnd() * 0.08;
    parts.push(finish(limb(V(0, 0.1, 0), V(Math.cos(a) * r, -0.01, Math.sin(a) * r), 0.06 * H, 0.012 * H, 5), pick(PALETTE.bark)));
  }

  // Cành và tán
  const tips = [];
  const branches = 5;
  for (let i = 0; i < branches; i++) {
    const a = (i / branches) * Math.PI * 2 + rnd() * 0.5;
    const reach = 0.28 + rnd() * 0.12;
    const tip = V(Math.cos(a) * reach, 0.62 + rnd() * 0.1, Math.sin(a) * reach);
    parts.push(finish(limb(V(0, 0.5, 0), tip, 0.04 * H, 0.018 * H, 5), pick(PALETTE.bark)));
    tips.push(tip);
  }
  for (const tip of tips) {
    parts.push(finish(clump(tip.clone().add(V(0, 0.08, 0)), (0.17 + rnd() * 0.06) * H, rnd), pick(PALETTE.leaf)));
  }
  parts.push(finish(clump(V(0, 0.84, 0), 0.24 * H, rnd), pick(PALETTE.leaf)));
  parts.push(finish(clump(V(0.1, 0.78, -0.12), 0.18 * H, rnd), pick(PALETTE.leaf)));

  // Rễ phụ thõng xuống từ dưới tán
  for (let i = 0; i < 6; i++) {
    const tip = tips[i % tips.length];
    const t = 0.55 + rnd() * 0.35;
    const x = tip.x * t;
    const z = tip.z * t;
    const bottom = (0.05 + rnd() * 0.25) * H;
    parts.push(finish(limb(new THREE.Vector3(x, bottom, z), new THREE.Vector3(x, tip.y - 0.02 * H, z), 0.012 * H, 0.016 * H, 4), pick(PALETTE.bark)));
  }

  const geo = mergeGeometries(parts);
  geo.computeVertexNormals();
  const mesh = new THREE.Mesh(geo, new THREE.MeshLambertMaterial({ vertexColors: true }));
  mesh.castShadow = true;
  mesh.receiveShadow = true;
  mesh.name = 'banyan-code';
  return mesh;
}
