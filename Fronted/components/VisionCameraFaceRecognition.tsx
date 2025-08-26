import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ActivityIndicator,
  Dimensions,
  StatusBar,
} from 'react-native';
import { Camera, useCameraDevice, useCameraPermission, PhotoFile, TakePhotoOptions } from 'react-native-vision-camera';
import { Face, useFaceDetector } from 'vision-camera-face-detector';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { COLORS } from '../constants/theme';
import visionCameraFaceRecognitionService, { FaceRecognitionResult } from '../services/visionCameraFaceRecognition';

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

interface VisionCameraFaceRecognitionProps {
  onFaceDetected: (result: FaceRecognitionResult) => void;
  onClose: () => void;
  mode: 'register' | 'authenticate';
  title?: string;
  subtitle?: string;
}

export default function VisionCameraFaceRecognition({
  onFaceDetected,
  onClose,
  mode,
  title,
  subtitle
}: VisionCameraFaceRecognitionProps) {
  const { hasPermission, requestPermission } = useCameraPermission();
  const device = useCameraDevice('front');
  const camera = useRef<Camera>(null);
  
  const [isProcessing, setIsProcessing] = useState(false);
  const [detectedFaces, setDetectedFaces] = useState<Face[]>([]);
  const [feedback, setFeedback] = useState<string>('Position your face in the frame');
  const [captureReady, setCaptureReady] = useState(false);
  const [isActive, setIsActive] = useState(true);

  // Face detection hook
  const faceDetectionOptions = {
    performanceMode: 'accurate' as const,
    landmarkMode: 'all' as const,
    classificationMode: 'all' as const,
    minFaceSize: 0.1,
    tracking: true,
  };

  const { detectFaces } = useFaceDetector(faceDetectionOptions);

  useEffect(() => {
    // Check system requirements
    const support = visionCameraFaceRecognitionService.validateSystemRequirements();
    if (!support.supported) {
      Alert.alert('Not Supported', support.reason || 'Face recognition is not supported');
      onClose();
    }
  }, []);

  useEffect(() => {
    // Update feedback based on detected faces
    const feedbackMessage = visionCameraFaceRecognitionService.getQualityFeedback(detectedFaces);
    setFeedback(feedbackMessage);
    setCaptureReady(feedbackMessage.includes('Perfect!') || feedbackMessage.includes('Good positioning'));
  }, [detectedFaces]);

  const handleFacesDetected = useCallback((faces: Face[]) => {
    setDetectedFaces(faces);
  }, []);

  const handleCapture = async () => {
    if (!camera.current || isProcessing || !captureReady) return;

    try {
      setIsProcessing(true);
      setFeedback('Processing...');
      setIsActive(false); // Stop camera preview during processing

      const photoOptions: TakePhotoOptions = {
        quality: 85,
        skipMetadata: false,
      };

      const photo: PhotoFile = await camera.current.takePhoto(photoOptions);
      
      if (!photo) {
        throw new Error('Failed to capture photo');
      }

      // Process the captured faces
      const result = await visionCameraFaceRecognitionService.processFaces(
        detectedFaces, 
        `file://${photo.path}`
      );
      
      if (result.success) {
        onFaceDetected(result);
      } else {
        Alert.alert('Face Recognition Failed', result.error || 'Please try again');
        setFeedback('Position your face in the frame');
        setCaptureReady(false);
        setIsActive(true); // Resume camera preview
      }

    } catch (error) {
      console.error('Capture error:', error);
      Alert.alert('Error', 'Failed to capture image. Please try again.');
      setFeedback('Position your face in the frame');
      setCaptureReady(false);
      setIsActive(true); // Resume camera preview
    } finally {
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
            // In a real app, you would open device settings
            Alert.alert('Please enable camera permission in your device settings');
          }}
        ]
      );
    }
  };

  if (!hasPermission) {
    return (
      <View style={styles.container}>
        <StatusBar barStyle="light-content" backgroundColor={COLORS.background} />
        <LinearGradient
          colors={[COLORS.background, COLORS['background-secondary']]}
          style={styles.permissionContainer}
        >
          <Ionicons name="camera-outline" size={80} color={COLORS.muted} />
          <Text style={styles.permissionTitle}>Camera Permission Required</Text>
          <Text style={styles.permissionText}>
            We need access to your camera for face recognition authentication and attendance marking.
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
        <StatusBar barStyle="light-content" backgroundColor={COLORS.background} />
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={COLORS.primary} />
          <Text style={styles.loadingText}>Loading camera...</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="transparent" translucent />
      
      <Camera
        ref={camera}
        style={styles.camera}
        device={device}
        isActive={isActive && !isProcessing}
        photo={true}
        frameProcessor={detectFaces}
        onInitialized={() => console.log('Camera initialized')}
        onError={(error) => {
          console.error('Camera error:', error);
          Alert.alert('Camera Error', 'Failed to initialize camera');
        }}
      >
        {/* Header */}
        <LinearGradient
          colors={['rgba(0,0,0,0.8)', 'transparent']}
          style={styles.header}
        >
          <TouchableOpacity style={styles.closeButton} onPress={onClose}>
            <Ionicons name="close" size={24} color="#fff" />
          </TouchableOpacity>
          <View style={styles.headerContent}>
            <Text style={styles.headerTitle}>
              {title || (mode === 'register' ? 'Register Face' : 'Face Authentication')}
            </Text>
            <Text style={styles.headerSubtitle}>
              {subtitle || (mode === 'register' 
                ? 'Position your face in the frame to register' 
                : 'Look at the camera to authenticate')}
            </Text>
          </View>
        </LinearGradient>

        {/* Face Detection Overlays */}
        {detectedFaces.map((face, index) => (
          <View
            key={index}
            style={[
              styles.faceBox,
              {
                left: face.bounds.x,
                top: face.bounds.y,
                width: face.bounds.width,
                height: face.bounds.height,
                borderColor: captureReady ? COLORS.primary : COLORS.destructive,
              }
            ]}
          >
            {/* Face confidence indicator */}
            {face.confidence && (
              <View style={styles.confidenceIndicator}>
                <Text style={styles.confidenceText}>
                  {Math.round(face.confidence * 100)}%
                </Text>
              </View>
            )}
            
            {/* Landmark indicators */}
            {face.landmarks && (
              <>
                {face.landmarks.leftEye && (
                  <View style={[styles.landmark, {
                    left: face.landmarks.leftEye.x - face.bounds.x - 2,
                    top: face.landmarks.leftEye.y - face.bounds.y - 2,
                  }]} />
                )}
                {face.landmarks.rightEye && (
                  <View style={[styles.landmark, {
                    left: face.landmarks.rightEye.x - face.bounds.x - 2,
                    top: face.landmarks.rightEye.y - face.bounds.y - 2,
                  }]} />
                )}
                {face.landmarks.noseBase && (
                  <View style={[styles.landmark, {
                    left: face.landmarks.noseBase.x - face.bounds.x - 2,
                    top: face.landmarks.noseBase.y - face.bounds.y - 2,
                  }]} />
                )}
              </>
            )}
          </View>
        ))}

        {/* Center Guide Frame */}
        <View style={styles.centerGuide}>
          <View style={[styles.guideCorner, styles.topLeft]} />
          <View style={[styles.guideCorner, styles.topRight]} />
          <View style={[styles.guideCorner, styles.bottomLeft]} />
          <View style={[styles.guideCorner, styles.bottomRight]} />
          
          {/* Guide text */}
          <Text style={styles.guideText}>Position your face here</Text>
        </View>

        {/* Bottom Controls */}
        <LinearGradient
          colors={['transparent', 'rgba(0,0,0,0.8)']}
          style={styles.bottomControls}
        >
          {/* Quality Indicators */}
          <View style={styles.qualityIndicators}>
            <View style={[styles.qualityDot, { 
              backgroundColor: detectedFaces.length === 1 ? COLORS.primary : COLORS.muted 
            }]} />
            <Text style={styles.qualityLabel}>Face Detected</Text>
            
            <View style={[styles.qualityDot, { 
              backgroundColor: captureReady ? COLORS.primary : COLORS.muted 
            }]} />
            <Text style={styles.qualityLabel}>Quality Good</Text>
          </View>

          <Text style={styles.feedbackText}>{feedback}</Text>
          
          <View style={styles.controlsRow}>
            {/* Capture Button */}
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

          {/* Instructions */}
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
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  camera: {
    flex: 1,
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
  cancelButton: {
    paddingHorizontal: 30,
    paddingVertical: 15,
  },
  cancelButtonText: {
    color: COLORS['muted-foreground'],
    fontSize: 16,
  },
  header: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    paddingTop: 50,
    paddingBottom: 20,
    paddingHorizontal: 20,
    zIndex: 1,
  },
  closeButton: {
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
  headerContent: {
    alignItems: 'center',
    marginTop: 10,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#fff',
    textAlign: 'center',
  },
  headerSubtitle: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.8)',
    textAlign: 'center',
    marginTop: 5,
  },
  faceBox: {
    position: 'absolute',
    borderWidth: 2,
    borderRadius: 8,
    backgroundColor: 'transparent',
  },
  confidenceIndicator: {
    position: 'absolute',
    top: -25,
    right: 0,
    backgroundColor: 'rgba(0,0,0,0.7)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  confidenceText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: 'bold',
  },
  landmark: {
    position: 'absolute',
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: COLORS.primary,
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
  bottomControls: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    paddingBottom: 40,
    paddingTop: 30,
    paddingHorizontal: 20,
    alignItems: 'center',
  },
  qualityIndicators: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 15,
  },
  qualityDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 8,
  },
  qualityLabel: {
    color: 'rgba(255,255,255,0.8)',
    fontSize: 12,
    marginRight: 20,
  },
  feedbackText: {
    fontSize: 16,
    color: '#fff',
    textAlign: 'center',
    marginBottom: 20,
    fontWeight: '500',
    minHeight: 20,
  },
  controlsRow: {
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