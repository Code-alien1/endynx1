import React from 'react';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import SettingScreen from './app/(tabs)/setting';
import { AuthProvider } from './contexts/AuthContext';

export default function AppSettings() {
  return (
    <SafeAreaProvider>
      <AuthProvider>
        <SettingScreen />
      </AuthProvider>
    </SafeAreaProvider>
  );
}