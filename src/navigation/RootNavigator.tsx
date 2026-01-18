import React, { useContext } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { AuthContext } from '../store/AuthContext';
import { ActivityIndicator, View } from 'react-native';

import LoginScreen from '../features/auth/screens/LoginScreen';
import RegisterScreen from '../features/auth/screens/RegisterScreen';
import ForgotPasswordScreen from '../features/auth/screens/ForgotPasswordScreen';
import ResetPasswordScreen from '../features/auth/screens/ResetPasswordScreen';
import TwoFactorLoginScreen from '../features/auth/screens/TwoFactorLoginScreen';
import MainTabNavigator from './MainTabNavigator';

export type RootStackParamList = {
  Login: undefined;
  Register: undefined;
  ForgotPassword: undefined;
  ResetPassword: { email: string };
  TwoFactorLogin: { email: string; tempToken: string };
  Auth: undefined;
  Main: undefined;
};

const Stack = createNativeStackNavigator<RootStackParamList>();

const AuthNavigator = () => {
  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: false,
        animation: 'slide_from_right',
      }}
    >
      <Stack.Screen name="Login" component={LoginScreen} />
      <Stack.Screen name="Register" component={RegisterScreen} />
      <Stack.Screen name="ForgotPassword" component={ForgotPasswordScreen} />
      <Stack.Screen name="ResetPassword" component={ResetPasswordScreen} />
      <Stack.Screen name="TwoFactorLogin" component={TwoFactorLoginScreen} />
    </Stack.Navigator>
  );
};

const RootNavigator = () => {
  console.log('[RootNavigator] Rendering RootNavigator');
  const authContext = useContext(AuthContext);

  if (!authContext) {
    console.log('[RootNavigator] AuthContext is null, showing loading');
    return (
      <View style={{ flex: 1, justifyContent: 'center', backgroundColor: '#F4F6FB' }}>
        <ActivityIndicator size="large" color="#2563EB" />
      </View>
    );
  }

  const { isAuthenticated, isLoading } = authContext;
  console.log('[RootNavigator] isAuthenticated:', isAuthenticated, 'isLoading:', isLoading);

  if (isLoading) {
    console.log('[RootNavigator] Still loading, showing ActivityIndicator');
    return (
      <View style={{ flex: 1, justifyContent: 'center', backgroundColor: '#F4F6FB' }}>
        <ActivityIndicator size="large" color="#2563EB" />
      </View>
    );
  }
  
  console.log('[RootNavigator] Loading complete, rendering NavigationContainer');

  return (
    <NavigationContainer>
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        {!isAuthenticated ? (
          <Stack.Screen
            name="Auth"
            component={AuthNavigator}
            options={{ animation: 'none' }}
          />
        ) : (
          <Stack.Screen
            name="Main"
            component={MainTabNavigator}
            options={{ animation: 'none' }}
          />
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
};

export default RootNavigator;
