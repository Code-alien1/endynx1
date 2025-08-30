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
import { CameraView, useCameraPermissions } from 'expo-camera';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { COLORS } from '../constants/theme';
import faceRecognitionService from '../services/faceRecognitionService';
import { useAuth } from '../contexts/AuthContext';

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

interface FaceAttendanceCameraProps {
  visible: boolean;
  onClose: () => void;
  onSuccess: (userData: any) => void;
  sessionId?: string;
  sessionName?: string;
  title?: string;
  subtitle?: string;
}

export default function FaceAttendanceCamera({
  visible,
  onClose,
  onSuccess,
  sessionId,
  sessionName,
  title,
  subtitle
}: FaceAttendanceCameraProps) {
  const [permission, requestPermission] = useCameraPermissions();
  const cameraRef = useRef<CameraView>(null);
  const { user } = useAuth();
  
  const [isProcessing, setIsProcessing] = useState(false);
  const [showCamera, setShowCamera] = useState(false);
  const [feedback, setFeedback] = useState<string>('Position your face in the frame');
  const [captureReady, setCaptureReady] = useState(true);

  useEffect(() => {
    if (visible && permission?.granted) {
      setShowCamera(true);
    }
  }, [visible, permission?.granted]);

  const handleCapture = async () => {
    if (!cameraRef.current || isProcessing) return;

    try {
      setIsProcessing(true);
      setFeedback('Capturing photo...');

      const photo = await cameraRef.current.takePictureAsync({
        quality: 0.8,
        base64: false,
        skipProcessing: false,
      });

      if (!photo) {
        throw new Error('Failed to capture photo');
      }

      setFeedback('Processing face recognition for attendance...');
      await handleFaceAttendance(photo.uri);

    } catch (error) {
      console.error('Capture error:', error);
      Alert.alert('Error', 'Failed to capture image. Please try again.');
      setFeedback('Position your face in the frame');
      setIsProcessing(false);
    }
  };

  const handleFaceAttendance = async (imageUri: string) => {
    try {
      // Ensure user is available
      if (!user?.id) {
        Alert.alert('Error', 'You must be logged in to mark attendance.');
        setIsProcessing(false);
        return;
      }

      // Validate image first
      const validation = await faceRecognitionService.validateImage(imageUri);
      if (!validation.valid) {
        Alert.alert('Invalid Image', validation.error || 'Please capture a valid image');
        setIsProcessing(false);
        return;
      }

      // Convert image to base64
      const base64Image = await faceRecognitionService.convertImageToBase64(imageUri);

      // Send to face recognition API for attendance
      const result = await faceRecognitionService.recognizeForAttendance(base64Image, user.id);
      
      setIsProcessing(false);
      
      if (result.success && result.user) {
        Alert.alert(
          'Attendance Marked!',
          `Hello ${result.user.first_name}! Your attendance has been successfully recorded${sessionName ? ` for ${sessionName}` : ''}.`,
          [
            {
              text: 'Great!',
              onPress: () => {
                onSuccess({
                  user: result.user,
                  confidence: result.confidence,
                  session_id: sessionId,
                  timestamp: new Date().toISOString(),
                  method: 'face_recognition'
                });
                onClose();
              }
            }
          ]
        );
      } else {
        Alert.alert(
          'Face Not Recognized',
          result.error || 'Face not recognized. Please register your face first or use alternative attendance method.',
          [
            {
              text: 'Try Again',
              onPress: () => setFeedback('Position your face in the frame')
            },
            {
              text: 'Use QR Code',
              onPress: onClose
            }
          ]
        );
      }
    } catch (error) {
      console.error('Face attendance error:', error);
      setIsProcessing(false);
      Alert.alert('Error', 'Attendance marking failed. Please try again.');
    }
  };

  const requestCameraPermission = async () => {
    const result = await requestPermission();
    if (!result.granted) {
      Alert.alert(
        'Permission Required',
        'Camera permission is required for face recognition attendance. Please enable it in your device settings.',
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
              name="checkmark-circle" 
              size={60} 
              color="#fff" 
            />
          </LinearGradient>
        </View>

        <Text style={styles.title}>
          {title || 'Mark Attendance'}
        </Text>
        
        <Text style={styles.subtitle}>
          {subtitle || 'Use face recognition to mark your attendance quickly and securely'}
        </Text>

        {sessionName && (
          <View style={styles.sessionInfo}>
            <Ionicons name="school" size={20} color={COLORS.primary} />
            <Text style={styles.sessionText}>{sessionName}</Text>
          </View>
        )}

        <View style={styles.featuresContainer}>
          <View style={styles.featureItem}>
            <Ionicons name="flash" size={20} color={COLORS.primary} />
            <Text style={styles.featureText}>Quick & Secure</Text>
          </View>
          <View style={styles.featureItem}>
            <Ionicons name="shield-checkmark" size={20} color={COLORS.primary} />
            <Text style={styles.featureText}>Biometric Verification</Text>
          </View>
          <View style={styles.featureItem}>
            <Ionicons name="time" size={20} color={COLORS.primary} />
            <Text style={styles.featureText}>Instant Recording</Text>
          </View>
        </View>

        <View style={styles.instructionsList}>
          <Text style={styles.instructionsTitle}>For best results:</Text>
          <Text style={styles.instructionItem}>• Ensure good lighting</Text>
          <Text style={styles.instructionItem}>• Look directly at the camera</Text>
          <Text style={styles.instructionItem}>• Keep your face in the frame</Text>
          <Text style={styles.instructionItem}>• Stay still during capture</Text>
        </View>

        <TouchableOpacity
          style={[styles.actionButton, isProcessing && styles.disabledButton]}
          onPress={() => setShowCamera(true)}
          disabled={isProcessing}
        >
          <Text style={styles.actionButtonText}>
            Start Face Recognition
          </Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.cancelButton} onPress={onClose}>
          <Text style={styles.cancelButtonText}>Use QR Code Instead</Text>
        </TouchableOpacity>
      </LinearGradient>
    </View>
  );

  const renderCameraScreen = () => {
    if (!permission) {
      return (
        <View style={styles.container}>
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={COLORS.primary} />
            <Text style={styles.loadingText}>Loading camera...</Text>
          </View>
        </View>
      );
    }

    if (!permission.granted) {
      return (
        <View style={styles.container}>
          <LinearGradient
            colors={[COLORS.background, COLORS['background-secondary']]}
            style={styles.permissionContainer}
          >
            <Ionicons name="camera-outline" size={80} color={COLORS.muted} />
            <Text style={styles.permissionTitle}>Camera Permission Required</Text>
            <Text style={styles.permissionText}>
              We need access to your camera for face recognition attendance.
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

    return (
      <View style={styles.container}>
        <CameraView
          ref={cameraRef}
          style={styles.camera}
          facing="front"
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
                Mark Attendance
              </Text>
              <Text style={styles.cameraHeaderSubtitle}>
                Position your face in the frame and tap capture
              </Text>
              {sessionName && (
                <Text style={styles.cameraSessionName}>
                  {sessionName}
                </Text>
              )}
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
                  <Ionicons name="checkmark-circle" size={32} color="#fff" />
                )}
              </TouchableOpacity>
            </View>

            <Text style={styles.instructionText}>
              Look directly at the camera to mark your attendance
            </Text>
          </LinearGradient>
        </CameraView>
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
    marginBottom: 30,
    lineHeight: 24,
  },
  sessionInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.card,
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 12,
    marginBottom: 30,
  },
  sessionText: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.foreground,
    marginLeft: 10,
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
  cameraSessionName: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.6)',
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