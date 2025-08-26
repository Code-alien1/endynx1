import React from 'react';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import FeedbackScreen from './app/(tabs)/feedback';
import { AuthProvider } from './contexts/AuthContext';

export default function AppFeedback() {
  return (
    <SafeAreaProvider>
      <AuthProvider>
        <FeedbackScreen />
      </AuthProvider>
    </SafeAreaProvider>
  );
}