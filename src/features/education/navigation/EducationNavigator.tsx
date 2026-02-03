import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
// import EducationProfileScreen from '../screens/EducationProfileScreen';
import ProfileScreen from '../../profile/screens/ProfileScreen';
import BlogScreen from '../screens/BlogScreen';
import BlogDetailScreen from '../screens/BlogDetailScreen';
import PremiumScreen from '../screens/PremiumScreen';
import SecuritySettingsScreen from '../screens/SecuritySettingsScreen';
import TwoFAScreen from '../screens/TwoFAScreen';
import MyBlogsScreen from '../screens/MyBlogsScreen';
import CreateBlogScreen from '../screens/CreateBlogScreen';
import { ProfileNavigator } from '../../profile/navigation/ProfileNavigator';
import { Colors } from '../../../constants/theme';

export type EducationStackParamList = {
  EducationHome: undefined;
  Profile: undefined;
  Blog: undefined;
  BlogDetail: { slug: string };
  MyBlogs: undefined;
  CreateBlog: { blogId?: string };
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
        name="BlogDetail"
        component={BlogDetailScreen}
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name="MyBlogs"
        component={MyBlogsScreen}
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name="CreateBlog"
        component={CreateBlogScreen}
        options={{ headerShown: false }}
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
