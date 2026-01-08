import React from 'react';
import { AuthProvider } from './store/AuthContext';
import RootNavigator from './navigation/RootNavigator';

const App = () => {
  return (
    <AuthProvider>
      <RootNavigator />
    </AuthProvider>
  );
};

export default App;
