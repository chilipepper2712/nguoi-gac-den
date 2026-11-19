// Vẽ cây, bụi, đá bằng InstancedMesh: mỗi dáng một mesh, cả bản đồ vài draw call.
// Cây cổ thụ cạnh đền là mô hình riêng (assets/props/hero_tree.glb).

import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { CONFIG } from '../config.js';
import { hexToWorld } from '../sim/hex.js';
import { levelY } from './terrain.js';
import { seeded, colored, limb, blob, merge } from './props/geo.js';
import { applyFakeLight } from './fakelight.js';

const C = {
  bark: 0x9b7f74,
  leaf: [0x9cc46a, 0x6f9e5a, 0x7fae5e, 0xb3cf7a],
  bush: [0x8fbb64, 0xa5c873],
  rock: [0xb5aea4, 0xa39c92, 0xc2bbb0],
};
const V = (x, y, z) => new THREE.Vector3(x, y, z);

// Các dáng cây đơn giản (đơn vị: cạnh ô = 1).
function treeGeometry(variant) {
  const rnd = seeded(100 + variant);
  const parts = [];
  switch (variant) {
    case 0: // cây tán tròn
      parts.push(colored(limb(V(0, 0, 0), V(0, 0.4, 0), 0.06, 0.045), C.bark));
      parts.push(colored(blob(0.32, 0, rnd, { sy: 0.9 }).translate(0, 0.58, 0), C.leaf[0]));
      break;
    case 1: // cây lá kim
      parts.push(colored(limb(V(0, 0, 0), V(0, 0.22, 0), 0.05, 0.04), C.bark));
      [[0.3, 0.42, 0.36], [0.23, 0.36, 0.58], [0.15, 0.3, 0.78]].forEach(([r, h, y]) => {
        parts.push(colored(new THREE.ConeGeometry(r, h, 6).translate(0, y, 0), C.leaf[1]));
      });
      break;
    case 2: // cây thon cao
      parts.push(colored(limb(V(0, 0, 0), V(0, 0.2, 0), 0.05, 0.04), C.bark));
      parts.push(colored(blob(0.2, 0, rnd, { sy: 2.3 }).translate(0, 0.62, 0), C.leaf[2]));
      break;
    default: // cây hai tán
      parts.push(colored(limb(V(0, 0, 0), V(0, 0.3, 0), 0.06, 0.05), C.bark));
      parts.push(colored(limb(V(0, 0.28, 0), V(0.14, 0.48, 0.04), 0.04, 0.025), C.bark));
      parts.push(colored(limb(V(0, 0.28, 0), V(-0.12, 0.42, -0.05), 0.04, 0.025), C.bark));
      parts.push(colored(blob(0.24, 0, rnd).translate(0.14, 0.6, 0.04), C.leaf[3]));
      parts.push(colored(blob(0.19, 0, rnd).translate(-0.13, 0.5, -0.05), C.leaf[3]));
  }
  return merge(parts);
}

function bushGeometry(variant) {
  const rnd = seeded(200 + variant);
  if (variant === 0) return merge([colored(blob(0.18, 0, rnd, { sy: 0.7 }).translate(0, 0.1, 0), C.bush[0])]);
  return merge([
    colored(blob(0.14, 0, rnd, { sy: 0.75 }).translate(0.07, 0.08, 0), C.bush[1]),
    colored(blob(0.11, 0, rnd, { sy: 0.75 }).translate(-0.09, 0.07, 0.04), C.bush[1]),
  ]);
}

function rockGeometry(variant) {
  const rnd = seeded(300 + variant);
  return merge([colored(blob(0.2, 0, rnd, { sy: 0.6, jitter: 0.4, shape: 'dodeca' }).translate(0, 0.06, 0), C.rock[variant % C.rock.length])]);
}

const BUILDERS = { tree: treeGeometry, bush: bushGeometry, rock: rockGeometry };

export function buildFlora(map) {
  const group = new THREE.Group();
  group.name = 'flora';
  const S = CONFIG.terrainView.hexSize;
  const material = new THREE.MeshLambertMaterial({ vertexColors: true });

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
  for (const [k, list] of buckets) {
    const [kind, variant] = k.split(':');
    const mesh = new THREE.InstancedMesh(BUILDERS[kind](Number(variant)), material, list.length);
    mesh.name = `flora-${kind}-${variant}`;
    mesh.castShadow = kind !== 'bush';
    mesh.receiveShadow = true;
    list.forEach((f, i) => {
      const tile = map.tiles[`${f.q},${f.r}`];
      const [cx, cz] = hexToWorld(f.q, f.r, S);
      q.setFromAxisAngle(up, f.rot);
      m.compose(new THREE.Vector3(cx + f.dx * S, levelY(tile.h), cz + f.dz * S), q, new THREE.Vector3(f.s, f.s, f.s));
      mesh.setMatrixAt(i, m);
      // Lệch sáng tối nhẹ cho đỡ đều
      const v = 0.9 + ((i * 7919) % 97) / 97 * 0.2;
      mesh.setColorAt(i, tint.setRGB(v, v, v));
    });
    mesh.instanceMatrix.needsUpdate = true;
    mesh.computeBoundingSphere();
    group.add(mesh);
  }

  // Cây cổ thụ: nạp không đồng bộ, thiếu file thì bỏ qua
  for (const l of map.landmarks.filter((x) => x.kind === 'heroTree')) {
    const tile = map.tiles[`${l.q},${l.r}`];
    const [cx, cz] = hexToWorld(l.q, l.r, S);
    new GLTFLoader().loadAsync('assets/props/hero_tree.glb').then((gltf) => {
      const root = gltf.scene;
      root.traverse((o) => {
        if (!o.isMesh) return;
        o.material = new THREE.MeshLambertMaterial({ vertexColors: true });
        o.castShadow = true;
        o.receiveShadow = true;
      });
      const box = new THREE.Box3().setFromObject(root);
      const size = box.getSize(new THREE.Vector3());
      const center = box.getCenter(new THREE.Vector3());
      root.position.set(-center.x, -box.min.y, -center.z);
      const holder = new THREE.Group();
      holder.name = 'hero-tree';
      holder.add(root);
      holder.scale.setScalar(CONFIG.flora.heroTreeHeight / size.y);
      holder.position.set(cx, levelY(tile.h), cz);
      holder.rotation.y = CONFIG.flora.heroTreeRotation;
      applyFakeLight(holder);
      group.add(holder);
    }).catch(() => {});
  }
  return group;
}
