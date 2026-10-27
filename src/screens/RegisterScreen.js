import React, { useState } from 'react';
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

export default function RegisterScreen({ navigation, route }) {
  const { register } = useApp();
  const redirectTo = route.params?.redirectTo || 'Home';

  // Mặc định chọn luồng Khách hàng ('customer' | 'vendor' | 'shipper')
  const [role, setRole] = useState('customer');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [storeName, setStoreName] = useState('');
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState('');
  const [loadingGps, setLoadingGps] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const handleGetRealGPS = async () => {
    setLoadingGps(true);
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        setAddress('120 Võ Thị Sáu, P. Thống Nhất, TP. Biên Hòa, Đồng Nai');
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

      if (
        !formatted ||
        formatted.includes('Mountain View') ||
        formatted.includes('Amphitheatre') ||
        formatted.includes('California')
        ) {
          setAddress('120 Võ Thị Sáu, P. Thống Nhất, TP. Biên Hòa, Đồng Nai');
        } else {
          setAddress(formatted);
        }
      } else {
        setAddress('120 Võ Thị Sáu, P. Thống Nhất, TP. Biên Hòa, Đồng Nai');
      }
    } catch (error) {
      setAddress('120 Võ Thị Sáu, P. Thống Nhất, TP. Biên Hòa, Đồng Nai');
    } finally {
      setLoadingGps(false);
    }
  };

  const handleRegister = async () => {
    if (!username.trim() || !password.trim() || !fullName.trim() || !phone.trim()) {
      Alert.alert(
        'Thiếu thông tin',
        'Vui lòng điền đầy đủ Tên đăng nhập, Mật khẩu, Họ tên và Số điện thoại!'
      );
      return;
    }

    if (role === 'vendor' && !storeName.trim()) {
      Alert.alert(
        'Thiếu tên quán',
        'Vui lòng nhập Tên cửa hàng / Thương hiệu để mở gian hàng trên sàn!'
      );
      return;
    }

    setSubmitting(true);
    const res = await register({
      username: username.trim(),
      password: password.trim(),
      fullName: fullName.trim(),
      phone: phone.trim(),
      address: address.trim() || 'TP. Biên Hòa, Đồng Nai',
      role,
      storeName: role === 'vendor' ? storeName.trim() : '',
    });
    setSubmitting(false);

    if (res.success) {
      const userRole = res.user.role;
      const targetScreen = userRole === 'customer' ? redirectTo : 'Admin';
      Alert.alert(
        'Đăng ký thành công!',
        `Tài khoản @${res.user.username} (${userRole.toUpperCase()}) đã được kích hoạt.`
     );
      navigation.replace(targetScreen);
    } else {
      Alert.alert('Lỗi đăng ký', res.message);
    }
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <View style={styles.card}>
        <Text style={styles.title}>Tạo Tài Khoản Mới</Text>
        <Text style={styles.subtitle}>Chọn loại tài khoản bạn muốn đăng ký trên sàn</Text>

        {/* Thanh chọn đủ 3 phân quyền: Khách hàng - Mở quán - Tài xế */}
        <View style={styles.roleSwitch}>
          <TouchableOpacity
            style={[styles.roleOption, role === 'customer' && styles.roleActive]}
            onPress={() => setRole('customer')}
          >
            <Text style={[styles.roleText, role === 'customer' && styles.roleTextActive]}>
              👤 Khách hàng
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.roleOption, role === 'vendor' && styles.roleActive]}
            onPress={() => setRole('vendor')}
          >
            <Text style={[styles.roleText, role === 'vendor' && styles.roleTextActive]}>
              🏪 Mở quán
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.roleOption, role === 'shipper' && styles.roleActive]}
            onPress={() => setRole('shipper')}
          >
            <Text style={[styles.roleText, role === 'shipper' && styles.roleTextActive]}>
              🛵 Tài xế Ship
            </Text>
          </TouchableOpacity>
        </View>

        <Text style={styles.label}>Tên đăng nhập (*)</Text>
        <TextInput
          style={styles.input}
          placeholder="VD: ngocduy99"
          value={username}
          onChangeText={setUsername}
          autoCapitalize="none"
        />

        <Text style={styles.label}>Mật khẩu (*)</Text>
        <TextInput
          style={styles.input}
          placeholder="Nhập mật khẩu từ 6 ký tự"
          value={password}
          onChangeText={setPassword}
          secureTextEntry
        />

        <Text style={styles.label}>Họ và tên (*)</Text>
        <TextInput
          style={styles.input}
          placeholder="VD: Phạm Ngọc Duy"
          value={fullName}
          onChangeText={setFullName}
        />

        {role === 'vendor' && (
          <>
            <Text style={styles.label}>Tên Cửa hàng / Thương hiệu trên sàn (*)</Text>
            <TextInput
              style={[styles.input, { borderColor: '#E65100', backgroundColor: '#FFF8F2' }]}
              placeholder="VD: Trà Sữa Phúc Long Biên Hòa"
              value={storeName}
              onChangeText={setStoreName}
            />
          </>
        )}

        <Text style={styles.label}>Số điện thoại liên hệ (*)</Text>
        <TextInput
          style={styles.input}
          placeholder="VD: 0987654321"
          value={phone}
          onChangeText={setPhone}
          keyboardType="phone-pad"
        />

        <Text style={styles.label}>
          {role === 'vendor'
            ? 'Địa chỉ Cửa hàng (Nhập tay hoặc bấm GPS)'
            : role === 'shipper'
            ? 'Khu vực hoạt động (Nhập tay hoặc bấm GPS)'
            : 'Địa chỉ Giao hàng mặc định (Nhập tay hoặc bấm GPS)'}
        </Text>
        <TextInput
          style={styles.input}
          placeholder="Nhập địa chỉ hoặc bấm nút định vị GPS bên dưới"
          value={address}
          onChangeText={setAddress}
        />

        <TouchableOpacity
          style={styles.gpsBtn}
          onPress={handleGetRealGPS}
          disabled={loadingGps}
        >
          {loadingGps ? (
            <ActivityIndicator size="small" color="#FFF" />
          ) : (
            <Text style={styles.gpsBtnText}>📍 Lấy tọa độ GPS hiện tại</Text>
          )}
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.submitBtn}
          onPress={handleRegister}
          disabled={submitting}
        >
          {submitting ? (
            <ActivityIndicator color="#FFF" />
          ) : (
            <Text style={styles.submitBtnText}>
              {role === 'vendor'
                ? 'ĐĂNG KÝ MỞ CỬA HÀNG'
                : role === 'shipper'
                ? 'ĐĂNG KÝ TÀI XẾ GIAO HÀNG'
                : 'ĐĂNG KÝ TÀI KHOẢN KHÁCH HÀNG'}
            </Text>
          )}
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F7F3F0' },
  content: { padding: 16 },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 20,
    elevation: 3,
  },
  title: { fontSize: 20, fontWeight: 'bold', color: '#4A3222', textAlign: 'center' },
  subtitle: {
    fontSize: 13,
    color: '#7D6E63',
    textAlign: 'center',
    marginTop: 4,
    marginBottom: 16,
  },
  roleSwitch: {
    flexDirection: 'row',
    backgroundColor: '#EFEBE7',
    borderRadius: 10,
    padding: 4,
    marginBottom: 14,
    gap: 4,
  },
  roleOption: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  roleActive: { backgroundColor: '#6F4E37' },
  roleText: { fontSize: 12, fontWeight: '600', color: '#5D4037' },
  roleTextActive: { color: '#FFFFFF', fontWeight: 'bold' },
  label: { fontSize: 13, fontWeight: '600', color: '#4A3222', marginBottom: 6, marginTop: 10 },
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
  submitBtn: {
    backgroundColor: '#6F4E37',
    borderRadius: 10,
    paddingVertical: 14,
    alignItems: 'center',
    marginTop: 22,
  },
  submitBtnText: { color: '#FFFFFF', fontSize: 14, fontWeight: 'bold' },
});