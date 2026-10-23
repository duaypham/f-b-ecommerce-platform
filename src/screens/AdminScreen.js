import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Image,
  StyleSheet,
  Alert,
  Modal,
} from 'react-native';
import { useApp } from '../context/AppContext';
import { CATEGORIES } from '../constants/data';

export default function AdminScreen({ navigation }) {  const {
    currentUser,
    products,
    stores,
    warnings,
    orders,
    vouchers,
    saveProduct,
    toggleProductAvailability,
    deleteProduct,
    sendWarningToStore,
    resolveStoreWarning,
    updateOrderStatus,
    saveVoucher,
    deleteVoucher,
  } = useApp();

  const role = currentUser?.role || 'customer';
  const isAdmin = role === 'admin';
  const isVendor = role === 'vendor';
  const isShipper = role === 'shipper';
  const vendorStoreId = currentUser?.store?.id || 1;

  // Tab cho Admin & Vendor: 'stats' | 'products' | 'orders' | 'vouchers'
  const [activeTab, setActiveTab] = useState('stats');

  // Tab riêng cho Shipper: 'available' (Chờ nhận) | 'my_deliveries' (Đơn của tôi)
  const [shipperTab, setShipperTab] = useState('available');

  // ==========================================
  // STATE FORM SẢN PHẨM (CHỈ DÀNH CHO VENDOR)
  // ==========================================
  const [editingProdId, setEditingProdId] = useState(0);
  const [prodName, setProdName] = useState('');
  const [prodCategory, setProdCategory] = useState('Trà sữa');
  const [prodBasePrice, setProdBasePrice] = useState('');
  const [prodDiscountPrice, setProdDiscountPrice] = useState('0');
  const [prodImage, setProdImage] = useState('');
  const [prodDesc, setProdDesc] = useState('');
  const [prodBestSeller, setProdBestSeller] = useState(false);
  const [prodAvailable, setProdAvailable] = useState(true);

  // ==========================================
  // STATE MODAL CẢNH CÁO / GỠ MÓN VI PHẠM (DÀNH CHO ADMIN)
  // ==========================================
  const [warnModalVisible, setWarnModalVisible] = useState(false);
  const [warnTargetProduct, setWarnTargetProduct] = useState(null);
  const [warnMode, setWarnMode] = useState('warn'); // 'warn' (Chỉ cảnh cáo) | 'delete' (Gỡ món & Cảnh cáo)
  const [warnMessage, setWarnMessage] = useState('');

  // ==========================================
  // STATE FORM VOUCHER (DÀNH CHO CẢ ADMIN & VENDOR)
  // ==========================================
  const [editingVoucherId, setEditingVoucherId] = useState(0);
  const [vCode, setVCode] = useState('');
  const [vTitle, setVTitle] = useState('');
  const [vType, setVType] = useState('fixed');
  const [vValue, setVValue] = useState('');
  const [vMinOrder, setVMinOrder] = useState('40000');
  const [vMaxDiscount, setVMaxDiscount] = useState('15000');
  const [vActive, setVActive] = useState(true);

  const formatCurrency = (val) => `${Number(val || 0).toLocaleString('vi-VN')}đ`;

  // ==========================================
  // DỮ LIỆU ĐÃ LỌC THEO QUYỀN HẠN
  // ==========================================
  const managedProducts = useMemo(() => {
    if (isAdmin) return products;
    return products.filter((p) => Number(p.store_id) === Number(vendorStoreId));
  }, [products, isAdmin, vendorStoreId]);

  const managedOrders = useMemo(() => {
    if (isAdmin) return orders;
    return orders.filter((o) => Number(o.store_id) === Number(vendorStoreId));
  }, [orders, isAdmin, vendorStoreId]);

  const managedVouchers = useMemo(() => {
    if (isAdmin) return vouchers;
    return vouchers.filter((v) => Number(v.store_id) === Number(vendorStoreId));
  }, [vouchers, isAdmin, vendorStoreId]);

  const storeWarnings = useMemo(() => {
    if (isAdmin) return warnings;
    return warnings.filter((w) => Number(w.store_id) === Number(vendorStoreId));
  }, [warnings, isAdmin, vendorStoreId]);

  // Danh sách đơn cho Tài xế (Shipper)
  const shipperAvailableOrders = useMemo(() => {
    return orders.filter((o) => o.status === 'Chờ tài xế nhận');
  }, [orders]);

  const shipperMyOrders = useMemo(() => {
    return orders.filter((o) => o.shipper_username === currentUser?.username);
  }, [orders, currentUser]);

  // Thống kê Doanh thu & Hoa hồng 10%
  const analytics = useMemo(() => {
    const validOrders = managedOrders.filter((o) => o.status !== 'Đã hủy');
    const completedOrders = managedOrders.filter((o) => o.status === 'Hoàn tất');

    const totalGMV = validOrders.reduce((sum, o) => sum + Number(o.subTotal || 0), 0);
    const totalPlatformFee = validOrders.reduce(
      (sum, o) => sum + Number(o.platformFee || Math.round((o.subTotal || 0) * 0.1)),
      0
    );
    const vendorNetRevenue = totalGMV - totalPlatformFee;

    const popularityRanking = [...managedProducts].sort(
      (a, b) => Number(b.soldCount || 0) - Number(a.soldCount || 0)
    );

    return {
      totalOrdersCount: managedOrders.length,
      completedCount: completedOrders.length,
      totalGMV,
      totalPlatformFee,
      vendorNetRevenue,
      popularityRanking,
    };
  }, [managedOrders, managedProducts]);

  // =========================================================
  // GIAO DIỆN RIÊNG DÀNH CHO TÀI XẾ GIAO HÀNG (SHIPPER VIEW)
  // =========================================================
  if (isShipper) {
    const handleAcceptDelivery = async (orderCode) => {
      const res = await updateOrderStatus(orderCode, 'Đang giao hàng', {
        username: currentUser.username,
        fullName: currentUser.fullName,
      });
      if (res.success) {
        Alert.alert(
          '🛵 Đã nhận đơn!',
          `Bạn đã nhận giao đơn #${orderCode}. Hãy đến quán lấy món và giao cho khách nhé!`
        );
        setShipperTab('my_deliveries');
      } else {
        Alert.alert('Lỗi', res.message);
      }
    };

    const handleCompleteDelivery = (orderCode) => {
      Alert.alert(
        'Xác nhận giao hàng thành công',
        `Bạn đã giao đơn #${orderCode} tận tay khách hàng và hoàn tất thu tiền (nếu COD)?`,
        [
          { text: 'Chưa xong', style: 'cancel' },
          {
            text: '✅ Đã giao Hoàn tất',
            onPress: async () => {
              const res = await updateOrderStatus(orderCode, 'Hoàn tất');
              if (res.success) {
                Alert.alert(
                  '🎉 Hoàn tất đơn hàng!',
                  `Đơn #${orderCode} đã chuyển sang trạng thái Hoàn tất.`
                );
              }
            },
          },
        ]
      );
    };

    const listToShow =
      shipperTab === 'available' ? shipperAvailableOrders : shipperMyOrders;

    return (
      <View style={styles.container}>
        <View style={[styles.roleHeader, { backgroundColor: '#0D47A1', flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }]}>
          <View style={{ flex: 1, paddingRight: 8 }}>
            <Text style={styles.roleHeaderTitle}>
              🛵 TRUNG TÂM ĐIỀU PHỐI TÀI XẾ: {currentUser.fullName}
            </Text>
            <Text style={styles.roleHeaderSub}>
              Nhận đơn các quán đã pha chế xong & Xác nhận giao hàng hoàn tất
            </Text>
          </View>

          <TouchableOpacity
            style={{ backgroundColor: 'rgba(255,255,255,0.2)', paddingHorizontal: 10, paddingVertical: 7, borderRadius: 8 }}
            onPress={() => navigation.navigate('Profile')}
          >
            <Text style={{ color: '#FFF', fontSize: 12, fontWeight: 'bold' }}>👤 Hồ sơ</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.tabBar}>
          <TouchableOpacity
            style={[
              styles.tabItem,
              shipperTab === 'available' && styles.tabItemActive,
            ]}
            onPress={() => setShipperTab('available')}
          >
            <Text
              style={[
                styles.tabText,
                shipperTab === 'available' && styles.tabTextActive,
              ]}
            >
              📡 Đơn chờ nhận ({shipperAvailableOrders.length})
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.tabItem,
              shipperTab === 'my_deliveries' && styles.tabItemActive,
            ]}
            onPress={() => setShipperTab('my_deliveries')}
          >
            <Text
              style={[
                styles.tabText,
                shipperTab === 'my_deliveries' && styles.tabTextActive,
              ]}
            >
              🛵 Đơn của tôi ({shipperMyOrders.length})
            </Text>
          </TouchableOpacity>
        </View>

        <ScrollView contentContainerStyle={styles.scrollContent}>
          {listToShow.length === 0 ? (
            <View style={styles.card}>
              <Text style={{ textAlign: 'center', color: '#757575', padding: 20 }}>
                {shipperTab === 'available'
                  ? 'Hiện chưa có đơn hàng nào ở trạng thái "Chờ tài xế nhận".'
                  : 'Bạn chưa nhận giao đơn hàng nào.'}
              </Text>
            </View>
          ) : (
            listToShow.map((ord) => (
              <View key={ord.orderCode} style={styles.card}>
                <View style={styles.orderAdminHeader}>
                  <Text style={styles.orderAdminCode}>Mã đơn: #{ord.orderCode}</Text>
                  <Text style={styles.orderAdminStatus}>{ord.status}</Text>
                </View>

                <View style={styles.shipperRouteBox}>
                  <Text style={styles.routeLine}>
                    🏪 <Text style={styles.boldText}>Lấy món tại:</Text>{' '}
                    {ord.storeName || `Cửa hàng #${ord.store_id}`}
                    {ord.storeAddress ? ` (${ord.storeAddress})` : ''}
                  </Text>
                  <Text style={[styles.routeLine, { marginTop: 6 }]}>
                    📍 <Text style={styles.boldText}>Giao đến khách:</Text>{' '}
                    {ord.customerName} ({ord.phone})
                  </Text>
                  <Text style={styles.routeAddr}>{ord.address}</Text>
                  {ord.note ? (
                    <Text style={styles.routeNote}>📝 Ghi chú: {ord.note}</Text>
                  ) : null}
                </View>

                <Text style={styles.orderAdminFinance}>
                  💰 Cần thu khách:{' '}
                  {ord.paymentMethod?.includes('QR') ||
                  ord.paymentStatus?.includes('QR')
                    ? `0đ (${ord.paymentStatus})`
                    : `${formatCurrency(ord.totalAmount)} (Thu tiền mặt COD)`}
                </Text>

                {ord.status === 'Chờ tài xế nhận' && (
                  <TouchableOpacity
                    style={[styles.saveBtn, { backgroundColor: '#1565C0', marginTop: 12 }]}
                    onPress={() => handleAcceptDelivery(ord.orderCode)}
                  >
                    <Text style={styles.saveBtnText}>
                      🛵 NHẬN GIAO ĐƠN HÀNG NÀY
                    </Text>
                  </TouchableOpacity>
                )}

                {ord.status === 'Đang giao hàng' &&
                  ord.shipper_username === currentUser.username && (
                    <TouchableOpacity
                      style={[styles.saveBtn, { backgroundColor: '#2E7D32', marginTop: 12 }]}
                      onPress={() => handleCompleteDelivery(ord.orderCode)}
                    >
                      <Text style={styles.saveBtnText}>
                        ✅ XÁC NHẬN ĐÃ GIAO HOÀN TẤT
                      </Text>
                    </TouchableOpacity>
                  )}
              </View>
            ))
          )}
        </ScrollView>
      </View>
    );
  }

  // =========================================================
  // HÀM XỬ LÝ DÀNH CHO VENDOR & ADMIN
  // =========================================================
  const resetProductForm = () => {
    setEditingProdId(0);
    setProdName('');
    setProdCategory('Trà sữa');
    setProdBasePrice('');
    setProdDiscountPrice('0');
    setProdImage('');
    setProdDesc('');
    setProdBestSeller(false);
    setProdAvailable(true);
  };

  const handleEditProductClick = (item) => {
    setEditingProdId(item.id);
    setProdName(item.name);
    setProdCategory(item.category);
    setProdBasePrice(String(item.basePrice));
    setProdDiscountPrice(String(item.discountPrice || 0));
    setProdImage(item.image);
    setProdDesc(item.description || '');
    setProdBestSeller(Boolean(item.isBestSeller));
    setProdAvailable(Boolean(item.isAvailable));
  };

  const handleSaveProduct = async () => {
    if (!prodName.trim() || !prodBasePrice.trim()) {
      Alert.alert('Thiếu thông tin', 'Vui lòng nhập Tên món và Giá gốc!');
      return;
    }

    const res = await saveProduct({
      id: editingProdId,
      store_id: vendorStoreId,
      name: prodName.trim(),
      category: prodCategory,
      basePrice: Number(prodBasePrice),
      discountPrice: Number(prodDiscountPrice || 0),
      image:
        prodImage.trim() ||
        'https://images.unsplash.com/photo-1558857563-b371033873b8?w=600',
      description: prodDesc.trim(),
      isBestSeller: prodBestSeller,
      isAvailable: prodAvailable,
    });

    if (res.success) {
      Alert.alert('Thành công', res.message);
      resetProductForm();
    } else {
      Alert.alert('Lỗi', res.message);
    }
  };

  const handleVendorDeleteProduct = (id, name) => {
    Alert.alert('Xác nhận xóa', `Bạn có chắc muốn xóa món "${name}" khỏi thực đơn quán?`, [
      { text: 'Hủy', style: 'cancel' },
      {
        text: 'Xóa món',
        style: 'destructive',
        onPress: async () => {
          const res = await deleteProduct(id);
          if (res.success) Alert.alert('Đã xóa', res.message);
        },
      },
    ]);
  };

  // Mở Modal cho Admin gửi Cảnh cáo hoặc Gỡ món vi phạm
  const openAdminActionModal = (productItem, mode) => {
    setWarnTargetProduct(productItem);
    setWarnMode(mode);
    setWarnMessage('');
    setWarnModalVisible(true);
  };

  const handleConfirmAdminWarningOrDelete = async () => {
    if (!warnMessage.trim()) {
      Alert.alert('Thiếu lý do', 'Vui lòng nhập nội dung cảnh cáo hoặc lý do vi phạm!');
      return;
    }

    if (warnMode === 'warn') {
      const res = await sendWarningToStore({
        store_id: warnTargetProduct.store_id,
        product_name: warnTargetProduct.name,
        message: warnMessage.trim(),
      });
      setWarnModalVisible(false);
      if (res.success) {
        Alert.alert('Đã gửi cảnh cáo', res.message);
      } else {
        Alert.alert('Lỗi', res.message);
      }
    } else {
      const res = await deleteProduct(warnTargetProduct.id, warnMessage.trim());
      setWarnModalVisible(false);
      if (res.success) {
        Alert.alert(
          'Đã gỡ sản phẩm vi phạm',
          `Đã xóa món "${warnTargetProduct.name}" và gửi thông báo cảnh cáo tới cửa hàng!`
        );
      } else {
        Alert.alert('Lỗi', res.message);
      }
    }
  };

  // Xử lý CRUD Voucher (Hỗ trợ cả Admin Sàn & Chủ Quán)
  const resetVoucherForm = () => {
    setEditingVoucherId(0);
    setVCode('');
    setVTitle('');
    setVType('fixed');
    setVValue('');
    setVMinOrder('40000');
    setVMaxDiscount('15000');
    setVActive(true);
  };

  const handleEditVoucherClick = (v) => {
    setEditingVoucherId(v.id);
    setVCode(v.code);
    setVTitle(v.title);
    setVType(v.type);
    setVValue(String(v.value));
    setVMinOrder(String(v.minOrder));
    setVMaxDiscount(String(v.maxDiscount));
    setVActive(Boolean(v.isActive));
  };

  const handleSaveVoucher = async () => {
    if (!vCode.trim() || !vTitle.trim() || !vValue.trim()) {
      Alert.alert('Thiếu thông tin', 'Vui lòng nhập Mã code, Tên chương trình và Giá trị giảm!');
      return;
    }

    const res = await saveVoucher({
      id: editingVoucherId,
      store_id: isVendor ? vendorStoreId : null, // Vendor tạo mã cho quán mình, Admin tạo mã toàn sàn
      code: vCode.trim().toUpperCase(),
      title: vTitle.trim(),
      type: vType,
      value: Number(vValue),
      minOrder: Number(vMinOrder || 0),
      maxDiscount: Number(vMaxDiscount || vValue),
      isActive: vActive,
    });

    if (res.success) {
      Alert.alert('Thành công', res.message);
      resetVoucherForm();
    } else {
      Alert.alert('Lỗi', res.message);
    }
  };

  const handleDeleteVoucher = (id, code) => {
    Alert.alert('Xóa mã giảm giá', `Bạn có chắc muốn xóa mã ${code}?`, [
      { text: 'Hủy', style: 'cancel' },
      {
        text: 'Xóa',
        style: 'destructive',
        onPress: async () => {
          const res = await deleteVoucher(id);
          if (res.success) Alert.alert('Đã xóa', res.message);
        },
      },
    ]);
  };

  const unresolvedWarningsCount = storeWarnings.filter((w) => !w.isResolved).length;

  return (
    <View style={styles.container}>
      {/* BANNER VAI TRÒ QUẢN TRỊ */}
      <View style={[styles.roleHeader, { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }]}>
        <View style={{ flex: 1, paddingRight: 8 }}>
          <Text style={styles.roleHeaderTitle}>
            {isAdmin
              ? '🛡️ BẢNG ĐIỀU KHIỂN QUẢN TRỊ VIÊN NỀN TẢNG (ADMIN)'
              : `🏪 GIAN HÀNG: ${currentUser?.store?.storeName || 'Đối tác Vendor'}`}
          </Text>
          <Text style={styles.roleHeaderSub}>
            {isAdmin
              ? 'Giám sát hoa hồng 10%, quản lý Voucher Toàn sàn & Kiểm duyệt/Cảnh cáo vi phạm'
              : 'Chủ động quản lý Thực đơn, tạo Voucher riêng của quán & Gọi Shipper giao hàng'}
          </Text>
        </View>

        <TouchableOpacity
          style={{ backgroundColor: 'rgba(255,255,255,0.2)', paddingHorizontal: 10, paddingVertical: 7, borderRadius: 8 }}
          onPress={() => navigation.navigate('Profile')}
        >
          <Text style={{ color: '#FFF', fontSize: 12, fontWeight: 'bold' }}>👤 Hồ sơ</Text>
        </TouchableOpacity>
      </View>

      {/* THANH CHUYỂN 4 TAB (MỞ CHO CẢ ADMIN VÀ VENDOR) */}
      <View style={styles.tabBar}>
        <TouchableOpacity
          style={[styles.tabItem, activeTab === 'stats' && styles.tabItemActive]}
          onPress={() => setActiveTab('stats')}
        >
          <Text style={[styles.tabText, activeTab === 'stats' && styles.tabTextActive]}>
            📊 Doanh thu
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.tabItem, activeTab === 'products' && styles.tabItemActive]}
          onPress={() => setActiveTab('products')}
        >
          <Text style={[styles.tabText, activeTab === 'products' && styles.tabTextActive]}>
            🧋 Thực đơn {unresolvedWarningsCount > 0 ? `(${unresolvedWarningsCount}⚠️)` : ''}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.tabItem, activeTab === 'orders' && styles.tabItemActive]}
          onPress={() => setActiveTab('orders')}
        >
          <Text style={[styles.tabText, activeTab === 'orders' && styles.tabTextActive]}>
            📦 Đơn ({managedOrders.length})
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.tabItem, activeTab === 'vouchers' && styles.tabItemActive]}
          onPress={() => setActiveTab('vouchers')}
        >
          <Text style={[styles.tabText, activeTab === 'vouchers' && styles.tabTextActive]}>
            🎟️ Voucher ({managedVouchers.length})
          </Text>
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* ====================================================
            TAB 1: THỐNG KÊ DOANH THU, HOA HỒNG & ĐỘ PHỔ BIẾN
        ==================================================== */}
        {activeTab === 'stats' && (
          <View>
            <View style={styles.statsGrid}>
              <View style={[styles.statBox, { backgroundColor: '#E3F2FD' }]}>
                <Text style={styles.statLabel}>Tổng giá trị đơn (GMV)</Text>
                <Text style={[styles.statVal, { color: '#1565C0' }]}>
                  {formatCurrency(analytics.totalGMV)}
                </Text>
                <Text style={styles.statSub}>
                  {analytics.totalOrdersCount} đơn ({analytics.completedCount} hoàn tất)
                </Text>
              </View>

              <View style={[styles.statBox, { backgroundColor: '#FCE4EC' }]}>
                <Text style={styles.statLabel}>
                  {isAdmin ? 'Doanh thu Hoa hồng Sàn (10%)' : 'Phí chiết khấu nộp Sàn (10%)'}
                </Text>
                <Text style={[styles.statVal, { color: '#C2185B' }]}>
                  {formatCurrency(analytics.totalPlatformFee)}
                </Text>
                <Text style={styles.statSub}>Trích tự động trên mỗi đơn</Text>
              </View>

              <View style={[styles.statBox, { backgroundColor: '#E8F5E9' }]}>
                <Text style={styles.statLabel}>Doanh thu thực nhận của Quán (90%)</Text>
                <Text style={[styles.statVal, { color: '#2E7D32' }]}>
                  {formatCurrency(analytics.vendorNetRevenue)}
                </Text>
                <Text style={styles.statSub}>Sau khi trừ phí nền tảng</Text>
              </View>
            </View>

            {isAdmin && (
              <View style={styles.card}>
                <Text style={styles.sectionTitle}>
                  🏪 Báo cáo chiết khấu hoa hồng theo Cửa hàng đối tác
                </Text>
                {stores.map((st) => {
                  const stOrders = orders.filter(
                    (o) => Number(o.store_id) === Number(st.id) && o.status !== 'Đã hủy'
                  );
                  const stGMV = stOrders.reduce((s, o) => s + Number(o.subTotal || 0), 0);
                  const stFee = stOrders.reduce(
                    (s, o) => s + Number(o.platformFee || Math.round((o.subTotal || 0) * 0.1)),
                    0
                  );
                  return (
                    <View key={st.id} style={styles.storeStatRow}>
                      <View style={{ flex: 1 }}>
                        <Text style={styles.storeStatName}>
                          {st.storeName} (@{st.vendor_username})
                        </Text>
                        <Text style={styles.storeStatSub}>
                          Số đơn hợp lệ: {stOrders.length} đơn • Doanh số: {formatCurrency(stGMV)}
                        </Text>
                      </View>
                      <View style={{ alignItems: 'flex-end' }}>
                        <Text style={styles.storeFeeLabel}>Phí sàn thu (10%)</Text>
                        <Text style={styles.storeFeeValue}>+{formatCurrency(stFee)}</Text>
                      </View>
                    </View>
                  );
                })}
              </View>
            )}

            <View style={styles.card}>
              <Text style={styles.sectionTitle}>
                🏆 Thống kê tần suất mua & Độ phổ biến món nước
              </Text>
              {analytics.popularityRanking.map((item, idx) => (
                <View key={item.id} style={styles.rankRow}>
                  <View
                    style={[
                      styles.rankCircle,
                      idx === 0 && { backgroundColor: '#FFD54F' },
                      idx === 1 && { backgroundColor: '#E0E0E0' },
                      idx === 2 && { backgroundColor: '#FFCCBC' },
                    ]}
                  >
                    <Text style={styles.rankNum}>#{idx + 1}</Text>
                  </View>
                  <View style={{ flex: 1, marginLeft: 10 }}>
                    <Text style={styles.rankProdName}>{item.name}</Text>
                    <Text style={styles.rankProdStore}>
                      {item.storeName} • {item.category}
                    </Text>
                  </View>
                  <Text style={styles.rankSoldCount}>{item.soldCount || 0} ly đã bán</Text>
                </View>
              ))}
            </View>
          </View>
        )}

        {/* ====================================================
            TAB 2: QUẢN LÝ THỰC ĐƠN (VENDOR) & KIỂM DUYỆT VI PHẠM (ADMIN)
        ==================================================== */}
        {activeTab === 'products' && (
          <View>
            {/* HỘP THƯ CẢNH CÁO VI PHẠM TỪ ADMIN */}
            {storeWarnings.length > 0 && (
              <View style={[styles.card, { borderColor: '#FFB300', borderWidth: 1.5 }]}>
                <Text style={[styles.sectionTitle, { color: '#D84315' }]}>
                  🔔 Thông báo & Cảnh cáo vi phạm từ Quản trị viên ({storeWarnings.length})
                </Text>
                {storeWarnings.map((w) => (
                  <View key={w.id} style={styles.warningItem}>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.warningTitle}>
                        ⚠️ Món: {w.product_name}{' '}
                        {isAdmin ? `(${w.storeName})` : ''}
                      </Text>
                      <Text style={styles.warningMsg}>{w.message}</Text>
                      <Text style={styles.warningMeta}>
                        Trạng thái:{' '}
                        {w.isResolved
                          ? '✅ Cửa hàng đã xác nhận khắc phục'
                          : '🔴 Chưa xử lý'}
                      </Text>
                    </View>

                    {isVendor && !w.isResolved && (
                      <TouchableOpacity
                        style={styles.resolveBtn}
                        onPress={() => resolveStoreWarning(w.id)}
                      >
                        <Text style={styles.resolveBtnText}>✅ Đã khắc phục</Text>
                      </TouchableOpacity>
                    )}
                  </View>
                ))}
              </View>
            )}

            {/* CHỈ VENDOR MỚI CÓ QUYỀN THÊM / SỬA THỰC ĐƠN */}
            {isVendor ? (
              <View style={styles.card}>
                <Text style={styles.sectionTitle}>
                  {editingProdId > 0
                    ? `✏️ Chỉnh sửa món #${editingProdId}`
                    : '➕ Thêm món mới lên thực đơn quán'}
                </Text>

                <Text style={styles.label}>Tên món đồ uống (*)</Text>
                <TextInput
                  style={styles.input}
                  placeholder="VD: Trà Sữa Oolong Kem Phô Mai"
                  value={prodName}
                  onChangeText={setProdName}
                />

                <Text style={styles.label}>Danh mục</Text>
                <View style={styles.chipRow}>
                  {CATEGORIES.filter((c) => c !== 'Tất cả').map((cat) => (
                    <TouchableOpacity
                      key={cat}
                      style={[styles.chip, prodCategory === cat && styles.chipActive]}
                      onPress={() => setProdCategory(cat)}
                    >
                      <Text
                        style={[
                          styles.chipText,
                          prodCategory === cat && { color: '#FFF' },
                        ]}
                      >
                        {cat}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>

                <View style={styles.twoColRow}>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.label}>Giá gốc (VNĐ) (*)</Text>
                    <TextInput
                      style={styles.input}
                      placeholder="VD: 45000"
                      keyboardType="numeric"
                      value={prodBasePrice}
                      onChangeText={setProdBasePrice}
                    />
                  </View>

                  <View style={{ flex: 1 }}>
                    <Text style={styles.label}>Giá giảm khuyến mãi (0 = K giảm)</Text>
                    <TextInput
                      style={styles.input}
                      placeholder="VD: 35000"
                      keyboardType="numeric"
                      value={prodDiscountPrice}
                      onChangeText={setProdDiscountPrice}
                    />
                  </View>
                </View>

                <Text style={styles.label}>Đường dẫn Ảnh (URL)</Text>
                <TextInput
                  style={styles.input}
                  placeholder="https://images.unsplash.com/..."
                  value={prodImage}
                  onChangeText={setProdImage}
                />

                <Text style={styles.label}>Mô tả hương vị</Text>
                <TextInput
                  style={styles.input}
                  placeholder="Nhập mô tả thành phần món nước..."
                  value={prodDesc}
                  onChangeText={setProdDesc}
                />

                <View style={styles.toggleRow}>
                  <TouchableOpacity
                    style={[styles.toggleBtn, prodBestSeller && styles.toggleBtnActive]}
                    onPress={() => setProdBestSeller(!prodBestSeller)}
                  >
                    <Text
                      style={[
                        styles.toggleBtnText,
                        prodBestSeller && { color: '#FFF' },
                      ]}
                    >
                      {prodBestSeller ? '☑️ Món Nổi Bật (Best-seller)' : '⬜ Món Nổi Bật'}
                    </Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={[
                      styles.toggleBtn,
                      prodAvailable && {
                        backgroundColor: '#2E7D32',
                        borderColor: '#2E7D32',
                      },
                    ]}
                    onPress={() => setProdAvailable(!prodAvailable)}
                  >
                    <Text
                      style={[
                        styles.toggleBtnText,
                        prodAvailable && { color: '#FFF' },
                      ]}
                    >
                      {prodAvailable ? '🟢 Trạng thái: Còn món' : '🔴 Tạm hết hàng'}
                    </Text>
                  </TouchableOpacity>
                </View>

                <View style={styles.formActionRow}>
                  <TouchableOpacity style={styles.saveBtn} onPress={handleSaveProduct}>
                    <Text style={styles.saveBtnText}>
                      {editingProdId > 0 ? 'LƯU CẬP NHẬT MÓN' : '+ THÊM MÓN MỚI'}
                    </Text>
                  </TouchableOpacity>

                  {editingProdId > 0 && (
                    <TouchableOpacity
                      style={styles.cancelEditBtn}
                      onPress={resetProductForm}
                    >
                      <Text style={styles.cancelEditText}>Hủy sửa</Text>
                    </TouchableOpacity>
                  )}
                </View>
              </View>
            ) : (
              <View style={styles.adminPolicyBanner}>
                <Text style={styles.adminPolicyText}>
                  🛡️ Chính sách Phân quyền Sàn: Quản trị viên nền tảng không can thiệp chỉnh sửa giá hay thông tin thực đơn của quán. Bạn chỉ có quyền Gửi cảnh cáo hoặc Gỡ sản phẩm nếu phát hiện vi phạm tiêu chuẩn cộng đồng.
                </Text>
              </View>
            )}

            {/* Danh sách sản phẩm */}
            <View style={styles.card}>
              <Text style={styles.sectionTitle}>
                📋 Danh sách Thực đơn ({managedProducts.length} món)
              </Text>
              {managedProducts.map((item) => (
                <View key={item.id} style={styles.prodRow}>
                  <Image source={{ uri: item.image }} style={styles.prodThumb} />
                  <View style={{ flex: 1, marginLeft: 10 }}>
                    <Text style={styles.prodRowStore}>🏪 {item.storeName}</Text>
                    <Text style={styles.prodRowName}>{item.name}</Text>
                    <Text style={styles.prodRowPrice}>
                      Giá gốc: {formatCurrency(item.basePrice)}
                      {item.discountPrice > 0
                        ? ` ➔ KM: ${formatCurrency(item.discountPrice)}`
                        : ''}
                    </Text>

                    {/* Nút điều khiển: Phân tách rõ giữa Vendor và Admin */}
                    {isVendor ? (
                      <View style={styles.prodControlBtns}>
                        <TouchableOpacity
                          style={[
                            styles.miniBtn,
                            item.isAvailable
                              ? { backgroundColor: '#E8F5E9' }
                              : { backgroundColor: '#FFEBEE' },
                          ]}
                          onPress={() =>
                            toggleProductAvailability(item.id, !item.isAvailable)
                          }
                        >
                          <Text
                            style={{
                              fontSize: 11,
                              fontWeight: 'bold',
                              color: item.isAvailable ? '#2E7D32' : '#C62828',
                            }}
                          >
                            {item.isAvailable
                              ? '🟢 Còn món (Bấm khóa)'
                              : '🔴 Tạm hết (Bấm mở)'}
                          </Text>
                        </TouchableOpacity>

                        <TouchableOpacity
                          style={[styles.miniBtn, { backgroundColor: '#E3F2FD' }]}
                          onPress={() => handleEditProductClick(item)}
                        >
                          <Text
                            style={{ fontSize: 11, fontWeight: 'bold', color: '#1565C0' }}
                          >
                            ✏️ Sửa
                          </Text>
                        </TouchableOpacity>

                        <TouchableOpacity
                          style={[styles.miniBtn, { backgroundColor: '#FFEBEE' }]}
                          onPress={() => handleVendorDeleteProduct(item.id, item.name)}
                        >
                          <Text
                            style={{ fontSize: 11, fontWeight: 'bold', color: '#C62828' }}
                          >
                            🗑️ Xóa
                          </Text>
                        </TouchableOpacity>
                      </View>
                    ) : (
                      <View style={styles.prodControlBtns}>
                        <TouchableOpacity
                          style={[styles.miniBtn, { backgroundColor: '#FFF8E1' }]}
                          onPress={() => openAdminActionModal(item, 'warn')}
                        >
                          <Text
                            style={{ fontSize: 11, fontWeight: 'bold', color: '#E65100' }}
                          >
                            ⚠️ Gửi cảnh cáo tới quán
                          </Text>
                        </TouchableOpacity>

                        <TouchableOpacity
                          style={[styles.miniBtn, { backgroundColor: '#FFEBEE' }]}
                          onPress={() => openAdminActionModal(item, 'delete')}
                        >
                          <Text
                            style={{ fontSize: 11, fontWeight: 'bold', color: '#C62828' }}
                          >
                            🗑️ Gỡ món vi phạm
                          </Text>
                        </TouchableOpacity>
                      </View>
                    )}
                  </View>
                </View>
              ))}
            </View>
          </View>
        )}

        {/* ====================================================
            TAB 3: XỬ LÝ ĐƠN HÀNG (PHỐI HỢP VENDOR -> SHIPPER)
        ==================================================== */}
        {activeTab === 'orders' && (
          <View style={styles.card}>
            <Text style={styles.sectionTitle}>
              📦 Điều phối Đơn hàng ({managedOrders.length})
            </Text>
            <Text style={styles.subHintNote}>
              * Quy trình chuẩn: Quán pha chế xong bấm "Gọi Shipper" ➔ Tài xế nhận đơn đi giao và bấm "Hoàn tất".
            </Text>

            {managedOrders.map((ord) => (
              <View key={ord.orderCode} style={styles.orderAdminItem}>
                <View style={styles.orderAdminHeader}>
                  <Text style={styles.orderAdminCode}>
                    #{ord.orderCode} • {ord.storeName || `Quán #${ord.store_id}`}
                  </Text>
                  <Text style={styles.orderAdminStatus}>{ord.status}</Text>
                </View>

                <Text style={styles.orderAdminMeta}>
                  👤 Khách: {ord.customerName} ({ord.phone})
                </Text>
                <Text style={styles.orderAdminMeta}>📍 Địa chỉ: {ord.address}</Text>
                <Text style={styles.orderAdminMeta}>
                  💳 Thanh toán: {ord.paymentStatus || ord.paymentMethod}
                </Text>
                {ord.shipperName && (
                  <Text style={[styles.orderAdminMeta, { color: '#1565C0', fontWeight: 'bold' }]}>
                    🛵 Tài xế giao đơn: {ord.shipperName} (@{ord.shipper_username})
                  </Text>
                )}
                <Text style={styles.orderAdminFinance}>
                  💰 Tổng đơn: {formatCurrency(ord.totalAmount)} (Phí sàn 10%:{' '}
                  {formatCurrency(ord.platformFee || Math.round(ord.subTotal * 0.1))})
                </Text>

                {/* Thao tác của Chủ quán (Chỉ chuyển từ Đang chuẩn bị -> Chờ tài xế nhận) */}
                {isVendor && ord.status === 'Đang chuẩn bị' && (
                  <View style={styles.vendorOrderActionRow}>
                    <TouchableOpacity
                      style={[styles.saveBtn, { backgroundColor: '#2E7D32' }]}
                      onPress={() =>
                        updateOrderStatus(ord.orderCode, 'Chờ tài xế nhận')
                      }
                    >
                      <Text style={styles.saveBtnText}>
                        📦 Đã xong món - Gọi Shipper nhận đơn
                      </Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                      style={styles.cancelOrderSmallBtn}
                      onPress={() => updateOrderStatus(ord.orderCode, 'Đã hủy')}
                    >
                      <Text style={styles.cancelOrderSmallText}>Hủy đơn</Text>
                    </TouchableOpacity>
                  </View>
                )}

                {isVendor && ord.status !== 'Đang chuẩn bị' && (
                  <Text style={styles.lockedOrderHint}>
                    ℹ️ Đơn hàng đang ở giai đoạn "{ord.status}" (Do bộ phận Tài xế Shipper phụ trách).
                  </Text>
                )}
              </View>
            ))}
          </View>
        )}

        {/* ====================================================
            TAB 4: QUẢN LÝ VOUCHER (TOÀN SÀN & RIÊNG CỦA QUÁN)
        ==================================================== */}
        {activeTab === 'vouchers' && (
          <View>
            <View style={styles.card}>
              <Text style={styles.sectionTitle}>
                {editingVoucherId > 0
                  ? `✏️ Sửa Mã giảm giá #${editingVoucherId}`
                  : isAdmin
                  ? '🌐 Phát hành Mã giảm giá Toàn Sàn (Platform Voucher)'
                  : `🏪 Tạo Mã giảm giá riêng cho quán ${currentUser?.store?.storeName}`}
              </Text>

              <Text style={styles.label}>Mã Code viết liền (*)</Text>
              <TextInput
                style={styles.input}
                placeholder={isAdmin ? 'VD: SANFB20, FREESHIP' : 'VD: GONGCHA15, QUANMOI10'}
                value={vCode}
                onChangeText={setVCode}
                autoCapitalize="characters"
              />

              <Text style={styles.label}>Mô tả chương trình khuyến mãi (*)</Text>
              <TextInput
                style={styles.input}
                placeholder="VD: Giảm 15.000đ cho đơn hàng từ 50.000đ"
                value={vTitle}
                onChangeText={setVTitle}
              />

              <Text style={styles.label}>Loại hình giảm giá</Text>
              <View style={styles.toggleRow}>
                <TouchableOpacity
                  style={[styles.toggleBtn, vType === 'fixed' && styles.toggleBtnActive]}
                  onPress={() => setVType('fixed')}
                >
                  <Text
                    style={[
                      styles.toggleBtnText,
                      vType === 'fixed' && { color: '#FFF' },
                    ]}
                  >
                    💵 Giảm tiền cố định (fixed)
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.toggleBtn, vType === 'percent' && styles.toggleBtnActive]}
                  onPress={() => setVType('percent')}
                >
                  <Text
                    style={[
                      styles.toggleBtnText,
                      vType === 'percent' && { color: '#FFF' },
                    ]}
                  >
                    ％ Giảm theo phần trăm (percent)
                  </Text>
                </TouchableOpacity>
              </View>

              <View style={styles.twoColRow}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.label}>
                    {vType === 'fixed' ? 'Số tiền giảm (VNĐ)' : 'Phần trăm giảm (%)'}
                  </Text>
                  <TextInput
                    style={styles.input}
                    placeholder={vType === 'fixed' ? '15000' : '20'}
                    keyboardType="numeric"
                    value={vValue}
                    onChangeText={setVValue}
                  />
                </View>

                <View style={{ flex: 1 }}>
                  <Text style={styles.label}>Đơn tối thiểu (minOrder)</Text>
                  <TextInput
                    style={styles.input}
                    placeholder="50000"
                    keyboardType="numeric"
                    value={vMinOrder}
                    onChangeText={setVMinOrder}
                  />
                </View>
              </View>

              <Text style={styles.label}>Mức giảm tối đa (VNĐ - Áp dụng cho mã %)</Text>
              <TextInput
                style={styles.input}
                placeholder="25000"
                keyboardType="numeric"
                value={vMaxDiscount}
                onChangeText={setVMaxDiscount}
              />

              <TouchableOpacity
                style={[
                  styles.toggleBtn,
                  { marginTop: 10 },
                  vActive && { backgroundColor: '#2E7D32', borderColor: '#2E7D32' },
                ]}
                onPress={() => setVActive(!vActive)}
              >
                <Text style={[styles.toggleBtnText, vActive && { color: '#FFF' }]}>
                  {vActive
                    ? '🟢 Trạng thái: Đang kích hoạt cho khách dùng'
                    : '🔴 Trạng thái: Tạm ngưng mã này'}
                </Text>
              </TouchableOpacity>

              <View style={styles.formActionRow}>
                <TouchableOpacity style={styles.saveBtn} onPress={handleSaveVoucher}>
                  <Text style={styles.saveBtnText}>
                    {editingVoucherId > 0 ? 'CẬP NHẬT VOUCHER' : '+ PHÁT HÀNH VOUCHER'}
                  </Text>
                </TouchableOpacity>

                {editingVoucherId > 0 && (
                  <TouchableOpacity
                    style={styles.cancelEditBtn}
                    onPress={resetVoucherForm}
                  >
                    <Text style={styles.cancelEditText}>Hủy sửa</Text>
                  </TouchableOpacity>
                )}
              </View>
            </View>

            <View style={styles.card}>
              <Text style={styles.sectionTitle}>
                🏷️ Danh sách Mã giảm giá ({managedVouchers.length})
              </Text>
              {managedVouchers.map((v) => (
                <View key={v.id || v.code} style={styles.voucherRow}>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.voucherScopeTag}>
                      {v.store_id
                        ? `🏪 Voucher Quán: ${v.storeName || '#' + v.store_id}`
                        : '🌐 Voucher Toàn sàn (Admin)'}
                    </Text>
                    <Text style={styles.voucherRowCode}>
                      {v.code} ({v.isActive ? '🟢 Đang mở' : '🔴 Đã khóa'})
                    </Text>
                    <Text style={styles.voucherRowTitle}>{v.title}</Text>
                    <Text style={styles.voucherRowMeta}>
                      Giảm: {v.type === 'fixed' ? formatCurrency(v.value) : `${v.value}%`} •
                      Đơn tối thiểu: {formatCurrency(v.minOrder)}
                    </Text>
                  </View>

                  <View style={{ gap: 6 }}>
                    <TouchableOpacity
                      style={[styles.miniBtn, { backgroundColor: '#E3F2FD' }]}
                      onPress={() => handleEditVoucherClick(v)}
                    >
                      <Text style={{ fontSize: 11, fontWeight: 'bold', color: '#1565C0' }}>
                        ✏️ Sửa
                      </Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                      style={[styles.miniBtn, { backgroundColor: '#FFEBEE' }]}
                      onPress={() => handleDeleteVoucher(v.id, v.code)}
                    >
                      <Text style={{ fontSize: 11, fontWeight: 'bold', color: '#C62828' }}>
                        🗑️ Xóa
                      </Text>
                    </TouchableOpacity>
                  </View>
                </View>
              ))}
            </View>
          </View>
        )}
      </ScrollView>

      {/* ============================================================
          MODAL NHẬP LÝ DO CẢNH CÁO HOẶC GỠ MÓN VI PHẠM (CHO ADMIN)
      ============================================================ */}
      <Modal
        visible={warnModalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setWarnModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>
              {warnMode === 'warn'
                ? '⚠️ Gửi cảnh cáo vi phạm tới Cửa hàng'
                : '🗑️ Gỡ sản phẩm vi phạm & Gửi cảnh cáo'}
            </Text>
            <Text style={styles.modalSub}>
              Sản phẩm: <Text style={styles.boldText}>{warnTargetProduct?.name}</Text> (
              {warnTargetProduct?.storeName})
            </Text>

            <TextInput
              style={styles.modalInput}
              placeholder="Nhập lý do cảnh cáo / vi phạm (VD: Hình ảnh không đúng thực tế, mô tả vi phạm...)"
              value={warnMessage}
              onChangeText={setWarnMessage}
              multiline
            />

            <View style={styles.modalActionRow}>
              <TouchableOpacity
                style={styles.modalCancelBtn}
                onPress={() => setWarnModalVisible(false)}
              >
                <Text style={styles.modalCancelText}>Hủy</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.modalConfirmBtn,
                  warnMode === 'delete' && { backgroundColor: '#C62828' },
                ]}
                onPress={handleConfirmAdminWarningOrDelete}
              >
                <Text style={styles.modalConfirmText}>
                  {warnMode === 'warn' ? 'Gửi cảnh cáo' : 'Xác nhận Gỡ món'}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F7F3F0' },
  roleHeader: {
    backgroundColor: '#4A3222',
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  roleHeaderTitle: { color: '#FFD54F', fontSize: 13, fontWeight: 'bold' },
  roleHeaderSub: { color: '#EFEBE7', fontSize: 11, marginTop: 2 },
  tabBar: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E0D6CE',
  },
  tabItem: {
    flex: 1,
    paddingVertical: 11,
    alignItems: 'center',
    borderBottomWidth: 3,
    borderBottomColor: 'transparent',
  },
  tabItemActive: { borderBottomColor: '#D84315' },
  tabText: { fontSize: 11, fontWeight: '600', color: '#7D6E63' },
  tabTextActive: { color: '#D84315', fontWeight: 'bold' },
  scrollContent: { padding: 14, paddingBottom: 40 },
  statsGrid: { gap: 10, marginBottom: 14 },
  statBox: { padding: 14, borderRadius: 12 },
  statLabel: { fontSize: 12, fontWeight: 'bold', color: '#4E342E' },
  statVal: { fontSize: 20, fontWeight: 'bold', marginTop: 4 },
  statSub: { fontSize: 11, color: '#616161', marginTop: 2 },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: 14,
    marginBottom: 14,
    elevation: 2,
  },
  sectionTitle: { fontSize: 15, fontWeight: 'bold', color: '#3E2723', marginBottom: 10 },
  subHintNote: { fontSize: 11, color: '#8D6E63', fontStyle: 'italic', marginBottom: 8 },
  storeStatRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 10,
    borderTopWidth: 1,
    borderTopColor: '#F0EAE4',
  },
  storeStatName: { fontSize: 13, fontWeight: 'bold', color: '#3E2723' },
  storeStatSub: { fontSize: 11, color: '#757575', marginTop: 2 },
  storeFeeLabel: { fontSize: 10, color: '#8D6E63' },
  storeFeeValue: { fontSize: 14, fontWeight: 'bold', color: '#C2185B' },
  rankRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    borderTopWidth: 1,
    borderTopColor: '#F5EFEA',
  },
  rankCircle: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#EFEBE7',
    justifyContent: 'center',
    alignItems: 'center',
  },
  rankNum: { fontSize: 11, fontWeight: 'bold', color: '#3E2723' },
  rankProdName: { fontSize: 13, fontWeight: 'bold', color: '#3E2723' },
  rankProdStore: { fontSize: 11, color: '#8D6E63' },
  rankSoldCount: { fontSize: 12, fontWeight: 'bold', color: '#D84315' },
  warningItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF8E1',
    padding: 10,
    borderRadius: 8,
    marginBottom: 8,
  },
  warningTitle: { fontSize: 13, fontWeight: 'bold', color: '#E65100' },
  warningMsg: { fontSize: 12, color: '#3E2723', marginTop: 2 },
  warningMeta: { fontSize: 11, color: '#757575', marginTop: 4 },
  resolveBtn: {
    backgroundColor: '#2E7D32',
    paddingHorizontal: 10,
    paddingVertical: 7,
    borderRadius: 6,
    marginLeft: 8,
  },
  resolveBtnText: { color: '#FFF', fontSize: 11, fontWeight: 'bold' },
  adminPolicyBanner: {
    backgroundColor: '#E3F2FD',
    padding: 12,
    borderRadius: 10,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: '#90CAF9',
  },
  adminPolicyText: { fontSize: 12, color: '#0D47A1', lineHeight: 18 },
  label: { fontSize: 12, fontWeight: '600', color: '#4E342E', marginTop: 8, marginBottom: 4 },
  input: {
    backgroundColor: '#FAF7F5',
    borderWidth: 1,
    borderColor: '#E0D6CE',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 9,
    fontSize: 13,
  },
  chipRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginVertical: 4 },
  chip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    backgroundColor: '#EFEBE7',
  },
  chipActive: { backgroundColor: '#6F4E37' },
  chipText: { fontSize: 12, fontWeight: '600', color: '#4E342E' },
  twoColRow: { flexDirection: 'row', gap: 10 },
  toggleRow: { flexDirection: 'row', gap: 8, marginTop: 10 },
  toggleBtn: {
    flex: 1,
    paddingVertical: 9,
    paddingHorizontal: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#D7CCC8',
    alignItems: 'center',
    backgroundColor: '#FAF7F5',
  },
  toggleBtnActive: { backgroundColor: '#6F4E37', borderColor: '#6F4E37' },
  toggleBtnText: { fontSize: 11, fontWeight: 'bold', color: '#4E342E', textAlign: 'center' },
  formActionRow: { flexDirection: 'row', gap: 10, marginTop: 14 },
  saveBtn: {
    flex: 1,
    backgroundColor: '#D84315',
    paddingVertical: 12,
    borderRadius: 10,
    alignItems: 'center',
  },
  saveBtnText: { color: '#FFF', fontWeight: 'bold', fontSize: 13 },
  cancelEditBtn: {
    backgroundColor: '#EFEBE7',
    paddingHorizontal: 16,
    justifyContent: 'center',
    borderRadius: 10,
  },
  cancelEditText: { color: '#4E342E', fontWeight: 'bold', fontSize: 12 },
  prodRow: {
    flexDirection: 'row',
    paddingVertical: 10,
    borderTopWidth: 1,
    borderTopColor: '#F0EAE4',
  },
  prodThumb: { width: 64, height: 64, borderRadius: 8 },
  prodRowStore: { fontSize: 10, color: '#8D6E63', fontWeight: 'bold' },
  prodRowName: { fontSize: 14, fontWeight: 'bold', color: '#3E2723' },
  prodRowPrice: { fontSize: 12, color: '#D84315', fontWeight: '600', marginTop: 2 },
  prodControlBtns: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginTop: 6 },
  miniBtn: { paddingHorizontal: 9, paddingVertical: 5, borderRadius: 6 },
  orderAdminItem: {
    borderTopWidth: 1,
    borderTopColor: '#EFEBE7',
    paddingVertical: 12,
  },
  orderAdminHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  orderAdminCode: { fontSize: 14, fontWeight: 'bold', color: '#3E2723' },
  orderAdminStatus: { fontSize: 12, fontWeight: 'bold', color: '#D84315' },
  orderAdminMeta: { fontSize: 12, color: '#5D4037', marginTop: 2 },
  orderAdminFinance: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#2E7D32',
    marginTop: 6,
  },
  vendorOrderActionRow: { flexDirection: 'row', gap: 8, marginTop: 10 },
  cancelOrderSmallBtn: {
    backgroundColor: '#FFEBEE',
    paddingHorizontal: 14,
    justifyContent: 'center',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#FFCDD2',
  },
  cancelOrderSmallText: { color: '#C62828', fontWeight: 'bold', fontSize: 12 },
  lockedOrderHint: {
    fontSize: 11,
    color: '#757575',
    fontStyle: 'italic',
    marginTop: 6,
  },
  shipperRouteBox: {
    backgroundColor: '#FAF7F5',
    padding: 10,
    borderRadius: 8,
    marginVertical: 6,
    borderWidth: 1,
    borderColor: '#EFEBE7',
  },
  routeLine: { fontSize: 13, color: '#3E2723' },
  routeAddr: { fontSize: 12, color: '#5D4037', marginLeft: 20, marginTop: 2 },
  routeNote: { fontSize: 12, color: '#D84315', marginLeft: 20, marginTop: 4 },
  boldText: { fontWeight: 'bold' },
  voucherRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 10,
    borderTopWidth: 1,
    borderTopColor: '#EFEBE7',
  },
  voucherScopeTag: { fontSize: 10, fontWeight: 'bold', color: '#6A1B9A' },
  voucherRowCode: { fontSize: 14, fontWeight: 'bold', color: '#E65100', marginTop: 2 },
  voucherRowTitle: { fontSize: 12, color: '#3E2723', marginTop: 2 },
  voucherRowMeta: { fontSize: 11, color: '#757575', marginTop: 2 },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalCard: {
    width: '100%',
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: 18,
  },
  modalTitle: { fontSize: 16, fontWeight: 'bold', color: '#3E2723' },
  modalSub: { fontSize: 12, color: '#616161', marginTop: 4, marginBottom: 12 },
  modalInput: {
    backgroundColor: '#FAF7F5',
    borderWidth: 1,
    borderColor: '#D7CCC8',
    borderRadius: 8,
    padding: 10,
    minHeight: 80,
    textAlignVertical: 'top',
    fontSize: 13,
  },
  modalActionRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 10,
    marginTop: 14,
  },
  modalCancelBtn: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 8,
    backgroundColor: '#EFEBE7',
  },
  modalCancelText: { color: '#4E342E', fontWeight: 'bold', fontSize: 13 },
  modalConfirmBtn: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 8,
    backgroundColor: '#E65100',
  },
  modalConfirmText: { color: '#FFF', fontWeight: 'bold', fontSize: 13 },
});