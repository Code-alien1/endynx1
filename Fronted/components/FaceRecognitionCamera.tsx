import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ActivityIndicator,
  Dimensions,
} from 'react-native';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { COLORS } from '../constants/theme';
import faceRecognitionService from '../services/faceRecognitionService';

interface FaceData {
  bounds: {
    origin: { x: number; y: number };
    size: { width: number; height: number };
  };
  rollAngle: number;
  yawAngle: number;
  leftEyeOpenProbability?: number;
  rightEyeOpenProbability?: number;
}

interface FaceRecognitionResult {
  success: boolean;
  error?: string;
  faceEncoding?: string;
  confidence?: number;
}

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

interface FaceRecognitionCameraProps {
  onFaceDetected: (result: FaceRecognitionResult) => void;
  onClose: () => void;
  mode: 'register' | 'authenticate';
  title?: string;
  subtitle?: string;
}

export default function FaceRecognitionCamera({
  onFaceDetected,
  onClose,
  mode,
  title,
  subtitle
}: FaceRecognitionCameraProps) {
  const [permission, requestPermission] = useCameraPermissions();
  const [isProcessing, setIsProcessing] = useState(false);
  const [detectedFaces, setDetectedFaces] = useState<FaceData[]>([]);
  const [feedback, setFeedback] = useState<string>('Position your face in the frame');
  const [captureReady, setCaptureReady] = useState(false);
  const cameraRef = useRef<CameraView>(null);

  useEffect(() => {
    if (!permission) {
      requestPermission();
    }
  }, []);

  useEffect(() => {
    // Basic validation - camera component will handle the rest
    setCaptureReady(true);
  }, []);

  const handleFacesDetected = ({ faces }: { faces: FaceData[] }) => {
    setDetectedFaces(faces);
    
    if (faces.length === 0) {
      setFeedback('No face detected. Please position your face in the frame.');
      setCaptureReady(false);
    } else if (faces.length > 1) {
      setFeedback('Multiple faces detected. Please ensure only one face is visible.');
      setCaptureReady(false);
    } else {
      const face = faces[0];
      
      // Check face quality
      const faceSize = Math.min(face.bounds.size.width, face.bounds.size.height);
      const rollAngle = Math.abs(face.rollAngle);
      const yawAngle = Math.abs(face.yawAngle);
      
      if (faceSize < 100) {
        setFeedback('Move closer to the camera');
        setCaptureReady(false);
      } else if (rollAngle > 30 || yawAngle > 30) {
        setFeedback('Please face the camera directly');
        setCaptureReady(false);
      } else if (face.leftEyeOpenProbability !== undefined && 
                 face.rightEyeOpenProbability !== undefined &&
                 (face.leftEyeOpenProbability < 0.5 || face.rightEyeOpenProbability < 0.5)) {
        setFeedback('Please keep your eyes open');
        setCaptureReady(false);
      } else {
        setFeedback('Perfect! Tap capture to continue');
        setCaptureReady(true);
      }
    }
  };

  const handleCapture = async () => {
    if (!cameraRef.current || isProcessing || !captureReady) return;

    try {
      setIsProcessing(true);
      setFeedback('Processing...');

      const photo = await cameraRef.current.takePictureAsync({
        quality: 0.8,
        base64: false,
        skipProcessing: false,
      });

      if (!photo) {
        throw new Error('Failed to capture photo');
      }

      // Simulate face recognition processing
      const result: FaceRecognitionResult = {
        success: true,
        faceEncoding: 'mock_face_encoding_' + Date.now(),
        confidence: 0.95
      };
      
      onFaceDetected(result);

    } catch (error) {
      console.error('Capture error:', error);
      Alert.alert('Error', 'Failed to capture image. Please try again.');
      setFeedback('Position your face in the frame');
      setCaptureReady(false);
    } finally {
      setIsProcessing(false);
    }
  };

  const requestCameraPermission = async () => {
    const result = await requestPermission();
    if (!result.granted) {
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

  if (!permission) {
    return (
      <View style={styles.container}>
        <ActivityIndicator size="large" color={COLORS.primary} />
        <Text style={styles.loadingText}>Loading camera...</Text>
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
            We need access to your camera for face recognition
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

        {/* Face Detection Overlay - Simplified for demo */}

        {/* Center Guide */}
        <View style={styles.centerGuide}>
          <View style={[styles.guideCorner, styles.topLeft]} />
          <View style={[styles.guideCorner, styles.topRight]} />
          <View style={[styles.guideCorner, styles.bottomLeft]} />
          <View style={[styles.guideCorner, styles.bottomRight]} />
        </View>

        {/* Bottom Controls */}
        <LinearGradient
          colors={['transparent', 'rgba(0,0,0,0.8)']}
          style={styles.bottomControls}
        >
          <Text style={styles.feedbackText}>{feedback}</Text>
          
          <View style={styles.controlsRow}>
            <TouchableOpacity
              style={[
                styles.captureButton,
                { opacity: captureReady && !isProcessing ? 1 : 0.5 }
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
        </LinearGradient>
      </CameraView>
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
  centerGuide: {
    position: 'absolute',
    top: '50%',
    left: '50%',
    width: 200,
    height: 250,
    marginTop: -125,
    marginLeft: -100,
  },
  guideCorner: {
    position: 'absolute',
    width: 30,
    height: 30,
    borderColor: 'rgba(255,255,255,0.6)',
    borderWidth: 2,
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
  feedbackText: {
    fontSize: 16,
    color: '#fff',
    textAlign: 'center',
    marginBottom: 20,
    fontWeight: '500',
  },
  controlsRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  captureButton: {
    width: 70,
    height: 70,
    borderRadius: 35,
    backgroundColor: COLORS.primary,
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
  },
});