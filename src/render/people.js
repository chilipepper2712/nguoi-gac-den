// Người khối chibi dựng bằng code: đầu to, thân ngắn, mắt chấm, má hồng.
// Mỗi kiểu tóc/mũ một InstancedMesh; màu da/tóc/áo/quần truyền theo từng người (thuộc tính instance);
// tay chân vung khi đi tính trong shader → vài trăm người vẫn vài draw call.
// Chỉ đọc state.people để vẽ.

import * as THREE from 'three';
import { CONFIG } from '../config.js';
import { hexToWorld, key } from '../sim/hex.js';
import { topYAt, levelY } from './terrain.js';
import { withFakeLight } from './fakelight.js';
import { isNight } from '../sim/clock.js';

const P = CONFIG.people;
const S = CONFIG.terrainView.hexSize;
// Ô màu (slot): 0 da · 1 tóc · 2 áo · 3 quần · 4 mắt · 5 giày · 6 má hồng · 7 nón lá · 8 cà vạt
// Phần (part): 0 tĩnh · 1 chân trái · 2 chân phải · 3 tay trái · 4 tay phải
const HIP = 0.26;
const SHOULDER = 0.56;

function box(parts, w, h, d, x, y, z, slot, part = 0) {
  const g = new THREE.BoxGeometry(w, h, d).toNonIndexed();
  g.translate(x, y + h / 2, z);
  parts.push({ g, slot, part });
}

// Hình người đơn vị (cao ~1.0), mặt quay +z
function personGeometry(hair, { tie = false } = {}) {
  const parts = [];
  // chân + giày
  for (const [sx, part] of [[-1, 1], [1, 2]]) {
    box(parts, 0.15, 0.06, 0.19, sx * 0.1, 0, 0.01, 5, part);
    box(parts, 0.15, 0.2, 0.17, sx * 0.1, 0.06, 0, 3, part);
  }
  // thân
  box(parts, 0.42, 0.32, 0.26, 0, HIP, 0, 2);
  if (tie) box(parts, 0.06, 0.22, 0.02, 0, HIP + 0.07, 0.135, 8);
  // tay + bàn tay
  for (const [sx, part] of [[-1, 3], [1, 4]]) {
    box(parts, 0.1, 0.22, 0.12, sx * 0.26, SHOULDER - 0.22, 0, 2, part);
    box(parts, 0.09, 0.06, 0.1, sx * 0.26, SHOULDER - 0.28, 0, 0, part);
  }
  // đầu, mắt, má
  box(parts, 0.46, 0.42, 0.42, 0, 0.58, 0, 0);
  for (const sx of [-1, 1]) {
    box(parts, 0.06, 0.08, 0.02, sx * 0.1, 0.76, 0.21, 4);
    box(parts, 0.07, 0.03, 0.015, sx * 0.17, 0.7, 0.21, 6);
  }
  // tóc / mũ
  switch (hair) {
    case 0: // tóc ngắn
      box(parts, 0.5, 0.1, 0.46, 0, 0.96, -0.01, 1);
      box(parts, 0.5, 0.24, 0.08, 0, 0.74, -0.2, 1);
      box(parts, 0.5, 0.06, 0.1, 0, 0.9, 0.18, 1);
      break;
    case 1: // tóc dài
      box(parts, 0.5, 0.1, 0.46, 0, 0.96, -0.01, 1);
      box(parts, 0.52, 0.42, 0.1, 0, 0.56, -0.2, 1);
      for (const sx of [-1, 1]) box(parts, 0.06, 0.3, 0.3, sx * 0.25, 0.64, -0.04, 1);
      break;
    case 2: // búi tóc
      box(parts, 0.5, 0.1, 0.46, 0, 0.96, -0.01, 1);
      box(parts, 0.5, 0.24, 0.08, 0, 0.74, -0.2, 1);
      box(parts, 0.18, 0.16, 0.18, 0, 1.0, -0.16, 1);
      break;
    case 3: // tóc thưa (người già)
      box(parts, 0.48, 0.04, 0.4, 0, 0.99, -0.03, 1);
      box(parts, 0.5, 0.14, 0.06, 0, 0.8, -0.2, 1);
      break;
    case 4: { // nón lá
      const cone = new THREE.ConeGeometry(0.44, 0.24, 10).toNonIndexed();
      cone.translate(0, 1.1, 0);
      parts.push({ g: cone, slot: 7, part: 0 });
      box(parts, 0.5, 0.2, 0.08, 0, 0.74, -0.2, 1);
      break;
    }
    default: // mũ lưỡi trai
      box(parts, 0.5, 0.12, 0.46, 0, 0.96, -0.01, 2);
      box(parts, 0.4, 0.03, 0.18, 0, 0.96, 0.28, 2);
      box(parts, 0.5, 0.2, 0.08, 0, 0.76, -0.2, 1);
  }

  const pos = [];
  const slot = [];
  const part = [];
  for (const { g, slot: s, part: pt } of parts) {
    const a = g.attributes.position;
    for (let i = 0; i < a.count; i++) {
      pos.push(a.getX(i), a.getY(i), a.getZ(i));
      slot.push(s);
      part.push(pt);
    }
  }
  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
  geo.setAttribute('aSlot', new THREE.Float32BufferAttribute(slot, 1));
  geo.setAttribute('aPart', new THREE.Float32BufferAttribute(part, 1));
  geo.computeVertexNormals();
  return geo;
}

