// Chuyển mô hình AI (GLB có texture) thành asset low-poly màu phẳng đúng bảng màu của game.
// Các bước: hàn đỉnh → giảm tam giác (meshoptimizer) → lấy màu texture theo từng mặt
// → gom màu (k-means) hoặc ép về bảng màu cho trước → xuất GLB không texture, mỗi mặt một màu.
//
//   node tools/flatten_glb.mjs in.glb out.glb --ratio 0.2 --palette "8c7268,9b7f74,a88c80;98b56f,a9c27e,b8cd8c"
//   --ratio   tỉ lệ tam giác giữ lại (mặc định 0.25)
//   --error   sai số hình học cho phép khi giảm (mặc định 0.01)
//   --colors  số màu khi không có --palette (mặc định 7)
//   --palette các nhóm vật liệu ngăn bởi ';', mỗi nhóm các màu hex xếp tối → sáng
//
// Cần: npm install (devDependencies).
import { NodeIO, Document } from '@gltf-transform/core';
import { ALL_EXTENSIONS } from '@gltf-transform/extensions';
import { weld, simplify, flatten, clearNodeTransform } from '@gltf-transform/functions';
import { MeshoptSimplifier } from 'meshoptimizer';
import { PNG } from 'pngjs';
import jpeg from 'jpeg-js';

const [,, inp, out, ...rest] = process.argv;
const opt = (n, d) => { const i = rest.indexOf('--' + n); return i >= 0 ? Number(rest[i + 1]) : d; };
const RATIO = opt('ratio', 0.25), K = opt('colors', 7), ERR = opt('error', 0.01);

const io = new NodeIO().registerExtensions(ALL_EXTENSIONS);
const doc = await io.read(inp);
await MeshoptSimplifier.ready;
// Đưa phép biến đổi của node (xoay/scale, ví dụ đổi trục Z-up → Y-up) vào thẳng toạ độ đỉnh
await doc.transform(flatten());
for (const node of doc.getRoot().listNodes()) if (node.getMesh()) clearNodeTransform(node);
await doc.transform(weld(), simplify({ simplifier: MeshoptSimplifier, ratio: RATIO, error: ERR }));

const prim = doc.getRoot().listMeshes()[0].listPrimitives()[0];
const tex = doc.getRoot().listMaterials()[0].getBaseColorTexture();
const bytes = tex.getImage();
const pngTrim = (b) => { const buf = Buffer.from(b); const i = buf.indexOf('IEND'); return i > 0 ? buf.subarray(0, i + 8) : buf; };
const img = tex.getMimeType() === 'image/png' ? PNG.sync.read(pngTrim(bytes)) : jpeg.decode(bytes, { useTArray: true });
const { width: W, height: H, data } = img;
const sample = (u, v) => {
  const x = Math.min(W - 1, Math.max(0, Math.floor((u - Math.floor(u)) * W)));
  const y = Math.min(H - 1, Math.max(0, Math.floor((v - Math.floor(v)) * H)));
  const i = (y * W + x) * 4;
  return [data[i], data[i + 1], data[i + 2]];
};

const pos = prim.getAttribute('POSITION').getArray();
const uv = prim.getAttribute('TEXCOORD_0').getArray();
const idx = prim.getIndices().getArray();
const nTri = idx.length / 3;

// Màu mỗi mặt: trung bình 4 điểm (tâm + 3 đỉnh kéo vào trong)
const faceCol = [];
for (let t = 0; t < nTri; t++) {
  const [a, b, c] = [idx[t * 3], idx[t * 3 + 1], idx[t * 3 + 2]];
  const cu = (uv[a * 2] + uv[b * 2] + uv[c * 2]) / 3, cv = (uv[a * 2 + 1] + uv[b * 2 + 1] + uv[c * 2 + 1]) / 3;
  let s = [0, 0, 0];
  for (const [u, v] of [[cu, cv], ...[a, b, c].map((k) => [uv[k * 2] * 0.5 + cu * 0.5, uv[k * 2 + 1] * 0.5 + cv * 0.5])]) {
    const p = sample(u, v); s = s.map((x, i) => x + p[i] / 4);
  }
  faceCol.push(s);
}

