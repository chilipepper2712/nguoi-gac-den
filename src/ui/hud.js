// Thanh chỉ số trên cùng (dọc trước): tiền, pháp lực, uy tín, ngày giờ.

import { clockLabel } from '../sim/clock.js';

// Icon SVG nhỏ (không phụ thuộc font emoji)
const ICON = {
  money: '<svg class="ico" viewBox="0 0 16 16"><circle cx="8" cy="8" r="6.5" fill="#e8b84a" stroke="#a87a1e"/><rect x="6" y="6" width="4" height="4" fill="#a87a1e"/></svg>',
  power: '<svg class="ico" viewBox="0 0 16 16"><path d="M8 1 L9.6 6.4 L15 8 L9.6 9.6 L8 15 L6.4 9.6 L1 8 L6.4 6.4 Z" fill="#f2c94c" stroke="#b8862a" stroke-width="0.8"/></svg>',
  prestige: '<svg class="ico" viewBox="0 0 16 16"><circle cx="8" cy="7" r="5" fill="#e98f86" stroke="#b5654a"/><path d="M5 11 L4 15 L8 13 L12 15 L11 11" fill="#b5654a"/></svg>',
};

export function createHud(state) {
  const el = document.createElement('div');
  el.id = 'hud-top';
  el.innerHTML = `
    <div class="stat" title="Tiền">${ICON.money}<b data-k="money"></b></div>
    <div class="stat" title="Pháp lực">${ICON.power}<b data-k="power"></b></div>
    <div class="stat" title="Uy tín">${ICON.prestige}<b data-k="prestige"></b></div>
    <div class="clock" data-k="clock"></div>`;
  document.body.appendChild(el);
  const f = (k) => el.querySelector(`[data-k="${k}"]`);
  let last = '';
  return {
    update() {
      const s = state.stats;
      const sig = `${s.money}|${s.power}|${s.prestige}|${clockLabel(state.clock)}`;
      if (sig === last) return;
      last = sig;
      f('money').textContent = s.money.toLocaleString('vi-VN');
      f('power').textContent = s.power;
      f('prestige').textContent = s.prestige;
      f('clock').textContent = clockLabel(state.clock);
    },
  };
}
