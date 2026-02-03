import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import DashboardScreen from '../features/dashboard/screens/DashboardScreen';
import AiInsightsScreen from '../features/dashboard/screens/AiInsightsScreen';

export type DashboardStackParamList = {
  DashboardHome: undefined;
  AiInsights: undefined;
};

const Stack = createNativeStackNavigator<DashboardStackParamList>();

const DashboardStack = () => {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="DashboardHome" component={DashboardScreen} />
      <Stack.Screen name="AiInsights" component={AiInsightsScreen} />
    </Stack.Navigator>
  );
};

export default DashboardStack;
