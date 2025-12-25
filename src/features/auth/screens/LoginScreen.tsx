import React, { useState, useContext } from 'react';
import { View, TextInput, Button, StyleSheet, Text, Alert } from 'react-native';
import { AuthContext } from '../../../store/AuthContext';
import { loginApi } from '../authService';
import { AuthResponse } from '../../../types/auth';

const LoginScreen = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const authContext = useContext(AuthContext);

  if (!authContext) {
    return null;
  }

  const { login } = authContext;

  const handleLogin = async () => {
    try {
      const data: AuthResponse = await loginApi(email, password);
      if (data.token) {
        // Truyền token, refreshToken và userData vào login function
        await login(data.token, data.refreshToken, data.user);
      } else {
        Alert.alert("Lỗi", "Không nhận được token từ server!");
      }
    } catch (error: any) {
      const errorMessage = error?.message || error?.response?.data?.message || "Đăng nhập thất bại. Kiểm tra lại Backend!";
      Alert.alert("Lỗi", errorMessage);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.logo}>EXPENSE APP</Text>
      <TextInput placeholder="Email" style={styles.input} onChangeText={setEmail} />
      <TextInput placeholder="Mật khẩu" style={styles.input} secureTextEntry onChangeText={setPassword} />
      <Button title="Đăng Nhập" onPress={handleLogin} />
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', padding: 20 },
  logo: { fontSize: 30, fontWeight: 'bold', textAlign: 'center', marginBottom: 40 },
  input: { borderBottomWidth: 1, marginBottom: 20, padding: 10 }
});

export default LoginScreen;