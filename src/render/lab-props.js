// Cảnh thử asset: ?lab=props
// Đặt cạnh nhau trên địa hình thật: cây dựng bằng code và các mô hình AI trong assets/_lab/*.glb (không commit).
// Danh sách file đọc từ ?glb=a.glb,b.glb

import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { buildBanyan } from './props/banyan.js';
import { levelY } from './terrain.js';
import { key, worldToHex } from '../sim/hex.js';
import { CONFIG } from '../config.js';

const TARGET_HEIGHT = 2.6;

// Chuẩn hoá: cao TARGET_HEIGHT, đáy chạm y=0, tâm ở gốc; đổi vật liệu sang Lambert cho đồng nhất.
function normalize(root, { flat }) {
  root.updateMatrixWorld(true);
  const box = new THREE.Box3().setFromObject(root);
  const size = box.getSize(new THREE.Vector3());
  const s = TARGET_HEIGHT / size.y;
  const center = box.getCenter(new THREE.Vector3());
  const wrap = new THREE.Group();
  root.position.sub(new THREE.Vector3(center.x, box.min.y, center.z));
  wrap.add(root);
  wrap.scale.setScalar(s);
  let tris = 0;
  root.traverse((o) => {
    if (!o.isMesh) return;
    const old = o.material;
    o.material = new THREE.MeshLambertMaterial({
      map: old.map || null,
      color: old.map ? 0xffffff : old.color,
      vertexColors: !!o.geometry.attributes.color,
      flatShading: flat,
    });
    o.castShadow = true;
    o.receiveShadow = true;
    const g = o.geometry;
    tris += (g.index ? g.index.count : g.attributes.position.count) / 3;
  });
  return { object: wrap, tris };
}

function label(text) {
  const el = document.createElement('div');
  el.textContent = text;
  el.style.cssText = 'position:fixed;padding:4px 8px;border-radius:6px;background:rgba(255,255,255,.85);font:12px system-ui;color:#333;transform:translate(-50%,0);pointer-events:none;white-space:nowrap';
  document.body.appendChild(el);
  return el;
}

export async function setupPropsLab(view, state, params) {
  const items = [];

  const code = buildBanyan({ height: TARGET_HEIGHT });
  items.push({ object: code, name: 'code', tris: code.geometry.attributes.position.count / 3 });

  const files = (params.get('glb') || '').split(',').filter(Boolean);
  const loader = new GLTFLoader();
  for (const f of files) {
    const gltf = await loader.loadAsync(`assets/_lab/${f}`);
    const { object, tris } = normalize(gltf.scene, { flat: params.get('flat') === '1' });
    items.push({ object, name: f, tris });
  }

  // Xếp thành hàng ngang trước camera, mỗi món đặt đúng độ cao mặt đất bên dưới
  const S = CONFIG.terrainView.hexSize;
  const gap = Number(params.get('gap')) || 3.4;
  const slots = items.map((_, i) => {
    const off = (i - (items.length - 1) / 2) * gap;
    const x = off / Math.SQRT2;
    const z = -off / Math.SQRT2;
    const [q, r] = worldToHex(x, z, S);
    const tile = state.map.tiles[key(q, r)];
    return new THREE.Vector3(x, tile ? levelY(tile.h) : 0, z);
  });

  items.forEach((it, i) => {
    it.object.position.copy(slots[i]);
    view.scene.add(it.object);
    it.el = label(`${it.name} · ${Math.round(it.tris)} tam giác`);
  });

  // Camera nhìn vào giữa các món
  const mid = new THREE.Vector3();
  items.forEach((it) => mid.add(it.object.position));
  mid.divideScalar(items.length).add(new THREE.Vector3(0, 1, 0));
  view.controls.target.copy(mid);
  view.camera.position.copy(mid).add(new THREE.Vector3(7, 6.5, 7).multiplyScalar((Number(params.get('zoom')) || 1) * (0.6 + 0.2 * items.length)));
  view.controls.update();

  // Nhãn bám theo vật
  const tmp = new THREE.Vector3();
  view.onFrame = () => {
    const w = view.renderer.domElement.clientWidth;
    const h = view.renderer.domElement.clientHeight;
    for (const it of items) {
      tmp.copy(it.object.position);
      tmp.y -= 0.3;
      tmp.project(view.camera);
      it.el.style.left = `${(tmp.x * 0.5 + 0.5) * w}px`;
      it.el.style.top = `${(-tmp.y * 0.5 + 0.5) * h}px`;
    }
  };
}
