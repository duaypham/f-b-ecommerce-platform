-- phpMyAdmin SQL Dump
-- version 5.2.1
-- https://www.phpmyadmin.net/
--
-- Host: 127.0.0.1
-- Generation Time: Oct 27, 2026 at 06:57 AM
-- Server version: 10.4.32-MariaDB
-- PHP Version: 8.2.12

SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
START TRANSACTION;
SET time_zone = "+00:00";


/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8mb4 */;

--
-- Database: `trasua_db`
--

-- --------------------------------------------------------

--
-- Table structure for table `orders`
--

CREATE TABLE `orders` (
  `id` int(11) NOT NULL,
  `orderCode` varchar(30) NOT NULL,
  `store_id` int(11) NOT NULL,
  `username` varchar(50) NOT NULL,
  `customerName` varchar(100) NOT NULL,
  `phone` varchar(20) NOT NULL,
  `address` varchar(255) NOT NULL,
  `note` text DEFAULT NULL,
  `paymentMethod` varchar(50) DEFAULT 'COD',
  `paymentStatus` varchar(50) DEFAULT 'Thanh toán khi nhận hàng',
  `voucherCode` varchar(30) DEFAULT NULL,
  `subTotal` int(11) NOT NULL,
  `discountAmount` int(11) DEFAULT 0,
  `platformFee` int(11) DEFAULT 0,
  `totalAmount` int(11) NOT NULL,
  `itemsJson` longtext NOT NULL,
  `status` varchar(50) DEFAULT 'Đang chuẩn bị',
  `shipper_username` varchar(50) DEFAULT NULL,
  `shipperName` varchar(100) DEFAULT NULL,
  `createdAt` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `orders`
--

INSERT INTO `orders` (`id`, `orderCode`, `store_id`, `username`, `customerName`, `phone`, `address`, `note`, `paymentMethod`, `paymentStatus`, `voucherCode`, `subTotal`, `discountAmount`, `platformFee`, `totalAmount`, `itemsJson`, `status`, `shipper_username`, `shipperName`, `createdAt`) VALUES
(1, 'ORD171001', 1, 'khach1', 'Phạm Ngọc Duy', '0987654321', '120 Võ Thị Sáu, P. Thống Nhất, TP. Biên Hòa, Đồng Nai', 'Giao giờ hành chính', 'COD', 'Đã thu tiền mặt', 'GIAM10K', 70000, 10000, 7000, 60000, '[{\"productId\":1,\"name\":\"Trà Sữa Trân Châu Đường Đen\",\"storeId\":1,\"storeName\":\"Gong Cha Biên Hòa\",\"size\":\"S\",\"sugar\":\"Ngọt vừa (70%)\",\"ice\":\"Đá chuẩn (100%)\",\"toppings\":[],\"quantity\":2,\"unitPrice\":35000,\"totalPrice\":70000,\"image\":\"https://images.unsplash.com/photo-1558857563-b371033873b8?w=600\"}]', 'Hoàn tất', 'shipper1', 'Tài Xế Nguyễn Văn Giao', '2026-10-24 02:15:00'),
(2, 'ORD171002', 1, 'khach1', 'Phạm Ngọc Duy', '0987654321', '120 Võ Thị Sáu, P. Thống Nhất, TP. Biên Hòa, Đồng Nai', 'Giao nhanh giúp mình', 'Chuyển khoản QR', 'Đã thanh toán qua QR', NULL, 50000, 0, 5000, 50000, '[{\"productId\":2,\"name\":\"Trà Sữa Khoai Môn Kem Trứng\",\"storeId\":1,\"storeName\":\"Gong Cha Biên Hòa\",\"size\":\"S\",\"sugar\":\"Ít ngọt (50%)\",\"ice\":\"Ít đá (50%)\",\"toppings\":[],\"quantity\":1,\"unitPrice\":50000,\"totalPrice\":50000,\"image\":\"https://images.unsplash.com/photo-1576092768241-dec231879fc3?w=600\"}]', 'Chờ tài xế nhận', NULL, NULL, '2026-10-27 01:30:00'),
(3, 'ORD171003', 1, 'khach2', 'Hồ Nhân Kiệt', '0977889900', '255 Đồng Khởi, P. Tân Hiệp, TP. Biên Hòa, Đồng Nai', 'Đặt nhóm học bài', 'Chuyển khoản QR', 'Đã thanh toán qua QR', 'GONGCHA15', 335000, 15000, 33500, 320000, '[{\"productId\":1,\"name\":\"Trà Sữa Trân Châu Đường Đen\",\"storeId\":1,\"storeName\":\"Gong Cha Biên Hòa\",\"size\":\"S\",\"sugar\":\"Ngọt chuẩn (100%)\",\"ice\":\"Đá chuẩn (100%)\",\"toppings\":[],\"quantity\":5,\"unitPrice\":35000,\"totalPrice\":175000,\"image\":\"https://images.unsplash.com/photo-1558857563-b371033873b8?w=600\"},{\"productId\":3,\"name\":\"Trà Đào Cam Sả Đá Viên\",\"storeId\":1,\"storeName\":\"Gong Cha Biên Hòa\",\"size\":\"S\",\"sugar\":\"Ngọt vừa (70%)\",\"ice\":\"Đá vừa (70%)\",\"toppings\":[],\"quantity\":5,\"unitPrice\":32000,\"totalPrice\":160000,\"image\":\"https://images.unsplash.com/photo-1556679343-c7306c1976bc?w=600\"}]', 'Hoàn tất', 'shipper1', 'Tài Xế Nguyễn Văn Giao', '2026-10-24 07:20:00'),
(4, 'ORD171004', 1, 'khach3', 'Nguyễn Thị Minh Thư', '0966554433', '1096 Phạm Văn Thuận, P. Tân Mai, TP. Biên Hòa, Đồng Nai', 'Gọi trước khi đến', 'COD', 'Đã thu tiền mặt', 'FREESHIP', 375000, 15000, 37500, 360000, '[{\"productId\":1,\"name\":\"Trà Sữa Trân Châu Đường Đen\",\"storeId\":1,\"storeName\":\"Gong Cha Biên Hòa\",\"size\":\"S\",\"sugar\":\"Ngọt vừa (70%)\",\"ice\":\"Đá vừa (70%)\",\"toppings\":[],\"quantity\":5,\"unitPrice\":35000,\"totalPrice\":175000,\"image\":\"https://images.unsplash.com/photo-1558857563-b371033873b8?w=600\"},{\"productId\":2,\"name\":\"Trà Sữa Khoai Môn Kem Trứng\",\"storeId\":1,\"storeName\":\"Gong Cha Biên Hòa\",\"size\":\"S\",\"sugar\":\"Ít ngọt (50%)\",\"ice\":\"Ít đá (50%)\",\"toppings\":[],\"quantity\":4,\"unitPrice\":50000,\"totalPrice\":200000,\"image\":\"https://images.unsplash.com/photo-1576092768241-dec231879fc3?w=600\"}]', 'Hoàn tất', 'shipper1', 'Tài Xế Nguyễn Văn Giao', '2026-10-24 09:10:00'),
(5, 'ORD171005', 1, 'khach4', 'Trần Quốc Bảo', '0944112233', 'Đường Huỳnh Văn Nghệ, P. Bửu Long, TP. Biên Hòa, Đồng Nai', 'Giao cổng trường', 'Chuyển khoản QR', 'Đã thanh toán qua QR', 'BANMOI20', 410000, 25000, 41000, 385000, '[{\"productId\":2,\"name\":\"Trà Sữa Khoai Môn Kem Trứng\",\"storeId\":1,\"storeName\":\"Gong Cha Biên Hòa\",\"size\":\"S\",\"sugar\":\"Ngọt chuẩn (100%)\",\"ice\":\"Đá vừa (70%)\",\"toppings\":[],\"quantity\":5,\"unitPrice\":50000,\"totalPrice\":250000,\"image\":\"https://images.unsplash.com/photo-1576092768241-dec231879fc3?w=600\"},{\"productId\":3,\"name\":\"Trà Đào Cam Sả Đá Viên\",\"storeId\":1,\"storeName\":\"Gong Cha Biên Hòa\",\"size\":\"S\",\"sugar\":\"Ngọt vừa (70%)\",\"ice\":\"Đá vừa (70%)\",\"toppings\":[],\"quantity\":5,\"unitPrice\":32000,\"totalPrice\":160000,\"image\":\"https://images.unsplash.com/photo-1556679343-c7306c1976bc?w=600\"}]', 'Hoàn tất', 'shipper1', 'Tài Xế Nguyễn Văn Giao', '2026-10-25 03:05:00'),
(6, 'ORD171006', 1, 'khach5', 'Lê Hoàng Nam', '0938123456', '88 Hà Huy Giáp, P. Quyết Thắng, TP. Biên Hòa, Đồng Nai', '', 'COD', 'Đã thu tiền mặt', NULL, 402000, 0, 40200, 402000, '[{\"productId\":1,\"name\":\"Trà Sữa Trân Châu Đường Đen\",\"storeId\":1,\"storeName\":\"Gong Cha Biên Hòa\",\"size\":\"S\",\"sugar\":\"Ngọt vừa (70%)\",\"ice\":\"Đá chuẩn (100%)\",\"toppings\":[],\"quantity\":6,\"unitPrice\":35000,\"totalPrice\":210000,\"image\":\"https://images.unsplash.com/photo-1558857563-b371033873b8?w=600\"},{\"productId\":3,\"name\":\"Trà Đào Cam Sả Đá Viên\",\"storeId\":1,\"storeName\":\"Gong Cha Biên Hòa\",\"size\":\"S\",\"sugar\":\"Ít ngọt (50%)\",\"ice\":\"Đá vừa (70%)\",\"toppings\":[],\"quantity\":6,\"unitPrice\":32000,\"totalPrice\":192000,\"image\":\"https://images.unsplash.com/photo-1556679343-c7306c1976bc?w=600\"}]', 'Hoàn tất', 'shipper1', 'Tài Xế Nguyễn Văn Giao', '2026-10-25 06:40:00'),
(7, 'ORD171007', 1, 'khach6', 'Võ Thị Thanh Tâm', '0918223344', '45 Nguyễn Ái Quốc, P. Tân Phong, TP. Biên Hòa, Đồng Nai', 'Để lễ tân tòa nhà', 'Chuyển khoản QR', 'Đã thanh toán qua QR', 'GONGCHA15', 602000, 15000, 60200, 587000, '[{\"productId\":1,\"name\":\"Trà Sữa Trân Châu Đường Đen\",\"storeId\":1,\"storeName\":\"Gong Cha Biên Hòa\",\"size\":\"S\",\"sugar\":\"Ngọt vừa (70%)\",\"ice\":\"Đá vừa (70%)\",\"toppings\":[],\"quantity\":6,\"unitPrice\":35000,\"totalPrice\":210000,\"image\":\"https://images.unsplash.com/photo-1558857563-b371033873b8?w=600\"},{\"productId\":2,\"name\":\"Trà Sữa Khoai Môn Kem Trứng\",\"storeId\":1,\"storeName\":\"Gong Cha Biên Hòa\",\"size\":\"S\",\"sugar\":\"Ngọt chuẩn (100%)\",\"ice\":\"Đá chuẩn (100%)\",\"toppings\":[],\"quantity\":4,\"unitPrice\":50000,\"totalPrice\":200000,\"image\":\"https://images.unsplash.com/photo-1576092768241-dec231879fc3?w=600\"},{\"productId\":3,\"name\":\"Trà Đào Cam Sả Đá Viên\",\"storeId\":1,\"storeName\":\"Gong Cha Biên Hòa\",\"size\":\"S\",\"sugar\":\"Ngọt vừa (70%)\",\"ice\":\"Đá chuẩn (100%)\",\"toppings\":[],\"quantity\":6,\"unitPrice\":32000,\"totalPrice\":192000,\"image\":\"https://images.unsplash.com/photo-1556679343-c7306c1976bc?w=600\"}]', 'Hoàn tất', 'shipper1', 'Tài Xế Nguyễn Văn Giao', '2026-10-25 08:30:00'),
(8, 'ORD171008', 1, 'khach7', 'Đặng Minh Quân', '0909334455', '12 Cách Mạng Tháng 8, P. Quang Vinh, TP. Biên Hòa, Đồng Nai', '', 'COD', 'Đã thu tiền mặt', 'FREESHIP', 652000, 15000, 65200, 637000, '[{\"productId\":1,\"name\":\"Trà Sữa Trân Châu Đường Đen\",\"storeId\":1,\"storeName\":\"Gong Cha Biên Hòa\",\"size\":\"S\",\"sugar\":\"Ngọt chuẩn (100%)\",\"ice\":\"Đá chuẩn (100%)\",\"toppings\":[],\"quantity\":6,\"unitPrice\":35000,\"totalPrice\":210000,\"image\":\"https://images.unsplash.com/photo-1558857563-b371033873b8?w=600\"},{\"productId\":2,\"name\":\"Trà Sữa Khoai Môn Kem Trứng\",\"storeId\":1,\"storeName\":\"Gong Cha Biên Hòa\",\"size\":\"S\",\"sugar\":\"Ngọt vừa (70%)\",\"ice\":\"Đá vừa (70%)\",\"toppings\":[],\"quantity\":5,\"unitPrice\":50000,\"totalPrice\":250000,\"image\":\"https://images.unsplash.com/photo-1576092768241-dec231879fc3?w=600\"},{\"productId\":3,\"name\":\"Trà Đào Cam Sả Đá Viên\",\"storeId\":1,\"storeName\":\"Gong Cha Biên Hòa\",\"size\":\"S\",\"sugar\":\"Ít ngọt (50%)\",\"ice\":\"Ít đá (50%)\",\"toppings\":[],\"quantity\":6,\"unitPrice\":32000,\"totalPrice\":192000,\"image\":\"https://images.unsplash.com/photo-1556679343-c7306c1976bc?w=600\"}]', 'Hoàn tất', 'shipper1', 'Tài Xế Nguyễn Văn Giao', '2026-10-26 02:45:00'),
(9, 'ORD171009', 1, 'khach8', 'Bùi Hoàng Yến', '0932445566', '302 Nguyễn Ái Quốc, P. Hố Nai, TP. Biên Hòa, Đồng Nai', 'Giao buổi chiều', 'Chuyển khoản QR', 'Đã thanh toán qua QR', NULL, 602000, 0, 60200, 602000, '[{\"productId\":1,\"name\":\"Trà Sữa Trân Châu Đường Đen\",\"storeId\":1,\"storeName\":\"Gong Cha Biên Hòa\",\"size\":\"S\",\"sugar\":\"Ngọt vừa (70%)\",\"ice\":\"Đá chuẩn (100%)\",\"toppings\":[],\"quantity\":6,\"unitPrice\":35000,\"totalPrice\":210000,\"image\":\"https://images.unsplash.com/photo-1558857563-b371033873b8?w=600\"},{\"productId\":2,\"name\":\"Trà Sữa Khoai Môn Kem Trứng\",\"storeId\":1,\"storeName\":\"Gong Cha Biên Hòa\",\"size\":\"S\",\"sugar\":\"Ngọt vừa (70%)\",\"ice\":\"Đá vừa (70%)\",\"toppings\":[],\"quantity\":4,\"unitPrice\":50000,\"totalPrice\":200000,\"image\":\"https://images.unsplash.com/photo-1576092768241-dec231879fc3?w=600\"},{\"productId\":3,\"name\":\"Trà Đào Cam Sả Đá Viên\",\"storeId\":1,\"storeName\":\"Gong Cha Biên Hòa\",\"size\":\"S\",\"sugar\":\"Ngọt chuẩn (100%)\",\"ice\":\"Đá chuẩn (100%)\",\"toppings\":[],\"quantity\":6,\"unitPrice\":32000,\"totalPrice\":192000,\"image\":\"https://images.unsplash.com/photo-1556679343-c7306c1976bc?w=600\"}]', 'Hoàn tất', 'shipper1', 'Tài Xế Nguyễn Văn Giao', '2026-10-26 07:15:00'),
(10, 'ORD171010', 1, 'khach9', 'Đỗ Gia Huy', '0974556677', '79 Hưng Đạo Vương, P. Trung Dũng, TP. Biên Hòa, Đồng Nai', '', 'COD', 'Đã thu tiền mặt', 'BANMOI20', 687000, 25000, 68700, 662000, '[{\"productId\":1,\"name\":\"Trà Sữa Trân Châu Đường Đen\",\"storeId\":1,\"storeName\":\"Gong Cha Biên Hòa\",\"size\":\"S\",\"sugar\":\"Ngọt vừa (70%)\",\"ice\":\"Đá vừa (70%)\",\"toppings\":[],\"quantity\":7,\"unitPrice\":35000,\"totalPrice\":245000,\"image\":\"https://images.unsplash.com/photo-1558857563-b371033873b8?w=600\"},{\"productId\":2,\"name\":\"Trà Sữa Khoai Môn Kem Trứng\",\"storeId\":1,\"storeName\":\"Gong Cha Biên Hòa\",\"size\":\"S\",\"sugar\":\"Ngọt chuẩn (100%)\",\"ice\":\"Đá chuẩn (100%)\",\"toppings\":[],\"quantity\":5,\"unitPrice\":50000,\"totalPrice\":250000,\"image\":\"https://images.unsplash.com/photo-1576092768241-dec231879fc3?w=600\"},{\"productId\":3,\"name\":\"Trà Đào Cam Sả Đá Viên\",\"storeId\":1,\"storeName\":\"Gong Cha Biên Hòa\",\"size\":\"S\",\"sugar\":\"Ngọt vừa (70%)\",\"ice\":\"Đá chuẩn (100%)\",\"toppings\":[],\"quantity\":6,\"unitPrice\":32000,\"totalPrice\":192000,\"image\":\"https://images.unsplash.com/photo-1556679343-c7306c1976bc?w=600\"}]', 'Hoàn tất', 'shipper1', 'Tài Xế Nguyễn Văn Giao', '2026-10-26 09:50:00'),
(11, 'ORD171011', 2, 'khach2', 'Hồ Nhân Kiệt', '0977889900', '255 Đồng Khởi, P. Tân Hiệp, TP. Biên Hòa, Đồng Nai', 'Cà phê sáng', 'COD', 'Đã thu tiền mặt', 'HIGHLANDS10', 284000, 20000, 28400, 264000, '[{\"productId\":4,\"name\":\"Cà Phê Phin Sữa Đá Đậm Đà\",\"storeId\":2,\"storeName\":\"Highlands Coffee & Tea\",\"size\":\"S\",\"sugar\":\"Ngọt vừa (70%)\",\"ice\":\"Đá chuẩn (100%)\",\"toppings\":[],\"quantity\":6,\"unitPrice\":29000,\"totalPrice\":174000,\"image\":\"https://images.unsplash.com/photo-1514432324607-a09d9b4aefdd?w=600\"},{\"productId\":5,\"name\":\"Matcha Đá Xay Kem Tươi\",\"storeId\":2,\"storeName\":\"Highlands Coffee & Tea\",\"size\":\"S\",\"sugar\":\"Ít ngọt (50%)\",\"ice\":\"Đá vừa (70%)\",\"toppings\":[],\"quantity\":2,\"unitPrice\":55000,\"totalPrice\":110000,\"image\":\"https://images.unsplash.com/photo-1536256263959-770b48d82b0a?w=600\"}]', 'Hoàn tất', 'shipper1', 'Tài Xế Nguyễn Văn Giao', '2026-10-24 00:30:00'),
(12, 'ORD171012', 2, 'khach3', 'Nguyễn Thị Minh Thư', '0966554433', '1096 Phạm Văn Thuận, P. Tân Mai, TP. Biên Hòa, Đồng Nai', '', 'Chuyển khoản QR', 'Đã thanh toán qua QR', 'GIAM10K', 258000, 10000, 25800, 248000, '[{\"productId\":4,\"name\":\"Cà Phê Phin Sữa Đá Đậm Đà\",\"storeId\":2,\"storeName\":\"Highlands Coffee & Tea\",\"size\":\"S\",\"sugar\":\"Ngọt chuẩn (100%)\",\"ice\":\"Đá chuẩn (100%)\",\"toppings\":[],\"quantity\":6,\"unitPrice\":29000,\"totalPrice\":174000,\"image\":\"https://images.unsplash.com/photo-1514432324607-a09d9b4aefdd?w=600\"},{\"productId\":6,\"name\":\"Bạc Xỉu Kem Muối Biển\",\"storeId\":2,\"storeName\":\"Highlands Coffee & Tea\",\"size\":\"S\",\"sugar\":\"Ngọt vừa (70%)\",\"ice\":\"Đá vừa (70%)\",\"toppings\":[],\"quantity\":2,\"unitPrice\":42000,\"totalPrice\":84000,\"image\":\"https://images.unsplash.com/photo-1461023058943-07fcbe16d735?w=600\"}]', 'Hoàn tất', 'shipper1', 'Tài Xế Nguyễn Văn Giao', '2026-10-24 01:45:00'),
(13, 'ORD171013', 2, 'khach4', 'Trần Quốc Bảo', '0944112233', 'Đường Huỳnh Văn Nghệ, P. Bửu Long, TP. Biên Hòa, Đồng Nai', '', 'COD', 'Đã thu tiền mặt', NULL, 368000, 0, 36800, 368000, '[{\"productId\":4,\"name\":\"Cà Phê Phin Sữa Đá Đậm Đà\",\"storeId\":2,\"storeName\":\"Highlands Coffee & Tea\",\"size\":\"S\",\"sugar\":\"Ngọt vừa (70%)\",\"ice\":\"Đá chuẩn (100%)\",\"toppings\":[],\"quantity\":6,\"unitPrice\":29000,\"totalPrice\":174000,\"image\":\"https://images.unsplash.com/photo-1514432324607-a09d9b4aefdd?w=600\"},{\"productId\":5,\"name\":\"Matcha Đá Xay Kem Tươi\",\"storeId\":2,\"storeName\":\"Highlands Coffee & Tea\",\"size\":\"S\",\"sugar\":\"Ngọt chuẩn (100%)\",\"ice\":\"Đá chuẩn (100%)\",\"toppings\":[],\"quantity\":2,\"unitPrice\":55000,\"totalPrice\":110000,\"image\":\"https://images.unsplash.com/photo-1536256263959-770b48d82b0a?w=600\"},{\"productId\":6,\"name\":\"Bạc Xỉu Kem Muối Biển\",\"storeId\":2,\"storeName\":\"Highlands Coffee & Tea\",\"size\":\"S\",\"sugar\":\"Ít ngọt (50%)\",\"ice\":\"Đá vừa (70%)\",\"toppings\":[],\"quantity\":2,\"unitPrice\":42000,\"totalPrice\":84000,\"image\":\"https://images.unsplash.com/photo-1461023058943-07fcbe16d735?w=600\"}]', 'Hoàn tất', 'shipper1', 'Tài Xế Nguyễn Văn Giao', '2026-10-25 01:15:00'),
(14, 'ORD171014', 2, 'khach5', 'Lê Hoàng Nam', '0938123456', '88 Hà Huy Giáp, P. Quyết Thắng, TP. Biên Hòa, Đồng Nai', 'Giao văn phòng lầu 2', 'Chuyển khoản QR', 'Đã thanh toán qua QR', 'HIGHLANDS10', 368000, 20000, 36800, 348000, '[{\"productId\":4,\"name\":\"Cà Phê Phin Sữa Đá Đậm Đà\",\"storeId\":2,\"storeName\":\"Highlands Coffee & Tea\",\"size\":\"S\",\"sugar\":\"Ngọt vừa (70%)\",\"ice\":\"Đá vừa (70%)\",\"toppings\":[],\"quantity\":7,\"unitPrice\":29000,\"totalPrice\":203000,\"image\":\"https://images.unsplash.com/photo-1514432324607-a09d9b4aefdd?w=600\"},{\"productId\":5,\"name\":\"Matcha Đá Xay Kem Tươi\",\"storeId\":2,\"storeName\":\"Highlands Coffee & Tea\",\"size\":\"S\",\"sugar\":\"Ngọt vừa (70%)\",\"ice\":\"Đá chuẩn (100%)\",\"toppings\":[],\"quantity\":3,\"unitPrice\":55000,\"totalPrice\":165000,\"image\":\"https://images.unsplash.com/photo-1536256263959-770b48d82b0a?w=600\"}]', 'Hoàn tất', 'shipper1', 'Tài Xế Nguyễn Văn Giao', '2026-10-25 02:30:00'),
(15, 'ORD171015', 2, 'khach6', 'Võ Thị Thanh Tâm', '0918223344', '45 Nguyễn Ái Quốc, P. Tân Phong, TP. Biên Hòa, Đồng Nai', '', 'COD', 'Đã thu tiền mặt', 'FREESHIP', 368000, 15000, 36800, 353000, '[{\"productId\":4,\"name\":\"Cà Phê Phin Sữa Đá Đậm Đà\",\"storeId\":2,\"storeName\":\"Highlands Coffee & Tea\",\"size\":\"S\",\"sugar\":\"Ngọt chuẩn (100%)\",\"ice\":\"Đá chuẩn (100%)\",\"toppings\":[],\"quantity\":6,\"unitPrice\":29000,\"totalPrice\":174000,\"image\":\"https://images.unsplash.com/photo-1514432324607-a09d9b4aefdd?w=600\"},{\"productId\":5,\"name\":\"Matcha Đá Xay Kem Tươi\",\"storeId\":2,\"storeName\":\"Highlands Coffee & Tea\",\"size\":\"S\",\"sugar\":\"Ít ngọt (50%)\",\"ice\":\"Đá vừa (70%)\",\"toppings\":[],\"quantity\":2,\"unitPrice\":55000,\"totalPrice\":110000,\"image\":\"https://images.unsplash.com/photo-1536256263959-770b48d82b0a?w=600\"},{\"productId\":6,\"name\":\"Bạc Xỉu Kem Muối Biển\",\"storeId\":2,\"storeName\":\"Highlands Coffee & Tea\",\"size\":\"S\",\"sugar\":\"Ngọt vừa (70%)\",\"ice\":\"Đá vừa (70%)\",\"toppings\":[],\"quantity\":2,\"unitPrice\":42000,\"totalPrice\":84000,\"image\":\"https://images.unsplash.com/photo-1461023058943-07fcbe16d735?w=600\"}]', 'Hoàn tất', 'shipper1', 'Tài Xế Nguyễn Văn Giao', '2026-10-25 07:00:00'),
(16, 'ORD171016', 2, 'khach7', 'Đặng Minh Quân', '0909334455', '12 Cách Mạng Tháng 8, P. Quang Vinh, TP. Biên Hòa, Đồng Nai', '', 'Chuyển khoản QR', 'Đã thanh toán qua QR', NULL, 397000, 0, 39700, 397000, '[{\"productId\":4,\"name\":\"Cà Phê Phin Sữa Đá Đậm Đà\",\"storeId\":2,\"storeName\":\"Highlands Coffee & Tea\",\"size\":\"S\",\"sugar\":\"Ngọt vừa (70%)\",\"ice\":\"Đá chuẩn (100%)\",\"toppings\":[],\"quantity\":7,\"unitPrice\":29000,\"totalPrice\":203000,\"image\":\"https://images.unsplash.com/photo-1514432324607-a09d9b4aefdd?w=600\"},{\"productId\":5,\"name\":\"Matcha Đá Xay Kem Tươi\",\"storeId\":2,\"storeName\":\"Highlands Coffee & Tea\",\"size\":\"S\",\"sugar\":\"Ngọt chuẩn (100%)\",\"ice\":\"Đá chuẩn (100%)\",\"toppings\":[],\"quantity\":2,\"unitPrice\":55000,\"totalPrice\":110000,\"image\":\"https://images.unsplash.com/photo-1536256263959-770b48d82b0a?w=600\"},{\"productId\":6,\"name\":\"Bạc Xỉu Kem Muối Biển\",\"storeId\":2,\"storeName\":\"Highlands Coffee & Tea\",\"size\":\"S\",\"sugar\":\"Ngọt vừa (70%)\",\"ice\":\"Đá chuẩn (100%)\",\"toppings\":[],\"quantity\":2,\"unitPrice\":42000,\"totalPrice\":84000,\"image\":\"https://images.unsplash.com/photo-1461023058943-07fcbe16d735?w=600\"}]', 'Hoàn tất', 'shipper1', 'Tài Xế Nguyễn Văn Giao', '2026-10-26 01:20:00'),
(17, 'ORD171017', 2, 'khach8', 'Bùi Hoàng Yến', '0932445566', '302 Nguyễn Ái Quốc, P. Hố Nai, TP. Biên Hòa, Đồng Nai', '', 'COD', 'Đã thu tiền mặt', 'GIAM10K', 368000, 10000, 36800, 358000, '[{\"productId\":4,\"name\":\"Cà Phê Phin Sữa Đá Đậm Đà\",\"storeId\":2,\"storeName\":\"Highlands Coffee & Tea\",\"size\":\"S\",\"sugar\":\"Ngọt vừa (70%)\",\"ice\":\"Đá vừa (70%)\",\"toppings\":[],\"quantity\":6,\"unitPrice\":29000,\"totalPrice\":174000,\"image\":\"https://images.unsplash.com/photo-1514432324607-a09d9b4aefdd?w=600\"},{\"productId\":5,\"name\":\"Matcha Đá Xay Kem Tươi\",\"storeId\":2,\"storeName\":\"Highlands Coffee & Tea\",\"size\":\"S\",\"sugar\":\"Ít ngọt (50%)\",\"ice\":\"Ít đá (50%)\",\"toppings\":[],\"quantity\":2,\"unitPrice\":55000,\"totalPrice\":110000,\"image\":\"https://images.unsplash.com/photo-1536256263959-770b48d82b0a?w=600\"},{\"productId\":6,\"name\":\"Bạc Xỉu Kem Muối Biển\",\"storeId\":2,\"storeName\":\"Highlands Coffee & Tea\",\"size\":\"S\",\"sugar\":\"Ngọt chuẩn (100%)\",\"ice\":\"Đá chuẩn (100%)\",\"toppings\":[],\"quantity\":2,\"unitPrice\":42000,\"totalPrice\":84000,\"image\":\"https://images.unsplash.com/photo-1461023058943-07fcbe16d735?w=600\"}]', 'Hoàn tất', 'shipper1', 'Tài Xế Nguyễn Văn Giao', '2026-10-26 03:30:00'),
(18, 'ORD171018', 2, 'khach10', 'Ngô Phương Anh', '0983667788', '154 Phan Trung, P. Tân Tiến, TP. Biên Hòa, Đồng Nai', '', 'Chuyển khoản QR', 'Đã thanh toán qua QR', 'BANMOI20', 397000, 25000, 39700, 372000, '[{\"productId\":4,\"name\":\"Cà Phê Phin Sữa Đá Đậm Đà\",\"storeId\":2,\"storeName\":\"Highlands Coffee & Tea\",\"size\":\"S\",\"sugar\":\"Ngọt chuẩn (100%)\",\"ice\":\"Đá chuẩn (100%)\",\"toppings\":[],\"quantity\":7,\"unitPrice\":29000,\"totalPrice\":203000,\"image\":\"https://images.unsplash.com/photo-1514432324607-a09d9b4aefdd?w=600\"},{\"productId\":5,\"name\":\"Matcha Đá Xay Kem Tươi\",\"storeId\":2,\"storeName\":\"Highlands Coffee & Tea\",\"size\":\"S\",\"sugar\":\"Ngọt vừa (70%)\",\"ice\":\"Đá vừa (70%)\",\"toppings\":[],\"quantity\":2,\"unitPrice\":55000,\"totalPrice\":110000,\"image\":\"https://images.unsplash.com/photo-1536256263959-770b48d82b0a?w=600\"},{\"productId\":6,\"name\":\"Bạc Xỉu Kem Muối Biển\",\"storeId\":2,\"storeName\":\"Highlands Coffee & Tea\",\"size\":\"S\",\"sugar\":\"Ít ngọt (50%)\",\"ice\":\"Ít đá (50%)\",\"toppings\":[],\"quantity\":2,\"unitPrice\":42000,\"totalPrice\":84000,\"image\":\"https://images.unsplash.com/photo-1461023058943-07fcbe16d735?w=600\"}]', 'Hoàn tất', 'shipper1', 'Tài Xế Nguyễn Văn Giao', '2026-10-26 08:20:00'),
(19, 'ORD311568', 1, 'khach1', 'Phạm Ngọc Duy', '0987654321', '302 Đường 30 Tháng 4, Phường Trung Dũng, Thành phố Biên Hòa, Đồng Nai', '', 'Chuyển khoản QR', 'Đã thanh toán qua QR', 'GONGCHA15', 59000, 15000, 5900, 44000, '[{\"productId\":3,\"name\":\"Trà Đào Cam Sả Đá Viên\",\"storeId\":1,\"storeName\":\"Gong Cha Biên Hòa\",\"image\":\"https:\\/\\/images.unsplash.com\\/photo-1556679343-c7306c1976bc?w=600\",\"size\":\"L\",\"sugar\":\"Ngọt chuẩn (100%)\",\"ice\":\"Đá chuẩn (100%)\",\"toppings\":[\"Pudding trứng\",\"Trân châu trắng giòn\",\"Thạch sương sáo\"],\"quantity\":1,\"unitPrice\":59000,\"totalPrice\":59000,\"cartItemId\":\"1793080440080n66x\",\"signature\":\"3_L_Ngọt chuẩn (100%)_Đá chuẩn (100%)_Pudding trứng,Thạch sương sáo,Trân châu trắng giòn\"}]', 'Đang chuẩn bị', NULL, NULL, '2026-10-27 05:55:15'),
(20, 'ORD311568_2', 2, 'khach1', 'Phạm Ngọc Duy', '0987654321', '302 Đường 30 Tháng 4, Phường Trung Dũng, Thành phố Biên Hòa, Đồng Nai', '', 'Chuyển khoản QR', 'Đã thanh toán qua QR', NULL, 51000, 0, 5100, 51000, '[{\"productId\":4,\"name\":\"Cà Phê Phin Sữa Đá Đậm Đà\",\"storeId\":2,\"storeName\":\"Highlands Coffee & Tea\",\"image\":\"https:\\/\\/images.unsplash.com\\/photo-1514432324607-a09d9b4aefdd?w=600\",\"size\":\"L\",\"sugar\":\"Ngọt chuẩn (100%)\",\"ice\":\"Đá chuẩn (100%)\",\"toppings\":[\"Pudding trứng\",\"Thạch sương sáo\"],\"quantity\":1,\"unitPrice\":51000,\"totalPrice\":51000,\"cartItemId\":\"1793080421721l896\",\"signature\":\"4_L_Ngọt chuẩn (100%)_Đá chuẩn (100%)_Pudding trứng,Thạch sương sáo\"}]', 'Đang chuẩn bị', NULL, NULL, '2026-10-27 05:55:16');

-- --------------------------------------------------------

--
-- Table structure for table `products`
--

CREATE TABLE `products` (
  `id` int(11) NOT NULL,
  `store_id` int(11) NOT NULL,
  `name` varchar(150) NOT NULL,
  `category` varchar(50) NOT NULL,
  `basePrice` int(11) NOT NULL,
  `discountPrice` int(11) DEFAULT 0,
  `image` text NOT NULL,
  `description` text DEFAULT NULL,
  `isBestSeller` tinyint(1) DEFAULT 0,
  `isAvailable` tinyint(1) DEFAULT 1,
  `soldCount` int(11) DEFAULT 0
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `products`
--

INSERT INTO `products` (`id`, `store_id`, `name`, `category`, `basePrice`, `discountPrice`, `image`, `description`, `isBestSeller`, `isAvailable`, `soldCount`) VALUES
(1, 1, 'Trà Sữa Trân Châu Đường Đen', 'Trà sữa', 45000, 35000, 'https://images.unsplash.com/photo-1558857563-b371033873b8?w=600', 'Sữa tươi thanh trùng kết hợp trân châu nấu đường đen Hàn Quốc dẻo mềm.', 1, 1, 43),
(2, 1, 'Trà Sữa Khoai Môn Kem Trứng', 'Trà sữa', 50000, 0, 'https://images.unsplash.com/photo-1576092768241-dec231879fc3?w=600', 'Khoai môn nghiền tươi béo ngậy phủ lớp kem trứng khè lửa thơm lừng.', 1, 1, 28),
(3, 1, 'Trà Đào Cam Sả Đá Viên', 'Trà trái cây', 40000, 32000, 'https://images.unsplash.com/photo-1556679343-c7306c1976bc?w=600', 'Hương vị thanh mát từ đào ngâm giòn, cam vàng và sả tươi.', 1, 1, 41),
(4, 2, 'Cà Phê Phin Sữa Đá Đậm Đà', 'Cà phê', 35000, 29000, 'https://images.unsplash.com/photo-1514432324607-a09d9b4aefdd?w=600', 'Hạt Robusta rang mộc pha phin truyền thống cùng sữa đặc ngọt dịu.', 1, 1, 52),
(5, 2, 'Matcha Đá Xay Kem Tươi', 'Đá xay', 55000, 0, 'https://images.unsplash.com/photo-1536256263959-770b48d82b0a?w=600', 'Bột trà xanh Uji Nhật Bản xay nhuyễn cùng đá và lớp kem whipping béo mịn.', 0, 1, 15),
(6, 2, 'Bạc Xỉu Kem Muối Biển', 'Cà phê', 42000, 0, 'https://images.unsplash.com/photo-1461023058943-07fcbe16d735?w=600', 'Sự hòa quyện giữa sữa tươi, cà phê nhẹ và lớp foam muối biển mặn ngọt.', 0, 0, 12);

-- --------------------------------------------------------

--
-- Table structure for table `reviews`
--

CREATE TABLE `reviews` (
  `id` int(11) NOT NULL,
  `orderCode` varchar(30) NOT NULL,
  `product_id` int(11) NOT NULL,
  `username` varchar(50) NOT NULL,
  `fullName` varchar(100) NOT NULL,
  `rating` int(11) NOT NULL CHECK (`rating` >= 1 and `rating` <= 5),
  `comment` text DEFAULT NULL,
  `createdAt` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `stores`
--

CREATE TABLE `stores` (
  `id` int(11) NOT NULL,
  `vendor_username` varchar(50) NOT NULL,
  `storeName` varchar(100) NOT NULL,
  `phone` varchar(20) DEFAULT '',
  `address` varchar(255) DEFAULT '',
  `commissionRate` decimal(5,2) DEFAULT 10.00,
  `status` enum('open','closed') DEFAULT 'open'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `stores`
--

INSERT INTO `stores` (`id`, `vendor_username`, `storeName`, `phone`, `address`, `commissionRate`, `status`) VALUES
(1, 'vendor1', 'Gong Cha Biên Hòa', '0912345678', '123 Võ Thị Sáu, Biên Hòa', 10.00, 'open'),
(2, 'vendor2', 'Highlands Coffee & Tea', '0922334455', '456 Phạm Văn Thuận, Biên Hòa', 10.00, 'open');

-- --------------------------------------------------------

--
-- Table structure for table `users`
--

CREATE TABLE `users` (
  `id` int(11) NOT NULL,
  `username` varchar(50) NOT NULL,
  `password` varchar(255) NOT NULL,
  `fullName` varchar(100) NOT NULL,
  `phone` varchar(20) DEFAULT '',
  `address` varchar(255) DEFAULT '',
  `role` enum('customer','vendor','shipper','admin') DEFAULT 'customer',
  `createdAt` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `users`
--

INSERT INTO `users` (`id`, `username`, `password`, `fullName`, `phone`, `address`, `role`, `createdAt`) VALUES
(1, 'admin', '123456', 'Quản Trị Viên Sàn', '0901234567', 'Trung tâm điều hành Biên Hòa', 'admin', '2026-10-22 20:00:00'),
(2, 'vendor1', '123456', 'Chủ Quán Gong Cha', '0912345678', '123 Võ Thị Sáu, P. Thống Nhất, TP. Biên Hòa', 'vendor', '2026-10-22 20:00:00'),
(3, 'vendor2', '123456', 'Chủ Quán Highlands', '0922334455', '456 Phạm Văn Thuận, P. Tân Mai, TP. Biên Hòa', 'vendor', '2026-10-22 20:00:00'),
(4, 'shipper1', '123456', 'Tài Xế Nguyễn Văn Giao', '0933445566', 'Khu vực Biên Hòa, Đồng Nai', 'shipper', '2026-10-22 20:00:00'),
(5, 'khach1', '123456', 'Phạm Ngọc Duy', '0987654321', '302 Đường 30 Tháng 4, Phường Trung Dũng, Thành phố Biên Hòa, Đồng Nai', 'customer', '2026-10-22 20:02:00'),
(6, 'khach2', '123456', 'Hồ Nhân Kiệt', '0977889900', '255 Đồng Khởi, P. Tân Hiệp, TP. Biên Hòa, Đồng Nai', 'customer', '2026-10-22 21:00:00'),
(7, 'khach3', '123456', 'Nguyễn Thị Minh Thư', '0966554433', '1096 Phạm Văn Thuận, P. Tân Mai, TP. Biên Hòa, Đồng Nai', 'customer', '2026-10-22 22:00:00'),
(8, 'khach4', '123456', 'Trần Quốc Bảo', '0944112233', 'Đường Huỳnh Văn Nghệ, P. Bửu Long, TP. Biên Hòa, Đồng Nai', 'customer', '2026-10-22 23:00:00'),
(9, 'khach5', '123456', 'Lê Hoàng Nam', '0938123456', '88 Hà Huy Giáp, P. Quyết Thắng, TP. Biên Hòa, Đồng Nai', 'customer', '2026-10-23 00:00:00'),
(10, 'khach6', '123456', 'Võ Thị Thanh Tâm', '0918223344', '45 Nguyễn Ái Quốc, P. Tân Phong, TP. Biên Hòa, Đồng Nai', 'customer', '2026-10-23 01:00:00'),
(11, 'khach7', '123456', 'Đặng Minh Quân', '0909334455', '12 Cách Mạng Tháng 8, P. Quang Vinh, TP. Biên Hòa, Đồng Nai', 'customer', '2026-10-23 02:00:00'),
(12, 'khach8', '123456', 'Bùi Hoàng Yến', '0932445566', '302 Nguyễn Ái Quốc, P. Hố Nai, TP. Biên Hòa, Đồng Nai', 'customer', '2026-10-23 03:00:00'),
(13, 'khach9', '123456', 'Đỗ Gia Huy', '0974556677', '79 Hưng Đạo Vương, P. Trung Dũng, TP. Biên Hòa, Đồng Nai', 'customer', '2026-10-23 04:00:00'),
(14, 'khach10', '123456', 'Ngô Phương Anh', '0983667788', '154 Phan Trung, P. Tân Tiến, TP. Biên Hòa, Đồng Nai', 'customer', '2026-10-23 05:00:00');

-- --------------------------------------------------------

--
-- Table structure for table `vouchers`
--

CREATE TABLE `vouchers` (
  `id` int(11) NOT NULL,
  `store_id` int(11) DEFAULT NULL,
  `code` varchar(30) NOT NULL,
  `title` varchar(150) NOT NULL,
  `type` enum('fixed','percent') NOT NULL,
  `value` int(11) NOT NULL,
  `minOrder` int(11) DEFAULT 0,
  `maxDiscount` int(11) DEFAULT 0,
  `isActive` tinyint(1) DEFAULT 1
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `vouchers`
--

INSERT INTO `vouchers` (`id`, `store_id`, `code`, `title`, `type`, `value`, `minOrder`, `maxDiscount`, `isActive`) VALUES
(1, NULL, 'GIAM10K', '[Toàn sàn] Giảm 10.000đ cho đơn từ 40.000đ', 'fixed', 10000, 40000, 10000, 1),
(2, NULL, 'FREESHIP', '[Toàn sàn] Trợ giá 15.000đ phí giao hàng cho đơn từ 60.000đ', 'fixed', 15000, 60000, 15000, 1),
(3, NULL, 'BANMOI20', '[Toàn sàn] Giảm 20% tối đa 25.000đ cho đơn từ 50.000đ', 'percent', 20, 50000, 25000, 1),
(4, 1, 'GONGCHA15', '[Gong Cha] Giảm 15.000đ cho các món của Gong Cha từ 50.000đ', 'fixed', 15000, 50000, 15000, 1),
(5, 2, 'HIGHLANDS10', '[Highlands] Giảm 10% tối đa 20.000đ cho món Highlands từ 40.000đ', 'percent', 10, 40000, 20000, 1);

-- --------------------------------------------------------

--
-- Table structure for table `warnings`
--

CREATE TABLE `warnings` (
  `id` int(11) NOT NULL,
  `store_id` int(11) NOT NULL,
  `product_name` varchar(150) NOT NULL,
  `message` text NOT NULL,
  `isResolved` tinyint(1) DEFAULT 0,
  `createdAt` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Indexes for dumped tables
--

--
-- Indexes for table `orders`
--
ALTER TABLE `orders`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `orderCode` (`orderCode`);

--
-- Indexes for table `products`
--
ALTER TABLE `products`
  ADD PRIMARY KEY (`id`),
  ADD KEY `store_id` (`store_id`);

--
-- Indexes for table `reviews`
--
ALTER TABLE `reviews`
  ADD PRIMARY KEY (`id`);

--
-- Indexes for table `stores`
--
ALTER TABLE `stores`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `vendor_username` (`vendor_username`);

--
-- Indexes for table `users`
--
ALTER TABLE `users`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `username` (`username`);

--
-- Indexes for table `vouchers`
--
ALTER TABLE `vouchers`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `code` (`code`);

--
-- Indexes for table `warnings`
--
ALTER TABLE `warnings`
  ADD PRIMARY KEY (`id`),
  ADD KEY `store_id` (`store_id`);

--
-- AUTO_INCREMENT for dumped tables
--

--
-- AUTO_INCREMENT for table `orders`
--
ALTER TABLE `orders`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=21;

--
-- AUTO_INCREMENT for table `products`
--
ALTER TABLE `products`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=8;

--
-- AUTO_INCREMENT for table `reviews`
--
ALTER TABLE `reviews`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=4;

--
-- AUTO_INCREMENT for table `stores`
--
ALTER TABLE `stores`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=3;

--
-- AUTO_INCREMENT for table `users`
--
ALTER TABLE `users`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=15;

--
-- AUTO_INCREMENT for table `vouchers`
--
ALTER TABLE `vouchers`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=6;

--
-- AUTO_INCREMENT for table `warnings`
--
ALTER TABLE `warnings`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=3;

--
-- Constraints for dumped tables
--

--
-- Constraints for table `products`
--
ALTER TABLE `products`
  ADD CONSTRAINT `products_ibfk_1` FOREIGN KEY (`store_id`) REFERENCES `stores` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `stores`
--
ALTER TABLE `stores`
  ADD CONSTRAINT `stores_ibfk_1` FOREIGN KEY (`vendor_username`) REFERENCES `users` (`username`) ON DELETE CASCADE;

--
-- Constraints for table `warnings`
--
ALTER TABLE `warnings`
  ADD CONSTRAINT `warnings_ibfk_1` FOREIGN KEY (`store_id`) REFERENCES `stores` (`id`) ON DELETE CASCADE;
COMMIT;

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
