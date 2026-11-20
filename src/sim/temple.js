// Khu đền: đồ đổ nát chia 3 khu để dọn, việc dọn của nhân vật chính, chỉ số đền.
// Logic thuần. Toạ độ đồ đổ nát lưu theo hệ cục bộ của đền (mặt tiền +z), quy ra thế giới bằng temple.rotation.
//
// state.temple = { condition, debris: [{ id, model, lx, lz, rot, zone, work, done }], zonesDone: [bool, bool, bool] }
// state.stats  = { money, power, prestige }   — tiền, pháp lực, uy tín
// state.events = [{ type, ... }]              — sự kiện cho giao diện đọc rồi xoá (vd "cleaned", "zoneDone")
// Người có việc: person.task = { kind: 'clean', id, progress, active }

import { CONFIG } from '../config.js';
import { worldToHex, distance } from './hex.js';
import { commandMove } from './people.js';

const C = CONFIG.cleanup;

// Khu theo vị trí cục bộ: 0 trước-trái, 1 trước-phải, 2 phía sau
export function zoneOf(lx, lz) {
  if (lz <= 0) return 2;
  return lx < 0 ? 0 : 1;
}

export function createTempleState() {
  return {
    condition: 0,
    debris: CONFIG.temple.ruinDebris.map(([model, lx, lz, rot], id) => ({
      id, model, lx, lz, rot, zone: zoneOf(lx, lz), work: C.workSec[model] ?? C.workSec.default, done: false,
    })),
    zonesDone: [false, false, false],
  };
}

export function createStats() {
  return { money: CONFIG.economy.startMoney, power: 0, prestige: 0 };
}

// Toạ độ thế giới (x, z) của một món đồ đổ nát
export function debrisWorld(d) {
  const a = CONFIG.temple.rotation;
  return [d.lx * Math.cos(a) + d.lz * Math.sin(a), -d.lx * Math.sin(a) + d.lz * Math.cos(a)];
}

export function debrisTile(d) {
  const [x, z] = debrisWorld(d);
  return worldToHex(x, z, CONFIG.terrainView.hexSize);
}

export function zoneProgress(temple, zone) {
  const list = temple.debris.filter((d) => d.zone === zone);
  return list.filter((d) => d.done).length / Math.max(1, list.length);
}

// Chạm vào đồ đổ nát: đi tới chỗ đó rồi dọn. Trả về false nếu không với tới.
export function commandClean(state, personId, debrisId) {
  const p = state.people.find((x) => x.id === personId);
  const d = state.temple.debris.find((x) => x.id === debrisId);
  if (!p || !d || d.done) return false;
  const [q, r] = debrisTile(d);
  const dest = commandMove(state, personId, q, r);
  if (!dest) return false;
  p.task = { kind: 'clean', id: debrisId, progress: 0, active: false };
  return true;
}

// Việc đang làm của mọi người có task (hiện chỉ nhân vật chính)
export function tickTasks(state, dt) {
  for (const p of state.people) {
    const task = p.task;
    if (!task) continue;
    if (p.path) { task.active = false; continue; } // còn đang đi tới
    const d = state.temple.debris.find((x) => x.id === task.id);
    if (!d || d.done) { p.task = null; continue; }
    const [q, r] = debrisTile(d);
    if (distance(p.q, p.r, q, r) > C.reach) { p.task = null; continue; } // không với tới (đường bị chặn)
    task.active = true;
    task.progress += dt;
    if (task.progress < d.work) continue;
    d.done = true;
    p.task = null;
    state.stats.power += C.powerPerItem;
    const [x, z] = debrisWorld(d);
    state.events.push({ type: 'cleaned', id: d.id, x, z, power: C.powerPerItem });
    if (!state.temple.zonesDone[d.zone] && zoneProgress(state.temple, d.zone) >= 1) {
      state.temple.zonesDone[d.zone] = true;
      state.stats.power += C.powerPerZone;
      state.stats.prestige += C.prestigePerZone;
      state.events.push({ type: 'zoneDone', zone: d.zone, power: C.powerPerZone, prestige: C.prestigePerZone });
    }
  }
}

// Bán kính vùng pháp lực theo pháp lực hiện có
export function auraRadius(stats) {
  const A = CONFIG.aura;
  const k = Math.max(0, Math.min(1, stats.power / A.fullPower));
  return A.minRadius + (A.maxRadius - A.minRadius) * k;
}
