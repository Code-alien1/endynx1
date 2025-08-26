import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ActivityIndicator,
  Modal,
  Dimensions,
} from 'react-native';
import { Camera, useCameraDevice, useCameraPermission } from 'react-native-vision-camera';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { COLORS } from '../constants/theme';

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

interface WorkingFaceAuthProps {
  visible: boolean;
  onClose: () => void;
  onSuccess: (userData?: any) => void;
  mode: 'login' | 'register';
  title?: string;
  subtitle?: string;
}

export default function WorkingFaceAuth({
  visible,
  onClose,
  onSuccess,
  mode,
  title,
  subtitle
}: WorkingFaceAuthProps) {
  const { hasPermission, requestPermission } = useCameraPermission();
  const device = useCameraDevice('front');
  const camera = useRef<Camera>(null);
  
  const [isProcessing, setIsProcessing] = useState(false);
  const [showCamera, setShowCamera] = useState(false);
  const [feedback, setFeedback] = useState<string>('Position your face in the frame');
  const [captureReady, setCaptureReady] = useState(true);

  useEffect(() => {
    if (visible && hasPermission && device) {
      setShowCamera(true);
    }
  }, [visible, hasPermission, device]);

  const handleCapture = async () => {
    if (!camera.current || isProcessing) return;

    try {
      setIsProcessing(true);
      setFeedback('Processing...');

      const photo = await camera.current.takePhoto({
        quality: 85,
        skipMetadata: false,
      });

      if (!photo) {
        throw new Error('Failed to capture photo');
      }

      // Simulate face recognition processing
      setTimeout(() => {
        setIsProcessing(false);
        Alert.alert(
          'Face Recognition Demo',
          `${mode === 'login' ? 'Authentication' : 'Registration'} completed successfully! This is using Vision Camera for high-quality capture.`,
          [
            {
              text: 'OK',
              onPress: () => {
                onSuccess({ 
                  first_name: 'Demo User',
                  face_captured: true,
                  photo_path: photo.path 
                });
                onClose();
              }
            }
          ]
        );
      }, 2000);

    } catch (error) {
      console.error('Capture error:', error);
      Alert.alert('Error', 'Failed to capture image. Please try again.');
      setFeedback('Position your face in the frame');
      setIsProcessing(false);
    }
  };

  const requestCameraPermission = async () => {
    const permission = await requestPermission();
    if (!permission) {
      Alert.alert(
        'Permission Required',
        'Camera permission is required for face recognition. Please enable it in your device settings.',
        [
          { text: 'Cancel', onPress: onClose },
          { text: 'Settings', onPress: () => {
            Alert.alert('Please enable camera permission in your device settings');
          }}
        ]
      );
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
            <Ionicons 
              name={mode === 'login' ? 'finger-print' : 'scan'} 
              size={60} 
              color="#fff" 
            />
          </LinearGradient>
        </View>

        <Text style={styles.title}>
          {title || (mode === 'login' ? 'Face Authentication' : 'Face Registration')}
        </Text>
        
        <Text style={styles.subtitle}>
          {subtitle || (mode === 'login' 
            ? 'Use Vision Camera for secure authentication' 
            : 'Register your face using advanced camera technology')}
        </Text>

        <View style={styles.featuresContainer}>
          <View style={styles.featureItem}>
            <Ionicons name="camera" size={20} color={COLORS.primary} />
            <Text style={styles.featureText}>High-quality Vision Camera</Text>
          </View>
          <View style={styles.featureItem}>
            <Ionicons name="shield-checkmark" size={20} color={COLORS.primary} />
            <Text style={styles.featureText}>Secure biometric capture</Text>
          </View>
          <View style={styles.featureItem}>
            <Ionicons name="flash" size={20} color={COLORS.primary} />
            <Text style={styles.featureText}>Professional camera interface</Text>
          </View>
        </View>

        <TouchableOpacity
          style={[styles.actionButton, isProcessing && styles.disabledButton]}
          onPress={() => setShowCamera(true)}
          disabled={isProcessing}
        >
          <Text style={styles.actionButtonText}>
            Start {mode === 'login' ? 'Authentication' : 'Registration'}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.cancelButton} onPress={onClose}>
          <Text style={styles.cancelButtonText}>Cancel</Text>
        </TouchableOpacity>
      </LinearGradient>
    </View>
  );

  const renderCameraScreen = () => {
    if (!hasPermission) {
      return (
        <View style={styles.container}>
          <LinearGradient
            colors={[COLORS.background, COLORS['background-secondary']]}
            style={styles.permissionContainer}
          >
            <Ionicons name="camera-outline" size={80} color={COLORS.muted} />
            <Text style={styles.permissionTitle}>Camera Permission Required</Text>
            <Text style={styles.permissionText}>
              We need access to your camera for face recognition authentication.
            </Text>
            <TouchableOpacity style={styles.permissionButton} onPress={requestCameraPermission}>
              <Text style={styles.permissionButtonText}>Grant Permission</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.cancelButton} onPress={onClose}>
              <Text style={styles.cancelButtonText}>Cancel</Text>
            </TouchableOpacity>
          </LinearGradient>
        </View>
      );
    }

    if (!device) {
      return (
        <View style={styles.container}>
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={COLORS.primary} />
            <Text style={styles.loadingText}>Loading camera...</Text>
          </View>
        </View>
      );
    }

    return (
      <View style={styles.container}>
        <Camera
          ref={camera}
          style={styles.camera}
          device={device}
          isActive={!isProcessing}
          photo={true}
        >
          {/* Header */}
          <LinearGradient
            colors={['rgba(0,0,0,0.8)', 'transparent']}
            style={styles.cameraHeader}
          >
            <TouchableOpacity style={styles.cameraCloseButton} onPress={() => setShowCamera(false)}>
              <Ionicons name="close" size={24} color="#fff" />
            </TouchableOpacity>
            <View style={styles.cameraHeaderContent}>
              <Text style={styles.cameraHeaderTitle}>
                {title || (mode === 'register' ? 'Register Face' : 'Face Authentication')}
              </Text>
              <Text style={styles.cameraHeaderSubtitle}>
                Position your face in the frame and tap capture
              </Text>
            </View>
          </LinearGradient>

          {/* Center Guide Frame */}
          <View style={styles.centerGuide}>
            <View style={[styles.guideCorner, styles.topLeft]} />
            <View style={[styles.guideCorner, styles.topRight]} />
            <View style={[styles.guideCorner, styles.bottomLeft]} />
            <View style={[styles.guideCorner, styles.bottomRight]} />
            <Text style={styles.guideText}>Position your face here</Text>
          </View>

          {/* Bottom Controls */}
          <LinearGradient
            colors={['transparent', 'rgba(0,0,0,0.8)']}
            style={styles.cameraBottomControls}
          >
            <Text style={styles.cameraFeedbackText}>{feedback}</Text>
            
            <View style={styles.cameraControlsRow}>
              <TouchableOpacity
                style={[
                  styles.captureButton,
                  { 
                    opacity: captureReady && !isProcessing ? 1 : 0.5,
                    backgroundColor: captureReady ? COLORS.primary : COLORS.muted,
                  }
                ]}
                onPress={handleCapture}
                disabled={!captureReady || isProcessing}
              >
                {isProcessing ? (
                  <ActivityIndicator color="#fff" size="small" />
                ) : (
                  <Ionicons name="camera" size={32} color="#fff" />
                )}
              </TouchableOpacity>
            </View>

            <Text style={styles.instructionText}>
              {mode === 'register' 
                ? 'Keep still and look directly at the camera'
                : 'Position your face as you did during registration'
              }
            </Text>
          </LinearGradient>
        </Camera>
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
      {showCamera ? renderCameraScreen() : renderIntroScreen()}
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
  featuresContainer: {
    marginBottom: 40,
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
  actionButton: {
    backgroundColor: COLORS.primary,
    paddingVertical: 16,
    paddingHorizontal: 40,
    borderRadius: 12,
    marginBottom: 20,
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
  actionButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
    textAlign: 'center',
  },
  cancelButton: {
    paddingVertical: 15,
    paddingHorizontal: 30,
    alignItems: 'center',
  },
  cancelButtonText: {
    color: COLORS['muted-foreground'],
    fontSize: 16,
    textAlign: 'center',
  },
  permissionContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  permissionTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: COLORS.foreground,
    marginTop: 20,
    marginBottom: 10,
    textAlign: 'center',
  },
  permissionText: {
    fontSize: 16,
    color: COLORS['muted-foreground'],
    textAlign: 'center',
    marginBottom: 30,
    lineHeight: 24,
  },
  permissionButton: {
    backgroundColor: COLORS.primary,
    paddingHorizontal: 30,
    paddingVertical: 15,
    borderRadius: 12,
    marginBottom: 15,
  },
  permissionButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    color: COLORS.foreground,
    fontSize: 16,
    marginTop: 16,
    textAlign: 'center',
  },
  camera: {
    flex: 1,
  },
  cameraHeader: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    paddingTop: 50,
    paddingBottom: 20,
    paddingHorizontal: 20,
    zIndex: 1,
  },
  cameraCloseButton: {
    position: 'absolute',
    top: 50,
    right: 20,
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  cameraHeaderContent: {
    alignItems: 'center',
    marginTop: 10,
  },
  cameraHeaderTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#fff',
    textAlign: 'center',
  },
  cameraHeaderSubtitle: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.8)',
    textAlign: 'center',
    marginTop: 5,
  },
  centerGuide: {
    position: 'absolute',
    top: '50%',
    left: '50%',
    width: 250,
    height: 300,
    marginTop: -150,
    marginLeft: -125,
    justifyContent: 'center',
    alignItems: 'center',
  },
  guideCorner: {
    position: 'absolute',
    width: 30,
    height: 30,
    borderColor: 'rgba(255,255,255,0.8)',
    borderWidth: 3,
  },
  topLeft: {
    top: 0,
    left: 0,
    borderRightWidth: 0,
    borderBottomWidth: 0,
  },
  topRight: {
    top: 0,
    right: 0,
    borderLeftWidth: 0,
    borderBottomWidth: 0,
  },
  bottomLeft: {
    bottom: 0,
    left: 0,
    borderRightWidth: 0,
    borderTopWidth: 0,
  },
  bottomRight: {
    bottom: 0,
    right: 0,
    borderLeftWidth: 0,
    borderTopWidth: 0,
  },
  guideText: {
    color: 'rgba(255,255,255,0.8)',
    fontSize: 16,
    fontWeight: '500',
    textAlign: 'center',
    backgroundColor: 'rgba(0,0,0,0.5)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  cameraBottomControls: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    paddingBottom: 40,
    paddingTop: 30,
    paddingHorizontal: 20,
    alignItems: 'center',
  },
  cameraFeedbackText: {
    fontSize: 16,
    color: '#fff',
    textAlign: 'center',
    marginBottom: 20,
    fontWeight: '500',
    minHeight: 20,
  },
  cameraControlsRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 15,
  },
  captureButton: {
    width: 80,
    height: 80,
    borderRadius: 40,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: COLORS.primary,
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5,
    borderWidth: 3,
    borderColor: 'rgba(255,255,255,0.3)',
  },
  instructionText: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.7)',
    textAlign: 'center',
    lineHeight: 16,
  },
});