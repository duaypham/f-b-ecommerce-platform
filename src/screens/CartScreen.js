import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Image,
  StyleSheet,
  Alert,
  ActivityIndicator,
  Modal,
  RefreshControl,
} from 'react-native';
import * as Location from 'expo-location';
import { useApp } from '../context/AppContext';
import { VIRTUAL_MAP_LOCATIONS } from '../constants/data';

export default function CartScreen({ navigation }) {
  const {
    currentUser,
    cart,
    vouchers,
    orders,
    updateCartQuantity,
    removeFromCart,
    clearCart,
    createOrder,
    fetchAllData,
  } = useApp();

  const [customerName, setCustomerName] = useState('');
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState('');
  const [note, setNote] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('COD');

  const [voucherInput, setVoucherInput] = useState('');
  const [appliedVoucher, setAppliedVoucher] = useState(null);

  const [loadingGps, setLoadingGps] = useState(false);
  const [showVirtualMap, setShowVirtualMap] = useState(false);
  const [submittingOrder, setSubmittingOrder] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  const [qrModalVisible, setQrModalVisible] = useState(false);
  const [qrSecondsLeft, setQrSecondsLeft] = useState(120);
  const [pendingOrderCode, setPendingOrderCode] = useState('');
  const [verifyingBank, setVerifyingBank] = useState(false);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await fetchAllData();
    setRefreshing(false);
  }, [fetchAllData]);

  useEffect(() => {
    if (currentUser) {
      setCustomerName(currentUser.fullName || '');
      setPhone(currentUser.phone || '');
      setAddress(currentUser.address || '');
    }
  }, [currentUser]);

  useEffect(() => {
    if (!qrModalVisible) return;

    if (qrSecondsLeft <= 0) {
      setQrModalVisible(false);
      Alert.alert(
        'Hết thời gian',
        'Phiên mã QR đã hết hạn. Vui lòng thanh toán lại!'
      );
      return;
    }

    const timer = setInterval(() => {
      setQrSecondsLeft((prev) => prev - 1);
    }, 1000);

    return () => clearInterval(timer);
  }, [qrModalVisible, qrSecondsLeft]);

  const formatCountdown = (secs) => {
    const mins = Math.floor(secs / 60);
    const remSecs = secs % 60;
    return `${mins < 10 ? '0' : ''}${mins}:${remSecs < 10 ? '0' : ''}${remSecs}`;
  };

  const subTotal = useMemo(() => {
    return cart.reduce((sum, item) => sum + item.totalPrice, 0);
  }, [cart]);

  const getEligibleSubTotalForVoucher = (voucher) => {
    if (!voucher) return 0;
    if (!voucher.store_id) return subTotal;
    return cart
      .filter((item) => Number(item.storeId) === Number(voucher.store_id))
      .reduce((sum, item) => sum + item.totalPrice, 0);
  };

  const usedVoucherCodes = useMemo(() => {
    if (!currentUser) return [];
    return orders
      .filter(
        (o) =>
          o.username === currentUser.username &&
          o.status !== 'Đã hủy' &&
          o.voucherCode
      )
      .map((o) => String(o.voucherCode).toUpperCase());
  }, [orders, currentUser]);

  const availableVouchersForCart = useMemo(() => {
    const storeIdsInCart = [...new Set(cart.map((item) => Number(item.storeId)))];

    return vouchers.filter((v) => {
      if (!v.isActive) return false;

      if (usedVoucherCodes.includes(String(v.code).toUpperCase())) {
        return false;
      }

      if (!v.store_id) return true;

      return storeIdsInCart.includes(Number(v.store_id));
    });
  }, [vouchers, cart, usedVoucherCodes]);

  const discountAmount = useMemo(() => {
    if (!appliedVoucher) return 0;
    const targetSubTotal = getEligibleSubTotalForVoucher(appliedVoucher);
    if (targetSubTotal < appliedVoucher.minOrder) return 0;

    if (appliedVoucher.type === 'fixed') {
      return Math.min(appliedVoucher.value, targetSubTotal);
    }
    if (appliedVoucher.type === 'percent') {
      const rawDiscount = Math.round((targetSubTotal * appliedVoucher.value) / 100);
      return appliedVoucher.maxDiscount > 0
        ? Math.min(rawDiscount, appliedVoucher.maxDiscount)
        : rawDiscount;
    }
    return 0;
  }, [appliedVoucher, subTotal, cart]);

  const totalAmount = Math.max(0, subTotal - discountAmount);
  const formatCurrency = (val) => `${Number(val || 0).toLocaleString('vi-VN')}đ`;

  const handleApplyVoucherCode = (codeToApply) => {
    const cleanCode = (codeToApply || voucherInput).trim().toUpperCase();
    if (!cleanCode) {
      Alert.alert('Thông báo', 'Vui lòng nhập mã giảm giá!');
      return;
    }

    // Chặn nếu tài khoản đã từng sử dụng mã này
    if (usedVoucherCodes.includes(cleanCode)) {
      Alert.alert(
        'Mã đã sử dụng',
        `Bạn đã dùng mã "${cleanCode}" ở đơn hàng trước. Mỗi tài khoản chỉ được sử dụng mỗi mã 1 lần!`
      );
      return;
    }

    const found = vouchers.find(
      (v) => v.code.toUpperCase() === cleanCode && v.isActive
    );

    if (!found) {
      Alert.alert('Không hợp lệ', 'Mã không tồn tại hoặc đã hết hạn!');
      return;
    }

    const eligibleAmount = getEligibleSubTotalForVoucher(found);

    if (found.store_id && eligibleAmount === 0) {
      Alert.alert(
        'Không khớp cửa hàng',
        `Mã này chỉ áp dụng cho các món của quán "${found.storeName || '#' + found.store_id}". Giỏ hàng của bạn hiện không có món nào của quán này!`
      );
      return;
    }

    if (eligibleAmount < found.minOrder) {
      Alert.alert(
        'Chưa đủ điều kiện',
        `Đơn tối thiểu từ ${formatCurrency(found.minOrder)}. Hiện tại mới đạt ${formatCurrency(eligibleAmount)}.`
      );
      return;
    }

    setAppliedVoucher(found);
    setVoucherInput(found.code);
    Alert.alert('Thành công', `Đã áp dụng mã: ${found.code}`);
  };

  const handleGetRealGPS = async () => {
    setLoadingGps(true);
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        setShowVirtualMap(true);
        setLoadingGps(false);
        return;
      }

      const loc = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,
      });
      const { latitude, longitude } = loc.coords;

      const geo = await Location.reverseGeocodeAsync({ latitude, longitude });
      if (geo && geo.length > 0) {
        const place = geo[0];
        const formatted = [
          place.name || place.streetNumber,
          place.street,
          place.subregion || place.district,
          place.city || place.region,
        ]
          .filter(Boolean)
          .join(', ');

        setAddress(formatted || `Tọa độ (${latitude.toFixed(4)}, ${longitude.toFixed(4)})`);
      } else {
        setAddress(`Tọa độ (${latitude.toFixed(5)}, ${longitude.toFixed(5)})`);
      }
    } catch (error) {
      setShowVirtualMap(true);
    } finally {
      setLoadingGps(false);
    }
  };

  const submitFinalOrderToServer = async (generatedCode, paymentStatusLabel) => {
    const primaryStoreId = cart[0]?.storeId || 1;

    setSubmittingOrder(true);
    const res = await createOrder({
      orderCode: generatedCode,
      store_id: primaryStoreId,
      username: currentUser.username,
      customerName: customerName.trim(),
      phone: phone.trim(),
      address: address.trim(),
      note: note.trim(),
      paymentMethod,
      paymentStatus: paymentStatusLabel,
      voucherCode: appliedVoucher && discountAmount > 0 ? appliedVoucher.code : null,
      subTotal,
      discountAmount,
      totalAmount,
      items: cart,
    });
    setSubmittingOrder(false);

    if (res.success) {
      setAppliedVoucher(null);
      setVoucherInput('');
      Alert.alert(
        'Đặt hàng thành công',
        `Mã đơn: #${res.orderCode}\nCửa hàng đang chuẩn bị món cho bạn!`,
        [
          {
            text: 'Xem đơn hàng',
            onPress: () => navigation.replace('OrderHistory'),
          },
        ]
      );
    } else {
      Alert.alert('Lỗi', res.message);
    }
  };

  const handleCheckoutPress = async () => {
    if (cart.length === 0) {
      Alert.alert('Giỏ hàng trống', 'Vui lòng chọn món trước!');
      return;
    }

    if (!currentUser) {
      Alert.alert(
        'Yêu cầu đăng nhập',
        'Vui lòng đăng nhập để hoàn tất đặt đơn!',
        [
          { text: 'Hủy', style: 'cancel' },
          {
            text: 'Đăng nhập',
            onPress: () => navigation.navigate('Login', { redirectTo: 'Cart' }),
          },
        ]
      );
      return;
    }

    if (!customerName.trim() || !phone.trim() || !address.trim()) {
      Alert.alert(
        'Thiếu thông tin',
        'Vui lòng nhập đầy đủ Họ tên, Số điện thoại và Địa chỉ nhận hàng!'
      );
      return;
    }

    const tempOrderCode = 'ORD' + Math.floor(100000 + Math.random() * 900000);

    if (paymentMethod === 'Chuyển khoản QR') {
      setPendingOrderCode(tempOrderCode);
      setQrSecondsLeft(120);
      setQrModalVisible(true);
      return;
    }

    await submitFinalOrderToServer(tempOrderCode, 'Thanh toán tiền mặt (COD)');
  };

  const handleConfirmQrPaymentSuccess = () => {
    setVerifyingBank(true);
    setTimeout(async () => {
      setVerifyingBank(false);
      setQrModalVisible(false);
      await submitFinalOrderToServer(
        pendingOrderCode,
        'Đã thanh toán qua QR'
      );
    }, 1200);
  };

  const vietQrImageUrl = useMemo(() => {
    const addInfo = encodeURIComponent(`THANHTOAN ${pendingOrderCode}`);
    const accName = encodeURIComponent('SAN FB TRA SUA BIEN HOA');
    return `https://img.vietqr.io/image/MB-0987654321-compact2.png?amount=${totalAmount}&addInfo=${addInfo}&accountName=${accName}`;
  }, [totalAmount, pendingOrderCode]);

  // XỬ LÝ KHI GIỎ HÀNG TRỐNG
  if (cart.length === 0) {
    return (
      <View style={styles.emptyContainer}>
        <Text style={styles.emptyEmoji}>🛒</Text>
        <Text style={styles.emptyTitle}>Giỏ hàng đang trống</Text>
        <Text style={styles.emptySub}>
          Chọn thêm món trà sữa hoặc cà phê bạn thích nhé!
        </Text>
        <TouchableOpacity
          style={styles.goHomeBtn}
          onPress={() => {
            if (navigation.canGoBack()) {
              navigation.popToTop(); // Xả sạch stack và quay về Home gốc
            } else {
              navigation.replace('Home');
            }
          }}
        >
          <Text style={styles.goHomeBtnText}>KHÁM PHÁ MENU</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={['#6F4E37']} />
        }
      >
        <View style={styles.sectionCard}>
          <View style={styles.sectionHeaderRow}>
            <Text style={styles.sectionTitle}>Món đã chọn ({cart.length})</Text>
            <TouchableOpacity onPress={clearCart}>
              <Text style={styles.clearAllText}>Xóa tất cả</Text>
            </TouchableOpacity>
          </View>

          {cart.map((item) => (
            <View key={item.cartItemId} style={styles.cartItem}>
              <Image source={{ uri: item.image }} style={styles.itemImg} />
              <View style={styles.itemInfo}>
                <Text style={styles.itemStore}>{item.storeName}</Text>
                <Text style={styles.itemName}>{item.name}</Text>
                <Text style={styles.itemOptions}>
                  Size {item.size} • {item.sugar} đường • {item.ice}
                </Text>
                {item.toppings && item.toppings.length > 0 && (
                  <Text style={styles.itemToppings}>
                    + {item.toppings.join(', ')}
                  </Text>
                )}

                <View style={styles.itemBottomRow}>
                  <Text style={styles.itemTotalPrice}>
                    {formatCurrency(item.totalPrice)}
                  </Text>

                  <View style={styles.qtyBox}>
                    <TouchableOpacity
                      style={styles.qtyBtn}
                      onPress={() => updateCartQuantity(item.cartItemId, -1)}
                    >
                      <Text style={styles.qtyBtnText}>−</Text>
                    </TouchableOpacity>
                    <Text style={styles.qtyText}>{item.quantity}</Text>
                    <TouchableOpacity
                      style={styles.qtyBtn}
                      onPress={() => updateCartQuantity(item.cartItemId, 1)}
                    >
                      <Text style={styles.qtyBtnText}>+</Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                      style={styles.removeBtn}
                      onPress={() => removeFromCart(item.cartItemId)}
                    >
                      <Text style={styles.removeBtnText}>🗑️</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              </View>
            </View>
          ))}
        </View>

        <View style={styles.sectionCard}>
          <Text style={styles.sectionTitle}>Mã giảm giá</Text>
          <View style={styles.voucherInputRow}>
            <TextInput
              style={styles.voucherInput}
              placeholder="Nhập mã ưu đãi..."
              value={voucherInput}
              onChangeText={setVoucherInput}
              autoCapitalize="characters"
            />
            <TouchableOpacity
              style={styles.applyVoucherBtn}
              onPress={() => handleApplyVoucherCode(voucherInput)}
            >
              <Text style={styles.applyVoucherText}>Áp dụng</Text>
            </TouchableOpacity>
          </View>

          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            {availableVouchersForCart.length === 0 ? (
              <Text style={{ fontSize: 12, color: '#757575', fontStyle: 'italic', paddingVertical: 6 }}>
                Không có mã giảm giá khả dụng hoặc bạn đã dùng hết các mã cho món này.
              </Text>
            ) : (
              availableVouchersForCart.map((v) => {
                const isSelected = appliedVoucher?.code === v.code && discountAmount > 0;
                const eligibleAmt = getEligibleSubTotalForVoucher(v);
                const eligible = eligibleAmt >= v.minOrder && eligibleAmt > 0;
                return (
                  <TouchableOpacity
                    key={v.id || v.code}
                    style={[
                      styles.voucherTicket,
                      v.store_id && styles.voucherTicketStore,
                      isSelected && styles.voucherTicketActive,
                      !eligible && { opacity: 0.5 },
                    ]}
                    onPress={() => handleApplyVoucherCode(v.code)}
                  >
                    <Text style={styles.voucherScopeBadge}>
                      {v.store_id ? v.storeName : 'Toàn sàn'}
                    </Text>
                    <Text style={styles.voucherCodeText}>{v.code}</Text>
                    <Text style={styles.voucherDescText} numberOfLines={2}>
                      {v.title}
                    </Text>
                    <Text style={styles.voucherMinText}>
                      Đơn từ {formatCurrency(v.minOrder)}
                    </Text>
                  </TouchableOpacity>
                );
              })
            )}
          </ScrollView>
        </View>

        <View style={styles.sectionCard}>
          <Text style={styles.sectionTitle}>Địa chỉ nhận hàng</Text>

          <Text style={styles.inputLabel}>Người nhận</Text>
          <TextInput
            style={styles.input}
            placeholder="Họ và tên..."
            value={customerName}
            onChangeText={setCustomerName}
          />

          <Text style={styles.inputLabel}>Số điện thoại</Text>
          <TextInput
            style={styles.input}
            placeholder="Số điện thoại nhận..."
            value={phone}
            onChangeText={setPhone}
            keyboardType="phone-pad"
          />

          <Text style={styles.inputLabel}>Địa chỉ giao</Text>
          <TextInput
            style={styles.input}
            placeholder="Số nhà, tên đường hoặc bấm định vị..."
            value={address}
            onChangeText={setAddress}
          />

          <View style={styles.gpsActionRow}>
            <TouchableOpacity
              style={styles.gpsBtn}
              onPress={handleGetRealGPS}
              disabled={loadingGps}
            >
              {loadingGps ? (
                <ActivityIndicator color="#FFF" size="small" />
              ) : (
                <Text style={styles.gpsBtnText}>📍 Lấy vị trí GPS</Text>
              )}
            </TouchableOpacity>
          </View>

          {showVirtualMap && (
            <View style={styles.mapListContainer}>
              <Text style={styles.mapListHeader}>Gợi ý địa điểm nhận hàng:</Text>
              {VIRTUAL_MAP_LOCATIONS.map((loc) => (
                <TouchableOpacity
                  key={loc.id}
                  style={styles.mapListItem}
                  onPress={() => {
                    setAddress(loc.address);
                    setShowVirtualMap(false);
                  }}
                >
                  <Text style={styles.mapListTitle}>{loc.title}</Text>
                  <Text style={styles.mapListAddr}>{loc.address}</Text>
                </TouchableOpacity>
              ))}
            </View>
          )}

          <Text style={styles.inputLabel}>Ghi chú đơn hàng</Text>
          <TextInput
            style={styles.input}
            placeholder="Ví dụ: Giao giờ trưa, gọi trước khi đến..."
            value={note}
            onChangeText={setNote}
          />
        </View>

        <View style={styles.sectionCard}>
          <Text style={styles.sectionTitle}>Phương thức thanh toán</Text>
          <View style={styles.paymentRow}>
            <TouchableOpacity
              style={[
                styles.paymentOption,
                paymentMethod === 'COD' && styles.paymentOptionActive,
              ]}
              onPress={() => setPaymentMethod('COD')}
            >
              <Text
                style={[
                  styles.paymentOptionText,
                  paymentMethod === 'COD' && styles.paymentOptionTextActive,
                ]}
              >
                💵 Tiền mặt
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.paymentOption,
                paymentMethod === 'Chuyển khoản QR' && styles.paymentOptionActive,
              ]}
              onPress={() => setPaymentMethod('Chuyển khoản QR')}
            >
              <Text
                style={[
                  styles.paymentOptionText,
                  paymentMethod === 'Chuyển khoản QR' && styles.paymentOptionTextActive,
                ]}
              >
                🏦 Chuyển khoản QR
              </Text>
            </TouchableOpacity>
          </View>

          <View style={styles.summaryBox}>
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Tạm tính:</Text>
              <Text style={styles.summaryVal}>{formatCurrency(subTotal)}</Text>
            </View>
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>
                Giảm giá {appliedVoucher ? `(${appliedVoucher.code})` : ''}:
              </Text>
              <Text style={[styles.summaryVal, { color: '#2E7D32' }]}>
                -{formatCurrency(discountAmount)}
              </Text>
            </View>
            <View style={[styles.summaryRow, styles.totalRow]}>
              <Text style={styles.totalLabel}>Tổng thanh toán:</Text>
              <Text style={styles.totalVal}>{formatCurrency(totalAmount)}</Text>
            </View>
          </View>
        </View>
      </ScrollView>

      <View style={styles.bottomCheckoutBar}>
        <View>
          <Text style={styles.bottomTotalLabel}>Tổng cộng</Text>
          <Text style={styles.bottomTotalPrice}>{formatCurrency(totalAmount)}</Text>
        </View>

        <TouchableOpacity
          style={styles.checkoutBtn}
          onPress={handleCheckoutPress}
          disabled={submittingOrder}
        >
          {submittingOrder ? (
            <ActivityIndicator color="#FFF" />
          ) : (
            <Text style={styles.checkoutBtnText}>
              {!currentUser
                ? 'ĐĂNG NHẬP ĐỂ ĐẶT'
                : paymentMethod === 'Chuyển khoản QR'
                ? 'MỞ MÃ QR'
                : 'ĐẶT HÀNG'}
            </Text>
          )}
        </TouchableOpacity>
      </View>

      <Modal
        visible={qrModalVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setQrModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.qrModalCard}>
            <Text style={styles.qrModalTitle}>CỔNG THANH TOÁN QR</Text>
            <Text style={styles.qrModalSubtitle}>
              Quét mã bằng ứng dụng Ngân hàng hoặc Ví điện tử
            </Text>

            <View
              style={[
                styles.timerBadge,
                qrSecondsLeft <= 30 && { backgroundColor: '#FFEBEE', borderColor: '#D32F2F' },
              ]}
            >
              <Text
                style={[
                  styles.timerText,
                  qrSecondsLeft <= 30 && { color: '#D32F2F' },
                ]}
              >
                Thời gian còn lại: {formatCountdown(qrSecondsLeft)}
              </Text>
            </View>

            <View style={styles.qrImageWrapper}>
              <Image
                source={{ uri: vietQrImageUrl }}
                style={styles.qrImage}
                resizeMode="contain"
              />
            </View>

            <View style={styles.bankInfoBox}>
              <Text style={styles.bankInfoLine}>
                Ngân hàng: <Text style={styles.boldText}>MB Bank</Text>
              </Text>
              <Text style={styles.bankInfoLine}>
                Số tiền:{' '}
                <Text style={[styles.boldText, { color: '#D84315', fontSize: 15 }]}>
                  {formatCurrency(totalAmount)}
                </Text>
              </Text>
              <Text style={styles.bankInfoLine}>
                Nội dung CK:{' '}
                <Text style={[styles.boldText, { color: '#1565C0' }]}>
                  THANHTOAN {pendingOrderCode}
                </Text>
              </Text>
            </View>

            <TouchableOpacity
              style={styles.confirmPaidBtn}
              onPress={handleConfirmQrPaymentSuccess}
              disabled={verifyingBank}
            >
              {verifyingBank ? (
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                  <ActivityIndicator color="#FFF" size="small" />
                  <Text style={styles.confirmPaidBtnText}>
                    Đang đối soát giao dịch...
                  </Text>
                </View>
              ) : (
                <Text style={styles.confirmPaidBtnText}>
                  TÔI ĐÃ CHUYỂN KHOẢN
                </Text>
              )}
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.cancelQrBtn}
              onPress={() => setQrModalVisible(false)}
              disabled={verifyingBank}
            >
              <Text style={styles.cancelQrBtnText}>Hủy giao dịch</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F7F3F0' },
  scrollContent: { padding: 14, paddingBottom: 100 },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 30,
    backgroundColor: '#F7F3F0',
  },
  emptyEmoji: { fontSize: 50, marginBottom: 12 },
  emptyTitle: { fontSize: 18, fontWeight: 'bold', color: '#4A3222' },
  emptySub: {
    fontSize: 13,
    color: '#7D6E63',
    textAlign: 'center',
    marginTop: 6,
    marginBottom: 20,
  },
  goHomeBtn: {
    backgroundColor: '#6F4E37',
    paddingHorizontal: 22,
    paddingVertical: 12,
    borderRadius: 8,
  },
  goHomeBtnText: { color: '#FFF', fontWeight: 'bold', fontSize: 13 },
  sectionCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 14,
    marginBottom: 12,
    elevation: 2,
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  sectionTitle: { fontSize: 14, fontWeight: 'bold', color: '#3E2723', marginBottom: 8 },
  clearAllText: { fontSize: 12, color: '#D32F2F', fontWeight: 'bold' },
  cartItem: {
    flexDirection: 'row',
    borderTopWidth: 1,
    borderTopColor: '#F0EAE4',
    paddingVertical: 10,
  },
  itemImg: { width: 64, height: 64, borderRadius: 8 },
  itemInfo: { flex: 1, marginLeft: 12 },
  itemStore: { fontSize: 11, color: '#8D6E63', fontWeight: '600' },
  itemName: { fontSize: 14, fontWeight: 'bold', color: '#3E2723', marginTop: 2 },
  itemOptions: { fontSize: 12, color: '#616161', marginTop: 2 },
  itemToppings: { fontSize: 12, color: '#6F4E37', marginTop: 2 },
  itemBottomRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 6,
  },
  itemTotalPrice: { fontSize: 14, fontWeight: 'bold', color: '#D84315' },
  qtyBox: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  qtyBtn: {
    backgroundColor: '#EFEBE7',
    width: 24,
    height: 24,
    borderRadius: 6,
    justifyContent: 'center',
    alignItems: 'center',
  },
  qtyBtnText: { fontSize: 14, fontWeight: 'bold', color: '#4E342E' },
  qtyText: { fontSize: 13, fontWeight: 'bold', color: '#3E2723' },
  removeBtn: { marginLeft: 4, padding: 4 },
  removeBtnText: { fontSize: 14 },
  voucherInputRow: { flexDirection: 'row', gap: 8, marginBottom: 10 },
  voucherInput: {
    flex: 1,
    backgroundColor: '#FAF7F5',
    borderWidth: 1,
    borderColor: '#D7CCC8',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 7,
    fontSize: 13,
  },
  applyVoucherBtn: {
    backgroundColor: '#6F4E37',
    paddingHorizontal: 16,
    justifyContent: 'center',
    borderRadius: 8,
  },
  applyVoucherText: { color: '#FFF', fontWeight: 'bold', fontSize: 13 },
  voucherTicket: {
    backgroundColor: '#FFF8F0',
    borderWidth: 1,
    borderColor: '#FFCC80',
    borderRadius: 8,
    padding: 8,
    marginRight: 8,
    width: 190,
  },
  voucherTicketStore: {
    backgroundColor: '#F3E5F5',
    borderColor: '#CE93D8',
  },
  voucherTicketActive: {
    backgroundColor: '#E8F5E9',
    borderColor: '#2E7D32',
    borderWidth: 1.5,
  },
  voucherScopeBadge: {
    fontSize: 10,
    fontWeight: 'bold',
    color: '#6A1B9A',
    marginBottom: 2,
  },
  voucherCodeText: { fontSize: 13, fontWeight: 'bold', color: '#E65100' },
  voucherDescText: { fontSize: 11, color: '#3E2723', marginTop: 2 },
  voucherMinText: { fontSize: 10, color: '#757575', marginTop: 4 },
  inputLabel: { fontSize: 12, fontWeight: '600', color: '#4E342E', marginTop: 6, marginBottom: 2 },
  input: {
    backgroundColor: '#FAF7F5',
    borderWidth: 1,
    borderColor: '#E0D6CE',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    fontSize: 13,
  },
  gpsActionRow: { marginTop: 8 },
  gpsBtn: {
    backgroundColor: '#2E7D32',
    paddingVertical: 9,
    borderRadius: 8,
    alignItems: 'center',
  },
  gpsBtnText: { color: '#FFF', fontSize: 12, fontWeight: 'bold' },
  mapListContainer: {
    backgroundColor: '#F5F9FF',
    borderRadius: 8,
    padding: 8,
    marginTop: 8,
    borderWidth: 1,
    borderColor: '#BBDEFB',
  },
  mapListHeader: { fontSize: 11, fontWeight: 'bold', color: '#0D47A1', marginBottom: 4 },
  mapListItem: {
    paddingVertical: 5,
    borderBottomWidth: 1,
    borderBottomColor: '#E3F2FD',
  },
  mapListTitle: { fontSize: 12, fontWeight: 'bold', color: '#1976D2' },
  mapListAddr: { fontSize: 11, color: '#555' },
  paymentRow: { flexDirection: 'row', gap: 10, marginBottom: 10 },
  paymentOption: {
    flex: 1,
    paddingVertical: 9,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#D7CCC8',
    alignItems: 'center',
    backgroundColor: '#FAF7F5',
  },
  paymentOptionActive: { backgroundColor: '#6F4E37', borderColor: '#6F4E37' },
  paymentOptionText: { fontSize: 13, fontWeight: '600', color: '#4E342E' },
  paymentOptionTextActive: { color: '#FFF' },
  summaryBox: {
    borderTopWidth: 1,
    borderTopColor: '#EFEBE7',
    paddingTop: 8,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  summaryLabel: { fontSize: 12, color: '#616161' },
  summaryVal: { fontSize: 12, fontWeight: 'bold', color: '#3E2723' },
  totalRow: {
    borderTopWidth: 1,
    borderTopColor: '#E0D6CE',
    paddingTop: 6,
    marginTop: 4,
  },
  totalLabel: { fontSize: 14, fontWeight: 'bold', color: '#3E2723' },
  totalVal: { fontSize: 16, fontWeight: 'bold', color: '#D84315' },
  bottomCheckoutBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: '#FFFFFF',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderTopWidth: 1,
    borderTopColor: '#E0D6CE',
    elevation: 8,
  },
  bottomTotalLabel: { fontSize: 11, color: '#757575' },
  bottomTotalPrice: { fontSize: 17, fontWeight: 'bold', color: '#D84315' },
  checkoutBtn: {
    backgroundColor: '#D84315',
    paddingHorizontal: 20,
    paddingVertical: 11,
    borderRadius: 8,
  },
  checkoutBtnText: { color: '#FFFFFF', fontSize: 13, fontWeight: 'bold' },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.65)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 18,
  },
  qrModalCard: {
    width: '100%',
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: 16,
    alignItems: 'center',
    elevation: 6,
  },
  qrModalTitle: { fontSize: 16, fontWeight: 'bold', color: '#1565C0' },
  qrModalSubtitle: {
    fontSize: 11,
    color: '#616161',
    textAlign: 'center',
    marginTop: 2,
    marginBottom: 8,
  },
  timerBadge: {
    backgroundColor: '#FFF8E1',
    borderWidth: 1,
    borderColor: '#FFB300',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 16,
    marginBottom: 10,
  },
  timerText: { fontSize: 12, fontWeight: 'bold', color: '#E65100' },
  qrImageWrapper: {
    width: 210,
    height: 210,
    backgroundColor: '#FAFAFA',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#E0E0E0',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 4,
  },
  qrImage: { width: '100%', height: '100%' },
  bankInfoBox: {
    width: '100%',
    backgroundColor: '#F5F9FF',
    borderRadius: 8,
    padding: 10,
    marginTop: 10,
    borderWidth: 1,
    borderColor: '#BBDEFB',
  },
  bankInfoLine: { fontSize: 12, color: '#333', marginBottom: 2 },
  boldText: { fontWeight: 'bold' },
  confirmPaidBtn: {
    width: '100%',
    backgroundColor: '#2E7D32',
    paddingVertical: 11,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 12,
  },
  confirmPaidBtnText: { color: '#FFFFFF', fontSize: 13, fontWeight: 'bold' },
  cancelQrBtn: {
    marginTop: 8,
    paddingVertical: 6,
  },
  cancelQrBtnText: { color: '#D32F2F', fontSize: 12, fontWeight: 'bold' },
});