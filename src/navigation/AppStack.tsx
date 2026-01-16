import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Text } from 'react-native';
import HomeScreen from '../features/expense/screens/HomeScreen';
import { ExpenseNavigator } from '../features/expenses/navigation/ExpenseNavigator';
import { BudgetNavigator } from '../features/budget/navigation/BudgetNavigator';
import { ProfileNavigator } from '../features/profile/navigation/ProfileNavigator';
import { MoreNavigator } from '../features/more/navigation/MoreNavigator';

export type AppStackParamList = {
  Dashboard: undefined;
  ExpenseTab: undefined;
  BudgetTab: undefined;
  MoreTab: undefined;
  ProfileTab: undefined;
};

const Stack = createNativeStackNavigator<AppStackParamList>();
const Tab = createBottomTabNavigator();

const AppStack = () => {
  return (
    <Tab.Navigator
      screenOptions={{
        tabBarActiveTintColor: '#2196F3',
        tabBarInactiveTintColor: '#999',
        headerShown: false,
        tabBarLabelStyle: {
          fontSize: 12,
          fontWeight: '500',
        },
      }}
    >
      <Tab.Screen
        name="Dashboard"
        component={HomeScreen}
        options={{
          title: 'Trang chủ',
          tabBarLabel: 'Trang chủ',
          tabBarIcon: ({ color }) => (
            <Text style={{ fontSize: 20, color }}>🏠</Text>
          ),
        }}
      />
      <Tab.Screen
        name="ExpenseTab"
        component={ExpenseNavigator}
        options={{
          title: 'Chi tiêu',
          tabBarLabel: 'Chi tiêu',
          tabBarIcon: ({ color }) => (
            <Text style={{ fontSize: 20, color }}>💰</Text>
          ),
        }}
      />
      <Tab.Screen
        name="BudgetTab"
        component={BudgetNavigator}
        options={{
          title: 'Ngân sách',
          tabBarLabel: 'Ngân sách',
          tabBarIcon: ({ color }) => (
            <Text style={{ fontSize: 20, color }}>📊</Text>
          ),
        }}
      />
      <Tab.Screen
        name="MoreTab"
        component={MoreNavigator}
        options={{
          title: 'Thêm',
          tabBarLabel: 'Thêm',
          tabBarIcon: ({ color }) => (
            <Text style={{ fontSize: 20, color }}>⭐</Text>
          ),
        }}
      />
      <Tab.Screen
        name="ProfileTab"
        component={ProfileNavigator}
        options={{
          title: 'Tài khoản',
          tabBarLabel: 'Tài khoản',
          tabBarIcon: ({ color }) => (
            <Text style={{ fontSize: 20, color }}>👤</Text>
          ),
        }}
      />
    </Tab.Navigator>
  );
};

export default AppStack;
