// Khởi động: tạo state, tạo view, chạy vòng lặp khung hình.

import { createState } from './sim/state.js';
import { createView } from './render/view.js';

const params = new URLSearchParams(location.search);
const seed = Number(params.get('seed')) || 1;
const debug = params.get('debug') === '1';

const state = createState({ seed });
const view = createView(document.getElementById('stage'), state);
const status = document.getElementById('status');

let last = performance.now();
let frames = 0;
let fpsFrames = 0;
let fpsTime = 0;

function frame(now) {
  const dt = Math.min((now - last) / 1000, 0.1);
  last = now;
  view.render(state, dt);
  frames += 1;
  // tools/shot.mjs chờ cờ này trước khi chụp màn hình
  if (frames === 3) window.__ready = true;

  if (debug) {
    fpsFrames += 1;
    fpsTime += dt;
    if (fpsTime >= 0.5) {
      const info = view.renderer.info.render;
      status.textContent = `seed ${seed} · ${Math.round(fpsFrames / fpsTime)} fps · ${info.calls} draw calls · ${(info.triangles / 1000).toFixed(1)}k tam giác`;
      fpsFrames = 0;
      fpsTime = 0;
    }
  }
  requestAnimationFrame(frame);
}
requestAnimationFrame(frame);

// Để debug trong console
window.__game = { state, view };
