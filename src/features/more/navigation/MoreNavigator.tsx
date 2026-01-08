import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import MoreMenuScreen from '../screens/MoreMenuScreen';
import AnalyticsScreen from '../../analytics/screens/AnalyticsScreen';
import ReceiptOCRScreen from '../../ocr/screens/ReceiptOCRScreen';
import DebtTrackerScreen from '../../debt/screens/DebtTrackerScreen';

export type MoreStackParamList = {
  MoreMenu: undefined;
  Analytics: undefined;
  ReceiptOCR: undefined;
  DebtTracker: undefined;
};

const Stack = createNativeStackNavigator<MoreStackParamList>();

export const MoreNavigator = () => {
  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: true,
        headerBackTitleVisible: false,
        headerTintColor: '#2196F3',
        headerTitleStyle: {
          fontWeight: '700',
          fontSize: 16,
        },
      }}
    >
      <Stack.Screen
        name="MoreMenu"
        component={MoreMenuScreen}
        options={{
          title: 'Tính năng nâng cao',
          headerShown: false,
        }}
      />
      <Stack.Screen
        name="Analytics"
        component={AnalyticsScreen}
        options={{
          title: 'Phân tích chi tiêu',
        }}
      />
      <Stack.Screen
        name="ReceiptOCR"
        component={ReceiptOCRScreen}
        options={{
          title: 'Quét hóa đơn',
        }}
      />
      <Stack.Screen
        name="DebtTracker"
        component={DebtTrackerScreen}
        options={{
          title: 'Theo dõi nợ',
        }}
      />
    </Stack.Navigator>
  );
};
