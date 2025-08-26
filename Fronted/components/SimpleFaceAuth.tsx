import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Alert,
  Modal,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { COLORS } from '../constants/theme';

interface SimpleFaceAuthProps {
  visible: boolean;
  onClose: () => void;
  onSuccess: (userData?: any) => void;
  mode: 'login' | 'register';
}

export default function SimpleFaceAuth({ 
  visible, 
  onClose, 
  onSuccess, 
  mode 
}: SimpleFaceAuthProps) {
  const [isProcessing, setIsProcessing] = useState(false);

  const handleStartFaceAuth = async () => {
    setIsProcessing(true);
    
    // Simulate face recognition process
    setTimeout(() => {
      setIsProcessing(false);
      Alert.alert(
        'Face Recognition Demo',
        `${mode === 'login' ? 'Login' : 'Registration'} would be processed here. This is a demo version.`,
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
            {mode === 'login' ? 'Face Authentication' : 'Face Registration'}
          </Text>
          
          <Text style={styles.subtitle}>
            {mode === 'login' 
              ? 'Use face recognition to authenticate' 
              : 'Register your face for future authentication'
            }
          </Text>

          <View style={styles.demoNotice}>
            <Ionicons name="information-circle" size={20} color={COLORS.primary} />
            <Text style={styles.demoText}>
              This is a demo version. Full face recognition requires camera permissions and additional setup.
            </Text>
          </View>

          <TouchableOpacity
            style={[styles.actionButton, isProcessing && styles.disabledButton]}
            onPress={handleStartFaceAuth}
            disabled={isProcessing}
          >
            <Text style={styles.actionButtonText}>
              {isProcessing 
                ? 'Processing...' 
                : `Start ${mode === 'login' ? 'Authentication' : 'Registration'}`
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
    marginBottom: 40,
    lineHeight: 24,
  },
  demoNotice: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: COLORS.card,
    borderRadius: 12,
    padding: 15,
    marginBottom: 40,
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
  },
  cancelButtonText: {
    color: COLORS['muted-foreground'],
    fontSize: 16,
    textAlign: 'center',
  },
});