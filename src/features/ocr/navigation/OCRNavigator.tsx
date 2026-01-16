import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import OCRScreen from '../screens/OCRScreen';

export type OCRStackParamList = {
  OCRHome: undefined;
};

const Stack = createNativeStackNavigator<OCRStackParamList>();

export const OCRNavigator = () => {
  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: false,
      }}
    >
      <Stack.Screen name="OCRHome" component={OCRScreen} />
    </Stack.Navigator>
  );
};
