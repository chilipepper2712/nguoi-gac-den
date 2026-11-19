// Nạp model tĩnh (GLB đã qua tools/import_kenney.mjs hoặc tools/flatten_glb.mjs): một primitive, màu theo mặt.
// Trả về BufferGeometry dùng chung (cache), để dựng InstancedMesh hoặc gộp geometry.

import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';

const loader = new GLTFLoader();
const cache = new Map();

// path: 'nature/tree_oak' → assets/kenney/nature/tree_oak.glb ; hoặc đường dẫn .glb đầy đủ
export function loadGeometry(path) {
  const url = path.endsWith('.glb') ? path : `assets/kenney/${path}.glb`;
  if (!cache.has(url)) {
    cache.set(url, loader.loadAsync(url).then((gltf) => {
      const parts = [];
      gltf.scene.updateMatrixWorld(true);
      gltf.scene.traverse((o) => {
        if (!o.isMesh) return;
        const g = o.geometry.clone().applyMatrix4(o.matrixWorld);
        parts.push(g.index ? g.toNonIndexed() : g);
      });
      const geo = parts.length === 1 ? parts[0] : mergeGeometries(parts);
      if (!geo.attributes.color) {
        const n = geo.attributes.position.count;
        geo.setAttribute('color', new THREE.BufferAttribute(new Float32Array(n * 3).fill(1), 3));
      }
      for (const name of Object.keys(geo.attributes)) if (name !== 'position' && name !== 'color') geo.deleteAttribute(name);
      geo.computeVertexNormals();
      geo.computeBoundingSphere();
      return geo;
    }));
  }
  return cache.get(url);
}
