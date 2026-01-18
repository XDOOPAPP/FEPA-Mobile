import React from 'react';
import { View, Text } from 'react-native';
import { AuthProvider } from './store/AuthContext';
import { OCRProvider } from './store/OCRContext';
import RootNavigator from './navigation/RootNavigator';

const App = () => {
  console.log('[App] Rendering App component');
  
  return (
    <AuthProvider>
      <OCRProvider>
        <RootNavigator />
      </OCRProvider>
    </AuthProvider>
  );
};

export default App;
