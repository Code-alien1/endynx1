import React from 'react';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import AttendanceScreen from './app/(tabs)/attendance';
import { AuthProvider } from './contexts/AuthContext';

export default function AppAttendance() {
  return (
    <SafeAreaProvider>
      <AuthProvider>
        <AttendanceScreen />
      </AuthProvider>
    </SafeAreaProvider>
  );
}