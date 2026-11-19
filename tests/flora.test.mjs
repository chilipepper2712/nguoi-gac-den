import { test } from 'node:test';
import assert from 'node:assert/strict';

import { createState } from '../src/sim/state.js';
import { distance, key } from '../src/sim/hex.js';
import { CONFIG } from '../src/config.js';

const SEEDS = Array.from({ length: 15 }, (_, i) => i + 1);

test('cây cỏ tất định theo seed', () => {
  assert.deepEqual(createState({ seed: 4 }).map.flora, createState({ seed: 4 }).map.flora);
});

test('không rải cây ở sân đền, ô dốc, ô nước, ô cây cổ thụ', () => {
  for (const seed of SEEDS) {
    const { map } = createState({ seed });
    const hero = map.landmarks.find((l) => l.kind === 'heroTree');
    for (const f of map.flora) {
      const t = map.tiles[key(f.q, f.r)];
      assert.ok(t, 'ô tồn tại');
      assert.notEqual(t.type, 'water');
      assert.equal(t.ramp, null);
      assert.ok(distance(f.q, f.r, 0, 0) > CONFIG.flora.clearRadius);
      assert.ok(!(f.q === hero.q && f.r === hero.r));
    }
  }
});

test('dáng nằm trong số dáng render có, vị trí nằm trong ô', () => {
  for (const seed of SEEDS) {
    const { map } = createState({ seed });
    for (const f of map.flora) {
      assert.ok(Number.isInteger(f.variant) && f.variant >= 0 && f.variant < CONFIG.flora.variants[f.kind]);
      assert.ok(Math.hypot(f.dx, f.dz) < 0.75, 'lệch quá xa tâm ô');
    }
  }
});

test('ô núi chỉ có đá', () => {
  for (const seed of SEEDS) {
    const { map } = createState({ seed });
    for (const f of map.flora) {
      if (map.tiles[key(f.q, f.r)].type === 'rock') assert.equal(f.kind, 'rock');
    }
  }
});

test('bản đồ có cây cổ thụ cạnh đền, trên ô đất', () => {
  const { map } = createState({ seed: 1 });
  const hero = map.landmarks.find((l) => l.kind === 'heroTree');
  assert.ok(hero);
  assert.notEqual(map.tiles[key(hero.q, hero.r)].type, 'water');
});
