// Màn vẽ bùa (bản chơi thử): tờ giấy vàng, nét mẫu đỏ nhạt, người chơi đồ bằng ngón tay.
// Bùa 1 hình hoặc 3 hình (thứ tự ngẫu nhiên). Chấm điểm bằng src/sim/talisman.js.
// Chưa nối vào trận đánh ma; vẽ hỏng chưa có hậu quả (câu hỏi thiết kế còn mở).

import { CONFIG } from '../config.js';
import { GLYPHS, unlockedGlyphs, composeTalisman, glyphScore, talismanResult } from '../sim/talisman.js';

const T = CONFIG.talisman;
const INK = '#b3261c';
const GUIDE = 'rgba(179, 38, 28, 0.2)';

function verdict(s) {
  if (s >= 0.85) return 'Đẹp!';
  if (s >= T.passScore) return 'Được';
  return 'Hỏng';
}

// Vẽ nét (toạ độ chuẩn hoá) lên canvas 2D cỡ size
function drawStrokes(g, strokes, size, { color, width }) {
  g.strokeStyle = color;
  g.lineWidth = width;
  g.lineCap = 'round';
  g.lineJoin = 'round';
  for (const s of strokes) {
    if (s.length < 2) continue;
    g.beginPath();
    g.moveTo(s[0][0] * size, s[0][1] * size);
    for (const p of s.slice(1)) g.lineTo(p[0] * size, p[1] * size);
    g.stroke();
  }
}

