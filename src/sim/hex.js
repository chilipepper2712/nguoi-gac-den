// Toán lưới lục giác, toạ độ axial (q, r), kiểu "đỉnh nhọn" (pointy-top).
// Hướng d (0..5) ứng với góc 60°·d trong mặt phẳng (x, z) của thế giới; hướng ngược = (d + 3) % 6.

export const DIRS = [
  [1, 0],   // 0:   0°
  [0, 1],   // 1:  60°
  [-1, 1],  // 2: 120°
  [-1, 0],  // 3: 180°
  [0, -1],  // 4: 240°
  [1, -1],  // 5: 300°
];

export const opposite = (d) => (d + 3) % 6;

export const key = (q, r) => `${q},${r}`;

export function neighbor(q, r, d) {
  return [q + DIRS[d][0], r + DIRS[d][1]];
}

export function distance(q1, r1, q2, r2) {
  const dq = q1 - q2;
  const dr = r1 - r2;
  return (Math.abs(dq) + Math.abs(dr) + Math.abs(dq + dr)) / 2;
}

// Mọi ô trong bán kính n quanh (0, 0), thứ tự ổn định.
export function hexesInRadius(n) {
  const out = [];
  for (let q = -n; q <= n; q++) {
    for (let r = Math.max(-n, -q - n); r <= Math.min(n, -q + n); r++) out.push([q, r]);
  }
  return out;
}

// Tâm ô trong mặt phẳng (x, z), cạnh ô = size.
export function hexToWorld(q, r, size) {
  return [size * Math.sqrt(3) * (q + r / 2), size * 1.5 * r];
}

// Điểm (x, z) trong thế giới → ô lục giác (q, r) chứa nó, làm tròn theo hệ cube.
export function worldToHex(x, z, size) {
  const qf = ((Math.sqrt(3) / 3) * x - z / 3) / size;
  const rf = ((2 / 3) * z) / size;
  const sf = -qf - rf;
  let q = Math.round(qf);
  let r = Math.round(rf);
  const s = Math.round(sf);
  const dq = Math.abs(q - qf);
  const dr = Math.abs(r - rf);
  const ds = Math.abs(s - sf);
  if (dq > dr && dq > ds) q = -r - s;
  else if (dr > ds) r = -q - s;
  return [q + 0, r + 0];
}
