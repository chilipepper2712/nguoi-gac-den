// Mọi con số cân bằng và tham số hiển thị nằm ở đây. Chỉnh số thì sửa file này, không đụng logic.

export const CONFIG = {
  // Màu khoá trong model Kenney Modular (tools/import_kenney.mjs ghi vào), render sơn lại theo từng nhà
  colorKeys: { wall: 0xfeeffe, accent: 0xd96f4a },
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
  village: {
    houses: 10,           // số nhà lúc đầu (sau này tăng theo uy tín và vùng bảo vệ)
    center: [0, 5],       // tâm khu dân cư (ngoài cổng đền, cùng hướng mặt tiền)
    minDist: 3,           // không xây trong bán kính này quanh đền
    maxDist: 7,
    levelPenalty: 0.8,    // ưu tiên ô cùng bậc với sân đền
    centerPull: 0.6,      // mức kéo nhà về phía tâm làng so với ưu tiên đường nối ngắn
    flatRoofShare: 0.6,   // tỉ lệ nhà mái bằng
    twoFloorShare: 0.45,  // trong nhà mái bằng: tỉ lệ 2 tầng (tối đa 2)
    wideShare: 0.3,       // trong nhà mái bằng: tỉ lệ nhà rộng 2 gian
    thatchShare: 0.2,     // trong nhà mái ngói: tỉ lệ còn mái rơm
    shopShare: 0.4,       // tỉ lệ nhà có bảng hiệu
    lampEvery: 2,         // đèn đường mỗi n ô đường
    signs: ['Tạp hoá', 'Cà phê', 'Sửa xe', 'Cơm bình dân', 'Hớt tóc', 'Bánh mì', 'Thuốc lá', 'Bún bò'],
    paints: [0xf2d98a, 0xbcd9e0, 0xf0c4b8, 0xcfe3c0, 0xf4efe4, 0xe8cfa0], // màu sơn tường nhà mái bằng
    accents: [0x6fa86a, 0xd96f4a, 0x6f8fb8, 0xe0b04a],                    // màu mái hiên, cửa cuốn
    flatScale: 0.6,       // 1 gian Modular (1×0.63×1) thu về kích thước bản đồ
    tileScale: 0.8,       // nhà mái ngói dựng bằng code
    setback: 0.25,        // lùi nhà về sau tâm ô, chừa sân trước
  },
  // Model dùng cho khu dân cư (assets/kenney/<đường dẫn>.glb)
  villageModels: {
    cells: ['modular/building-block', 'modular/building-door', 'modular/building-window', 'modular/building-windows',
      'modular/building-door-window', 'modular/building-window-awnings', 'modular/building-window-balcony'],
    roof: ['modular/roof-flat-top'],
    extras: ['modular/detail-ac-a', 'modular/door-brown'],
    garden: ['nature/fence_simpleLow', 'nature/path_stone', 'nature/pot_large', 'nature/pot_small', 'nature/flower_purpleA',
      'nature/flower_redA', 'nature/flower_yellowA', 'nature/crops_leafsStageB', 'nature/plant_flatShort', 'nature/plant_bushSmall'],
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
