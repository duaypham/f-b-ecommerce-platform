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
  const { currentUser, login, updateProfile, logout } = useApp();

  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [loadingGps, setLoadingGps] = useState(false);
  const [saving, setSaving] = useState(false);
  const [switchingRole, setSwitchingRole] = useState(false);

  useEffect(() => {
    if (currentUser) {
      setFullName(currentUser.fullName || '');
      setPhone(currentUser.phone || '');
      setAddress(currentUser.address || '');
    }
  }, [currentUser]);

  const handleQuickSwitch = async (username, password, roleLabel, targetScreen) => {
    if (currentUser?.username === username) {
      Alert.alert('Thông báo', `Đang ở vai trò ${roleLabel}.`);
      return;
    }
    setSwitchingRole(true);
    const res = await login(username, password);
    setSwitchingRole(false);

    if (res.success) {
      if (targetScreen === 'Home') navigation.replace('Home');
      else navigation.replace(targetScreen);
    } else {
      Alert.alert('Lỗi', res.message);
    }
  };

  if (!currentUser) {
    return (
      <View style={styles.guestBox}>
        <Text style={styles.guestEmoji}>🔒</Text>
        <Text style={styles.guestTitle}>Chưa đăng nhập</Text>
        <Text style={styles.guestSub}>
          Vui lòng đăng nhập để quản lý tài khoản và đặt hàng.
        </Text>
        <TouchableOpacity
          style={styles.loginBtn}
          onPress={() => navigation.replace('Login')}
        >
          <Text style={styles.loginBtnText}>ĐĂNG NHẬP</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const handleGetRealGPS = async () => {
    setLoadingGps(true);
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Thông báo', 'Cần cấp quyền truy cập vị trí GPS.');
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
      setAddress('120 Võ Thị Sáu, P. Thống Nhất, TP. Biên Hòa');
    } finally {
      setLoadingGps(false);
    }
  };

  const handleSaveProfile = async () => {
    if (!fullName.trim() || !phone.trim()) {
      Alert.alert('Thiếu thông tin', 'Họ tên và số điện thoại không được để trống.');
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
      Alert.alert('Thành công', 'Đã cập nhật thông tin.');
    } else {
      Alert.alert('Lỗi', res.message);
    }
  };

  const handleLogout = () => {
    Alert.alert('Đăng xuất', 'Xác nhận đăng xuất khỏi tài khoản?', [
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
    if (role === 'admin') return '🛡️ Quản trị viên';
    if (role === 'vendor') return '🏪 Chủ cửa hàng';
    if (role === 'shipper') return '🛵 Tài xế giao hàng';
    return '👤 Khách hàng';
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
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
            Quán: {currentUser.store.storeName}
          </Text>
        )}
      </View>

      <View style={styles.switchCard}>
        <Text style={styles.sectionTitle}>Chuyển vai trò nhanh</Text>
        {switchingRole ? (
          <ActivityIndicator color="#6F4E37" style={{ marginVertical: 12 }} />
        ) : (
          <View style={styles.switchGrid}>
            <TouchableOpacity
              style={[styles.switchBtn, { backgroundColor: '#E8F5E9' }]}
              onPress={() => handleQuickSwitch('khach1', '123456', 'Khách hàng', 'Home')}
            >
              <Text style={[styles.switchBtnText, { color: '#2E7D32' }]}>Khách hàng</Text>
              <Text style={styles.switchSubText}>khach1</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.switchBtn, { backgroundColor: '#FFF3E0' }]}
              onPress={() => handleQuickSwitch('vendor1', '123456', 'Chủ quán', 'Admin')}
            >
              <Text style={[styles.switchBtnText, { color: '#EF6C00' }]}>Chủ quán</Text>
              <Text style={styles.switchSubText}>vendor1</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.switchBtn, { backgroundColor: '#E3F2FD' }]}
              onPress={() => handleQuickSwitch('shipper1', '123456', 'Tài xế', 'Admin')}
            >
              <Text style={[styles.switchBtnText, { color: '#1565C0' }]}>Tài xế</Text>
              <Text style={styles.switchSubText}>shipper1</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.switchBtn, { backgroundColor: '#FCE4EC' }]}
              onPress={() => handleQuickSwitch('admin', '123456', 'Quản trị viên', 'Admin')}
            >
              <Text style={[styles.switchBtnText, { color: '#C2185B' }]}>Admin sàn</Text>
              <Text style={styles.switchSubText}>admin</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>

      <View style={styles.formCard}>
        <Text style={styles.sectionTitle}>Thông tin cá nhân</Text>

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

        <Text style={styles.label}>Địa chỉ</Text>
        <TextInput
          style={styles.input}
          value={address}
          onChangeText={setAddress}
          placeholder="Nhập địa chỉ nhận hàng"
        />

        <TouchableOpacity
          style={styles.gpsBtn}
          onPress={handleGetRealGPS}
          disabled={loadingGps}
        >
          {loadingGps ? (
            <ActivityIndicator color="#FFF" size="small" />
          ) : (
            <Text style={styles.gpsBtnText}>📍 Định vị GPS</Text>
          )}
        </TouchableOpacity>

        <Text style={styles.label}>Mật khẩu mới</Text>
        <TextInput
          style={styles.input}
          value={newPassword}
          onChangeText={setNewPassword}
          secureTextEntry
          placeholder="Để trống nếu không đổi"
        />

        <TouchableOpacity
          style={styles.saveBtn}
          onPress={handleSaveProfile}
          disabled={saving}
        >
          {saving ? (
            <ActivityIndicator color="#FFF" />
          ) : (
            <Text style={styles.saveBtnText}>LƯU THAY ĐỔI</Text>
          )}
        </TouchableOpacity>
      </View>

      <View style={styles.actionCard}>
        {currentUser.role === 'customer' ? (
          <TouchableOpacity
            style={styles.shortcutBtn}
            onPress={() => navigation.navigate('OrderHistory')}
          >
            <Text style={styles.shortcutBtnText}>📦 Đơn hàng của tôi</Text>
          </TouchableOpacity>
        ) : (
          <TouchableOpacity
            style={[styles.shortcutBtn, { backgroundColor: '#FFF8E1', borderColor: '#FFB300' }]}
            onPress={() => navigation.navigate('Admin')}
          >
            <Text style={[styles.shortcutBtnText, { color: '#E65100' }]}>
              {currentUser.role === 'shipper'
                ? '🛵 Bảng giao hàng'
                : currentUser.role === 'vendor'
                ? '🏪 Quản lý quán'
                : '🛡️ Quản trị sàn'}
            </Text>
          </TouchableOpacity>
        )}

        <TouchableOpacity style={styles.logoutBtn} onPress={handleLogout}>
          <Text style={styles.logoutBtnText}>ĐĂNG XUẤT</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F7F3F0' },
  content: { padding: 14, paddingBottom: 36 },
  guestBox: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 30,
    backgroundColor: '#F7F3F0',
  },
  guestEmoji: { fontSize: 44, marginBottom: 10 },
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
    borderRadius: 8,
  },
  loginBtnText: { color: '#FFF', fontWeight: 'bold' },
  headerCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    marginBottom: 12,
    elevation: 2,
  },
  avatarCircle: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#6F4E37',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  avatarLetter: { color: '#FFF', fontSize: 24, fontWeight: 'bold' },
  userNameText: { fontSize: 17, fontWeight: 'bold', color: '#3E2723' },
  userHandle: { fontSize: 12, color: '#8D6E63', marginTop: 2 },
  roleBadge: {
    backgroundColor: '#EFEBE7',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 16,
    marginTop: 6,
  },
  roleBadgeText: { fontSize: 11, fontWeight: 'bold', color: '#5D4037' },
  storeInfoText: { fontSize: 13, color: '#6F4E37', fontWeight: '600', marginTop: 6 },
  switchCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 14,
    marginBottom: 12,
    elevation: 2,
    borderWidth: 1,
    borderColor: '#FFE082',
  },
  switchGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 8 },
  switchBtn: {
    width: '48%',
    paddingVertical: 9,
    paddingHorizontal: 10,
    borderRadius: 8,
  },
  switchBtnText: { fontSize: 12, fontWeight: 'bold' },
  switchSubText: { fontSize: 11, color: '#616161', marginTop: 1 },
  formCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 14,
    marginBottom: 12,
    elevation: 2,
  },
  sectionTitle: { fontSize: 14, fontWeight: 'bold', color: '#3E2723' },
  label: { fontSize: 12, fontWeight: '600', color: '#4E342E', marginTop: 8, marginBottom: 2 },
  input: {
    backgroundColor: '#FAF7F5',
    borderWidth: 1,
    borderColor: '#E0D6CE',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    fontSize: 13,
  },
  gpsBtn: {
    backgroundColor: '#2E7D32',
    paddingVertical: 9,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 8,
  },
  gpsBtnText: { color: '#FFF', fontSize: 12, fontWeight: 'bold' },
  saveBtn: {
    backgroundColor: '#6F4E37',
    paddingVertical: 11,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 14,
  },
  saveBtnText: { color: '#FFF', fontWeight: 'bold', fontSize: 13 },
  actionCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 14,
    elevation: 2,
    gap: 8,
  },
  shortcutBtn: {
    paddingVertical: 11,
    borderRadius: 8,
    backgroundColor: '#FAF7F5',
    borderWidth: 1,
    borderColor: '#D7CCC8',
    alignItems: 'center',
  },
  shortcutBtnText: { fontSize: 13, fontWeight: 'bold', color: '#4E342E' },
  logoutBtn: {
    paddingVertical: 11,
    borderRadius: 8,
    backgroundColor: '#FFEBEE',
    borderWidth: 1,
    borderColor: '#FFCDD2',
    alignItems: 'center',
  },
  logoutBtnText: { color: '#C62828', fontWeight: 'bold', fontSize: 12 },
});