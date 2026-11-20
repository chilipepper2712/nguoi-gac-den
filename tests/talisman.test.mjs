import { test } from 'node:test';
import assert from 'node:assert/strict';

import { GLYPHS, resample, strokeScore, glyphScore, composeTalisman, talismanResult, unlockedGlyphs } from '../src/sim/talisman.js';
import { CONFIG } from '../src/config.js';

// Run tay kiểu ngón tay thật: nét được vẽ dày điểm, lệch lượn êm theo chiều dài nét
const dense = (pts) => {
  const out = [];
  for (let i = 0; i + 1 < pts.length; i++) for (let k = 0; k < 8; k++) { const t = k / 8; out.push([pts[i][0] + (pts[i + 1][0] - pts[i][0]) * t, pts[i][1] + (pts[i + 1][1] - pts[i][1]) * t]); }
  out.push(pts[pts.length - 1]);
  return out;
};
const wobble = (pts, amp, ph) => dense(pts).map(([x, y], i, a) => { const t = i / Math.max(1, a.length - 1); return [x + amp * Math.sin(t * 6.3 + ph), y + amp * Math.cos(t * 4.1 + ph * 1.7)]; });

test('mọi hình khai báo trong config đều có mẫu', () => {
  for (const g of CONFIG.talisman.glyphs) assert.ok(GLYPHS[g.id], g.id);
});

test('lấy mẫu lại đủ điểm, giữ hai đầu', () => {
  const pts = [[0, 0], [1, 0], [1, 1]];
  const r = resample(pts, 20);
  assert.equal(r.length, 20);
  assert.deepEqual(r[0], [0, 0]);
  assert.ok(Math.hypot(r[19][0] - 1, r[19][1] - 1) < 1e-9);
});

test('đồ đúng mẫu được điểm cao, kể cả vẽ ngược chiều hoặc run tay nhẹ', () => {
  for (const id of Object.keys(GLYPHS)) {
    const strokes = GLYPHS[id].strokes;
    assert.ok(glyphScore(strokes, id) > 0.97, `${id} đúng mẫu`);
    assert.ok(glyphScore(strokes.map((s) => [...s].reverse()), id) > 0.97, `${id} ngược chiều`);
    assert.ok(glyphScore(strokes.map((s, i) => wobble(s, 0.04, i + 3)), id) > 0.8, `${id} run tay`);
  }
});

test('vẽ sai, vẽ lệch chỗ, vẽ thiếu nét thì điểm thấp', () => {
  const song = GLYPHS.song.strokes[0];
  assert.ok(strokeScore(song.map(([x, y]) => [x, y + 0.3]), song) < 0.2, 'lệch chỗ');
  assert.ok(strokeScore([[0.4, 0.5], [0.45, 0.5]], song) === 0, 'quá ngắn');
  assert.ok(glyphScore([GLYPHS.nui.strokes[0]], 'song') < 0.5, 'vẽ nhầm hình');
  assert.ok(glyphScore([GLYPHS.mat.strokes[0]], 'mat') < 0.45, 'thiếu nét');
});

test('vẽ nhầm sang bất kỳ hình nào khác đều không đủ điểm đậu', () => {
  const ids = Object.keys(GLYPHS);
  for (const a of ids) for (const b of ids) {
    if (a !== b) assert.ok(glyphScore(GLYPHS[a].strokes, b) < CONFIG.talisman.passScore, `${a} → ${b}`);
  }
});

test('ghép bùa: đủ số hình, không trùng khi đủ hình đã mở', () => {
  let s = 0.1;
  const rnd = () => (s = (s * 9301 + 49297) % 233280 / 233280);
  const t = composeTalisman(['song', 'nui', 'xoay'], 3, rnd);
  assert.equal(t.length, 3);
  assert.equal(new Set(t).size, 3);
  assert.equal(composeTalisman(['song'], 3, rnd).length, 3);
});

test('mở hình theo pháp lực', () => {
  assert.deepEqual(unlockedGlyphs(0), ['song', 'nui', 'xoay']);
  assert.equal(unlockedGlyphs(2).length, CONFIG.talisman.glyphs.length);
});

test('kết quả: bùa 3 hình mạnh hơn, bùa hỏng không gây sát thương', () => {
  const one = talismanResult([1]);
  const three = talismanResult([1, 1, 1]);
  assert.ok(three.damage > one.damage * 3);
  assert.equal(talismanResult([0.3, 0.4, 0.2]).damage, 0);
});
