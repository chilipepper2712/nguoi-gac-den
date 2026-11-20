// Khu dân cư quanh đền: nhà, đường đi bộ nối về cổng đền, đèn đường. Dữ liệu thuần trong state.
//
// map.village = {
//   houses: [{ q, r, facing, style: 'flat'|'tile', floors, wide, variant, level, paint, accent, sign }],
//   roads:  [{ q, r }]   theo thứ tự mở đường (ô đầu là cổng đền)
//   lamps:  [{ q, r }]   đèn đường (nằm trên ô đường)
// }
// facing: hướng d (0..5) từ ô nhà ra ô đường liền kề — mặt tiền nhà quay về hướng đó.

import { CONFIG } from '../config.js';
import { key, neighbor, distance } from './hex.js';
import { canStep, reachableFrom } from './terrain.js';
import { nextRandom } from './rng.js';

const V = CONFIG.village;

// Tìm đường ngắn nhất từ ô start tới một ô bất kỳ trong `goal` (Set key), tránh `blocked`.
export function pathToNetwork(map, start, goal, blocked) {
  const prev = new Map([[key(start.q, start.r), null]]);
  const queue = [start];
  while (queue.length) {
    const t = queue.shift();
    const kt = key(t.q, t.r);
    if (goal.has(kt) && t !== start) {
      const path = [t];
      let k = prev.get(kt);
      while (k) { path.unshift(map.tiles[k]); k = prev.get(k); }
      return path; // path[0] = start
    }
    for (let d = 0; d < 6; d++) {
      const [nq, nr] = neighbor(t.q, t.r, d);
      const kn = key(nq, nr);
      if (prev.has(kn) || blocked.has(kn)) continue;
      const n = map.tiles[kn];
      if (n && canStep(t, n, d)) {
        prev.set(kn, kt);
        queue.push(n);
      }
    }
  }
  return null;
}

// Số ô đất mạng đường với tới được (đi bộ, tránh blocked) — dùng để không đặt nhà ở chỗ thắt nút
function reachCount(map, sources, blocked) {
  const seen = new Set();
  const queue = [];
  for (const k of sources) { if (!blocked.has(k) && map.tiles[k]) { seen.add(k); queue.push(map.tiles[k]); } }
  while (queue.length) {
    const t = queue.shift();
    for (let d = 0; d < 6; d++) {
      const [nq, nr] = neighbor(t.q, t.r, d);
      const kn = key(nq, nr);
      if (seen.has(kn) || blocked.has(kn)) continue;
      const n = map.tiles[kn];
      if (n && canStep(t, n, d)) { seen.add(kn); queue.push(n); }
    }
  }
  return seen.size;
}

function dirTo(a, b) {
  for (let d = 0; d < 6; d++) {
    const [q, r] = neighbor(a.q, a.r, d);
    if (q === b.q && r === b.r) return d;
  }
  return -1;
}

