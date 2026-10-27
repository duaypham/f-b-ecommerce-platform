# 🧋 Sàn Thương Mại Điện Tử F&B Đa Cửa Hàng (Đặt Trà Sữa & Cà Phê)

> **Đồ Án Cuối Kỳ - Môn Học:** Lập Trình Thiết Bị Di Động (Mobile Programming)  
> **Đề tài số 09:** Xây dựng ứng dụng đặt trà sữa/cà phê – lựa chọn đồ uống, size, topping, số lượng, giỏ hàng và lịch sử đơn hàng.  
> **Nền tảng phát triển:** React Native (Expo SDK 57) kết nối RESTful API PHP PDO & MySQL (XAMPP).

---

## 👥 Thành Viên Thực Hiện (Nhóm 2 Thành Viên - Đóng góp 50% - 50%)

| STT | Họ và Tên | Phân Hệ Phụ Trách | Đóng Góp |
|:---:|:---|:---|:---:|
| 1 | **Phạm Ngọc Duy** | **Backend & Hệ Thống:** Thiết kế lược đồ CSDL MySQL 7 bảng (`trasua_db`), lập trình 6 tệp RESTful API PHP PDO trên XAMPP, quản lý State toàn cục `AppContext.js`, phân quyền RBAC 4 vai trò, cơ chế offline cache đơn hàng, kiểm soát chiết khấu 10% và quản trị Git. | 50% |
| 2 | **Hồ Nhân Kiệt** | **Frontend & Trải Nghiệm (UI/UX):** Lập trình giao diện 8 màn hình React Native, luồng tùy biến đồ uống (Size, Đường, Đá, Topping), giỏ hàng Signature, hệ thống lọc Voucher thông minh theo giỏ hàng, thanh toán COD / VietQR 120s, định vị GPS (`expo-location`) và kiểm thử liên luồng. | 50% |

---

## 🛠️ Công Nghệ Chủ Đạo

### 📱 Frontend (Mobile App)
* **Framework:** React Native `0.86.3` trên nền tảng **Expo SDK `~57.0.31`** (React 19).
* **Điều hướng:** `@react-navigation/native` & `@react-navigation/native-stack` v7.
* **Quản trị State:** React Context API (`AppContext.js`) kết hợp bộ nhớ cục bộ `@react-native-async-storage/async-storage`.
* **Kết nối mạng:** Axios HTTP Client (cấu hình linh hoạt giữa Máy ảo Android `10.0.2.2` và Thiết bị thật qua IP LAN).
* **Phần cứng & Vị trí:** `expo-location` (định vị vệ tinh GPS và chuyển đổi ngược thành địa chỉ giao nhận).

### 🖥️ Backend & Cơ Sở Dữ Liệu
* **Môi trường Server:** XAMPP (Apache HTTP Server & MariaDB/MySQL).
* **Ngôn ngữ Backend:** PHP 8.2 sử dụng **PHP Data Objects (PDO)** kết hợp **Prepared Statements** chống SQL Injection 100%.
* **Kiến trúc API:** RESTful JSON Endpoint trao đổi dữ liệu hai chiều bất đồng bộ.
* **Cơ sở dữ liệu:** MySQL Database `trasua_db` (bảng mã `utf8mb4_unicode_ci`) gồm **7 bảng quan hệ chuẩn hóa**.

---

## 🔑 Hệ Sinh Thái 4 Phân Quyền (RBAC) & Tài Khoản Mẫu

Hệ thống tích hợp bảng **Chuyển đổi vai trò nhanh 1 chạm** tại màn hình Hồ sơ (`ProfileScreen`) giúp diễn trọn vẹn luồng tương tác giữa các tác nhân mà không cần đăng xuất:

| Vai trò | Username | Mật khẩu | Phạm vi trách nhiệm |
|:---|:---:|:---:|:---|
| 👤 **Khách hàng** | `khach1` | `123456` | Tìm kiếm đồ uống, tùy biến ly nước, định vị GPS, áp mã voucher, thanh toán COD hoặc VietQR và đánh giá sao sau khi nhận hàng. *(Kèm các tài khoản mẫu từ `khach2` đến `khach10`)*. |
| 🏪 **Chủ quán Gong Cha** | `vendor1` | `123456` | Quản lý gian hàng **Gong Cha Biên Hòa**: CRUD thực đơn, bật/tắt Còn/Hết món, phát hành voucher riêng của quán, xử lý cảnh cáo vi phạm và pha chế gọi tài xế. |
| 🏪 **Chủ quán Highlands** | `vendor2` | `123456` | Quản lý gian hàng **Highlands Coffee & Tea**: Theo dõi doanh thu thực nhận (90%), thực đơn cà phê phin, đá xay và duyệt đơn. |
| 🛵 **Tài xế Shipper** | `shipper1` | `123456` | Nhận đơn chờ giao trên sàn, xem thông tin tuyến đường lấy món - giao khách, đối soát số tiền cần thu mặt (COD) hoặc 0đ (đơn QR) và chốt hoàn tất giao hàng. |
| 🛡️ **Admin Sàn** | `admin` | `123456` | Giám sát GMV toàn hệ thống, tự động tính 10% phí hoa hồng sàn, phát hành voucher toàn sàn, kiểm duyệt gỡ món và lưu trữ hồ sơ cảnh cáo vi phạm. |

