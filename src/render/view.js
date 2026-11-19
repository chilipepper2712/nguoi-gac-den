// Lớp hiển thị Three.js: renderer, camera, ánh sáng, điều khiển camera.
// Chỉ ĐỌC game state để vẽ, không sửa luật chơi.

import * as THREE from 'three';
import { MapControls } from 'three/addons/controls/MapControls.js';
import { CONFIG } from '../config.js';
import { buildPlaceholder } from './placeholder.js';

export function createView(container) {
  const renderer = new THREE.WebGLRenderer({ antialias: true });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, CONFIG.view.maxPixelRatio));
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  container.appendChild(renderer.domElement);

  const scene = new THREE.Scene();
  scene.background = new THREE.Color(CONFIG.view.background);

  const camera = new THREE.PerspectiveCamera(CONFIG.camera.fov, 1, 0.5, 500);
  const c = CONFIG.camera;
  camera.position.setFromSphericalCoords(c.distance, c.polarAngle, c.azimuth);
  camera.lookAt(0, 0, 0);

  const controls = new MapControls(camera, renderer.domElement);
  controls.enableDamping = true;
  controls.dampingFactor = 0.1;
  controls.screenSpacePanning = false;
  controls.minDistance = c.minDistance;
  controls.maxDistance = c.maxDistance;
  controls.minPolarAngle = c.minPolarAngle;
  controls.maxPolarAngle = c.maxPolarAngle;
  controls.target.set(0, 0, 0);
  controls.update();

  const hemi = new THREE.HemisphereLight(0xffffff, 0xb9c7a0, 1.4);
  scene.add(hemi);

  const sun = new THREE.DirectionalLight(0xfff4e0, 2.2);
  sun.position.set(18, 30, 12);
  sun.castShadow = true;
  sun.shadow.mapSize.set(2048, 2048);
  sun.shadow.camera.left = -30;
  sun.shadow.camera.right = 30;
  sun.shadow.camera.top = 30;
  sun.shadow.camera.bottom = -30;
  sun.shadow.bias = -0.0005;
  scene.add(sun);

  buildPlaceholder(scene);

  function resize() {
    const w = container.clientWidth || window.innerWidth;
    const h = container.clientHeight || window.innerHeight;
    renderer.setSize(w, h, false);
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
  }
  window.addEventListener('resize', resize);
  resize();

  function render(/* state, dt */) {
    controls.update();
    renderer.render(scene, camera);
  }

  return { renderer, scene, camera, controls, lights: { hemi, sun }, render, resize };
}
