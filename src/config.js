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
  flora: {
    clearRadius: 2,       // không rải cây trong bán kính này quanh đền (sân + vòng quanh)
    heroTree: [-1, -1],   // ô của cây cổ thụ cạnh đền (phía sau-trái khi nhìn từ camera mặc định)
    heroTreeHeight: 2.6,  // chiều cao cây cổ thụ (đơn vị thế giới)
    heroTreeRotation: 0.6,
    spotRadius: 0.42,     // khoảng lệch khỏi tâm ô khi một ô có nhiều cây
    forestScale: 0.35,    // tần số nhiễu gom cây thành cụm rừng
    forestAbove: 0.58,    // nhiễu trên ngưỡng này là rừng (2 cây/ô)
    denseAbove: 0.72,     // rừng rậm (3 cây/ô)
    lonelyTreeChance: 0.12, // ô cỏ ngoài rừng có 1 cây lẻ
    dirtTreeChance: 0.05,
    bushChance: 0.12,     // ô trống có bụi
    rockChance: 0.06,     // ô trống có đá nhỏ
    smallChance: 0.3,     // ô trống có cỏ / hoa / nấm / gốc cây
    // Model cho từng loại (assets/kenney/<đường dẫn>.glb). Sim chọn chỉ số dáng trong danh sách này.
    models: {
      tree: ['nature/tree_default', 'nature/tree_oak', 'nature/tree_fat', 'nature/tree_tall', 'nature/tree_simple', 'nature/tree_pineRoundA', 'nature/tree_pineTallA'],
      bush: ['nature/plant_bush', 'nature/plant_bushLarge', 'nature/plant_bushSmall'],
      rock: ['nature/stone_largeA', 'nature/stone_tallA', 'nature/rock_smallA', 'nature/stone_smallA'],
      small: ['nature/grass', 'nature/flower_redA', 'nature/flower_yellowA', 'nature/mushroom_tanGroup', 'nature/stump_old'],
    },
    pineVariants: [5, 6],  // chỉ số cây lá kim trong models.tree (ưu tiên ở bậc cao)
    modelScale: { tree: 0.58, bush: 0.85, rock: 0.5, small: 0.85 },
  },
  time: {
    dayLengthSec: 480,    // một ngày trong game = 8 phút thật (tốc độ 1x)
    startT: 0.3,          // giờ bắt đầu (0.3 ≈ 7h12 sáng)
    dawn: 0.25,           // từ đây là ban ngày
    dusk: 0.77,           // từ đây là ban đêm
  },
  temple: {
    rotation: Math.PI / 6, // mặt tiền đền hướng theo hướng lục giác 1 (gần hướng camera mặc định)
    gateHex: [0, 2],       // ô đặt cổng, cùng hướng mặt tiền
    // Đồ đổ nát quanh đền khi còn hoang (toạ độ cục bộ của đền, mặt tiền +z). Sẽ thành việc dọn dẹp trong gameplay.
    ruinDebris: [
      ['survival/tree-log', 1.55, 0.9, 0.4], ['survival/resource-planks', -1.5, 1.1, 2.0], ['survival/box-open', -1.25, 1.55, 0.3],
      ['survival/barrel', 1.35, 1.5, 0], ['survival/structure', -1.7, -0.6, 0.2], ['survival/signpost', 0.75, 2.1, -0.5],
      ['nature/stump_old', 1.8, -0.5, 1.1], ['nature/log', -0.6, 1.9, 1.3], ['nature/grass', 0.4, 1.7, 0], ['nature/grass', -1.9, 0.4, 0.8],
      ['nature/plant_bushSmall', 1.9, 0.2, 0], ['nature/mushroom_tanGroup', -1.1, -1.2, 0],
    ],
  },
  aura: {
    minRadius: 2.2,       // bán kính vùng pháp lực khi đền hoang tàn (tạm, sau tính từ pháp lực)
    maxRadius: 6.5,       // khi đền đã sửa
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
