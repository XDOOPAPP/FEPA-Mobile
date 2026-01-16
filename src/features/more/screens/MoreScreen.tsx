import React from 'react';
import {
  View,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { usePremiumCheck } from '../../../common/hooks/usePremiumCheck';

type FeatureType = 'OCR' | 'AI' | 'BLOG';

const MoreScreen: React.FC = () => {
  const navigation = useNavigation<any>();
  const {
    isPremium,
    canUseFeature,
    getRemainingUses,
    incrementUsage,
    maxFreeUses,
  } = usePremiumCheck();

  const checkAndExecuteFeature = (feature: FeatureType, actionName: string) => {
    if (!canUseFeature(feature)) {
      Alert.alert(
        'Hết lần dùng miễn phí',
        `Bạn đã dùng ${maxFreeUses} lần ${actionName} hôm nay. Hãy nâng cấp lên Premium để dùng không giới hạn!`,
        [
          { text: 'Hủy', onPress: () => {} },
          {
            text: 'Nâng cấp Premium',
            onPress: () => navigation.navigate('UpgradePremium'),
          },
        ],
      );
      return;
    }

    // Thực hiện feature
    incrementUsage(feature);
    const remaining = getRemainingUses(feature) - 1;

    if (!isPremium && remaining === 0) {
      Alert.alert(
        'Thông báo',
        `Đây là lần cuối cùng dùng ${actionName} trong hôm nay. Nâng cấp Premium để dùng không giới hạn!`,
      );
    }

    alert(
      `Tính năng ${actionName} đang chuẩn bị (Lần dùng: ${
        maxFreeUses - remaining
      }/${maxFreeUses})`,
    );
  };

  const menuItems = [
    {
      icon: '📸',
      title: 'Quét Hóa Đơn',
      subtitle: isPremium
        ? 'Chụp ảnh hóa đơn tự động nhập chi tiêu'
        : `Chụp ảnh hóa đơn (${getRemainingUses('OCR')}/${maxFreeUses} lần)`,
      action: () => checkAndExecuteFeature('OCR', 'Quét Hóa Đơn'),
      locked: !isPremium && !canUseFeature('OCR'),
    },
    {
      icon: '🤖',
      title: 'Trợ Lý AI',
      subtitle: isPremium
        ? 'Nhận gợi ý và phân tích chi tiêu'
        : `Nhận gợi ý AI (${getRemainingUses('AI')}/${maxFreeUses} lần)`,
      action: () => checkAndExecuteFeature('AI', 'Trợ Lý AI'),
      locked: !isPremium && !canUseFeature('AI'),
    },
    {
      icon: '📖',
      title: 'Blog Tài Chính',
      subtitle: isPremium
        ? 'Kiến thức quản lý tài chính cá nhân'
        : `Đọc bài viết (${getRemainingUses('BLOG')}/${maxFreeUses} lần)`,
      action: () => checkAndExecuteFeature('BLOG', 'Blog Tài Chính'),
      locked: !isPremium && !canUseFeature('BLOG'),
    },
    {
      icon: '🎁',
      title: 'Gói Dịch Vụ',
      subtitle: isPremium
        ? '✓ Đã nâng cấp Premium'
        : 'Nâng cấp lên Premium để dùng không giới hạn',
      action: () => navigation.navigate('UpgradePremium'),
      locked: false,
    },
  ];

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>⭐ Thêm</Text>
        <Text style={styles.subtitle}>Các tính năng bổ sung</Text>
      </View>

      {/* Menu Items */}
      <ScrollView style={styles.content}>
        {menuItems.map((item, index) => (
          <TouchableOpacity
            key={index}
            style={[styles.menuItem, item.locked && styles.menuItemLocked]}
            onPress={item.action}
            disabled={item.locked}
          >
            <Text style={styles.menuIcon}>{item.icon}</Text>
            <View style={styles.menuContent}>
              <Text
                style={[
                  styles.menuTitle,
                  item.locked && styles.menuTitleLocked,
                ]}
              >
                {item.title}
              </Text>
              <Text
                style={[
                  styles.menuSubtitle,
                  item.locked && styles.menuSubtitleLocked,
                ]}
              >
                {item.subtitle}
              </Text>
            </View>
            <Text
              style={[styles.menuArrow, item.locked && styles.menuArrowLocked]}
            >
              {item.locked ? '🔒' : '›'}
            </Text>
          </TouchableOpacity>
        ))}

        {/* Info Section */}
        <View style={styles.infoSection}>
          <Text style={styles.infoTitle}>💡 Về FEPA</Text>
          <Text style={styles.infoText}>
            FEPA - Ứng dụng quản lý chi tiêu cá nhân thông minh, giúp bạn kiểm
            soát tài chính và đạt được mục tiêu tiết kiệm.
          </Text>
        </View>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5F5',
  },
  header: {
    paddingHorizontal: 16,
    paddingVertical: 20,
    backgroundColor: '#2196F3',
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: '#FFF',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 13,
    color: '#E3F2FD',
  },
  content: {
    flex: 1,
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 14,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#EEEEEE',
  },
  menuItemLocked: {
    opacity: 0.6,
    backgroundColor: '#F9F9F9',
  },
  menuIcon: {
    fontSize: 28,
    marginRight: 12,
  },
  menuContent: {
    flex: 1,
  },
  menuTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1A1A1A',
    marginBottom: 2,
  },
  menuTitleLocked: {
    color: '#CCCCCC',
  },
  menuSubtitle: {
    fontSize: 12,
    color: '#999999',
  },
  menuSubtitleLocked: {
    color: '#DDDDDD',
  },
  menuArrow: {
    fontSize: 20,
    color: '#2196F3',
  },
  menuArrowLocked: {
    color: '#CCCCCC',
  },
  infoSection: {
    backgroundColor: '#E3F2FD',
    borderRadius: 8,
    padding: 12,
    marginTop: 16,
    marginBottom: 20,
  },
  infoTitle: {
    fontSize: 13,
    fontWeight: '600',
    color: '#1565C0',
    marginBottom: 6,
  },
  infoText: {
    fontSize: 12,
    color: '#0D47A1',
    lineHeight: 18,
  },
});

export default MoreScreen;
