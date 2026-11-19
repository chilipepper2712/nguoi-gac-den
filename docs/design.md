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
- Thua / tổn thất thật: đền phá sản, bị ma ám, người bị bắt mất thật.
- Tone: pha trộn hài, ấm áp, rùng rợn tuỳ tình huống và nhiệm vụ.
- Nhân vật chính là nam. Chuỗi UI tiếng Việt. Lưu game trên trình duyệt.

## Đề xuất, chờ người dùng xác nhận

- Nhân vật: người khối low-poly ghép từ vài khối cứng, không dùng khung xương, vẽ hàng loạt bằng instancing (không dùng pixel sprite).
- Hướng màn hình ưu tiên khi thiết kế UI: dọc; ngang dùng cùng HUD sắp xếp lại.
- Intro: truyện tranh dựng bằng chính cảnh 3D trong game (khung hình + bóng thoại), bỏ qua được; hệ thống này dùng lại cho cảnh cắt của sự kiện. Hướng dẫn chơi diễn ra ở đền, không ở văn phòng.
- Tone nền: ấm áp, hài trong thoại; rùng rợn là gia vị theo sự kiện đêm.
- Có tạm dừng và tua nhanh (1x/2x/3x).
- Khởi động đầu game (thoát vòng xoáy chết): khoản tiền thừa kế/tiền nghỉ việc ban đầu; dọn dẹp tốn công chứ không tốn tiền và tự tăng chút pháp lực; một NPC quen ông cậu giúp mấy ngày đầu.
- Kìm lăn cầu tuyết về sau: chi phí duy trì, vùng bảo vệ càng rộng thì ranh giới phải giữ càng dài, sự kiện mạnh hơn theo quy mô.
- Ma ám / người bị bắt là tổn thất nặng có thể cứu lại bằng nhiệm vụ; chỉ phá sản là thua hẳn.
- Hai chỉ số tách riêng: **pháp lực** (bảo vệ, vùng phủ) và **uy tín** (mở NPC, quyên góp, dân đến ở).
- Dốc vẽ thành bậc đá cho dễ nhận ra lối đi.
- Phạm vi demo ~20–30 phút, kết thúc ở lễ hội đầu tiên.
- Ý tưởng cốt truyện: người ở công ty cũ (ví dụ ông sếp) về sau bị ma ám, phải tìm đến chính ngôi đền.

## Câu hỏi còn mở

1. Cái nào trong "phá sản / ma ám / bị bắt" là kết thúc game, cái nào là tổn thất cứu lại được?
2. "Pháp lực hay uy tín" là một chỉ số hay hai?
3. Tone nền mặc định là gì (để quyết bảng màu đêm, thiết kế ma, nhạc)?
4. Nguồn asset: dựng bằng code, bộ CC0, sinh bằng AI, hay tự dựng?
5. Phạm vi demo: cái gì bắt buộc phải có?

## Rủi ro thiết kế đã nêu

- **Vòng lặp dương**: đền đẹp → đông khách → pháp lực mạnh → ít ma → đông khách hơn. Chiều ngược lại: đền tàn → ma nhiều → khách sợ → đền tàn mãi. Dễ thành lăn cầu tuyết (qua ngưỡng là hết thử thách) hoặc vòng xoáy chết (đầu game kẹt). Cần lực kéo ngược.
- **Thiếu hành động chính ban đêm** nếu nhân vật không hành lễ (xem câu 6).
- **Không có thua** thì yêu ma chỉ là trang trí (xem câu 7).
- **Trùng game khác**: mở đầu gần y hệt Stardew Valley (bỏ việc văn phòng, nhận thừa kế ở quê); phần quản lý gần Graveyard Keeper; "niềm tin từ dân làm tài nguyên" gần Godus (bị chê vì vòng thu thập lặp lại nhàm).
- **Pháp lý VN**: quy định nội dung số có cấm tuyên truyền mê tín dị đoan; cơ chế "viếng nhiều thì trừ được ma" nằm gần vùng xám. Giảm rủi ro bằng thế giới hư cấu rõ ràng, không gắn quyên góp với tiền thật. Nếu phát hành ở VN cần hỏi người làm cấp phép.
