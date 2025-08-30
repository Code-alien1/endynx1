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
import FaceRecognitionCamera from './FaceRecognitionCamera';
import { useAuth } from '../contexts/AuthContext';
import apiService, { AttendanceSession } from '../services/api';

interface FaceRecognitionResult {
  success: boolean;
  error?: string;
  faceEncoding?: string;
  confidence?: number;
  imageUri?: string;
}

interface FaceAttendanceProps {
  visible: boolean;
  onClose: () => void;
  onSuccess: (attendance: any) => void;
  session?: AttendanceSession;
}

export default function FaceAttendance({ 
  visible, 
  onClose, 
  onSuccess, 
  session 
}: FaceAttendanceProps) {
  const [showCamera, setShowCamera] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [attendanceStep, setAttendanceStep] = useState<'intro' | 'camera' | 'processing'>('intro');
  const [location, setLocation] = useState<string>('');
  const { user } = useAuth();

  useEffect(() => {
    if (visible) {
      // Get user's location for attendance
      getCurrentLocation();
    }
  }, [visible]);

  const getCurrentLocation = async () => {
    try {
      // In a real app, you would use expo-location to get GPS coordinates
      // For now, we'll use a placeholder
      setLocation('School Campus - Main Building');
    } catch (error) {
      console.error('Error getting location:', error);
      setLocation('Unknown Location');
    }
  };

  const handleStartAttendance = () => {
    if (!session) {
      Alert.alert('Error', 'No attendance session selected');
      return;
    }
    setAttendanceStep('camera');
    setShowCamera(true);
  };

  const handleFaceDetected = async (result: FaceRecognitionResult) => {
    if (!result.success || !result.faceEncoding || !session || !user) {
      Alert.alert('Attendance Failed', result.error || 'Failed to process face data');
      return;
    }

    try {
      setIsProcessing(true);
      setAttendanceStep('processing');
      setShowCamera(false);

      // Convert image to base64 if available
      let imageData = '';
      if (result.imageUri) {
        imageData = await convertImageToBase64(result.imageUri);
      }

      // Mark attendance with face recognition
      const attendance = await apiService.markAttendanceWithFace(
        session.id,
        result.faceEncoding,
        Math.round((result.confidence || 0.8) * 1000) / 1000,
        location,
        imageData
      );

      Alert.alert(
        'Attendance Marked!',
        `Your attendance has been successfully recorded for ${session.class_name}.`,
        [
          {
            text: 'OK',
            onPress: () => {
              onSuccess(attendance);
              onClose();
            }
          }
        ]
      );

    } catch (error: any) {
      console.error('Face attendance error:', error);
      
      let errorMessage = 'Failed to mark attendance. Please try again.';
      if (error.response?.status === 404) {
        errorMessage = 'Face not recognized. Please register your face first or contact your teacher.';
      } else if (error.response?.status === 409) {
        errorMessage = 'Attendance already marked for this session.';
      } else if (error.response?.data?.error) {
        errorMessage = error.response.data.error;
      }

      Alert.alert(
        'Attendance Failed',
        errorMessage,
        [
          {
            text: 'Try Again',
            onPress: () => setAttendanceStep('intro')
          },
          {
            text: 'Cancel',
            onPress: onClose
          }
        ]
      );
    } finally {
      setIsProcessing(false);
    }
  };

  const handleCloseCamera = () => {
    setShowCamera(false);
    setAttendanceStep('intro');
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
            <Ionicons name="checkmark-circle" size={60} color="#fff" />
          </LinearGradient>
        </View>

        <Text style={styles.title}>Mark Attendance</Text>
        <Text style={styles.subtitle}>
          Use face recognition to mark your attendance
        </Text>

        {session && (
          <View style={styles.sessionInfo}>
            <Text style={styles.sessionTitle}>Session Details</Text>
            <View style={styles.sessionItem}>
              <Ionicons name="school" size={16} color={COLORS.primary} />
              <Text style={styles.sessionText}>{session.class_name}</Text>
            </View>
            <View style={styles.sessionItem}>
              <Ionicons name="time" size={16} color={COLORS.primary} />
              <Text style={styles.sessionText}>
                {session.session_type.charAt(0).toUpperCase() + session.session_type.slice(1)} Session
              </Text>
            </View>
            <View style={styles.sessionItem}>
              <Ionicons name="calendar" size={16} color={COLORS.primary} />
              <Text style={styles.sessionText}>{session.date}</Text>
            </View>
            <View style={styles.sessionItem}>
              <Ionicons name="location" size={16} color={COLORS.primary} />
              <Text style={styles.sessionText}>{location}</Text>
            </View>
          </View>
        )}

        <View style={styles.instructionsList}>
          <Text style={styles.instructionsTitle}>Instructions:</Text>
          <Text style={styles.instructionItem}>• Position your face in the camera frame</Text>
          <Text style={styles.instructionItem}>• Keep your eyes open and face the camera</Text>
          <Text style={styles.instructionItem}>• Ensure good lighting</Text>
          <Text style={styles.instructionItem}>• Stay still during capture</Text>
        </View>

        <TouchableOpacity
          style={styles.startButton}
          onPress={handleStartAttendance}
          disabled={isProcessing || !session}
        >
          <Ionicons name="camera" size={20} color="#fff" />
          <Text style={styles.startButtonText}>Start Face Scan</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.cancelButton} onPress={onClose}>
          <Text style={styles.cancelButtonText}>Cancel</Text>
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
          <Text style={styles.processingTitle}>Marking Attendance...</Text>
          <Text style={styles.processingText}>
            Please wait while we verify your identity and record your attendance
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
      {attendanceStep === 'intro' && renderIntroScreen()}
      {attendanceStep === 'processing' && renderProcessingScreen()}
      {attendanceStep === 'camera' && showCamera && (
        <FaceRecognitionCamera
          mode="authenticate"
          onFaceDetected={handleFaceDetected}
          onClose={handleCloseCamera}
          title="Mark Attendance"
          subtitle="Look at the camera to mark your attendance"
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
  sessionInfo: {
    backgroundColor: COLORS.card,
    borderRadius: 12,
    padding: 20,
    marginBottom: 20,
  },
  sessionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.foreground,
    marginBottom: 15,
  },
  sessionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  sessionText: {
    fontSize: 14,
    color: COLORS['muted-foreground'],
    marginLeft: 10,
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
    marginLeft: 10,
  },
  cancelButton: {
    paddingVertical: 15,
    alignItems: 'center',
  },
  cancelButtonText: {
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
    paddingHorizontal: 20,
  },
});