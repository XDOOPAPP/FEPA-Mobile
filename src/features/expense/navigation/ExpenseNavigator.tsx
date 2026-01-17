import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import ExpenseListScreen from '../screens/ExpenseListScreen';
import CreateExpenseScreen from '../screens/CreateExpenseScreen';
import ExpenseStatsScreen from '../screens/ExpenseStatsScreen';
import { Colors } from '../../../constants/theme';

export type ExpenseStackParamList = {
  ExpenseList: undefined;
  CreateExpense: undefined;
  ExpenseStats: undefined;
};

const Stack = createNativeStackNavigator<ExpenseStackParamList>();

export const ExpenseNavigator = () => {
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
        name="ExpenseList"
        component={ExpenseListScreen}
        options={{ title: 'Chi tiêu' }}
      />
      <Stack.Screen
        name="CreateExpense"
        component={CreateExpenseScreen}
        options={{ title: 'Thêm chi tiêu' }}
      />
      <Stack.Screen
        name="ExpenseStats"
        component={ExpenseStatsScreen}
        options={{ title: 'Thống kê' }}
      />
    </Stack.Navigator>
  );
};
