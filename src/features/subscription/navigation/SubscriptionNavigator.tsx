import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import SubscriptionPlansScreen from '../screens/SubscriptionPlansScreen';
import PaymentCheckoutScreen from '../screens/PaymentCheckoutScreen';

export type SubscriptionStackParamList = {
  SubscriptionPlans: undefined;
  PaymentCheckout: { planId: string; planName: string; price: number };
  PaymentSuccess: { transactionId: string };
};

const Stack = createNativeStackNavigator<SubscriptionStackParamList>();

export const SubscriptionNavigator = () => {
  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: true,
        headerTitleAlign: 'center',
        headerTintColor: '#2196F3',
        headerTitleStyle: {
          fontWeight: '700',
        },
      }}
    >
      <Stack.Screen
        name="SubscriptionPlans"
        component={SubscriptionPlansScreen}
        options={{
          title: 'Gói Dịch Vụ',
          headerBackTitle: 'Quay Lại',
        }}
      />
      <Stack.Screen
        name="PaymentCheckout"
        component={PaymentCheckoutScreen}
        options={{
          title: 'Thanh Toán',
          headerBackTitle: 'Quay Lại',
        }}
      />
    </Stack.Navigator>
  );
};
