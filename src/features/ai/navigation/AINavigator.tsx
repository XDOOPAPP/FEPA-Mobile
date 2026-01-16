import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import AIScreen from '../screens/AIScreen';

export type AIStackParamList = {
  AIHome: undefined;
};

const Stack = createNativeStackNavigator<AIStackParamList>();

export const AINavigator = () => {
  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: false,
      }}
    >
      <Stack.Screen name="AIHome" component={AIScreen} />
    </Stack.Navigator>
  );
};
