import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import OCRScanScreen from '../screens/OCRScanScreen';
import OCRResultScreen from '../screens/OCRResultScreen';
import { Colors } from '../../../constants/theme';

export type OCRStackParamList = {
  OCRScan: undefined;
  OCRResult: undefined;
};

const Stack = createNativeStackNavigator<OCRStackParamList>();

const OCRNavigator = () => {
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
        name="OCRScan"
        component={OCRScanScreen}
        options={{ headerShown: false }} // Hide default header for custom UI
      />
      <Stack.Screen
        name="OCRResult"
        component={OCRResultScreen}
        options={{ headerShown: true, title: 'Kết quả OCR' }}
      />
    </Stack.Navigator>
  );
};

export default OCRNavigator;
