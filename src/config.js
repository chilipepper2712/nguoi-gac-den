// Mọi con số cân bằng và tham số hiển thị nằm ở đây. Chỉnh số thì sửa file này, không đụng logic.

export const CONFIG = {
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
  view: {
    background: 0xcfe3e6, // nền pastel nhạt
    maxPixelRatio: 2,
  },
};
