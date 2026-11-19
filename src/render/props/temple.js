// Ngôi đền dựng bằng code: nền đá, cột gỗ, tường vôi, mái cong. Kiểu phương Đông hư cấu, không biểu tượng tôn giáo.
// condition: 0 = hoang tàn, 1 = đã sửa. Cùng một hình, khác tham số (mái võng/thủng, cột gãy, màu bạc, rêu, gạch vụn).
// Mặt tiền hướng +z (cục bộ).

import * as THREE from 'three';
import { seeded, colored, limb, blob, merge } from './geo.js';

const COL = {
  stone: [0xcfc3aa, 0xb3a994],
  column: [0xa0523d, 0x7d5a4f],
  wall: [0xefe6d2, 0xc9c1ae],
  door: [0x6b4536, 0x4f3c35],
  roof: [0xb5654a, 0x8a6a5c],
  ridge: [0x8e4a37, 0x6e5a52],
  beam: [0x8a4a37, 0x6a5249],
  gatePost: [0x7a5a48, 0x6a5a50], // cổng: gỗ tối, tránh cột đỏ + xà ngang (dễ giống cổng torii)
  moss: 0x7f9a5a,
  rubble: 0xa89f8f,
};
const pickC = (pair, cond) => new THREE.Color(pair[1]).lerp(new THREE.Color(pair[0]), cond).getHex();

// Mái hông có đầu đao cong. Trả về geometry (đã tô màu), bỏ qua một số ô nếu `holes` > 0.
export function curvedRoof({ w, d, h, ridge, lift, sag = 0, ridgeSag = 0, color, edgeColor, holes = 0, rnd = Math.random, moss = 0, mossColor = COL.moss, underside = false, undersideShade = 0.7 }) {
  const N = 6;
  const M = 3;
  const ex = w / 2;
  const ez = d / 2;
  const rx = ridge / 2;
  const parts = [];
  const pos = [];
  const col = [];
  const base = new THREE.Color(color);
  const mossC = new THREE.Color(mossColor);

  // Một mái dốc: cạnh diềm từ e0 → e1, cạnh nóc từ r0 → r1 (nóc có thể suy biến thành điểm)
  function slope(e0, e1, r0, r1) {
    const P = [];
    for (let v = 0; v <= M; v++) {
      const row = [];
      for (let u = 0; u <= N; u++) {
        const tu = u / N;
        const tv = v / M;
        const e = new THREE.Vector3().lerpVectors(e0, e1, tu);
        const r = new THREE.Vector3().lerpVectors(r0, r1, tu);
        const p = new THREE.Vector3().lerpVectors(e, r, tv);
        const side = Math.abs(2 * tu - 1);
        p.y += lift * (1 - tv) ** 2 * side ** 3;          // đầu đao vểnh ở góc
        p.y -= sag * Math.sin(Math.PI * tv) * 0.5;          // mặt mái hơi lõm
        p.y -= ridgeSag * tv * Math.sin(Math.PI * tu);      // nóc võng (hoang tàn)
        row.push(p);
      }
      P.push(row);
    }
    for (let v = 0; v < M; v++) {
      for (let u = 0; u < N; u++) {
        if (holes > 0 && rnd() < holes) continue;
        const c = rnd() < moss ? mossC : base;
        const a = P[v][u]; const b = P[v][u + 1]; const c2 = P[v + 1][u + 1]; const d2 = P[v + 1][u];
        for (const [x, y, z] of [[a, b, c2], [a, c2, d2]]) {
          if (new THREE.Vector3().subVectors(y, x).cross(new THREE.Vector3().subVectors(z, x)).lengthSq() < 1e-10) continue;
          for (const q of [x, y, z]) { pos.push(q.x, q.y, q.z); col.push(c.r, c.g, c.b); }
        }
      }
    }
    // Diềm mái: dải dày dọc cạnh dưới
    const ec = new THREE.Color(edgeColor);
    for (let u = 0; u < N; u++) {
      const a = P[0][u]; const b = P[0][u + 1];
      const a2 = a.clone(); a2.y -= 0.06;
      const b2 = b.clone(); b2.y -= 0.06;
      for (const q of [a, a2, b2, a, b2, b]) { pos.push(q.x, q.y, q.z); col.push(ec.r, ec.g, ec.b); }
    }
  }

  const V = (x, y, z) => new THREE.Vector3(x, y, z);
  slope(V(-ex, 0, ez), V(ex, 0, ez), V(-rx, h, 0), V(rx, h, 0));     // trước
  slope(V(ex, 0, -ez), V(-ex, 0, -ez), V(rx, h, 0), V(-rx, h, 0));   // sau
  slope(V(ex, 0, ez), V(ex, 0, -ez), V(rx, h, 0), V(rx, h, 0));      // phải
  slope(V(-ex, 0, -ez), V(-ex, 0, ez), V(-rx, h, 0), V(-rx, h, 0));  // trái

  // Mặt dưới mái (tam giác đảo chiều, tối hơn) để dùng vật liệu một mặt và gộp chung với thân nhà
  if (underside) {
    const n = pos.length;
    for (let i = 0; i < n; i += 9) {
      for (const k of [0, 6, 3]) {
        pos.push(pos[i + k], pos[i + k + 1] - 0.005, pos[i + k + 2]);
        col.push(col[i + k] * undersideShade, col[i + k + 1] * undersideShade, col[i + k + 2] * undersideShade);
      }
    }
  }
  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
  geo.setAttribute('color', new THREE.Float32BufferAttribute(col, 3));
  parts.push(geo);
  return merge(parts);
}

