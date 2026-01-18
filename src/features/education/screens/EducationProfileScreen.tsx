import React from 'react';
import { View, StyleSheet, Text, TouchableOpacity } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { Colors, Radius, Shadow, Spacing } from '../../../constants/theme';

const EducationProfileScreen: React.FC = () => {
  const navigation = useNavigation<any>();

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Cá nhân & Kiến thức</Text>

      <TouchableOpacity
        style={styles.card}
        onPress={() => navigation.navigate('Profile')}
      >
        <Text style={styles.cardTitle}>Tài khoản</Text>
        <Text style={styles.cardSubtitle}>Xem và chỉnh sửa hồ sơ</Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={styles.card}
        onPress={() => navigation.navigate('Blog')}
      >
        <Text style={styles.cardTitle}>Blog tài chính</Text>
        <Text style={styles.cardSubtitle}>Mẹo tiết kiệm và kiến thức</Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={styles.card}
        onPress={() => navigation.navigate('SecuritySettings')}
      >
        <Text style={styles.cardTitle}>Cài đặt bảo mật</Text>
        <Text style={styles.cardSubtitle}>2FA, Dark Mode, Biometric</Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={styles.cardHighlight}
        onPress={() => navigation.navigate('Premium')}
      >
        <Text style={styles.cardTitle}>Nâng cấp Premium</Text>
        <Text style={styles.cardSubtitle}>Mở khóa tính năng nâng cao</Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
    padding: Spacing.lg,
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
    color: Colors.textPrimary,
    marginBottom: Spacing.md,
  },
  card: {
    backgroundColor: Colors.card,
    borderRadius: Radius.lg,
    padding: Spacing.lg,
    marginBottom: Spacing.md,
    ...Shadow.card,
  },
  cardHighlight: {
    backgroundColor: Colors.primarySoft,
    borderRadius: Radius.lg,
    padding: Spacing.lg,
    marginBottom: Spacing.md,
    ...Shadow.card,
  },
  cardTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: Colors.textPrimary,
  },
  cardSubtitle: {
    fontSize: 12,
    color: Colors.textSecondary,
    marginTop: Spacing.xs,
  },
});

export default EducationProfileScreen;
