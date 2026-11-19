# Người gác đền — thiết kế

Tên tạm. Tài liệu sống: cập nhật khi có quyết định mới.

## Ý tưởng

Một nhân viên văn phòng tầm thường, bị sếp và đồng nghiệp coi thường, nhận thư từ luật sư: ông cậu (người giữ đền) vừa mất, để lại cho anh ta một ngôi đền ở quê. Uất ức, anh nghỉ việc về quê. Ngôi đền hoá ra tồi tàn như đền hoang.

Người chơi là **người trông coi và quản lý**, không phải người hành lễ: dọn dẹp từng khu, sửa sang, nhận quyên góp, tuyển người phụ, mời người diễn thuyết, xây nhà nguyện, công trình, vườn, khu lưu tro cốt, tổ chức nghi lễ và lễ hội (mô phỏng lễ hội ngoài đời, không thuộc tôn giáo cụ thể nào).

**Pháp lực**: đền tàn tạ, ít người viếng → pháp lực yếu → yêu ma quấy phá vùng quanh đền, dân gặp chuyện dị thường, có người bị bắt. Đền được sửa, mở rộng, đông khách → pháp lực mạnh, lan toả thành một vùng bảo vệ đền và dân cư.

**Ngày đêm**: ban ngày ít ma, có sự kiện nhỏ, minigame tương tác môi trường, nhiệm vụ. Ban đêm ma nhiều hơn.

## Đã chốt

- Nền tảng: web, Three.js (vendor, không build). Repo riêng, không dùng chung code với Turnbase1.
- Phong cách hình: 3D low-poly, flat shading, màu pastel, camera nhìn chéo từ trên cao (gần isometric), mô hình khối đơn giản, người nhỏ.
  Tham khảo (không lưu trong repo vì là ảnh game của người khác, repo public): Godus — địa hình nhiều tầng như đường đồng mức, nhà khối trắng mái cam, tông vàng xanh ấm; vài game/diorama dạng đảo lưới lục giác — ô lục giác có độ dày, cạnh sạch, nước xanh nhạt, ô trống có dấu "+" để mở rộng.
- Nhân vật chính là nam (theo mô tả gốc).
- Chuỗi UI tiếng Việt. Lưu game trên trình duyệt.

## Đề xuất, chờ người dùng xác nhận

- Bản đồ lưới lục giác; mỗi khu đền là một cụm ô, dọn xong thì mở (ăn khớp "dọn từng khu một" và ô "+").
- Camera zoom được: xa = xây dựng/quản lý, gần = bám nhân vật, chạm đâu đi tới đó.
- Người hành lễ là NPC được mời/thuê; người chơi lo chuẩn bị (sân bãi, vật phẩm, lịch, đón khách).
- Phạm vi demo ~20–30 phút: intro văn phòng ngắn → về đền → dọn 3 khu → sửa 1, xây 1 công trình → thuê 1 người → 3–5 ngày đêm, ma tăng dần → 1 minigame → kết thúc bằng lễ hội đầu tiên khi pháp lực phủ tới làng.
- Bước đầu tiên: cảnh test phong cách (khu đền hoang + bản đã sửa + chuyển ngày → đêm có đèn và một con ma) để duyệt hình trước khi làm hệ thống.
- Ý tưởng cốt truyện: người ở công ty cũ (ví dụ ông sếp) về sau bị ma ám, phải tìm đến chính ngôi đền — để đoạn intro văn phòng có vai trò về sau.

## Câu hỏi còn mở

1. Lưới lục giác hay địa hình tự do kiểu Godus?
2. Camera zoom như đề xuất có ổn không, hay muốn camera gần hơn hẳn?
3. Điện thoại cầm dọc hay máy tính màn ngang?
4. Ảnh tham khảo chỉ là phong cách vẽ, hay lấy cả kiến trúc Địa Trung Hải làm bối cảnh?
5. Thời gian chạy liên tục theo đồng hồ (có tạm dừng) hay chia lượt ngày/đêm?
6. Ban đêm khi ma đến, nhân vật làm gì?
7. Có trạng thái thua không? Đầu game thoát vòng "ít khách → ít pháp lực" bằng cách nào?
8. Người hành lễ là NPC như đề xuất — đúng chưa?
9. Trong phạm vi demo, cái gì bắt buộc phải có?
10. Tone chủ đạo: hài, ấm áp, hay rùng rợn?
11. Nguồn asset: dựng bằng code, bộ CC0 có sẵn, sinh bằng AI, hay tự vẽ/dựng?

## Rủi ro thiết kế đã nêu

- **Vòng lặp dương**: đền đẹp → đông khách → pháp lực mạnh → ít ma → đông khách hơn. Chiều ngược lại: đền tàn → ma nhiều → khách sợ → đền tàn mãi. Dễ thành lăn cầu tuyết (qua ngưỡng là hết thử thách) hoặc vòng xoáy chết (đầu game kẹt). Cần lực kéo ngược.
- **Thiếu hành động chính ban đêm** nếu nhân vật không hành lễ (xem câu 6).
- **Không có thua** thì yêu ma chỉ là trang trí (xem câu 7).
- **Trùng game khác**: mở đầu gần y hệt Stardew Valley (bỏ việc văn phòng, nhận thừa kế ở quê); phần quản lý gần Graveyard Keeper; "niềm tin từ dân làm tài nguyên" gần Godus (bị chê vì vòng thu thập lặp lại nhàm).
- **Pháp lý VN**: quy định nội dung số có cấm tuyên truyền mê tín dị đoan; cơ chế "viếng nhiều thì trừ được ma" nằm gần vùng xám. Giảm rủi ro bằng thế giới hư cấu rõ ràng, không gắn quyên góp với tiền thật. Nếu phát hành ở VN cần hỏi người làm cấp phép.
