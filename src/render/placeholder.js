// TẠM: khối giữ chỗ cho ngôi đền ở tâm bản đồ, để kiểm tra tỉ lệ và ánh sáng.
// Thay bằng mô hình đền thật ở bước test phong cách.

import * as THREE from 'three';

export function buildPlaceholderTemple(y) {
  const group = new THREE.Group();
  group.name = 'placeholder-temple';
  group.position.y = y;

  const mat = (color) => new THREE.MeshLambertMaterial({ color, flatShading: true });

  const base = new THREE.Mesh(new THREE.BoxGeometry(2.2, 0.25, 1.8), mat(0xcfc3aa));
  base.position.y = 0.125;
  const body = new THREE.Mesh(new THREE.BoxGeometry(1.6, 0.9, 1.2), mat(0xf2ead8));
  body.position.y = 0.7;
  const roof = new THREE.Mesh(new THREE.ConeGeometry(1.35, 0.7, 4), mat(0x9a5a3c));
  roof.position.y = 1.5;
  roof.rotation.y = Math.PI / 4;
  roof.scale.z = 0.8;

  for (const m of [base, body, roof]) {
    m.castShadow = true;
    m.receiveShadow = true;
    group.add(m);
  }
  return group;
}
