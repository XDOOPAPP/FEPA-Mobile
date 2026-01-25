import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
// import EducationProfileScreen from '../screens/EducationProfileScreen';
import ProfileScreen from '../../profile/screens/ProfileScreen';
import BlogScreen from '../screens/BlogScreen';
import PremiumScreen from '../screens/PremiumScreen';
import SecuritySettingsScreen from '../screens/SecuritySettingsScreen';
import TwoFAScreen from '../screens/TwoFAScreen';
import { ProfileNavigator } from '../../profile/navigation/ProfileNavigator';
import { Colors } from '../../../constants/theme';

export type EducationStackParamList = {
  EducationHome: undefined;
  Profile: undefined;
  Blog: undefined;
  Premium: undefined;
  SecuritySettings: undefined;
  TwoFA: { action: 'enable' | 'disable' };
};

const Stack = createNativeStackNavigator<EducationStackParamList>();

const EducationNavigator = () => {
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
        name="EducationHome"
        component={ProfileScreen}
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name="Profile"
        component={ProfileNavigator}
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name="Blog"
        component={BlogScreen}
        options={{ title: 'Blog tài chính' }}
      />
      <Stack.Screen
        name="Premium"
        component={PremiumScreen}
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name="SecuritySettings"
        component={SecuritySettingsScreen}
        options={{ title: 'Bảo mật' }}
      />
      <Stack.Screen
        name="TwoFA"
        component={TwoFAScreen}
        options={{ title: 'Xác thực 2FA' }}
      />
    </Stack.Navigator>
  );
};

export default EducationNavigator;
