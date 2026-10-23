import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from 'react-native';
import { useApp } from '../context/AppContext';

export default function LoginScreen({ navigation, route }) {
  const { login } = useApp();
  const redirectTo = route.params?.redirectTo || 'Home';

  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleLogin = async () => {
  if (!username.trim() || !password.trim()) {
    Alert.alert('Thiếu thông tin', 'Vui lòng nhập đầy đủ tên đăng nhập và mật khẩu!');
    return;
  }

  setSubmitting(true);
  const res = await login(username.trim(), password.trim());
  setSubmitting(false);

  if (res.success) {
    const userRole = res.user.role;
    // Khách hàng về trang mua sắm (Home/Cart), còn Admin/Vendor/Shipper vào thẳng Bảng điều khiển
    const targetScreen = userRole === 'customer' ? redirectTo : 'Admin';
    navigation.replace(targetScreen);
  } else {
    Alert.alert('Đăng nhập thất bại', res.message);
  }
};

  const fillDemoAccount = (demoUser, demoPass) => {
    setUsername(demoUser);
    setPassword(demoPass);
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.card}>
          <Text style={styles.brandIcon}>🧋</Text>
          <Text style={styles.title}>Sàn F&B Đa Cửa Hàng</Text>
          <Text style={styles.subtitle}>
            Đồ uống ngon, giao nhanh, giá tốt và nhiều khuyến mãi!
          </Text>

          <Text style={styles.label}>Tên đăng nhập</Text>
          <TextInput
            style={styles.input}
            placeholder="Nhập username"
            value={username}
            onChangeText={setUsername}
            autoCapitalize="none"
          />

          <Text style={styles.label}>Mật khẩu</Text>
          <TextInput
            style={styles.input}
            placeholder="Nhập mật khẩu"
            value={password}
            onChangeText={setPassword}
            secureTextEntry
          />

          <TouchableOpacity
            style={styles.loginBtn}
            onPress={handleLogin}
            disabled={submitting}
          >
            {submitting ? (
              <ActivityIndicator color="#FFF" />
            ) : (
              <Text style={styles.loginBtnText}>ĐĂNG NHẬP</Text>
            )}
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.registerLink}
            onPress={() => navigation.navigate('Register', { redirectTo })}
          >
            <Text style={styles.registerLinkText}>
              Chưa có tài khoản? <Text style={styles.boldText}>Đăng ký ngay</Text>
            </Text>
          </TouchableOpacity>

          <View style={styles.demoSection}>
            <Text style={styles.demoTitle}>Test nhanh: Chọn tài khoản có sẵn</Text>
            <View style={styles.demoRow}>
              <TouchableOpacity
                style={[styles.demoBadge, { backgroundColor: '#E8F5E9' }]}
                onPress={() => fillDemoAccount('khach1', '123456')}
              >
                <Text style={[styles.demoBadgeText, { color: '#2E7D32' }]}>
                  👤 Khách
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.demoBadge, { backgroundColor: '#FFF3E0' }]}
                onPress={() => fillDemoAccount('vendor1', '123456')}
              >
                <Text style={[styles.demoBadgeText, { color: '#EF6C00' }]}>
                  🏪 Quán
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.demoBadge, { backgroundColor: '#E3F2FD' }]}
                onPress={() => fillDemoAccount('shipper1', '123456')}
              >
                <Text style={[styles.demoBadgeText, { color: '#1565C0' }]}>
                  🛵 Shipper
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.demoBadge, { backgroundColor: '#FCE4EC' }]}
                onPress={() => fillDemoAccount('admin', '123456')}
              >
                <Text style={[styles.demoBadgeText, { color: '#C2185B' }]}>
                  🛡️ Admin
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F7F3F0' },
  scrollContent: { flexGrow: 1, justifyContent: 'center', padding: 20 },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 22,
    elevation: 4,
  },
  brandIcon: { fontSize: 48, textAlign: 'center', marginBottom: 6 },
  title: { fontSize: 22, fontWeight: 'bold', color: '#4A3222', textAlign: 'center' },
  subtitle: {
    fontSize: 12,
    color: '#7D6E63',
    textAlign: 'center',
    marginTop: 4,
    marginBottom: 18,
  },
  label: { fontSize: 13, fontWeight: '600', color: '#4A3222', marginBottom: 6, marginTop: 10 },
  input: {
    backgroundColor: '#FAF7F5',
    borderWidth: 1,
    borderColor: '#E0D6CE',
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 11,
    fontSize: 14,
    color: '#333',
  },
  loginBtn: {
    backgroundColor: '#6F4E37',
    borderRadius: 10,
    paddingVertical: 14,
    alignItems: 'center',
    marginTop: 22,
  },
  loginBtnText: { color: '#FFFFFF', fontSize: 16, fontWeight: 'bold' },
  registerLink: { marginTop: 16, alignItems: 'center' },
  registerLinkText: { color: '#6F4E37', fontSize: 14 },
  boldText: { fontWeight: 'bold', textDecorationLine: 'underline' },
  demoSection: {
    marginTop: 22,
    paddingTop: 14,
    borderTopWidth: 1,
    borderTopColor: '#EEE',
  },
  demoTitle: {
    fontSize: 12,
    color: '#666',
    marginBottom: 10,
    textAlign: 'center',
    fontWeight: '600',
  },
  demoRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    gap: 8,
  },
  demoBadge: {
    width: '48%',
    paddingVertical: 9,
    paddingHorizontal: 8,
    borderRadius: 8,
    alignItems: 'center',
  },
  demoBadgeText: { fontSize: 12, fontWeight: 'bold' },
});