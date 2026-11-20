// Vẽ bùa: hình tự chế (không lấy chữ hay mẫu phù chú có thật), người chơi đồ theo bằng ngón tay.
// Logic thuần: định nghĩa hình, lấy mẫu lại nét, chấm độ khớp, ghép bùa nhiều hình.
// Toạ độ trong ô vẽ chuẩn hoá [0,1]², y hướng xuống (như màn hình).

import { CONFIG } from '../config.js';

const T = CONFIG.talisman;

// --- Hình mẫu: mỗi hình là danh sách nét, mỗi nét là danh sách điểm [x, y] ---
const arc = (cx, cy, r, a0, a1, n = 24) => Array.from({ length: n + 1 }, (_, i) => {
  const a = a0 + ((a1 - a0) * i) / n;
  return [cx + Math.cos(a) * r, cy + Math.sin(a) * r];
});

export const GLYPHS = {
  song: { name: 'Sóng', strokes: [Array.from({ length: 33 }, (_, i) => { const x = 0.1 + (0.8 * i) / 32; return [x, 0.5 + 0.16 * Math.sin((x - 0.1) * Math.PI * 2.5)]; })] },
  nui: { name: 'Núi', strokes: [[[0.1, 0.8], [0.33, 0.25], [0.5, 0.55], [0.67, 0.2], [0.9, 0.8]]] },
  xoay: { name: 'Xoáy', strokes: [Array.from({ length: 49 }, (_, i) => { const t = i / 48; const a = t * Math.PI * 3.2; const r = 0.04 + 0.34 * t; return [0.5 + Math.cos(a) * r, 0.5 + Math.sin(a) * r]; })] },
  // Lửa: thân tròn dưới, đỉnh nhọn, một lưỡi lửa phụ bên trái
  lua: { name: 'Lửa', strokes: [[[0.5, 0.9], [0.32, 0.82], [0.25, 0.64], [0.3, 0.46], [0.38, 0.54], [0.42, 0.34], [0.54, 0.12], [0.6, 0.3], [0.7, 0.42], [0.76, 0.62], [0.7, 0.8], [0.5, 0.9]]] },
  // Sét: tia chớp zic zắc dọc (thay trăng lưỡi liềm — dễ bị đọc thành biểu tượng tôn giáo)
  set: { name: 'Sét', strokes: [[[0.58, 0.08], [0.36, 0.5], [0.56, 0.5], [0.38, 0.92]]] },
  mam: { name: 'Mầm', strokes: [
    [[0.5, 0.88], [0.5, 0.6], [0.52, 0.35]],
    [[0.5, 0.58], [0.36, 0.46], [0.22, 0.42], [0.26, 0.56], [0.42, 0.6], [0.5, 0.58]],
    [[0.52, 0.4], [0.64, 0.24], [0.8, 0.2], [0.76, 0.34], [0.62, 0.4], [0.52, 0.4]],
  ] },
  // Mắt: hai cung GẶP NHAU ở hai khoé (không bắt chéo — bắt chéo thành hình cá Ichthys)
  mat: { name: 'Mắt', strokes: (() => {
    const a = 0.38; const h = 0.2; const R = (a * a + h * h) / (2 * h); const t = Math.asin((R - h) / R);
    return [
      arc(0.5, 0.5 - h + R, R, -Math.PI + t, -t),
      arc(0.5, 0.5 + h - R, R, t, Math.PI - t),
      arc(0.5, 0.5, 0.09, 0, Math.PI * 2, 16),
    ];
  })() },
  mua: { name: 'Mưa', strokes: [[[0.3, 0.2], [0.18, 0.62]], [[0.56, 0.3], [0.44, 0.72]], [[0.82, 0.4], [0.7, 0.82]]] },
};

// Hình đã mở theo mức pháp lực
export function unlockedGlyphs(power) {
  return T.glyphs.filter((g) => power >= g.unlock).map((g) => g.id);
}

