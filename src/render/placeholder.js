// TẠM: cảnh giữ chỗ để kiểm tra renderer/ánh sáng/camera chạy được.
// Xoá file này khi có cảnh thật (sau khi chốt lưới lục giác hay địa hình tự do).

import * as THREE from 'three';

export function buildPlaceholder(scene) {
  const ground = new THREE.Mesh(
    new THREE.CylinderGeometry(16, 16, 1.2, 6),
    new THREE.MeshStandardMaterial({ color: 0x9ccc7a, flatShading: true, roughness: 1 }),
  );
  ground.position.y = -0.6;
  ground.receiveShadow = true;
  scene.add(ground);

  const block = new THREE.Mesh(
    new THREE.BoxGeometry(3, 2.4, 3),
    new THREE.MeshStandardMaterial({ color: 0xf4efe4, flatShading: true, roughness: 1 }),
  );
  block.position.y = 1.2;
  block.castShadow = true;
  block.receiveShadow = true;
  scene.add(block);

  const roof = new THREE.Mesh(
    new THREE.ConeGeometry(2.6, 1.4, 4),
    new THREE.MeshStandardMaterial({ color: 0xd9744a, flatShading: true, roughness: 1 }),
  );
  roof.position.y = 3.1;
  roof.rotation.y = Math.PI / 4;
  roof.castShadow = true;
  scene.add(roof);
}
