// Mọi con số cân bằng và tham số hiển thị nằm ở đây. Chỉnh số thì sửa file này, không đụng logic.

export const CONFIG = {
  terrain: {
    radius: 9,            // bán kính bản đồ (số vòng ô quanh tâm)
    noiseScale: 0.22,     // tần số nhiễu địa hình (nhỏ = đồi rộng, lớn = lởm chởm)
    noiseWeight: 0.6,     // tỉ trọng nhiễu so với dạng đảo (cao giữa, thấp rìa)
    waterBelow: 0.3,      // dưới ngưỡng này là nước
    maxLevel: 4,          // bậc cao nhất
    levelSpread: 1.25,    // giãn dải độ cao (lớn = nhiều bậc cao hơn)
    templeRadius: 1,      // bán kính sân đền phẳng
    templeLevel: 2,       // bậc của sân đền
    maxCliff: 2,          // chênh bậc tối đa giữa hai ô đất kề nhau
    dirtChance: 0.08,     // tỉ lệ ô đất trống
  },
  camera: {
    fov: 30,              // FOV hẹp cho cảm giác gần isometric như ảnh tham khảo
    distance: 60,         // khoảng cách ban đầu tới tâm
    minDistance: 12,      // zoom gần nhất
    maxDistance: 80,      // zoom xa nhất
    polarAngle: 0.95,     // góc nghiêng ban đầu (rad, 0 = nhìn thẳng từ trên xuống)
    minPolarAngle: 0.5,
    maxPolarAngle: 1.15,
    azimuth: Math.PI / 4, // xoay 45° cho góc nhìn chéo
  },
  terrainView: {
    hexSize: 1,           // cạnh ô lục giác (đơn vị thế giới)
    levelHeight: 0.45,    // chiều cao một bậc
    waterY: -0.22,        // mặt nước
    bottomY: -1.4,        // đáy đảo (thành đảo nhìn thấy ở rìa)
    gap: 0.0,             // khe giữa các ô (0 = liền mặt)
  },
  view: {
    background: 0xcfe3e6, // nền pastel nhạt
    maxPixelRatio: 2,
  },
};
