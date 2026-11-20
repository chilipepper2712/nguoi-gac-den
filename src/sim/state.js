// Game state thuần dữ liệu (JSON-serializable). Không import three, không đụng DOM.
// Chưa có gameplay: chỉ có khung state + save/load để các hệ thống sau cắm vào.

import { seedToRngState } from './rng.js';
import { generateTerrain } from './terrain.js';
import { generateFlora } from './flora.js';
import { generateVillage } from './village.js';
import { createClock } from './clock.js';

export const SAVE_VERSION = 1;

export function createState({ seed = 1 } = {}) {
  const state = {
    version: SAVE_VERSION,
    seed,
    rngState: seedToRngState(seed),
    map: null,
    clock: createClock(),
    temple: { condition: 0 }, // 0 = hoang tàn, 1 = đã sửa
  };
  state.map = generateTerrain(state);
  state.map.landmarks = [];
  generateVillage(state);
  generateFlora(state);
  return state;
}

export function serialize(state) {
  return JSON.stringify(state);
}

export function deserialize(json) {
  const state = JSON.parse(json);
  if (state.version !== SAVE_VERSION) {
    throw new Error(`Save version ${state.version} không khớp ${SAVE_VERSION}`);
  }
  return state;
}
