// RNG có seed (mulberry32). Trạng thái RNG nằm trong game state để save/load giữ nguyên tính tất định.
// Không dùng Math.random() trong src/sim/.

export function seedToRngState(seed) {
  const s = Number(seed) >>> 0;
  return s === 0 ? 0x9e3779b9 : s;
}

// Trả về số thực trong [0, 1) và cập nhật state.rngState.
export function nextRandom(state) {
  let t = (state.rngState = (state.rngState + 0x6d2b79f5) >>> 0);
  t = Math.imul(t ^ (t >>> 15), t | 1);
  t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
  return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
}

// Số nguyên trong [min, max] (tính cả hai đầu).
export function randomInt(state, min, max) {
  return min + Math.floor(nextRandom(state) * (max - min + 1));
}
