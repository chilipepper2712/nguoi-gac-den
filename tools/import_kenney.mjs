// Nhập model Kenney (CC0) và tô lại theo bảng màu của game.
// Đầu ra: GLB một primitive, không index, mỗi mặt một màu (COLOR_0), không texture, gốc ở đáy-tâm.
//
//   node tools/import_kenney.mjs --kit nature   --src "<thư mục GLB>" --out assets/kenney/nature   tree_oak rock_largeA ...
//   node tools/import_kenney.mjs --kit survival --src "<thư mục GLB>" --out assets/kenney/survival tree-log barrel ...
//
// nature   : vật liệu có tên + màu phẳng → ánh xạ theo tên (NATURE).
// survival / hexagon : texture atlas 'colormap' 512×512, hàng A (y 256–383) và hàng B (y 384–511), mỗi hàng 16 ô rộng 32px
//            → xác định ô của từng mặt rồi ánh xạ theo ATLAS.
// Bảng màu đích lấy theo bảng màu game (src/render/flora.js, props/temple.js). Đổi bảng màu thì sửa ở đây và nhập lại.

import { NodeIO, Document } from '@gltf-transform/core';
import { ALL_EXTENSIONS } from '@gltf-transform/extensions';
import { flatten, clearNodeTransform } from '@gltf-transform/functions';
import { PNG } from 'pngjs';
import { mkdirSync } from 'node:fs';
import { join } from 'node:path';

const NATURE = {
  leafsGreen: 0x9cc46a,
  leafsDark: 0x6f9e5a,
  leafsFall: 0xd9a35f,
  woodBark: 0x9b7f74,
  woodBarkDark: 0x8c7268,
  woodInner: 0xd9c4a0,
  wood: 0xb08a6e,
  grass: 0x8fbb64,
  dirt: 0xb89a74,
  dirtDark: 0x9d8162,
  stone: 0xc2bbb0,
  stoneDark: 0xa39c92,
  colorRed: 0xe98f86,
  colorYellow: 0xf2d27a,
  colorPurple: 0xb79ad6,
  colorTan: 0xe6c9a0,
  colorOrange: 0xe3a46f,
  colorBlue: 0x9fb4cf,
  _defaultMat: 0xf4efe4,
};

// [hàng A, hàng B] × 16 cột
const ATLAS = [
  [0x8fbb64, 0x6f9e5a, 0xc46a55, 0xb5654a, 0xd98f5c, 0xe3a46f, 0x7f8fa8, 0x6f7e98, 0x7f8fa8, 0x6f7e98, 0xb9c6d4, 0xa8b6c6, 0xa596bf, 0x8f80ab, 0x333333, 0x333333],
  [0x5d5650, 0x4f4945, 0xa39c92, 0x8f887e, 0xb5aea4, 0xc2bbb0, 0xefe6d2, 0xe6dcc8, 0xc9a582, 0xb08a6e, 0x9b7f74, 0x8c7268, 0xd9c4a0, 0xcdb38c, 0xefe6d2, 0xe6dcc8],
];

const args = process.argv.slice(2);
const opt = (n) => { const i = args.indexOf(`--${n}`); return i >= 0 ? args.splice(i, 2)[1] : null; };
const kit = opt('kit');
const src = opt('src');
const out = opt('out');
const names = args;
if (!kit || !src || !out || !names.length) {
  console.error('Thiếu tham số. Xem đầu file.');
  process.exit(1);
}
mkdirSync(out, { recursive: true });

const toLin = (c) => { c /= 255; return c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4; };
const hexLin = (h) => [toLin((h >> 16) & 255), toLin((h >> 8) & 255), toLin(h & 255)];
const pngTrim = (b) => { const buf = Buffer.from(b); const i = buf.indexOf('IEND'); return i > 0 ? buf.subarray(0, i + 8) : buf; };

const io = new NodeIO().registerExtensions(ALL_EXTENSIONS);
const unknown = new Set();

