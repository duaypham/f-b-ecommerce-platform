export const CATEGORIES = [
  'Tất cả',
  'Trà sữa',
  'Cà phê',
  'Trà trái cây',
  'Đá xay',
];

export const SIZES = [
  { id: 'S', label: 'Size S (Nhỏ)', price: 0 },
  { id: 'M', label: 'Size M (Vừa)', price: 5000 },
  { id: 'L', label: 'Size L (Lớn)', price: 10000 },
];

export const SUGAR_LEVELS = ['0%', '30%', '50%', '70%', '100%'];

export const ICE_LEVELS = ['Không đá', '30% đá', '70% đá', '100% đá'];

export const TOPPINGS = [
  { id: 't1', name: 'Trân châu đen đường đen', price: 5000 },
  { id: 't2', name: 'Trân châu trắng giòn', price: 5000 },
  { id: 't3', name: 'Kem phô mai Macchiato', price: 10000 },
  { id: 't4', name: 'Pudding trứng mềm', price: 7000 },
  { id: 't5', name: 'Thạch sương sáo thảo mộc', price: 5000 },
  { id: 't6', name: 'Đào miếng ngâm giòn', price: 8000 },
];

// Vòng đời đơn hàng 4 bước chuẩn (Quán chuẩn bị -> Gọi Shipper -> Shipper giao -> Hoàn tất)
export const ORDER_STATUS_STEPS = [
  'Đang chuẩn bị',
  'Chờ tài xế nhận',
  'Đang giao hàng',
  'Hoàn tất',
];

export const VIRTUAL_MAP_LOCATIONS = [
  {
    id: 'loc1',
    title: 'Khu vực Trung tâm Biên Hòa',
    address: '120 Võ Thị Sáu, P. Thống Nhất, TP. Biên Hòa, Đồng Nai',
    coords: { latitude: 10.9453, longitude: 106.8243 },
  },
  {
    id: 'loc2',
    title: 'Khu vực Đường Đồng Khởi',
    address: '255 Đồng Khởi, P. Tân Hiệp, TP. Biên Hòa, Đồng Nai',
    coords: { latitude: 10.9574, longitude: 106.8426 },
  },
  {
    id: 'loc3',
    title: 'Khu vực Phạm Văn Thuận (Vincom)',
    address: '1096 Phạm Văn Thuận, P. Tân Mai, TP. Biên Hòa, Đồng Nai',
    coords: { latitude: 10.9512, longitude: 106.8351 },
  },
  {
    id: 'loc4',
    title: 'Khu vực Bửu Long',
    address: 'Đường Huỳnh Văn Nghệ, P. Bửu Long, TP. Biên Hòa, Đồng Nai',
    coords: { latitude: 10.9689, longitude: 106.8012 },
  },
];

export const FALLBACK_PRODUCTS = [
  {
    id: 1,
    store_id: 1,
    storeName: 'Gong Cha Biên Hòa',
    name: 'Trà Sữa Trân Châu Đường Đen',
    category: 'Trà sữa',
    basePrice: 45000,
    discountPrice: 35000,
    image: 'https://images.unsplash.com/photo-1558857563-b371033873b8?w=600',
    description: 'Sữa tươi thanh trùng kết hợp trân châu nấu đường đen Hàn Quốc dẻo mềm.',
    isBestSeller: true,
    isAvailable: true,
    soldCount: 42,
    avgRating: 4.9,
    reviewCount: 12,
  },
  {
    id: 2,
    store_id: 1,
    storeName: 'Gong Cha Biên Hòa',
    name: 'Trà Sữa Khoai Môn Kem Trứng',
    category: 'Trà sữa',
    basePrice: 50000,
    discountPrice: 0,
    image: 'https://images.unsplash.com/photo-1576092768241-dec231879fc3?w=600',
    description: 'Khoai môn nghiền tươi béo ngậy phủ lớp kem trứng khè lửa thơm lừng.',
    isBestSeller: true,
    isAvailable: true,
    soldCount: 28,
    avgRating: 4.8,
    reviewCount: 8,
  },
  {
    id: 3,
    store_id: 1,
    storeName: 'Gong Cha Biên Hòa',
    name: 'Trà Đào Cam Sả Đá Viên',
    category: 'Trà trái cây',
    basePrice: 40000,
    discountPrice: 32000,
    image: 'https://images.unsplash.com/photo-1556679343-c7306c1976bc?w=600',
    description: 'Hương vị thanh mát từ đào ngâm giòn, cam vàng và sả tươi.',
    isBestSeller: true,
    isAvailable: true,
    soldCount: 35,
    avgRating: 4.7,
    reviewCount: 6,
  },
  {
    id: 4,
    store_id: 2,
    storeName: 'Highlands Coffee & Tea',
    name: 'Cà Phê Phin Sữa Đá Đậm Đà',
    category: 'Cà phê',
    basePrice: 35000,
    discountPrice: 29000,
    image: 'https://images.unsplash.com/photo-1514432324607-a09d9b4aefdd?w=600',
    description: 'Hạt Robusta rang mộc pha phin truyền thống cùng sữa đặc ngọt dịu.',
    isBestSeller: true,
    isAvailable: true,
    soldCount: 50,
    avgRating: 5.0,
    reviewCount: 19,
  },
];

export const FALLBACK_VOUCHERS = [
  {
    id: 1,
    store_id: null,
    code: 'GIAM10K',
    title: '[Toàn sàn] Giảm 10.000đ cho đơn từ 40.000đ',
    type: 'fixed',
    value: 10000,
    minOrder: 40000,
    maxDiscount: 10000,
    isActive: true,
  },
  {
    id: 2,
    store_id: null,
    code: 'FREESHIP',
    title: '[Toàn sàn] Trợ giá 15.000đ phí giao hàng cho đơn từ 60.000đ',
    type: 'fixed',
    value: 15000,
    minOrder: 60000,
    maxDiscount: 15000,
    isActive: true,
  },
  {
    id: 3,
    store_id: 1,
    storeName: 'Gong Cha Biên Hòa',
    code: 'GONGCHA15',
    title: '[Gong Cha] Giảm 15.000đ cho các món của Gong Cha từ 50.000đ',
    type: 'fixed',
    value: 15000,
    minOrder: 50000,
    maxDiscount: 15000,
    isActive: true,
  },
];