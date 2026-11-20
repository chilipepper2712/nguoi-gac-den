// Kinh tế: quyên góp khi dân viếng đền. (Chi tiêu: sửa, xây, thuê người — các việc sau.)

import { donationOf } from './mood.js';
import { hexToWorld } from './hex.js';
import { CONFIG } from '../config.js';

export function tickEconomy(state) {
  for (const p of state.people) {
    if (!p.visited) continue;
    p.visited = false;
    const amount = donationOf(state, p);
    state.stats.money += amount;
    const [x, z] = hexToWorld(p.q, p.r, CONFIG.terrainView.hexSize);
    state.events.push({ type: 'donation', amount, x, z, who: p.id });
  }
}
