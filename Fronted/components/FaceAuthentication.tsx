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
import apiService from '../services/api';

interface FaceAuthenticationProps {
  visible: boolean;
  onClose: () => void;
  onSuccess: (user: any) => void;
  onFallbackToEmail: () => void;
}

export default function FaceAuthentication({ 
  visible, 
  onClose, 
  onSuccess, 
  onFallbackToEmail 
}: FaceAuthenticationProps) {
  const [showCamera, setShowCamera] = useState(false);
  const [isAuthenticating, setIsAuthenticating] = useState(false);
  const [authStep, setAuthStep] = useState<'intro' | 'camera' | 'processing'>('intro');

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

      // Send face encoding to backend for authentication
      const response = await apiService.api.post('/users/face-login/', {
        face_encoding: result.faceEncoding,
        confidence_score: result.confidenceScore,
        image_data: result.imageUri ? await convertImageToBase64(result.imageUri) : null,
      });

      if (response.data.success) {
        // Store tokens
        await apiService.storeTokens(response.data.tokens);
        
        Alert.alert(
          'Authentication Successful!',
          `Welcome back, ${response.data.user.first_name}!`,
          [
            {
              text: 'Continue',
              onPress: () => {
                onSuccess(response.data.user);
                onClose();
              }
            }
          ]
        );
      } else {
        throw new Error(response.data.error || 'Face authentication failed');
      }

    } catch (error: any) {
      console.error('Face authentication error:', error);
      
      let errorMessage = 'Face authentication failed. Please try again.';
      if (error.response?.status === 404) {
        errorMessage = 'Face not recognized. Please register your face first or use email login.';
      } else if (error.response?.data?.error) {
        errorMessage = error.response.data.error;
      }

      Alert.alert(
        'Authentication Failed',
        errorMessage,
        [
          {
            text: 'Try Again',
            onPress: () => setAuthStep('intro')
          },
          {
            text: 'Use Email',
            onPress: () => {
              onClose();
              onFallbackToEmail();
            }
          }
        ]
      );
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
          Look at the camera to authenticate with your face
        </Text>

        <View style={styles.instructionsList}>
          <Text style={styles.instructionsTitle}>For best results:</Text>
          <Text style={styles.instructionItem}>• Look directly at the camera</Text>
          <Text style={styles.instructionItem}>• Ensure good lighting</Text>
          <Text style={styles.instructionItem}>• Keep your face in the frame</Text>
          <Text style={styles.instructionItem}>• Stay still during scanning</Text>
        </View>

        <TouchableOpacity
          style={styles.startButton}
          onPress={handleStartAuthentication}
          disabled={isAuthenticating}
        >
          <Ionicons name="scan" size={20} color="#fff" />
          <Text style={styles.startButtonText}>Start Face Scan</Text>
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
            Verifying your identity with face recognition
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
      {authStep === 'intro' && renderIntroScreen()}
      {authStep === 'processing' && renderProcessingScreen()}
      {authStep === 'camera' && showCamera && (
        <FaceRecognitionCamera
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
    marginBottom: 40,
    lineHeight: 24,
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
  },
});