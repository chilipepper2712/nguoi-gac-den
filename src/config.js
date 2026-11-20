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
    heroTreeHeight: 2.2,  // chiều cao cây cổ thụ (đơn vị thế giới)
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
    scale: 0.75,           // tỉ lệ đền + cổng (căn theo chiều cao người)
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
    houseTiles: 9,        // số ô đất có nhà lúc đầu (sau này tăng theo uy tín và vùng bảo vệ)
    coreShare: 0.5,       // tỉ lệ ô mọc trước (gần đền nhất) là lõi làng: 2–3 nhà nhỏ một ô
    tripleShare: 0.35,    // lõi làng: tỉ lệ ô 3 nhà (còn lại 2 nhà)
    edgePairShare: 0.25,  // rìa làng: tỉ lệ ô 2 nhà (còn lại 1 nhà)
    gardenShare: 0.4,     // nhà đứng riêng một ô: tỉ lệ có vườn (còn lại chỉ chậu cây hoặc trống)
    center: [0, 5],       // tâm khu dân cư (ngoài cổng đền, cùng hướng mặt tiền)
    minDist: 3,           // không xây trong bán kính này quanh đền
    maxDist: 7,
    levelPenalty: 0.8,    // ưu tiên ô cùng bậc với sân đền
    centerPull: 0.6,      // mức kéo nhà về phía tâm làng so với ưu tiên đường nối ngắn
    // Nhà khối kiểu Godus (src/render/props/blockhouse.js)
    shapeShares: { square: 0.55, stagger: 0.3, rect: 0.15 }, // vuông là chính, so le, chữ nhật ít
    twoFloorShare: 0.35,
    roofShares: { hip: 0.62, flat: 0.3, thatch: 0.08 },        // mái ngói thấp / mái bằng có gờ / mái rơm
    walls: [0xf4efe4, 0xf2ebdd, 0xefe6d2, 0xf3e6cf, 0xf0e2d6, 0xebe6d8], // tường kem như Godus
    shopShare: 0.4,       // tỉ lệ nhà có bảng hiệu
    lampEvery: 2,         // đèn đường mỗi n ô đường
    signs: ['GROCERY', 'COFFEE', 'REPAIR', 'NOODLES', 'BAKERY', 'BARBER', 'TEA', 'MARKET'],
    brandSign: 'BRAVO6',  // biển thương hiệu: chữ trắng nền đen, treo ở cửa hàng gần cổng đền nhất
    houseScale: 1.2,      // cửa nhà cao ≈ người (người chibi đầu to)
    setback: 0.25,        // lùi nhà về sau tâm ô, chừa sân trước (ô một nhà)
    smallHouseScale: 0.85, // nhà chung ô thu nhỏ
  },
  // Model dùng cho khu dân cư (assets/kenney/<đường dẫn>.glb)
  villageModels: {
    garden: ['nature/fence_simpleLow', 'nature/path_stone', 'nature/pot_large', 'nature/pot_small', 'nature/flower_purpleA',
      'nature/flower_redA', 'nature/flower_yellowA', 'nature/crops_leafsStageB', 'nature/plant_flatShort', 'nature/plant_bushSmall'],
  },
  people: {
    height: 0.26,         // chiều cao người (đơn vị thế giới) — thước để căn tỉ lệ nhà, đền
    perHouse: [1, 3],     // số người mỗi nhà
    speed: 0.45,          // tốc độ đi (đơn vị/giây)
    idle: [3, 14],        // đứng yên bao lâu giữa hai chuyến (giây)
    goHomeChance: 0.25,
    templeChance: 0.3,    // ban ngày: tỉ lệ đi viếng đền
    playerStart: [1, 1],  // ô nhân vật chính đứng lúc đầu (sân đền)
    hairStyles: 6,        // 0 ngắn · 1 dài · 2 búi · 3 hói/tóc bạc thưa · 4 nón lá · 5 mũ lưỡi trai
    skins: [0xf2d0b0, 0xe6bc94, 0xd4a27a, 0xb8865e],
    hairColors: [0x2b2522, 0x3d2c24, 0x5a4234, 0xbdb6ae, 0xe8e2da],
    shirts: [0xf4f1ea, 0x8fb8d8, 0xe9a3a0, 0xf2d98a, 0x9cc79a, 0xc9a8d8, 0xe09a5a, 0x6f8fb8, 0xd8d0c0],
    pants: [0x3d4558, 0x5a4a3e, 0x6b6f78, 0x2f3a4a, 0x8a7a62],
    // Nhân vật chính: dân văn phòng — áo sơ mi trắng, quần sẫm, tóc đen ngắn (chỉ số vào các bảng trên)
    playerLook: { hair: 0, skin: 1, hairColor: 0, shirt: 0, pants: 3 },
  },
  // Vẽ bùa đuổi ma (bản chơi thử). Hình tự chế trong src/sim/talisman.js.
  talisman: {
    glyphs: [               // unlock: mức pháp lực cần để mở hình (tạm: 0, 1, 2)
      { id: 'song', unlock: 0 }, { id: 'nui', unlock: 0 }, { id: 'xoay', unlock: 0 },
      { id: 'lua', unlock: 1 }, { id: 'set', unlock: 1 },
      { id: 'mam', unlock: 2 }, { id: 'mat', unlock: 2 }, { id: 'mua', unlock: 2 },
    ],
    samples: 40,            // số điểm lấy mẫu mỗi nét khi so
    tolGood: 0.03,          // lệch trung bình ≤ mức này (theo cạnh ô vẽ) = khớp hoàn toàn
    tolBad: 0.1,            // lệch ≥ mức này = 0 điểm (đã đo: vẽ nhầm hình nào cũng < 0.5)
    minLengthRatio: 0.35,   // nét vẽ ngắn hơn tỉ lệ này so với nét mẫu = 0 điểm
    extraStrokePenalty: 0.15,
    passScore: 0.6,         // điểm trung bình để bùa thành
    timePerGlyph: 7,        // giây cho mỗi hình
    baseDamage: 20,         // sát thương bùa 1 hình khi vẽ hoàn hảo (tạm)
    multiExponent: 1.3,     // bùa nhiều hình mạnh hơn cộng dồn
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