export function buildTemple({ condition = 1, seed = 11 } = {}) {
  const rnd = seeded(seed);
  const cond = THREE.MathUtils.clamp(condition, 0, 1);
  const ruin = 1 - cond;
  const group = new THREE.Group();
  group.name = 'temple';
  const solid = [];

  // Nền đá hai tầng + bậc lên
  solid.push(colored(new THREE.BoxGeometry(2.7, 0.24, 2.1).translate(0, 0.12, 0), pickC(COL.stone, cond)));
  solid.push(colored(new THREE.BoxGeometry(2.35, 0.14, 1.75).translate(0, 0.31, -0.05), pickC(COL.stone, cond * 0.9 + 0.1)));
  for (let i = 0; i < 3; i++) {
    solid.push(colored(new THREE.BoxGeometry(0.8, 0.12 * (i + 1), 0.16).translate(0, 0.06 * (i + 1), 1.05 + 0.16 * (2 - i) + 0.08), pickC(COL.stone, cond)));
  }
  const y0 = 0.38;

  // Tường điện + cửa
  solid.push(colored(new THREE.BoxGeometry(1.9, 0.72, 1.05).translate(0, y0 + 0.36, -0.18), pickC(COL.wall, cond)));
  [-0.55, 0, 0.55].forEach((x, i) => {
    const broken = ruin > 0.5 && i === 2;
    solid.push(colored(new THREE.BoxGeometry(0.36, broken ? 0.3 : 0.52, 0.02).translate(x, y0 + (broken ? 0.15 : 0.26), 0.35), pickC(COL.door, cond)));
  });

  // Hàng cột hiên trước (hoang tàn: một cột gãy, một cột nghiêng)
  const colH = 0.78;
  [-0.95, -0.32, 0.32, 0.95].forEach((x, i) => {
    let top = new THREE.Vector3(x, y0 + colH, 0.72);
    if (ruin > 0.5 && i === 3) top = new THREE.Vector3(x + 0.03, y0 + colH * 0.45, 0.72);
    if (ruin > 0.5 && i === 0) top = new THREE.Vector3(x - 0.08, y0 + colH * 0.98, 0.78);
    solid.push(colored(limb(new THREE.Vector3(x, y0, 0.72), top, 0.055, 0.05, 6), pickC(COL.column, cond)));
    solid.push(colored(new THREE.CylinderGeometry(0.08, 0.09, 0.05, 6).translate(x, y0 + 0.025, 0.72), pickC(COL.stone, cond)));
  });
  // Xà ngang
  solid.push(colored(new THREE.BoxGeometry(2.05, 0.07, 0.08).translate(0, y0 + colH - 0.02, 0.72), pickC(COL.beam, cond)));

  // Hoang tàn: gạch vụn, rêu cỏ trên nền
  if (ruin > 0.3) {
    for (let i = 0; i < 9; i++) {
      const b = blob(0.06 + rnd() * 0.06, 0, rnd, { sy: 0.6, shape: 'dodeca' });
      b.translate((rnd() - 0.5) * 2.4, 0.4, 0.55 + rnd() * 0.45);
      solid.push(colored(b, COL.rubble));
    }
    for (let i = 0; i < 7; i++) {
      const b = blob(0.07 + rnd() * 0.05, 0, rnd, { sy: 0.6 });
      b.translate((rnd() - 0.5) * 2.5, 0.27 + rnd() * 0.12, (rnd() - 0.5) * 1.9);
      solid.push(colored(b, COL.moss));
    }
  }

  const body = new THREE.Mesh(merge(solid), new THREE.MeshLambertMaterial({ vertexColors: true }));
  body.castShadow = true;
  body.receiveShadow = true;
  group.add(body);

  // Mái
  const roofGeo = curvedRoof({
    w: 2.75, d: 1.95, h: 0.62, ridge: 1.1, lift: 0.2, sag: 0.08,
    ridgeSag: ruin * 0.22, holes: ruin * 0.16, moss: ruin * 0.25,
    color: pickC(COL.roof, cond), edgeColor: pickC(COL.ridge, cond), rnd,
  });
  const roof = new THREE.Mesh(roofGeo, new THREE.MeshLambertMaterial({ vertexColors: true, side: THREE.DoubleSide }));
  roof.position.set(0, y0 + colH + 0.02, -0.05);
  roof.rotation.z = ruin * 0.04;
  roof.castShadow = true;
  roof.receiveShadow = true;
  group.add(roof);

  // Bờ nóc + hai đầu vểnh
  const ridgeParts = [colored(new THREE.BoxGeometry(1.15, 0.07, 0.08).translate(0, 0.62, 0), pickC(COL.ridge, cond))];
  for (const s of [-1, 1]) {
    if (ruin > 0.5 && s === 1) continue; // một đầu nóc rơi mất
    ridgeParts.push(colored(new THREE.ConeGeometry(0.05, 0.22, 5).rotateZ(-s * 0.9).translate(s * 0.6, 0.7, 0), pickC(COL.ridge, cond)));
  }
  const ridgeMesh = new THREE.Mesh(merge(ridgeParts), body.material);
  ridgeMesh.position.copy(roof.position);
  ridgeMesh.position.y -= ruin * 0.2;
  ridgeMesh.rotation.z = roof.rotation.z;
  ridgeMesh.castShadow = true;
  group.add(ridgeMesh);

  // Vị trí đèn lồng treo dưới diềm mái trước (để lớp ánh sáng giả dùng)
  group.userData.lampSpots = cond > 0.5
    ? [new THREE.Vector3(-0.65, y0 + colH - 0.18, 0.86), new THREE.Vector3(0.65, y0 + colH - 0.18, 0.86)]
    : [];
  return group;
}

