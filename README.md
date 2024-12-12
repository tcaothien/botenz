# Discord Bot - Quản lý tài chính và các tính năng khác

Bot này được xây dựng với Node.js và Discord.js, kết hợp với MongoDB để lưu trữ dữ liệu người dùng. Dưới đây là danh sách các lệnh mà bot hỗ trợ.

## Lệnh Bot

### **Lệnh chung**

- **`ehelps`**: Hiển thị danh sách các lệnh của bot.
- **`exu`**: Hiển thị số dư hiện tại của bạn.
- **`edaily`**: Nhận tiền hàng ngày (từ 10,000 đến 50,000 xu).
- **`egives [@user] [amount]`**: Chuyển tiền cho người dùng khác.
- **`emarry [@user]`**: Kết hôn với người dùng khác (tốn 5,000,000 xu).
- **`edivorce`**: Ly hôn (tốn 5,000,000 xu).
- **`epmarry`**: Hiển thị trạng thái kết hôn và điểm yêu thương của cặp đôi.
- **`elove [@user]`**: Gửi điểm yêu thương cho người khác (mỗi giờ 1 lần, cộng 1 điểm).
- **`etx`**: Thực hiện các giao dịch tài chính và chơi tài xỉu.

### **Lệnh dành cho admin**

- **`eaddxu [amount]`**: Cộng thêm xu vào tài khoản của bạn (chỉ admin).
- **`edelxu [amount]`**: Trừ xu khỏi tài khoản của bạn (chỉ admin).
- **`eaddreply [reply]`**: Thêm câu trả lời tự động (chỉ admin).
- **`edelreply [reply]`**: Xóa câu trả lời tự động (chỉ admin).
- **`elistrepy`**: Hiển thị tất cả câu trả lời tự động của bạn (chỉ admin).
- **`etop`**: Hiển thị bảng xếp hạng người dùng có số dư cao nhất.

## Cách sử dụng lệnh

### 1. **Lệnh `ehelps`** - Hiển thị tất cả lệnh bot
