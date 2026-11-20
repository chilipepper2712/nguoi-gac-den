# Danh sách việc — bản demo

Mục tiêu demo (~20–30 phút, xem `docs/design.md`): intro truyện tranh → về đền → dọn 3 khu → sửa 1, xây 1 công trình → thuê 1 người → 3–5 ngày đêm, ma tăng dần → bắt ma bằng bùa → kết thúc ở lễ hội đầu tiên.

Ký hiệu model: **[mạnh]** = Fable/Opus (kiến trúc, hệ thống nối nhau, cân bằng) · **[nhẹ]** = Sonnet (làm theo khuôn có sẵn, nội dung, UI theo mô tả rõ).
Ký hiệu chặn: ⛔ = chờ người dùng quyết (xem cuối file).

## Đã xong (bản thử phong cách)

- Địa hình lục giác nhiều bậc + bậc đá; cây cỏ Kenney rải cụm; cây cổ thụ AI
- Đền + cổng hai trạng thái hoang/sửa; đồ đổ nát quanh đền hoang
- Ngày đêm, ánh sáng giả (bản đồ sáng), vòng pháp lực, ma dễ thương lượn ngoài vòng
- Làng kiểu Godus (nhà khối, đường, đèn, biển hiệu, BRAVO6); người chibi đi lại, đêm về nhà
- Vẽ bùa: 8 hình tự chế, chấm điểm, màn vẽ trên điện thoại
- Quy trình asset: Kenney → tô lại; AI → flatten; công cụ chụp kiểm tra

## Giai đoạn 1 — nền gameplay (làm trước, không bị chặn)

1. **[mạnh] Điều khiển nhân vật chính**: chạm ô → đi tới (tìm đường có sẵn trong `sim/people.js`), camera bám theo khi zoom gần, nút chuyển chế độ quản lý/nhập vai.
2. **[mạnh] Chỉ số + kinh tế ngày**: tiền, pháp lực, uy tín trong state; cuối ngày tính quyên góp theo khách viếng; vòng pháp lực tính từ pháp lực (thay cho trạng thái đền).
3. **[mạnh] Hệ tương tác**: chạm vật → hành động theo ngữ cảnh (dọn, sửa, nói chuyện), tốn thời gian, thanh tiến độ trên đầu nhân vật.
4. **[mạnh] Dọn 3 khu**: chia sân đền thành 3 khu; đồ đổ nát thành thực thể trong state; dọn xong khu → tăng trạng thái đền theo bậc (0 → 0.33 → 0.66 → 1) thay cho công tắc hoang/sửa.
5. **[nhẹ] HUD dọc**: thanh trên (tiền, pháp lực, uy tín, ngày giờ), thanh hành động dưới, thông báo nổi; thay bảng thử (giữ bảng thử sau `?debug=1`).
6. **[nhẹ] Lưu/tải** vào localStorage (state đã JSON-serializable), tự lưu mỗi sáng.

## Giai đoạn 2 — vòng chơi chính

7. **[mạnh] Sửa đền + xây 1 công trình** ⛔(công trình nào): chi phí tiền + thời gian, công trình tăng pháp lực/uy tín.
8. **[nhẹ] Thuê 1 người phụ**: NPC tự dọn/sửa theo hàng việc, trả lương mỗi ngày (dựa trên hệ tương tác ở việc 3).
9. **[mạnh] Ma ban đêm có luật**: số ma tăng theo ngày, ma tìm tới nhà ngoài vòng pháp lực, bắt người và giấu ở một ô ngoài vòng.
10. **[mạnh] Trận bắt ma** ⛔(vẽ hỏng thì sao): tìm ma đang giữ người → chạm ma → màn vẽ bùa → thanh máu ma giảm theo sát thương → hết máu ma xin tha và thả người.
11. **[nhẹ] Khách viếng ban ngày**: dân đi viếng đền tăng theo uy tín, góp tiền khi viếng; phản ứng sợ khi có người bị bắt.

## Giai đoạn 3 — mở đầu, kết thúc, hoàn thiện

12. **[mạnh] Hệ cảnh truyện tranh**: dựng khung tranh bằng cảnh 3D + bóng thoại, bỏ qua được; dùng cho intro và sự kiện.
13. **[nhẹ] Intro văn phòng**: dựng bối cảnh văn phòng bằng code theo khuôn của việc 12; viết thoại hài (sếp, đồng nghiệp, thư luật sư).
14. **[mạnh] Lễ hội đầu tiên = kết demo**: điều kiện kích hoạt (vòng pháp lực phủ làng), đông khách, đèn lồng, người hành lễ đến, cảnh truyện tranh kết.
15. **[nhẹ] Hướng dẫn chơi** ở khu dọn đầu tiên (gợi ý từng bước).
16. **[nhẹ] Âm thanh**: tiếng nền ngày/đêm, tiếng chổi, chuông, ma cười khúc khích, tiếng mực (nguồn CC0).
17. **[nhẹ] Chăm chút hình**: cửa sổ sáng ban đêm, phụ kiện người (kính, râu, mũ), thùng phi sai màu, dốc dễ nhận hơn.
18. **[mạnh] Hiệu năng trên máy thật** ⛔(cần người dùng thử điện thoại): cỡ bản đồ bóng, tỉ lệ điểm ảnh, giới hạn khung hình.

## Câu hỏi đang chặn

- ⛔ Việc 7: công trình xây đầu tiên trong demo là gì?
- ⛔ Việc 10: vẽ bùa hỏng thì sao; thời gian mỗi hình.
- ⛔ Bản đồ: đảo / thung lũng trong đất liền / mảnh đất lơ lửng (ảnh hưởng `sim/terrain.js`, nên chốt trước giai đoạn 2).
- Không chặn ngay: vai nhân vật (người trông coi dần thành người gác đền?) — cần trước việc 13.