---

## 💡 Các Tính Năng Nổi Bật & Giải Pháp Kỹ Thuật

### 1. Thuật toán tạo Chữ Ký Giỏ Hàng (Signature Matching)
Khách hàng có thể đặt nhiều ly cùng một loại đồ uống với các cấu hình hoàn toàn khác nhau. Hệ thống tự động mã hóa:
$$\text{Signature} = \text{productId} + \text{size} + \text{sugar} + \text{ice} + \text{sorted(toppings)}$$
* Nếu trùng khớp hoàn toàn $\rightarrow$ Tự động cộng dồn số lượng và tính lại tiền.
* Nếu khác bất kỳ tùy chọn nào $\rightarrow$ Tách thành một dòng sản phẩm riêng biệt trong giỏ.

### 2. Bộ Lọc Topping Thông Minh Theo Danh Mục Món
Danh sách Topping được lọc tự động theo danh mục đồ uống (`category`), ngăn chặn việc lựa chọn topping không phù hợp (ví dụ: món Cà phê phin không hiển thị Đào ngâm giòn, Trà trái cây không hiển thị Pudding trứng).

### 3. Hệ Thống Khuyến Mãi 2 Tầng (Voucher Sàn & Quán)
* **Lọc theo giỏ hàng:** Chỉ hiển thị mã Toàn sàn và mã của đúng quán có món trong giỏ.
* **Giới hạn 1 lần/tài khoản:** Hệ thống quét lịch sử đơn hàng; mã đã sử dụng sẽ tự động ẩn ở các lần mua kế tiếp.
* **Gắn nhãn từng món (Shopee Style):** Món nào đủ điều kiện áp mã sẽ hiển thị nhãn cam *"Đã áp dụng voucher"* kèm đơn giá sau giảm ngay tại dòng sản phẩm.
* **Tự động tách vận đơn con:** Khi khách mua gộp đồ uống từ nhiều quán, hệ thống tự động tách thành các đơn con (`ORDxxxxxx` và `ORDxxxxxx_2`) và phân bổ mức giảm theo tỷ trọng giá trị từng quán.

### 4. Cổng Thanh Toán Đa Kênh (COD & VietQR Động 120s)
* **Tiền mặt (COD):** Tài xế được thông báo chính xác số tiền cần thu mặt tại điểm giao.
* **VietQR động Napas247:** Sinh mã QR chuyển khoản nhúng tự động số tiền sau giảm và nội dung đơn hàng, tích hợp đồng hồ đếm ngược phiên giao dịch 120 giây.

### 5. Vận Đơn 4 Bước & Đánh Giá Xác Thực (Verified Review)
Vòng đời đơn hàng trải qua 4 bước: **Đang chuẩn bị $\rightarrow$ Chờ tài xế nhận $\rightarrow$ Đang giao hàng $\rightarrow$ Hoàn tất**. Tính năng đánh giá sao chỉ mở khóa cho khách hàng sau khi đơn hàng chuyển sang trạng thái *Hoàn tất*, chống việc spam đánh giá ảo.

### 6. Quản Trị Vi Phạm Bất Đối Xứng 2 Chiều
Admin không can thiệp sửa trực tiếp menu của quán mà gửi cảnh cáo nhắc nhở kèm lý do. Khi Chủ quán khắc phục và bấm *"Đã sửa"*, cảnh cáo sẽ biến mất khỏi màn hình của quán để giải phóng không gian, nhưng toàn bộ lịch sử vẫn được lưu trữ tại Tab riêng trên giao diện Admin.

---

## 🗄️ Cấu Trúc Cơ Sở Dữ Liệu (`trasua_db` - 7 Bảng)

```
trasua_db/
├── users      (Quản lý thông tin định danh, số điện thoại, địa chỉ GPS và cột role)
├── stores     (Thông tin thương hiệu quán, liên kết 1-1 với vendor_username, tỷ lệ phí 10%)
├── products   (Thực đơn món, danh mục, giá gốc, giá sale, soldCount, cờ isBestSeller & isAvailable)
├── vouchers   (Mã giảm giá, store_id = NULL cho toàn sàn, loại giảm fixed/percent, minOrder)
├── orders     (Lưu trữ vận đơn, itemsJson snapshot, platformFee 10%, trạng thái COD/QR, shipper)
├── reviews    (Đánh giá sao 1-5 và bình luận, ràng buộc cặp orderCode + product_id + username)
└── warnings   (Lịch sử cảnh cáo vi phạm từ Admin gửi tới các quán, cờ isResolved)
```

