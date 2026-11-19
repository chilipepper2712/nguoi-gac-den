// Đèn lồng: thân đèn (InstancedMesh, vật liệu không chịu sáng) + quầng sáng (Points cộng màu, một draw call).
// Ánh sáng hắt xuống đất/cây do fakelight.js lo.

import * as THREE from 'three';
import { setLamps } from './fakelight.js';

const DAY = new THREE.Color(0x9a4a32);
const NIGHT = new THREE.Color(0xffc070);

function glowTexture() {
  const c = document.createElement('canvas');
  c.width = c.height = 64;
  const g = c.getContext('2d');
  const grad = g.createRadialGradient(32, 32, 0, 32, 32, 32);
  grad.addColorStop(0, 'rgba(255,220,160,1)');
  grad.addColorStop(0.3, 'rgba(255,170,90,0.45)');
  grad.addColorStop(1, 'rgba(255,140,60,0)');
  g.fillStyle = grad;
  g.fillRect(0, 0, 64, 64);
  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

export function createLamps() {
  const group = new THREE.Group();
  group.name = 'lamps';
  const bodyGeo = new THREE.CylinderGeometry(0.07, 0.07, 0.14, 6).toNonIndexed();
  const bodyMat = new THREE.MeshBasicMaterial({ color: DAY.clone() });
  const glowTex = glowTexture();
  let bodies = null;
  let glow = null;
  let points = [];

  function set(list) {
    points = list;
    if (bodies) { group.remove(bodies); bodies.dispose(); }
    if (glow) { group.remove(glow); glow.geometry.dispose(); }
    bodies = new THREE.InstancedMesh(bodyGeo, bodyMat, Math.max(list.length, 1));
    bodies.count = list.length;
    const m = new THREE.Matrix4();
    list.forEach((p, i) => bodies.setMatrixAt(i, m.makeTranslation(p.x, p.y, p.z)));
    bodies.instanceMatrix.needsUpdate = true;
    group.add(bodies);

    const geo = new THREE.BufferGeometry().setFromPoints(list);
    glow = new THREE.Points(geo, new THREE.PointsMaterial({
      map: glowTex, size: 1.6, sizeAttenuation: true, transparent: true, depthWrite: false,
      blending: THREE.AdditiveBlending, opacity: 0,
    }));
    glow.frustumCulled = false;
    group.add(glow);
    setLamps(list.map((p) => ({ x: p.x, y: p.y, z: p.z, radius: 2.2 })));
  }

  function update(night) {
    bodyMat.color.copy(DAY).lerp(NIGHT, night);
    if (glow) glow.material.opacity = night * 0.9;
  }

  return { object: group, set, update, get points() { return points; } };
}
