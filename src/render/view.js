// Lớp hiển thị Three.js: renderer, camera, ánh sáng, điều khiển camera.
// Chỉ ĐỌC game state để vẽ, không sửa luật chơi.

import * as THREE from 'three';
import { MapControls } from 'three/addons/controls/MapControls.js';
import { CONFIG } from '../config.js';
import { buildTerrainMesh, levelY } from './terrain.js';
import { buildPlaceholderTemple } from './placeholder.js';

export function createView(container, state) {
  const renderer = new THREE.WebGLRenderer({ antialias: true, powerPreference: 'high-performance' });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, CONFIG.view.maxPixelRatio));
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  container.appendChild(renderer.domElement);

  const scene = new THREE.Scene();
  scene.background = new THREE.Color(CONFIG.view.background);

  const centerY = levelY(CONFIG.terrain.templeLevel);
  const camera = new THREE.PerspectiveCamera(CONFIG.camera.fov, 1, 0.5, 500);
  const c = CONFIG.camera;
  camera.position.setFromSphericalCoords(c.distance, c.polarAngle, c.azimuth);
  camera.position.y += centerY;
  camera.lookAt(0, centerY, 0);

  const controls = new MapControls(camera, renderer.domElement);
  controls.enableDamping = true;
  controls.dampingFactor = 0.1;
  controls.screenSpacePanning = false;
  controls.minDistance = c.minDistance;
  controls.maxDistance = c.maxDistance;
  controls.minPolarAngle = c.minPolarAngle;
  controls.maxPolarAngle = c.maxPolarAngle;
  controls.target.set(0, centerY, 0);
  controls.update();

  const hemi = new THREE.HemisphereLight(0xffffff, 0xb9c7a0, 1.5);
  scene.add(hemi);

  // Bóng đổ: một đèn mặt trời, hộp bóng ôm vừa bản đồ
  const mapExtent = CONFIG.terrain.radius * CONFIG.terrainView.hexSize * 1.8;
  const sun = new THREE.DirectionalLight(0xfff4e0, 2.0);
  sun.position.set(mapExtent * 0.6, mapExtent * 1.1, mapExtent * 0.35);
  sun.castShadow = true;
  sun.shadow.mapSize.set(2048, 2048);
  Object.assign(sun.shadow.camera, {
    left: -mapExtent, right: mapExtent, top: mapExtent, bottom: -mapExtent, near: 1, far: mapExtent * 4,
  });
  sun.shadow.bias = -0.0008;
  sun.shadow.normalBias = 0.02;
  scene.add(sun);

  scene.add(buildTerrainMesh(state.map));
  scene.add(buildPlaceholderTemple(centerY));

  function resize() {
    const w = container.clientWidth || window.innerWidth;
    const h = container.clientHeight || window.innerHeight;
    renderer.setSize(w, h, false);
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
  }
  window.addEventListener('resize', resize);
  resize();

  const view = { renderer, scene, camera, controls, lights: { hemi, sun }, render, resize, onFrame: null };

  function render(state, dt) {
    controls.update();
    if (view.onFrame) view.onFrame(dt);
    renderer.render(scene, camera);
  }

  return view;
}
