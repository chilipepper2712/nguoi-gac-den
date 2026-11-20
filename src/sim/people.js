// Người trên bản đồ: dân làng và nhân vật chính. Dữ liệu thuần trong state.people.
//
// { id, kind: 'villager'|'player', home, look, q, r, path, seg, t, wait, goal }
//   home : chỉ số nhà trong map.village.houses (-1 với nhân vật chính)
//   look : { hair, skin, hairColor, shirt, pants } — chỉ số vào bảng trong CONFIG.people
//   q, r : ô đang đứng (khi không đi) ; path: [[q, r], ...] đường đang đi, seg: đoạn hiện tại, t ∈ [0,1) trên đoạn
//   wait : giây còn đứng yên ; goal: 'home' | 'temple' | 'visit' | 'wander'
// Ban ngày dân đi viếng đền, sang nhà nhau, đi dạo; đêm về nhà (đêm có ma).

import { CONFIG } from '../config.js';
import { key, neighbor, distance } from './hex.js';
import { canStep } from './terrain.js';
import { nextRandom, randomInt } from './rng.js';
import { isNight } from './clock.js';

const P = CONFIG.people;

// BFS trên ô đi được, trả về [[q, r], ...] từ a tới b (gồm cả hai đầu) hoặc null
export function findPath(map, a, b) {
  const start = key(a[0], a[1]);
  const goal = key(b[0], b[1]);
  if (start === goal) return [a];
  const prev = new Map([[start, null]]);
  const queue = [map.tiles[start]];
  while (queue.length) {
    const t = queue.shift();
    for (let d = 0; d < 6; d++) {
      const [nq, nr] = neighbor(t.q, t.r, d);
      const kn = key(nq, nr);
      if (prev.has(kn) || (nq === 0 && nr === 0)) continue; // không đi xuyên điện thờ
      const n = map.tiles[kn];
      if (!n || !canStep(t, n, d)) continue;
      prev.set(kn, key(t.q, t.r));
      if (kn === goal) {
        const path = [];
        for (let k = goal; k; k = prev.get(k)) path.unshift(k.split(',').map(Number));
        return path;
      }
      queue.push(n);
    }
  }
  return null;
}

function lookFor(state) {
  const rnd = (n) => randomInt(state, 0, n - 1);
  return {
    hair: rnd(P.hairStyles),
    skin: rnd(P.skins.length),
    hairColor: rnd(P.hairColors.length),
    shirt: rnd(P.shirts.length),
    pants: rnd(P.pants.length),
  };
}

export function createPeople(state) {
  const people = [];
  const houses = state.map.village ? state.map.village.houses : [];
  houses.forEach((h, i) => {
    const n = randomInt(state, P.perHouse[0], P.perHouse[1]);
    for (let k = 0; k < n; k++) {
      people.push({
        id: people.length, kind: 'villager', home: i, look: lookFor(state),
        q: h.q, r: h.r, path: null, seg: 0, t: 0, wait: nextRandom(state) * P.idle[1], goal: 'home',
      });
    }
  });
  const [pq, pr] = P.playerStart;
  people.push({
    id: people.length, kind: 'player', home: -1, look: { ...P.playerLook },
    q: pq, r: pr, path: null, seg: 0, t: 0, wait: 0, goal: 'idle',
  });
  state.people = people;
  return people;
}

// Chọn điểm đến mới cho một dân làng
function chooseGoal(state, p) {
  const map = state.map;
  const home = map.village.houses[p.home];
  if (isNight(state.clock)) return { goal: 'home', to: [home.q, home.r] };
  const roll = nextRandom(state);
  if (p.goal !== 'home' && roll < P.goHomeChance) return { goal: 'home', to: [home.q, home.r] };
  if (roll < P.goHomeChance + P.templeChance) {
    // Viếng đền: tới một ô sân đền (trừ điện thờ)
    const court = Object.values(map.tiles).filter((t) => { const d = distance(t.q, t.r, 0, 0); return d >= 1 && d <= CONFIG.flora.clearRadius && t.type !== 'water'; });
    const t = court[randomInt(state, 0, court.length - 1)];
    return { goal: 'temple', to: [t.q, t.r] };
  }
  if (roll < 0.85) {
    const h = map.village.houses[randomInt(state, 0, map.village.houses.length - 1)];
    return { goal: 'visit', to: [h.q, h.r] };
  }
  const r = map.village.roads[randomInt(state, 0, map.village.roads.length - 1)];
  return { goal: 'wander', to: [r.q, r.r] };
}

// Đi tiếp trên đường đang có; trả về true khi vừa tới nơi
function advance(p, dt, speed) {
  p.t += (dt * speed) / (CONFIG.terrainView.hexSize * Math.sqrt(3));
  while (p.t >= 1 && p.path) {
    p.t -= 1;
    p.seg += 1;
    if (p.seg >= p.path.length - 1) {
      [p.q, p.r] = p.path[p.path.length - 1];
      p.path = null;
      p.seg = 0;
      p.t = 0;
      return true;
    }
  }
  return false;
}

export function playerOf(state) {
  return state.people.find((p) => p.kind === 'player');
}

// Ra lệnh cho một người đi tới ô (q, r). Ô không tới được (vd ô điện thờ) thì đi tới ô kề gần nhất tới được.
// Đang đi dở thì nối đường mới vào ô kế tiếp, không giật về giữa ô. Trả về ô đích thật, hoặc null nếu không đi được.
export function commandMove(state, id, q, r) {
  const p = state.people.find((x) => x.id === id);
  if (!p) return null;
  const from = p.path ? p.path[Math.min(p.seg + 1, p.path.length - 1)] : [p.q, p.r];
  let path = findPath(state.map, from, [q, r]);
  if (!path) {
    // thử các ô kề đích, lấy đường ngắn nhất
    for (let d = 0; d < 6; d++) {
      const alt = findPath(state.map, from, neighbor(q, r, d));
      if (alt && (!path || alt.length < path.length)) path = alt;
    }
  }
  if (!path) return null;
  if (p.path) {
    p.path = [p.path[p.seg], ...path];
    p.seg = 0;
  } else {
    if (path.length < 2) return path[0];
    p.path = path;
    p.seg = 0;
    p.t = 0;
  }
  p.goal = 'move';
  return path[path.length - 1];
}

// Nhân vật chính đi theo thời gian thật (không nhân tốc độ đồng hồ)
export function tickPlayer(state, dt) {
  const p = playerOf(state);
  if (p && p.path && advance(p, dt, P.playerSpeed)) p.goal = 'idle';
}

export function tickPeople(state, dt) {
  const night = isNight(state.clock);
  for (const p of state.people) {
    if (p.kind !== 'villager') continue;
    if (p.path) {
      if (advance(p, dt, P.speed)) p.wait = P.idle[0] + nextRandom(state) * (P.idle[1] - P.idle[0]);
      continue;
    }
    // Đêm: đang ở ngoài thì về nhà ngay
    const home = state.map.village.houses[p.home];
    const atHome = p.q === home.q && p.r === home.r;
    if (night && !atHome) p.wait = 0;
    if (night && atHome) { p.goal = 'home'; continue; }
    p.wait -= dt;
    if (p.wait > 0) continue;
    const { goal, to } = chooseGoal(state, p);
    const path = findPath(state.map, [p.q, p.r], to);
    if (path && path.length > 1) {
      p.path = path;
      p.seg = 0;
      p.t = 0;
      p.goal = goal;
    } else {
      p.wait = P.idle[0];
    }
  }
}
