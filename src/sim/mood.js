// Tâm trạng dân làng: hạnh phúc, đức tin (vào ngôi đền), suy nghĩ lấy từ trạng thái thật, mong ước.
// Bản đầu: tính từ trạng thái hiện tại (an toàn trong vùng bảo vệ, đền sạch/sửa), chưa lưu lịch sử.
// Việc đáp ứng mong ước và nối đức tin → pháp lực còn chờ quyết định (docs/design.md, mục Dân cư).

import { CONFIG } from '../config.js';
import { hexToWorld } from './hex.js';
import { auraRadius } from './temple.js';
import { isNight } from './clock.js';

const M = CONFIG.mood;
const hash = (n) => (((n * 2654435761) >>> 0) % 1000) / 1000;

function homeOf(state, p) {
  return p.home >= 0 ? state.map.village.houses[p.home] : null;
}

// Nhà có nằm trong vùng bảo vệ của đền không
export function homeProtected(state, p) {
  const h = homeOf(state, p);
  if (!h) return true;
  const [x, z] = hexToWorld(h.q, h.r, CONFIG.terrainView.hexSize);
  return Math.hypot(x, z) <= auraRadius(state.stats);
}

const cleanZones = (state) => state.temple.zonesDone.filter(Boolean).length;

export function happinessOf(state, p) {
  let v = M.baseHappiness[0] + hash(p.id + 7) * (M.baseHappiness[1] - M.baseHappiness[0]);
  v += homeProtected(state, p) ? M.safeBonus : -M.unsafePenalty;
  v += cleanZones(state) * M.perCleanZone + state.temple.condition * M.templeRepaired;
  return Math.round(Math.max(0, Math.min(100, v)));
}

export function faithOf(state, p) {
  let v = M.baseFaith[0] + hash(p.id + 13) * (M.baseFaith[1] - M.baseFaith[0]);
  v += Math.min(M.faithFromPowerCap, state.stats.power * M.faithPerPower);
  return Math.round(Math.max(0, Math.min(100, v)));
}

// Mong ước cố định của mỗi người, theo lứa tuổi (chọn theo id). Đáp ứng mong ước: chưa làm.
const WISHES = {
  young: ['Mong tìm được người thương.', 'Muốn làng có chỗ cho bọn trẻ tụ tập buổi tối.', 'Ước làng mình đông vui như người ta kể ngày trước.'],
  adult: ['Mong đền có lễ hội như hồi xưa.', 'Ước gì đường về nhà có thêm đèn.', 'Mong quán đông khách hơn.', 'Muốn con cái được học hành đàng hoàng.', 'Mong đêm nào cũng ngủ yên, không nghe tiếng lạ.', 'Muốn có chỗ tử tế cho cha mẹ an nghỉ gần đền.'],
  elder: ['Mong sau này được an nghỉ yên ổn gần đền.', 'Muốn thấy làng đông vui như ngày trước.', 'Mong con cháu về sum họp mỗi dịp lễ.', 'Muốn được dự lễ hội ở đền thêm một lần nữa.'],
};
export function wishOf(p) {
  const list = p.age >= 60 ? WISHES.elder : p.age < 25 ? WISHES.young : WISHES.adult;
  return list[Math.floor(hash(p.id + 29) * list.length)];
}

// 2–3 suy nghĩ theo trạng thái thật của thế giới
export function thoughtsOf(state, p) {
  const out = [];
  const zones = cleanZones(state);
  if (state.temple.condition >= 1) out.push('Đền sửa xong đẹp quá, chiều nào cũng muốn ghé.');
  else if (zones === 0) out.push('Đền bỏ hoang lâu quá, đi ngang thấy buồn.');
  else if (zones < 3) out.push('Có người về dọn đền rồi, mừng ghê!');
  else out.push('Sân đền sạch sẽ hẳn, chỉ còn mái dột thôi.');
  if (homeProtected(state, p)) out.push(isNight(state.clock) ? 'Đèn đền sáng, đêm nay chắc yên.' : 'Từ khi đền sáng lên, đêm ngủ yên hơn hẳn.');
  else out.push(isNight(state.clock) ? 'Ngoài kia có tiếng gì lạ… đóng cửa sớm thôi.' : 'Tối đến là sợ, nhà mình ở ngoài vùng đền che chở.');
  const h = homeOf(state, p);
  if (h && h.sign !== null) out.push('Mở quán ở đây, khách viếng đền đông thì mới bán được.');
  return out.slice(0, 3);
}

// Quyên góp khi một người viếng đền: hạnh phúc cao thì góp nhiều (đã chốt), uy tín đền cũng kéo lên
export function donationOf(state, p) {
  const E = CONFIG.economy;
  const k = 0.5 + happinessOf(state, p) / 100;
  return Math.round(E.donationBase * k * (1 + state.stats.prestige * E.prestigeDonation));
}
