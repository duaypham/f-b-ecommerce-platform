import React, { createContext, useState, useEffect, useContext } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { apiClient, API_ENDPOINTS } from '../constants/api';
import { FALLBACK_PRODUCTS, FALLBACK_VOUCHERS } from '../constants/data';

const AppContext = createContext();

export const AppProvider = ({ children }) => {
  const [currentUser, setCurrentUser] = useState(null);
  const [products, setProducts] = useState([]);
  const [stores, setStores] = useState([]);
  const [warnings, setWarnings] = useState([]);
  const [vouchers, setVouchers] = useState([]);
  const [orders, setOrders] = useState([]);
  const [reviews, setReviews] = useState([]);
  const [cart, setCart] = useState([]);
  const [favorites, setFavorites] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadLocalStorage();
    fetchAllData();
  }, []);

  const loadLocalStorage = async () => {
    try {
      const savedUser = await AsyncStorage.getItem('@currentUser');
      const savedCart = await AsyncStorage.getItem('@guestCart');
      const savedFavs = await AsyncStorage.getItem('@favorites');

      if (savedUser) setCurrentUser(JSON.parse(savedUser));
      if (savedCart) setCart(JSON.parse(savedCart));
      if (savedFavs) setFavorites(JSON.parse(savedFavs));
    } catch (error) {
      console.log('Lỗi đọc AsyncStorage:', error.message);
    }
  };

  const syncCartToStorage = async (newCart) => {
    setCart(newCart);
    try {
      await AsyncStorage.setItem('@guestCart', JSON.stringify(newCart));
    } catch (e) {
      console.log('Lỗi lưu giỏ hàng:', e.message);
    }
  };

  // 1. ĐỒNG BỘ DỮ LIỆU TỪ MYSQL XAMPP
  const fetchAllData = async () => {
    setLoading(true);
    try {
      const [prodRes, voucherRes, orderRes, reviewRes] = await Promise.all([
        apiClient.get(API_ENDPOINTS.PRODUCTS),
        apiClient.get(API_ENDPOINTS.VOUCHERS),
        apiClient.get(API_ENDPOINTS.ORDERS),
        apiClient.get(API_ENDPOINTS.REVIEWS),
      ]);

      if (prodRes.data?.success) {
        setProducts(prodRes.data.products || []);
        setStores(prodRes.data.stores || []);
        setWarnings(prodRes.data.warnings || []);
      }
      if (voucherRes.data?.success) {
        setVouchers(voucherRes.data.vouchers || []);
      }
      if (orderRes.data?.success) {
        setOrders(orderRes.data.orders || []);
      }
      if (reviewRes.data?.success) {
        setReviews(reviewRes.data.reviews || []);
      }
    } catch (error) {
      console.log('Không kết nối được XAMPP, dùng dữ liệu dự phòng:', error.message);
      if (products.length === 0) setProducts(FALLBACK_PRODUCTS);
      if (vouchers.length === 0) setVouchers(FALLBACK_VOUCHERS);
    } finally {
      setLoading(false);
    }
  };

  // 2. XÁC THỰC & 4 PHÂN QUYỀN (CUSTOMER, VENDOR, SHIPPER, ADMIN)
  const login = async (username, password) => {
    try {
      const res = await apiClient.post(API_ENDPOINTS.AUTH, {
        action: 'login',
        username,
        password,
      });
      if (res.data?.success) {
        setCurrentUser(res.data.user);
        await AsyncStorage.setItem('@currentUser', JSON.stringify(res.data.user));
        return { success: true, user: res.data.user };
      }
      return { success: false, message: res.data?.message || 'Đăng nhập thất bại' };
    } catch (error) {
      return {
        success: false,
        message: 'Không thể kết nối máy chủ XAMPP (Cổng 8080). Vui lòng kiểm tra Apache & MySQL!',
      };
    }
  };

  const register = async (payload) => {
    try {
      const res = await apiClient.post(API_ENDPOINTS.AUTH, {
        action: 'register',
        ...payload,
      });
      if (res.data?.success) {
        setCurrentUser(res.data.user);
        await AsyncStorage.setItem('@currentUser', JSON.stringify(res.data.user));
        await fetchAllData();
        return { success: true, user: res.data.user };
      }
      return { success: false, message: res.data?.message || 'Đăng ký thất bại' };
    } catch (error) {
      return { success: false, message: 'Lỗi kết nối XAMPP khi đăng ký tài khoản!' };
    }
  };

  const updateProfile = async (payload) => {
    try {
      const res = await apiClient.post(API_ENDPOINTS.AUTH, {
        action: 'update_profile',
        ...payload,
      });
      if (res.data?.success) {
        setCurrentUser(res.data.user);
        await AsyncStorage.setItem('@currentUser', JSON.stringify(res.data.user));
        return { success: true, message: res.data.message };
      }
      return { success: false, message: res.data?.message || 'Cập nhật thất bại' };
    } catch (error) {
      return { success: false, message: 'Lỗi kết nối máy chủ khi cập nhật hồ sơ!' };
    }
  };

  const logout = async () => {
    setCurrentUser(null);
    await AsyncStorage.removeItem('@currentUser');
  };

  // 3. DANH SÁCH YÊU THÍCH
  const toggleFavorite = async (productId) => {
    const exists = favorites.includes(productId);
    const updated = exists
      ? favorites.filter((id) => id !== productId)
      : [...favorites, productId];
    setFavorites(updated);
    await AsyncStorage.setItem('@favorites', JSON.stringify(updated));
  };

  // 4. QUẢN LÝ GIỎ HÀNG
  const addToCart = (item) => {
    const toppingsKey = (item.toppings || []).slice().sort().join(',');
    const signature = `${item.productId}_${item.size}_${item.sugar}_${item.ice}_${toppingsKey}`;

    const existingIndex = cart.findIndex((c) => c.signature === signature);
    let updatedCart = [...cart];

    if (existingIndex > -1) {
      updatedCart[existingIndex].quantity += item.quantity;
      updatedCart[existingIndex].totalPrice =
        updatedCart[existingIndex].quantity * updatedCart[existingIndex].unitPrice;
    } else {
      updatedCart.push({
        ...item,
        cartItemId: Date.now().toString() + Math.random().toString(36).substring(2, 6),
        signature,
      });
    }
    syncCartToStorage(updatedCart);
  };

  const updateCartQuantity = (cartItemId, delta) => {
    const updatedCart = cart
      .map((item) => {
        if (item.cartItemId === cartItemId) {
          const newQty = item.quantity + delta;
          if (newQty <= 0) return null;
          return {
            ...item,
            quantity: newQty,
            totalPrice: newQty * item.unitPrice,
          };
        }
        return item;
      })
      .filter(Boolean);
    syncCartToStorage(updatedCart);
  };

  const removeFromCart = (cartItemId) => {
    const updatedCart = cart.filter((item) => item.cartItemId !== cartItemId);
    syncCartToStorage(updatedCart);
  };

  const clearCart = () => {
    syncCartToStorage([]);
  };

  const reOrder = (oldItems) => {
    if (!Array.isArray(oldItems) || oldItems.length === 0) return;
    let updatedCart = [...cart];
    oldItems.forEach((item) => {
      updatedCart.push({
        ...item,
        cartItemId: Date.now().toString() + Math.random().toString(36).substring(2, 6),
        signature: `${item.productId}_${item.size}_${item.sugar}_${item.ice}_${(item.toppings || []).join(',')}`,
      });
    });
    syncCartToStorage(updatedCart);
  };

  // 5. ĐẶT HÀNG & LUỒNG SHIPPER / CỬA HÀNG CẬP NHẬT TRẠNG THÁI
  const createOrder = async (orderPayload) => {
    try {
      const res = await apiClient.post(API_ENDPOINTS.ORDERS, {
        action: 'create',
        ...orderPayload,
      });
      if (res.data?.success) {
        clearCart();
        await fetchAllData();
        return { success: true, orderCode: res.data.orderCode };
      }
      return { success: false, message: res.data?.message || 'Không thể tạo đơn hàng' };
    } catch (error) {
      return { success: false, message: 'Lỗi kết nối XAMPP khi tạo đơn hàng!' };
    }
  };

  const updateOrderStatus = async (orderCode, status, shipperInfo = null) => {
    try {
      const payload = {
        action: 'update_status',
        orderCode,
        status,
      };
      if (shipperInfo) {
        payload.shipper_username = shipperInfo.username;
        payload.shipperName = shipperInfo.fullName;
      }
      const res = await apiClient.post(API_ENDPOINTS.ORDERS, payload);
      if (res.data?.success) {
        await fetchAllData();
        return { success: true, message: res.data.message };
      }
      return { success: false, message: res.data?.message };
    } catch (error) {
      return { success: false, message: 'Lỗi kết nối khi cập nhật trạng thái đơn!' };
    }
  };

  // 6. VENDOR CRUD SẢN PHẨM & ADMIN GỬI CẢNH CÁO VI PHẠM
  const saveProduct = async (productPayload) => {
    try {
      const res = await apiClient.post(API_ENDPOINTS.PRODUCTS, {
        action: 'save',
        role: currentUser?.role || 'vendor',
        ...productPayload,
      });
      if (res.data?.success) {
        await fetchAllData();
        return { success: true, message: res.data.message };
      }
      return { success: false, message: res.data?.message };
    } catch (error) {
      return { success: false, message: 'Lỗi kết nối máy chủ khi lưu sản phẩm!' };
    }
  };

  const toggleProductAvailability = async (id, isAvailable) => {
    try {
      const res = await apiClient.post(API_ENDPOINTS.PRODUCTS, {
        action: 'toggle_availability',
        role: currentUser?.role || 'vendor',
        id,
        isAvailable,
      });
      if (res.data?.success) {
        await fetchAllData();
        return { success: true };
      }
      return { success: false, message: res.data?.message };
    } catch (error) {
      return { success: false };
    }
  };

  const deleteProduct = async (id, reason = '') => {
    try {
      const res = await apiClient.post(API_ENDPOINTS.PRODUCTS, {
        action: 'delete',
        role: currentUser?.role || 'vendor',
        id,
        reason,
      });
      if (res.data?.success) {
        await fetchAllData();
        return { success: true, message: res.data.message };
      }
      return { success: false, message: res.data?.message };
    } catch (error) {
      return { success: false, message: 'Lỗi khi xóa sản phẩm!' };
    }
  };

  const sendWarningToStore = async ({ store_id, product_name, message }) => {
    try {
      const res = await apiClient.post(API_ENDPOINTS.PRODUCTS, {
        action: 'send_warning',
        store_id,
        product_name,
        message,
      });
      if (res.data?.success) {
        await fetchAllData();
        return { success: true, message: res.data.message };
      }
      return { success: false, message: res.data?.message };
    } catch (error) {
      return { success: false, message: 'Lỗi kết nối khi gửi cảnh cáo!' };
    }
  };

  const resolveStoreWarning = async (id) => {
    try {
      const res = await apiClient.post(API_ENDPOINTS.PRODUCTS, {
        action: 'resolve_warning',
        id,
      });
      if (res.data?.success) {
        await fetchAllData();
        return { success: true };
      }
      return { success: false };
    } catch (error) {
      return { success: false };
    }
  };

  // 7. QUẢN LÝ MÃ GIẢM GIÁ (VOUCHER TOÀN SÀN & VOUCHER CỬA HÀNG)
  const saveVoucher = async (voucherPayload) => {
    try {
      const res = await apiClient.post(API_ENDPOINTS.VOUCHERS, {
        action: 'save',
        ...voucherPayload,
      });
      if (res.data?.success) {
        await fetchAllData();
        return { success: true, message: res.data.message };
      }
      return { success: false, message: res.data?.message };
    } catch (error) {
      return { success: false, message: 'Lỗi kết nối khi lưu mã giảm giá!' };
    }
  };

  const deleteVoucher = async (id) => {
    try {
      const res = await apiClient.post(API_ENDPOINTS.VOUCHERS, {
        action: 'delete',
        id,
      });
      if (res.data?.success) {
        await fetchAllData();
        return { success: true, message: res.data.message };
      }
      return { success: false, message: res.data?.message };
    } catch (error) {
      return { success: false, message: 'Lỗi khi xóa mã giảm giá!' };
    }
  };

  // 8. ĐÁNH GIÁ SẢN PHẨM SAU KHI MUA (VERIFIED REVIEW)
  const getEligibleOrderForReview = (productId) => {
    if (!currentUser) return null;
    const completedOrders = orders.filter(
      (o) =>
        o.username === currentUser.username &&
        o.status === 'Hoàn tất' &&
        Array.isArray(o.items) &&
        o.items.some((item) => Number(item.productId) === Number(productId))
    );

    for (const ord of completedOrders) {
      const alreadyReviewed = reviews.some(
        (r) =>
          r.orderCode === ord.orderCode &&
          Number(r.product_id) === Number(productId) &&
          r.username === currentUser.username
      );
      if (!alreadyReviewed) {
        return ord.orderCode;
      }
    }
    return null;
  };

  const addReview = async ({ orderCode, product_id, rating, comment }) => {
    if (!currentUser) {
      return { success: false, message: 'Vui lòng đăng nhập để đánh giá!' };
    }
    try {
      const res = await apiClient.post(API_ENDPOINTS.REVIEWS, {
        action: 'add',
        orderCode,
        product_id,
        username: currentUser.username,
        fullName: currentUser.fullName,
        rating,
        comment,
      });
      if (res.data?.success) {
        await fetchAllData();
        return { success: true, message: res.data.message };
      }
      return { success: false, message: res.data?.message };
    } catch (error) {
      return { success: false, message: 'Lỗi kết nối khi gửi đánh giá!' };
    }
  };

  return (
    <AppContext.Provider
      value={{
        currentUser,
        products,
        stores,
        warnings,
        vouchers,
        orders,
        reviews,
        cart,
        favorites,
        loading,
        fetchAllData,
        login,
        register,
        updateProfile,
        logout,
        toggleFavorite,
        addToCart,
        updateCartQuantity,
        removeFromCart,
        clearCart,
        reOrder,
        createOrder,
        updateOrderStatus,
        saveProduct,
        toggleProductAvailability,
        deleteProduct,
        sendWarningToStore,
        resolveStoreWarning,
        saveVoucher,
        deleteVoucher,
        getEligibleOrderForReview,
        addReview,
      }}
    >
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => useContext(AppContext);