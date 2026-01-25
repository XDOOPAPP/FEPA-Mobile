import React from 'react';
import { View, Text } from 'react-native';
import { AuthProvider } from './store/AuthContext';
import { OCRProvider } from './store/OCRContext';
import RootNavigator from './navigation/RootNavigator';
import { NotificationBanner } from './components/NotificationBanner';

const App = () => {
  console.log('[App] Rendering App component');
  
  return (
    <AuthProvider>
      <OCRProvider>
        <RootNavigator />
        <NotificationBanner />
      </OCRProvider>
    </AuthProvider>
  );
};

export default App;
