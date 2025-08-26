import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Alert } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useRouter } from 'expo-router';

export default function DebugAuthClear() {
  const router = useRouter();

  const clearAllAuthData = async () => {
    try {
      // Clear all possible auth-related keys
      await AsyncStorage.multiRemove([
        'auth_token',
        'refresh_token',
        'user_data',
        'user',
        'isAuthenticated'
      ]);
      
      // Clear all AsyncStorage (nuclear option)
      await AsyncStorage.clear();
      
      Alert.alert('Success', 'All authentication data cleared. App will restart.', [
        { text: 'OK', onPress: () => {
          // Force reload the app
          router.replace('/');
          // Reload the entire app
          if (typeof window !== 'undefined') {
            window.location.reload();
          }
        }}
      ]);
    } catch (error) {
      console.error('Error clearing auth data:', error);
      Alert.alert('Error', 'Failed to clear auth data');
    }
  };

  return (
    <View style={styles.container}>
      <TouchableOpacity style={styles.button} onPress={clearAllAuthData}>
        <Text style={styles.buttonText}>🔧 Clear All Auth Data (Debug)</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 20,
  },
  button: {
    backgroundColor: '#ff6b6b',
    padding: 15,
    borderRadius: 8,
    alignItems: 'center',
  },
  buttonText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 16,
  },
});
