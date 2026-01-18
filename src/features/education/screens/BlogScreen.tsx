import React from 'react';
import { View, StyleSheet, Text, FlatList } from 'react-native';
import { Colors, Radius, Shadow, Spacing } from '../../../constants/theme';

const BLOGS = [
  {
    id: '1',
    title: '5 mẹo quản lý chi tiêu hiệu quả',
    summary: 'Theo dõi chi tiêu hằng ngày, đặt giới hạn ngân sách rõ ràng.',
  },
  {
    id: '2',
    title: 'Cách tiết kiệm 20% thu nhập',
    summary: 'Ưu tiên tiết kiệm trước khi chi tiêu và dùng quy tắc 50/30/20.',
  },
  {
    id: '3',
    title: 'Quản lý nợ thông minh',
    summary: 'Tập trung trả khoản lãi cao trước và tránh nợ xấu.',
  },
];

const BlogScreen: React.FC = () => {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Blog tài chính</Text>
      <FlatList
        data={BLOGS}
        keyExtractor={item => item.id}
        renderItem={({ item }) => (
          <View style={styles.card}>
            <Text style={styles.cardTitle}>{item.title}</Text>
            <Text style={styles.cardSummary}>{item.summary}</Text>
          </View>
        )}
      />
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
  cardTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: Colors.textPrimary,
  },
  cardSummary: {
    fontSize: 12,
    color: Colors.textSecondary,
    marginTop: Spacing.xs,
  },
});

export default BlogScreen;
