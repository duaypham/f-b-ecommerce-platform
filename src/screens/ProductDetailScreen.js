import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  Image,
  ScrollView,
  TouchableOpacity,
  TextInput,
  StyleSheet,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { useApp } from '../context/AppContext';
import { SIZES, SUGAR_LEVELS, ICE_LEVELS, TOPPINGS } from '../constants/data';

export default function ProductDetailScreen({ route, navigation }) {
  const initialProduct = route.params?.product || {};
  const passedOrderCode = route.params?.orderCode || null;

  const {
    currentUser,
    products,
    reviews,
    favorites,
    toggleFavorite,
    addToCart,
    getEligibleOrderForReview,
    addReview,
  } = useApp();

  const isCustomerOrGuest = !currentUser || currentUser.role === 'customer';

  // Đồng bộ dữ liệu mới nhất của sản phẩm từ Context (cập nhật điểm sao ngay sau khi đánh giá)
  const product = useMemo(() => {
    return products.find((p) => Number(p.id) === Number(initialProduct.id)) || initialProduct;
  }, [products, initialProduct]);

  const [selectedSize, setSelectedSize] = useState(SIZES[0]); // Mặc định Size S
  const [selectedSugar, setSelectedSugar] = useState('100%');
  const [selectedIce, setSelectedIce] = useState('100% đá');
  const [selectedToppings, setSelectedToppings] = useState([]);
  const [quantity, setQuantity] = useState(1);

  // State cho phần Đánh giá sản phẩm (Verified Review)
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState('');
  const [submittingReview, setSubmittingReview] = useState(false);

  const isFav = favorites.includes(product.id);
  const hasDiscount =
    product.discountPrice > 0 && product.discountPrice < product.basePrice;
  const effectiveBasePrice = hasDiscount ? product.discountPrice : product.basePrice;

  // Kiểm tra mã đơn hàng đủ điều kiện đánh giá (Verified Purchase)
  const eligibleOrderCode = useMemo(() => {
    return passedOrderCode || getEligibleOrderForReview(product.id);
  }, [passedOrderCode, product.id, reviews]);

  // Lọc danh sách đánh giá của riêng sản phẩm này
  const productReviews = useMemo(() => {
    return reviews.filter((r) => Number(r.product_id) === Number(product.id));
  }, [reviews, product.id]);

  // Chọn / Bỏ chọn nhiều Topping
  const handleToggleTopping = (topping) => {
    const exists = selectedToppings.some((t) => t.id === topping.id);
    if (exists) {
      setSelectedToppings(selectedToppings.filter((t) => t.id !== topping.id));
    } else {
      setSelectedToppings([...selectedToppings, topping]);
    }
  };

  // Tính đơn giá 1 ly (Giá gốc/khuyến mãi + Giá Size + Tổng tiền Topping)
  const unitPrice = useMemo(() => {
    const toppingsCost = selectedToppings.reduce((sum, t) => sum + t.price, 0);
    return effectiveBasePrice + selectedSize.price + toppingsCost;
  }, [effectiveBasePrice, selectedSize, selectedToppings]);

  const totalPrice = unitPrice * quantity;

  const formatCurrency = (val) => `${Number(val || 0).toLocaleString('vi-VN')}đ`;

  const handleAddToCart = () => {
    if (!product.isAvailable) {
      Alert.alert('Tạm hết hàng', 'Món nước này hiện đang tạm ngưng phục vụ tại quán!');
      return;
    }

    addToCart({
      productId: product.id,
      name: product.name,
      storeId: product.store_id,
      storeName: product.storeName || 'Cửa hàng đối tác',
      image: product.image,
      size: selectedSize.id,
      sugar: selectedSugar,
      ice: selectedIce,
      toppings: selectedToppings.map((t) => t.name),
      quantity,
      unitPrice,
      totalPrice,
    });

    Alert.alert('Đã thêm vào giỏ!', `Đã thêm ${quantity}x ${product.name} vào giỏ hàng.`, [
      { text: 'Tiếp tục chọn món', style: 'cancel' },
      { text: 'Xem giỏ hàng', onPress: () => navigation.navigate('Cart') },
    ]);
  };

  const handleSubmitReview = async () => {
    if (!eligibleOrderCode) {
      Alert.alert(
        'Chưa đủ điều kiện',
        'Bạn chỉ có thể đánh giá sau khi đã mua món này và đơn hàng ở trạng thái Hoàn tất.'
      );
      return;
    }
    if (!comment.trim()) {
      Alert.alert('Thiếu nội dung', 'Vui lòng nhập cảm nhận của bạn về món nước này!');
      return;
    }

    setSubmittingReview(true);
    const res = await addReview({
      orderCode: eligibleOrderCode,
      product_id: product.id,
      rating,
      comment: comment.trim(),
    });
    setSubmittingReview(false);

    if (res.success) {
      setComment('');
      Alert.alert('Thành công', res.message);
    } else {
      Alert.alert('Thông báo', res.message);
    }
  };

  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* HÌNH ẢNH & THÔNG TIN CƠ BẢN */}
        <View style={styles.imageContainer}>
          <Image source={{ uri: product.image }} style={styles.mainImage} />
          <TouchableOpacity
            style={styles.favFloatingBtn}
            onPress={() => toggleFavorite(product.id)}
          >
            <Text style={{ fontSize: 22 }}>{isFav ? '❤️' : '🤍'}</Text>
          </TouchableOpacity>
          {!product.isAvailable && (
            <View style={styles.unavailableBanner}>
              <Text style={styles.unavailableBannerText}>
                CỬA HÀNG TẠM NGƯNG PHỤC VỤ MÓN NÀY
              </Text>
            </View>
          )}
        </View>

        <View style={styles.infoCard}>
          <Text style={styles.storeBadge}>🏪 {product.storeName || 'Cửa hàng đối tác'}</Text>
          <Text style={styles.productTitle}>{product.name}</Text>

          <View style={styles.priceRatingRow}>
            <View style={{ flexDirection: 'row', alignItems: 'baseline', gap: 8 }}>
              <Text style={styles.mainPrice}>{formatCurrency(effectiveBasePrice)}</Text>
              {hasDiscount && (
                <Text style={styles.strikePrice}>{formatCurrency(product.basePrice)}</Text>
              )}
            </View>
            <Text style={styles.ratingSummary}>
              ⭐ {product.avgRating || '5.0'} ({productReviews.length} đánh giá) • Đã bán{' '}
              {product.soldCount || 0}
            </Text>
          </View>

          <Text style={styles.descriptionText}>
            {product.description || 'Hương vị thơm ngon đậm đà pha chế từ nguyên liệu tươi mới mỗi ngày.'}
          </Text>
        </View>

        {/* TÙY CHỈNH SIZE */}
        <View style={styles.optionSection}>
          <Text style={styles.sectionTitle}>1. Chọn Kích cỡ (Size)</Text>
          <View style={styles.optionWrap}>
            {SIZES.map((sz) => {
              const active = selectedSize.id === sz.id;
              return (
                <TouchableOpacity
                  key={sz.id}
                  style={[styles.optionChip, active && styles.optionChipActive]}
                  onPress={() => setSelectedSize(sz)}
                >
                  <Text style={[styles.optionChipText, active && styles.optionChipTextActive]}>
                    {sz.label} {sz.price > 0 ? `(+${formatCurrency(sz.price)})` : ''}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        {/* TÙY CHỈNH MỨC ĐƯỜNG */}
        <View style={styles.optionSection}>
          <Text style={styles.sectionTitle}>2. Mức đường</Text>
          <View style={styles.optionWrap}>
            {SUGAR_LEVELS.map((sg) => {
              const active = selectedSugar === sg;
              return (
                <TouchableOpacity
                  key={sg}
                  style={[styles.optionChip, active && styles.optionChipActive]}
                  onPress={() => setSelectedSugar(sg)}
                >
                  <Text style={[styles.optionChipText, active && styles.optionChipTextActive]}>
                    {sg} đường
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        {/* TÙY CHỈNH MỨC ĐÁ */}
        <View style={styles.optionSection}>
          <Text style={styles.sectionTitle}>3. Mức đá</Text>
          <View style={styles.optionWrap}>
            {ICE_LEVELS.map((ic) => {
              const active = selectedIce === ic;
              return (
                <TouchableOpacity
                  key={ic}
                  style={[styles.optionChip, active && styles.optionChipActive]}
                  onPress={() => setSelectedIce(ic)}
                >
                  <Text style={[styles.optionChipText, active && styles.optionChipTextActive]}>
                    {ic}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        {/* TÙY CHỈNH TOPPING */}
        <View style={styles.optionSection}>
          <Text style={styles.sectionTitle}>4. Thêm Topping (Chọn nhiều)</Text>
          {TOPPINGS.map((tp) => {
            const isChecked = selectedToppings.some((t) => t.id === tp.id);
            return (
              <TouchableOpacity
                key={tp.id}
                style={[styles.toppingRow, isChecked && styles.toppingRowActive]}
                onPress={() => handleToggleTopping(tp)}
              >
                <Text style={styles.toppingName}>
                  {isChecked ? '☑️ ' : '⬜ '} {tp.name}
                </Text>
                <Text style={styles.toppingPrice}>+{formatCurrency(tp.price)}</Text>
              </TouchableOpacity>
            );
          })}
        </View>

        {/* KHU VỰC ĐÁNH GIÁ SẢN PHẨM (VERIFIED REVIEWS) */}
        <View style={styles.optionSection}>
          <Text style={styles.sectionTitle}>
            💬 Đánh giá từ khách đã mua ({productReviews.length})
          </Text>

          {/* Form gửi đánh giá chỉ mở khi khách có đơn Hoàn tất chứa món này */}
          {eligibleOrderCode ? (
            <View style={styles.reviewFormBox}>
              <Text style={styles.verifiedBadge}>
                ✅ Đã xác thực mua hàng (Đơn #{eligibleOrderCode}) - Mời bạn đánh giá:
              </Text>
              <View style={styles.starSelectRow}>
                {[1, 2, 3, 4, 5].map((star) => (
                  <TouchableOpacity key={star} onPress={() => setRating(star)}>
                    <Text style={styles.starIcon}>{star <= rating ? '⭐' : '☆'}</Text>
                  </TouchableOpacity>
                ))}
                <Text style={styles.ratingNumberText}>{rating}/5 sao</Text>
              </View>

              <TextInput
                style={styles.reviewInput}
                placeholder="Chia sẻ hương vị món nước, độ ngọt, chất lượng đóng gói..."
                value={comment}
                onChangeText={setComment}
                multiline
              />

              <TouchableOpacity
                style={styles.submitReviewBtn}
                onPress={handleSubmitReview}
                disabled={submittingReview}
              >
                {submittingReview ? (
                  <ActivityIndicator color="#FFF" size="small" />
                ) : (
                  <Text style={styles.submitReviewBtnText}>GỬI ĐÁNH GIÁ</Text>
                )}
              </TouchableOpacity>
            </View>
          ) : (
            <View style={styles.reviewLockedNotice}>
              <Text style={styles.reviewLockedText}>
                🔒 Chỉ khách hàng đã đặt mua món này và đơn hàng ở trạng thái "Hoàn tất" mới có thể gửi đánh giá (Verified Review).
              </Text>
            </View>
          )}

          {productReviews.length === 0 ? (
            <Text style={styles.noReviewText}>
              Chưa có đánh giá nào cho sản phẩm này.
            </Text>
          ) : (
            productReviews.map((rev) => (
              <View key={rev.id} style={styles.reviewItem}>
                <View style={styles.reviewHeader}>
                  <Text style={styles.reviewerName}>👤 {rev.fullName || rev.username}</Text>
                  <Text style={styles.reviewStars}>
                    {'⭐'.repeat(Number(rev.rating || 5))}
                  </Text>
                </View> 
                <Text style={styles.reviewComment}>{rev.comment}</Text>
                <Text style={styles.reviewMeta}>
                  Đơn hàng #{rev.orderCode} • {rev.createdAt || 'Đã mua hàng'}
                </Text>
              </View>
            ))
          )}
        </View>
      </ScrollView>

      {/* THANH CÔNG CỤ ĐẶT MÓN CỐ ĐỊNH BÊN DƯỚI */}
      {isCustomerOrGuest ? (
        <View style={styles.bottomBar}>
          <View style={styles.qtyControl}>
            <TouchableOpacity
              style={styles.qtyBtn}
              onPress={() => setQuantity((q) => Math.max(1, q - 1))}
            >
              <Text style={styles.qtyBtnText}>−</Text>
            </TouchableOpacity>
            <Text style={styles.qtyValue}>{quantity}</Text>
            <TouchableOpacity
              style={styles.qtyBtn}
              onPress={() => setQuantity((q) => q + 1)}
            >
              <Text style={styles.qtyBtnText}>+</Text>
            </TouchableOpacity>
          </View>

          <TouchableOpacity
            style={[styles.addCartBtn, !product.isAvailable && styles.addCartBtnDisabled]}
            onPress={handleAddToCart}
            disabled={!product.isAvailable}
          >
            <Text style={styles.addCartBtnText}>
              {product.isAvailable
                ? `Thêm vào giỏ • ${formatCurrency(totalPrice)}`
                : 'Tạm hết hàng'}
            </Text>
          </TouchableOpacity>
        </View>
      ) : (
        <View style={[styles.bottomBar, { justifyContent: 'center', backgroundColor: '#EFEBE7' }]}>
          <Text style={{ fontSize: 12, fontWeight: 'bold', color: '#5D4037' }}>
            👁️ Chế độ xem thông tin & đánh giá dành cho {currentUser.role.toUpperCase()} (Không đặt hàng)
          </Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F7F3F0' },
  scrollContent: { paddingBottom: 100 },
  imageContainer: { position: 'relative' },
  mainImage: { width: '100%', height: 250 },
  favFloatingBtn: {
    position: 'absolute',
    top: 14,
    right: 14,
    backgroundColor: 'rgba(255,255,255,0.9)',
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 4,
  },
  unavailableBanner: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: 'rgba(183, 28, 28, 0.9)',
    paddingVertical: 8,
    alignItems: 'center',
  },
  unavailableBannerText: { color: '#FFF', fontWeight: 'bold', fontSize: 13 },
  infoCard: {
    backgroundColor: '#FFFFFF',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#EAE0D5',
  },
  storeBadge: { fontSize: 12, fontWeight: 'bold', color: '#8D6E63', marginBottom: 4 },
  productTitle: { fontSize: 20, fontWeight: 'bold', color: '#3E2723' },
  priceRatingRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 8,
    flexWrap: 'wrap',
  },
  mainPrice: { fontSize: 20, fontWeight: 'bold', color: '#D84315' },
  strikePrice: {
    fontSize: 14,
    color: '#9E9E9E',
    textDecorationLine: 'line-through',
  },
  ratingSummary: { fontSize: 12, color: '#616161', fontWeight: '600' },
  descriptionText: { fontSize: 13, color: '#5D4037', marginTop: 10, lineHeight: 19 },
  optionSection: {
    backgroundColor: '#FFFFFF',
    marginTop: 10,
    padding: 16,
  },
  sectionTitle: { fontSize: 15, fontWeight: 'bold', color: '#4A3222', marginBottom: 10 },
  optionWrap: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  optionChip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#D7CCC8',
    backgroundColor: '#FAF7F5',
  },
  optionChipActive: { backgroundColor: '#6F4E37', borderColor: '#6F4E37' },
  optionChipText: { fontSize: 13, color: '#4E342E', fontWeight: '500' },
  optionChipTextActive: { color: '#FFFFFF', fontWeight: 'bold' },
  toppingRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#EFEBE7',
    marginBottom: 8,
    backgroundColor: '#FAF7F5',
  },
  toppingRowActive: {
    borderColor: '#6F4E37',
    backgroundColor: '#FFF8F0',
  },
  toppingName: { fontSize: 14, color: '#3E2723', fontWeight: '500' },
  toppingPrice: { fontSize: 13, fontWeight: 'bold', color: '#D84315' },
  reviewFormBox: {
    backgroundColor: '#FFF8F0',
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#FFE0B2',
    marginBottom: 14,
  },
  verifiedBadge: { fontSize: 12, fontWeight: 'bold', color: '#2E7D32', marginBottom: 8 },
  starSelectRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 10 },
  starIcon: { fontSize: 24 },
  ratingNumberText: { fontSize: 13, fontWeight: 'bold', color: '#6F4E37', marginLeft: 6 },
  reviewInput: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#D7CCC8',
    borderRadius: 8,
    padding: 10,
    minHeight: 65,
    textAlignVertical: 'top',
    fontSize: 13,
  },
  submitReviewBtn: {
    backgroundColor: '#6F4E37',
    paddingVertical: 10,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 10,
  },
  submitReviewBtnText: { color: '#FFF', fontWeight: 'bold', fontSize: 13 },
  reviewLockedNotice: {
    backgroundColor: '#F5F5F5',
    padding: 10,
    borderRadius: 8,
    marginBottom: 12,
  },
  reviewLockedText: { fontSize: 12, color: '#616161', fontStyle: 'italic' },
  noReviewText: { fontSize: 13, color: '#8D6E63', textAlign: 'center', paddingVertical: 10 },
  reviewItem: {
    borderTopWidth: 1,
    borderTopColor: '#F0EAE4',
    paddingVertical: 10,
  },
  reviewHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  reviewerName: { fontSize: 13, fontWeight: 'bold', color: '#3E2723' },
  reviewStars: { fontSize: 12 },
  reviewComment: { fontSize: 13, color: '#4E342E', marginTop: 4 },
  reviewMeta: { fontSize: 11, color: '#9E9E9E', marginTop: 4 },
  bottomBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: '#FFFFFF',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderTopWidth: 1,
    borderTopColor: '#E0D6CE',
    elevation: 10,
  },
  qtyControl: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#D7CCC8',
    borderRadius: 10,
    marginRight: 12,
  },
  qtyBtn: { paddingHorizontal: 12, paddingVertical: 6 },
  qtyBtnText: { fontSize: 18, fontWeight: 'bold', color: '#6F4E37' },
  qtyValue: { fontSize: 15, fontWeight: 'bold', paddingHorizontal: 8, color: '#3E2723' },
  addCartBtn: {
    flex: 1,
    backgroundColor: '#D84315',
    paddingVertical: 13,
    borderRadius: 10,
    alignItems: 'center',
  },
  addCartBtnDisabled: { backgroundColor: '#9E9E9E' },
  addCartBtnText: { color: '#FFFFFF', fontSize: 15, fontWeight: 'bold' },
});