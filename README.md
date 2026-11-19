# Người gác đền (tên tạm)

Demo game quản lý + nhập vai: một nhân viên văn phòng thất bại thừa kế ngôi đền hoang của ông cậu, về quê dọn dẹp, sửa sang, và dần dần giữ cả vùng an toàn khỏi yêu ma.

Trạng thái: **khung dự án** — có địa hình lục giác nhiều bậc, chưa có gameplay. Thiết kế và các câu hỏi còn mở: [`docs/design.md`](docs/design.md).

## Chạy

```bash
npm run serve        # hoặc: python3 -m http.server 8080
# mở http://localhost:8080
```

Không cần build. Tham số URL: `?seed=123` (bản đồ khác), `?debug=1` (hiện fps, draw calls, số tam giác).

## Phát triển

```bash
npm test                                   # test logic (node --test)
node tools/shot.mjs                        # chụp màn hình vào shots/ (cần Playwright)
```

## Cấu trúc

```
index.html          import map cho Three.js
src/main.js         khởi động, vòng lặp khung hình
src/config.js       mọi con số cân bằng và tham số hiển thị
src/sim/            luật chơi + state, logic thuần (không three, không DOM)
src/render/         Three.js: camera, ánh sáng, vẽ cảnh
vendor/three/       Three.js r187 (MIT)
tools/shot.mjs      chụp màn hình bằng Chromium headless
tests/              node --test
docs/design.md      thiết kế, quyết định, câu hỏi mở
```

## Credit

- [three.js](https://threejs.org) r187 — MIT, xem `vendor/three/LICENSE`.
