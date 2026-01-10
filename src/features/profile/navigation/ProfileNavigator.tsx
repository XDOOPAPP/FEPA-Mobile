import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import ProfileScreen from '../screens/ProfileScreen';
import ChangePasswordScreen from '../screens/ChangePasswordScreen';
import ThemeSettingsScreen from '../screens/ThemeSettingsScreen';
import PlansScreen from '../../subscription/screens/PlansScreen';
import PaymentScreen from '../../subscription/screens/PaymentScreen';
import SubscriptionHistoryScreen from '../../subscription/screens/SubscriptionHistoryScreen';

export type ProfileStackParamList = {
  ProfileHome: undefined;
  ChangePassword: undefined;
  ThemeSettings: undefined;
  Subscription: undefined;
  Plans: undefined;
  Payment: { planId: string; plan: any };
  SubscriptionHistory: undefined;
};

const Stack = createNativeStackNavigator<ProfileStackParamList>();

export const ProfileNavigator = () => {
  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: false,
      }}
    >
      <Stack.Screen name="ProfileHome" component={ProfileScreen} />
      <Stack.Screen name="ChangePassword" component={ChangePasswordScreen} />
      <Stack.Screen name="ThemeSettings" component={ThemeSettingsScreen} />
      <Stack.Screen
        name="Subscription"
        component={PlansScreen}
        options={{ headerShown: true, title: 'Đăng ký' }}
      />
      <Stack.Screen
        name="Plans"
        component={PlansScreen}
        options={{ headerShown: true, title: 'Gói đăng ký' }}
      />
      <Stack.Screen
        name="Payment"
        component={PaymentScreen}
        options={{ headerShown: true, title: 'Thanh toán' }}
      />
      <Stack.Screen
        name="SubscriptionHistory"
        component={SubscriptionHistoryScreen}
        options={{ headerShown: true, title: 'Lịch sử đăng ký' }}
      />
    </Stack.Navigator>
  );
};
