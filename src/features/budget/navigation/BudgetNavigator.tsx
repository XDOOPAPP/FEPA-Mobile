import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import BudgetListScreen from '../screens/BudgetListScreen';
import CreateBudgetScreen from '../screens/CreateBudgetScreen';
import BudgetProgressScreen from '../screens/BudgetProgressScreen';
import BudgetAlertSettingsScreen from '../screens/BudgetAlertSettingsScreen';
import { Colors } from '../../../constants/theme';

export type BudgetStackParamList = {
  BudgetList: undefined;
  CreateBudget: undefined;
  BudgetProgress: { budgetId: string; name?: string };
  BudgetAlertSettings: { budgetId: string; budgetName?: string; currentLimit?: string };
};

const Stack = createNativeStackNavigator<BudgetStackParamList>();

export const BudgetNavigator = () => {
  return (
    <Stack.Navigator
      screenOptions={{
        headerTitleAlign: 'center',
        headerStyle: { backgroundColor: Colors.card },
        headerShadowVisible: false,
        headerTitleStyle: { color: Colors.textPrimary, fontWeight: '700' },
      }}
    >
      <Stack.Screen
        name="BudgetList"
        component={BudgetListScreen}
        options={{ title: 'Ngân sách' }}
      />
      <Stack.Screen
        name="CreateBudget"
        component={CreateBudgetScreen}
        options={{ title: 'Thêm ngân sách' }}
      />
      <Stack.Screen
        name="BudgetProgress"
        component={BudgetProgressScreen}
        options={{ title: 'Tiến độ ngân sách' }}
      />
      <Stack.Screen
        name="BudgetAlertSettings"
        component={BudgetAlertSettingsScreen}
        options={{ title: 'Cài đặt cảnh báo' }}
      />
    </Stack.Navigator>
  );
};
