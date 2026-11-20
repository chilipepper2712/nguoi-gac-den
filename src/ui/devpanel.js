// Bảng thử phong cách (tạm, không phải UI game): kéo giờ, bật/tắt tự chạy, đổi trạng thái đền.
// Ghi thẳng vào state — chỉ dùng để xem hình.

import { clockLabel } from '../sim/clock.js';
import { openTalisman } from './talisman.js';
import { CONFIG } from '../config.js';

export function createDevPanel(state) {
  const el = document.createElement('div');
  el.id = 'devpanel';
  el.innerHTML = `
    <label class="row">
      <span id="dp-clock"></span>
      <input id="dp-time" type="range" min="0" max="1" step="0.001">
    </label>
    <div class="row buttons">
      <button id="dp-play" type="button"></button>
      <button id="dp-speed" type="button"></button>
      <button id="dp-temple" type="button"></button>
    </div>
    <div class="row buttons">
      <button id="dp-tal1" type="button">Bùa 1 hình</button>
      <button id="dp-tal3" type="button">Bùa 3 hình</button>
    </div>`;
  document.body.appendChild(el);

  const $ = (id) => el.querySelector(id);
  const time = $('#dp-time');
  const play = $('#dp-play');
  const speed = $('#dp-speed');
  const temple = $('#dp-temple');
  const speeds = [1, 8, 30];

  time.addEventListener('input', () => { state.clock.t = Number(time.value); });
  play.addEventListener('click', () => { state.clock.paused = !state.clock.paused; });
  speed.addEventListener('click', () => {
    const i = speeds.indexOf(state.clock.speed);
    state.clock.speed = speeds[(i + 1) % speeds.length];
  });
  // Đổi nhanh hoang/sửa (để xem hình): đã sửa = dọn hết đổ nát, pháp lực đầy; hoang = trả lại như đầu game
  temple.addEventListener('click', () => {
    const fixed = state.temple.condition <= 0.5;
    state.temple.condition = fixed ? 1 : 0;
    for (const d of state.temple.debris) d.done = fixed;
    state.temple.zonesDone = state.temple.zonesDone.map(() => fixed);
    state.stats.power = fixed ? CONFIG.aura.fullPower : 0;
  });
  $('#dp-tal1').addEventListener('click', () => openTalisman({ count: 1 }));
  $('#dp-tal3').addEventListener('click', () => openTalisman({ count: 3 }));

  return {
    update() {
      $('#dp-clock').textContent = clockLabel(state.clock);
      if (document.activeElement !== time) time.value = String(state.clock.t);
      play.textContent = state.clock.paused ? '▶ Chạy' : '❚❚ Dừng';
      speed.textContent = `Tốc độ ${state.clock.speed}x`;
      temple.textContent = state.temple.condition > 0.5 ? 'Đền: đã sửa' : 'Đền: hoang tàn';
    },
  };
}
