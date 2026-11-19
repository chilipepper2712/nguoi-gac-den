// Ma dễ thương: thân tấm vải tròn, mép dưới gợn sóng, mắt to, má hồng, hai tay ngắn.
// Ban ngày gần như trong suốt, ban đêm hiện rõ và hơi phát sáng. Nhấp nhô, lắc lư, trôi vòng quanh một điểm.

import * as THREE from 'three';
import { colored, merge } from './props/geo.js';

const BODY = 0xeef6f2;
const EYE = 0x2b2a33;
const BLUSH = 0xf3a6b4;

function bodyGeometry() {
  const prof = [
    [0.0, 0.62], [0.1, 0.6], [0.19, 0.55], [0.26, 0.46], [0.3, 0.34], [0.31, 0.2], [0.32, 0.08], [0.35, 0.0],
  ].map(([x, y]) => new THREE.Vector2(x, y));
  const geo = new THREE.LatheGeometry(prof, 12);
  // Mép dưới gợn sóng
  const p = geo.attributes.position;
  for (let i = 0; i < p.count; i++) {
    if (p.getY(i) < 0.01) {
      const a = Math.atan2(p.getZ(i), p.getX(i));
      p.setY(i, 0.04 * Math.sin(a * 6));
    }
  }
  const parts = [colored(geo, BODY)];
  // Tay ngắn
  for (const s of [-1, 1]) {
    parts.push(colored(new THREE.SphereGeometry(0.07, 6, 4).scale(1, 0.7, 0.8).translate(s * 0.31, 0.24, 0.04), BODY));
  }
  return merge(parts);
}

function faceGeometry() {
  const parts = [];
  for (const s of [-1, 1]) {
    parts.push(colored(new THREE.SphereGeometry(0.045, 6, 4).scale(1, 1.25, 0.5).translate(s * 0.1, 0.38, 0.27), EYE));
    parts.push(colored(new THREE.SphereGeometry(0.04, 6, 3).scale(1.3, 0.6, 0.3).translate(s * 0.18, 0.3, 0.25), BLUSH));
  }
  return merge(parts);
}

let glowTex = null;
function glowTexture() {
  if (glowTex) return glowTex;
  const c = document.createElement('canvas');
  c.width = c.height = 64;
  const g = c.getContext('2d');
  const grad = g.createRadialGradient(32, 32, 0, 32, 32, 32);
  grad.addColorStop(0, 'rgba(255,255,255,0.9)');
  grad.addColorStop(0.4, 'rgba(255,255,255,0.25)');
  grad.addColorStop(1, 'rgba(255,255,255,0)');
  g.fillStyle = grad;
  g.fillRect(0, 0, 64, 64);
  glowTex = new THREE.CanvasTexture(c);
  return glowTex;
}

export function buildGhost({ phase = 0 } = {}) {
  const group = new THREE.Group();
  group.name = 'ghost';
  const bodyMat = new THREE.MeshLambertMaterial({ vertexColors: true, transparent: true, opacity: 0.9, emissive: 0x9fe8d8, emissiveIntensity: 0 });
  const faceMat = new THREE.MeshBasicMaterial({ vertexColors: true, transparent: true, opacity: 1 });
  const body = new THREE.Mesh(bodyGeometry(), bodyMat);
  const face = new THREE.Mesh(faceGeometry(), faceMat);
  face.renderOrder = 1;
  group.add(body, face);
  group.scale.setScalar(1.15);
  // Quầng sáng mờ quanh thân (một sprite cộng màu)
  const glow = new THREE.Sprite(new THREE.SpriteMaterial({ map: glowTexture(), color: 0xa8ffe8, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, opacity: 0 }));
  glow.scale.set(1.3, 1.3, 1);
  glow.position.y = 0.32;
  group.add(glow);

  let time = phase;
  const home = new THREE.Vector3();
  let orbit = 1.2;

  return {
    object: group,
    place(center, radius) {
      home.copy(center);
      orbit = radius;
    },
    update(dt, night) {
      time += dt;
      const a = time * 0.35;
      group.position.set(home.x + Math.cos(a) * orbit, home.y + 0.35 + Math.sin(time * 2.2) * 0.08, home.z + Math.sin(a) * orbit);
      group.rotation.y = -a + Math.PI; // nhìn theo hướng trôi
      group.rotation.z = Math.sin(time * 1.7) * 0.08;
      const vis = THREE.MathUtils.smoothstep(night, 0.15, 0.7);
      bodyMat.opacity = 0.08 + vis * 0.82;
      faceMat.opacity = 0.1 + vis * 0.9;
      bodyMat.emissiveIntensity = vis * 0.55;
      glow.material.opacity = vis * 0.55;
      group.visible = bodyMat.opacity > 0.05;
    },
  };
}
