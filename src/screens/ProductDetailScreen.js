import React, { useState, useMemo, useCallback } from 'react';
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
  RefreshControl,
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
    fetchAllData,
  } = useApp();

  const isCustomerOrGuest = !currentUser || currentUser.role === 'customer';

  const product = useMemo(() => {
    return products.find((p) => Number(p.id) === Number(initialProduct.id)) || initialProduct;
  }, [products, initialProduct]);

  const [selectedSize, setSelectedSize] = useState(SIZES[0]);
  const [selectedSugar, setSelectedSugar] = useState('100%');
  const [selectedIce, setSelectedIce] = useState('100% đá');
  const [selectedToppings, setSelectedToppings] = useState([]);
  const [quantity, setQuantity] = useState(1);
  const [refreshing, setRefreshing] = useState(false);

  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState('');
  const [submittingReview, setSubmittingReview] = useState(false);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await fetchAllData();
    setRefreshing(false);
  }, [fetchAllData]);

  const isFav = favorites.includes(product.id);
  const hasDiscount =
    product.discountPrice > 0 && product.discountPrice < product.basePrice;
  const effectiveBasePrice = hasDiscount ? product.discountPrice : product.basePrice;

  const eligibleOrderCode = useMemo(() => {
    return passedOrderCode || getEligibleOrderForReview(product.id);
  }, [passedOrderCode, product.id, reviews, getEligibleOrderForReview]);

  const productReviews = useMemo(() => {
    return reviews.filter((r) => Number(r.product_id) === Number(product.id));
  }, [reviews, product.id]);

  const handleToggleTopping = (topping) => {
    const exists = selectedToppings.some((t) => t.id === topping.id);
    if (exists) {
      setSelectedToppings(selectedToppings.filter((t) => t.id !== topping.id));
    } else {
      setSelectedToppings([...selectedToppings, topping]);
    }
  };

  const unitPrice = useMemo(() => {
    const toppingsCost = selectedToppings.reduce((sum, t) => sum + t.price, 0);
    return effectiveBasePrice + selectedSize.price + toppingsCost;
  }, [effectiveBasePrice, selectedSize, selectedToppings]);

  const totalPrice = unitPrice * quantity;
  const formatCurrency = (val) => `${Number(val || 0).toLocaleString('vi-VN')}đ`;

  const handleAddToCart = () => {
    if (!product.isAvailable) {
      Alert.alert('Thông báo', 'Món này hiện đang tạm ngưng phục vụ!');
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

    Alert.alert('Thành công', `Đã thêm ${quantity}x ${product.name} vào giỏ hàng.`, [
      { text: 'Chọn tiếp', style: 'cancel' },
      { text: 'Xem giỏ hàng', onPress: () => navigation.navigate('Cart') },
    ]);
  };

  const handleSubmitReview = async () => {
    if (!eligibleOrderCode) {
      Alert.alert(
        'Thông báo',
        'Bạn chỉ có thể đánh giá sau khi đơn hàng đã ở trạng thái Hoàn tất.'
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
      Alert.alert('Lỗi', res.message);
    }
  };

  return (
    <View style={styles.container}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={['#6F4E37']} />
        }
      >
        <View style={styles.imageContainer}>
          <Image source={{ uri: product.image }} style={styles.mainImage} />
          <TouchableOpacity
            style={styles.favFloatingBtn}
            onPress={() => toggleFavorite(product.id)}
          >
            <Text style={{ fontSize: 20 }}>{isFav ? '❤️' : '🤍'}</Text>
          </TouchableOpacity>
          {!product.isAvailable && (
            <View style={styles.unavailableBanner}>
              <Text style={styles.unavailableBannerText}>TẠM HẾT HÀNG</Text>
            </View>
          )}
        </View>

        <View style={styles.infoCard}>
          <Text style={styles.storeBadge}>{product.storeName || 'Cửa hàng đối tác'}</Text>
          <Text style={styles.productTitle}>{product.name}</Text>

          <View style={styles.priceRatingRow}>
            <View style={{ flexDirection: 'row', alignItems: 'baseline', gap: 8 }}>
              <Text style={styles.mainPrice}>{formatCurrency(effectiveBasePrice)}</Text>
              {hasDiscount && (
                <Text style={styles.strikePrice}>{formatCurrency(product.basePrice)}</Text>
              )}
            </View>
            <Text style={styles.ratingSummary}>
              {Number(product.reviewCount) > 0 && Number(product.avgRating) > 0
                ? `⭐ ${Number(product.avgRating).toFixed(1)} (${product.reviewCount} đánh giá)`
                : '🆕 Chưa có đánh giá'}{' '}
              • Đã bán {product.soldCount || 0}
          </Text>
          
          </View>

          <Text style={styles.descriptionText}>
            {product.description || 'Pha chế tươi mới theo yêu cầu.'}
          </Text>
        </View>

        <View style={styles.optionSection}>
          <Text style={styles.sectionTitle}>Kích cỡ</Text>
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

        <View style={styles.optionSection}>
          <Text style={styles.sectionTitle}>Mức đường</Text>
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

        <View style={styles.optionSection}>
          <Text style={styles.sectionTitle}>Mức đá</Text>
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

        <View style={styles.optionSection}>
          <Text style={styles.sectionTitle}>Topping</Text>
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

        <View style={styles.optionSection}>
          <Text style={styles.sectionTitle}>
            Đánh giá ({productReviews.length})
          </Text>

          {eligibleOrderCode ? (
            <View style={styles.reviewFormBox}>
              <Text style={styles.verifiedBadge}>
                Đơn hàng #{eligibleOrderCode} • Cảm nhận của bạn:
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
                placeholder="Hương vị, độ ngọt, chất lượng đóng gói..."
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
                Chỉ khách hàng có đơn hàng đã giao hoàn tất mới có thể gửi đánh giá.
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
                  <Text style={styles.reviewerName}>{rev.fullName || rev.username}</Text>
                  <Text style={styles.reviewStars}>
                    {'⭐'.repeat(Number(rev.rating || 5))}
                  </Text>
                </View> 
                <Text style={styles.reviewComment}>{rev.comment}</Text>
                <Text style={styles.reviewMeta}>
                  Đơn #{rev.orderCode} • {rev.createdAt || 'Đã mua'}
                </Text>
              </View>
            ))
          )}
        </View>
      </ScrollView>

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
            Chế độ xem dành cho {currentUser.role.toUpperCase()}
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
  mainImage: { width: '100%', height: 240 },
  favFloatingBtn: {
    position: 'absolute',
    top: 14,
    right: 14,
    backgroundColor: 'rgba(255,255,255,0.9)',
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 3,
  },
  unavailableBanner: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: 'rgba(183, 28, 28, 0.9)',
    paddingVertical: 6,
    alignItems: 'center',
  },
  unavailableBannerText: { color: '#FFF', fontWeight: 'bold', fontSize: 12 },
  infoCard: {
    backgroundColor: '#FFFFFF',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#EAE0D5',
  },
  storeBadge: { fontSize: 12, fontWeight: 'bold', color: '#8D6E63', marginBottom: 4 },
  productTitle: { fontSize: 19, fontWeight: 'bold', color: '#3E2723' },
  priceRatingRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 8,
    flexWrap: 'wrap',
  },
  mainPrice: { fontSize: 19, fontWeight: 'bold', color: '#D84315' },
  strikePrice: {
    fontSize: 13,
    color: '#9E9E9E',
    textDecorationLine: 'line-through',
  },
  ratingSummary: { fontSize: 12, color: '#616161', fontWeight: '600' },
  descriptionText: { fontSize: 13, color: '#5D4037', marginTop: 8, lineHeight: 18 },
  optionSection: {
    backgroundColor: '#FFFFFF',
    marginTop: 10,
    padding: 16,
  },
  sectionTitle: { fontSize: 14, fontWeight: 'bold', color: '#4A3222', marginBottom: 10 },
  optionWrap: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  optionChip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 8,
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
    paddingVertical: 9,
    paddingHorizontal: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#EFEBE7',
    marginBottom: 8,
    backgroundColor: '#FAF7F5',
  },
  toppingRowActive: {
    borderColor: '#6F4E37',
    backgroundColor: '#FFF8F0',
  },
  toppingName: { fontSize: 13, color: '#3E2723', fontWeight: '500' },
  toppingPrice: { fontSize: 13, fontWeight: 'bold', color: '#D84315' },
  reviewFormBox: {
    backgroundColor: '#FFF8F0',
    padding: 12,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#FFE0B2',
    marginBottom: 12,
  },
  verifiedBadge: { fontSize: 12, fontWeight: 'bold', color: '#2E7D32', marginBottom: 8 },
  starSelectRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 8 },
  starIcon: { fontSize: 22 },
  ratingNumberText: { fontSize: 12, fontWeight: 'bold', color: '#6F4E37', marginLeft: 6 },
  reviewInput: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#D7CCC8',
    borderRadius: 8,
    padding: 10,
    minHeight: 60,
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
  submitReviewBtnText: { color: '#FFF', fontWeight: 'bold', fontSize: 12 },
  reviewLockedNotice: {
    backgroundColor: '#F5F5F5',
    padding: 10,
    borderRadius: 8,
    marginBottom: 10,
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
  reviewStars: { fontSize: 11 },
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
    elevation: 8,
  },
  qtyControl: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#D7CCC8',
    borderRadius: 8,
    marginRight: 12,
  },
  qtyBtn: { paddingHorizontal: 12, paddingVertical: 6 },
  qtyBtnText: { fontSize: 18, fontWeight: 'bold', color: '#6F4E37' },
  qtyValue: { fontSize: 14, fontWeight: 'bold', paddingHorizontal: 8, color: '#3E2723' },
  addCartBtn: {
    flex: 1,
    backgroundColor: '#D84315',
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  addCartBtnDisabled: { backgroundColor: '#9E9E9E' },
  addCartBtnText: { color: '#FFFFFF', fontSize: 14, fontWeight: 'bold' },
});