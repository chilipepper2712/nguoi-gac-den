# Người gác đền — hướng dẫn cho Claude

Demo game quản lý + nhập vai, chạy trên trình duyệt, 3D low-poly bằng Three.js.
Thiết kế, quyết định đã chốt và câu hỏi còn mở: `docs/design.md`. **Đọc file đó trước khi làm gì liên quan gameplay.**

## Chạy, test, kiểm hình

```bash
npm run serve                                   # http://localhost:8080 (python3 http.server)
npm test                                        # node --test, logic thuần
node tools/shot.mjs                             # chụp shots/shot.png (1280x800)
node tools/shot.mjs --size 390x844 --out shots/phone.png
node tools/shot.mjs --size 844x390 --query "debug=1&seed=7"   # ngang, hiện draw calls
```

- Không có bước build. Three.js vendor sẵn ở `vendor/three/`, nạp qua import map trong `index.html`.
  Cần thêm addon của Three.js thì copy đúng file từ gói npm `three@0.187.0` (`examples/jsm/...`) vào `vendor/three/addons/` với cùng đường dẫn con; không đổi phiên bản lẻ tẻ.
- Sửa phần hiển thị thì **phải chạy `tools/shot.mjs` và xem ảnh** trước khi báo xong. Tool báo lỗi nếu console có lỗi.
- Sửa logic thì phải chạy `npm test`, thêm test cho luật mới.

## Kiến trúc (giữ đúng, test có kiểm tra một phần)

- `src/sim/` — luật chơi và state, **logic thuần**: không import `three`, không import `src/render/`, không đụng `document`/`window`, không dùng `Math.random` (dùng `src/sim/rng.js`, trạng thái RNG nằm trong state).
- State phải JSON-serializable (không class, không Map/Set, không tham chiếu vòng). Đổi cấu trúc state thì tăng `SAVE_VERSION` trong `src/sim/state.js`.
- `src/render/` — chỉ đọc state để vẽ, không sửa luật.
- `src/config.js` — mọi con số cân bằng và tham số hiển thị. Không rải số "ma thuật" trong logic.
- `src/sim/hex.js` toán lục giác (axial, đỉnh nhọn, hướng d ↔ góc 60°·d). `src/sim/terrain.js` sinh bản đồ bậc + dốc, có luật đi lại (`canStep`).
- `src/render/placeholder.js` là khối đền tạm, thay khi có mô hình đền thật.

## Hiệu năng (bắt buộc — mục tiêu: điện thoại tầm trung chạy mượt, không nóng máy)

- Vật thể lặp lại (cây, đá, nhà, người, ma) dùng `InstancedMesh` hoặc gộp geometry. Không tạo `Mesh` riêng cho từng cái.
- Địa hình tĩnh là một mesh duy nhất (`src/render/terrain.js`). Đổi địa hình thì dựng lại mesh, không thêm mesh theo ô.
- Vật liệu: `MeshLambertMaterial` hoặc rẻ hơn. Không dùng `MeshStandardMaterial`/`MeshPhysicalMaterial`.
- Chỉ một đèn đổ bóng (mặt trời/trăng). Không rải `PointLight`/`SpotLight` cho đèn lồng hay vùng pháp lực: làm giả bằng màu phát sáng, sprite, hoặc shader/texture trên mặt đất.
- Logic mô phỏng (AI dân, tìm đường) chạy theo nhịp thấp, không chạy mỗi khung hình.
- Theo dõi bằng `?debug=1` (draw calls, số tam giác). Ngân sách tạm: ≤ 100 draw calls, ≤ 150k tam giác.
  FPS đo trong headless (SwiftShader, render bằng CPU) không phản ánh máy thật; hiệu năng thật phải thử trên điện thoại.

## Quy tắc nội dung (bắt buộc)

- **Không gợi tôn giáo có thật nào**: không thập giá, chữ vạn, tượng Phật, mái vòm xanh kiểu nhà thờ Hy Lạp, chữ Phạn/Hán trên biển, tràng hạt, áo cà sa... Kiến trúc đền là kiểu hư cấu.
- Từ ngữ trung tính: "đền", "người giữ đền", "người hành lễ", "nghi lễ", "lễ hội", "khách viếng", "pháp lực", "yêu ma". Tránh "chùa", "nhà thờ", "sư", "cha xứ", "Phật", "Chúa".
- Thế giới hư cấu: tên làng, địa danh, sinh vật tự đặt.
- "Quyên góp" chỉ là tiền trong game, không bao giờ gắn với tiền thật.
- Nhân vật chính là **người trông coi, quản lý** — không phải người hành lễ.

## Quy ước

- Chuỗi hiển thị cho người chơi: tiếng Việt. Tên biến, hàm, file: tiếng Anh. Comment: tiếng Việt, ngắn.
- Commit message: tiếng Việt.
- Câu hỏi thiết kế còn mở trong `docs/design.md` thì **không tự quyết** — hỏi người dùng. Gặp chỗ mơ hồ không nằm trong danh sách đó thì chọn phương án đơn giản nhất, ghi lại vào `docs/design.md`.
- Không thêm thư viện/asset mới khi chưa kiểm tra license (chỉ nhận CC0 hoặc MIT/tương đương) và ghi credit vào README.
