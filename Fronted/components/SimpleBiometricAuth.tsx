/**
 * SIMPLIFIED BIOMETRIC AUTHENTICATION COMPONENT
 * Easy-to-use biometric authentication for students
 */
import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, Alert, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import SimpleBiometricService from '../services/simpleBiometricService';

interface SimpleBiometricAuthProps {
  userId: string;
  onRegistrationSuccess?: () => void;
  onAuthenticationSuccess?: (user: any) => void;
  onError?: (error: string) => void;
}

export default function SimpleBiometricAuth({
  userId,
  onRegistrationSuccess,
  onAuthenticationSuccess,
  onError
}: SimpleBiometricAuthProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [isRegistered, setIsRegistered] = useState(false);
  const [isAvailable, setIsAvailable] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState<'checking' | 'connected' | 'error'>('checking');

  useEffect(() => {
    initializeBiometric();
  }, [userId]);

  const initializeBiometric = async () => {
    try {
      console.log('🚀 Initializing biometric system...');
      
      // Test connection
      const connectionTest = await SimpleBiometricService.testConnection();
      if (!connectionTest.success) {
        setConnectionStatus('error');
        console.error('❌ Connection test failed:', connectionTest.error);
        return;
      }
      setConnectionStatus('connected');

      // Check biometric availability
      const available = await SimpleBiometricService.isBiometricAvailable();
      setIsAvailable(available);

      if (available) {
        // Check registration status
        const status = await SimpleBiometricService.checkRegistrationStatus(userId);
        setIsRegistered(status.registered);
        console.log('📊 Biometric status:', { available, registered: status.registered });
      }
    } catch (error: any) {
      console.error('❌ Biometric initialization error:', error);
      setConnectionStatus('error');
      onError?.(error.message);
    }
  };

  const handleRegister = async () => {
    if (!isAvailable) {
      Alert.alert('Error', 'Biometric authentication is not available on this device');
      return;
    }

    setIsLoading(true);
    try {
      console.log('📝 Starting biometric registration...');
      
      const result = await SimpleBiometricService.registerBiometric(userId);
      
      if (result.success) {
        setIsRegistered(true);
        Alert.alert('Success', 'Biometric registration successful!');
        onRegistrationSuccess?.();
      } else {
        Alert.alert('Registration Failed', result.error || 'Unknown error occurred');
        onError?.(result.error || 'Registration failed');
      }
    } catch (error: any) {
      console.error('❌ Registration error:', error);
      Alert.alert('Error', error.message);
      onError?.(error.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleAuthenticate = async () => {
    if (!isAvailable) {
      Alert.alert('Error', 'Biometric authentication is not available on this device');
      return;
    }

    if (!isRegistered) {
      Alert.alert('Error', 'Please register your biometric first');
      return;
    }

    setIsLoading(true);
    try {
      console.log('🔐 Starting biometric authentication...');
      
      const result = await SimpleBiometricService.authenticateBiometric(userId);
      
      if (result.success) {
        Alert.alert('Success', 'Biometric authentication successful!');
        onAuthenticationSuccess?.(result.user);
      } else {
        Alert.alert('Authentication Failed', result.error || 'Unknown error occurred');
        onError?.(result.error || 'Authentication failed');
      }
    } catch (error: any) {
      console.error('❌ Authentication error:', error);
      Alert.alert('Error', error.message);
      onError?.(error.message);
    } finally {
      setIsLoading(false);
    }
  };

  const getStatusColor = () => {
    switch (connectionStatus) {
      case 'connected': return '#4CAF50';
      case 'error': return '#F44336';
      default: return '#FF9800';
    }
  };

  const getStatusText = () => {
    switch (connectionStatus) {
      case 'connected': return 'Connected';
      case 'error': return 'Connection Error';
      default: return 'Checking...';
    }
  };

  return (
    <View style={{
      padding: 20,
      backgroundColor: '#1a1a1a',
      borderRadius: 12,
      margin: 16,
    }}>
      {/* Header */}
      <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 16 }}>
        <Ionicons name="finger-print" size={24} color="#4CAF50" />
        <Text style={{ 
          fontSize: 18, 
          fontWeight: 'bold', 
          color: 'white', 
          marginLeft: 8 
        }}>
          Biometric Authentication
        </Text>
      </View>

      {/* Connection Status */}
      <View style={{ 
        flexDirection: 'row', 
        alignItems: 'center', 
        marginBottom: 16,
        padding: 8,
        backgroundColor: '#2a2a2a',
        borderRadius: 8
      }}>
        <View style={{
          width: 8,
          height: 8,
          borderRadius: 4,
          backgroundColor: getStatusColor(),
          marginRight: 8
        }} />
        <Text style={{ color: 'white', fontSize: 14 }}>
          Status: {getStatusText()}
        </Text>
      </View>

      {/* Availability Status */}
      {connectionStatus === 'connected' && (
        <View style={{ marginBottom: 16 }}>
          <Text style={{ color: 'white', fontSize: 14, marginBottom: 4 }}>
            Biometric Hardware: {isAvailable ? '✅ Available' : '❌ Not Available'}
          </Text>
          <Text style={{ color: 'white', fontSize: 14 }}>
            Registration Status: {isRegistered ? '✅ Registered' : '❌ Not Registered'}
          </Text>
        </View>
      )}

      {/* Action Buttons */}
      {connectionStatus === 'connected' && isAvailable && (
        <View style={{ gap: 12 }}>
          {!isRegistered ? (
            <TouchableOpacity
              style={{
                backgroundColor: '#4CAF50',
                padding: 16,
                borderRadius: 8,
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'center',
                opacity: isLoading ? 0.6 : 1
              }}
              onPress={handleRegister}
              disabled={isLoading}
            >
              {isLoading ? (
                <ActivityIndicator color="white" size="small" />
              ) : (
                <>
                  <Ionicons name="add-circle" size={20} color="white" />
                  <Text style={{ 
                    color: 'white', 
                    fontSize: 16, 
                    fontWeight: 'bold',
                    marginLeft: 8
                  }}>
                    Register Biometric
                  </Text>
                </>
              )}
            </TouchableOpacity>
          ) : (
            <TouchableOpacity
              style={{
                backgroundColor: '#2196F3',
                padding: 16,
                borderRadius: 8,
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'center',
                opacity: isLoading ? 0.6 : 1
              }}
              onPress={handleAuthenticate}
              disabled={isLoading}
            >
              {isLoading ? (
                <ActivityIndicator color="white" size="small" />
              ) : (
                <>
                  <Ionicons name="finger-print" size={20} color="white" />
                  <Text style={{ 
                    color: 'white', 
                    fontSize: 16, 
                    fontWeight: 'bold',
                    marginLeft: 8
                  }}>
                    Authenticate
                  </Text>
                </>
              )}
            </TouchableOpacity>
          )}
        </View>
      )}

      {/* Error State */}
      {connectionStatus === 'error' && (
        <View style={{ 
          padding: 16, 
          backgroundColor: '#F44336', 
          borderRadius: 8,
          alignItems: 'center'
        }}>
          <Ionicons name="warning" size={24} color="white" />
          <Text style={{ color: 'white', fontSize: 14, textAlign: 'center', marginTop: 8 }}>
            Cannot connect to biometric service. Please check your network connection.
          </Text>
          <TouchableOpacity
            style={{
              backgroundColor: 'rgba(255,255,255,0.2)',
              padding: 8,
              borderRadius: 4,
              marginTop: 8
            }}
            onPress={initializeBiometric}
          >
            <Text style={{ color: 'white', fontSize: 12 }}>Retry</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Not Available State */}
      {connectionStatus === 'connected' && !isAvailable && (
        <View style={{ 
          padding: 16, 
          backgroundColor: '#FF9800', 
          borderRadius: 8,
          alignItems: 'center'
        }}>
          <Ionicons name="information-circle" size={24} color="white" />
          <Text style={{ color: 'white', fontSize: 14, textAlign: 'center', marginTop: 8 }}>
            Biometric authentication is not available on this device or not set up.
          </Text>
        </View>
      )}
    </View>
  );
}