---

## 🚀 Hướng Dẫn Cài Đặt & Chạy Ứng Dụng

### Yêu cầu tiên quyết:
* Đã cài đặt **Node.js** (LTS) và trình quản lý gói `npm`.
* Đã cài đặt **XAMPP** (Apache & MySQL).
* Ứng dụng **Expo Go** trên điện thoại thật hoặc máy ảo **Android Studio Emulator**.

---

### Bước 1: Khởi động Backend & Cơ Sở Dữ Liệu trên XAMPP
1. Mở **XAMPP Control Panel**, nhấn **Start** cả hai dịch vụ **Apache** và **MySQL**.
2. Giải nén thư mục `trasua_api/` vào thư mục `htdocs` của XAMPP:
   ```text
   C:\xampp\htdocs\trasua_api\
   ```
3. Mở trình duyệt, truy cập `http://localhost/phpmyadmin/`.
4. Tạo mới cơ sở dữ liệu có tên `trasua_db` với bảng mã `utf8mb4_unicode_ci`.
5. Chọn tab **Import** và nạp tệp `trasua_db.sql` nằm ở thư mục gốc của dự án.

---

### Bước 2: Cài Đặt Gói Phụ Thuộc (Dependencies)
Mở cửa sổ Terminal tại thư mục gốc dự án và chạy:
```bash
npm install
```

---

### Bước 3: Cấu Hình Địa Chỉ IP API
Mở tệp `src/constants/api.js` và chọn cấu hình `BASE_URL` tương ứng:

* **Khi chạy trên Máy ảo Android (Android Emulator):**
  ```javascript
  export const BASE_URL = 'http://10.0.2.2/trasua_api';
  ```
* **Khi quét mã QR chạy trên Điện thoại thật (Expo Go qua mạng Wi-Fi LAN):**
  ```javascript
  // Đổi thành địa chỉ IPv4 LAN của máy tính đang chạy XAMPP (xem qua lệnh ipconfig)
  export const BASE_URL = 'http://192.168.1.8/trasua_api';
  ```

---

### Bước 4: Khởi Chạy Ứng Dụng Expo
Khởi động Metro Bundler với bộ nhớ đệm sạch:
```bash
npx expo start -c
```
* Nhấn phím `a` trên bàn phím để mở trên Máy ảo Android.
* Hoặc mở ứng dụng **Expo Go** trên điện thoại thật và quét mã QR hiển thị ở Terminal.

---

## 📂 Cấu Trúc Mã Nguồn Dự Án

```
f-b-ecommerce-platform/
├── assets/                 # Hình ảnh biểu tượng, icon và splash screen
├── src/
│   ├── constants/
│   │   ├── api.js          # Khởi tạo Axios client & danh sách endpoint kết nối Backend
│   │   └── data.js         # Hằng số: Size, Mức đường, Đá, Toppings phân loại, Danh mục món
│   ├── context/
│   │   └── AppContext.js   # State toàn cục, giỏ hàng Signature, offline cache AsyncStorage
│   └── screens/
│       ├── HomeScreen.js           # Màn hình chính mua sắm, top bán chạy, bộ lọc đa năng
│       ├── ProductDetailScreen.js  # Tùy biến công thức, HUD Toast Shopee & đánh giá món
│       ├── CartScreen.js           # Giỏ hàng, xác nhận xóa, tag voucher từng món & cổng QR
│       ├── OrderHistoryScreen.js   # Tiến trình đơn hàng 4 bước, re-order và đối soát COD
│       ├── AdminScreen.js          # Điều hành: Doanh thu 10%, thực đơn, gọi ship & cảnh cáo
│       ├── ProfileScreen.js        # Thông tin cá nhân, định vị GPS & bảng đổi vai trò nhanh
│       ├── LoginScreen.js          # Đăng nhập với 4 phím tắt chọn nhanh tài khoản mẫu
│       └── RegisterScreen.js       # Đăng ký 3 luồng: Khách hàng, Mở gian hàng và Tài xế
├── App.js                  # Khởi tạo React Navigation Native Stack (8 màn hình)
├── trasua_api.zip          # Tệp nén chứa 6 mã nguồn PHP RESTful API
├── trasua_db.sql           # Kịch bản khởi tạo CSDL MySQL 7 bảng và dữ liệu mẫu
├── package.json            # Danh sách thư viện và scripts dự án
└── README.md               # Tài liệu giới thiệu và hướng dẫn đồ án
```

---

## 📄 Bản Quyền (License)
Dự án được phân phối dưới giấy phép **MIT License**. Mã nguồn mở phục vụ mục đích nghiên cứu, học tập và kiểm thử đồ án môn học.