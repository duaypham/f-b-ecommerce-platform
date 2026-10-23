import axios from 'axios';

/**
 * LƯU Ý CẤU HÌNH ĐỊA CHỈ IP KHI CHẠY THỰC TẾ:
 * - Máy ảo Android (Android Emulator): Dùng 'http://10.0.2.2:8080/trasua_api'
 * - Máy ảo iOS hoặc chạy Web: Dùng 'http://localhost:8080/trasua_api'
 * - Điện thoại thật (quét QR Expo Go): Đổi thành IPv4 LAN của máy tính (VD: 'http://192.168.1.15:8080/trasua_api')
 */
export const BASE_URL = 'http://192.168.1.8/trasua_api';

export const API_ENDPOINTS = {
  AUTH: `${BASE_URL}/auth.php`,
  PRODUCTS: `${BASE_URL}/products.php`,
  VOUCHERS: `${BASE_URL}/vouchers.php`,
  ORDERS: `${BASE_URL}/orders.php`,
  REVIEWS: `${BASE_URL}/reviews.php`,
};

export const apiClient = axios.create({
  baseURL: BASE_URL,
  timeout: 8000,
  headers: {
    'Content-Type': 'application/json',
    Accept: 'application/json',
  },
});