// --- Hình học nét ---
function length(pts) {
  let L = 0;
  for (let i = 1; i < pts.length; i++) L += Math.hypot(pts[i][0] - pts[i - 1][0], pts[i][1] - pts[i - 1][1]);
  return L;
}

// Lấy mẫu lại n điểm cách đều theo chiều dài nét
export function resample(pts, n = T.samples) {
  if (pts.length === 0) return [];
  if (pts.length === 1) return Array.from({ length: n }, () => pts[0].slice());
  const L = length(pts);
  if (L === 0) return Array.from({ length: n }, () => pts[0].slice());
  const step = L / (n - 1);
  const out = [pts[0].slice()];
  let acc = 0;
  let i = 1;
  let prev = pts[0];
  while (out.length < n - 1 && i < pts.length) {
    const cur = pts[i];
    const d = Math.hypot(cur[0] - prev[0], cur[1] - prev[1]);
    if (acc + d >= step && d > 0) {
      const k = (step - acc) / d;
      const p = [prev[0] + (cur[0] - prev[0]) * k, prev[1] + (cur[1] - prev[1]) * k];
      out.push(p);
      prev = p;
      acc = 0;
    } else {
      acc += d;
      prev = cur;
      i += 1;
    }
  }
  while (out.length < n) out.push(pts[pts.length - 1].slice());
  return out;
}

const meanMinDist = (A, B) => A.reduce((s, a) => s + Math.min(...B.map((b) => Math.hypot(a[0] - b[0], a[1] - b[1]))), 0) / A.length;

// Điểm một nét vẽ so với một nét mẫu: 1 = khớp hoàn toàn, 0 = lệch hẳn. Không phân biệt chiều vẽ.
export function strokeScore(drawn, template) {
  if (drawn.length < 2) return 0;
  if (length(drawn) < length(template) * T.minLengthRatio) return 0;
  const D = resample(drawn);
  const M = resample(template);
  const d = (meanMinDist(M, D) + meanMinDist(D, M)) / 2;
  return Math.max(0, Math.min(1, 1 - (d - T.tolGood) / (T.tolBad - T.tolGood)));
}

// Điểm một hình: ghép mỗi nét mẫu với nét vẽ khớp nhất (thứ tự nét tuỳ ý); thiếu nét = 0, thừa nét bị trừ
export function glyphScore(drawnStrokes, glyphId) {
  const tpl = GLYPHS[glyphId].strokes;
  const pairs = [];
  tpl.forEach((t, ti) => drawnStrokes.forEach((d, di) => pairs.push({ ti, di, s: strokeScore(d, t) })));
  pairs.sort((a, b) => b.s - a.s);
  const usedT = new Set();
  const usedD = new Set();
  let total = 0;
  for (const p of pairs) {
    if (usedT.has(p.ti) || usedD.has(p.di)) continue;
    usedT.add(p.ti);
    usedD.add(p.di);
    total += p.s;
  }
  const extra = Math.max(0, drawnStrokes.length - tpl.length);
  return Math.max(0, Math.min(1, total / tpl.length - extra * T.extraStrokePenalty));
}

// Ghép một tờ bùa: `count` hình (1 hoặc 3) chọn từ các hình đã mở, thứ tự ngẫu nhiên. rnd: () => [0,1)
export function composeTalisman(unlocked, count, rnd) {
  const pool = [...unlocked];
  const out = [];
  for (let i = 0; i < count; i++) {
    if (pool.length === 0) pool.push(...unlocked); // ít hình đã mở thì cho lặp
    out.push(pool.splice(Math.floor(rnd() * pool.length), 1)[0]);
  }
  return out;
}

// Kết quả cả tờ: điểm trung bình, thành/hỏng, sát thương lên ma (con số tạm, chỉnh trong config)
export function talismanResult(scores) {
  const avg = scores.reduce((a, b) => a + b, 0) / scores.length;
  const ok = avg >= T.passScore;
  const damage = ok ? Math.round(T.baseDamage * scores.length ** T.multiExponent * avg) : 0;
  return { avg, ok, damage };
}
