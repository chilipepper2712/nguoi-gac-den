// Khởi động: tạo state, tạo view, chạy vòng lặp khung hình.

import { createState } from './sim/state.js';
import { createView } from './render/view.js';

const params = new URLSearchParams(location.search);
const seed = Number(params.get('seed')) || 1;

const state = createState({ seed });
const view = createView(document.getElementById('stage'));

let last = performance.now();
let frames = 0;

function frame(now) {
  const dt = Math.min((now - last) / 1000, 0.1);
  last = now;
  view.render(state, dt);
  frames += 1;
  // tools/shot.mjs chờ cờ này trước khi chụp màn hình
  if (frames === 3) window.__ready = true;
  requestAnimationFrame(frame);
}
requestAnimationFrame(frame);

// Để debug trong console
window.__game = { state, view };
