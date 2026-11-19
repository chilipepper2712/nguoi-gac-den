import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';

import { createState, serialize, deserialize, SAVE_VERSION } from '../src/sim/state.js';
import { nextRandom, randomInt } from '../src/sim/rng.js';

test('RNG tất định theo seed', () => {
  const a = createState({ seed: 42 });
  const b = createState({ seed: 42 });
  const seqA = Array.from({ length: 5 }, () => nextRandom(a));
  const seqB = Array.from({ length: 5 }, () => nextRandom(b));
  assert.deepEqual(seqA, seqB);
  for (const x of seqA) assert.ok(x >= 0 && x < 1);
});

test('randomInt nằm trong khoảng, tính cả hai đầu', () => {
  const s = createState({ seed: 7 });
  const seen = new Set();
  for (let i = 0; i < 500; i++) {
    const v = randomInt(s, 1, 3);
    assert.ok(v >= 1 && v <= 3);
    seen.add(v);
  }
  assert.deepEqual([...seen].sort(), [1, 2, 3]);
});

test('save/load giữ nguyên state và chuỗi RNG', () => {
  const s = createState({ seed: 9 });
  nextRandom(s);
  const loaded = deserialize(serialize(s));
  assert.deepEqual(loaded, s);
  assert.equal(nextRandom(loaded), nextRandom(s));
});

test('save sai version thì báo lỗi', () => {
  const bad = JSON.stringify({ version: SAVE_VERSION + 1 });
  assert.throws(() => deserialize(bad));
});

// Luật kiến trúc: src/sim/ là logic thuần, chạy được trong node, không phụ thuộc render.
test('src/sim không import three, không đụng DOM, không dùng Math.random', () => {
  const dir = new URL('../src/sim/', import.meta.url).pathname;
  for (const f of readdirSync(dir).filter((n) => n.endsWith('.js'))) {
    // bỏ comment để comment giải thích luật không bị bắt nhầm
    const src = readFileSync(join(dir, f), 'utf8')
      .replace(/\/\*[\s\S]*?\*\//g, '')
      .replace(/(^|[^:])\/\/.*$/gm, '$1');
    assert.ok(!/from\s+['"]three/.test(src), `${f} import three`);
    assert.ok(!/from\s+['"]\.\.\/render\//.test(src), `${f} import render`);
    assert.ok(!/\b(document|window)\./.test(src), `${f} đụng DOM`);
    assert.ok(!/Math\.random\s*\(/.test(src), `${f} dùng Math.random`);
  }
});
