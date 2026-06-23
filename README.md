# ✂️ Carousel Cut - Công cụ Cắt ảnh Carousel Chuyên nghiệp

**Carousel Cut** là một ứng dụng web gọn nhẹ, phát triển hoàn toàn ở phía client (Client-side), giúp cắt các bức ảnh ghép dài thành chuỗi các slide Carousel đồng đều, sắc nét để đăng lên các mạng xã hội như Instagram, TikTok, Facebook. 

Giao diện ứng dụng được thiết kế theo phong cách hiện đại, trực quan, hỗ trợ kéo thả trực tiếp, căn chỉnh lưới linh hoạt và tối ưu hóa chất lượng hình ảnh đầu ra.

---

## 🚀 Tính năng nổi bật

### 1. Hai chế độ cắt ảnh linh hoạt
* **Cắt theo lưới (Grid Mode)**:
  * Chia đều ảnh theo số hàng và số cột cấu hình sẵn.
  * Hỗ trợ **kéo thả tương tác trực tiếp** các đường lưới màu xanh trên Canvas để thay đổi kích thước từng ô cắt theo ý muốn.
* **Cắt tự do (Box Mode)**:
  * Cho phép người dùng nhấp kéo chuột trực tiếp trên ảnh để tự vẽ các khung cắt tự do.
  * Hỗ trợ các tính năng bổ trợ mạnh mẽ: **Khóa tỷ lệ khung hình** (1:1, 4:5, 16:9,...), **Đồng dạng kích thước** giữa tất cả các khung vẽ và **Bắt dính thông minh (Smart Snapping)** giúp các khung tự động căn thẳng hàng với nhau.

### 2. Giữ nguyên tỷ lệ kích thước gốc khi cắt (No Distortion Slicing)
* **Giải quyết bài toán ảnh bị méo**: Khi chia lưới không đều (Custom Grid) hoặc vẽ nhiều khung cắt (Box Mode) có kích thước và tỷ lệ khác nhau, ứng dụng tự động tính toán kích thước đầu ra động cho từng ô/khung cắt dựa trên kích thước vùng cắt thực tế nhân với tỷ lệ scale xuất khẩu.
* **Cơ chế tự động**: Đảm bảo tất cả các slide xuất ra luôn giữ đúng tỷ lệ gốc của vùng cắt, tuyệt đối không bị kéo giãn hay bóp méo hình ảnh, trong khi vẫn tối ưu hóa độ phân giải HD sắc nét.

### 3. Tự động xén rìa ngoài thông minh (Smart Outer Edge Padding)
* **Xén viền trong (Offset)**: Giúp loại bỏ khoảng trắng hoặc đường chỉ đen phân cách ở giữa các ô ghép.
* **Tự động xén rìa ngoài gấp đôi (2 * Offset)**: Rìa ngoài cùng của ảnh gốc (mép trái, phải, trên, dưới) thường dính các đường viền đen/trắng dày hơn. Ứng dụng tự động xén sâu gấp đôi ở rìa ngoài cùng, giúp ảnh cắt ra sạch sẽ hoàn toàn viền trắng mà không làm mất nội dung cốt lõi của ảnh.

### 4. Công nghệ phóng to thông minh & Độ phân giải xuất tùy biến
* **Tự động tối ưu HD**: Đo kích thước ô cắt, nếu nhỏ hơn chuẩn HD di động (1080px chiều rộng), ứng dụng tự động tính scale và phóng to ảnh lên đạt chuẩn 1080px.
* **Tùy chọn độ phân giải nâng cao**: Cho phép chọn chất lượng xuất từ **Chất lượng gốc (1x)**, **Sắc nét hơn (1.5x)**, **Siêu nét (2x)** cho đến **Cực nét (3x - Mặc định)**.
* **Chất lượng nội suy cao**: Sử dụng thuật toán `imageSmoothingQuality = 'high'` của trình duyệt để tái tạo pixel mịn màng, không bị vỡ hay mờ rạn hình ảnh.

