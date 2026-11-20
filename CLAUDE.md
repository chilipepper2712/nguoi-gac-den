# Người gác đền — hướng dẫn cho Claude

Demo game quản lý + nhập vai, chạy trên trình duyệt, 3D low-poly bằng Three.js.
Thiết kế, quyết định đã chốt và câu hỏi còn mở: `docs/design.md`. **Đọc file đó trước khi làm gì liên quan gameplay.**
Danh sách việc theo giai đoạn (ghi rõ việc nào cho model mạnh/nhẹ, việc nào đang chờ người dùng): `docs/tasks.md`. Làm xong việc nào thì chuyển nó lên mục "Đã xong".

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
- State phải JSON-serializable (không class, không Map/Set, không tham chiếu vòng). Đổi cấu trúc state thì **tăng `SAVE_VERSION`** trong `src/sim/state.js` — người chơi có bản lưu cũ trên GitHub Pages, quên tăng là game mở bản lưu cũ thiếu trường rồi lỗi.
  Lưu trong trình duyệt: `src/ui/save.js` (tự lưu mỗi sáng / 30 giây / khi rời trang). Có tham số thử nghiệm trên URL thì luôn chơi mới và không tự lưu; `?new=1` xoá bản lưu.
- Vòng chơi: `src/sim/temple.js` (đồ đổ nát 3 khu, `commandClean`/`tickTasks`, `auraRadius` theo pháp lực), `src/sim/economy.js` (quyên góp khi viếng), `src/sim/mood.js` (hạnh phúc, đức tin, suy nghĩ, mong ước).
  Giao diện: `ui/hud.js` (chỉ số), `ui/worldui.js` (tiến độ, chữ bay, thông báo — đọc `state.events`), `ui/personpanel.js` (chạm người dân), `ui/input.js` (chạm vs kéo).
- `src/render/` — chỉ đọc state để vẽ, không sửa luật.
- `src/config.js` — mọi con số cân bằng và tham số hiển thị. Không rải số "ma thuật" trong logic.
- `src/sim/hex.js` toán lục giác (axial, đỉnh nhọn, hướng d ↔ góc 60°·d). `src/sim/terrain.js` sinh bản đồ bậc + dốc, có luật đi lại (`canStep`).
- `src/sim/clock.js` đồng hồ ngày đêm trong state. `src/sim/flora.js` vị trí cây/bụi/đá + cây cổ thụ (landmark).
- `src/render/fakelight.js`: mọi vật liệu Lambert mới phải gắn `applyFakeLight(obj)` (hoặc `withFakeLight(mat)`) để nhận ánh đèn ban đêm; chỉ mặt đất dùng `{ aura: true }`.
  Đèn vẽ vào **bản đồ sáng** (texture nhìn từ trên xuống, chi phí cố định theo số đèn). Thêm đèn: `createLamps(tênNhóm)` trong `src/render/lamps.js` rồi `.set(points)`.
- `src/sim/village.js` khu dân cư kiểu Godus: ô đất có nhà (lõi làng 2–3 nhà nhỏ một ô, rìa thưa), đường nối về cổng đền, đèn đường; không đặt nhà ở chỗ thắt nút.
  `src/render/village.js` vẽ cả làng thành 1 mesh; nhà là **nhà khối kiểu Godus** (`src/render/props/blockhouse.js`: hộp vuông/so le/chữ nhật, tường kem, mái ngói thấp / mái bằng / mái rơm).
  Biển hiệu tiếng Anh chung chung (`CONFIG.village.signs`) + một biển thương hiệu `CONFIG.village.brandSign` chữ trắng nền đen.
- `src/sim/people.js` dân làng + nhân vật chính (đi lại theo ô đi được, đêm về nhà). `src/render/people.js` người khối chibi dựng bằng code:
  mỗi kiểu tóc một InstancedMesh, màu theo người qua thuộc tính instance, tay chân vung trong shader. **Chiều cao người `CONFIG.people.height` là thước căn tỉ lệ** (đền `temple.scale`, nhà `village.houseScale`).