export function openTalisman({ count = 1, power = 2, glyphs = null, time = T.timePerGlyph, onClose = () => {} } = {}) {
  const ids = glyphs || composeTalisman(unlockedGlyphs(power), count, Math.random);
  const scores = [];
  let index = 0;
  let strokes = [];
  let current = null;
  let deadline = 0;
  let evalTimer = 0;
  let raf = 0;
  let busy = false;

  const overlay = document.createElement('div');
  overlay.id = 'talisman';
  overlay.innerHTML = `
    <div class="tal-card">
      <div class="tal-head"><span class="tal-title"></span><span class="tal-count"></span></div>
      <div class="tal-paper"><canvas class="tal-canvas"></canvas><div class="tal-flash"></div></div>
      <div class="tal-timer"><div></div></div>
      <div class="tal-slots"></div>
      <div class="tal-actions">
        <button type="button" data-act="clear">Xoá</button>
        <button type="button" data-act="done">Xong</button>
        <button type="button" data-act="close">Đóng</button>
      </div>
    </div>`;
  document.body.appendChild(overlay);
  // Màn vẽ mở thì vòng lặp chính dừng vẽ cảnh 3D và dừng thời gian (đỡ tốn pin, nét vẽ không giật)
  document.body.dataset.overlay = '1';
  const $ = (sel) => overlay.querySelector(sel);
  const canvas = $('.tal-canvas');
  const g = canvas.getContext('2d');
  const flash = $('.tal-flash');
  const slots = $('.tal-slots');
  slots.innerHTML = ids.map(() => '<canvas width="96" height="96"></canvas>').join('');

  let size = 300;
  function layout() {
    const w = canvas.parentElement.clientWidth;
    size = w;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    canvas.width = w * dpr;
    canvas.height = w * dpr;
    canvas.style.width = `${w}px`;
    canvas.style.height = `${w}px`;
    g.setTransform(dpr, 0, 0, dpr, 0, 0);
    redraw();
  }

  function redraw() {
    g.clearRect(0, 0, size, size);
    const tpl = GLYPHS[ids[index]].strokes;
    drawStrokes(g, tpl, size, { color: GUIDE, width: size * 0.06 });
    // Chấm đánh dấu điểm bắt đầu mỗi nét
    g.fillStyle = 'rgba(179, 38, 28, 0.45)';
    for (const s of tpl) { g.beginPath(); g.arc(s[0][0] * size, s[0][1] * size, size * 0.018, 0, Math.PI * 2); g.fill(); }
    drawStrokes(g, strokes, size, { color: INK, width: size * 0.035 });
    if (current) drawStrokes(g, [current], size, { color: INK, width: size * 0.035 });
  }

  function showGlyph() {
    strokes = [];
    current = null;
    busy = false;
    $('.tal-title').textContent = `Vẽ: ${GLYPHS[ids[index]].name}`;
    $('.tal-count').textContent = ids.length > 1 ? `${index + 1}/${ids.length}` : '';
    deadline = performance.now() + time * 1000;
    redraw();
  }

  function finishGlyph() {
    if (busy) return;
    busy = true;
    clearTimeout(evalTimer);
    const s = glyphScore(strokes, ids[index]);
    scores.push(s);
    // Hình đã vẽ thu nhỏ vào ô
    const mini = slots.children[index].getContext('2d');
    mini.clearRect(0, 0, 96, 96);
    drawStrokes(mini, strokes, 96, { color: INK, width: 4 });
    slots.children[index].classList.add(s >= T.passScore ? 'ok' : 'bad');
    flash.textContent = `${verdict(s)} ${Math.round(s * 100)}%`;
    flash.className = `tal-flash show ${s >= T.passScore ? 'ok' : 'bad'}`;
    setTimeout(() => {
      flash.className = 'tal-flash';
      index += 1;
      if (index < ids.length) showGlyph();
      else showResult();
    }, 700);
  }

  function showResult() {
    cancelAnimationFrame(raf);
    const r = talismanResult(scores);
    $('.tal-title').textContent = r.ok ? 'Bùa thành!' : 'Bùa hỏng';
    $('.tal-count').textContent = `${Math.round(r.avg * 100)}%`;
    g.clearRect(0, 0, size, size);
    g.fillStyle = r.ok ? INK : '#6b5a4a';
    g.textAlign = 'center';
    g.font = `bold ${Math.round(size * 0.1)}px system-ui, sans-serif`;
    g.fillText(r.ok ? 'Đuổi ma!' : 'Mực nhoè…', size / 2, size * 0.42);
    g.font = `${Math.round(size * 0.06)}px system-ui, sans-serif`;
    g.fillText(r.ok ? `Sát thương: ${r.damage}` : 'Thử lại tờ khác', size / 2, size * 0.58);
    $('.tal-timer > div').style.width = '0%';
    $('[data-act="clear"]').hidden = true;
    const done = $('[data-act="done"]');
    done.textContent = 'Tờ khác';
    done.dataset.act = 'again';
    overlay.dataset.state = r.ok ? 'ok' : 'bad';
    window.__talismanResult = { ids, scores, ...r };
  }

  function tick() {
    const left = Math.max(0, deadline - performance.now());
    $('.tal-timer > div').style.width = `${(left / (time * 1000)) * 100}%`;
    if (left === 0 && !busy && index < ids.length) finishGlyph();
    raf = requestAnimationFrame(tick);
  }

  const point = (e) => {
    const r = canvas.getBoundingClientRect();
    return [(e.clientX - r.left) / r.width, (e.clientY - r.top) / r.height];
  };
  canvas.addEventListener('pointerdown', (e) => {
    if (busy || index >= ids.length) return;
    canvas.setPointerCapture(e.pointerId);
    clearTimeout(evalTimer);
    current = [point(e)];
    e.preventDefault();
  });
  canvas.addEventListener('pointermove', (e) => {
    if (!current) return;
    const p = point(e);
    const last = current[current.length - 1];
    if (Math.hypot(p[0] - last[0], p[1] - last[1]) * size > 1.5) {
      current.push(p);
      redraw();
    }
  });
  const end = () => {
    if (!current) return;
    if (current.length > 1) strokes.push(current);
    current = null;
    redraw();
    // Đủ số nét thì tự chấm sau một nhịp (cho phép vẽ tiếp nếu chưa nhấc tay hẳn)
    if (strokes.length >= GLYPHS[ids[index]].strokes.length) evalTimer = setTimeout(finishGlyph, 350);
  };
  canvas.addEventListener('pointerup', end);
  canvas.addEventListener('pointercancel', end);

  overlay.addEventListener('click', (e) => {
    const act = e.target.dataset && e.target.dataset.act;
    if (act === 'clear') { strokes = []; redraw(); }
    if (act === 'done' && !busy) finishGlyph();
    if (act === 'again') { close(); openTalisman({ count, power, time, onClose }); }
    if (act === 'close') close();
  });

  function close() {
    cancelAnimationFrame(raf);
    clearTimeout(evalTimer);
    window.removeEventListener('resize', layout);
    overlay.remove();
    delete document.body.dataset.overlay;
    onClose();
  }

  window.addEventListener('resize', layout);
  showGlyph();
  layout();
  raf = requestAnimationFrame(tick);
  return { close };
}
