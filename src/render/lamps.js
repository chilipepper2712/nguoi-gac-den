// Một nhóm đèn: thân đèn (InstancedMesh, không chịu sáng, đổi màu ngày/đêm) + quầng sáng (Points cộng màu)
// + quầng hắt xuống đất/vật (bản đồ sáng trong fakelight.js). Mỗi nhóm 2 draw call.

import * as THREE from 'three';
import { setLampGroup } from './fakelight.js';

const DAY = new THREE.Color(0x9a4a32);
const NIGHT = new THREE.Color(0xffc070);

let glowTex = null;
function glowTexture() {
  if (glowTex) return glowTex;
  const c = document.createElement('canvas');
  c.width = c.height = 64;
  const g = c.getContext('2d');
  const grad = g.createRadialGradient(32, 32, 0, 32, 32, 32);
  grad.addColorStop(0, 'rgba(255,220,160,1)');
  grad.addColorStop(0.3, 'rgba(255,170,90,0.45)');
  grad.addColorStop(1, 'rgba(255,140,60,0)');
  g.fillStyle = grad;
  g.fillRect(0, 0, 64, 64);
  glowTex = new THREE.CanvasTexture(c);
  glowTex.colorSpace = THREE.SRGBColorSpace;
  return glowTex;
}

// shape: 'lantern' (đèn lồng tròn) | 'bulb' (bóng đèn nhỏ)
export function createLamps(name, { shape = 'lantern', glowSize = 1.6, dayColor = DAY } = {}) {
  const group = new THREE.Group();
  group.name = `lamps-${name}`;
  const bodyGeo = shape === 'bulb'
    ? new THREE.SphereGeometry(0.045, 6, 4).toNonIndexed()
    : new THREE.CylinderGeometry(0.07, 0.07, 0.14, 6).toNonIndexed();
  const bodyMat = new THREE.MeshBasicMaterial({ color: dayColor.clone() });
  let bodies = null;
  let glow = null;

  function set(list) {
    if (bodies) { group.remove(bodies); bodies.dispose(); }
    if (glow) { group.remove(glow); glow.geometry.dispose(); }
    bodies = new THREE.InstancedMesh(bodyGeo, bodyMat, Math.max(list.length, 1));
    bodies.count = list.length;
    const m = new THREE.Matrix4();
    list.forEach((p, i) => bodies.setMatrixAt(i, m.makeTranslation(p.x, p.y, p.z)));
    bodies.instanceMatrix.needsUpdate = true;
    bodies.computeBoundingSphere();
    group.add(bodies);

    glow = new THREE.Points(new THREE.BufferGeometry().setFromPoints(list), new THREE.PointsMaterial({
      map: glowTexture(), size: glowSize, sizeAttenuation: true, transparent: true, depthWrite: false,
      blending: THREE.AdditiveBlending, opacity: 0,
    }));
    glow.frustumCulled = false;
    group.add(glow);
    setLampGroup(name, list.map((p) => ({ x: p.x, y: p.y, z: p.z, radius: p.radius ?? 1.5, strength: p.strength ?? 0.9 })));
  }

  function update(night) {
    bodyMat.color.copy(dayColor).lerp(NIGHT, night);
    if (glow) glow.material.opacity = night * 0.9;
  }

  return { object: group, set, update };
}
