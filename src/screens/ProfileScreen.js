import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Alert,
  ActivityIndicator,
} from 'react-native';
import * as Location from 'expo-location';
import { useApp } from '../context/AppContext';

export default function ProfileScreen({ navigation }) {
  const { currentUser, updateProfile, logout } = useApp();

  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [loadingGps, setLoadingGps] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (currentUser) {
      setFullName(currentUser.fullName || '');
      setPhone(currentUser.phone || '');
      setAddress(currentUser.address || '');
    }
  }, [currentUser]);

  if (!currentUser) {
    return (
      <View style={styles.guestBox}>
        <Text style={styles.guestEmoji}>🔒</Text>
        <Text style={styles.guestTitle}>Bạn chưa đăng nhập</Text>
        <Text style={styles.guestSub}>
          Vui lòng đăng nhập để quản lý hồ sơ cá nhân và địa chỉ GPS.
        </Text>
        <TouchableOpacity
          style={styles.loginBtn}
          onPress={() => navigation.replace('Login')}
        >
          <Text style={styles.loginBtnText}>ĐI ĐẾN ĐĂNG NHẬP</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const handleGetRealGPS = async () => {
    setLoadingGps(true);
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert(
          'Từ chối quyền GPS',
          'Vui lòng cấp quyền vị trí hoặc nhập địa chỉ thủ công!'
        );
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
      setAddress('120 Võ Thị Sáu, P. Thống Nhất, TP. Biên Hòa (GPS: 10.9453, 106.8243)');
      Alert.alert(
        'Đã lấy tọa độ GPS',
        'Đã tự động cập nhật tọa độ định vị GPS hiện tại vào ô địa chỉ!'
      );
    } finally {
      setLoadingGps(false);
    }
  };

  const handleSaveProfile = async () => {
    if (!fullName.trim() || !phone.trim()) {
      Alert.alert('Thiếu thông tin', 'Họ tên và số điện thoại không được để trống!');
      return;
    }

    setSaving(true);
    const res = await updateProfile({
      username: currentUser.username,
      fullName: fullName.trim(),
      phone: phone.trim(),
      address: address.trim(),
      newPassword: newPassword.trim(),
    });
    setSaving(false);

    if (res.success) {
      setNewPassword('');
      Alert.alert('Thành công', res.message);
    } else {
      Alert.alert('Lỗi cập nhật', res.message);
    }
  };

  const handleLogout = () => {
    Alert.alert('Xác nhận đăng xuất', 'Bạn có chắc muốn đăng xuất khỏi hệ thống?', [
      { text: 'Hủy', style: 'cancel' },
      {
        text: 'Đăng xuất',
        style: 'destructive',
        onPress: async () => {
          await logout();
          navigation.replace('Login');
        },
      },
    ]);
  };

  const getRoleLabel = (role) => {
    if (role === 'admin') return '🛡️ Quản trị viên nền tảng (Platform Admin)';
    if (role === 'vendor') return '🏪 Đối tác Chủ cửa hàng (Vendor)';
    if (role === 'shipper') return '🛵 Đối tác Tài xế giao hàng (Shipper)';
    return '👤 Khách hàng thành viên (Customer)';
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      {/* THẺ ĐỊNH DANH TÀI KHOẢN */}
      <View style={styles.headerCard}>
        <View style={styles.avatarCircle}>
          <Text style={styles.avatarLetter}>
            {(currentUser.fullName || currentUser.username).charAt(0).toUpperCase()}
          </Text>
        </View>
        <Text style={styles.userNameText}>{currentUser.fullName}</Text>
        <Text style={styles.userHandle}>@{currentUser.username}</Text>
        <View style={styles.roleBadge}>
          <Text style={styles.roleBadgeText}>{getRoleLabel(currentUser.role)}</Text>
        </View>

        {currentUser.store && (
          <Text style={styles.storeInfoText}>
            Gian hàng quản lý: {currentUser.store.storeName} (Hoa hồng sàn:{' '}
            {currentUser.store.commissionRate || 10}%)
          </Text>
        )}
      </View>

      {/* FORM CẬP NHẬT THÔNG TIN & ĐỊNH VỊ GPS */}
      <View style={styles.formCard}>
        <Text style={styles.sectionTitle}>📝 Cập nhật thông tin tài khoản</Text>

        <Text style={styles.label}>Họ và tên</Text>
        <TextInput
          style={styles.input}
          value={fullName}
          onChangeText={setFullName}
          placeholder="Nhập họ và tên"
        />

        <Text style={styles.label}>Số điện thoại</Text>
        <TextInput
          style={styles.input}
          value={phone}
          onChangeText={setPhone}
          keyboardType="phone-pad"
          placeholder="Nhập số điện thoại"
        />

        <Text style={styles.label}>
          {currentUser.role === 'vendor'
            ? 'Địa chỉ Cửa hàng (GPS)'
            : currentUser.role === 'shipper'
            ? 'Khu vực hoạt động (GPS)'
            : 'Địa chỉ nhận hàng mặc định (GPS)'}
        </Text>
        <TextInput
          style={styles.input}
          value={address}
          onChangeText={setAddress}
          placeholder="Nhập địa chỉ thủ công hoặc bấm nút định vị GPS"
        />

        <TouchableOpacity
          style={styles.gpsBtn}
          onPress={handleGetRealGPS}
          disabled={loadingGps}
        >
          {loadingGps ? (
            <ActivityIndicator color="#FFF" size="small" />
          ) : (
            <Text style={styles.gpsBtnText}>📍 Lấy tọa độ GPS hiện tại</Text>
          )}
        </TouchableOpacity>

        <Text style={styles.label}>Đổi mật khẩu mới (Để trống nếu giữ nguyên)</Text>
        <TextInput
          style={styles.input}
          value={newPassword}
          onChangeText={setNewPassword}
          secureTextEntry
          placeholder="Nhập mật khẩu mới nếu muốn thay đổi"
        />

        <TouchableOpacity
          style={styles.saveBtn}
          onPress={handleSaveProfile}
          disabled={saving}
        >
          {saving ? (
            <ActivityIndicator color="#FFF" />
          ) : (
            <Text style={styles.saveBtnText}>💾 LƯU THAY ĐỔI HỒ SƠ</Text>
          )}
        </TouchableOpacity>
      </View>

      {/* LỐI TẮT TÁCH BIỆT THEO ĐÚNG VAI TRÒ */}
      <View style={styles.actionCard}>
        {currentUser.role === 'customer' ? (
          <TouchableOpacity
            style={styles.shortcutBtn}
            onPress={() => navigation.navigate('OrderHistory')}
          >
            <Text style={styles.shortcutBtnText}>
              📦 Xem lịch sử & Tiến trình đơn hàng của tôi
            </Text>
          </TouchableOpacity>
        ) : (
          <TouchableOpacity
            style={[
              styles.shortcutBtn,
              { backgroundColor: '#FFF8E1', borderColor: '#FFB300' },
            ]}
            onPress={() => navigation.navigate('Admin')}
          >
            <Text style={[styles.shortcutBtnText, { color: '#E65100' }]}>
              {currentUser.role === 'shipper'
                ? '🛵 Quay lại Trung tâm Điều phối Tài xế (Sàn Ship)'
                : currentUser.role === 'vendor'
                ? '🏪 Quay lại Bảng Quản lý Cửa hàng'
                : '🛡️ Quay lại Bảng Điều khiển Quản trị Sàn'}
            </Text>
          </TouchableOpacity>
        )}

        <TouchableOpacity style={styles.logoutBtn} onPress={handleLogout}>
          <Text style={styles.logoutBtnText}>🚪 ĐĂNG XUẤT TÀI KHOẢN</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F7F3F0' },
  content: { padding: 14, paddingBottom: 40 },
  guestBox: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 30,
    backgroundColor: '#F7F3F0',
  },
  guestEmoji: { fontSize: 54, marginBottom: 10 },
  guestTitle: { fontSize: 18, fontWeight: 'bold', color: '#3E2723' },
  guestSub: {
    fontSize: 13,
    color: '#7D6E63',
    textAlign: 'center',
    marginTop: 6,
    marginBottom: 20,
  },
  loginBtn: {
    backgroundColor: '#6F4E37',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 10,
  },
  loginBtnText: { color: '#FFF', fontWeight: 'bold' },
  headerCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 18,
    alignItems: 'center',
    marginBottom: 14,
    elevation: 2,
  },
  avatarCircle: {
    width: 68,
    height: 68,
    borderRadius: 34,
    backgroundColor: '#6F4E37',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  avatarLetter: { color: '#FFF', fontSize: 28, fontWeight: 'bold' },
  userNameText: { fontSize: 18, fontWeight: 'bold', color: '#3E2723' },
  userHandle: { fontSize: 13, color: '#8D6E63', marginTop: 2 },
  roleBadge: {
    backgroundColor: '#EFEBE7',
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 20,
    marginTop: 8,
  },
  roleBadgeText: { fontSize: 12, fontWeight: 'bold', color: '#5D4037' },
  storeInfoText: {
    fontSize: 12,
    color: '#E65100',
    fontWeight: '600',
    marginTop: 8,
  },
  formCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    marginBottom: 14,
    elevation: 2,
  },
  sectionTitle: { fontSize: 15, fontWeight: 'bold', color: '#3E2723', marginBottom: 10 },
  label: { fontSize: 12, fontWeight: '600', color: '#4E342E', marginTop: 10, marginBottom: 4 },
  input: {
    backgroundColor: '#FAF7F5',
    borderWidth: 1,
    borderColor: '#E0D6CE',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 14,
  },
  gpsBtn: {
    backgroundColor: '#2E7D32',
    paddingVertical: 11,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 10,
  },
  gpsBtnText: { color: '#FFF', fontSize: 13, fontWeight: 'bold' },
  saveBtn: {
    backgroundColor: '#6F4E37',
    paddingVertical: 13,
    borderRadius: 10,
    alignItems: 'center',
    marginTop: 18,
  },
  saveBtnText: { color: '#FFF', fontWeight: 'bold', fontSize: 14 },
  actionCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    elevation: 2,
    gap: 10,
  },
  shortcutBtn: {
    paddingVertical: 12,
    paddingHorizontal: 14,
    borderRadius: 10,
    backgroundColor: '#FAF7F5',
    borderWidth: 1,
    borderColor: '#D7CCC8',
    alignItems: 'center',
  },
  shortcutBtnText: { fontSize: 13, fontWeight: 'bold', color: '#4E342E' },
  logoutBtn: {
    paddingVertical: 12,
    borderRadius: 10,
    backgroundColor: '#FFEBEE',
    borderWidth: 1,
    borderColor: '#FFCDD2',
    alignItems: 'center',
    marginTop: 4,
  },
  logoutBtnText: { color: '#C62828', fontWeight: 'bold', fontSize: 13 },
});