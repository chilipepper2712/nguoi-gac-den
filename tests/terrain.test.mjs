import { test } from 'node:test';
import assert from 'node:assert/strict';

import { createState, serialize, deserialize } from '../src/sim/state.js';
import { reachableFrom } from '../src/sim/terrain.js';
import { key, neighbor, opposite, distance } from '../src/sim/hex.js';
import { CONFIG } from '../src/config.js';

const SEEDS = Array.from({ length: 25 }, (_, i) => i + 1);

test('cùng seed sinh cùng bản đồ', () => {
  assert.deepEqual(createState({ seed: 5 }).map, createState({ seed: 5 }).map);
  assert.notDeepEqual(createState({ seed: 5 }).map, createState({ seed: 6 }).map);
});

test('sân đền phẳng, đúng bậc, nằm giữa bản đồ', () => {
  for (const seed of SEEDS) {
    const { map } = createState({ seed });
    for (const t of Object.values(map.tiles)) {
      if (distance(t.q, t.r, 0, 0) <= CONFIG.terrain.templeRadius) {
        assert.equal(t.type, 'templeGround');
        assert.equal(t.h, CONFIG.terrain.templeLevel);
        assert.equal(t.ramp, null);
      }
    }
  }
});

test('mọi ô đất không phải núi đều đi tới được từ đền', () => {
  for (const seed of SEEDS) {
    const { map } = createState({ seed });
    const reach = reachableFrom(map, 0, 0);
    for (const t of Object.values(map.tiles)) {
      if (t.type !== 'water' && t.type !== 'rock') {
        assert.ok(reach.has(key(t.q, t.r)), `seed ${seed}: ô ${t.q},${t.r} bị cô lập`);
      }
    }
  }
});

test('dốc hợp lệ: đầu cao kề ô cao hơn 1 bậc, đầu thấp kề ô cùng bậc', () => {
  for (const seed of SEEDS) {
    const { map } = createState({ seed });
    for (const t of Object.values(map.tiles)) {
      if (t.ramp === null) continue;
      const up = map.tiles[key(...neighbor(t.q, t.r, t.ramp))];
      const down = map.tiles[key(...neighbor(t.q, t.r, opposite(t.ramp)))];
      assert.ok(up && up.type !== 'water' && up.h === t.h + 1, `seed ${seed}: đầu cao sai`);
      assert.ok(down && down.type !== 'water' && down.h === t.h, `seed ${seed}: đầu thấp sai`);
    }
  }
});

test('vành ngoài cùng là nước, vách giữa hai ô đất không quá maxCliff', () => {
  for (const seed of SEEDS) {
    const { map } = createState({ seed });
    for (const t of Object.values(map.tiles)) {
      if (distance(t.q, t.r, 0, 0) === map.radius) assert.equal(t.type, 'water');
      if (t.type === 'water') continue;
      for (let d = 0; d < 6; d++) {
        const n = map.tiles[key(...neighbor(t.q, t.r, d))];
        if (n && n.type !== 'water') assert.ok(Math.abs(t.h - n.h) <= CONFIG.terrain.maxCliff);
      }
    }
  }
});

test('bản đồ lưu/tải được', () => {
  const s = createState({ seed: 3 });
  assert.deepEqual(deserialize(serialize(s)).map, s.map);
});
