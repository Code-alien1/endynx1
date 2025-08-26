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

interface ExpoGoFaceAuthProps {
  visible: boolean;
  onClose: () => void;
  onSuccess: (userData?: any) => void;
  mode: 'login' | 'register';
  title?: string;
  subtitle?: string;
}

export default function ExpoGoFaceAuth({
  visible,
  onClose,
  onSuccess,
  mode,
  title,
  subtitle
}: ExpoGoFaceAuthProps) {
  const [isProcessing, setIsProcessing] = useState(false);

  const handleStartFaceAuth = async () => {
    setIsProcessing(true);
    
    // Simulate face recognition process
    setTimeout(() => {
      setIsProcessing(false);
      Alert.alert(
        'Face Recognition Demo',
        `${mode === 'login' ? 'Authentication' : 'Registration'} completed successfully! This is a demo version compatible with Expo Go.`,
        [
          {
            text: 'OK',
            onPress: () => {
              onSuccess({ 
                first_name: 'Demo User',
                face_captured: true,
                demo_mode: true 
              });
              onClose();
            }
          }
        ]
      );
    }, 2000);
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="fullScreen"
      onRequestClose={onClose}
    >
      <LinearGradient
        colors={[COLORS.background, COLORS['background-secondary']]}
        style={styles.container}
      >
        <View style={styles.header}>
          <TouchableOpacity style={styles.closeButton} onPress={onClose}>
            <Ionicons name="close" size={24} color={COLORS.foreground} />
          </TouchableOpacity>
        </View>

        <View style={styles.content}>
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
              ? 'Demo face authentication for Expo Go' 
              : 'Demo face registration for Expo Go')}
          </Text>

          <View style={styles.demoNotice}>
            <Ionicons name="information-circle" size={20} color={COLORS.primary} />
            <Text style={styles.demoText}>
              This is a demo version compatible with Expo Go. For full Vision Camera functionality, 
              use a development build with `expo run:ios` or `expo run:android`.
            </Text>
          </View>

          <View style={styles.featuresContainer}>
            <View style={styles.featureItem}>
              <Ionicons name="phone-portrait" size={20} color={COLORS.primary} />
              <Text style={styles.featureText}>Expo Go Compatible</Text>
            </View>
            <View style={styles.featureItem}>
              <Ionicons name="shield-checkmark" size={20} color={COLORS.primary} />
              <Text style={styles.featureText}>Demo Authentication</Text>
            </View>
            <View style={styles.featureItem}>
              <Ionicons name="flash" size={20} color={COLORS.primary} />
              <Text style={styles.featureText}>Professional UI/UX</Text>
            </View>
          </View>

          <View style={styles.instructionsList}>
            <Text style={styles.instructionsTitle}>For full functionality:</Text>
            <Text style={styles.instructionItem}>• Run `expo run:ios` for iOS development build</Text>
            <Text style={styles.instructionItem}>• Run `expo run:android` for Android development build</Text>
            <Text style={styles.instructionItem}>• This enables Vision Camera integration</Text>
            <Text style={styles.instructionItem}>• Real face detection and recognition</Text>
          </View>

          <TouchableOpacity
            style={[styles.actionButton, isProcessing && styles.disabledButton]}
            onPress={handleStartFaceAuth}
            disabled={isProcessing}
          >
            <Text style={styles.actionButtonText}>
              {isProcessing 
                ? 'Processing...' 
                : `Demo ${mode === 'login' ? 'Authentication' : 'Registration'}`
              }
            </Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.cancelButton} onPress={onClose}>
            <Text style={styles.cancelButtonText}>Cancel</Text>
          </TouchableOpacity>
        </View>
      </LinearGradient>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginTop: 40,
    marginHorizontal: 20,
  },
  closeButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: COLORS.card,
    justifyContent: 'center',
    alignItems: 'center',
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  iconContainer: {
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
  demoNotice: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: COLORS.card,
    borderRadius: 12,
    padding: 15,
    marginBottom: 30,
    borderLeftWidth: 4,
    borderLeftColor: COLORS.primary,
  },
  demoText: {
    flex: 1,
    fontSize: 14,
    color: COLORS['muted-foreground'],
    marginLeft: 10,
    lineHeight: 20,
  },
  featuresContainer: {
    marginBottom: 30,
    width: '100%',
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
    width: '100%',
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
    minWidth: 250,
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
  },
  cancelButtonText: {
    color: COLORS['muted-foreground'],
    fontSize: 16,
    textAlign: 'center',
  },
});