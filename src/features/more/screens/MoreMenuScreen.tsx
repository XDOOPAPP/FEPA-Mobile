import React from 'react';
import {
  View,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
} from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';

type RootStackParamList = {
  MoreMenu: undefined;
  Analytics: undefined;
  ReceiptOCR: undefined;
  DebtTracker: undefined;
};

type Props = NativeStackScreenProps<RootStackParamList, 'MoreMenu'>;

const MoreMenuScreen: React.FC<Props> = ({ navigation }) => {
  const menuItems = [
    {
      id: 'analytics',
      title: 'Phân tích chi tiêu',
      description: 'Biểu đồ chi tiêu theo thời gian',
      icon: '📊',
      route: 'Analytics',
      color: '#4CAF50',
    },
    {
      id: 'ocr',
      title: 'Quét hóa đơn',
      description: 'Quét hóa đơn để tự động nhận dạng',
      icon: '📷',
      route: 'ReceiptOCR',
      color: '#2196F3',
    },
    {
      id: 'debt',
      title: 'Theo dõi nợ',
      description: 'Quản lý khoản nợ và cho vay',
      icon: '💳',
      route: 'DebtTracker',
      color: '#FF9800',
    },
  ];

  return (
    <ScrollView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>Tính năng nâng cao</Text>
        <Text style={styles.subtitle}>
          Những công cụ mạnh mẽ để quản lý tài chính
        </Text>
      </View>

      {/* Menu Items */}
      <View style={styles.menuContainer}>
        {menuItems.map(item => (
          <TouchableOpacity
            key={item.id}
            style={styles.menuCard}
            onPress={() => navigation.navigate(item.route as any)}
          >
            <View style={styles.cardContent}>
              <Text style={[styles.cardIcon, { color: item.color }]}>
                {item.icon}
              </Text>
              <View style={styles.cardText}>
                <Text style={styles.cardTitle}>{item.title}</Text>
                <Text style={styles.cardDescription}>{item.description}</Text>
              </View>
            </View>
            <Text style={styles.arrowIcon}>›</Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Features Grid */}
      <View style={styles.featuresSection}>
        <Text style={styles.sectionTitle}>✨ Tính năng mới sắp ra mắt</Text>

        <View style={styles.featureGrid}>
          <View style={styles.featureCard}>
            <Text style={styles.featureIcon}>🧠</Text>
            <Text style={styles.featureName}>AI Classifier</Text>
            <Text style={styles.featureDesc}>Phân loại chi tiêu tự động</Text>
          </View>

          <View style={styles.featureCard}>
            <Text style={styles.featureIcon}>📈</Text>
            <Text style={styles.featureName}>Dự báo</Text>
            <Text style={styles.featureDesc}>Dự báo chi tiêu tương lai</Text>
          </View>

          <View style={styles.featureCard}>
            <Text style={styles.featureIcon}>💰</Text>
            <Text style={styles.featureName}>Tiết kiệm</Text>
            <Text style={styles.featureDesc}>Mẹo tiết kiệm thông minh</Text>
          </View>

          <View style={styles.featureCard}>
            <Text style={styles.featureIcon}>📊</Text>
            <Text style={styles.featureName}>Báo cáo</Text>
            <Text style={styles.featureDesc}>Báo cáo chi tiêu chi tiết</Text>
          </View>
        </View>
      </View>

      {/* Help Section */}
      <View style={styles.helpSection}>
        <Text style={styles.helpTitle}>❓ Bạn cần giúp đỡ?</Text>
        <TouchableOpacity style={styles.helpButton}>
          <Text style={styles.helpButtonText}>Xem hướng dẫn</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.helpButton}>
          <Text style={styles.helpButtonText}>Liên hệ hỗ trợ</Text>
        </TouchableOpacity>
      </View>

      {/* Bottom Spacing */}
      <View style={{ height: 30 }} />
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5F5',
  },
  header: {
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 10,
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: '#333',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 14,
    color: '#999',
  },
  menuContainer: {
    marginHorizontal: 20,
    marginTop: 20,
    marginBottom: 25,
  },
  menuCard: {
    backgroundColor: '#FFF',
    borderRadius: 12,
    padding: 15,
    marginBottom: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 2,
  },
  cardContent: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
  },
  cardIcon: {
    fontSize: 32,
    marginRight: 15,
  },
  cardText: {
    flex: 1,
  },
  cardTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#333',
    marginBottom: 4,
  },
  cardDescription: {
    fontSize: 12,
    color: '#999',
  },
  arrowIcon: {
    fontSize: 24,
    color: '#DDD',
    marginLeft: 10,
  },
  featuresSection: {
    marginHorizontal: 20,
    marginBottom: 25,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#333',
    marginBottom: 12,
  },
  featureGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  featureCard: {
    width: '48%',
    backgroundColor: '#FFF',
    borderRadius: 10,
    padding: 12,
    alignItems: 'center',
  },
  featureIcon: {
    fontSize: 28,
    marginBottom: 8,
  },
  featureName: {
    fontSize: 12,
    fontWeight: '600',
    color: '#333',
    marginBottom: 4,
  },
  featureDesc: {
    fontSize: 10,
    color: '#999',
    textAlign: 'center',
  },
  helpSection: {
    marginHorizontal: 20,
    backgroundColor: '#E3F2FD',
    borderRadius: 12,
    padding: 16,
  },
  helpTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#1976D2',
    marginBottom: 12,
  },
  helpButton: {
    backgroundColor: '#FFF',
    borderRadius: 8,
    paddingVertical: 10,
    alignItems: 'center',
    marginBottom: 10,
  },
  helpButtonText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#1976D2',
  },
});

export default MoreMenuScreen;
