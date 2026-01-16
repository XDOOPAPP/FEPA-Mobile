import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import MoreScreen from '../screens/MoreScreen';
import UpgradePremiumScreen from '../screens/UpgradePremiumScreen';

export type MoreStackParamList = {
  MoreHome: undefined;
  UpgradePremium: undefined;
};

const Stack = createNativeStackNavigator<MoreStackParamList>();

export const MoreNavigator = () => {
  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: true,
        headerTitleAlign: 'center',
      }}
    >
      <Stack.Screen
        name="MoreHome"
        component={MoreScreen}
        options={{
          headerShown: false,
          title: 'Thêm',
        }}
      />
      <Stack.Screen
        name="UpgradePremium"
        component={UpgradePremiumScreen}
        options={{
          title: 'Nâng cấp Premium',
        }}
      />
    </Stack.Navigator>
  );
};
