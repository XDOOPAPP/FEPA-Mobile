/**
 * FEPAMobile - App Entry Point
 */

import React from 'react';
import { StatusBar, useColorScheme } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { NavigationContainer } from '@react-navigation/native';

// Import Navigator mà bạn đã tạo ở bước trước
// Đảm bảo bạn đã tạo file này tại src/navigation/AppNavigator.tsx
import AppNavigator from '../src/navigation/AppNavigator';

function App() {
  const isDarkMode = useColorScheme() === 'dark';

  return (
    <SafeAreaProvider>
      {/* Cấu hình thanh trạng thái (pin, sóng, giờ) */}
      <StatusBar 
        barStyle={isDarkMode ? 'light-content' : 'dark-content'} 
        backgroundColor="transparent"
        translucent
      />
      
      {/* Container bắt buộc để quản lý trạng thái điều hướng */}
      <NavigationContainer>
        <AppNavigator />
      </NavigationContainer>
    </SafeAreaProvider>
  );
}

export default App;