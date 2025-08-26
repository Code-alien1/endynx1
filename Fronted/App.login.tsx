import React from 'react';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import LoginScreen from './app/(auth)/login';
import { AuthProvider } from './contexts/AuthContext';

export default function AppLogin() {
  return (
    <SafeAreaProvider>
      <AuthProvider>
        <LoginScreen />
      </AuthProvider>
    </SafeAreaProvider>
  );
}