// Lưu / tải game trong trình duyệt (localStorage). Bản lưu khác phiên bản hoặc hỏng thì bỏ, không làm sập game.
// Mọi truy cập localStorage bọc try/catch (chế độ ẩn danh, bị chặn lưu trữ...).

import { serialize, deserialize } from '../sim/state.js';

const KEY = 'nguoi-gac-den:save';

export function loadSaved() {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return null;
    const s = deserialize(raw);
    // kiểm vài trường cốt lõi
    if (!s.map || !s.people || !s.temple || !s.stats || !s.clock) throw new Error('thiếu trường');
    s.events = [];
    return s;
  } catch (e) {
    console.warn('Bỏ bản lưu cũ:', e.message);
    try { localStorage.removeItem(KEY); } catch {}
    return null;
  }
}

export function saveGame(state) {
  try {
    localStorage.setItem(KEY, serialize({ ...state, events: [] }));
    return true;
  } catch {
    return false;
  }
}

export function clearSave() {
  try { localStorage.removeItem(KEY); } catch {}
}

// Tự lưu: khi sang ngày mới, mỗi `everySec` giây, và khi rời trang / chuyển app
export function createAutosave(state, { everySec = 30 } = {}) {
  let lastDay = state.clock.day;
  let timer = 0;
  const now = () => saveGame(state);
  document.addEventListener('visibilitychange', () => { if (document.visibilityState === 'hidden') now(); });
  window.addEventListener('pagehide', now);
  return {
    update(dt) {
      timer += dt;
      if (state.clock.day !== lastDay || timer >= everySec) {
        lastDay = state.clock.day;
        timer = 0;
        now();
      }
    },
    now,
  };
}
