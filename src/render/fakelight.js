// Ánh sáng giả cho điện thoại: không dùng PointLight.
//   - Đèn (đền, nhà, đường): vẽ quầng sáng lên một texture nhìn từ trên xuống (bản đồ sáng). Shader tra texture
//     theo toạ độ (x, z) — chi phí cố định, bao nhiêu đèn cũng vậy.
//   - Vòng pháp lực trên mặt đất quanh đền (chỉ vật liệu mặt đất, aura: true).
// Cả hai nhân với uNight (0 = ngày, 1 = đêm). Mọi vật liệu dùng chung một bộ uniform.

import * as THREE from 'three';
import { CONFIG } from '../config.js';

// Vùng bản đồ sáng phủ (vuông, tâm 0,0), đủ rộng cho cả bản đồ
const HALF = (CONFIG.terrain.radius + 1.5) * Math.sqrt(3) * CONFIG.terrainView.hexSize;
const SIZE = 512;

const canvas = typeof document !== 'undefined' ? document.createElement('canvas') : null;
if (canvas) canvas.width = canvas.height = SIZE;
const lightTex = canvas ? new THREE.CanvasTexture(canvas) : null;
if (lightTex) {
  lightTex.colorSpace = THREE.NoColorSpace;
  lightTex.minFilter = THREE.LinearFilter;
  lightTex.generateMipmaps = false;
}

export const fakeLightUniforms = {
  uNight: { value: 0 },
  uLightMap: { value: lightTex },
  uLightRect: { value: new THREE.Vector3(-HALF, -HALF, HALF * 2) },
  uAuraCenter: { value: new THREE.Vector3() },
  uAuraRadius: { value: 0 },
  uAuraColor: { value: new THREE.Color(0xffd98a) },
};

const VERT_DECL = 'varying vec3 vFakeWorldPos;\n';
const VERT_BODY = `
  vec4 fakeWP = vec4(transformed, 1.0);
  #ifdef USE_INSTANCING
    fakeWP = instanceMatrix * fakeWP;
  #endif
  vFakeWorldPos = (modelMatrix * fakeWP).xyz;
`;

const FRAG_DECL = `
varying vec3 vFakeWorldPos;
uniform float uNight;
uniform sampler2D uLightMap;
uniform vec3 uLightRect;
uniform vec3 uAuraCenter;
uniform float uAuraRadius;
uniform vec3 uAuraColor;
`;

const FRAG_BODY = `
  if (uNight > 0.001) {
    vec2 luv = (vFakeWorldPos.xz - uLightRect.xy) / uLightRect.z;
    vec3 lamp = texture2D(uLightMap, vec2(luv.x, 1.0 - luv.y)).rgb;
    reflectedLight.indirectDiffuse += diffuseColor.rgb * lamp * 1.25 * uNight;

    #ifdef FAKE_AURA
    if (uAuraRadius > 0.0) {
      float ad = length(vFakeWorldPos.xz - uAuraCenter.xz);
      float ring = smoothstep(uAuraRadius - 0.7, uAuraRadius - 0.05, ad) * (1.0 - smoothstep(uAuraRadius - 0.05, uAuraRadius + 0.12, ad));
      float inside = 1.0 - smoothstep(uAuraRadius - 0.3, uAuraRadius + 0.1, ad);
      totalEmissiveRadiance += uAuraColor * (ring * 0.55 + inside * 0.07) * uNight;
    }
    #endif
  }
`;

// Gắn ánh sáng giả vào một vật liệu Lambert (gọi một lần cho mỗi vật liệu).
// aura: true chỉ cho mặt đất (vòng pháp lực vẽ theo khoảng cách ngang, nếu bật cho cây/nhà sẽ làm sáng cả thân).
export function withFakeLight(material, { aura = false } = {}) {
  if (aura) material.defines = { ...(material.defines || {}), FAKE_AURA: '' };
  material.onBeforeCompile = (shader) => {
    Object.assign(shader.uniforms, fakeLightUniforms);
    shader.vertexShader = VERT_DECL + shader.vertexShader.replace('#include <project_vertex>', `#include <project_vertex>\n${VERT_BODY}`);
    shader.fragmentShader = FRAG_DECL + shader.fragmentShader.replace('#include <lights_fragment_end>', `#include <lights_fragment_end>\n${FRAG_BODY}`);
  };
  material.customProgramCacheKey = () => (aura ? 'fakelight-aura' : 'fakelight');
  return material;
}

// Gắn cho mọi vật liệu Lambert trong một cây đối tượng.
export function applyFakeLight(root, options) {
  const done = new Set();
  root.traverse((o) => {
    if (!o.isMesh) return;
    const mats = Array.isArray(o.material) ? o.material : [o.material];
    for (const m of mats) {
      if (m.isMeshLambertMaterial && !done.has(m)) {
        withFakeLight(m, options);
        done.add(m);
      }
    }
  });
}

// Đèn theo nhóm (đền, làng...). Mỗi điểm: { x, y, z, radius, strength? }
const groups = new Map();

function redraw() {
  if (!canvas) return;
  const g = canvas.getContext('2d');
  g.globalCompositeOperation = 'source-over';
  g.fillStyle = '#000';
  g.fillRect(0, 0, SIZE, SIZE);
  g.globalCompositeOperation = 'lighter';
  const k = SIZE / (HALF * 2);
  for (const list of groups.values()) {
    for (const p of list) {
      const x = (p.x + HALF) * k;
      const y = (p.z + HALF) * k;
      const r = p.radius * k;
      const a = p.strength ?? 1;
      const grad = g.createRadialGradient(x, y, 0, x, y, r);
      grad.addColorStop(0, `rgba(255,190,110,${0.75 * a})`);
      grad.addColorStop(0.35, `rgba(255,170,90,${0.35 * a})`);
      grad.addColorStop(1, 'rgba(255,150,70,0)');
      g.fillStyle = grad;
      g.fillRect(x - r, y - r, r * 2, r * 2);
    }
  }
  lightTex.needsUpdate = true;
}

export function setLampGroup(name, points) {
  groups.set(name, points);
  redraw();
}
