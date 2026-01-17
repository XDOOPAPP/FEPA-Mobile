import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { ExpenseNavigator } from '../features/expense/navigation/ExpenseNavigator';
import { BudgetNavigator } from '../features/budget/navigation/BudgetNavigator';
import { ProfileNavigator } from '../features/profile/navigation/ProfileNavigator';
import { Colors } from '../constants/theme';

export type AppTabParamList = {
  ExpenseTab: undefined;
  BudgetTab: undefined;
  ProfileTab: undefined;
};

const Tab = createBottomTabNavigator<AppTabParamList>();

const AppStack = () => {
  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          backgroundColor: '#FFFFFF',
          borderTopColor: '#E5E7EB',
          borderTopWidth: 1,
          height: 64,
          paddingBottom: 8,
          paddingTop: 8,
        },
        tabBarActiveTintColor: Colors.primary,
        tabBarInactiveTintColor: Colors.textMuted,
        tabBarLabelStyle: { fontSize: 12, fontWeight: '600' },
      }}
    >
      <Tab.Screen
        name="ExpenseTab"
        component={ExpenseNavigator}
        options={{ title: 'Chi tiêu' }}
      />
      <Tab.Screen
        name="BudgetTab"
        component={BudgetNavigator}
        options={{ title: 'Ngân sách' }}
      />
      <Tab.Screen
        name="ProfileTab"
        component={ProfileNavigator}
        options={{ title: 'Hồ sơ' }}
      />
    </Tab.Navigator>
  );
};

export default AppStack;
