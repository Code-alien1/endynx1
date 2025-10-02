import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ActivityIndicator,
  Modal,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { COLORS } from '../constants/theme';
import biometricAuthService from '../services/biometricAuthService';
import { useAuth } from '../contexts/AuthContext';

interface BiometricFaceAuthProps {
  visible: boolean;
  onClose: () => void;
  onSuccess: (userData?: any, faceEncoding?: string, confidenceScore?: number) => void;
  mode: 'login' | 'register' | 'attendance';
  title?: string;
  subtitle?: string;
}

export default function BiometricFaceAuth({
  visible,
  onClose,
  onSuccess,
  mode,
  title,
  subtitle
}: BiometricFaceAuthProps) {
  const { user } = useAuth();
  
  const [isProcessing, setIsProcessing] = useState(false);
  const [biometricAvailable, setBiometricAvailable] = useState(false);
  const [biometricType, setBiometricType] = useState<string>('');

  useEffect(() => {
    if (visible) {
      checkBiometricAvailability();
    }
  }, [visible]);

  const checkBiometricAvailability = async () => {
    try {
      console.log('Checking biometric availability...');
      const availability = await biometricAuthService.checkAvailability();
      console.log('Biometric availability result:', availability);
      
      setBiometricAvailable(availability.isAvailable);
      if (availability.isAvailable) {
        const typeName = biometricAuthService.getBiometricTypeName(availability.biometricTypes);
        console.log('Biometric type name:', typeName);
        setBiometricType(typeName);
      } else {
        console.warn('Biometric not available:', {
          hasHardware: availability.hasHardware,
          isEnrolled: availability.isEnrolled,
          biometricTypes: availability.biometricTypes
        });
      }
    } catch (error) {
      console.error('Error checking biometric availability:', error);
      setBiometricAvailable(false);
    }
  };

  const handleBiometricRegistration = async () => {
    if (!user?.id) {
      Alert.alert('Error', 'User not found. Please login again.');
      return;
    }

    console.log('Starting biometric registration for user:', user.id);
    setIsProcessing(true);
    
    try {
      // Check biometric availability again before proceeding
      const availability = await biometricAuthService.checkAvailability();
      if (!availability.isAvailable) {
        Alert.alert(
          'Biometric Not Available',
          `Please ensure ${availability.hasHardware ? 'biometric authentication is set up' : 'your device supports biometric authentication'} in your device settings.`
        );
        return;
      }

      console.log('Calling biometric authentication for registration...');
      const result = await biometricAuthService.authenticateForFaceRegistration(user.id);
      console.log('Biometric registration result:', result);
      
      if (result.success) {
        Alert.alert(
          'Registration Successful!',
          `Your face has been registered successfully using ${biometricType}.`,
          [
            {
              text: 'OK',
              onPress: () => {
                onSuccess(user, 'biometric_face_encoding', 0.98);
                onClose();
              }
            }
          ]
        );
      } else {
        console.error('Registration failed:', result.error);
        Alert.alert('Registration Failed', result.error || 'Biometric registration failed.');
      }
    } catch (error: any) {
      console.error('Biometric registration error:', error);
      Alert.alert('Error', `Failed to register with biometrics: ${error.message || error}`);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleBiometricAttendance = async () => {
    if (!user?.id) {
      Alert.alert('Error', 'User not found. Please login again.');
      return;
    }

    console.log('Starting biometric attendance for user:', user.id);
    setIsProcessing(true);
    
    try {
      // Check biometric availability again before proceeding
      const availability = await biometricAuthService.checkAvailability();
      if (!availability.isAvailable) {
        Alert.alert(
          'Biometric Not Available',
          `Please ensure ${availability.hasHardware ? 'biometric authentication is set up' : 'your device supports biometric authentication'} in your device settings.`
        );
        return;
      }

      console.log('Calling biometric authentication for attendance...');
      const result = await biometricAuthService.authenticateForAttendance(user.id, 'current-session-id');
      console.log('Biometric attendance result:', result);
      
      if (result.success) {
        onSuccess(result.userData, result.faceEncoding, result.confidenceScore);
        onClose();
      } else {
        console.error('Attendance authentication failed:', result.error);
        Alert.alert('Authentication Failed', result.error || 'Biometric authentication failed.');
      }
    } catch (error: any) {
      console.error('Biometric attendance error:', error);
      Alert.alert('Error', `Biometric authentication failed: ${error.message || error}`);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleBiometricLogin = async () => {
    setIsProcessing(true);
    try {
      const result = await biometricAuthService.authenticateForFaceRegistration('login-user-id');
      
      if (result.success) {
        onSuccess(result);
        onClose();
      } else {
        Alert.alert('Authentication Failed', result.error || 'Biometric login failed');
      }
    } catch (error: any) {
      console.error('Biometric login error:', error);
      Alert.alert('Error', 'Failed to authenticate with biometrics');
    } finally {
      setIsProcessing(false);
    }
  };

  const renderBiometricAuthScreen = () => (
    <View style={styles.container}>
      <LinearGradient
        colors={[COLORS.background, COLORS['background-secondary']]}
        style={styles.content}
      >
        <View style={styles.header}>
          <TouchableOpacity style={styles.closeButton} onPress={onClose}>
            <Ionicons name="close" size={24} color={COLORS.foreground} />
          </TouchableOpacity>
        </View>

        <View style={styles.iconContainer}>
          <LinearGradient
            colors={[COLORS.primary, COLORS['primary-glow']]}
            style={styles.iconBackground}
          >
            <Ionicons
              name={mode === 'register' ? 'finger-print' : mode === 'attendance' ? 'scan' : 'shield-checkmark'}
              size={48}
              color="#fff"
            />
          </LinearGradient>
        </View>

        <Text style={styles.title}>
          {title || (mode === 'register' ? 'Register with Face ID' : mode === 'attendance' ? 'Face ID Attendance' : 'Face ID Authentication')}
        </Text>
        <Text style={styles.subtitle}>
          {subtitle || (mode === 'login' 
            ? 'Use your device Face ID/Touch ID for secure authentication' 
            : 'Register your biometric data for secure access')}
        </Text>
        
        {/* Debug Information - Only in development */}
        {__DEV__ && false && (
          <View style={styles.debugContainer}>
            <Text style={styles.debugText}>Debug Info:</Text>
            <Text style={styles.debugText}>Biometric Available: {biometricAvailable ? 'Yes' : 'No'}</Text>
            <Text style={styles.debugText}>Biometric Type: {biometricType || 'None'}</Text>
            <Text style={styles.debugText}>Processing: {isProcessing ? 'Yes' : 'No'}</Text>
          </View>
        )}

        <View style={styles.featuresContainer}>
          <View style={styles.featureItem}>
            <Ionicons name="finger-print" size={20} color={COLORS.primary} />
            <Text style={styles.featureText}>Device Biometric Security</Text>
          </View>
          <View style={styles.featureItem}>
            <Ionicons name="flash" size={20} color={COLORS.primary} />
            <Text style={styles.featureText}>Instant Recognition</Text>
          </View>
          <View style={styles.featureItem}>
            <Ionicons name="shield-checkmark" size={20} color={COLORS.primary} />
            <Text style={styles.featureText}>Hardware-Level Security</Text>
          </View>
        </View>

        <View style={styles.instructionsList}>
          <Text style={styles.instructionsTitle}>Biometric Authentication:</Text>
          <Text style={styles.instructionItem}>• Uses your device's Face ID or Touch ID</Text>
          <Text style={styles.instructionItem}>• No camera data stored on device</Text>
          <Text style={styles.instructionItem}>• Secure hardware-level encryption</Text>
          <Text style={styles.instructionItem}>• One-tap authentication</Text>
        </View>

        {/* Only Biometric Authentication - No Camera */}
        {biometricAvailable ? (
          <TouchableOpacity
            style={[styles.actionButton, styles.biometricButton, isProcessing && styles.disabledButton]}
            onPress={() => {
              if (mode === 'register') {
                handleBiometricRegistration();
              } else if (mode === 'attendance') {
                handleBiometricAttendance();
              } else if (mode === 'login') {
                handleBiometricLogin();
              }
            }}
            disabled={isProcessing}
          >
            {isProcessing ? (
              <ActivityIndicator size="small" color="#fff" style={{ marginRight: 8 }} />
            ) : (
              <Ionicons name="finger-print" size={20} color="#fff" style={{ marginRight: 8 }} />
            )}
            <Text style={styles.actionButtonText}>
              {isProcessing ? 'Authenticating...' : `Use ${biometricType || 'Biometric'} to ${mode === 'register' ? 'Register' : mode === 'attendance' ? 'Mark Attendance' : 'Login'}`}
            </Text>
          </TouchableOpacity>
        ) : (
          <View style={styles.fallbackContainer}>
            <Ionicons name="warning" size={24} color="#f39c12" style={{ marginBottom: 8 }} />
            <Text style={styles.fallbackText}>
              Biometric authentication not available
            </Text>
            <Text style={styles.fallbackSubtext}>
              Please enable Face ID or Touch ID in your device settings
            </Text>
          </View>
        )}

        <TouchableOpacity style={styles.cancelButton} onPress={onClose}>
          <Text style={styles.cancelButtonText}>Cancel</Text>
        </TouchableOpacity>
      </LinearGradient>
    </View>
  );

  const renderBiometricOnlyMessage = () => {
    return (
      <View style={styles.container}>
        <LinearGradient colors={['#0d1e1e', '#1a3333']} style={styles.content}>
          <Text style={styles.title}>Biometric Authentication Required</Text>
          <Text style={styles.subtitle}>
            This app requires device biometric authentication (Face ID/Touch ID) for enhanced security.
          </Text>
          <TouchableOpacity style={styles.cancelButton} onPress={onClose}>
            <Text style={styles.cancelButtonText}>Close</Text>
          </TouchableOpacity>
        </LinearGradient>
      </View>
    );
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="fullScreen"
      onRequestClose={onClose}
    >
      {biometricAvailable ? renderBiometricAuthScreen() : renderBiometricOnlyMessage()}
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    flex: 1,
    padding: 20,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginTop: 40,
    marginBottom: 20,
  },
  closeButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: COLORS.card,
    justifyContent: 'center',
    alignItems: 'center',
  },
  iconContainer: {
    alignItems: 'center',
    marginBottom: 30,
  },
  iconBackground: {
    width: 120,
    height: 120,
    borderRadius: 60,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: COLORS.primary,
    shadowOffset: {
      width: 0,
      height: 8,
    },
    shadowOpacity: 0.3,
    shadowRadius: 16,
    elevation: 8,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: COLORS.foreground,
    textAlign: 'center',
    marginBottom: 10,
  },
  subtitle: {
    fontSize: 16,
    color: COLORS['muted-foreground'],
    textAlign: 'center',
    marginBottom: 30,
    lineHeight: 24,
  },
  featuresContainer: {
    marginBottom: 30,
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 15,
    paddingHorizontal: 10,
  },
  featureText: {
    fontSize: 16,
    color: COLORS.foreground,
    marginLeft: 15,
    flex: 1,
  },
  instructionsList: {
    backgroundColor: COLORS.card,
    borderRadius: 12,
    padding: 20,
    marginBottom: 30,
  },
  instructionsTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.foreground,
    marginBottom: 15,
  },
  instructionItem: {
    fontSize: 14,
    color: COLORS['muted-foreground'],
    marginBottom: 8,
    lineHeight: 20,
  },
  actionButton: {
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderRadius: 12,
    marginBottom: 20,
    shadowColor: COLORS.primary,
    shadowOffset: {
      width: 0,
      height: 8,
    },
    shadowOpacity: 0.3,
    shadowRadius: 16,
    elevation: 8,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  biometricButton: {
    backgroundColor: COLORS.primary,
    shadowColor: COLORS.primary,
  },
  disabledButton: {
    opacity: 0.6,
  },
  actionButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
    textAlign: 'center',
  },
  cancelButton: {
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
    marginTop: 10,
    alignItems: 'center',
  },
  cancelButtonText: {
    fontSize: 16,
    color: COLORS['muted-foreground'],
    fontWeight: '500',
  },
  fallbackContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 30,
    backgroundColor: 'rgba(243, 156, 18, 0.1)',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(243, 156, 18, 0.3)',
  },
  fallbackText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#f39c12',
    textAlign: 'center',
    marginBottom: 8,
  },
  fallbackSubtext: {
    fontSize: 14,
    color: COLORS['muted-foreground'],
    textAlign: 'center',
    lineHeight: 20,
  },
  debugContainer: {
    backgroundColor: 'rgba(255, 255, 0, 0.1)',
    padding: 10,
    borderRadius: 8,
    marginVertical: 10,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 0, 0.3)',
  },
  debugText: {
    fontSize: 12,
    color: '#ffeb3b',
    marginBottom: 2,
  },
});
