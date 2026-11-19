// Ánh sáng giả cho điện thoại: không dùng PointLight. Vá shader Lambert để cộng thêm
//   - quầng sáng đèn lồng (tối đa MAX_LAMPS điểm, suy giảm theo khoảng cách)
//   - vòng pháp lực trên mặt đất quanh đền
// Cả hai nhân với uNight (0 = ngày, 1 = đêm). Mọi vật liệu dùng chung một bộ uniform.

import * as THREE from 'three';

export const MAX_LAMPS = 16;

export const fakeLightUniforms = {
  uNight: { value: 0 },
  uLamps: { value: Array.from({ length: MAX_LAMPS }, () => new THREE.Vector4(0, -999, 0, 0)) },
  uLampCount: { value: 0 },
  uLampColor: { value: new THREE.Color(0xffb35c) },
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
uniform vec4 uLamps[${MAX_LAMPS}];
uniform int uLampCount;
uniform vec3 uLampColor;
uniform vec3 uAuraCenter;
uniform float uAuraRadius;
uniform vec3 uAuraColor;
`;

const FRAG_BODY = `
  if (uNight > 0.001) {
    float lampSum = 0.0;
    for (int i = 0; i < ${MAX_LAMPS}; i++) {
      if (i >= uLampCount) break;
      float d = length(vFakeWorldPos - uLamps[i].xyz);
      float f = 1.0 - smoothstep(0.0, uLamps[i].w, d);
      lampSum += f * f;
    }
    reflectedLight.indirectDiffuse += diffuseColor.rgb * uLampColor * min(lampSum, 1.6) * 1.4 * uNight;

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

export function setLamps(points) {
  const arr = fakeLightUniforms.uLamps.value;
  const n = Math.min(points.length, MAX_LAMPS);
  for (let i = 0; i < n; i++) arr[i].set(points[i].x, points[i].y, points[i].z, points[i].radius);
  fakeLightUniforms.uLampCount.value = n;
}