const VERT_DECL = `
attribute float aSlot;
attribute float aPart;
attribute vec3 iSkin;
attribute vec3 iHair;
attribute vec3 iShirt;
attribute vec3 iPants;
attribute vec2 iAnim;
uniform float uTime;
varying vec3 vSlotColor;
`;
const VERT_BODY = `
  float cyc = uTime * 9.0 + iAnim.x;
  float sw = sin(cyc) * 0.75 * iAnim.y;
  if (aPart > 0.5) {
    float pivotY = aPart < 2.5 ? ${HIP.toFixed(2)} : ${SHOULDER.toFixed(2)};
    float ang = (aPart < 1.5 || aPart > 3.5) ? sw : -sw;
    float yy = transformed.y - pivotY;
    float zz = transformed.z;
    transformed.y = pivotY + yy * cos(ang) - zz * sin(ang);
    transformed.z = yy * sin(ang) + zz * cos(ang);
  }
  transformed.y += abs(sin(cyc)) * 0.05 * iAnim.y;
  vec3 c = vec3(1.0);
  if (aSlot < 0.5) c = iSkin;
  else if (aSlot < 1.5) c = iHair;
  else if (aSlot < 2.5) c = iShirt;
  else if (aSlot < 3.5) c = iPants;
  else if (aSlot < 4.5) c = vec3(0.024, 0.023, 0.032);
  else if (aSlot < 5.5) c = vec3(0.066, 0.05, 0.045);
  else if (aSlot < 6.5) c = vec3(0.9, 0.38, 0.45);
  else if (aSlot < 7.5) c = vec3(0.8, 0.66, 0.32);
  else c = vec3(0.6, 0.06, 0.05);
  vSlotColor = c;
`;

const timeUniform = { value: 0 };

function personMaterial() {
  const mat = new THREE.MeshLambertMaterial({ color: 0xffffff });
  withFakeLight(mat);
  const fake = mat.onBeforeCompile;
  mat.onBeforeCompile = (shader, renderer) => {
    shader.uniforms.uTime = timeUniform;
    shader.vertexShader = VERT_DECL + shader.vertexShader.replace('#include <begin_vertex>', `#include <begin_vertex>\n${VERT_BODY}`);
    shader.fragmentShader = 'varying vec3 vSlotColor;\n' + shader.fragmentShader.replace('#include <color_fragment>', '#include <color_fragment>\n  diffuseColor.rgb *= vSlotColor;');
    fake(shader, renderer);
  };
  mat.customProgramCacheKey = () => 'person-fakelight';
  return mat;
}

const lin = (hex) => new THREE.Color(hex);

