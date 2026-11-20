import { test } from 'node:test';
import assert from 'node:assert/strict';

import { createState } from '../src/sim/state.js';
import { commandClean, tickTasks, debrisTile, zoneProgress, auraRadius } from '../src/sim/temple.js';
import { tickPlayer, playerOf } from '../src/sim/people.js';
import { CONFIG } from '../src/config.js';

const run = (s, sec) => { for (let i = 0; i < sec / 0.05; i++) { tickPlayer(s, 0.05); tickTasks(s, 0.05); } };

test('đồ đổ nát chia đủ 3 khu, khu nào cũng có việc', () => {
  const s = createState({ seed: 1 });
  for (const z of [0, 1, 2]) assert.ok(s.temple.debris.some((d) => d.zone === z), `khu ${z} trống`);
});

test('mọi món đổ nát đều tới được để dọn', () => {
  for (const seed of [1, 2, 3, 4, 5]) {
    const s = createState({ seed });
    for (const d of s.temple.debris) {
      const t = s.map.tiles[debrisTile(d).join(',')];
      assert.ok(t && t.type !== 'water', `seed ${seed}: món ${d.id} nằm ngoài đất`);
      assert.ok(commandClean(s, playerOf(s).id, d.id), `seed ${seed}: không tới được món ${d.id}`);
    }
  }
});

test('dọn một món: đi tới, làm đủ thời gian, cộng pháp lực, phát sự kiện', () => {
  const s = createState({ seed: 2 });
  const p = playerOf(s);
  const d = s.temple.debris[0];
  assert.ok(commandClean(s, p.id, d.id));
  run(s, 30);
  assert.ok(d.done);
  assert.equal(p.task, null);
  assert.equal(s.stats.power, CONFIG.cleanup.powerPerItem);
  assert.ok(s.events.some((e) => e.type === 'cleaned' && e.id === d.id));
});

test('dọn sạch một khu thì thưởng thêm; vùng pháp lực nở ra', () => {
  const s = createState({ seed: 3 });
  const p = playerOf(s);
  const r0 = auraRadius(s.stats);
  for (const d of s.temple.debris.filter((x) => x.zone === 1)) { commandClean(s, p.id, d.id); run(s, 40); }
  assert.equal(zoneProgress(s.temple, 1), 1);
  assert.ok(s.temple.zonesDone[1]);
  assert.ok(s.events.some((e) => e.type === 'zoneDone' && e.zone === 1));
  assert.ok(s.stats.prestige > 0);
  assert.ok(auraRadius(s.stats) > r0);
});

test('chạm đi chỗ khác giữa chừng thì bỏ việc dọn', () => {
  const s = createState({ seed: 4 });
  const p = playerOf(s);
  const d = s.temple.debris[2];
  commandClean(s, p.id, d.id);
  run(s, 30);
  // đã dọn xong món này; giao món khác rồi huỷ bằng cách xoá task (giao diện làm khi chạm chỗ khác)
  const d2 = s.temple.debris.find((x) => !x.done);
  commandClean(s, p.id, d2.id);
  p.task = null;
  run(s, 30);
  assert.equal(d2.done, false);
});
