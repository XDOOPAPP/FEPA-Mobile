import React from 'react';
import { View, StyleSheet, Text, TouchableOpacity } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { Colors, Radius, Shadow, Spacing } from '../../../constants/theme';

const PlanningScreen: React.FC = () => {
  const navigation = useNavigation<any>();

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Kế hoạch</Text>

      <TouchableOpacity
        style={styles.card}
        onPress={() => navigation.navigate('Budgets')}
      >
        <Text style={styles.cardTitle}>Ngân sách</Text>
        <Text style={styles.cardSubtitle}>Quản lý ngân sách theo danh mục</Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={styles.card}
        onPress={() => navigation.navigate('SavingGoals')}
      >
        <Text style={styles.cardTitle}>Mục tiêu tiết kiệm</Text>
        <Text style={styles.cardSubtitle}>
          Theo dõi mục tiêu đang thực hiện
        </Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={styles.card}
        onPress={() => navigation.navigate('Debts')}
      >
        <Text style={styles.cardTitle}>Nợ</Text>
        <Text style={styles.cardSubtitle}>Quản lý nợ phải thu/phải trả</Text>
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

export default PlanningScreen;
