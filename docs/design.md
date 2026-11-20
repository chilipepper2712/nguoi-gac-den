# Người gác đền — thiết kế

Tên tạm. Tài liệu sống: cập nhật khi có quyết định mới.

## Ý tưởng

Một nhân viên văn phòng tầm thường, bị sếp và đồng nghiệp coi thường, nhận thư từ luật sư: ông cậu (người giữ đền) vừa mất, để lại cho anh ta một ngôi đền ở quê. Uất ức, anh nghỉ việc về quê. Ngôi đền hoá ra tồi tàn như đền hoang.

Người chơi là **người trông coi và quản lý**, không phải người hành lễ: dọn dẹp từng khu, sửa sang, nhận quyên góp, tuyển người phụ, mời người diễn thuyết, xây nhà nguyện, công trình, vườn, khu lưu tro cốt, tổ chức nghi lễ và lễ hội (mô phỏng lễ hội ngoài đời, không thuộc tôn giáo cụ thể nào).

**Pháp lực**: đền tàn tạ, ít người viếng → pháp lực yếu → yêu ma quấy phá vùng quanh đền, dân gặp chuyện dị thường, có người bị bắt. Đền được sửa, mở rộng, đông khách → pháp lực mạnh, lan toả thành một vùng bảo vệ đền và dân cư.

**Ngày đêm**: ban ngày ít ma, có sự kiện nhỏ, minigame tương tác môi trường, nhiệm vụ. Ban đêm ma nhiều hơn.

## Đã chốt

- Nền tảng: web, Three.js (vendor, không build). Repo riêng, không dùng chung code với Turnbase1.
- Thiết bị: điện thoại, cả dọc lẫn ngang. **Tối ưu hiệu năng từ đầu**: không nóng máy, không giật trên máy tầm trung.
- Phong cách hình: 3D low-poly, flat shading, màu pastel, camera nhìn chéo từ trên cao, mô hình khối đơn giản.
  Tham khảo (không lưu trong repo vì là ảnh game của người khác, repo public): Godus — địa hình nhiều tầng như đường đồng mức, nhà khối trắng mái cam, tông vàng xanh ấm; vài game/diorama đảo lưới lục giác — ô có độ dày, cạnh sạch, nước xanh nhạt, ô trống có dấu "+".
  Ảnh tham khảo chỉ là phong cách vẽ. Kiến trúc: **phương Đông, đơn giản, hư cấu**.
