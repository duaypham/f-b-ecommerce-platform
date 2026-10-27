import React, { useMemo } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  Alert,
  RefreshControl,
} from 'react-native';
import { useApp } from '../context/AppContext';
import { ORDER_STATUS_STEPS } from '../constants/data';

export default function OrderHistoryScreen({ navigation }) {
  const {
    currentUser,
    orders,
    products,
    loading,
    fetchAllData,
    updateOrderStatus,
    reOrder,
  } = useApp();

  // Lọc danh sách đơn hàng theo đúng vai trò đăng nhập
  const myOrders = useMemo(() => {
    if (!currentUser) return [];
    if (currentUser.role === 'admin') return orders;
    if (currentUser.role === 'shipper') {
      return orders.filter(
        (o) =>
          o.shipper_username === currentUser.username ||
          o.status === 'Chờ tài xế nhận'
      );
    }
    if (currentUser.role === 'vendor' && currentUser.store) {
      return orders.filter(
        (o) =>
          Number(o.store_id) === Number(currentUser.store.id) ||
          o.username === currentUser.username
      );
    }
    return orders.filter((o) => o.username === currentUser.username);
  }, [orders, currentUser]);

  const formatCurrency = (val) => `${Number(val || 0).toLocaleString('vi-VN')}đ`;

  const handleCancelOrder = (orderCode) => {
    Alert.alert(
      'Xác nhận hủy đơn',
      `Bạn có chắc chắn muốn hủy đơn hàng #${orderCode} không?`,
      [
        { text: 'Không', style: 'cancel' },
        {
          text: 'Hủy đơn này',
          style: 'destructive',
          onPress: async () => {
            const res = await updateOrderStatus(orderCode, 'Đã hủy');
            if (res.success) {
              Alert.alert('Đã hủy', `Đơn hàng #${orderCode} đã được hủy.`);
            } else {
              Alert.alert('Lỗi', res.message);
            }
          },
        },
      ]
    );
  };

  const handleReOrder = (items) => {
    reOrder(items);
    Alert.alert('Đã thêm vào giỏ!', 'Toàn bộ món trong đơn cũ đã được đưa vào giỏ hàng.', [
      { text: 'Ở lại trang này', style: 'cancel' },
      { text: 'Đi tới Giỏ hàng', onPress: () => navigation.navigate('Cart') },
    ]);
  };

  const handleNavigateReview = (item, orderCode) => {
    const foundProduct = products.find((p) => Number(p.id) === Number(item.productId));
    if (foundProduct) {
      navigation.navigate('ProductDetail', {
        product: foundProduct,
        orderCode,
      });
    } else {
      Alert.alert('Thông báo', 'Sản phẩm này hiện đã bị gỡ khỏi kệ!');
    }
  };

  if (!currentUser) {
    return (
      <View style={styles.emptyBox}>
        <Text style={styles.emptyEmoji}>📦</Text>
        <Text style={styles.emptyTitle}>Vui lòng đăng nhập</Text>
        <Text style={styles.emptySub}>
          Đăng nhập để theo dõi tiến trình giao hàng 4 bước và lịch sử đặt món.
        </Text>
        <TouchableOpacity
          style={styles.primaryBtn}
          onPress={() => navigation.navigate('Login', { redirectTo: 'OrderHistory' })}
        >
          <Text style={styles.primaryBtnText}>ĐĂNG NHẬP NGAY</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const renderOrderCard = ({ item: order }) => {
    const isCancelled = order.status === 'Đã hủy';
    const currentStepIndex = ORDER_STATUS_STEPS.indexOf(order.status);
    const isPaidQR =
      order.paymentMethod?.includes('QR') ||
      order.paymentStatus?.includes('QR');

    return (
      <View style={styles.orderCard}>
        {/* Đầu thẻ đơn hàng */}
        <View style={styles.cardHeader}>
          <View style={{ flex: 1 }}>
            <Text style={styles.orderCodeText}>Mã đơn: #{order.orderCode}</Text>
            <Text style={styles.storeNameText}>
              🏪 {order.storeName || `Cửa hàng #${order.store_id}`}
            </Text>
          </View>

          <View
            style={[
              styles.statusBadge,
              order.status === 'Hoàn tất' && { backgroundColor: '#E8F5E9' },
              order.status === 'Đang giao hàng' && { backgroundColor: '#E3F2FD' },
              order.status === 'Chờ tài xế nhận' && { backgroundColor: '#FFF8E1' },
              isCancelled && { backgroundColor: '#FFEBEE' },
            ]}
          >
            <Text
              style={[
                styles.statusBadgeText,
                order.status === 'Hoàn tất' && { color: '#2E7D32' },
                order.status === 'Đang giao hàng' && { color: '#1565C0' },
                order.status === 'Chờ tài xế nhận' && { color: '#F57F17' },
                isCancelled && { color: '#C62828' },
              ]}
            >
              {order.status}
            </Text>
          </View>
        </View>

        {/* Thanh tiến trình 4 bước */}
        {!isCancelled && (
          <View style={styles.timelineContainer}>
            {ORDER_STATUS_STEPS.map((step, idx) => {
              const active = idx <= currentStepIndex;
              return (
                <View key={step} style={styles.timelineStep}>
                  <View
                    style={[
                      styles.timelineDot,
                      active && styles.timelineDotActive,
                    ]}
                  >
                    <Text style={styles.timelineDotNum}>{idx + 1}</Text>
                  </View>
                  <Text
                    style={[
                      styles.timelineLabel,
                      active && styles.timelineLabelActive,
                    ]}
                    numberOfLines={2}
                  >
                    {step}
                  </Text>
                </View>
              );
            })}
          </View>
        )}

        {/* Thông tin Tài xế giao hàng */}
        {order.shipperName ? (
          <View style={styles.shipperBanner}>
            <Text style={styles.shipperBannerText}>
              🛵 Tài xế phụ trách: <Text style={{ fontWeight: 'bold' }}>{order.shipperName}</Text>{' '}
              (@{order.shipper_username})
            </Text>
          </View>
        ) : order.status === 'Chờ tài xế nhận' ? (
          <View style={[styles.shipperBanner, { backgroundColor: '#FFF8E1' }]}>
            <Text style={[styles.shipperBannerText, { color: '#E65100' }]}>
              ⏳ Quán đã pha chế xong, đang chờ Tài xế (Shipper) nhận đơn...
            </Text>
          </View>
        ) : null}

        {/* Danh sách món nước trong đơn */}
        <View style={styles.itemsBox}>
          {(order.items || []).map((prod, index) => (
            <View key={index} style={styles.itemRow}>
              <View style={{ flex: 1 }}>
                <Text style={styles.itemName}>
                  {prod.quantity}x {prod.name} (Size {prod.size})
                </Text>
                <Text style={styles.itemSub}>
                  {prod.sugar} • {prod.ice}
                  {prod.toppings && prod.toppings.length > 0
                    ? ` • +${prod.toppings.join(', ')}`
                    : ''}
                </Text>
              </View>

              <View style={{ alignItems: 'flex-end' }}>
                <Text style={styles.itemPrice}>
                  {formatCurrency(prod.totalPrice)}
                </Text>
                {order.status === 'Hoàn tất' &&
                  currentUser.username === order.username && (
                    <TouchableOpacity
                      style={styles.reviewMiniBtn}
                      onPress={() => handleNavigateReview(prod, order.orderCode)}
                    >
                      <Text style={styles.reviewMiniBtnText}>⭐ Đánh giá món</Text>
                    </TouchableOpacity>
                  )}
              </View>
            </View>
          ))}
        </View>

        {/* Thông tin giao nhận & Trạng thái Thanh toán */}
        <View style={styles.metaBox}>
          <Text style={styles.metaLine}>
            📍 Giao đến: {order.customerName} ({order.phone}) - {order.address}
          </Text>
          {order.voucherCode ? (
            <Text style={styles.metaLine}>
              🎟️ Voucher áp dụng: {order.voucherCode} (-
              {formatCurrency(order.discountAmount)})
            </Text>
          ) : null}

          <View style={styles.totalRow}>
            <View>
              <Text style={styles.paymentMethodText}>
                Hình thức: {order.paymentMethod}
              </Text>
              <Text
                style={[
                  styles.paymentStatusBadge,
                  isPaidQR ? { color: '#1565C0' } : { color: '#2E7D32' },
                ]}
              >
                {isPaidQR ? '✅ ' : '💵 '}
                {order.paymentStatus || order.paymentMethod}
              </Text>
            </View>
            <Text style={styles.totalAmountText}>
              Tổng: {formatCurrency(order.totalAmount)}
            </Text>
          </View>
        </View>

        {/* Các nút thao tác dành cho Khách hàng */}
        <View style={styles.actionRow}>
          <TouchableOpacity
            style={styles.reOrderBtn}
            onPress={() => handleReOrder(order.items)}
          >
            <Text style={styles.reOrderBtnText}>🔄 Đặt lại đơn</Text>
          </TouchableOpacity>

          {order.status === 'Đang chuẩn bị' &&
            currentUser.username === order.username && (
              <TouchableOpacity
                style={styles.cancelBtn}
                onPress={() => handleCancelOrder(order.orderCode)}
              >
                <Text style={styles.cancelBtnText}>✕ Hủy đơn</Text>
              </TouchableOpacity>
            )}
        </View>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <FlatList
        data={myOrders}
        keyExtractor={(item) => item.orderCode}
        renderItem={renderOrderCard}
        contentContainerStyle={styles.listContent}
        refreshControl={
          <RefreshControl refreshing={loading} onRefresh={fetchAllData} />
        }
        ListEmptyComponent={
          <View style={styles.emptyBox}>
            <Text style={styles.emptyEmoji}>🧾</Text>
            <Text style={styles.emptyTitle}>Chưa có đơn hàng nào</Text>
            <Text style={styles.emptySub}>
              Các đơn hàng bạn đặt sẽ hiển thị đầy đủ tiến trình 4 bước tại đây.
            </Text>
          </View>
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F7F3F0' },
  listContent: { padding: 14, paddingBottom: 30 },
  emptyBox: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 35,
    marginTop: 40,
  },
  emptyEmoji: { fontSize: 54, marginBottom: 10 },
  emptyTitle: { fontSize: 18, fontWeight: 'bold', color: '#3E2723' },
  emptySub: {
    fontSize: 13,
    color: '#7D6E63',
    textAlign: 'center',
    marginTop: 6,
    marginBottom: 18,
  },
  primaryBtn: {
    backgroundColor: '#6F4E37',
    paddingHorizontal: 22,
    paddingVertical: 12,
    borderRadius: 10,
  },
  primaryBtnText: { color: '#FFF', fontWeight: 'bold' },
  orderCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: 14,
    marginBottom: 14,
    elevation: 2,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: '#F0EAE4',
    paddingBottom: 10,
  },
  orderCodeText: { fontSize: 15, fontWeight: 'bold', color: '#3E2723' },
  storeNameText: { fontSize: 12, color: '#8D6E63', fontWeight: '600', marginTop: 2 },
  statusBadge: {
    backgroundColor: '#FFF3E0',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
  },
  statusBadgeText: { fontSize: 12, fontWeight: 'bold', color: '#E65100' },
  timelineContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    backgroundColor: '#FAF7F5',
    paddingVertical: 10,
    paddingHorizontal: 8,
    borderRadius: 10,
    marginTop: 10,
  },
  timelineStep: {
    flex: 1,
    alignItems: 'center',
    paddingHorizontal: 2,
  },
  timelineDot: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: '#D7CCC8',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 4,
  },
  timelineDotActive: { backgroundColor: '#2E7D32' },
  timelineDotNum: { color: '#FFF', fontSize: 11, fontWeight: 'bold' },
  timelineLabel: {
    fontSize: 10,
    color: '#9E9E9E',
    textAlign: 'center',
  },
  timelineLabelActive: { color: '#2E7D32', fontWeight: 'bold' },
  shipperBanner: {
    backgroundColor: '#E3F2FD',
    paddingVertical: 7,
    paddingHorizontal: 10,
    borderRadius: 8,
    marginTop: 8,
  },
  shipperBannerText: { fontSize: 12, color: '#1565C0' },
  itemsBox: { marginTop: 10 },
  itemRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 6,
    borderBottomWidth: 1,
    borderBottomColor: '#FAF5F0',
  },
  itemName: { fontSize: 13, fontWeight: 'bold', color: '#3E2723' },
  itemSub: { fontSize: 11, color: '#757575', marginTop: 2 },
  itemPrice: { fontSize: 13, fontWeight: 'bold', color: '#4E342E' },
  reviewMiniBtn: {
    marginTop: 4,
    backgroundColor: '#FFF8E1',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#FFB300',
  },
  reviewMiniBtnText: { fontSize: 11, fontWeight: 'bold', color: '#E65100' },
  metaBox: { marginTop: 10, paddingTop: 6 },
  metaLine: { fontSize: 12, color: '#5D4037', marginBottom: 4 },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 6,
  },
  paymentMethodText: { fontSize: 12, color: '#757575' },
  paymentStatusBadge: { fontSize: 12, fontWeight: 'bold', marginTop: 2 },
  totalAmountText: { fontSize: 16, fontWeight: 'bold', color: '#D84315' },
  actionRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 10,
    marginTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#F0EAE4',
    paddingTop: 10,
  },
  reOrderBtn: {
    backgroundColor: '#6F4E37',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 8,
  },
  reOrderBtnText: { color: '#FFF', fontSize: 12, fontWeight: 'bold' },
  cancelBtn: {
    backgroundColor: '#FFEBEE',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#FFCDD2',
  },
  cancelBtnText: { color: '#C62828', fontSize: 12, fontWeight: 'bold' },
});