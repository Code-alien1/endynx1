import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView } from 'react-native';
import apiService from '../services/api';

export const AuthDebugger: React.FC = () => {
  const [debugInfo, setDebugInfo] = useState<string>('');

  const runDebug = async () => {
    let info = '=== AUTH DEBUG RESULTS ===\n\n';
    
    try {
      // Check token status
      await apiService.debugTokenStatus();
      
      // Test authentication
      info += '1. Testing isAuthenticated()...\n';
      const isAuth = await apiService.isAuthenticated();
      info += `   Result: ${isAuth}\n\n`;
      
      // Test direct profile call
      info += '2. Testing direct profile call...\n';
      try {
        const user = await apiService.getCurrentUser();
        info += `   Success: ${user.email} (${user.role})\n\n`;
      } catch (error: any) {
        info += `   Error: ${error.response?.status} - ${error.message}\n\n`;
      }
      
      // Test token refresh
      info += '3. Testing token refresh...\n';
      try {
        const refreshed = await apiService.refreshToken();
        info += `   Refresh result: ${refreshed}\n\n`;
      } catch (error: any) {
        info += `   Refresh error: ${error.message}\n\n`;
      }
      
      // Test health endpoint
      info += '4. Testing health endpoint...\n';
      try {
        const health = await apiService.get('/users/health/');
        info += `   Health: ${health.status} - ${JSON.stringify(health.data)}\n\n`;
      } catch (error: any) {
        info += `   Health error: ${error.response?.status} - ${error.message}\n\n`;
      }
      
    } catch (error: any) {
      info += `Debug error: ${error.message}\n`;
    }
    
    setDebugInfo(info);
  };

  const clearTokens = async () => {
    try {
      await apiService.logout();
      setDebugInfo('Tokens cleared. Please login again.');
    } catch (error: any) {
      setDebugInfo(`Error clearing tokens: ${error.message}`);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Auth Debugger</Text>
      
      <TouchableOpacity style={styles.button} onPress={runDebug}>
        <Text style={styles.buttonText}>Run Debug</Text>
      </TouchableOpacity>
      
      <TouchableOpacity style={[styles.button, styles.clearButton]} onPress={clearTokens}>
        <Text style={styles.buttonText}>Clear Tokens</Text>
      </TouchableOpacity>
      
      <ScrollView style={styles.debugOutput}>
        <Text style={styles.debugText}>{debugInfo}</Text>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: '#1a1a1a',
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 20,
  },
  button: {
    backgroundColor: '#2ecc71',
    padding: 15,
    borderRadius: 8,
    marginBottom: 10,
  },
  clearButton: {
    backgroundColor: '#e74c3c',
  },
  buttonText: {
    color: '#fff',
    textAlign: 'center',
    fontWeight: 'bold',
  },
  debugOutput: {
    flex: 1,
    backgroundColor: '#2a2a2a',
    padding: 15,
    borderRadius: 8,
    marginTop: 20,
  },
  debugText: {
    color: '#fff',
    fontFamily: 'monospace',
    fontSize: 12,
  },
});

export default AuthDebugger;