- `src/sim/talisman.js` vẽ bùa: hình tự chế (không chữ Hán, không mẫu phù chú thật), chấm điểm nét vẽ, ghép bùa 1/3 hình. Thêm hình mới thì chạy test "vẽ nhầm sang hình khác < mức đậu" — hình na ná nhau phải sửa hình, không nới ngưỡng.
  `src/ui/talisman.js` màn vẽ (DOM + canvas 2D, không qua Three.js).
- `src/render/props/temple.js` đền + cổng theo `condition` (0 hoang tàn → 1 đã sửa). `src/ui/devpanel.js` là bảng thử tạm, không phải UI game.
- Tham số URL xem nhanh: `?t=0.92` (giờ), `?temple=1`, `?pause=1`, `?walk=1` (người vẫn đi khi dừng giờ), `?dist=24` (cận cảnh), `?look=q,r` (nhìn vào ô), `?az=độ` (xoay camera), `?panel=0`, `?debug=1`, `?trace=1|3&glyph=song,nui` (mở màn vẽ bùa).

## Hiệu năng (bắt buộc — mục tiêu: điện thoại tầm trung chạy mượt, không nóng máy)

- Vật thể lặp lại (cây, đá, nhà, người, ma) dùng `InstancedMesh` hoặc gộp geometry. Không tạo `Mesh` riêng cho từng cái.
- Địa hình tĩnh là một mesh duy nhất (`src/render/terrain.js`). Đổi địa hình thì dựng lại mesh, không thêm mesh theo ô.
- Vật liệu: `MeshLambertMaterial` hoặc rẻ hơn. Không dùng `MeshStandardMaterial`/`MeshPhysicalMaterial`.
- Chỉ một đèn đổ bóng (mặt trời/trăng). Không rải `PointLight`/`SpotLight` cho đèn lồng hay vùng pháp lực: làm giả bằng màu phát sáng, sprite, hoặc shader/texture trên mặt đất.
- Logic mô phỏng (AI dân, tìm đường) chạy theo nhịp thấp, không chạy mỗi khung hình.
- Theo dõi bằng `?debug=1` (draw calls, số tam giác). Ngân sách tạm: ≤ 100 draw calls, ≤ 150k tam giác.
  FPS đo trong headless (SwiftShader, render bằng CPU) không phản ánh máy thật; hiệu năng thật phải thử trên điện thoại.

## Asset

- **Dựng bằng code**: công trình có nhiều trạng thái (đền, nhà dân, công trình: hoang → dọn → sửa → nâng cấp), địa hình, người.
- **Kenney (CC0)**: Nature Kit, Survival Kit. Modular Buildings đã thử rồi thay bằng nhà khối kiểu Godus dựng bằng code (công cụ nhập vẫn hỗ trợ `--kit modular`). Hexagon Kit chưa dùng. Zip gốc không lưu trong repo — người dùng tự tải ở kenney.nl (trang chặn tải tự động, không lách).
  Nhập: `node tools/import_kenney.mjs --kit nature|survival|modular --src "<thư mục GLB đã giải nén>" --out assets/kenney/<kit> <tên model...>`.
  Công cụ tô lại theo **bảng màu game** (bảng `NATURE` theo tên vật liệu, `ATLAS[kit]` theo ô màu của texture — mỗi bộ xếp ô khác nhau, kiểm ô từng khối dùng trước khi ánh xạ).
  GLB do gltf-transform xuất có thuộc tính xếp xen kẽ: đọc đỉnh bằng `getX/getY/getZ`, không đọc thẳng `.array`. Không dùng màu gốc Kenney (xanh ngọc, cam đậm lệch ảnh tham khảo).
  Model cây cỏ khai báo trong `CONFIG.flora.models`; đồ đổ nát quanh đền trong `CONFIG.temple.ruinDebris`. Nạp bằng `src/render/models.js` (`loadGeometry`).
