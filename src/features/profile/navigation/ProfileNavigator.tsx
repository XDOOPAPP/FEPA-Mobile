import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import ProfileScreen from '../screens/ProfileScreen';
import ChangePasswordScreen from '../screens/ChangePasswordScreen';
import ThemeSettingsScreen from '../screens/ThemeSettingsScreen';

export type ProfileStackParamList = {
  ProfileHome: undefined;
  ChangePassword: undefined;
  ThemeSettings: undefined;
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
    </Stack.Navigator>
  );
};
