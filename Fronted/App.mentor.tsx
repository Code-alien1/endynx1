import React from 'react';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import MentorScreen from './app/(tabs)/mentor';
import { AuthProvider } from './contexts/AuthContext';

export default function AppMentor() {
  return (
    <SafeAreaProvider>
      <AuthProvider>
        <MentorScreen />
      </AuthProvider>
    </SafeAreaProvider>
  );
}