- Bản đồ: lưới lục giác, **đền ở tâm**, quanh là khu dân cư, đồi núi, đất trống. Có bậc cao thấp và dốc nối (đã có: `src/sim/terrain.js`). Càng về sau càng nhiều dân đến ở, làng mở rộng.
- Camera: zoom xa để xây dựng/quản lý, zoom gần để bám nhân vật, chạm đâu nhân vật đi tới đó.
- Thời gian chạy liên tục, ngày đêm tự động.
- Ban đêm nhân vật làm việc của người trông coi; sự kiện đặc biệt có hướng dẫn riêng của sự kiện.
- Người hành lễ là NPC được mời/thuê; người chơi lo chuẩn bị. NPC cấp cao chỉ mời được khi đạt ngưỡng.
- **Thua**: chỉ phá sản là thua hẳn.
- **Ma bắt người**: ma bắt rồi giấu người (không giết). Cứu được: ban đêm tìm và bắt đúng con ma đó bằng **một vật phẩm đã được làm phép**; đánh tới khi ma hết máu thì ma xin thả người để được tha.
- **Hai chỉ số**: pháp lực (bảo vệ, vùng phủ) và uy tín (mở NPC, quyên góp, dân đến ở).
- **Phạm vi demo** ~20–30 phút: intro → về đền → dọn 3 khu → sửa 1, xây 1 công trình → thuê 1 người → 3–5 ngày đêm, ma tăng dần → 1 minigame → kết thúc ở lễ hội đầu tiên.
- **Intro**: truyện tranh dựng bằng cảnh 3D trong game, bỏ qua được; dùng lại cho cảnh cắt sự kiện. Hướng dẫn chơi diễn ra ở đền.
- **UI**: thiết kế cho màn hình dọc trước; ngang dùng cùng HUD sắp xếp lại.
- **Làng**: làng quê thời nay — nhà mái bằng (tối đa 2 tầng, tường sơn màu, khối Kenney Modular) xen nhà mái ngói (dựng bằng code); sân trước có lối đá, hàng rào, hoa, rau; biển hiệu quán xá; đèn hiên, đèn cửa, đèn đường; đường đi bộ nối về cổng đền.
- **Đuổi ma = vẽ bùa**: người chơi dùng ngón tay đồ theo hình trên một tờ giấy vàng, nét đỏ. Bùa yếu 1 hình, bùa mạnh 3 hình (thứ tự ngẫu nhiên). Hình mới mở khoá theo mức pháp lực.
- **Vật phẩm**: chuông, đèn lồng… dùng được; tránh biểu tượng tôn giáo.
- Tone: **ấm áp, hài** là nền; ban đêm không khí đáng sợ (tối, lạnh, sương) nhưng **ma dễ thương**.
- Asset: hybrid. Code dựng công trình nhiều trạng thái, địa hình, cây thường (vài dáng đơn giản rải theo cụm). AI (Higgsfield) cho đồ hữu cơ nổi bật.
  Cây cổ thụ cạnh đền: dáng cây đa, **bỏ rễ thả từ tán** (Hunyuan LowPoly, `assets/props/hero_tree.glb`).
  Bộ Kenney CC0 người dùng chọn: Hexagon Kit, Nature Kit, Survival Kit (người dùng tự tải vì kenney.nl chặn tải tự động).
  Giữ **bảng màu của game** (theo ảnh tham khảo), tô lại Kenney cho khớp; không lấy màu gốc Kenney.
  Đang dùng: cây (7 dáng), bụi, đá, cỏ/hoa/nấm/gốc cây từ Nature Kit; đồ đổ nát quanh đền hoang (gỗ mục, ván, thùng, giàn gỗ, biển chỉ đường) từ Survival Kit.
  Hexagon Kit chưa dùng (nhà kiểu châu Âu, địa hình đã tự dựng).
- Nhân vật chính là nam. Chuỗi UI tiếng Việt. Lưu game trên trình duyệt.

## Đề xuất, chờ người dùng xác nhận

- Nhân vật: người khối low-poly ghép từ vài khối cứng, không dùng khung xương, vẽ hàng loạt bằng instancing (không dùng pixel sprite).
- Tone nền: ấm áp, hài trong thoại; rùng rợn là gia vị theo sự kiện đêm.
- Có tạm dừng và tua nhanh (1x/2x/3x).
- Khởi động đầu game (thoát vòng xoáy chết): khoản tiền thừa kế/tiền nghỉ việc ban đầu; dọn dẹp tốn công chứ không tốn tiền và tự tăng chút pháp lực; một NPC quen ông cậu giúp mấy ngày đầu.
- Kìm lăn cầu tuyết về sau: chi phí duy trì, vùng bảo vệ càng rộng thì ranh giới phải giữ càng dài, sự kiện mạnh hơn theo quy mô.
- Dốc vẽ thành bậc đá cho dễ nhận ra lối đi.
- Ý tưởng cốt truyện: người ở công ty cũ (ví dụ ông sếp) về sau bị ma ám, phải tìm đến chính ngôi đền.

## Bản thử phong cách (đã có)

- Đền phương Đông hư cấu dựng bằng code, hai trạng thái hoang tàn / đã sửa (mái võng thủng rêu, cột gãy, gạch vụn ↔ mái ngói cong, đèn lồng). Cổng gỗ tối có mái nhỏ (tránh cột đỏ + xà ngang dễ giống torii).
- Ngày đêm theo đồng hồ trong state (`src/sim/clock.js`), 1 ngày = 8 phút ở 1x.
- Ánh sáng giả cho điện thoại (`src/render/fakelight.js`): quầng đèn lồng + vòng pháp lực trên mặt đất, không dùng PointLight.
- Ma dễ thương phát sáng ban đêm, lượn ngay ngoài mép vùng pháp lực: đền hoang → vùng nhỏ, ma kéo sát đền; đền sửa → vùng nở, ma bị đẩy lùi. (Bán kính tạm suy từ trạng thái đền; sau tính từ pháp lực.)
- Bậc đá trên ô dốc. Bảng thử ở đáy màn hình: kéo giờ, chạy/dừng, tốc độ, đổi trạng thái đền.

