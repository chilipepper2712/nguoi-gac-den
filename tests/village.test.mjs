import { test } from 'node:test';
import assert from 'node:assert/strict';

import { createState } from '../src/sim/state.js';
import { key, neighbor, distance } from '../src/sim/hex.js';
import { canStep } from '../src/sim/terrain.js';
import { CONFIG } from '../src/config.js';

const SEEDS = Array.from({ length: 20 }, (_, i) => i + 1);

test('làng tất định theo seed', () => {
  assert.deepEqual(createState({ seed: 6 }).map.village, createState({ seed: 6 }).map.village);
});

test('đủ số nhà, nhà trên ô đất phẳng, ngoài sân đền, không trên đường', () => {
  for (const seed of SEEDS) {
    const { map } = createState({ seed });
    const v = map.village;
    assert.equal(v.houses.length, CONFIG.village.houses, `seed ${seed}`);
    const roads = new Set(v.roads.map((r) => key(r.q, r.r)));
    const seen = new Set();
    for (const h of v.houses) {
      const t = map.tiles[key(h.q, h.r)];
      assert.ok(t && (t.type === 'grass' || t.type === 'dirt'), `seed ${seed}: nhà trên ô ${t && t.type}`);
      assert.equal(t.ramp, null);
      assert.ok(distance(h.q, h.r, 0, 0) >= CONFIG.village.minDist);
      assert.ok(!roads.has(key(h.q, h.r)), 'nhà nằm trên đường');
      assert.ok(!seen.has(key(h.q, h.r)), 'hai nhà cùng ô');
      seen.add(key(h.q, h.r));
    }
  }
});

test('mặt tiền nhà quay ra ô đi được (đường hoặc sân đền) và đi bộ được từ nhà ra đó', () => {
  for (const seed of SEEDS) {
    const { map } = createState({ seed });
    const roads = new Set(map.village.roads.map((r) => key(r.q, r.r)));
    for (const h of map.village.houses) {
      const [q, r] = neighbor(h.q, h.r, h.facing);
      const front = map.tiles[key(q, r)];
      const onNet = roads.has(key(q, r)) || distance(q, r, 0, 0) <= CONFIG.flora.clearRadius;
      assert.ok(front && onNet, `seed ${seed}: nhà ${h.q},${h.r} quay ra ô không phải đường`);
      assert.ok(canStep(map.tiles[key(h.q, h.r)], front, h.facing));
    }
  }
});

test('mọi nhà đi tới được cổng đền qua đường và sân', () => {
  for (const seed of SEEDS) {
    const { map } = createState({ seed });
    const v = map.village;
    const net = new Set(v.roads.map((r) => key(r.q, r.r)));
    for (const t of Object.values(map.tiles)) if (t.type !== 'water' && distance(t.q, t.r, 0, 0) <= CONFIG.flora.clearRadius) net.add(key(t.q, t.r));
    net.delete(key(0, 0));
    for (const h of v.houses) net.add(key(h.q, h.r));
    const [gq, gr] = CONFIG.temple.gateHex;
    const seen = new Set([key(gq, gr)]);
    const queue = [map.tiles[key(gq, gr)]];
    while (queue.length) {
      const t = queue.shift();
      for (let d = 0; d < 6; d++) {
        const [nq, nr] = neighbor(t.q, t.r, d);
        const kn = key(nq, nr);
        if (seen.has(kn) || !net.has(kn)) continue;
        const n = map.tiles[kn];
        if (canStep(t, n, d)) { seen.add(kn); queue.push(n); }
      }
    }
    for (const h of v.houses) assert.ok(seen.has(key(h.q, h.r)), `seed ${seed}: nhà ${h.q},${h.r} bị cô lập`);
  }
});

test('không rải cây trên nhà và đường; đèn đường nằm trên đường', () => {
  for (const seed of SEEDS) {
    const { map } = createState({ seed });
    const taken = new Set([...map.village.houses, ...map.village.roads].map((x) => key(x.q, x.r)));
    for (const f of map.flora) assert.ok(!taken.has(key(f.q, f.r)), `seed ${seed}: cây trên ô làng`);
    const roads = new Set(map.village.roads.map((r) => key(r.q, r.r)));
    for (const l of map.village.lamps) assert.ok(roads.has(key(l.q, l.r)));
  }
});

test('mọi model khu dân cư đều có file', async () => {
  const { existsSync } = await import('node:fs');
  for (const m of Object.values(CONFIG.villageModels).flat()) {
    assert.ok(existsSync(new URL(`../assets/kenney/${m}.glb`, import.meta.url)), m);
  }
});
