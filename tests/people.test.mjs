import { test } from 'node:test';
import assert from 'node:assert/strict';

import { createState, serialize, deserialize } from '../src/sim/state.js';
import { tickPeople, findPath } from '../src/sim/people.js';
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