// Cổng gỗ có mái nhỏ ở đầu lối vào sân đền.
export function buildGate({ condition = 1, seed = 5 } = {}) {
  const rnd = seeded(seed);
  const cond = THREE.MathUtils.clamp(condition, 0, 1);
  const ruin = 1 - cond;
  const group = new THREE.Group();
  group.name = 'gate';
  const parts = [];
  const lean = ruin > 0.5 ? 0.12 : 0;
  for (const s of [-1, 1]) {
    const top = new THREE.Vector3(s * 0.5 + (s === 1 ? lean : 0), 1.0 - (s === 1 ? lean * 0.5 : 0), 0);
    parts.push(colored(limb(new THREE.Vector3(s * 0.5, 0, 0), top, 0.07, 0.06, 6), pickC(COL.gatePost, cond)));
    parts.push(colored(new THREE.BoxGeometry(0.18, 0.1, 0.18).translate(s * 0.5, 0.05, 0), pickC(COL.stone, cond)));
  }
  if (cond > 0.5) parts.push(colored(new THREE.BoxGeometry(1.1, 0.07, 0.1).translate(0, 0.9, 0), pickC(COL.gatePost, cond)));
  group.add(Object.assign(new THREE.Mesh(merge(parts), new THREE.MeshLambertMaterial({ vertexColors: true })), { castShadow: true }));
  if (cond > 0.5) {
    const roof = new THREE.Mesh(
      curvedRoof({ w: 1.5, d: 0.5, h: 0.22, ridge: 0.9, lift: 0.1, sag: 0.03, color: pickC(COL.roof, cond), edgeColor: pickC(COL.ridge, cond), rnd }),
      new THREE.MeshLambertMaterial({ vertexColors: true, side: THREE.DoubleSide }),
    );
    roof.position.y = 0.98;
    roof.castShadow = true;
    group.add(roof);
  }
  group.userData.lampSpots = cond > 0.5 ? [new THREE.Vector3(-0.5, 1.05, 0.15), new THREE.Vector3(0.5, 1.05, 0.15)] : [];
  return group;
}
