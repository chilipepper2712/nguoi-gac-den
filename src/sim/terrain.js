// Sinh bản đồ lục giác có độ cao theo bậc và dốc nối giữa các bậc.
//
// Ô: { q, r, h, type, ramp }
//   h     : bậc cao (0 = nước, 1..maxLevel = đất liền)
//   type  : 'water' | 'grass' | 'dirt' | 'rock' | 'templeGround'
//   ramp  : null hoặc hướng d (0..5). Ô dốc nằm ở bậc h, mặt nghiêng lên tới bậc h+1 về phía hướng d.
//
// Di chuyển: giữa hai ô đất cùng bậc (không phải dốc); hoặc qua dốc theo trục của nó
// (đầu thấp nối ô bậc h ở hướng d+3, đầu cao nối ô bậc h+1 ở hướng d). Chênh bậc khác = vách, không đi được.
// Ô đất không tới được từ đền sau khi đặt dốc thì thành 'rock' (núi).

import { CONFIG } from '../config.js';
import { opposite, key, neighbor, distance, hexesInRadius } from './hex.js';
import { nextRandom } from './rng.js';

const T = CONFIG.terrain;

export function getTile(map, q, r) {
  return map.tiles[key(q, r)];
}

const isLand = (t) => t && t.type !== 'water';

// Hai ô kề nhau (a → b theo hướng d) có đi lại được không.
export function canStep(a, b, d) {
  if (!isLand(a) || !isLand(b) || a.type === 'rock' || b.type === 'rock') return false;
  const back = opposite(d);
  const aOk = a.ramp === null
    ? null
    : (a.ramp === d ? 'high' : a.ramp === back ? 'low' : 'blocked');
  const bOk = b.ramp === null
    ? null
    : (b.ramp === back ? 'high' : b.ramp === d ? 'low' : 'blocked');
  if (aOk === 'blocked' || bOk === 'blocked') return false;
  // Độ cao ở mép chung của a và b
  const aEdge = a.h + (aOk === 'high' ? 1 : 0);
  const bEdge = b.h + (bOk === 'high' ? 1 : 0);
  return aEdge === bEdge;
}

// Các ô tới được từ ô (q0, r0), trả về Set key.
export function reachableFrom(map, q0, r0) {
  const start = getTile(map, q0, r0);
  const seen = new Set();
  if (!isLand(start)) return seen;
  seen.add(key(q0, r0));
  const queue = [start];
  while (queue.length) {
    const t = queue.shift();
    for (let d = 0; d < 6; d++) {
      const [nq, nr] = neighbor(t.q, t.r, d);
      const k = key(nq, nr);
      if (seen.has(k)) continue;
      const n = map.tiles[k];
      if (n && canStep(t, n, d)) {
        seen.add(k);
        queue.push(n);
      }
    }
  }
  return seen;
}

// Value noise 2D có seed, không phụ thuộc thứ tự gọi.
function hash2(seed, x, y) {
  let h = (seed ^ Math.imul(x, 0x27d4eb2d) ^ Math.imul(y, 0x165667b1)) >>> 0;
  h = Math.imul(h ^ (h >>> 15), 0x85ebca6b);
  h = Math.imul(h ^ (h >>> 13), 0xc2b2ae35);
  return ((h ^ (h >>> 16)) >>> 0) / 4294967296;
}

function valueNoise(seed, x, y) {
  const x0 = Math.floor(x);
  const y0 = Math.floor(y);
  const fx = x - x0;
  const fy = y - y0;
  const sx = fx * fx * (3 - 2 * fx);
  const sy = fy * fy * (3 - 2 * fy);
  const a = hash2(seed, x0, y0);
  const b = hash2(seed, x0 + 1, y0);
  const c = hash2(seed, x0, y0 + 1);
  const d = hash2(seed, x0 + 1, y0 + 1);
  return (a + (b - a) * sx) * (1 - sy) + (c + (d - c) * sx) * sy;
}

function fbm(seed, x, y) {
  let v = 0;
  let amp = 0.6;
  let freq = 1;
  for (let o = 0; o < 3; o++) {
    v += amp * valueNoise(seed + o * 1013, x * freq, y * freq);
    amp *= 0.5;
    freq *= 2;
  }
  return v / 1.05;
}

