// Ngày đêm: nội suy màu trời, mặt trời/trăng, ánh sáng môi trường, sương mù theo giờ trong ngày.
// t ∈ [0, 1): 0 = nửa đêm, 0.25 = 6h, 0.5 = trưa, 0.75 = 18h.

import * as THREE from 'three';
import { fakeLightUniforms } from './fakelight.js';

// night: hệ số cho ánh sáng giả (đèn lồng, vòng pháp lực)
const KEYS = [
  { t: 0.0, bg: 0x1d2a4a, light: 0xa8c0ff, li: 0.85, sky: 0x5a6fa8, ground: 0x283048, hi: 1.15, fogNear: 30, fogFar: 95, night: 1 },
  { t: 0.21, bg: 0x2b3560, light: 0xb0bcff, li: 0.8, sky: 0x6270a8, ground: 0x2c2e48, hi: 1.15, fogNear: 34, fogFar: 100, night: 0.9 },
  { t: 0.27, bg: 0xf1c3a2, light: 0xffb47a, li: 1.3, sky: 0xffd9b8, ground: 0x8a7a6a, hi: 1.05, fogNear: 60, fogFar: 200, night: 0.25 },
  { t: 0.34, bg: 0xcfe3e6, light: 0xfff4e0, li: 2.0, sky: 0xffffff, ground: 0xb9c7a0, hi: 1.5, fogNear: 120, fogFar: 300, night: 0 },
  { t: 0.64, bg: 0xd6e4e2, light: 0xffefd6, li: 2.0, sky: 0xfffaf0, ground: 0xbcc49e, hi: 1.45, fogNear: 120, fogFar: 300, night: 0 },
  { t: 0.73, bg: 0xf0b48c, light: 0xff9a5c, li: 1.3, sky: 0xffcaa0, ground: 0x7a6a7a, hi: 1.0, fogNear: 60, fogFar: 200, night: 0.35 },
  { t: 0.8, bg: 0x313a66, light: 0xb0bcff, li: 0.8, sky: 0x6270a8, ground: 0x2c2e48, hi: 1.15, fogNear: 34, fogFar: 100, night: 0.9 },
  { t: 1.0, bg: 0x1d2a4a, light: 0xa8c0ff, li: 0.85, sky: 0x5a6fa8, ground: 0x283048, hi: 1.15, fogNear: 30, fogFar: 95, night: 1 },
];

const ca = new THREE.Color();
const cb = new THREE.Color();
function lerpHex(a, b, k, out) {
  return out.copy(ca.setHex(a)).lerp(cb.setHex(b), k);
}

export function sample(t) {
  const x = ((t % 1) + 1) % 1;
  let i = 0;
  while (i < KEYS.length - 2 && KEYS[i + 1].t <= x) i++;
  const a = KEYS[i];
  const b = KEYS[i + 1];
  const k = (x - a.t) / (b.t - a.t);
  const mix = (p) => a[p] + (b[p] - a[p]) * k;
  return { a, b, k, li: mix('li'), hi: mix('hi'), fogNear: mix('fogNear'), fogFar: mix('fogFar'), night: mix('night') };
}

export function createSky(scene, { sun, hemi }, mapExtent) {
  scene.fog = new THREE.Fog(0xcfe3e6, 120, 300);
  const bg = new THREE.Color();
  scene.background = bg;
  const dir = new THREE.Vector3();

  function update(t) {
    const s = sample(t);
    lerpHex(s.a.bg, s.b.bg, s.k, bg);
    scene.fog.color.copy(bg);
    scene.fog.near = s.fogNear;
    scene.fog.far = s.fogFar;
    lerpHex(s.a.light, s.b.light, s.k, sun.color);
    sun.intensity = s.li;
    lerpHex(s.a.sky, s.b.sky, s.k, hemi.color);
    lerpHex(s.a.ground, s.b.ground, s.k, hemi.groundColor);
    hemi.intensity = s.hi;

    // Mặt trời quay theo giờ; ban đêm dùng chính đèn đó làm trăng ở phía đối diện
    const ang = 2 * Math.PI * (t - 0.25);
    let dx = Math.cos(ang);
    let dy = Math.sin(ang);
    if (dy < 0) { dx = -dx; dy = -dy; }
    dy = Math.max(dy, 0.35);
    dir.set(dx * 0.75, dy * 1.2, 0.45);
    sun.position.copy(dir).multiplyScalar(mapExtent);

    fakeLightUniforms.uNight.value = s.night;
    return s;
  }
  return { update };
}