for (const name of names) {
  const doc = await io.read(join(src, `${name}.glb`));
  await doc.transform(flatten());
  for (const node of doc.getRoot().listNodes()) if (node.getMesh()) clearNodeTransform(node);

  const P = [];
  const C = [];
  for (const mesh of doc.getRoot().listMeshes()) {
    for (const prim of mesh.listPrimitives()) {
      const mat = prim.getMaterial();
      const pos = prim.getAttribute('POSITION').getArray();
      const idx = prim.getIndices() ? prim.getIndices().getArray() : [...Array(pos.length / 3).keys()];
      const tex = mat && mat.getBaseColorTexture();
      let img = null;
      let uv = null;
      if (tex) {
        img = PNG.sync.read(pngTrim(tex.getImage()));
        uv = prim.getAttribute('TEXCOORD_0').getArray();
      }
      const matColor = () => {
        const n = mat ? mat.getName() : '_defaultMat';
        if (!(n in NATURE)) unknown.add(n);
        return hexLin(NATURE[n] ?? NATURE._defaultMat);
      };
      for (let t = 0; t < idx.length; t += 3) {
        const [a, b, c] = [idx[t], idx[t + 1], idx[t + 2]];
        let col;
        if (img) {
          const u = (uv[a * 2] + uv[b * 2] + uv[c * 2]) / 3;
          const v = (uv[a * 2 + 1] + uv[b * 2 + 1] + uv[c * 2 + 1]) / 3;
          const x = Math.min(img.width - 1, Math.max(0, Math.floor((u - Math.floor(u)) * img.width)));
          const y = Math.min(img.height - 1, Math.max(0, Math.floor((v - Math.floor(v)) * img.height)));
          const col16 = Math.floor(x / (img.width / 16));
          const row = y >= img.height * 0.75 ? 1 : 0;
          col = hexLin(ATLAS[row][col16]);
        } else {
          col = matColor();
        }
        for (const k of [a, b, c]) {
          P.push(pos[k * 3], pos[k * 3 + 1], pos[k * 3 + 2]);
          C.push(...col);
        }
      }
    }
  }

  // Gốc ở đáy, tâm theo x/z
  let minY = Infinity; let minX = Infinity; let maxX = -Infinity; let minZ = Infinity; let maxZ = -Infinity; let maxY = -Infinity;
  for (let i = 0; i < P.length; i += 3) {
    minX = Math.min(minX, P[i]); maxX = Math.max(maxX, P[i]);
    minY = Math.min(minY, P[i + 1]); maxY = Math.max(maxY, P[i + 1]);
    minZ = Math.min(minZ, P[i + 2]); maxZ = Math.max(maxZ, P[i + 2]);
  }
  const cx = (minX + maxX) / 2;
  const cz = (minZ + maxZ) / 2;
  for (let i = 0; i < P.length; i += 3) { P[i] -= cx; P[i + 1] -= minY; P[i + 2] -= cz; }

  const nd = new Document();
  const buf = nd.createBuffer();
  const material = nd.createMaterial('flat').setBaseColorFactor([1, 1, 1, 1]).setRoughnessFactor(1).setMetallicFactor(0);
  const prim = nd.createPrimitive().setMaterial(material)
    .setAttribute('POSITION', nd.createAccessor().setType('VEC3').setArray(new Float32Array(P)).setBuffer(buf))
    .setAttribute('COLOR_0', nd.createAccessor().setType('VEC3').setArray(new Float32Array(C)).setBuffer(buf));
  nd.createScene().addChild(nd.createNode().setMesh(nd.createMesh().addPrimitive(prim)));
  await new NodeIO().write(join(out, `${name}.glb`), nd);
  console.log(`${name.padEnd(24)} ${String(P.length / 9).padStart(5)} tam giác  cao ${(maxY - minY).toFixed(2)}  rộng ${(maxX - minX).toFixed(2)}×${(maxZ - minZ).toFixed(2)}`);
}
if (unknown.size) console.warn('Vật liệu chưa có trong bảng NATURE (dùng màu mặc định):', [...unknown].join(', '));
