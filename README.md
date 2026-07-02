# NETFLOP 💋
> "Nền tảng xem phim số 36 Việt Nam"

Netflop là một nền tảng xem phim miễn phí trực tuyến mang phong cách châm biếm, parody nhưng cực kỳ đầy đủ tính năng và tối ưu trải nghiệm người dùng đến từng chi tiết. Dự án được xây dựng trên nền tảng React 19, TypeScript và Tailwind CSS v4.

---

## 🎨 Giao Diện & Tính Năng Nổi Bật

### 1. Trang Chào Mừng "Huyền Thoại" (Welcome Splash Screen)
- **Visual cực cháy**: Lớp nền bao gồm các pattern nụ hôn Neon Hồng tự do, tạo chiều sâu thị giác (Depth Effect).
- **Troll cực mạnh**: Nút bấm kêu gọi hành động với cụm từ kinh điển **"XEM <span style="opacity: 0.35">N</span>GAY"** (chữ N mờ nhạt đi đầy ẩn ý).
- **Hiệu ứng mượt mà**: Toàn bộ chuyển cảnh mở đầu đều được xử lý bằng `motion` đem lại cảm giác điện ảnh sống động.

### 2. Tìm Kiếm Thông Minh (Smart & Responsive Search)
- **Live Search**: Tìm kiếm nhanh thời gian thực với dropdown danh sách phim hiển thị ảnh poster, tên phim và thể loại.
- **Tối ưu Mobile**: Ngăn cuộn trang nền (`scroll-lock`) khi mở bảng tìm kiếm/menu di động giúp người dùng tập trung tối đa mà không bị nhảy trang.

### 3. Trải Nghiệm Xem Phim & Chia Sẻ
- **Player Đa Dạng**: Hỗ trợ tích hợp nhiều cụm máy chủ và định dạng tập phim linh hoạt.
- **Sao chép chia sẻ tức thì**: Nút **Share** tự động copy đường dẫn URL kèm tooltip thông báo *"Đã sao chép!"* ngọt ngào thời gian thực.
- **Tiếp tục xem & Yêu thích**: Hệ thống lưu trữ lịch sử xem (phần trăm tiến trình) và danh sách phim yêu thích lưu trực tiếp tại client.

---

## 🛠️ Công Nghệ Sử Dụng (Tech Stack)

- **Framework**: React 19 (Functional Components & Hooks)
- **Build Tool**: Vite (Cực nhanh và nhẹ)
- **Language**: TypeScript (Đảm bảo an toàn kiểu dữ liệu)
- **Styling**: Tailwind CSS v4 (Hệ thống utility-first siêu mạnh mẽ)
- **Animation**: `motion` (Xử lý các hiệu ứng chuyển trang, hover, lướt menu mượt mà)
- **Icons**: Lucide React

---

## 🚀 Khởi Chạy Dự Án Dưới Local

### Yêu cầu hệ thống
- Đã cài đặt [Node.js](https://nodejs.org/) (Khuyên dùng bản LTS mới nhất).

### Các bước cài đặt

1. **Clone repository về máy:**
   ```bash
   git clone <link-git-cua-ban>
   cd netflop
   ```

2. **Cài đặt các dependency:**
   ```bash
   npm install
   ```

3. **Khởi chạy môi trường phát triển (Dev Server):**
   ```bash
   npm run dev
   ```
   *Mặc định ứng dụng sẽ chạy tại địa chỉ `http://localhost:3000`.*

4. **Đóng gói dự án (Production Build):**
   ```bash
   npm run build
   ```
   *Thư mục đầu ra sẽ là `/dist` sẵn sàng để đưa lên hosting.*

---

## 🌐 Lưu Ý Khi Deploy Lên Hosting (Tránh lỗi Trắng Trang/404)

Đối với các ứng dụng Single Page Application (SPA) như React, khi người dùng nhấn F5 (Reload) ở một đường dẫn phụ (ví dụ `/movie/...` hoặc `/favorites`), hosting thường tìm thư mục vật lý đó và gây ra lỗi trắng trang 404.

Netflop đã được tích hợp sẵn các tập tin điều hướng thông minh để giải quyết vấn đề này triệt để:

- **Nếu deploy lên Vercel:** Tự động nhận diện cấu hình trong tệp `vercel.json`.
- **Nếu deploy lên Netlify / Cloudflare Pages:** Tự động nhận diện cấu hình chuyển hướng trong tệp `public/_redirects`.

---

## 📄 Bản Quyền & Ý Tưởng
Dự án được xây dựng phi lợi nhuận cho mục đích giải trí và học tập. Toàn bộ tài nguyên phim được truy xuất từ các API phim miễn phí và công cộng.

Chúc bạn có những trải nghiệm xem phim "dở khóc dở cười" cùng **Netflop**! 💋
