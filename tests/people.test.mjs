import { test } from 'node:test';
import assert from 'node:assert/strict';

import { createState, serialize, deserialize } from '../src/sim/state.js';
import { tickPeople, findPath, commandMove, tickPlayer, playerOf } from '../src/sim/people.js';
import { tickClock } from '../src/sim/clock.js';
import { key, neighbor } from '../src/sim/hex.js';
import { canStep } from '../src/sim/terrain.js';
import { CONFIG } from '../src/config.js';

test('có dân mỗi nhà và đúng một nhân vật chính', () => {
  const s = createState({ seed: 2 });
  const players = s.people.filter((p) => p.kind === 'player');
  assert.equal(players.length, 1);
  for (let i = 0; i < s.map.village.houses.length; i++) {
    const n = s.people.filter((p) => p.home === i).length;
    assert.ok(n >= CONFIG.people.perHouse[0] && n <= CONFIG.people.perHouse[1]);
  }
});

test('đường đi gồm các ô kề nhau và đi được', () => {
  const s = createState({ seed: 3 });
  const h = s.map.village.houses;
  const path = findPath(s.map, [h[0].q, h[0].r], [h[h.length - 1].q, h[h.length - 1].r]);
  assert.ok(path && path.length >= 2);
  for (let i = 0; i + 1 < path.length; i++) {
    const a = s.map.tiles[key(...path[i])];
    const b = s.map.tiles[key(...path[i + 1])];
    const d = [0, 1, 2, 3, 4, 5].find((dd) => neighbor(a.q, a.r, dd).join() === [b.q, b.r].join());
    assert.ok(d !== undefined, 'hai ô không kề nhau');
    assert.ok(canStep(a, b, d));
    assert.ok(!(path[i][0] === 0 && path[i][1] === 0), 'đi xuyên điện thờ');
  }
});

test('ban ngày dân rời nhà đi lại; tất định theo seed', () => {
  const run = () => {
    const s = createState({ seed: 5 });
    s.clock.t = 0.4;
    for (let i = 0; i < 600; i++) tickPeople(s, 0.1);
    return s;
  };
  const a = run();
  const moved = a.people.filter((p) => p.kind === 'villager' && (p.path || p.goal !== 'home'));
  assert.ok(moved.length > 0, 'không ai đi đâu');
  assert.deepEqual(a.people, run().people);
});

test('đêm xuống mọi người về nhà', () => {
  const s = createState({ seed: 7 });
  s.clock.t = 0.45;
  for (let i = 0; i < 400; i++) tickPeople(s, 0.1);
  s.clock.t = 0.9; // đêm
  for (let i = 0; i < 3000; i++) tickPeople(s, 0.1);
  for (const p of s.people.filter((x) => x.kind === 'villager')) {
    const h = s.map.village.houses[p.home];
    assert.ok(!p.path && p.q === h.q && p.r === h.r, `người ${p.id} chưa về nhà`);
  }
});

test('lưu/tải giữ nguyên người', () => {
  const s = createState({ seed: 4 });
  tickClock(s, 1);
  for (let i = 0; i < 100; i++) tickPeople(s, 0.1);
  assert.deepEqual(deserialize(serialize(s)).people, s.people);
});

test('ra lệnh cho nhân vật chính đi tới ô, tới nơi thì đứng lại', () => {
  const s = createState({ seed: 2 });
  const p = playerOf(s);
  const h = s.map.village.houses[0];
  const dest = commandMove(s, p.id, h.q, h.r);
  assert.deepEqual(dest, [h.q, h.r]);
  for (let i = 0; i < 2000 && p.path; i++) tickPlayer(s, 0.05);
  assert.equal(p.path, null);
  assert.deepEqual([p.q, p.r], [h.q, h.r]);
});

test('chạm vào điện thờ thì đi tới ô kề; đổi đích giữa chừng không giật lùi', () => {
  const s = createState({ seed: 3 });
  const p = playerOf(s);
  const dest = commandMove(s, p.id, 0, 0);
  assert.ok(dest && !(dest[0] === 0 && dest[1] === 0));
  assert.equal(Math.max(Math.abs(dest[0]), Math.abs(dest[1]), Math.abs(dest[0] + dest[1])), 1, 'đích phải kề điện thờ');
  const h = s.map.village.houses[1];
  commandMove(s, p.id, h.q, h.r);
  tickPlayer(s, 0.3);
  const before = [...p.path[p.seg]];
  const t0 = p.t;
  commandMove(s, p.id, h.q, h.r);
  assert.deepEqual(p.path[p.seg], before, 'đoạn đang đi phải giữ nguyên');
  assert.equal(p.t, t0);
});

test('dân có tên, tuổi; người tóc thưa là người già', async () => {
  const s = createState({ seed: 6 });
  for (const p of s.people.filter((x) => x.kind === 'villager')) {
    assert.ok(typeof p.name === 'string' && p.name.length > 0);
    assert.ok(p.age >= CONFIG.people.ageRange[0] && p.age <= CONFIG.people.ageRange[1]);
    if (p.look.hair === 3) assert.ok(p.age >= 62);
  }
});

test('viếng đền thì quyên góp; hạnh phúc cao góp nhiều hơn', async () => {
  const { tickEconomy } = await import('../src/sim/economy.js');
  const { happinessOf, donationOf } = await import('../src/sim/mood.js');
  const s = createState({ seed: 5 });
  s.clock.t = 0.4;
  const m0 = s.stats.money;
  for (let i = 0; i < 4000; i++) { tickPeople(s, 0.1); tickEconomy(s); }
  assert.ok(s.stats.money > m0, 'không ai quyên góp');
  assert.ok(s.events.some((e) => e.type === 'donation'));
  const v = s.people.find((x) => x.kind === 'villager');
  const low = donationOf(s, v);
  s.temple.condition = 1; s.temple.zonesDone = [true, true, true]; s.stats.power = 100;
  assert.ok(happinessOf(s, v) > 0 && donationOf(s, v) > low);
});
