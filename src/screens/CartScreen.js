import React, { useState, useEffect, useMemo } from 'react';
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
} from 'react-native';
import * as Location from 'expo-location';
import { useApp } from '../context/AppContext';
import { VIRTUAL_MAP_LOCATIONS } from '../constants/data';

export default function CartScreen({ navigation }) {
  const {
    currentUser,
    cart,
    vouchers,
    updateCartQuantity,
    removeFromCart,
    clearCart,
    createOrder,
  } = useApp();

  const [customerName, setCustomerName] = useState('');
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState('');
  const [note, setNote] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('COD'); // 'COD' | 'Chuyển khoản QR'

  const [voucherInput, setVoucherInput] = useState('');
  const [appliedVoucher, setAppliedVoucher] = useState(null);

  const [loadingGps, setLoadingGps] = useState(false);
  const [showVirtualMap, setShowVirtualMap] = useState(false);
  const [submittingOrder, setSubmittingOrder] = useState(false);

  // State cho Cổng Thanh toán QR đếm ngược (Countdown Modal)
  const [qrModalVisible, setQrModalVisible] = useState(false);
  const [qrSecondsLeft, setQrSecondsLeft] = useState(120); // 120 giây (2 phút)
  const [pendingOrderCode, setPendingOrderCode] = useState('');
  const [verifyingBank, setVerifyingBank] = useState(false);

  useEffect(() => {
    if (currentUser) {
      setCustomerName(currentUser.fullName || '');
      setPhone(currentUser.phone || '');
      setAddress(currentUser.address || '');
    }
  }, [currentUser]);

  // Bộ đếm ngược thời gian thanh toán QR
  useEffect(() => {
    if (!qrModalVisible) return;

    if (qrSecondsLeft <= 0) {
      setQrModalVisible(false);
      Alert.alert(
        '⏰ Hết thời gian thanh toán!',
        'Phiên giao dịch mã QR đã hết hạn. Bạn đã được đưa trở lại giỏ hàng, vui lòng thực hiện lại nếu muốn tiếp tục mua!',
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

  // Tính tổng tiền toàn giỏ hàng
  const subTotal = useMemo(() => {
    return cart.reduce((sum, item) => sum + item.totalPrice, 0);
  }, [cart]);

  // Tính tổng tiền hợp lệ cho Voucher (Nếu là Voucher của riêng 1 quán thì chỉ tính tiền các món thuộc quán đó)
  const getEligibleSubTotalForVoucher = (voucher) => {
    if (!voucher) return 0;
    if (!voucher.store_id) return subTotal; // Voucher toàn sàn
    return cart
      .filter((item) => Number(item.storeId) === Number(voucher.store_id))
      .reduce((sum, item) => sum + item.totalPrice, 0);
  };

  // Tính số tiền được giảm từ Voucher
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
  const estimatedPlatformFee = Math.round(subTotal * 0.1);

  const formatCurrency = (val) => `${Number(val || 0).toLocaleString('vi-VN')}đ`;

  // Xử lý áp dụng Voucher (Hỗ trợ cả Voucher Toàn Sàn & Voucher Cửa Hàng)
  const handleApplyVoucherCode = (codeToApply) => {
    const cleanCode = (codeToApply || voucherInput).trim().toUpperCase();
    if (!cleanCode) {
      Alert.alert('Thông báo', 'Vui lòng nhập hoặc chọn một mã giảm giá!');
      return;
    }

    const found = vouchers.find(
      (v) => v.code.toUpperCase() === cleanCode && v.isActive
    );

    if (!found) {
      Alert.alert('Mã không hợp lệ', 'Mã giảm giá không tồn tại hoặc đã ngừng hoạt động!');
      return;
    }

    const eligibleAmount = getEligibleSubTotalForVoucher(found);

    if (found.store_id && eligibleAmount === 0) {
      Alert.alert(
        'Voucher riêng của quán',
        `Mã ${found.code} chỉ áp dụng cho các món thuộc cửa hàng "${
          found.storeName || '#' + found.store_id
        }". Giỏ hàng của bạn hiện chưa có món của quán này!`
      );
      return;
    }

    if (eligibleAmount < found.minOrder) {
      Alert.alert(
        'Chưa đủ điều kiện',
        `Mã ${found.code} yêu cầu tổng tiền món ${
          found.store_id ? `của quán ${found.storeName}` : 'toàn đơn'
        } tối thiểu từ ${formatCurrency(found.minOrder)}. Hiện tại mới đạt ${formatCurrency(
          eligibleAmount
        )}.`
      );
      return;
    }

    setAppliedVoucher(found);
    setVoucherInput(found.code);
    Alert.alert('Áp dụng thành công!', `Đã áp dụng mã ${found.code}: ${found.title}`);
  };

  // Định vị GPS thực tế
  const handleGetRealGPS = async () => {
    setLoadingGps(true);
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert(
          'Chưa cấp quyền vị trí',
          'Hãy chọn nhanh địa điểm giao hàng từ Bản đồ ảo bên dưới!'
        );
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

        setAddress(
          formatted || `Tọa độ GPS (${latitude.toFixed(4)}, ${longitude.toFixed(4)})`
        );
      } else {
        setAddress(`Tọa độ GPS (${latitude.toFixed(5)}, ${longitude.toFixed(5)})`);
      }
    } catch (error) {
      Alert.alert(
        'Gợi ý chọn vị trí',
        'Thiết bị ảo chưa bật sóng vệ tinh GPS. Mời bạn chọn điểm giao hàng trên Bản đồ ảo!'
      );
      setShowVirtualMap(true);
    } finally {
      setLoadingGps(false);
    }
  };

  // Hàm gửi đơn hàng thật sự lên MySQL XAMPP
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
        '🎉 Đặt hàng thành công!',
        `Mã đơn hàng: #${res.orderCode}\nTrạng thái: ${paymentStatusLabel}\nCửa hàng đang chuẩn bị món cho bạn!`,
        [
          {
            text: 'Theo dõi tiến trình đơn',
            onPress: () => navigation.replace('OrderHistory'),
          },
        ]
      );
    } else {
      Alert.alert('Lỗi đặt hàng', res.message);
    }
  };

  // Kiểm tra hợp lệ trước khi thanh toán
  const handleCheckoutPress = async () => {
    if (cart.length === 0) {
      Alert.alert('Giỏ hàng trống', 'Vui lòng chọn ít nhất 1 món nước!');
      return;
    }

    if (!currentUser) {
      Alert.alert(
        'Yêu cầu đăng nhập',
        'Vui lòng đăng nhập tài khoản để hoàn tất đặt đơn!',
        [
          { text: 'Để sau', style: 'cancel' },
          {
            text: 'Đăng nhập ngay',
            onPress: () => navigation.navigate('Login', { redirectTo: 'Cart' }),
          },
        ]
      );
      return;
    }

    if (!customerName.trim() || !phone.trim() || !address.trim()) {
      Alert.alert(
        'Thiếu thông tin giao hàng',
        'Vui lòng nhập đầy đủ Họ tên, Số điện thoại và Địa chỉ nhận hàng (hoặc bấm lấy GPS)!'
      );
      return;
    }

    const tempOrderCode = 'ORD' + Math.floor(100000 + Math.random() * 900000);

    // Nếu chọn Chuyển khoản QR -> Mở Cổng Thanh toán QR đếm ngược 120s
    if (paymentMethod === 'Chuyển khoản QR') {
      setPendingOrderCode(tempOrderCode);
      setQrSecondsLeft(120);
      setQrModalVisible(true);
      return;
    }

    // Nếu chọn COD -> Tạo đơn ngay lập tức
    await submitFinalOrderToServer(tempOrderCode, 'Thanh toán khi nhận hàng (COD)');
  };

  // Khi khách bấm "Tôi đã chuyển khoản" trên cổng QR (Giả lập Webhook ngân hàng đối soát)
  const handleConfirmQrPaymentSuccess = () => {
    setVerifyingBank(true);
    setTimeout(async () => {
      setVerifyingBank(false);
      setQrModalVisible(false);
      await submitFinalOrderToServer(
        pendingOrderCode,
        'Đã thanh toán qua VietQR'
      );
    }, 1500);
  };

  // Tạo URL ảnh mã VietQR động theo đúng số tiền và mã đơn
  const vietQrImageUrl = useMemo(() => {
    const addInfo = encodeURIComponent(`THANHTOAN ${pendingOrderCode}`);
    const accName = encodeURIComponent('SAN FB TRA SUA BIEN HOA');
    return `https://img.vietqr.io/image/MB-0987654321-compact2.png?amount=${totalAmount}&addInfo=${addInfo}&accountName=${accName}`;
  }, [totalAmount, pendingOrderCode]);

  if (cart.length === 0) {
    return (
      <View style={styles.emptyContainer}>
        <Text style={styles.emptyEmoji}>🛒</Text>
        <Text style={styles.emptyTitle}>Giỏ hàng của bạn đang trống</Text>
        <Text style={styles.emptySub}>
          Hãy khám phá các món trà sữa và cà phê đang giảm giá trên trang chủ nhé!
        </Text>
        <TouchableOpacity
          style={styles.goHomeBtn}
          onPress={() => navigation.navigate('Home')}
        >
          <Text style={styles.goHomeBtnText}>KHÁM PHÁ THỰC ĐƠN NGAY</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* 1. DANH SÁCH MÓN TRONG GIỎ */}
        <View style={styles.sectionCard}>
          <View style={styles.sectionHeaderRow}>
            <Text style={styles.sectionTitle}>🍹 Món đã chọn ({cart.length})</Text>
            <TouchableOpacity onPress={clearCart}>
              <Text style={styles.clearAllText}>Xóa tất cả</Text>
            </TouchableOpacity>
          </View>

          {cart.map((item) => (
            <View key={item.cartItemId} style={styles.cartItem}>
              <Image source={{ uri: item.image }} style={styles.itemImg} />
              <View style={styles.itemInfo}>
                <Text style={styles.itemStore}>🏪 {item.storeName}</Text>
                <Text style={styles.itemName}>{item.name}</Text>
                <Text style={styles.itemOptions}>
                  Size {item.size} • {item.sugar} đường • {item.ice}
                </Text>
                {item.toppings && item.toppings.length > 0 && (
                  <Text style={styles.itemToppings}>
                    + Topping: {item.toppings.join(', ')}
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

        {/* 2. MÃ GIẢM GIÁ (VOUCHER SÀN & VOUCHER CỬA HÀNG) */}
        <View style={styles.sectionCard}>
          <Text style={styles.sectionTitle}>
            🎟️ Mã giảm giá (Voucher Sàn & Cửa hàng)
          </Text>
          <View style={styles.voucherInputRow}>
            <TextInput
              style={styles.voucherInput}
              placeholder="Nhập mã (VD: GIAM10K, GONGCHA15)"
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

          <Text style={styles.subHint}>
            Chạm để chọn nhanh Voucher Toàn sàn hoặc Voucher riêng của Quán:
          </Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            {vouchers
              .filter((v) => v.isActive)
              .map((v) => {
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
                      {v.store_id ? `🏪 Quán: ${v.storeName || '#' + v.store_id}` : '🌐 Toàn sàn'}
                    </Text>
                    <Text style={styles.voucherCodeText}>🏷️ {v.code}</Text>
                    <Text style={styles.voucherDescText} numberOfLines={2}>
                      {v.title}
                    </Text>
                    <Text style={styles.voucherMinText}>
                      Đơn tối thiểu: {formatCurrency(v.minOrder)}
                    </Text>
                  </TouchableOpacity>
                );
              })}
          </ScrollView>
        </View>

        {/* 3. ĐỊA CHỈ GIAO HÀNG (GPS & BẢN ĐỒ ẢO) */}
        <View style={styles.sectionCard}>
          <Text style={styles.sectionTitle}>📍 Thông tin & Địa chỉ Giao hàng (GPS)</Text>

          <Text style={styles.inputLabel}>Người nhận (*)</Text>
          <TextInput
            style={styles.input}
            placeholder="Nhập họ tên người nhận"
            value={customerName}
            onChangeText={setCustomerName}
          />

          <Text style={styles.inputLabel}>Số điện thoại nhận hàng (*)</Text>
          <TextInput
            style={styles.input}
            placeholder="Nhập số điện thoại"
            value={phone}
            onChangeText={setPhone}
            keyboardType="phone-pad"
          />

          <Text style={styles.inputLabel}>Địa chỉ giao hàng (*)</Text>
          <TextInput
            style={styles.input}
            placeholder="Nhập số nhà, tên đường hoặc bấm định vị GPS bên dưới"
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
                <Text style={styles.gpsBtnText}>📍 Định vị GPS hiện tại</Text>
              )}
            </TouchableOpacity>
          </View>

          {showVirtualMap && (
            <View style={styles.mapListContainer}>
              <Text style={styles.mapListHeader}>
                📌 Chọn nhanh tọa độ Google Maps giả lập:
              </Text>
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

          <Text style={styles.inputLabel}>Ghi chú cho quán / Tài xế</Text>
          <TextInput
            style={styles.input}
            placeholder="VD: Giao giờ hành chính, để ở quầy lễ tân..."
            value={note}
            onChangeText={setNote}
          />
        </View>

        {/* 4. PHƯƠNG THỨC THANH TOÁN & TỔNG KẾT */}
        <View style={styles.sectionCard}>
          <Text style={styles.sectionTitle}>💳 Phương thức thanh toán</Text>
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
                💵 Tiền mặt (COD)
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

          {paymentMethod === 'Chuyển khoản QR' && (
            <View style={styles.qrPreviewNotice}>
              <Text style={styles.qrPreviewNoticeText}>
                💡 Khi bấm "Xác nhận đặt hàng", hệ thống sẽ hiển thị mã VietQR kèm đồng hồ đếm ngược 02:00 phút để bạn quét thanh toán.
              </Text>
            </View>
          )}

          <View style={styles.summaryBox}>
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Tạm tính ({cart.length} món):</Text>
              <Text style={styles.summaryVal}>{formatCurrency(subTotal)}</Text>
            </View>
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>
                Giảm giá Voucher {appliedVoucher ? `(${appliedVoucher.code})` : ''}:
              </Text>
              <Text style={[styles.summaryVal, { color: '#2E7D32' }]}>
                -{formatCurrency(discountAmount)}
              </Text>
            </View>
            <View style={styles.summaryRow}>
              <Text style={styles.summaryFeeNote}>
                * Phí hoa hồng sàn thu từ đối tác (10%): {formatCurrency(estimatedPlatformFee)}
              </Text>
            </View>
            <View style={[styles.summaryRow, styles.totalRow]}>
              <Text style={styles.totalLabel}>Tổng thanh toán:</Text>
              <Text style={styles.totalVal}>{formatCurrency(totalAmount)}</Text>
            </View>
          </View>
        </View>
      </ScrollView>

      {/* NÚT XÁC NHẬN ĐẶT HÀNG */}
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
                ? 'ĐĂNG NHẬP ĐỂ ĐẶT ĐƠN'
                : paymentMethod === 'Chuyển khoản QR'
                ? 'MỞ MÃ QR THANH TOÁN'
                : 'XÁC NHẬN ĐẶT HÀNG'}
            </Text>
          )}
        </TouchableOpacity>
      </View>

      {/* ============================================================
          MODAL CỔNG THANH TOÁN MÃ QR ĐẾM NGƯỢC THỜI GIAN THỰC
      ============================================================ */}
      <Modal
        visible={qrModalVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setQrModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.qrModalCard}>
            <Text style={styles.qrModalTitle}>🏦 CỔNG THANH TOÁN VIETQR</Text>
            <Text style={styles.qrModalSubtitle}>
              Quét mã QR bên dưới bằng ứng dụng Ngân hàng hoặc Ví điện tử
            </Text>

            {/* Đồng hồ đếm ngược */}
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
                ⏳ Thời gian còn lại: {formatCountdown(qrSecondsLeft)}
              </Text>
            </View>

            {/* Hình ảnh Mã VietQR động */}
            <View style={styles.qrImageWrapper}>
              <Image
                source={{ uri: vietQrImageUrl }}
                style={styles.qrImage}
                resizeMode="contain"
              />
            </View>

            {/* Chi tiết chuyển khoản */}
            <View style={styles.bankInfoBox}>
              <Text style={styles.bankInfoLine}>
                Ngân hàng: <Text style={styles.boldText}>MB Bank (Quân Đội)</Text>
              </Text>
              <Text style={styles.bankInfoLine}>
                Chủ TK: <Text style={styles.boldText}>SAN FB TRA SUA BIEN HOA</Text>
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

            {/* Nút xác nhận đã chuyển khoản thành công (Giả lập Webhook ngân hàng) */}
            <TouchableOpacity
              style={styles.confirmPaidBtn}
              onPress={handleConfirmQrPaymentSuccess}
              disabled={verifyingBank}
            >
              {verifyingBank ? (
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                  <ActivityIndicator color="#FFF" size="small" />
                  <Text style={styles.confirmPaidBtnText}>
                    Đang đối soát giao dịch ngân hàng...
                  </Text>
                </View>
              ) : (
                <Text style={styles.confirmPaidBtnText}>
                  ✅ TÔI ĐÃ CHUYỂN KHOẢN (XÁC NHẬN)
                </Text>
              )}
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.cancelQrBtn}
              onPress={() => {
                setQrModalVisible(false);
                Alert.alert('Đã hủy phiên QR', 'Bạn đã quay lại màn hình Giỏ hàng.');
              }}
              disabled={verifyingBank}
            >
              <Text style={styles.cancelQrBtnText}>
                ✕ Hủy giao dịch & Quay lại Giỏ hàng
              </Text>
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
  emptyEmoji: { fontSize: 60, marginBottom: 12 },
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
    borderRadius: 10,
  },
  goHomeBtnText: { color: '#FFF', fontWeight: 'bold', fontSize: 14 },
  sectionCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: 14,
    marginBottom: 14,
    elevation: 2,
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  sectionTitle: { fontSize: 15, fontWeight: 'bold', color: '#3E2723', marginBottom: 8 },
  clearAllText: { fontSize: 12, color: '#D32F2F', fontWeight: 'bold' },
  cartItem: {
    flexDirection: 'row',
    borderTopWidth: 1,
    borderTopColor: '#F0EAE4',
    paddingVertical: 12,
  },
  itemImg: { width: 70, height: 70, borderRadius: 10 },
  itemInfo: { flex: 1, marginLeft: 12 },
  itemStore: { fontSize: 11, color: '#8D6E63', fontWeight: '600' },
  itemName: { fontSize: 14, fontWeight: 'bold', color: '#3E2723', marginTop: 2 },
  itemOptions: { fontSize: 12, color: '#616161', marginTop: 2 },
  itemToppings: { fontSize: 12, color: '#6F4E37', marginTop: 2, fontStyle: 'italic' },
  itemBottomRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 8,
  },
  itemTotalPrice: { fontSize: 14, fontWeight: 'bold', color: '#D84315' },
  qtyBox: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  qtyBtn: {
    backgroundColor: '#EFEBE7',
    width: 26,
    height: 26,
    borderRadius: 6,
    justifyContent: 'center',
    alignItems: 'center',
  },
  qtyBtnText: { fontSize: 15, fontWeight: 'bold', color: '#4E342E' },
  qtyText: { fontSize: 14, fontWeight: 'bold', color: '#3E2723' },
  removeBtn: { marginLeft: 4, padding: 4 },
  removeBtnText: { fontSize: 15 },
  voucherInputRow: { flexDirection: 'row', gap: 8, marginBottom: 10 },
  voucherInput: {
    flex: 1,
    backgroundColor: '#FAF7F5',
    borderWidth: 1,
    borderColor: '#D7CCC8',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    fontSize: 13,
  },
  applyVoucherBtn: {
    backgroundColor: '#6F4E37',
    paddingHorizontal: 16,
    justifyContent: 'center',
    borderRadius: 8,
  },
  applyVoucherText: { color: '#FFF', fontWeight: 'bold', fontSize: 13 },
  subHint: { fontSize: 12, color: '#7D6E63', marginBottom: 8 },
  voucherTicket: {
    backgroundColor: '#FFF8F0',
    borderWidth: 1,
    borderColor: '#FFCC80',
    borderRadius: 10,
    padding: 10,
    marginRight: 10,
    width: 205,
  },
  voucherTicketStore: {
    backgroundColor: '#F3E5F5',
    borderColor: '#CE93D8',
  },
  voucherTicketActive: {
    backgroundColor: '#E8F5E9',
    borderColor: '#2E7D32',
    borderWidth: 2,
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
  inputLabel: { fontSize: 12, fontWeight: '600', color: '#4E342E', marginTop: 8, marginBottom: 4 },
  input: {
    backgroundColor: '#FAF7F5',
    borderWidth: 1,
    borderColor: '#E0D6CE',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 9,
    fontSize: 13,
  },
  gpsActionRow: { flexDirection: 'row', gap: 8, marginTop: 10 },
  gpsBtn: {
    flex: 1,
    backgroundColor: '#2E7D32',
    paddingVertical: 10,
    borderRadius: 8,
    alignItems: 'center',
  },
  gpsBtnText: { color: '#FFF', fontSize: 12, fontWeight: 'bold' },
  virtualMapBtn: {
    backgroundColor: '#E3F2FD',
    paddingHorizontal: 12,
    justifyContent: 'center',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#90CAF9',
  },
  virtualMapBtnText: { color: '#1565C0', fontSize: 12, fontWeight: 'bold' },
  mapListContainer: {
    backgroundColor: '#F5F9FF',
    borderRadius: 8,
    padding: 10,
    marginTop: 8,
    borderWidth: 1,
    borderColor: '#BBDEFB',
  },
  mapListHeader: { fontSize: 12, fontWeight: 'bold', color: '#0D47A1', marginBottom: 6 },
  mapListItem: {
    paddingVertical: 6,
    borderBottomWidth: 1,
    borderBottomColor: '#E3F2FD',
  },
  mapListTitle: { fontSize: 12, fontWeight: 'bold', color: '#1976D2' },
  mapListAddr: { fontSize: 11, color: '#555' },
  paymentRow: { flexDirection: 'row', gap: 10, marginBottom: 12 },
  paymentOption: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#D7CCC8',
    alignItems: 'center',
    backgroundColor: '#FAF7F5',
  },
  paymentOptionActive: { backgroundColor: '#6F4E37', borderColor: '#6F4E37' },
  paymentOptionText: { fontSize: 13, fontWeight: '600', color: '#4E342E' },
  paymentOptionTextActive: { color: '#FFF' },
  qrPreviewNotice: {
    backgroundColor: '#E3F2FD',
    padding: 10,
    borderRadius: 8,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#90CAF9',
  },
  qrPreviewNoticeText: { fontSize: 12, color: '#0D47A1' },
  summaryBox: {
    borderTopWidth: 1,
    borderTopColor: '#EFEBE7',
    paddingTop: 10,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  summaryLabel: { fontSize: 13, color: '#616161' },
  summaryVal: { fontSize: 13, fontWeight: 'bold', color: '#3E2723' },
  summaryFeeNote: { fontSize: 11, color: '#8D6E63', fontStyle: 'italic' },
  totalRow: {
    borderTopWidth: 1,
    borderTopColor: '#E0D6CE',
    paddingTop: 8,
    marginTop: 4,
  },
  totalLabel: { fontSize: 15, fontWeight: 'bold', color: '#3E2723' },
  totalVal: { fontSize: 17, fontWeight: 'bold', color: '#D84315' },
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
    paddingVertical: 12,
    borderTopWidth: 1,
    borderTopColor: '#E0D6CE',
    elevation: 10,
  },
  bottomTotalLabel: { fontSize: 12, color: '#757575' },
  bottomTotalPrice: { fontSize: 18, fontWeight: 'bold', color: '#D84315' },
  checkoutBtn: {
    backgroundColor: '#D84315',
    paddingHorizontal: 20,
    paddingVertical: 13,
    borderRadius: 10,
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
    borderRadius: 18,
    padding: 18,
    alignItems: 'center',
    elevation: 8,
  },
  qrModalTitle: { fontSize: 18, fontWeight: 'bold', color: '#1565C0' },
  qrModalSubtitle: {
    fontSize: 12,
    color: '#616161',
    textAlign: 'center',
    marginTop: 4,
    marginBottom: 10,
  },
  timerBadge: {
    backgroundColor: '#FFF8E1',
    borderWidth: 1,
    borderColor: '#FFB300',
    paddingHorizontal: 16,
    paddingVertical: 6,
    borderRadius: 20,
    marginBottom: 12,
  },
  timerText: { fontSize: 14, fontWeight: 'bold', color: '#E65100' },
  qrImageWrapper: {
    width: 230,
    height: 230,
    backgroundColor: '#FAFAFA',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E0E0E0',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 6,
  },
  qrImage: { width: '100%', height: '100%' },
  bankInfoBox: {
    width: '100%',
    backgroundColor: '#F5F9FF',
    borderRadius: 10,
    padding: 12,
    marginTop: 12,
    borderWidth: 1,
    borderColor: '#BBDEFB',
  },
  bankInfoLine: { fontSize: 13, color: '#333', marginBottom: 4 },
  boldText: { fontWeight: 'bold' },
  confirmPaidBtn: {
    width: '100%',
    backgroundColor: '#2E7D32',
    paddingVertical: 13,
    borderRadius: 10,
    alignItems: 'center',
    marginTop: 14,
  },
  confirmPaidBtnText: { color: '#FFFFFF', fontSize: 14, fontWeight: 'bold' },
  cancelQrBtn: {
    marginTop: 12,
    paddingVertical: 8,
  },
  cancelQrBtnText: { color: '#D32F2F', fontSize: 13, fontWeight: 'bold' },
});