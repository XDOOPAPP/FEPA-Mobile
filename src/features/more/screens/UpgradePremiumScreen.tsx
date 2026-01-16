import React, { useState } from 'react';
import {
  View,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  Alert,
} from 'react-native';

const UpgradePremiumScreen: React.FC = () => {
  const [selectedPlan, setSelectedPlan] = useState<'monthly' | 'yearly'>(
    'monthly',
  );

  const handleUpgrade = () => {
    Alert.alert(
      'Nâng cấp Premium',
      `Bạn chọn gói ${
        selectedPlan === 'monthly' ? 'Tháng' : 'Năm'
      }. Vui lòng chuyển hướng tới cổng thanh toán...`,
      [
        { text: 'Hủy', onPress: () => {} },
        {
          text: 'Tiếp tục',
          onPress: () => {
            // TODO: Integrate with payment gateway
            alert('Sẽ được chuyển tới cổng thanh toán');
          },
        },
      ],
    );
  };

  return (
    <ScrollView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>👑 Nâng cấp Premium</Text>
        <Text style={styles.headerSubtitle}>
          Truy cập tất cả tính năng không giới hạn
        </Text>
      </View>

      {/* Benefits */}
      <View style={styles.benefitsSection}>
        <Text style={styles.sectionTitle}>✨ Các lợi ích Premium</Text>

        <View style={styles.benefitItem}>
          <Text style={styles.benefitIcon}>📸</Text>
          <View style={styles.benefitContent}>
            <Text style={styles.benefitTitle}>Quét Hóa Đơn Không Giới Hạn</Text>
            <Text style={styles.benefitDesc}>
              Chụp và xử lý hóa đơn không giới hạn
            </Text>
          </View>
        </View>

        <View style={styles.benefitItem}>
          <Text style={styles.benefitIcon}>🤖</Text>
          <View style={styles.benefitContent}>
            <Text style={styles.benefitTitle}>Trợ Lý AI Thông Minh</Text>
            <Text style={styles.benefitDesc}>
              Nhận gợi ý và phân tích chi tiêu chi tiết
            </Text>
          </View>
        </View>

        <View style={styles.benefitItem}>
          <Text style={styles.benefitIcon}>📖</Text>
          <View style={styles.benefitContent}>
            <Text style={styles.benefitTitle}>Blog Tài Chính Đầy Đủ</Text>
            <Text style={styles.benefitDesc}>
              Truy cập tất cả bài viết giáo dục tài chính
            </Text>
          </View>
        </View>

        <View style={styles.benefitItem}>
          <Text style={styles.benefitIcon}>📊</Text>
          <View style={styles.benefitContent}>
            <Text style={styles.benefitTitle}>Báo Cáo Chi Tiết</Text>
            <Text style={styles.benefitDesc}>
              Phân tích chi tiêu nâng cao và dự báo
            </Text>
          </View>
        </View>

        <View style={styles.benefitItem}>
          <Text style={styles.benefitIcon}>🎯</Text>
          <View style={styles.benefitContent}>
            <Text style={styles.benefitTitle}>Quản Lý Mục Tiêu</Text>
            <Text style={styles.benefitDesc}>
              Theo dõi và đạt được mục tiêu tiết kiệm
            </Text>
          </View>
        </View>

        <View style={styles.benefitItem}>
          <Text style={styles.benefitIcon}>📤</Text>
          <View style={styles.benefitContent}>
            <Text style={styles.benefitTitle}>Xuất/Nhập Dữ Liệu</Text>
            <Text style={styles.benefitDesc}>
              Xuất lịch sử chi tiêu và sao lưu dữ liệu dễ dàng
            </Text>
          </View>
        </View>

        <View style={styles.benefitItem}>
          <Text style={styles.benefitIcon}>∞</Text>
          <View style={styles.benefitContent}>
            <Text style={styles.benefitTitle}>Không Giới Hạn Bản Ghi</Text>
            <Text style={styles.benefitDesc}>
              Tạo chi tiêu, ngân sách, mục tiêu không giới hạn
            </Text>
          </View>
        </View>
      </View>

      {/* Pricing Plans */}
      <View style={styles.pricingSection}>
        <Text style={styles.sectionTitle}>💰 Chọn gói của bạn</Text>

        {/* Monthly Plan */}
        <TouchableOpacity
          style={[
            styles.planCard,
            selectedPlan === 'monthly' && styles.planCardSelected,
          ]}
          onPress={() => setSelectedPlan('monthly')}
        >
          <View style={styles.planHeader}>
            <Text style={styles.planName}>Gói Tháng</Text>
            <Text style={styles.planPrice}>₫39,000</Text>
          </View>
          <Text style={styles.planDesc}>/tháng</Text>
          <Text style={styles.planBenefit}>• Đổi lúc nào cũng được</Text>
          <Text style={styles.planBenefit}>• Khỏi cam kết dài hạn</Text>
          {selectedPlan === 'monthly' && (
            <Text style={styles.selectedBadge}>✓ Đã chọn</Text>
          )}
        </TouchableOpacity>

        {/* Yearly Plan */}
        <TouchableOpacity
          style={[
            styles.planCard,
            selectedPlan === 'yearly' && styles.planCardSelected,
          ]}
          onPress={() => setSelectedPlan('yearly')}
        >
          <View style={styles.discountBadgeContainer}>
            <Text style={styles.discountBadge}>Tiết kiệm 20%</Text>
          </View>
          <View style={styles.planHeader}>
            <Text style={styles.planName}>Gói Năm</Text>
            <View style={styles.priceContainer}>
              <Text style={styles.originalPrice}>₫468,000</Text>
              <Text style={styles.planPrice}>₫375,000</Text>
            </View>
          </View>
          <Text style={styles.planDesc}>/năm</Text>
          <Text style={styles.planBenefit}>• 12 tháng liên tục</Text>
          <Text style={styles.planBenefit}>• Tối ưu nhất cho dài hạn</Text>
          {selectedPlan === 'yearly' && (
            <Text style={styles.selectedBadge}>✓ Đã chọn</Text>
          )}
        </TouchableOpacity>
      </View>

      {/* CTA Button */}
      <TouchableOpacity style={styles.upgradeButton} onPress={handleUpgrade}>
        <Text style={styles.upgradeButtonText}>
          Nâng cấp Premium Ngay - ₫
          {selectedPlan === 'monthly' ? '39,000' : '375,000'}
        </Text>
      </TouchableOpacity>

      {/* Footer */}
      <View style={styles.footer}>
        <Text style={styles.footerText}>💳 Thanh toán an toàn qua Stripe</Text>
        <Text style={styles.footerText}>📋 Có thể hủy bất cứ lúc nào</Text>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5F5',
  },
  header: {
    backgroundColor: '#FFB74D',
    paddingHorizontal: 16,
    paddingVertical: 24,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#FFF',
    marginBottom: 4,
  },
  headerSubtitle: {
    fontSize: 13,
    color: '#FFE0B2',
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1A1A1A',
    marginBottom: 12,
  },
  benefitsSection: {
    paddingHorizontal: 16,
    paddingVertical: 16,
    backgroundColor: '#FFF',
    marginBottom: 12,
  },
  benefitItem: {
    flexDirection: 'row',
    marginBottom: 12,
  },
  benefitIcon: {
    fontSize: 24,
    marginRight: 12,
  },
  benefitContent: {
    flex: 1,
  },
  benefitTitle: {
    fontSize: 13,
    fontWeight: '600',
    color: '#1A1A1A',
    marginBottom: 2,
  },
  benefitDesc: {
    fontSize: 11,
    color: '#999999',
  },
  pricingSection: {
    paddingHorizontal: 16,
    paddingVertical: 16,
  },
  planCard: {
    backgroundColor: '#FFF',
    borderRadius: 8,
    padding: 16,
    marginBottom: 12,
    borderWidth: 2,
    borderColor: '#E0E0E0',
  },
  planCardSelected: {
    borderColor: '#FFB74D',
    backgroundColor: '#FFFBF0',
  },
  planHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  planName: {
    fontSize: 14,
    fontWeight: '700',
    color: '#1A1A1A',
  },
  planPrice: {
    fontSize: 18,
    fontWeight: '700',
    color: '#FFB74D',
  },
  planDesc: {
    fontSize: 11,
    color: '#999999',
    marginBottom: 10,
  },
  planBenefit: {
    fontSize: 11,
    color: '#666666',
    marginBottom: 4,
  },
  selectedBadge: {
    fontSize: 12,
    fontWeight: '600',
    color: '#FFB74D',
    marginTop: 8,
  },
  discountBadgeContainer: {
    marginBottom: 8,
  },
  discountBadge: {
    fontSize: 11,
    fontWeight: '700',
    color: '#FFF',
    backgroundColor: '#E91E63',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
    alignSelf: 'flex-start',
  },
  priceContainer: {
    alignItems: 'flex-end',
  },
  originalPrice: {
    fontSize: 12,
    color: '#999999',
    textDecorationLine: 'line-through',
    marginBottom: 2,
  },
  upgradeButton: {
    backgroundColor: '#FFB74D',
    marginHorizontal: 16,
    paddingVertical: 14,
    borderRadius: 8,
    alignItems: 'center',
    marginBottom: 16,
  },
  upgradeButtonText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#FFF',
  },
  footer: {
    backgroundColor: '#FFF',
    paddingHorizontal: 16,
    paddingVertical: 12,
    marginHorizontal: 16,
    borderRadius: 8,
    marginBottom: 20,
  },
  footerText: {
    fontSize: 11,
    color: '#666666',
    marginBottom: 4,
  },
});

export default UpgradePremiumScreen;
