-- phpMyAdmin SQL Dump
-- version 5.2.1
-- https://www.phpmyadmin.net/
--
-- Host: 127.0.0.1
-- Generation Time: Oct 27, 2026 at 02:09 AM
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
(1, 'ORD171001', 1, 'khach1', 'Phạm Ngọc Duy', '0987654321', '255 Đồng Khởi, P. Tân Hiệp, TP. Biên Hòa, Đồng Nai', 'Giao giờ hành chính', 'COD', 'Đã thu tiền mặt', 'GIAM10K', 70000, 10000, 7000, 60000, '[{\"productId\":1,\"name\":\"Trà Sữa Trân Châu Đường Đen\",\"storeId\":1,\"storeName\":\"Gong Cha Biên Hòa\",\"size\":\"M\",\"sugar\":\"Vừa ngọt (70%)\",\"ice\":\"Đá chuẩn (100%)\",\"toppings\":[\"Trân châu đường đen\"],\"quantity\":2,\"unitPrice\":35000,\"totalPrice\":70000,\"image\":\"https://images.unsplash.com/photo-1558857563-b371033873b8?w=600\"}]', 'Hoàn tất', 'shipper1', 'Tài Xế Nguyễn Văn Giao', '2026-10-27 00:55:22'),
(2, 'ORD171002', 1, 'khach1', 'Phạm Ngọc Duy', '0987654321', '120 Võ Thị Sáu, P. Thống Nhất, TP. Biên Hòa, Đồng Nai', 'Giao nhanh giúp mình', 'Chuyển khoản QR', 'Đã thanh toán qua QR', NULL, 50000, 0, 5000, 50000, '[{\"productId\":2,\"name\":\"Trà Sữa Khoai Môn Kem Trứng\",\"storeId\":1,\"storeName\":\"Gong Cha Biên Hòa\",\"size\":\"S\",\"sugar\":\"Ít ngọt (50%)\",\"ice\":\"Ít đá (50%)\",\"toppings\":[],\"quantity\":1,\"unitPrice\":50000,\"totalPrice\":50000,\"image\":\"https://images.unsplash.com/photo-1576092768241-dec231879fc3?w=600\"}]', 'Chờ tài xế nhận', NULL, NULL, '2026-10-27 00:55:22');

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
(3, 1, 'Trà Đào Cam Sả Đá Viên', 'Trà trái cây', 40000, 32000, 'https://images.unsplash.com/photo-1556679343-c7306c1976bc?w=600', 'Hương vị thanh mát từ đào ngâm giòn, cam vàng và sả tươi.', 1, 1, 40),
(4, 2, 'Cà Phê Phin Sữa Đá Đậm Đà', 'Cà phê', 35000, 29000, 'https://images.unsplash.com/photo-1514432324607-a09d9b4aefdd?w=600', 'Hạt Robusta rang mộc pha phin truyền thống cùng sữa đặc ngọt dịu.', 1, 1, 51),
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

--
-- Dumping data for table `reviews`
--

INSERT INTO `reviews` (`id`, `orderCode`, `product_id`, `username`, `fullName`, `rating`, `comment`, `createdAt`) VALUES
(1, 'ORD171001', 1, 'khach1', 'Phạm Ngọc Duy', 5, 'Trà sữa rất thơm, tài xế giao hàng cực kỳ nhanh và nhiệt tình!', '2026-10-23 03:02:04');

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
(1, 'admin', '123456', 'Quản Trị Viên Sàn', '0901234567', 'Trung tâm điều hành Biên Hòa', 'admin', '2026-10-23 03:02:04'),
(2, 'vendor1', '123456', 'Chủ Quán Gong Cha', '0912345678', '123 Võ Thị Sáu, Biên Hòa, Đồng Nai', 'vendor', '2026-10-23 03:02:04'),
(3, 'vendor2', '123456', 'Chủ Quán Highlands', '0922334455', '456 Phạm Văn Thuận, Biên Hòa, Đồng Nai', 'vendor', '2026-10-23 03:02:04'),
(4, 'shipper1', '123456', 'Tài Xế Nguyễn Văn Giao', '0933445566', 'Khu vực Biên Hòa, Đồng Nai', 'shipper', '2026-10-23 03:02:04'),
(5, 'khach1', '123456', 'Phạm Ngọc Duy', '0987654321', '120 Võ Thị Sáu, P. Thống Nhất, TP. Biên Hòa, Đồng Nai', 'customer', '2026-10-23 03:02:04');

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
-- Dumping data for table `warnings`
--

INSERT INTO `warnings` (`id`, `store_id`, `product_name`, `message`, `isResolved`, `createdAt`) VALUES
(1, 1, 'Trà Đào Cam Sả Đá Viên', 'Nhắc nhở từ Admin Sàn: Vui lòng cập nhật lại mô tả nguồn gốc nguyên liệu rõ ràng hơn.', 0, '2026-10-23 03:02:04');

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
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=3;

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
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=7;

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