export function generateVillage(state) {
  const map = state.map;
  const rnd = () => nextRandom(state);
  const [gq, gr] = CONFIG.temple.gateHex;
  const gate = map.tiles[key(gq, gr)];
  const [cq, cr] = V.center;
  const reach = reachableFrom(map, 0, 0);

  // Ô cấm đi qua: chỉ ô điện thờ chính giữa (vòng sân quanh nó vẫn đi vòng được).
  // Ô cây cổ thụ đi qua được (có seed nó là lối duy nhất ra khu phía trước) nhưng không đặt nhà.
  const blocked = new Set([key(0, 0)]);
  const [hq, hr] = CONFIG.flora.heroTree;
  const noHouse = new Set([key(hq, hr)]);

  const candidates = Object.values(map.tiles)
    .filter((t) => (t.type === 'grass' || t.type === 'dirt') && t.ramp === null && reach.has(key(t.q, t.r)))
    .filter((t) => { const dd = distance(t.q, t.r, 0, 0); return dd >= V.minDist && dd <= V.maxDist; })
    .filter((t) => !blocked.has(key(t.q, t.r)) && !noHouse.has(key(t.q, t.r)))
    .map((t) => ({ t, score: distance(t.q, t.r, cq, cr) + V.levelPenalty * Math.abs(t.h - CONFIG.terrain.templeLevel) + rnd() * 0.5 }))
    .sort((a, b) => a.score - b.score)
    .map((x) => x.t);

  // Mạng đường ban đầu: cả sân đền (bán kính clearRadius) là chỗ đi lại được, nhưng không vẽ thành đường
  const roads = [gate];
  const roadSet = new Set([key(gate.q, gate.r)]);
  for (const t of Object.values(map.tiles)) {
    const kt = key(t.q, t.r);
    if (t.type !== 'water' && distance(t.q, t.r, 0, 0) <= CONFIG.flora.clearRadius && !blocked.has(kt)) roadSet.add(kt);
  }
  const houses = [];
  // Tham lam: mỗi lần xét nhóm ứng viên điểm tốt nhất, chọn ô có đường nối ngắn nhất về mạng đường → làng mọc thành cụm
  const score = new Map(candidates.map((t, i) => [t, i]));
  let pool = candidates;
  while (houses.length < V.houses && pool.length) {
    // Chi phí = độ dài đường nối mới + độ lệch khỏi tâm làng (thứ hạng điểm) → làng mọc gọn từ lối ra của sân
    const ranked = [];
    for (const t of pool) {
      const kt = key(t.q, t.r);
      if (roadSet.has(kt) || blocked.has(kt)) continue;
      const path = pathToNetwork(map, t, roadSet, blocked);
      if (!path || path.length < 2) continue;
      ranked.push({ t, path, cost: path.length + V.centerPull * score.get(t) / candidates.length * 10 });
    }
    ranked.sort((a, b) => a.cost - b.cost);
    // Bỏ ứng viên làm đứt lối: số ô với tới được chỉ được giảm đúng 1 (chính ô nhà)
    const base = reachCount(map, roadSet, blocked);
    let best = null;
    for (const c of ranked) {
      const kt = key(c.t.q, c.t.r);
      blocked.add(kt);
      const after = reachCount(map, roadSet, blocked);
      blocked.delete(kt);
      if (after >= base - 1) { best = c; break; }
    }
    if (!best) break;
    const { t, path } = best;
    pool = pool.filter((x) => x !== t);
    blocked.add(key(t.q, t.r));
    for (const p of path.slice(1)) {
      const kp = key(p.q, p.r);
      if (!roadSet.has(kp)) { roadSet.add(kp); roads.push(p); }
    }
    pool = pool.filter((x) => !roadSet.has(key(x.q, x.r)));
    const style = rnd() < V.flatRoofShare ? 'flat' : 'tile';
    houses.push({
      q: t.q, r: t.r, facing: dirTo(t, path[1]),
      style,
      floors: style === 'flat' && rnd() < V.twoFloorShare ? 2 : 1,
      wide: style === 'flat' && rnd() < V.wideShare,
      variant: Math.floor(rnd() * 3),
      level: rnd() < V.thatchShare ? 0 : rnd() < 0.5 ? 1 : 2,
      paint: Math.floor(rnd() * V.paints.length),
      accent: Math.floor(rnd() * V.accents.length),
      sign: null,
    });
  }
  // Bảng hiệu: ưu tiên nhà gần cổng
  const byGate = [...houses].sort((a, b) => distance(a.q, a.r, gq, gr) - distance(b.q, b.r, gq, gr));
  let signIdx = Math.floor(rnd() * V.signs.length);
  for (const h of byGate) {
    if (rnd() < V.shopShare) { h.sign = signIdx % V.signs.length; signIdx += 1; }
  }

  const lamps = roads.filter((t, i) => i > 0 && i % V.lampEvery === 0 && t.ramp === null).map((t) => ({ q: t.q, r: t.r }));
  map.village = { houses, roads: roads.map((t) => ({ q: t.q, r: t.r })), lamps };
  return map.village;
}

// Tập key các ô bị khu dân cư chiếm (nhà + đường), để rải cây tránh ra
export function villageTiles(map) {
  const s = new Set();
  if (!map.village) return s;
  for (const h of map.village.houses) s.add(key(h.q, h.r));
  for (const r of map.village.roads) s.add(key(r.q, r.r));
  return s;
}
