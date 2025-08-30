import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ActivityIndicator,
  Modal,
  ScrollView,
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
}

interface AdvancedFaceRegistrationProps {
  visible: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export default function AdvancedFaceRegistration({ 
  visible, 
  onClose, 
  onSuccess 
}: AdvancedFaceRegistrationProps) {
  const [showCamera, setShowCamera] = useState(false);
  const [isRegistering, setIsRegistering] = useState(false);
  const [registrationStep, setRegistrationStep] = useState<'intro' | 'camera' | 'processing' | 'success'>('intro');
  const [capturedFaces, setCapturedFaces] = useState<FaceRecognitionResult[]>([]);
  const [currentCapture, setCurrentCapture] = useState(0);
  const { user } = useAuth();

  const requiredCaptures = 3; // Multiple captures for better accuracy

  const handleStartRegistration = () => {
    setCapturedFaces([]);
    setCurrentCapture(0);
    setRegistrationStep('camera');
    setShowCamera(true);
  };

  const handleFaceDetected = async (result: FaceRecognitionResult) => {
    if (!result.success || !result.faceEncoding || !user) {
      Alert.alert('Registration Failed', result.error || 'Failed to process face data');
      return;
    }

    try {
      const newCapturedFaces = [...capturedFaces, result];
      setCapturedFaces(newCapturedFaces);
      
      const nextCapture = currentCapture + 1;
      setCurrentCapture(nextCapture);

      if (nextCapture < requiredCaptures) {
        // Need more captures
        Alert.alert(
          'Capture Successful!',
          `Great! Now please turn your head slightly and capture again. (${nextCapture}/${requiredCaptures} completed)`,
          [
            {
              text: 'Continue',
              onPress: () => {
                // Continue with next capture
                setShowCamera(true);
              }
            }
          ]
        );
        setShowCamera(false);
      } else {
        // All captures completed, process registration
        setIsRegistering(true);
        setRegistrationStep('processing');
        setShowCamera(false);

        await processRegistration(newCapturedFaces);
      }

    } catch (error: any) {
      console.error('Face registration error:', error);
      Alert.alert(
        'Registration Failed',
        error.response?.data?.error || error.message || 'Failed to register face. Please try again.'
      );
      setRegistrationStep('intro');
    }
  };

  const processRegistration = async (faces: FaceRecognitionResult[]) => {
    try {
      // Combine multiple face encodings for better accuracy
      const combinedEncoding = await createCombinedEncoding(faces);
      
      // Convert best quality image to base64
      const bestFace = faces.reduce((best, current) => 
        (current.confidence || 0) > (best.confidence || 0) ? current : best
      );
      
      // Register face with backend using face recognition service
      const registrationResult = await faceRecognitionService.registerFace(
        combinedEncoding,
        user?.id || ''
      );
      
      if (!registrationResult.success) {
        throw new Error(registrationResult.error || 'Registration failed');
      }

      setRegistrationStep('success');
      
      setTimeout(() => {
        Alert.alert(
          'Face Registration Complete!',
          'Your face has been successfully registered. You can now use face recognition for quick login and attendance marking.',
          [
            {
              text: 'Great!',
              onPress: () => {
                onSuccess();
                onClose();
              }
            }
          ]
        );
      }, 1500);

    } catch (error: any) {
      console.error('Face registration processing error:', error);
      Alert.alert(
        'Registration Failed',
        error.response?.data?.error || error.message || 'Failed to complete registration. Please try again.'
      );
      setRegistrationStep('intro');
    } finally {
      setIsRegistering(false);
    }
  };

  const createCombinedEncoding = async (faces: FaceRecognitionResult[]): Promise<string> => {
    // Create a combined encoding from multiple captures for better accuracy
    // For demo purposes, we'll create a simple combined encoding
    const combinedEncoding = {
      captures: faces.length,
      confidence: Math.max(...faces.map(face => face.confidence || 0)),
      timestamp: Date.now(),
      version: '2.0',
      encodings: faces.map(face => face.faceEncoding)
    };

    // In React Native, we don't have Buffer, so we'll use btoa for base64 encoding
    return btoa(JSON.stringify(combinedEncoding));
  };

  const handleCloseCamera = () => {
    setShowCamera(false);
    if (currentCapture === 0) {
      setRegistrationStep('intro');
    }
  };

  const convertImageToBase64 = async (imageUri: string): Promise<string> => {
    try {
      const response = await fetch(imageUri);
      const blob = await response.blob();
      return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onloadend = () => {
          const base64 = reader.result as string;
          resolve(base64.split(',')[1]);
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
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
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
          Set up advanced face recognition for secure authentication
        </Text>

        <View style={styles.processContainer}>
          <Text style={styles.processTitle}>Registration Process:</Text>
          <View style={styles.processStep}>
            <View style={styles.stepNumber}>
              <Text style={styles.stepNumberText}>1</Text>
            </View>
            <Text style={styles.stepText}>Capture your face from the front</Text>
          </View>
          <View style={styles.processStep}>
            <View style={styles.stepNumber}>
              <Text style={styles.stepNumberText}>2</Text>
            </View>
            <Text style={styles.stepText}>Turn slightly left and capture again</Text>
          </View>
          <View style={styles.processStep}>
            <View style={styles.stepNumber}>
              <Text style={styles.stepNumberText}>3</Text>
            </View>
            <Text style={styles.stepText}>Turn slightly right for final capture</Text>
          </View>
        </View>

        <View style={styles.benefitsList}>
          <Text style={styles.benefitsTitle}>Benefits:</Text>
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
            <Text style={styles.benefitText}>Advanced security with landmarks</Text>
          </View>
          <View style={styles.benefitItem}>
            <Ionicons name="eye" size={20} color={COLORS.primary} />
            <Text style={styles.benefitText}>Real-time quality assessment</Text>
          </View>
        </View>

        <View style={styles.instructionsList}>
          <Text style={styles.instructionsTitle}>For best results:</Text>
          <Text style={styles.instructionItem}>• Ensure good, even lighting</Text>
          <Text style={styles.instructionItem}>• Remove glasses if possible</Text>
          <Text style={styles.instructionItem}>• Keep your face clearly visible</Text>
          <Text style={styles.instructionItem}>• Follow the on-screen guidance</Text>
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
    </ScrollView>
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
          <Text style={styles.processingTitle}>Processing Face Data</Text>
          <Text style={styles.processingText}>
            Creating your unique face profile from {requiredCaptures} captures...
          </Text>
          
          <View style={styles.processingSteps}>
            <View style={styles.processingStep}>
              <Ionicons name="checkmark-circle" size={16} color={COLORS.primary} />
              <Text style={styles.processingStepText}>Face captures completed</Text>
            </View>
            <View style={styles.processingStep}>
              <ActivityIndicator size="small" color={COLORS.primary} />
              <Text style={styles.processingStepText}>Analyzing facial features...</Text>
            </View>
            <View style={styles.processingStep}>
              <ActivityIndicator size="small" color={COLORS.muted} />
              <Text style={styles.processingStepText}>Creating secure profile...</Text>
            </View>
          </View>
        </View>
      </LinearGradient>
    </View>
  );

  const renderSuccessScreen = () => (
    <View style={styles.container}>
      <LinearGradient
        colors={[COLORS.background, COLORS['background-secondary']]}
        style={styles.content}
      >
        <View style={styles.successContainer}>
          <View style={styles.successIconContainer}>
            <LinearGradient
              colors={[COLORS.primary, COLORS['primary-glow']]}
              style={styles.successIconBackground}
            >
              <Ionicons name="checkmark" size={60} color="#fff" />
            </LinearGradient>
          </View>
          <Text style={styles.successTitle}>Registration Complete!</Text>
          <Text style={styles.successText}>
            Your face has been successfully registered with advanced security features.
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
      {registrationStep === 'success' && renderSuccessScreen()}
      {registrationStep === 'camera' && showCamera && (
        <VisionCameraFaceRecognition
          mode="register"
          onFaceDetected={handleFaceDetected}
          onClose={handleCloseCamera}
          title={`Face Registration (${currentCapture + 1}/${requiredCaptures})`}
          subtitle={
            currentCapture === 0 ? "Look straight at the camera" :
            currentCapture === 1 ? "Turn your head slightly left" :
            "Turn your head slightly right"
          }
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
    marginBottom: 30,
    lineHeight: 24,
  },
  processContainer: {
    backgroundColor: COLORS.card,
    borderRadius: 12,
    padding: 20,
    marginBottom: 20,
  },
  processTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.foreground,
    marginBottom: 15,
  },
  processStep: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  stepNumber: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: COLORS.primary,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  stepNumberText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: 'bold',
  },
  stepText: {
    fontSize: 14,
    color: COLORS['muted-foreground'],
    flex: 1,
  },
  benefitsList: {
    marginBottom: 20,
  },
  benefitsTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.foreground,
    marginBottom: 15,
  },
  benefitItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    paddingHorizontal: 10,
  },
  benefitText: {
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
  successContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  successIconContainer: {
    marginBottom: 30,
  },
  successIconBackground: {
    width: 120,
    height: 120,
    borderRadius: 60,
    justifyContent: 'center',
    alignItems: 'center',
  },
  successTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: COLORS.foreground,
    marginBottom: 15,
  },
  successText: {
    fontSize: 16,
    color: COLORS['muted-foreground'],
    textAlign: 'center',
    lineHeight: 24,
  },
});