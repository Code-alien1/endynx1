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
import VisionCameraFaceRecognition from './VisionCameraFaceRecognition';
import { useAuth } from '../contexts/AuthContext';
import faceRecognitionService from '../services/faceRecognitionService';

interface FaceRecognitionResult {
  success: boolean;
  error?: string;
  faceEncoding?: string;
  confidence?: number;
  imageUri?: string;
}

interface AdvancedFaceAuthenticationProps {
  visible: boolean;
  onClose: () => void;
  onSuccess: (user: any) => void;
  onFallbackToEmail: () => void;
}

export default function AdvancedFaceAuthentication({ 
  visible, 
  onClose, 
  onSuccess, 
  onFallbackToEmail 
}: AdvancedFaceAuthenticationProps) {
  const [showCamera, setShowCamera] = useState(false);
  const [isAuthenticating, setIsAuthenticating] = useState(false);
  const [authStep, setAuthStep] = useState<'intro' | 'camera' | 'processing'>('intro');
  const [attempts, setAttempts] = useState(0);
  const maxAttempts = 3;

  const handleStartAuthentication = () => {
    setAuthStep('camera');
    setShowCamera(true);
  };

  const handleFaceDetected = async (result: FaceRecognitionResult) => {
    if (!result.success || !result.faceEncoding) {
      Alert.alert('Authentication Failed', result.error || 'Failed to process face data');
      return;
    }

    try {
      setIsAuthenticating(true);
      setAuthStep('processing');
      setShowCamera(false);

      // Convert image to base64 if available
      let imageData = '';
      if (result.imageUri) {
        imageData = await convertImageToBase64(result.imageUri);
      }

      // Send face encoding to backend for authentication
      const response = await faceRecognitionService.authenticateWithFace(
        imageData
      );

      if (response.user) {
        Alert.alert(
          'Authentication Successful!',
          `Welcome back, ${response.user.first_name}!`,
          [
            {
              text: 'Continue',
              onPress: () => {
                onSuccess(response.user);
                onClose();
              }
            }
          ]
        );
      } else {
        throw new Error('Authentication failed');
      }

    } catch (error: any) {
      console.error('Face authentication error:', error);
      
      const newAttempts = attempts + 1;
      setAttempts(newAttempts);
      
      let errorMessage = 'Face authentication failed.';
      let showRetry = newAttempts < maxAttempts;
      
      if (error.response?.status === 404) {
        errorMessage = 'Face not recognized. Please register your face first or use email login.';
        showRetry = false;
      } else if (error.response?.status === 401) {
        errorMessage = 'Face authentication failed. Please try again or use email login.';
      } else if (error.response?.data?.error) {
        errorMessage = error.response.data.error;
      } else if (error.code === 'NETWORK_ERROR') {
        errorMessage = 'Network error. Please check your connection.';
      }

      if (newAttempts >= maxAttempts) {
        errorMessage += ' Maximum attempts reached.';
        showRetry = false;
      }

      const buttons = [];
      
      if (showRetry) {
        buttons.push({
          text: `Try Again (${maxAttempts - newAttempts} left)`,
          onPress: () => setAuthStep('intro')
        });
      }
      
      buttons.push({
        text: 'Use Email',
        onPress: () => {
          onClose();
          onFallbackToEmail();
        }
      });

      Alert.alert('Authentication Failed', errorMessage, buttons);
    } finally {
      setIsAuthenticating(false);
    }
  };

  const handleCloseCamera = () => {
    setShowCamera(false);
    setAuthStep('intro');
  };

  const convertImageToBase64 = async (imageUri: string): Promise<string> => {
    try {
      const response = await fetch(imageUri);
      const blob = await response.blob();
      return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onloadend = () => {
          const base64 = reader.result as string;
          resolve(base64.split(',')[1]); // Remove data:image/jpeg;base64, prefix
        };
        reader.onerror = reject;
        reader.readAsDataURL(blob);
      });
    } catch (error) {
      console.error('Error converting image to base64:', error);
      return '';
    }
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
            <Ionicons name="finger-print" size={60} color="#fff" />
          </LinearGradient>
        </View>

        <Text style={styles.title}>Face Authentication</Text>
        <Text style={styles.subtitle}>
          Use advanced face recognition to authenticate securely
        </Text>

        {attempts > 0 && (
          <View style={styles.attemptsContainer}>
            <Ionicons name="warning" size={16} color={COLORS.destructive} />
            <Text style={styles.attemptsText}>
              Attempt {attempts} of {maxAttempts}
            </Text>
          </View>
        )}

        <View style={styles.featuresContainer}>
          <View style={styles.featureItem}>
            <Ionicons name="eye" size={20} color={COLORS.primary} />
            <Text style={styles.featureText}>Advanced face detection</Text>
          </View>
          <View style={styles.featureItem}>
            <Ionicons name="shield-checkmark" size={20} color={COLORS.primary} />
            <Text style={styles.featureText}>Secure biometric authentication</Text>
          </View>
          <View style={styles.featureItem}>
            <Ionicons name="flash" size={20} color={COLORS.primary} />
            <Text style={styles.featureText}>Real-time quality assessment</Text>
          </View>
        </View>

        <View style={styles.instructionsList}>
          <Text style={styles.instructionsTitle}>For best results:</Text>
          <Text style={styles.instructionItem}>• Look directly at the camera</Text>
          <Text style={styles.instructionItem}>• Ensure good lighting</Text>
          <Text style={styles.instructionItem}>• Keep your face in the frame</Text>
          <Text style={styles.instructionItem}>• Stay still during scanning</Text>
        </View>

        <TouchableOpacity
          style={[styles.startButton, attempts >= maxAttempts && styles.disabledButton]}
          onPress={handleStartAuthentication}
          disabled={isAuthenticating || attempts >= maxAttempts}
        >
          <Ionicons name="scan" size={20} color="#fff" />
          <Text style={styles.startButtonText}>Start Face Authentication</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.fallbackButton} onPress={onFallbackToEmail}>
          <Text style={styles.fallbackButtonText}>Use Email Instead</Text>
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
          <View style={styles.processingIconContainer}>
            <LinearGradient
              colors={[COLORS.primary, COLORS['primary-glow']]}
              style={styles.processingIconBackground}
            >
              <ActivityIndicator size="large" color="#fff" />
            </LinearGradient>
          </View>
          <Text style={styles.processingTitle}>Authenticating...</Text>
          <Text style={styles.processingText}>
            Verifying your identity with advanced face recognition
          </Text>
          
          <View style={styles.processingSteps}>
            <View style={styles.processingStep}>
              <Ionicons name="checkmark-circle" size={16} color={COLORS.primary} />
              <Text style={styles.processingStepText}>Face captured</Text>
            </View>
            <View style={styles.processingStep}>
              <ActivityIndicator size="small" color={COLORS.primary} />
              <Text style={styles.processingStepText}>Analyzing features...</Text>
            </View>
          </View>
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
      {authStep === 'intro' && renderIntroScreen()}
      {authStep === 'processing' && renderProcessingScreen()}
      {authStep === 'camera' && showCamera && (
        <VisionCameraFaceRecognition
          mode="authenticate"
          onFaceDetected={handleFaceDetected}
          onClose={handleCloseCamera}
          title="Face Authentication"
          subtitle="Look at the camera to authenticate"
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
    marginBottom: 20,
    lineHeight: 24,
  },
  attemptsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.card,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    marginBottom: 20,
  },
  attemptsText: {
    color: COLORS.destructive,
    fontSize: 14,
    marginLeft: 8,
    fontWeight: '500',
  },
  featuresContainer: {
    marginBottom: 20,
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    paddingHorizontal: 10,
  },
  featureText: {
    fontSize: 14,
    color: COLORS.foreground,
    marginLeft: 12,
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
  disabledButton: {
    backgroundColor: COLORS.muted,
    opacity: 0.6,
  },
  startButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 10,
  },
  fallbackButton: {
    paddingVertical: 15,
    alignItems: 'center',
  },
  fallbackButtonText: {
    color: COLORS['muted-foreground'],
    fontSize: 16,
  },
  processingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  processingIconContainer: {
    marginBottom: 30,
  },
  processingIconBackground: {
    width: 100,
    height: 100,
    borderRadius: 50,
    justifyContent: 'center',
    alignItems: 'center',
  },
  processingTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: COLORS.foreground,
    marginBottom: 10,
  },
  processingText: {
    fontSize: 16,
    color: COLORS['muted-foreground'],
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 30,
  },
  processingSteps: {
    alignItems: 'flex-start',
  },
  processingStep: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  processingStepText: {
    fontSize: 14,
    color: COLORS['muted-foreground'],
    marginLeft: 10,
  },
});