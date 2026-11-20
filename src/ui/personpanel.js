// Bảng thông tin người dân (chạm vào người): tên, tuổi, hạnh phúc, đức tin, đang nghĩ gì, mong ước.
// Cập nhật theo trạng thái thế giới khi đang mở.

import { happinessOf, faithOf, thoughtsOf, wishOf } from '../sim/mood.js';

export function createPersonPanel(state, { onClose = () => {} } = {}) {
  const el = document.createElement('div');
  el.id = 'person-panel';
  el.hidden = true;
  el.innerHTML = `
    <div class="pp-head"><b class="pp-name"></b><span class="pp-age"></span><button type="button" class="pp-close" aria-label="Đóng">×</button></div>
    <div class="pp-bar"><span>Hạnh phúc</span><i><u class="pp-happy"></u></i><em class="pp-happy-n"></em></div>
    <div class="pp-bar"><span>Đức tin</span><i><u class="pp-faith"></u></i><em class="pp-faith-n"></em></div>
    <div class="pp-label">Đang nghĩ</div>
    <ul class="pp-thoughts"></ul>
    <div class="pp-label">Mong ước</div>
    <div class="pp-wish"></div>`;
  document.body.appendChild(el);
  const $ = (s) => el.querySelector(s);
  let person = null;
  let timer = 0;

  function render() {
    if (!person) return;
    $('.pp-name').textContent = person.name;
    $('.pp-age').textContent = `${person.age} tuổi`;
    const h = happinessOf(state, person);
    const f = faithOf(state, person);
    $('.pp-happy').style.width = `${h}%`;
    $('.pp-happy-n').textContent = h;
    $('.pp-faith').style.width = `${f}%`;
    $('.pp-faith-n').textContent = f;
    $('.pp-thoughts').innerHTML = thoughtsOf(state, person).map((t) => `<li>${t}</li>`).join('');
    $('.pp-wish').textContent = `“${wishOf(person)}”`;
  }

  function close() {
    person = null;
    el.hidden = true;
    onClose();
  }
  $('.pp-close').addEventListener('click', close);

  return {
    open(p) { person = p; el.hidden = false; timer = 0; render(); },
    close,
    get person() { return person; },
    update(dt) {
      if (!person) return;
      timer += dt;
      if (timer > 0.5) { timer = 0; render(); }
    },
  };
}
