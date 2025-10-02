import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView, Alert } from 'react-native';
import { apiService } from '../services/api';

export const ConnectionTest: React.FC = () => {
  const [testResults, setTestResults] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const testConnections = async () => {
    setIsLoading(true);
    setTestResults([]);
    const results: string[] = [];

    const testUrls = [
      'http://192.168.237.107:8000/api/users/health/',
      'http://localhost:8000/api/users/health/',
      'http://127.0.0.1:8000/api/users/health/',
      'http://10.0.2.2:8000/api/users/health/'
    ];

    for (const url of testUrls) {
      try {
        results.push(`Testing: ${url}`);
        
        // Create AbortController for timeout functionality
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 5000);
        
        const response = await fetch(url, {
          method: 'GET',
          signal: controller.signal,
          headers: {
            'Content-Type': 'application/json'
          }
        });
        
        // Clear timeout if request completes successfully
        clearTimeout(timeoutId);
        
        if (response.ok) {
          const data = await response.json();
          results.push(`✅ SUCCESS: ${url} - ${data.message}`);
        } else {
          results.push(`⚠️ HTTP ${response.status}: ${url}`);
        }
      } catch (error: any) {
        if (error.name === 'AbortError') {
          results.push(`❌ TIMEOUT: ${url} - Server not responding (5s timeout)`);
        } else if (error.message.includes('Network request failed')) {
          results.push(`❌ NETWORK ERROR: ${url} - Cannot reach server`);
        } else if (error.message.includes('timeout')) {
          results.push(`❌ TIMEOUT: ${url} - Server not responding`);
        } else {
          results.push(`❌ ERROR: ${url} - ${error.message}`);
        }
      }
      results.push(''); // Empty line for readability
    }

    setTestResults(results);
    setIsLoading(false);
  };

  const testLogin = async () => {
    try {
      setIsLoading(true);
      const result = await apiService.login({
        email: 'test@example.com',
        password: 'testpass',
        role: 'student'
      });
      Alert.alert('Login Test', 'Login successful!');
    } catch (error: any) {
      Alert.alert('Login Test Failed', error.message || 'Unknown error');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Backend Connection Test</Text>
      
      <TouchableOpacity 
        style={styles.button} 
        onPress={testConnections}
        disabled={isLoading}
      >
        <Text style={styles.buttonText}>
          {isLoading ? 'Testing...' : 'Test Connectivity'}
        </Text>
      </TouchableOpacity>

      <TouchableOpacity 
        style={styles.button} 
        onPress={testLogin}
        disabled={isLoading}
      >
        <Text style={styles.buttonText}>Test Login</Text>
      </TouchableOpacity>

      <ScrollView style={styles.resultsContainer}>
        {testResults.map((result, index) => (
          <Text key={index} style={styles.resultText}>
            {result}
          </Text>
        ))}
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
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 20,
    textAlign: 'center',
  },
  button: {
    backgroundColor: '#007AFF',
    padding: 15,
    borderRadius: 8,
    marginBottom: 10,
    alignItems: 'center',
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  resultsContainer: {
    flex: 1,
    marginTop: 20,
    backgroundColor: '#2a2a2a',
    borderRadius: 8,
    padding: 15,
  },
  resultText: {
    color: '#fff',
    fontSize: 12,
    fontFamily: 'monospace',
    marginBottom: 2,
  },
});
