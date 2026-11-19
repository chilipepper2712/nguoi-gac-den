// Bậc đá đặt lên ô dốc cho dễ nhận ra lối đi. Một InstancedMesh cho cả bản đồ.

import * as THREE from 'three';
import { CONFIG } from '../config.js';
import { hexToWorld } from '../sim/hex.js';
import { topYAt } from './terrain.js';

const STEPS = 4;

export function buildStairs(map) {
  const ramps = Object.values(map.tiles).filter((t) => t.ramp !== null);
  const S = CONFIG.terrainView.hexSize;
  const apothem = (Math.sqrt(3) / 2) * S;
  const depth = (2 * apothem) / STEPS;
  const rise = CONFIG.terrainView.levelHeight / STEPS;
  const geo = new THREE.BoxGeometry(0.72 * S, rise * 2.2, depth * 0.98).toNonIndexed();
  geo.computeVertexNormals();
  const mat = new THREE.MeshLambertMaterial({ color: 0xd8ccb4 });
  const mesh = new THREE.InstancedMesh(geo, mat, Math.max(ramps.length * STEPS, 1));
  mesh.name = 'stairs';
  mesh.receiveShadow = true;
  mesh.castShadow = true;

  const m = new THREE.Matrix4();
  const q = new THREE.Quaternion();
  const one = new THREE.Vector3(1, 1, 1);
  let n = 0;
  for (const t of ramps) {
    const [cx, cz] = hexToWorld(t.q, t.r, S);
    const a = (Math.PI / 3) * t.ramp;
    const ux = Math.cos(a);
    const uz = Math.sin(a);
    // Box dài theo trục x cục bộ = vuông góc hướng dốc; trục z cục bộ = hướng dốc
    q.setFromAxisAngle(new THREE.Vector3(0, 1, 0), -a + Math.PI / 2);
    for (let i = 0; i < STEPS; i++) {
      const off = -apothem + depth * (i + 0.5);
      const x = cx + ux * off;
      const z = cz + uz * off;
      // Mặt bậc phẳng, cao bằng mép trên của đoạn dốc
      const top = topYAt(t, x + ux * depth * 0.5, z + uz * depth * 0.5);
      m.compose(new THREE.Vector3(x, top - rise * 1.1 + 0.01, z), q, one);
      mesh.setMatrixAt(n++, m);
    }
  }
  mesh.count = n;
  mesh.instanceMatrix.needsUpdate = true;
  mesh.computeBoundingSphere();
  return mesh;
}