## Thử nghiệm asset AI (cây đa, 2026-11-19)

Cùng một ảnh nguồn (gpt_image_2_6, 0.25 credit), so trên địa hình thật:

| Cách | Credit | Thời gian | Kết quả thô | Sau `flatten_glb` |
|---|---|---|---|---|
| Dựng bằng code | 0 | — | 1.0k tam giác, chung chung, thiếu nét cây đa | — |
| SAM 3 3D | 1 | ~1 phút | 13.3k tam giác + texture 1MB; một cụm lá thấp che thân | 2.7k tam giác, ~190KB, không texture, đúng bảng màu |
| Hunyuan3D LowPoly | 14 | ~6 phút | 4.4k tam giác + texture 4096² ~10MB; thân xoắn, rễ phụ rõ nhất | 2.7k tam giác, ~190KB |

Kết luận: SAM + chuyển đổi là mặc định cho đồ hữu cơ; Hunyuan cho vài asset nổi bật. Code vẫn làm công trình nhiều trạng thái.

## Câu hỏi còn mở

1. Hình vẽ trên bùa: tự chế (khuyến nghị — đơn giản để đồ bằng ngón tay, không lấy chữ Hán / mẫu phù chú có thật) hay chép mẫu bùa thật? Gọi là "bùa" hay tên khác?
2. Người chơi tự vẽ bùa → nhân vật không còn chỉ là người trông coi. Chấp nhận thành cốt truyện "người trông coi dần thành người gác đền" (sức mạnh đến từ pháp lực của đền), hay giữ nguyên vai?
3. Vẽ hỏng thì sao (mất tờ bùa, ma hồi máu, ma chạy)? Có giới hạn thời gian không? Giấy/mực lấy ở đâu (đền cấp theo pháp lực, hay mua ở chợ làng)?

## Rủi ro thiết kế đã nêu

- **Vòng lặp dương**: đền đẹp → đông khách → pháp lực mạnh → ít ma → đông khách hơn. Chiều ngược lại: đền tàn → ma nhiều → khách sợ → đền tàn mãi. Dễ thành lăn cầu tuyết (qua ngưỡng là hết thử thách) hoặc vòng xoáy chết (đầu game kẹt). Cần lực kéo ngược.
- **Ban đêm**: đã có hành động chính (việc trông coi + cứu người bằng vật phẩm làm phép). Còn phải định nghĩa thao tác "đánh ma" trên điện thoại.
- **Trùng game khác**: mở đầu gần y hệt Stardew Valley (bỏ việc văn phòng, nhận thừa kế ở quê); phần quản lý gần Graveyard Keeper; "niềm tin từ dân làm tài nguyên" gần Godus (bị chê vì vòng thu thập lặp lại nhàm).
- **Bùa giấy vàng nét đỏ** là hình ảnh gắn chặt với phù chú Đạo giáo / tín ngưỡng dân gian; cơ chế "vẽ bùa trừ ma" chính là hình mẫu mà quy định VN gọi là mê tín dị đoan. Giảm rủi ro: hình vẽ tự chế, không chữ Hán, không bát quái/âm dương; cân nhắc đổi tên gọi.
- **Pháp lý VN**: quy định nội dung số có cấm tuyên truyền mê tín dị đoan; cơ chế "viếng nhiều thì trừ được ma" nằm gần vùng xám. Giảm rủi ro bằng thế giới hư cấu rõ ràng, không gắn quyên góp với tiền thật. Nếu phát hành ở VN cần hỏi người làm cấp phép.
