import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  FlatList,
  Image,
  ScrollView,
  StyleSheet,
  RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useApp } from '../context/AppContext';
import { CATEGORIES } from '../constants/data';

export default function HomeScreen({ navigation }) {
  const {
    currentUser,
    products,
    stores,
    cart,
    favorites,
    toggleFavorite,
    loading,
    fetchAllData,
  } = useApp();

  // Xác định người dùng có phải là Khách mua hàng (hoặc Khách vãng lai) hay không
  const isCustomerOrGuest = !currentUser || currentUser.role === 'customer';

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('Tất cả');
  const [selectedStoreId, setSelectedStoreId] = useState(0);
  const [onlyDiscount, setOnlyDiscount] = useState(false);
  const [onlyFavorites, setOnlyFavorites] = useState(false);

  const totalCartItems = useMemo(
    () => cart.reduce((sum, item) => sum + item.quantity, 0),
    [cart]
  );

  const featuredProducts = useMemo(() => {
    return products
      .filter((p) => p.isBestSeller && p.isAvailable)
      .sort((a, b) => b.soldCount - a.soldCount);
  }, [products]);

  const filteredProducts = useMemo(() => {
    return products.filter((item) => {
      const matchKeyword =
        item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (item.storeName && item.storeName.toLowerCase().includes(searchQuery.toLowerCase()));

      const matchCategory =
        selectedCategory === 'Tất cả' || item.category === selectedCategory;

      const matchStore =
        selectedStoreId === 0 || Number(item.store_id) === Number(selectedStoreId);

      const matchDiscount =
        !onlyDiscount || (item.discountPrice > 0 && item.discountPrice < item.basePrice);

      const matchFav = !onlyFavorites || favorites.includes(item.id);

      return matchKeyword && matchCategory && matchStore && matchDiscount && matchFav;
    });
  }, [products, searchQuery, selectedCategory, selectedStoreId, onlyDiscount, onlyFavorites, favorites]);

  const formatCurrency = (val) => `${Number(val || 0).toLocaleString('vi-VN')}đ`;

  const getWorkspaceButtonLabel = () => {
    if (!currentUser) return '';
    if (currentUser.role === 'shipper') return '🛵 Sàn Ship';
    if (currentUser.role === 'vendor') return '🏪 Quản lý Quán';
    return '🛡️ Quản trị Sàn';
  };

  const renderProductCard = ({ item }) => {
    const hasDiscount = item.discountPrice > 0 && item.discountPrice < item.basePrice;
    const displayPrice = hasDiscount ? item.discountPrice : item.basePrice;
    const isFav = favorites.includes(item.id);

    return (
      <TouchableOpacity
        style={[styles.productCard, !item.isAvailable && styles.productCardDisabled]}
        activeOpacity={0.85}
        onPress={() => navigation.navigate('ProductDetail', { product: item })}
      >
        <View style={styles.imageWrapper}>
          <Image source={{ uri: item.image }} style={styles.productImage} />
          {hasDiscount && (
            <View style={styles.discountBadge}>
              <Text style={styles.discountBadgeText}>
                -{Math.round(((item.basePrice - item.discountPrice) / item.basePrice) * 100)}%
              </Text>
            </View>
          )}
          {!item.isAvailable && (
            <View style={styles.outOfStockOverlay}>
              <Text style={styles.outOfStockText}>TẠM HẾT HÀNG</Text>
            </View>
          )}
        </View>

        <View style={styles.productInfo}>
          <View style={styles.storeRow}>
            <Text style={styles.storeTag} numberOfLines={1}>
              🏪 {item.storeName || 'Cửa hàng đối tác'}
            </Text>
            {/* Chỉ Khách hàng mới có nút thả tim Yêu thích */}
            {isCustomerOrGuest && (
              <TouchableOpacity onPress={() => toggleFavorite(item.id)}>
                <Text style={styles.favIcon}>{isFav ? '❤️' : '🤍'}</Text>
              </TouchableOpacity>
            )}
          </View>

          <Text style={styles.productName} numberOfLines={1}>
            {item.name}
          </Text>

          <Text style={styles.metaText}>
            ⭐ {item.avgRating || '5.0'} ({item.reviewCount || 0}) • Đã bán {item.soldCount || 0}
          </Text>

          <View style={styles.priceRow}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
              <Text style={styles.currentPrice}>{formatCurrency(displayPrice)}</Text>
              {hasDiscount && (
                <Text style={styles.oldPrice}>{formatCurrency(item.basePrice)}</Text>
              )}
            </View>

            <View
              style={[
                styles.addMiniBtn,
                !isCustomerOrGuest && { backgroundColor: '#5D4037' },
                !item.isAvailable && { backgroundColor: '#BDBDBD' },
              ]}
            >
              <Text style={styles.addMiniBtnText}>
                {!isCustomerOrGuest
                  ? '👁️ Xem'
                  : item.isAvailable
                  ? '+ Chọn'
                  : 'Hết'}
              </Text>
            </View>
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      {/* HEADER PHÂN TÁCH RÕ LUỒNG KHÁCH HÀNG VÀ LUỒNG VẬN HÀNH */}
      <View style={styles.header}>
        <View style={{ flex: 1 }}>
          <Text style={styles.headerTitle}>🧋 Sàn F&B Trà Sữa & Cà Phê</Text>
          <Text style={styles.headerSubtitle}>
            {currentUser
              ? `${currentUser.fullName} • Vai trò: ${currentUser.role.toUpperCase()}`
              : 'Khách vãng lai • Đăng nhập để nhận ưu đãi'}
          </Text>
        </View>

        <View style={styles.headerActions}>
          {isCustomerOrGuest ? (
            <>
              {/* Giao diện Header dành riêng cho Khách hàng */}
              {currentUser && (
                <TouchableOpacity
                  style={styles.headerBtn}
                  onPress={() => navigation.navigate('OrderHistory')}
                >
                  <Text style={styles.headerBtnText}>📦 Đơn của tôi</Text>
                </TouchableOpacity>
              )}

              <TouchableOpacity
                style={styles.headerBtn}
                onPress={() =>
                  navigation.navigate(currentUser ? 'Profile' : 'Login')
                }
              >
                <Text style={styles.headerBtnText}>
                  {currentUser ? '👤 Hồ sơ' : '🔑 Đăng nhập'}
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.headerBtn, styles.cartBtn]}
                onPress={() => navigation.navigate('Cart')}
              >
                <Text style={styles.cartBtnText}>🛒 {totalCartItems}</Text>
              </TouchableOpacity>
            </>
          ) : (
            <>
              {/* Giao diện Header dành riêng cho Admin / Vendor / Shipper (Không có Đơn & Giỏ hàng) */}
              <TouchableOpacity
                style={[styles.headerBtn, { backgroundColor: '#FFD54F' }]}
                onPress={() => navigation.navigate('Admin')}
              >
                <Text style={[styles.headerBtnText, { color: '#3E2723', fontWeight: 'bold' }]}>
                  {getWorkspaceButtonLabel()}
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.headerBtn}
                onPress={() => navigation.navigate('Profile')}
              >
                <Text style={styles.headerBtnText}>👤 Hồ sơ</Text>
              </TouchableOpacity>
            </>
          )}
        </View>
      </View>

      {/* Banner nhắc nhở nếu Admin/Vendor/Shipper đang xem trang chủ */}
      {!isCustomerOrGuest && (
        <TouchableOpacity
          style={styles.operatorNoticeBar}
          onPress={() => navigation.navigate('Admin')}
        >
          <Text style={styles.operatorNoticeText}>
            ⚡ Bạn đang ở chế độ xem Sàn dành cho {currentUser.role.toUpperCase()}. Chạm vào đây để quay lại Bảng điều khiển làm việc ➔
          </Text>
        </TouchableOpacity>
      )}

      {/* THANH TÌM KIẾM TỪ KHÓA */}
      <View style={styles.searchContainer}>
        <TextInput
          style={styles.searchInput}
          placeholder="🔍 Tìm món nước, trà sữa, tên quán..."
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
        {searchQuery.length > 0 && (
          <TouchableOpacity
            style={styles.clearSearchBtn}
            onPress={() => setSearchQuery('')}
          >
            <Text style={{ color: '#666', fontWeight: 'bold' }}>✕</Text>
          </TouchableOpacity>
        )}
      </View>

      <FlatList
        data={filteredProducts}
        keyExtractor={(item) => item.id.toString()}
        renderItem={renderProductCard}
        contentContainerStyle={styles.listContent}
        refreshControl={
          <RefreshControl refreshing={loading} onRefresh={fetchAllData} />
        }
        ListHeaderComponent={
          <View>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              style={styles.quickFilterScroll}
            >
              <TouchableOpacity
                style={[
                  styles.filterChip,
                  onlyDiscount && styles.filterChipDiscountActive,
                ]}
                onPress={() => setOnlyDiscount(!onlyDiscount)}
              >
                <Text
                  style={[
                    styles.filterChipText,
                    onlyDiscount && { color: '#FFF' },
                  ]}
                >
                  🔥 Đang giảm giá
                </Text>
              </TouchableOpacity>

              {isCustomerOrGuest && (
                <TouchableOpacity
                  style={[
                    styles.filterChip,
                    onlyFavorites && styles.filterChipFavActive,
                  ]}
                  onPress={() => setOnlyFavorites(!onlyFavorites)}
                >
                  <Text
                    style={[
                      styles.filterChipText,
                      onlyFavorites && { color: '#FFF' },
                    ]}
                  >
                    ❤️ Yêu thích ({favorites.length})
                  </Text>
                </TouchableOpacity>
              )}

              <TouchableOpacity
                style={[
                  styles.filterChip,
                  selectedStoreId === 0 && styles.filterChipStoreActive,
                ]}
                onPress={() => setSelectedStoreId(0)}
              >
                <Text
                  style={[
                    styles.filterChipText,
                    selectedStoreId === 0 && { color: '#FFF' },
                  ]}
                >
                  🏪 Tất cả quán
                </Text>
              </TouchableOpacity>

              {stores.map((st) => (
                <TouchableOpacity
                  key={st.id}
                  style={[
                    styles.filterChip,
                    Number(selectedStoreId) === Number(st.id) &&
                      styles.filterChipStoreActive,
                  ]}
                  onPress={() => setSelectedStoreId(Number(st.id))}
                >
                  <Text
                    style={[
                      styles.filterChipText,
                      Number(selectedStoreId) === Number(st.id) && { color: '#FFF' },
                    ]}
                  >
                    🏪 {st.storeName}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>

            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              style={styles.categoryScroll}
            >
              {CATEGORIES.map((cat) => (
                <TouchableOpacity
                  key={cat}
                  style={[
                    styles.categoryTab,
                    selectedCategory === cat && styles.categoryTabActive,
                  ]}
                  onPress={() => setSelectedCategory(cat)}
                >
                  <Text
                    style={[
                      styles.categoryTabText,
                      selectedCategory === cat && styles.categoryTabTextActive,
                    ]}
                  >
                    {cat}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>

            {searchQuery.trim() === '' &&
              selectedCategory === 'Tất cả' &&
              !onlyDiscount &&
              !onlyFavorites &&
              featuredProducts.length > 0 && (
                <View style={styles.featuredSection}>
                  <View style={styles.sectionHeaderRow}>
                    <Text style={styles.sectionTitle}>🏆 Món Nổi Bật & Bán Chạy Nhất</Text>
                    <Text style={styles.sectionHint}>Theo lượt mua thực tế</Text>
                  </View>

                  <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                    {featuredProducts.map((fp) => {
                      const hasSale = fp.discountPrice > 0 && fp.discountPrice < fp.basePrice;
                      const price = hasSale ? fp.discountPrice : fp.basePrice;
                      return (
                        <TouchableOpacity
                          key={fp.id}
                          style={styles.featuredCard}
                          onPress={() =>
                            navigation.navigate('ProductDetail', { product: fp })
                          }
                        >
                          <Image source={{ uri: fp.image }} style={styles.featuredImg} />
                          <View style={styles.featuredBadge}>
                            <Text style={styles.featuredBadgeText}>
                              🔥 Đã bán {fp.soldCount}
                            </Text>
                          </View>
                          <Text style={styles.featuredStore} numberOfLines={1}>
                            {fp.storeName}
                          </Text>
                          <Text style={styles.featuredName} numberOfLines={1}>
                            {fp.name}
                          </Text>
                          <Text style={styles.featuredPrice}>{formatCurrency(price)}</Text>
                        </TouchableOpacity>
                      );
                    })}
                  </ScrollView>
                </View>
              )}

            <Text style={[styles.sectionTitle, { marginTop: 10, marginBottom: 8 }]}>
              🍹 Thực Đơn ({filteredProducts.length} món)
            </Text>
          </View>
        }
        ListEmptyComponent={
          <View style={styles.emptyBox}>
            <Text style={styles.emptyText}>
              Không tìm thấy món nước nào khớp với bộ lọc hiện tại.
            </Text>
          </View>
        }
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#F7F3F0' },
  header: {
    backgroundColor: '#6F4E37',
    paddingHorizontal: 14,
    paddingVertical: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    flexWrap: 'wrap',
    gap: 8,
  },
  headerTitle: { color: '#FFFFFF', fontSize: 17, fontWeight: 'bold' },
  headerSubtitle: { color: '#EEDCC6', fontSize: 11, marginTop: 2 },
  headerActions: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  headerBtn: {
    backgroundColor: 'rgba(255,255,255,0.18)',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
  },
  headerBtnText: { color: '#FFF', fontSize: 12, fontWeight: '600' },
  cartBtn: { backgroundColor: '#E65100' },
  cartBtnText: { color: '#FFF', fontSize: 12, fontWeight: 'bold' },
  operatorNoticeBar: {
    backgroundColor: '#FFF8E1',
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#FFE082',
  },
  operatorNoticeText: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#E65100',
    textAlign: 'center',
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    marginHorizontal: 14,
    marginTop: 10,
    borderRadius: 10,
    paddingHorizontal: 12,
    borderWidth: 1,
    borderColor: '#E0D6CE',
  },
  searchInput: { flex: 1, paddingVertical: 9, fontSize: 14, color: '#333' },
  clearSearchBtn: { padding: 6 },
  listContent: { paddingHorizontal: 14, paddingBottom: 24 },
  quickFilterScroll: { marginTop: 10, marginBottom: 4 },
  filterChip: {
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 20,
    marginRight: 8,
    borderWidth: 1,
    borderColor: '#D7CCC8',
  },
  filterChipDiscountActive: { backgroundColor: '#D32F2F', borderColor: '#D32F2F' },
  filterChipFavActive: { backgroundColor: '#C2185B', borderColor: '#C2185B' },
  filterChipStoreActive: { backgroundColor: '#5D4037', borderColor: '#5D4037' },
  filterChipText: { fontSize: 12, fontWeight: '600', color: '#4E342E' },
  categoryScroll: { marginVertical: 8 },
  categoryTab: {
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 10,
    backgroundColor: '#EFEBE7',
    marginRight: 8,
  },
  categoryTabActive: { backgroundColor: '#6F4E37' },
  categoryTabText: { fontSize: 13, color: '#5D4037', fontWeight: '600' },
  categoryTabTextActive: { color: '#FFFFFF', fontWeight: 'bold' },
  featuredSection: {
    backgroundColor: '#FFF8F0',
    padding: 12,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#FFE0B2',
    marginVertical: 6,
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  sectionTitle: { fontSize: 16, fontWeight: 'bold', color: '#4A3222' },
  sectionHint: { fontSize: 11, color: '#8D6E63', fontStyle: 'italic' },
  featuredCard: {
    width: 145,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 8,
    marginRight: 10,
    elevation: 2,
  },
  featuredImg: { width: '100%', height: 95, borderRadius: 8 },
  featuredBadge: {
    position: 'absolute',
    top: 12,
    left: 12,
    backgroundColor: 'rgba(211, 47, 47, 0.9)',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
  },
  featuredBadgeText: { color: '#FFF', fontSize: 10, fontWeight: 'bold' },
  featuredStore: { fontSize: 10, color: '#8D6E63', marginTop: 6 },
  featuredName: { fontSize: 13, fontWeight: 'bold', color: '#3E2723', marginTop: 2 },
  featuredPrice: { fontSize: 13, fontWeight: 'bold', color: '#D84315', marginTop: 4 },
  productCard: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: 10,
    marginBottom: 12,
    elevation: 2,
  },
  productCardDisabled: { opacity: 0.55 },
  imageWrapper: { position: 'relative' },
  productImage: { width: 92, height: 92, borderRadius: 10 },
  discountBadge: {
    position: 'absolute',
    top: 4,
    left: 4,
    backgroundColor: '#D32F2F',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
  },
  discountBadgeText: { color: '#FFF', fontSize: 10, fontWeight: 'bold' },
  outOfStockOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.55)',
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  outOfStockText: {
    color: '#FFF',
    fontSize: 10,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  productInfo: { flex: 1, marginLeft: 12, justifyContent: 'space-between' },
  storeRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  storeTag: { fontSize: 11, color: '#795548', fontWeight: '600', flex: 1 },
  favIcon: { fontSize: 16 },
  productName: { fontSize: 15, fontWeight: 'bold', color: '#3E2723' },
  metaText: { fontSize: 12, color: '#757575' },
  priceRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 4,
  },
  currentPrice: { fontSize: 15, fontWeight: 'bold', color: '#D84315' },
  oldPrice: {
    fontSize: 12,
    color: '#9E9E9E',
    textDecorationLine: 'line-through',
  },
  addMiniBtn: {
    backgroundColor: '#6F4E37',
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 8,
  },
  addMiniBtnText: { color: '#FFF', fontSize: 12, fontWeight: 'bold' },
  emptyBox: { padding: 30, alignItems: 'center' },
  emptyText: { color: '#8D6E63', fontSize: 14, textAlign: 'center' },
});