### 5. Trải nghiệm người dùng (UX) cao cấp
* **Không cần cuộn chuột**: Sidebar cấu hình bên trái được tối giản kích thước, đảm bảo nút **"Cắt ảnh ngay"** luôn hiển thị gọn gàng trên màn hình.
* **Xem trước trực quan**: Canvas hiển thị vùng xén bằng màu đỏ mờ và vùng ảnh giữ lại bằng đường viền đứt nét màu xanh lá cây vô cùng trực quan.
* **Sắp xếp slide trực quan**: Người dùng có thể kéo thả để hoán đổi thứ tự các slide kết quả ngay trên Grid hiển thị.
* **Đánh số & Đổi tên hàng loạt**: Đổi tên file hoặc đánh số lại tự động từ 1 đến hết chỉ với 1 cú click.
* **Mobile Preview**: Trình mô phỏng giao diện điện thoại di động giúp vuốt thử chuỗi slide xem trước khi tải về.
* **Phím tắt tiện lợi**: Hỗ trợ phím tắt (`1`, `2` chuyển chế độ; `Space` để di chuyển canvas; `Arrow` để điều chỉnh lưới/khung; `C` hoặc `Enter` để cắt; `Z` để tải ZIP).

---

## 🛠️ Kiến trúc kỹ thuật

Ứng dụng được xây dựng trên nền tảng tối giản, tải trang siêu tốc và bảo mật dữ liệu tuyệt đối (không truyền ảnh lên máy chủ):

* **Frontend Core**: HTML5, CSS3 (Vanilla CSS hỗ trợ Glassmorphic UI hiện đại), JavaScript ES6 (Vanilla JS).
* **Canvas API**: Sử dụng đối tượng `HTMLCanvasElement` và `CanvasRenderingContext2D` để thực hiện việc xử lý hình ảnh trực tiếp ở trình duyệt (vẽ ảnh gốc, vẽ lưới tương tác, tính toán ma trận di chuyển/zoom, và kết xuất dữ liệu ảnh base64).
* **Đóng gói dữ liệu**: Sử dụng thư viện **JSZip** để nén toàn bộ các slide kết quả thành file `.zip` duy nhất, giúp tải về nhanh chóng.
* **Vượt bộ nhớ đệm (Cache Busting)**: Thẻ script tích hợp tham số query version (`app.js?v=2.0.0`) đảm bảo trình duyệt người dùng luôn cập nhật mã nguồn mới nhất.

---

## 💻 Hướng dẫn chạy ứng dụng locally

Vì ứng dụng hoạt động 100% ở Client-side và cần đọc dữ liệu hình ảnh (có thể bị chặn bởi cơ chế CORS của trình duyệt nếu mở trực tiếp file `index.html`), bạn cần chạy ứng dụng thông qua một local web server đơn giản:

1. **Khởi động server bằng Python**:
   Mở terminal tại thư mục chứa dự án và chạy lệnh:
   ```bash
   python -m http.server 8000
   ```
2. **Truy cập ứng dụng**:
   Mở trình duyệt web và truy cập địa chỉ:
   ```text
   http://localhost:8000
   ```

---

## 💡 Mẹo truyền tải ảnh chất lượng cao qua mạng xã hội
Khi xuất ảnh ở chế độ **3x (Cực nét)**, ảnh có độ phân giải rất lớn. Tuy nhiên nếu gửi qua các ứng dụng nhắn tin như Zalo hoặc Messenger ở chế độ thường, thuật toán của họ sẽ nén ảnh rất mạnh làm giảm chất lượng.
* **Cách khắc phục trên Zalo**: 
  * Tích chọn gửi ở chế độ **HD** khi chọn ảnh.
  * Hoặc gửi ảnh dưới dạng **Tài liệu (File đính kèm)** thay vì gửi ảnh thông thường để giữ nguyên gốc 100% chất lượng pixel.
