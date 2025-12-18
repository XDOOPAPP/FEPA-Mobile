import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { HomeScreen } from '../features/expense/screens/HomeScreen';
import { DetailScreen } from '../features/expense/screens/DetailScreen';

const Stack = createNativeStackNavigator();
const Tab = createBottomTabNavigator();

// Nhóm các màn hình có thanh điều hướng dưới cùng
function MainTabNavigator() {
  return (
    <Tab.Navigator>
      <Tab.Screen name="Home" component={HomeScreen} />
      <Tab.Screen name="Settings" component={HomeScreen} /> 
    </Tab.Navigator>
  );
}

// Navigator tổng của cả ứng dụng
export default function AppNavigator() {
  return (
    <Stack.Navigator>
      {/* Trang chính chứa các Tabs */}
      <Stack.Screen 
        name="Main" 
        component={MainTabNavigator} 
        options={{ headerShown: false }} 
      />
      {/* Trang chi tiết (không nằm trong Tabs) */}
      <Stack.Screen name="Details" component={DetailScreen} />
    </Stack.Navigator>
  );
}