- **AI (Higgsfield)**: đồ hữu cơ, đứng một mình, không cần trạng thái (cây đặc biệt, đá, đồ trang trí, con vật, hình ma). Quy trình rẻ nhất đã thử:
  1. Ảnh nguồn bằng `gpt_image_2_6` (0.25 credit). Prompt mẫu:
     `Single low-poly 3D game asset: <mô tả vật>. Flat-shaded faceted polygons, no texture detail, soft pastel palette (<màu>). Isolated, centered, entire object in frame, three-quarter view from slightly above, plain pure white background, no ground, no shadow, no text.`
  2. Chuyển 3D bằng `sam_3_3d` (1 credit). Lỗi thì thử lại **một lần** với `prompt` là tên vật (job lỗi được hoàn credit).
     `hunyuan3d_v3_image_to_3d` + `generate_type: LowPoly` (14 credit, ~6 phút, texture 4096² ~10MB) chỉ dùng cho asset nổi bật khi SAM ra hình kém. Meshy (25) và Tripo (31) chưa cần.
  3. `npm run flatten -- in.glb out.glb --ratio 0.2 --palette "<nhóm tối→sáng>;<nhóm>"`: giảm tam giác, bỏ texture, ép màu từng mặt về bảng màu game.
  4. Xem cạnh nhau trên địa hình: `?lab=props&glb=a.glb,b.glb` (file trong `assets/_lab/`, thư mục này không commit).
- Luôn báo giá trước (`get_cost: true` cho 3D, `estimate_image_cost` cho ảnh). Không sinh hàng loạt khi chưa thử 1 món.
- Ngân sách mỗi asset sau khi chuyển: ≤ 3k tam giác, không texture.

## Quy tắc nội dung (bắt buộc)

- **Không gợi tôn giáo có thật nào**: không thập giá, chữ vạn, tượng Phật, mái vòm xanh kiểu nhà thờ Hy Lạp, chữ Phạn/Hán trên biển, tràng hạt, áo cà sa... Kiến trúc đền là kiểu hư cấu.
- Từ ngữ trung tính: "đền", "người giữ đền", "người hành lễ", "nghi lễ", "lễ hội", "khách viếng", "pháp lực", "yêu ma". Tránh "chùa", "nhà thờ", "sư", "cha xứ", "Phật", "Chúa".
- Thế giới hư cấu: tên làng, địa danh, sinh vật tự đặt.
- Cổng, cột: tránh cột đỏ + xà ngang không mái (dễ giống cổng torii). Không tháp nhiều tầng, không hoa sen làm hoạ tiết, không đèn đá kiểu tōrō.
- Ma: dễ thương (thân tròn, mắt to, má hồng), không máu me; không khí đêm mới là phần đáng sợ.
- Hình vẽ bùa / hoạ tiết: tự chế, và **không được vô tình thành biểu tượng tôn giáo có thật**: cá Ichthys (hai cung bắt chéo), trăng lưỡi liềm + sao, thánh giá, chữ vạn,
  sao 5 cánh / 6 cánh, ankh, chữ Om, âm dương, bát quái, bánh xe pháp, mắt trong tam giác. Thêm hình mới thì xem ảnh chụp và soát danh sách này.
- "Quyên góp" chỉ là tiền trong game, không bao giờ gắn với tiền thật.
- Nhân vật chính là **người trông coi, quản lý** — không phải người hành lễ.

## Quy ước

- Chuỗi hiển thị cho người chơi: tiếng Việt. Tên biến, hàm, file: tiếng Anh. Comment: tiếng Việt, ngắn.
- Commit message: tiếng Việt.
- Câu hỏi thiết kế còn mở trong `docs/design.md` thì **không tự quyết** — hỏi người dùng. Gặp chỗ mơ hồ không nằm trong danh sách đó thì chọn phương án đơn giản nhất, ghi lại vào `docs/design.md`.
- Không thêm thư viện/asset mới khi chưa kiểm tra license (chỉ nhận CC0 hoặc MIT/tương đương) và ghi credit vào README.
