import React, { useState } from 'react';
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
import FaceRecognitionCamera from './FaceRecognitionCamera';
import { FaceRecognitionResult } from '../services/faceRecognition';
import { useAuth } from '../contexts/AuthContext';
import apiService from '../services/api';

interface FaceRegistrationProps {
  visible: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export default function FaceRegistration({ visible, onClose, onSuccess }: FaceRegistrationProps) {
  const [showCamera, setShowCamera] = useState(false);
  const [isRegistering, setIsRegistering] = useState(false);
  const [registrationStep, setRegistrationStep] = useState<'intro' | 'camera' | 'processing'>('intro');
  const { user } = useAuth();

  const handleStartRegistration = () => {
    setRegistrationStep('camera');
    setShowCamera(true);
  };

  const handleFaceDetected = async (result: FaceRecognitionResult) => {
    if (!result.success || !result.faceEncoding || !user) {
      Alert.alert('Registration Failed', result.error || 'Failed to process face data');
      return;
    }

    try {
      setIsRegistering(true);
      setRegistrationStep('processing');
      setShowCamera(false);

      // Save face encoding to user profile
      await apiService.updateProfile({
        face_encoding: result.faceEncoding,
      });

      // Show success message
      Alert.alert(
        'Face Registered Successfully!',
        'You can now use face recognition to log in quickly and mark attendance.',
        [
          {
            text: 'OK',
            onPress: () => {
              onSuccess();
              onClose();
            }
          }
        ]
      );

    } catch (error: any) {
      console.error('Face registration error:', error);
      Alert.alert(
        'Registration Failed',
        error.response?.data?.error || error.message || 'Failed to register face. Please try again.'
      );
      setRegistrationStep('intro');
    } finally {
      setIsRegistering(false);
    }
  };

  const handleCloseCamera = () => {
    setShowCamera(false);
    setRegistrationStep('intro');
  };

  const renderIntroScreen = () => (
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
            <Ionicons name="scan" size={60} color="#fff" />
          </LinearGradient>
        </View>

        <Text style={styles.title}>Register Your Face</Text>
        <Text style={styles.subtitle}>
          Set up face recognition for quick login and attendance marking
        </Text>

        <View style={styles.benefitsList}>
          <View style={styles.benefitItem}>
            <Ionicons name="flash" size={20} color={COLORS.primary} />
            <Text style={styles.benefitText}>Instant login without typing</Text>
          </View>
          <View style={styles.benefitItem}>
            <Ionicons name="checkmark-circle" size={20} color={COLORS.primary} />
            <Text style={styles.benefitText}>Quick attendance marking</Text>
          </View>
          <View style={styles.benefitItem}>
            <Ionicons name="shield-checkmark" size={20} color={COLORS.primary} />
            <Text style={styles.benefitText}>Secure biometric authentication</Text>
          </View>
        </View>

        <View style={styles.instructionsList}>
          <Text style={styles.instructionsTitle}>Instructions:</Text>
          <Text style={styles.instructionItem}>• Position your face in the camera frame</Text>
          <Text style={styles.instructionItem}>• Keep your eyes open and face the camera</Text>
          <Text style={styles.instructionItem}>• Ensure good lighting</Text>
          <Text style={styles.instructionItem}>• Stay still during capture</Text>
        </View>

        <TouchableOpacity
          style={styles.startButton}
          onPress={handleStartRegistration}
          disabled={isRegistering}
        >
          <Text style={styles.startButtonText}>Start Face Registration</Text>
          <Ionicons name="arrow-forward" size={20} color="#fff" />
        </TouchableOpacity>

        <TouchableOpacity style={styles.skipButton} onPress={onClose}>
          <Text style={styles.skipButtonText}>Skip for now</Text>
        </TouchableOpacity>
      </LinearGradient>
    </View>
  );

  const renderProcessingScreen = () => (
    <View style={styles.container}>
      <LinearGradient
        colors={[COLORS.background, COLORS['background-secondary']]}
        style={styles.content}
      >
        <View style={styles.processingContainer}>
          <ActivityIndicator size="large" color={COLORS.primary} />
          <Text style={styles.processingTitle}>Processing Face Data</Text>
          <Text style={styles.processingText}>
            Please wait while we securely register your face...
          </Text>
        </View>
      </LinearGradient>
    </View>
  );

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="fullScreen"
      onRequestClose={onClose}
    >
      {registrationStep === 'intro' && renderIntroScreen()}
      {registrationStep === 'processing' && renderProcessingScreen()}
      {registrationStep === 'camera' && showCamera && (
        <FaceRecognitionCamera
          mode="register"
          onFaceDetected={handleFaceDetected}
          onClose={handleCloseCamera}
          title="Register Your Face"
          subtitle="Position your face in the frame and tap capture"
        />
      )}
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
    marginBottom: 40,
    lineHeight: 24,
  },
  benefitsList: {
    marginBottom: 30,
  },
  benefitItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 15,
    paddingHorizontal: 10,
  },
  benefitText: {
    fontSize: 16,
    color: COLORS.foreground,
    marginLeft: 15,
    flex: 1,
  },
  instructionsList: {
    backgroundColor: COLORS.card,
    borderRadius: 12,
    padding: 20,
    marginBottom: 40,
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
  startButton: {
    flexDirection: 'row',
    backgroundColor: COLORS.primary,
    paddingVertical: 16,
    paddingHorizontal: 30,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 15,
    shadowColor: COLORS.primary,
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5,
  },
  startButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
    marginRight: 10,
  },
  skipButton: {
    paddingVertical: 15,
    alignItems: 'center',
  },
  skipButtonText: {
    color: COLORS['muted-foreground'],
    fontSize: 16,
  },
  processingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  processingTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: COLORS.foreground,
    marginTop: 20,
    marginBottom: 10,
  },
  processingText: {
    fontSize: 16,
    color: COLORS['muted-foreground'],
    textAlign: 'center',
    lineHeight: 24,
  },
});