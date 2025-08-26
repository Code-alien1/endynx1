import React from 'react';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import HomeScreen from './app/(tabs)/index';
import { AuthProvider } from './contexts/AuthContext';

export default function AppHome() {
  return (
    <SafeAreaProvider>
      <AuthProvider>
        <HomeScreen />
      </AuthProvider>
    </SafeAreaProvider>
  );
}