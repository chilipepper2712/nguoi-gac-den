// Vẽ cây, bụi, đá, cỏ hoa bằng InstancedMesh: mỗi model một mesh, cả bản đồ vài draw call.
// Model lấy từ CONFIG.flora.models (Kenney Nature Kit đã tô lại). Cây cổ thụ cạnh đền là model riêng.
// Nạp không đồng bộ: trả về group ngay, `ready` xong khi mọi model đã vào cảnh.

import * as THREE from 'three';
import { CONFIG } from '../config.js';
import { hexToWorld } from '../sim/hex.js';
import { levelY } from './terrain.js';
import { loadGeometry } from './models.js';
import { withFakeLight } from './fakelight.js';

export function buildFlora(map) {
  const group = new THREE.Group();
  group.name = 'flora';
  const S = CONFIG.terrainView.hexSize;
  const F = CONFIG.flora;
  const material = withFakeLight(new THREE.MeshLambertMaterial({ vertexColors: true }));

  // Gom theo (loại, dáng)
  const buckets = new Map();
  for (const f of map.flora) {
    const k = `${f.kind}:${f.variant}`;
    if (!buckets.has(k)) buckets.set(k, []);
    buckets.get(k).push(f);
  }

  const m = new THREE.Matrix4();
  const q = new THREE.Quaternion();
  const up = new THREE.Vector3(0, 1, 0);
  const tint = new THREE.Color();
  const pos = new THREE.Vector3();
  const scl = new THREE.Vector3();

  const jobs = [...buckets].map(async ([k, list]) => {
    const [kind, variant] = k.split(':');
    const path = F.models[kind][Number(variant)];
    let geo;
    try {
      geo = await loadGeometry(path);
    } catch (e) {
      console.warn('Thiếu model cây cỏ', path, e);
      return;
    }
    const mesh = new THREE.InstancedMesh(geo, material, list.length);
    mesh.name = `flora-${path}`;
    mesh.castShadow = kind === 'tree' || kind === 'rock';
    mesh.receiveShadow = true;
    const base = F.modelScale[kind];
    list.forEach((f, i) => {
      const tile = map.tiles[`${f.q},${f.r}`];
      const [cx, cz] = hexToWorld(f.q, f.r, S);
      q.setFromAxisAngle(up, f.rot);
      pos.set(cx + f.dx * S, levelY(tile.h), cz + f.dz * S);
      scl.setScalar(f.s * base);
      mesh.setMatrixAt(i, m.compose(pos, q, scl));
      // Lệch sáng tối nhẹ cho đỡ đều
      const v = 0.9 + (((i * 7919) % 97) / 97) * 0.2;
      mesh.setColorAt(i, tint.setRGB(v, v, v));
    });
    mesh.instanceMatrix.needsUpdate = true;
    mesh.computeBoundingSphere();
    group.add(mesh);
  });

  // Cây cổ thụ
  for (const l of map.landmarks.filter((x) => x.kind === 'heroTree')) {
    jobs.push(loadGeometry('assets/props/hero_tree.glb').then((geo) => {
      const tile = map.tiles[`${l.q},${l.r}`];
      const [cx, cz] = hexToWorld(l.q, l.r, S);
      geo.computeBoundingBox();
      const size = geo.boundingBox.getSize(new THREE.Vector3());
      const center = geo.boundingBox.getCenter(new THREE.Vector3());
      const mesh = new THREE.Mesh(geo, material);
      mesh.name = 'hero-tree';
      mesh.castShadow = true;
      mesh.receiveShadow = true;
      const s = F.heroTreeHeight / size.y;
      mesh.scale.setScalar(s);
      mesh.rotation.y = F.heroTreeRotation;
      // Đặt gốc ở đáy-tâm
      const off = new THREE.Vector3(-center.x, -geo.boundingBox.min.y, -center.z).multiplyScalar(s).applyAxisAngle(up, F.heroTreeRotation);
      mesh.position.set(cx, levelY(tile.h), cz).add(off);
      group.add(mesh);
    }).catch((e) => console.warn('Thiếu cây cổ thụ', e)));
  }

  return { object: group, ready: Promise.all(jobs) };
}

// Đồ đổ nát quanh đền (gộp một geometry, một draw call). transform: Object3D đặt theo đền.
export async function buildRuinDebris(transform) {
  const { mergeGeometries } = await import('three/addons/utils/BufferGeometryUtils.js');
  const parts = [];
  const m = new THREE.Matrix4();
  const q = new THREE.Quaternion();
  const up = new THREE.Vector3(0, 1, 0);
  const sc = CONFIG.flora.modelScale.small;
  for (const [path, x, z, rot] of CONFIG.temple.ruinDebris) {
    const geo = await loadGeometry(path);
    q.setFromAxisAngle(up, rot);
    parts.push(geo.clone().applyMatrix4(m.compose(new THREE.Vector3(x, 0, z), q, new THREE.Vector3(sc, sc, sc))));
  }
  const mesh = new THREE.Mesh(mergeGeometries(parts), withFakeLight(new THREE.MeshLambertMaterial({ vertexColors: true })));
  mesh.name = 'ruin-debris';
  mesh.castShadow = true;
  mesh.receiveShadow = true;
  mesh.position.copy(transform.position);
  mesh.rotation.copy(transform.rotation);
  return mesh;
}
