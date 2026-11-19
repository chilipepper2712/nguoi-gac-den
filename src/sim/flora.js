// Cây cỏ, đá trên bản đồ. Dữ liệu thuần, nằm trong state để sau này dọn dẹp / xây dựng đụng tới.
//
// map.flora: [{ q, r, kind, variant, dx, dz, rot, s }]
//   kind    : 'tree' | 'bush' | 'rock' | 'small' (cỏ, hoa, nấm, gốc cây)
//   variant : chỉ số trong CONFIG.flora.models[kind]
//   dx, dz  : lệch khỏi tâm ô, tính theo cạnh ô (|dx|,|dz| < ~0.5)
//   rot, s  : xoay quanh trục đứng (rad), tỉ lệ
// map.landmarks: [{ kind: 'heroTree', q, r }]

import { CONFIG } from '../config.js';
import { distance } from './hex.js';
import { nextRandom } from './rng.js';

const F = CONFIG.flora;
const count = (kind) => F.models[kind].length;

// Nhiễu giá trị đơn giản theo seed, dùng để gom cây thành cụm rừng.
function hash(seed, x, y) {
  let h = (seed ^ Math.imul(x, 0x27d4eb2d) ^ Math.imul(y, 0x165667b1)) >>> 0;
  h = Math.imul(h ^ (h >>> 15), 0x85ebca6b);
  h = Math.imul(h ^ (h >>> 13), 0xc2b2ae35);
  return ((h ^ (h >>> 16)) >>> 0) / 4294967296;
}
function smoothNoise(seed, x, y) {
  const x0 = Math.floor(x); const y0 = Math.floor(y);
  const fx = x - x0; const fy = y - y0;
  const sx = fx * fx * (3 - 2 * fx); const sy = fy * fy * (3 - 2 * fy);
  const a = hash(seed, x0, y0); const b = hash(seed, x0 + 1, y0);
  const c = hash(seed, x0, y0 + 1); const d = hash(seed, x0 + 1, y0 + 1);
  return (a + (b - a) * sx) * (1 - sy) + (c + (d - c) * sx) * sy;
}

// Các ô dành sẵn, không rải cây: sân đền + vòng quanh, ô dốc, ô cây cổ thụ.
function reserved(map, t) {
  if (distance(t.q, t.r, 0, 0) <= F.clearRadius) return true;
  if (t.ramp !== null) return true;
  return map.landmarks.some((l) => l.q === t.q && l.r === t.r);
}

export function generateFlora(state) {
  const map = state.map;
  const seed = (state.seed ^ 0x5bd1e995) >>> 0;
  map.landmarks = [{ kind: 'heroTree', q: F.heroTree[0], r: F.heroTree[1] }];
  map.flora = [];

  const rnd = () => nextRandom(state);
  // Chỗ đặt trong ô: tối đa 3 vị trí cách đều, xoay ngẫu nhiên, để cây không chồng lên nhau
  const spots = (n) => {
    const base = rnd() * Math.PI * 2;
    if (n === 1) return [[(rnd() - 0.5) * 0.3, (rnd() - 0.5) * 0.3]];
    return Array.from({ length: n }, (_, i) => {
      const a = base + (i / n) * Math.PI * 2;
      const rad = F.spotRadius * (0.8 + rnd() * 0.3);
      return [Math.cos(a) * rad, Math.sin(a) * rad];
    });
  };

  const tiles = Object.values(map.tiles).sort((a, b) => a.q - b.q || a.r - b.r);
  for (const t of tiles) {
    if (t.type === 'water' || reserved(map, t)) continue;

    if (t.type === 'rock') {
      for (const [dx, dz] of spots(1 + Math.floor(rnd() * 2))) {
        map.flora.push({ q: t.q, r: t.r, kind: 'rock', variant: Math.floor(rnd() * count('rock')), dx, dz, rot: rnd() * 6.283, s: 0.8 + rnd() * 0.5 });
      }
      continue;
    }

    const x = (t.q + t.r / 2) * F.forestScale;
    const y = t.r * F.forestScale * 0.866;
    const forest = smoothNoise(seed, x, y);
    const isDirt = t.type === 'dirt';
    let n = 0;
    if (!isDirt && forest > F.forestAbove) n = forest > F.denseAbove ? 3 : 2;
    else if (rnd() < (isDirt ? F.dirtTreeChance : F.lonelyTreeChance)) n = 1;

    for (const [dx, dz] of spots(Math.max(n, 1))) {
      if (n === 0) {
        // Ô trống: thỉnh thoảng có bụi hoặc đá nhỏ
        const roll = rnd();
        if (roll < F.bushChance) map.flora.push({ q: t.q, r: t.r, kind: 'bush', variant: Math.floor(rnd() * count('bush')), dx, dz, rot: rnd() * 6.283, s: 0.8 + rnd() * 0.4 });
        else if (roll < F.bushChance + F.rockChance) map.flora.push({ q: t.q, r: t.r, kind: 'rock', variant: 2 + Math.floor(rnd() * 2), dx, dz, rot: rnd() * 6.283, s: 0.8 + rnd() * 0.5 });
        else if (roll < F.bushChance + F.rockChance + F.smallChance) map.flora.push({ q: t.q, r: t.r, kind: 'small', variant: Math.floor(rnd() * count('small')), dx, dz, rot: rnd() * 6.283, s: 0.8 + rnd() * 0.4 });
        continue;
      }
      // Bậc cao nghiêng về cây lá kim
      let variant = Math.floor(rnd() * count('tree'));
      if (t.h >= 3 && rnd() < 0.5) variant = F.pineVariants[Math.floor(rnd() * F.pineVariants.length)];
      map.flora.push({ q: t.q, r: t.r, kind: 'tree', variant, dx, dz, rot: rnd() * 6.283, s: 0.8 + rnd() * 0.45 });
    }
  }
  return map.flora;
}

export function floraAt(map, q, r) {
  return map.flora.filter((f) => f.q === q && f.r === r);
}