// k-means trên màu mặt (sRGB 0..255)
let centers = Array.from({ length: K }, (_, i) => faceCol[Math.floor((i + 0.5) * nTri / K)].slice());
const assign = new Int32Array(nTri);
for (let it = 0; it < 20; it++) {
  for (let t = 0; t < nTri; t++) {
    let best = 0, bd = Infinity;
    centers.forEach((c, j) => { const d = (c[0] - faceCol[t][0]) ** 2 + (c[1] - faceCol[t][1]) ** 2 + (c[2] - faceCol[t][2]) ** 2; if (d < bd) { bd = d; best = j; } });
    assign[t] = best;
  }
  const sum = centers.map(() => [0, 0, 0, 0]);
  for (let t = 0; t < nTri; t++) { const s = sum[assign[t]]; s[0] += faceCol[t][0]; s[1] += faceCol[t][1]; s[2] += faceCol[t][2]; s[3]++; }
  centers = sum.map((s, j) => s[3] ? [s[0] / s[3], s[1] / s[3], s[2] / s[3]] : centers[j]);
}

// --palette "8c7268,9b7f74,a88c80;98b56f,a9c27e,b8cd8c": mỗi nhóm (ngăn bởi ;) một vật liệu, xếp tối → sáng.
// Mặt được gán nhóm theo sắc độ gần nhất, rồi theo độ sáng tương đối trong nhóm.
const palArg = (() => { const i = rest.indexOf('--palette'); return i >= 0 ? rest[i + 1] : null; })();
let finalCol = (t) => centers[assign[t]];
if (palArg) {
  const groups = palArg.split(';').map((g) => g.split(',').map((h) => [0, 2, 4].map((k) => parseInt(h.slice(k, k + 2), 16))));
  const hsv = ([r, g, b]) => { r /= 255; g /= 255; b /= 255; const mx = Math.max(r, g, b), mn = Math.min(r, g, b), d = mx - mn;
    let h = 0; if (d) h = mx === r ? ((g - b) / d) % 6 : mx === g ? (b - r) / d + 2 : (r - g) / d + 4;
    return [(h * 60 + 360) % 360, mx ? d / mx : 0, mx]; };
  const hueDist = (a, b) => { const d = Math.abs(a - b) % 360; return Math.min(d, 360 - d); };
  const gHue = groups.map((g) => hsv(g.map((c) => c).reduce((s, c) => s.map((x, i) => x + c[i] / g.length), [0, 0, 0]))[0]);
  const gid = faceCol.map((c) => { const h = hsv(c); let best = 0; gHue.forEach((gh, j) => { if (hueDist(h[0], gh) < hueDist(h[0], gHue[best])) best = j; }); return h[1] < 0.08 ? best : best; });
  const shade = new Int32Array(nTri);
  groups.forEach((g, j) => {
    const ids = [...Array(nTri).keys()].filter((t) => gid[t] === j).sort((a, b) => hsv(faceCol[a])[2] - hsv(faceCol[b])[2]);
    ids.forEach((t, r) => { shade[t] = Math.min(g.length - 1, Math.floor((r / ids.length) * g.length)); });
  });
  finalCol = (t) => groups[gid[t]][shade[t]];
}

// Xuất: không index, mỗi mặt một màu, không texture
const toLin = (x) => { x /= 255; return x <= 0.04045 ? x / 12.92 : ((x + 0.055) / 1.055) ** 2.4; };
const P = new Float32Array(nTri * 9), C = new Float32Array(nTri * 9);
for (let t = 0; t < nTri; t++) {
  const col = finalCol(t).map(toLin);
  for (let k = 0; k < 3; k++) {
    const v = idx[t * 3 + k];
    P.set([pos[v * 3], pos[v * 3 + 1], pos[v * 3 + 2]], t * 9 + k * 3);
    C.set(col, t * 9 + k * 3);
  }
}
const nd = new Document();
const buf = nd.createBuffer();
const mat = nd.createMaterial('flat').setBaseColorFactor([1, 1, 1, 1]).setRoughnessFactor(1).setMetallicFactor(0);
const np = nd.createPrimitive().setMaterial(mat)
  .setAttribute('POSITION', nd.createAccessor().setType('VEC3').setArray(P).setBuffer(buf))
  .setAttribute('COLOR_0', nd.createAccessor().setType('VEC3').setArray(C).setBuffer(buf));
nd.createScene().addChild(nd.createNode().setMesh(nd.createMesh().addPrimitive(np)));
await new NodeIO().write(out, nd);
console.log(`${inp.split('/').pop()}: ${nTri} tam giác, ${K} màu:`, centers.map((c) => '#' + c.map((x) => Math.round(x).toString(16).padStart(2, '0')).join('')).join(' '));
