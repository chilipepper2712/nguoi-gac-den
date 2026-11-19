// Đồng hồ ngày đêm. state.clock = { day, t } với t ∈ [0, 1): 0 = nửa đêm, 0.25 = 6h, 0.5 = trưa, 0.75 = 18h.

import { CONFIG } from '../config.js';

export function createClock() {
  return { day: 1, t: CONFIG.time.startT, speed: 1, paused: false };
}

export function tickClock(state, dt) {
  const c = state.clock;
  if (c.paused) return;
  c.t += (dt * c.speed) / CONFIG.time.dayLengthSec;
  while (c.t >= 1) {
    c.t -= 1;
    c.day += 1;
  }
}

// Giờ:phút để hiển thị
export function clockLabel(clock) {
  const minutes = Math.floor(clock.t * 24 * 60);
  const h = String(Math.floor(minutes / 60)).padStart(2, '0');
  const m = String(minutes % 60).padStart(2, '0');
  return `Ngày ${clock.day} · ${h}:${m}`;
}

export function isNight(clock) {
  return clock.t < CONFIG.time.dawn || clock.t >= CONFIG.time.dusk;
}