export function createPeopleView(state) {
  const group = new THREE.Group();
  group.name = 'people';
  const material = personMaterial();
  const H = P.height;

  // Gom người theo kiểu tóc; nhân vật chính riêng một mesh (có cà vạt)
  const buckets = new Map();
  for (const p of state.people) {
    const k = p.kind === 'player' ? 'player' : `h${p.look.hair}`;
    if (!buckets.has(k)) buckets.set(k, []);
    buckets.get(k).push(p);
  }
  const meshes = [];
  for (const [k, list] of buckets) {
    const geo = k === 'player' ? personGeometry(list[0].look.hair, { tie: true }) : personGeometry(list[0].look.hair);
    const n = list.length;
    const attr = (size) => new THREE.InstancedBufferAttribute(new Float32Array(n * size), size);
    const iSkin = attr(3); const iHair = attr(3); const iShirt = attr(3); const iPants = attr(3); const iAnim = attr(2);
    list.forEach((p, i) => {
      const L = p.look;
      for (const [a, hex] of [[iSkin, P.skins[L.skin]], [iHair, P.hairColors[L.hairColor]], [iShirt, P.shirts[L.shirt]], [iPants, P.pants[L.pants]]]) {
        const c = lin(hex);
        a.setXYZ(i, c.r, c.g, c.b);
      }
      iAnim.setXY(i, (p.id * 2.39) % 6.28, 0);
    });
    geo.setAttribute('iSkin', iSkin);
    geo.setAttribute('iHair', iHair);
    geo.setAttribute('iShirt', iShirt);
    geo.setAttribute('iPants', iPants);
    geo.setAttribute('iAnim', iAnim);
    const mesh = new THREE.InstancedMesh(geo, material, n);
    mesh.name = `people-${k}`;
    mesh.castShadow = true;
    mesh.frustumCulled = false;
    group.add(mesh);
    meshes.push({ mesh, list, iAnim });
  }

  const m = new THREE.Matrix4();
  const q = new THREE.Quaternion();
  const up = new THREE.Vector3(0, 1, 0);
  const pos = new THREE.Vector3();
  const scl = new THREE.Vector3();
  const zero = new THREE.Vector3(0, 0, 0);
  const facing = new Map(); // hướng nhìn giữ nguyên khi dừng

  // Lệch ngang theo id để người đi cùng đường không chồng lên nhau
  const lane = (p) => (((p.id * 7919) % 11) / 10 - 0.5) * 0.32;
  const scatter = (p) => {
    const a = p.id * 2.399;
    const r = 0.18 + ((p.id * 31) % 7) / 7 * 0.28;
    return [Math.cos(a) * r, Math.sin(a) * r];
  };

  function worldOf(p) {
    if (p.path) {
      const [aq, ar] = p.path[p.seg];
      const [bq, br] = p.path[p.seg + 1];
      const [ax, az] = hexToWorld(aq, ar, S);
      const [bx, bz] = hexToWorld(bq, br, S);
      const dx = bx - ax;
      const dz = bz - az;
      const len = Math.hypot(dx, dz) || 1;
      const off = lane(p);
      const x = ax + dx * p.t - (dz / len) * off;
      const z = az + dz * p.t + (dx / len) * off;
      const tile = state.map.tiles[key(...(p.t < 0.5 ? [aq, ar] : [bq, br]))];
      return { x, z, y: topYAt(tile, x, z), heading: Math.atan2(dx, dz), walking: true };
    }
    const tile = state.map.tiles[key(p.q, p.r)];
    const [cx, cz] = hexToWorld(p.q, p.r, S);
    const [ox, oz] = p.kind === 'player' ? [0, 0] : scatter(p);
    return { x: cx + ox, z: cz + oz, y: levelY(tile.h), heading: null, walking: false };
  }

  function update(dt, elapsed) {
    timeUniform.value = elapsed;
    const night = isNight(state.clock);
    for (const { mesh, list, iAnim } of meshes) {
      list.forEach((p, i) => {
        const w = worldOf(p);
        const home = p.home >= 0 ? state.map.village.houses[p.home] : null;
        // Đêm ở nhà = trong nhà, không vẽ
        const hidden = night && home && !p.path && p.q === home.q && p.r === home.r;
        let h = facing.get(p.id) ?? (p.id * 1.7) % 6.28;
        if (w.heading !== null) { h = w.heading; facing.set(p.id, h); }
        q.setFromAxisAngle(up, h);
        pos.set(w.x, w.y, w.z);
        scl.setScalar(hidden ? 0 : H);
        mesh.setMatrixAt(i, m.compose(pos, q, hidden ? zero : scl));
        iAnim.setY(i, w.walking ? 1 : 0);
      });
      mesh.instanceMatrix.needsUpdate = true;
      iAnim.needsUpdate = true;
    }
  }

  // Vị trí thế giới hiện tại của một người (để camera bám, gắn nhãn)
  function positionOf(person) {
    const w = worldOf(person);
    return new THREE.Vector3(w.x, w.y, w.z);
  }

  return { object: group, update, positionOf };
}
