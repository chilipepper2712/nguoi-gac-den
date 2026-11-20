# Người gác đền (tên tạm)

Demo game quản lý + nhập vai: một nhân viên văn phòng thất bại thừa kế ngôi đền hoang của ông cậu, về quê dọn dẹp, sửa sang, và dần dần giữ cả vùng an toàn khỏi yêu ma.

Trạng thái: **thử phong cách** — địa hình lục giác nhiều bậc, cây, đền hoang/đã sửa, ngày đêm, ma; chưa có gameplay. Thiết kế và các câu hỏi còn mở: [`docs/design.md`](docs/design.md).

## Chạy

```bash
npm run serve        # hoặc: python3 -m http.server 8080
# mở http://localhost:8080
```

Không cần build. Tham số URL: `?seed=123` (bản đồ khác), `?t=0.92` (giờ trong ngày, 0 = nửa đêm), `?temple=1` (đền đã sửa), `?pause=1`, `?dist=24` (cận cảnh), `?panel=0` (ẩn bảng thử), `?debug=1` (fps, draw calls, số tam giác).

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
tools/import_kenney.mjs  nhập model Kenney, tô lại theo bảng màu game
tools/flatten_glb.mjs    chuyển model AI về low-poly màu phẳng
tests/              node --test
docs/design.md      thiết kế, quyết định, câu hỏi mở
```

## Credit

- Cây, đá, cỏ hoa, đồ đổ nát: [Kenney](https://www.kenney.nl) Nature Kit, Survival Kit — CC0 (`assets/kenney/LICENSE-*.txt`), đã tô lại theo bảng màu game bằng `tools/import_kenney.mjs`.
- [three.js](https://threejs.org) r187 — MIT, xem `vendor/three/LICENSE`.
- `assets/props/hero_tree.glb`: sinh bằng AI (Higgsfield, Hunyuan3D) theo yêu cầu của tác giả game, đã chuyển về low-poly màu phẳng bằng `tools/flatten_glb.mjs`.
