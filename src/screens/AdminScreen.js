import React, { useState, useMemo, useCallback } from 'react';
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
  RefreshControl,
} from 'react-native';
import { useApp } from '../context/AppContext';
import { CATEGORIES } from '../constants/data';

export default function AdminScreen({ navigation }) {
  const {
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
    fetchAllData,
  } = useApp();

  const role = currentUser?.role || 'customer';
  const isAdmin = role === 'admin';
  const isVendor = role === 'vendor';
  const isShipper = role === 'shipper';
  const vendorStoreId = currentUser?.store?.id || 1;

  const [activeTab, setActiveTab] = useState('stats');
  const [shipperTab, setShipperTab] = useState('available');
  const [refreshing, setRefreshing] = useState(false);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await fetchAllData();
    setRefreshing(false);
  }, [fetchAllData]);

  const [editingProdId, setEditingProdId] = useState(0);
  const [prodName, setProdName] = useState('');
  const [prodCategory, setProdCategory] = useState('Trà sữa');
  const [prodBasePrice, setProdBasePrice] = useState('');
  const [prodDiscountPrice, setProdDiscountPrice] = useState('0');
  const [prodImage, setProdImage] = useState('');
  const [prodDesc, setProdDesc] = useState('');
  const [prodBestSeller, setProdBestSeller] = useState(false);
  const [prodAvailable, setProdAvailable] = useState(true);

  const [warnModalVisible, setWarnModalVisible] = useState(false);
  const [warnTargetProduct, setWarnTargetProduct] = useState(null);
  const [warnMode, setWarnMode] = useState('warn');
  const [warnMessage, setWarnMessage] = useState('');

  const [editingVoucherId, setEditingVoucherId] = useState(0);
  const [vCode, setVCode] = useState('');
  const [vTitle, setVTitle] = useState('');
  const [vType, setVType] = useState('fixed');
  const [vValue, setVValue] = useState('');
  const [vMinOrder, setVMinOrder] = useState('40000');
  const [vMaxDiscount, setVMaxDiscount] = useState('15000');
  const [vActive, setVActive] = useState(true);

  const formatCurrency = (val) => `${Number(val || 0).toLocaleString('vi-VN')}đ`;

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

  const shipperAvailableOrders = useMemo(() => {
    return orders.filter((o) => o.status === 'Chờ tài xế nhận');
  }, [orders]);

  const shipperMyOrders = useMemo(() => {
    return orders.filter((o) => o.shipper_username === currentUser?.username);
  }, [orders, currentUser]);

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

  if (isShipper) {
    const handleAcceptDelivery = async (orderCode) => {
      const res = await updateOrderStatus(orderCode, 'Đang giao hàng', {
        username: currentUser.username,
        fullName: currentUser.fullName,
      });
      if (res.success) {
        Alert.alert('Đã nhận đơn', `Bạn đã nhận đơn #${orderCode}.`);
        setShipperTab('my_deliveries');
      } else {
        Alert.alert('Lỗi', res.message);
      }
    };

    const handleCompleteDelivery = (orderCode) => {
      Alert.alert(
        'Xác nhận giao hàng',
        `Đã giao đơn #${orderCode} và hoàn tất thu tiền?`,
        [
          { text: 'Chưa', style: 'cancel' },
          {
            text: 'Đã giao xong',
            onPress: async () => {
              const res = await updateOrderStatus(orderCode, 'Hoàn tất');
              if (res.success) {
                Alert.alert('Thành công', `Đơn #${orderCode} đã hoàn tất.`);
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
        <View style={[styles.roleHeader, { backgroundColor: '#0D47A1' }]}>
          <View style={{ flex: 1 }}>
            <Text style={styles.roleHeaderTitle}>
              🛵 TÀI XẾ: {currentUser.fullName}
            </Text>
            <Text style={styles.roleHeaderSub}>
              Nhận và điều phối đơn giao hàng
            </Text>
          </View>

          <TouchableOpacity
            style={styles.profileShortcutBtn}
            onPress={() => navigation.navigate('Profile')}
          >
            <Text style={styles.profileShortcutText}>Hồ sơ</Text>
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
              Đơn chờ nhận ({shipperAvailableOrders.length})
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
              Đơn của tôi ({shipperMyOrders.length})
            </Text>
          </TouchableOpacity>
        </View>

        <ScrollView
          contentContainerStyle={styles.scrollContent}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={['#0D47A1']} />
          }
        >
          {listToShow.length === 0 ? (
            <View style={styles.card}>
              <Text style={{ textAlign: 'center', color: '#757575', padding: 20 }}>
                {shipperTab === 'available'
                  ? 'Hiện chưa có đơn hàng chờ nhận.'
                  : 'Bạn chưa nhận đơn nào.'}
              </Text>
            </View>
          ) : (
            listToShow.map((ord) => (
              <View key={ord.orderCode} style={styles.card}>
                <View style={styles.orderAdminHeader}>
                  <Text style={styles.orderAdminCode}>#{ord.orderCode}</Text>
                  <Text style={styles.orderAdminStatus}>{ord.status}</Text>
                </View>

                <View style={styles.shipperRouteBox}>
                  <Text style={styles.routeLine}>
                    Lấy tại: <Text style={styles.boldText}>{ord.storeName || `Quán #${ord.store_id}`}</Text>
                  </Text>
                  <Text style={[styles.routeLine, { marginTop: 4 }]}>
                    Giao tới: <Text style={styles.boldText}>{ord.customerName} ({ord.phone})</Text>
                  </Text>
                  <Text style={styles.routeAddr}>{ord.address}</Text>
                  {ord.note ? (
                    <Text style={styles.routeNote}>Ghi chú: {ord.note}</Text>
                  ) : null}
                </View>

                <Text style={styles.orderAdminFinance}>
                  Thu khách:{' '}
                  {ord.paymentMethod?.includes('QR') ||
                  ord.paymentStatus?.includes('QR')
                    ? `0đ (${ord.paymentStatus})`
                    : `${formatCurrency(ord.totalAmount)} (Tiền mặt)`}
                </Text>

                {ord.status === 'Chờ tài xế nhận' && (
                  <TouchableOpacity
                    style={[styles.saveBtn, { backgroundColor: '#1565C0', marginTop: 10 }]}
                    onPress={() => handleAcceptDelivery(ord.orderCode)}
                  >
                    <Text style={styles.saveBtnText}>NHẬN GIAO ĐƠN NÀY</Text>
                  </TouchableOpacity>
                )}

                {ord.status === 'Đang giao hàng' &&
                  ord.shipper_username === currentUser.username && (
                    <TouchableOpacity
                      style={[styles.saveBtn, { backgroundColor: '#2E7D32', marginTop: 10 }]}
                      onPress={() => handleCompleteDelivery(ord.orderCode)}
                    >
                      <Text style={styles.saveBtnText}>XÁC NHẬN ĐÃ GIAO XONG</Text>
                    </TouchableOpacity>
                  )}
              </View>
            ))
          )}
        </ScrollView>
      </View>
    );
  }

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
    Alert.alert('Xóa món', `Xác nhận xóa món "${name}" khỏi thực đơn?`, [
      { text: 'Hủy', style: 'cancel' },
      {
        text: 'Xóa',
        style: 'destructive',
        onPress: async () => {
          const res = await deleteProduct(id);
          if (res.success) Alert.alert('Đã xóa', res.message);
        },
      },
    ]);
  };

  const openAdminActionModal = (productItem, mode) => {
    setWarnTargetProduct(productItem);
    setWarnMode(mode);
    setWarnMessage('');
    setWarnModalVisible(true);
  };

  const handleConfirmAdminWarningOrDelete = async () => {
    if (!warnMessage.trim()) {
      Alert.alert('Thiếu thông tin', 'Vui lòng nhập lý do!');
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
        Alert.alert('Đã gỡ món', `Đã xóa món "${warnTargetProduct.name}".`);
      } else {
        Alert.alert('Lỗi', res.message);
      }
    }
  };

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
      Alert.alert('Thiếu thông tin', 'Vui lòng nhập Mã code, Mô tả và Mức giảm!');
      return;
    }

    const res = await saveVoucher({
      id: editingVoucherId,
      store_id: isVendor ? vendorStoreId : null,
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
    Alert.alert('Xóa voucher', `Xác nhận xóa mã ${code}?`, [
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

  return (
    <View style={styles.container}>
      <View style={styles.roleHeader}>
        <View style={{ flex: 1 }}>
          <Text style={styles.roleHeaderTitle}>
            {isAdmin
              ? 'BẢNG QUẢN TRỊ NỀN TẢNG'
              : `GIAN HÀNG: ${currentUser?.store?.storeName || 'Cửa hàng'}`}
          </Text>
          <Text style={styles.roleHeaderSub}>
            {isAdmin ? 'Giám sát chiết khấu 10% & duyệt thực đơn' : 'Quản lý thực đơn & điều phối đơn hàng'}
          </Text>
        </View>

        <TouchableOpacity
          style={styles.profileShortcutBtn}
          onPress={() => navigation.navigate('Profile')}
        >
          <Text style={styles.profileShortcutText}>Hồ sơ</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.tabBar}>
        <TouchableOpacity
          style={[styles.tabItem, activeTab === 'stats' && styles.tabItemActive]}
          onPress={() => setActiveTab('stats')}
        >
          <Text style={[styles.tabText, activeTab === 'stats' && styles.tabTextActive]}>
            Doanh thu
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.tabItem, activeTab === 'products' && styles.tabItemActive]}
          onPress={() => setActiveTab('products')}
        >
          <Text style={[styles.tabText, activeTab === 'products' && styles.tabTextActive]}>
            Thực đơn
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.tabItem, activeTab === 'orders' && styles.tabItemActive]}
          onPress={() => setActiveTab('orders')}
        >
          <Text style={[styles.tabText, activeTab === 'orders' && styles.tabTextActive]}>
            Đơn hàng ({managedOrders.length})
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.tabItem, activeTab === 'vouchers' && styles.tabItemActive]}
          onPress={() => setActiveTab('vouchers')}
        >
          <Text style={[styles.tabText, activeTab === 'vouchers' && styles.tabTextActive]}>
            Voucher ({managedVouchers.length})
          </Text>
        </TouchableOpacity>
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={['#D84315']} />
        }
      >
        {activeTab === 'stats' && (
          <View>
            <View style={styles.statsGrid}>
              <View style={[styles.statBox, { backgroundColor: '#E3F2FD' }]}>
                <Text style={styles.statLabel}>Tổng giá trị đơn</Text>
                <Text style={[styles.statVal, { color: '#1565C0' }]}>
                  {formatCurrency(analytics.totalGMV)}
                </Text>
                <Text style={styles.statSub}>
                  {analytics.totalOrdersCount} đơn • {analytics.completedCount} hoàn tất
                </Text>
              </View>

              <View style={[styles.statBox, { backgroundColor: '#FCE4EC' }]}>
                <Text style={styles.statLabel}>
                  {isAdmin ? 'Phí hoa hồng sàn (10%)' : 'Phí chiết khấu nộp sàn (10%)'}
                </Text>
                <Text style={[styles.statVal, { color: '#C2185B' }]}>
                  {formatCurrency(analytics.totalPlatformFee)}
                </Text>
              </View>

              <View style={[styles.statBox, { backgroundColor: '#E8F5E9' }]}>
                <Text style={styles.statLabel}>Doanh thu thực nhận của quán (90%)</Text>
                <Text style={[styles.statVal, { color: '#2E7D32' }]}>
                  {formatCurrency(analytics.vendorNetRevenue)}
                </Text>
              </View>
            </View>

            {isAdmin && (
              <View style={styles.card}>
                <Text style={styles.sectionTitle}>Báo cáo theo cửa hàng</Text>
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
                        <Text style={styles.storeStatName}>{st.storeName}</Text>
                        <Text style={styles.storeStatSub}>
                          {stOrders.length} đơn • Doanh số: {formatCurrency(stGMV)}
                        </Text>
                      </View>
                      <View style={{ alignItems: 'flex-end' }}>
                        <Text style={styles.storeFeeLabel}>Phí sàn (10%)</Text>
                        <Text style={styles.storeFeeValue}>+{formatCurrency(stFee)}</Text>
                      </View>
                    </View>
                  );
                })}
              </View>
            )}

            <View style={styles.card}>
              <Text style={styles.sectionTitle}>Xếp hạng món bán chạy</Text>
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
                    <Text style={styles.rankProdStore}>{item.storeName}</Text>
                  </View>
                  <Text style={styles.rankSoldCount}>{item.soldCount || 0} đã bán</Text>
                </View>
              ))}
            </View>
          </View>
        )}

        {activeTab === 'products' && (
          <View>
            {storeWarnings.length > 0 && (
              <View style={[styles.card, { borderColor: '#FFB300', borderWidth: 1.5 }]}>
                <Text style={[styles.sectionTitle, { color: '#D84315' }]}>
                  Thông báo cảnh cáo ({storeWarnings.length})
                </Text>
                {storeWarnings.map((w) => (
                  <View key={w.id} style={styles.warningItem}>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.warningTitle}>Món: {w.product_name}</Text>
                      <Text style={styles.warningMsg}>{w.message}</Text>
                      <Text style={styles.warningMeta}>
                        {w.isResolved ? 'Đã khắc phục' : 'Chưa xử lý'}
                      </Text>
                    </View>

                    {isVendor && !w.isResolved && (
                      <TouchableOpacity
                        style={styles.resolveBtn}
                        onPress={() => resolveStoreWarning(w.id)}
                      >
                        <Text style={styles.resolveBtnText}>Đã sửa</Text>
                      </TouchableOpacity>
                    )}
                  </View>
                ))}
              </View>
            )}

            {isVendor && (
              <View style={styles.card}>
                <Text style={styles.sectionTitle}>
                  {editingProdId > 0 ? `Sửa món #${editingProdId}` : 'Thêm món mới'}
                </Text>

                <Text style={styles.label}>Tên món</Text>
                <TextInput
                  style={styles.input}
                  placeholder="Nhập tên món..."
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
                    <Text style={styles.label}>Giá gốc</Text>
                    <TextInput
                      style={styles.input}
                      placeholder="45000"
                      keyboardType="numeric"
                      value={prodBasePrice}
                      onChangeText={setProdBasePrice}
                    />
                  </View>

                  <View style={{ flex: 1 }}>
                    <Text style={styles.label}>Giá khuyến mãi</Text>
                    <TextInput
                      style={styles.input}
                      placeholder="0"
                      keyboardType="numeric"
                      value={prodDiscountPrice}
                      onChangeText={setProdDiscountPrice}
                    />
                  </View>
                </View>

                <Text style={styles.label}>Link ảnh</Text>
                <TextInput
                  style={styles.input}
                  placeholder="https://..."
                  value={prodImage}
                  onChangeText={setProdImage}
                />

                <Text style={styles.label}>Mô tả</Text>
                <TextInput
                  style={styles.input}
                  placeholder="Mô tả món nước..."
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
                      {prodBestSeller ? '☑️ Món nổi bật' : '⬜ Món nổi bật'}
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
                      {prodAvailable ? 'Còn món' : 'Hết hàng'}
                    </Text>
                  </TouchableOpacity>
                </View>

                <View style={styles.formActionRow}>
                  <TouchableOpacity style={styles.saveBtn} onPress={handleSaveProduct}>
                    <Text style={styles.saveBtnText}>
                      {editingProdId > 0 ? 'LƯU CẬP NHẬT' : 'THÊM MÓN'}
                    </Text>
                  </TouchableOpacity>

                  {editingProdId > 0 && (
                    <TouchableOpacity
                      style={styles.cancelEditBtn}
                      onPress={resetProductForm}
                    >
                      <Text style={styles.cancelEditText}>Hủy</Text>
                    </TouchableOpacity>
                  )}
                </View>
              </View>
            )}

            <View style={styles.card}>
              <Text style={styles.sectionTitle}>
                Danh sách món ({managedProducts.length})
              </Text>
              {managedProducts.map((item) => (
                <View key={item.id} style={styles.prodRow}>
                  <Image source={{ uri: item.image }} style={styles.prodThumb} />
                  <View style={{ flex: 1, marginLeft: 10 }}>
                    <Text style={styles.prodRowStore}>{item.storeName}</Text>
                    <Text style={styles.prodRowName}>{item.name}</Text>
                    <Text style={styles.prodRowPrice}>
                      {formatCurrency(item.discountPrice > 0 ? item.discountPrice : item.basePrice)}
                    </Text>

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
                            {item.isAvailable ? 'Còn món' : 'Hết món'}
                          </Text>
                        </TouchableOpacity>

                        <TouchableOpacity
                          style={[styles.miniBtn, { backgroundColor: '#E3F2FD' }]}
                          onPress={() => handleEditProductClick(item)}
                        >
                          <Text
                            style={{ fontSize: 11, fontWeight: 'bold', color: '#1565C0' }}
                          >
                            Sửa
                          </Text>
                        </TouchableOpacity>

                        <TouchableOpacity
                          style={[styles.miniBtn, { backgroundColor: '#FFEBEE' }]}
                          onPress={() => handleVendorDeleteProduct(item.id, item.name)}
                        >
                          <Text
                            style={{ fontSize: 11, fontWeight: 'bold', color: '#C62828' }}
                          >
                            Xóa
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
                            Cảnh cáo
                          </Text>
                        </TouchableOpacity>

                        <TouchableOpacity
                          style={[styles.miniBtn, { backgroundColor: '#FFEBEE' }]}
                          onPress={() => openAdminActionModal(item, 'delete')}
                        >
                          <Text
                            style={{ fontSize: 11, fontWeight: 'bold', color: '#C62828' }}
                          >
                            Gỡ món
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

        {activeTab === 'orders' && (
          <View style={styles.card}>
            <Text style={styles.sectionTitle}>
              Danh sách đơn hàng ({managedOrders.length})
            </Text>

            {managedOrders.map((ord) => (
              <View key={ord.orderCode} style={styles.orderAdminItem}>
                <View style={styles.orderAdminHeader}>
                  <Text style={styles.orderAdminCode}>
                    #{ord.orderCode} • {ord.storeName}
                  </Text>
                  <Text style={styles.orderAdminStatus}>{ord.status}</Text>
                </View>

                <Text style={styles.orderAdminMeta}>
                  Khách: {ord.customerName} ({ord.phone})
                </Text>
                <Text style={styles.orderAdminMeta}>Địa chỉ: {ord.address}</Text>
                <Text style={styles.orderAdminMeta}>
                  Thanh toán: {ord.paymentStatus || ord.paymentMethod}
                </Text>
                {ord.shipperName && (
                  <Text style={[styles.orderAdminMeta, { color: '#1565C0', fontWeight: 'bold' }]}>
                    Tài xế: {ord.shipperName}
                  </Text>
                )}
                <Text style={styles.orderAdminFinance}>
                  Tổng đơn: {formatCurrency(ord.totalAmount)}
                </Text>

                {isVendor && ord.status === 'Đang chuẩn bị' && (
                  <View style={styles.vendorOrderActionRow}>
                    <TouchableOpacity
                      style={[styles.saveBtn, { backgroundColor: '#2E7D32' }]}
                      onPress={() =>
                        updateOrderStatus(ord.orderCode, 'Chờ tài xế nhận')
                      }
                    >
                      <Text style={styles.saveBtnText}>
                        Đã xong món • Gọi tài xế
                      </Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                      style={styles.cancelOrderSmallBtn}
                      onPress={() => updateOrderStatus(ord.orderCode, 'Đã hủy')}
                    >
                      <Text style={styles.cancelOrderSmallText}>Hủy</Text>
                    </TouchableOpacity>
                  </View>
                )}
              </View>
            ))}
          </View>
        )}

        {activeTab === 'vouchers' && (
          <View>
            <View style={styles.card}>
              <Text style={styles.sectionTitle}>
                {editingVoucherId > 0
                  ? `Sửa Voucher #${editingVoucherId}`
                  : isAdmin
                  ? 'Tạo Voucher toàn sàn'
                  : 'Tạo Voucher của quán'}
              </Text>

              <Text style={styles.label}>Mã Voucher</Text>
              <TextInput
                style={styles.input}
                placeholder="VD: GIAM15K"
                value={vCode}
                onChangeText={setVCode}
                autoCapitalize="characters"
              />

              <Text style={styles.label}>Mô tả chương trình</Text>
              <TextInput
                style={styles.input}
                placeholder="VD: Giảm 15.000đ cho đơn từ 50.000đ"
                value={vTitle}
                onChangeText={setVTitle}
              />

              <Text style={styles.label}>Loại giảm</Text>
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
                    Số tiền cố định
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
                    Phần trăm (%)
                  </Text>
                </TouchableOpacity>
              </View>

              <View style={styles.twoColRow}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.label}>
                    {vType === 'fixed' ? 'Số tiền giảm' : 'Phần trăm giảm'}
                  </Text>
                  <TextInput
                    style={styles.input}
                    placeholder={vType === 'fixed' ? '15000' : '15'}
                    keyboardType="numeric"
                    value={vValue}
                    onChangeText={setVValue}
                  />
                </View>

                <View style={{ flex: 1 }}>
                  <Text style={styles.label}>Đơn tối thiểu</Text>
                  <TextInput
                    style={styles.input}
                    placeholder="50000"
                    keyboardType="numeric"
                    value={vMinOrder}
                    onChangeText={setVMinOrder}
                  />
                </View>
              </View>

              <View style={styles.formActionRow}>
                <TouchableOpacity style={styles.saveBtn} onPress={handleSaveVoucher}>
                  <Text style={styles.saveBtnText}>
                    {editingVoucherId > 0 ? 'LƯU THAY ĐỔI' : 'PHÁT HÀNH VOUCHER'}
                  </Text>
                </TouchableOpacity>

                {editingVoucherId > 0 && (
                  <TouchableOpacity
                    style={styles.cancelEditBtn}
                    onPress={resetVoucherForm}
                  >
                    <Text style={styles.cancelEditText}>Hủy</Text>
                  </TouchableOpacity>
                )}
              </View>
            </View>

            <View style={styles.card}>
              <Text style={styles.sectionTitle}>
                Danh sách mã ({managedVouchers.length})
              </Text>
              {managedVouchers.map((v) => (
                <View key={v.id || v.code} style={styles.voucherRow}>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.voucherScopeTag}>
                      {v.store_id ? v.storeName : 'Toàn sàn'}
                    </Text>
                    <Text style={styles.voucherRowCode}>{v.code}</Text>
                    <Text style={styles.voucherRowTitle}>{v.title}</Text>
                    <Text style={styles.voucherRowMeta}>
                      Đơn tối thiểu: {formatCurrency(v.minOrder)}
                    </Text>
                  </View>

                  <View style={{ gap: 6 }}>
                    <TouchableOpacity
                      style={[styles.miniBtn, { backgroundColor: '#E3F2FD' }]}
                      onPress={() => handleEditVoucherClick(v)}
                    >
                      <Text style={{ fontSize: 11, fontWeight: 'bold', color: '#1565C0' }}>
                        Sửa
                      </Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                      style={[styles.miniBtn, { backgroundColor: '#FFEBEE' }]}
                      onPress={() => handleDeleteVoucher(v.id, v.code)}
                    >
                      <Text style={{ fontSize: 11, fontWeight: 'bold', color: '#C62828' }}>
                        Xóa
                      </Text>
                    </TouchableOpacity>
                  </View>
                </View>
              ))}
            </View>
          </View>
        )}
      </ScrollView>

      <Modal
        visible={warnModalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setWarnModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>
              {warnMode === 'warn' ? 'Gửi cảnh cáo quán' : 'Gỡ món vi phạm'}
            </Text>
            <Text style={styles.modalSub}>
              Món: {warnTargetProduct?.name} ({warnTargetProduct?.storeName})
            </Text>

            <TextInput
              style={styles.modalInput}
              placeholder="Nhập lý do cảnh cáo..."
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
                  {warnMode === 'warn' ? 'Xác nhận' : 'Gỡ món'}
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
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  roleHeaderTitle: { color: '#FFD54F', fontSize: 13, fontWeight: 'bold' },
  roleHeaderSub: { color: '#EFEBE7', fontSize: 11, marginTop: 2 },
  profileShortcutBtn: {
    backgroundColor: 'rgba(255,255,255,0.2)',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
  },
  profileShortcutText: { color: '#FFF', fontSize: 12, fontWeight: 'bold' },
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
  statBox: { padding: 12, borderRadius: 10 },
  statLabel: { fontSize: 12, fontWeight: 'bold', color: '#4E342E' },
  statVal: { fontSize: 18, fontWeight: 'bold', marginTop: 4 },
  statSub: { fontSize: 11, color: '#616161', marginTop: 2 },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 14,
    marginBottom: 12,
    elevation: 2,
  },
  sectionTitle: { fontSize: 14, fontWeight: 'bold', color: '#3E2723', marginBottom: 10 },
  storeStatRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 8,
    borderTopWidth: 1,
    borderTopColor: '#F0EAE4',
  },
  storeStatName: { fontSize: 13, fontWeight: 'bold', color: '#3E2723' },
  storeStatSub: { fontSize: 11, color: '#757575', marginTop: 2 },
  storeFeeLabel: { fontSize: 10, color: '#8D6E63' },
  storeFeeValue: { fontSize: 13, fontWeight: 'bold', color: '#C2185B' },
  rankRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    borderTopWidth: 1,
    borderTopColor: '#F5EFEA',
  },
  rankCircle: {
    width: 26,
    height: 26,
    borderRadius: 13,
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
  warningTitle: { fontSize: 12, fontWeight: 'bold', color: '#E65100' },
  warningMsg: { fontSize: 12, color: '#3E2723', marginTop: 2 },
  warningMeta: { fontSize: 10, color: '#757575', marginTop: 4 },
  resolveBtn: {
    backgroundColor: '#2E7D32',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 6,
    marginLeft: 8,
  },
  resolveBtnText: { color: '#FFF', fontSize: 11, fontWeight: 'bold' },
  label: { fontSize: 12, fontWeight: '600', color: '#4E342E', marginTop: 6, marginBottom: 2 },
  input: {
    backgroundColor: '#FAF7F5',
    borderWidth: 1,
    borderColor: '#E0D6CE',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    fontSize: 13,
  },
  chipRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginVertical: 4 },
  chip: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 6,
    backgroundColor: '#EFEBE7',
  },
  chipActive: { backgroundColor: '#6F4E37' },
  chipText: { fontSize: 12, fontWeight: '600', color: '#4E342E' },
  twoColRow: { flexDirection: 'row', gap: 10 },
  toggleRow: { flexDirection: 'row', gap: 8, marginTop: 8 },
  toggleBtn: {
    flex: 1,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#D7CCC8',
    alignItems: 'center',
    backgroundColor: '#FAF7F5',
  },
  toggleBtnActive: { backgroundColor: '#6F4E37', borderColor: '#6F4E37' },
  toggleBtnText: { fontSize: 11, fontWeight: 'bold', color: '#4E342E' },
  formActionRow: { flexDirection: 'row', gap: 10, marginTop: 12 },
  saveBtn: {
    flex: 1,
    backgroundColor: '#D84315',
    paddingVertical: 10,
    borderRadius: 8,
    alignItems: 'center',
  },
  saveBtnText: { color: '#FFF', fontWeight: 'bold', fontSize: 13 },
  cancelEditBtn: {
    backgroundColor: '#EFEBE7',
    paddingHorizontal: 16,
    justifyContent: 'center',
    borderRadius: 8,
  },
  cancelEditText: { color: '#4E342E', fontWeight: 'bold', fontSize: 12 },
  prodRow: {
    flexDirection: 'row',
    paddingVertical: 10,
    borderTopWidth: 1,
    borderTopColor: '#F0EAE4',
  },
  prodThumb: { width: 56, height: 56, borderRadius: 8 },
  prodRowStore: { fontSize: 10, color: '#8D6E63', fontWeight: 'bold' },
  prodRowName: { fontSize: 13, fontWeight: 'bold', color: '#3E2723' },
  prodRowPrice: { fontSize: 12, color: '#D84315', fontWeight: '600', marginTop: 2 },
  prodControlBtns: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginTop: 6 },
  miniBtn: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6 },
  orderAdminItem: {
    borderTopWidth: 1,
    borderTopColor: '#EFEBE7',
    paddingVertical: 10,
  },
  orderAdminHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  orderAdminCode: { fontSize: 13, fontWeight: 'bold', color: '#3E2723' },
  orderAdminStatus: { fontSize: 12, fontWeight: 'bold', color: '#D84315' },
  orderAdminMeta: { fontSize: 12, color: '#5D4037', marginTop: 2 },
  orderAdminFinance: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#2E7D32',
    marginTop: 4,
  },
  vendorOrderActionRow: { flexDirection: 'row', gap: 8, marginTop: 8 },
  cancelOrderSmallBtn: {
    backgroundColor: '#FFEBEE',
    paddingHorizontal: 12,
    justifyContent: 'center',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#FFCDD2',
  },
  cancelOrderSmallText: { color: '#C62828', fontWeight: 'bold', fontSize: 12 },
  shipperRouteBox: {
    backgroundColor: '#FAF7F5',
    padding: 8,
    borderRadius: 8,
    marginVertical: 6,
    borderWidth: 1,
    borderColor: '#EFEBE7',
  },
  routeLine: { fontSize: 12, color: '#3E2723' },
  routeAddr: { fontSize: 11, color: '#5D4037', marginLeft: 16, marginTop: 2 },
  routeNote: { fontSize: 11, color: '#D84315', marginLeft: 16, marginTop: 2 },
  boldText: { fontWeight: 'bold' },
  voucherRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
    borderTopWidth: 1,
    borderTopColor: '#EFEBE7',
  },
  voucherScopeTag: { fontSize: 10, fontWeight: 'bold', color: '#6A1B9A' },
  voucherRowCode: { fontSize: 13, fontWeight: 'bold', color: '#E65100', marginTop: 1 },
  voucherRowTitle: { fontSize: 12, color: '#3E2723', marginTop: 1 },
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
    borderRadius: 12,
    padding: 16,
  },
  modalTitle: { fontSize: 15, fontWeight: 'bold', color: '#3E2723' },
  modalSub: { fontSize: 12, color: '#616161', marginTop: 2, marginBottom: 10 },
  modalInput: {
    backgroundColor: '#FAF7F5',
    borderWidth: 1,
    borderColor: '#D7CCC8',
    borderRadius: 8,
    padding: 8,
    minHeight: 70,
    textAlignVertical: 'top',
    fontSize: 13,
  },
  modalActionRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 8,
    marginTop: 12,
  },
  modalCancelBtn: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 8,
    backgroundColor: '#EFEBE7',
  },
  modalCancelText: { color: '#4E342E', fontWeight: 'bold', fontSize: 12 },
  modalConfirmBtn: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 8,
    backgroundColor: '#E65100',
  },
  modalConfirmText: { color: '#FFF', fontWeight: 'bold', fontSize: 12 },
});