// Sinh map. Dùng RNG trong state (thay đổi state.rngState).
export function generateTerrain(state) {
  const n = T.radius;
  const seed = state.seed >>> 0;
  const tiles = {};

  for (const [q, r] of hexesInRadius(n)) {
    const dist = distance(q, r, 0, 0);
    const edge = dist / n; // 0 ở tâm, 1 ở rìa
    const x = (q + r / 2) * T.noiseScale;
    const y = r * T.noiseScale * 0.866;
    // Đảo: cao ở giữa, thấp dần ra rìa
    const e = fbm(seed, x, y) * T.noiseWeight + (1 - edge * edge) * (1 - T.noiseWeight);
    let h = 0;
    if (e >= T.waterBelow && dist < n) { // vành ngoài cùng luôn là nước
      const k = ((e - T.waterBelow) / (1 - T.waterBelow)) * T.maxLevel * T.levelSpread;
      h = Math.min(T.maxLevel, 1 + Math.floor(k));
    }
    tiles[key(q, r)] = { q, r, h, type: h === 0 ? 'water' : 'grass', ramp: null };
  }

  // Sân đền: phẳng, bậc cố định
  for (const [q, r] of hexesInRadius(T.templeRadius)) {
    const t = tiles[key(q, r)];
    t.h = T.templeLevel;
    t.type = 'templeGround';
  }
  // Vòng ngay quanh sân đền cùng bậc với sân, để đền luôn có lối ra
  for (const [q, r] of hexesInRadius(T.templeRadius + 1)) {
    const t = tiles[key(q, r)];
    if (t.type !== 'templeGround') { t.h = T.templeLevel; t.type = 'grass'; }
  }
  limitCliffs(tiles);

  // Đất trống rải rác
  for (const t of Object.values(tiles)) {
    if (t.type === 'grass' && nextRandom(state) < T.dirtChance) t.type = 'dirt';
  }

  const map = { radius: n, tiles };
  placeRamps(map, state);

  // Ô đất không tới được từ đền → núi đá
  const reach = reachableFrom(map, 0, 0);
  for (const t of Object.values(tiles)) {
    if (isLand(t) && !reach.has(key(t.q, t.r))) {
      t.type = 'rock';
      t.ramp = null;
    }
  }
  return map;
}

// Giới hạn vách: hai ô đất kề nhau chênh nhau tối đa T.maxCliff bậc (hạ ô cao xuống).
function limitCliffs(tiles) {
  let changed = true;
  while (changed) {
    changed = false;
    for (const t of Object.values(tiles)) {
      if (t.type === 'water' || t.type === 'templeGround') continue;
      for (let d = 0; d < 6; d++) {
        const n = tiles[key(...neighbor(t.q, t.r, d))];
        if (isLand(n) && t.h - n.h > T.maxCliff) {
          t.h -= 1;
          changed = true;
        }
      }
    }
  }
}

// Đặt dốc: tham lam, chỉ giữ dốc làm tăng số ô tới được từ đền; sau đó thêm vài dốc trang trí.
function placeRamps(map, state) {
  const tiles = Object.values(map.tiles);
  const candidates = [];
  // Ô dành cho công trình cố định (cây cổ thụ, cổng đền) không được thành dốc
  const fixed = new Set([key(...CONFIG.flora.heroTree), key(...CONFIG.temple.gateHex)]);
  for (const t of tiles) {
    if (t.type === 'water' || t.type === 'templeGround' || fixed.has(key(t.q, t.r))) continue;
    for (let d = 0; d < 6; d++) {
      const up = map.tiles[key(...neighbor(t.q, t.r, d))];
      const down = map.tiles[key(...neighbor(t.q, t.r, opposite(d)))];
      if (isLand(up) && isLand(down) && up.h === t.h + 1 && down.h === t.h && up.ramp === null) {
        candidates.push([t, d]);
      }
    }
  }
  // Xáo trộn có seed
  for (let i = candidates.length - 1; i > 0; i--) {
    const j = Math.floor(nextRandom(state) * (i + 1));
    [candidates[i], candidates[j]] = [candidates[j], candidates[i]];
  }

  // Chỉ nhận dốc nếu tập ô tới được lớn hơn và không làm mất ô nào đã tới được trước đó
  let reached = reachableFrom(map, 0, 0);
  let improved = true;
  while (improved) {
    improved = false;
    for (const [t, d] of candidates) {
      if (t.ramp !== null) continue;
      t.ramp = d;
      const now = reachableFrom(map, 0, 0);
      if (now.size > reached.size && [...reached].every((k) => now.has(k))) {
        reached = now;
        improved = true;
      } else {
        t.ramp = null;
      }
    }
  }
}
