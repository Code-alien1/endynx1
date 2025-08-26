import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { COLORS } from '../constants/theme';
import AdvancedFaceAuthentication from './AdvancedFaceAuthentication';
import AdvancedFaceRegistration from './AdvancedFaceRegistration';
import VisionCameraFaceRecognition from './VisionCameraFaceRecognition';
import { useAuth } from '../contexts/AuthContext';

export default function AdvancedFaceRecognitionDemo() {
  const [showFaceAuth, setShowFaceAuth] = useState(false);
  const [showFaceRegistration, setShowFaceRegistration] = useState(false);
  const [showCameraDemo, setShowCameraDemo] = useState(false);
  const { user } = useAuth();

  const handleFaceAuthSuccess = (userData: any) => {
    Alert.alert('Success!', `Welcome back, ${userData?.first_name || 'User'}!`);
  };

  const handleFaceRegistrationSuccess = () => {
    Alert.alert('Success!', 'Face registration completed successfully!');
  };

  const handleCameraDemoResult = (result: any) => {
    Alert.alert(
      'Face Detection Result',
      `Detected ${result.faces.length} face(s) with ${Math.round((result.confidenceScore || 0) * 100)}% confidence`,
      [{ text: 'OK' }]
    );
  };

  const features = [
    {
      title: 'Advanced Face Authentication',
      description: 'Login using Vision Camera with real-time quality assessment',
      icon: 'finger-print',
      color: COLORS.primary,
      onPress: () => setShowFaceAuth(true),
      available: true,
      badge: 'NEW',
    },
    {
      title: 'Multi-Capture Registration',
      description: 'Register face with multiple angles for better accuracy',
      icon: 'scan',
      color: COLORS.secondary,
      onPress: () => setShowFaceRegistration(true),
      available: !!user,
      badge: 'ENHANCED',
    },
    {
      title: 'Camera Demo',
      description: 'Test the Vision Camera face detection capabilities',
      icon: 'camera',
      color: COLORS.accent,
      onPress: () => setShowCameraDemo(true),
      available: true,
      badge: 'DEMO',
    },
  ];

  const technicalFeatures = [
    {
      title: 'Real-time Face Detection',
      description: 'Uses Vision Camera for high-performance face detection',
      icon: 'eye',
    },
    {
      title: 'Landmark Detection',
      description: 'Detects facial landmarks for enhanced security',
      icon: 'locate',
    },
    {
      title: 'Quality Assessment',
      description: 'Real-time feedback on face positioning and lighting',
      icon: 'checkmark-circle',
    },
    {
      title: 'Multi-angle Capture',
      description: 'Captures multiple angles for better recognition accuracy',
      icon: 'refresh',
    },
    {
      title: 'Confidence Scoring',
      description: 'Advanced algorithms calculate recognition confidence',
      icon: 'analytics',
    },
    {
      title: 'Secure Encoding',
      description: 'Face data is encrypted and stored securely',
      icon: 'shield-checkmark',
    },
  ];

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={[COLORS.background, COLORS['background-secondary']]}
        style={styles.content}
      >
        <ScrollView showsVerticalScrollIndicator={false}>
          <View style={styles.header}>
            <LinearGradient
              colors={[COLORS.primary, COLORS['primary-glow']]}
              style={styles.headerIcon}
            >
              <Ionicons name="scan" size={40} color="#fff" />
            </LinearGradient>
            <Text style={styles.title}>Advanced Face Recognition</Text>
            <Text style={styles.subtitle}>
              Experience next-generation biometric authentication with Vision Camera
            </Text>
          </View>

          <View style={styles.featuresSection}>
            <Text style={styles.sectionTitle}>Try the Features</Text>
            {features.map((feature, index) => (
              <TouchableOpacity
                key={index}
                style={[
                  styles.featureCard,
                  !feature.available && styles.disabledCard
                ]}
                onPress={feature.available ? feature.onPress : undefined}
                disabled={!feature.available}
              >
                <View style={styles.featureHeader}>
                  <LinearGradient
                    colors={feature.available 
                      ? [feature.color, `${feature.color}80`] 
                      : [COLORS.muted, COLORS['muted-foreground']]
                    }
                    style={styles.featureIcon}
                  >
                    <Ionicons 
                      name={feature.icon as any} 
                      size={24} 
                      color="#fff" 
                    />
                  </LinearGradient>
                  
                  {feature.badge && (
                    <View style={[styles.badge, { backgroundColor: feature.color }]}>
                      <Text style={styles.badgeText}>{feature.badge}</Text>
                    </View>
                  )}
                </View>
                
                <View style={styles.featureContent}>
                  <Text style={[
                    styles.featureTitle,
                    !feature.available && styles.disabledText
                  ]}>
                    {feature.title}
                  </Text>
                  <Text style={[
                    styles.featureDescription,
                    !feature.available && styles.disabledText
                  ]}>
                    {feature.description}
                  </Text>
                  {!feature.available && (
                    <Text style={styles.unavailableText}>
                      {!user ? 'Login required' : 'Not available'}
                    </Text>
                  )}
                </View>

                <Ionicons 
                  name="chevron-forward" 
                  size={20} 
                  color={feature.available ? COLORS.foreground : COLORS.muted} 
                />
              </TouchableOpacity>
            ))}
          </View>

          <View style={styles.technicalSection}>
            <Text style={styles.sectionTitle}>Technical Features</Text>
            <View style={styles.technicalGrid}>
              {technicalFeatures.map((feature, index) => (
                <View key={index} style={styles.technicalCard}>
                  <Ionicons 
                    name={feature.icon as any} 
                    size={24} 
                    color={COLORS.primary} 
                  />
                  <Text style={styles.technicalTitle}>{feature.title}</Text>
                  <Text style={styles.technicalDescription}>{feature.description}</Text>
                </View>
              ))}
            </View>
          </View>

          <View style={styles.infoSection}>
            <View style={styles.infoCard}>
              <Ionicons name="information-circle" size={24} color={COLORS.primary} />
              <View style={styles.infoContent}>
                <Text style={styles.infoTitle}>About This Implementation</Text>
                <Text style={styles.infoText}>
                  This advanced face recognition system uses react-native-vision-camera and 
                  vision-camera-face-detector for high-performance, real-time face detection 
                  with enhanced security features.
                </Text>
              </View>
            </View>

            <View style={styles.requirementsCard}>
              <Text style={styles.requirementsTitle}>System Requirements</Text>
              <View style={styles.requirement}>
                <Ionicons name="checkmark-circle" size={16} color={COLORS.primary} />
                <Text style={styles.requirementText}>Camera permission required</Text>
              </View>
              <View style={styles.requirement}>
                <Ionicons name="checkmark-circle" size={16} color={COLORS.primary} />
                <Text style={styles.requirementText}>Good lighting conditions</Text>
              </View>
              <View style={styles.requirement}>
                <Ionicons name="checkmark-circle" size={16} color={COLORS.primary} />
                <Text style={styles.requirementText}>Front-facing camera</Text>
              </View>
              <View style={styles.requirement}>
                <Ionicons name="checkmark-circle" size={16} color={COLORS.primary} />
                <Text style={styles.requirementText}>iOS 11+ or Android 7+</Text>
              </View>
            </View>
          </View>
        </ScrollView>
      </LinearGradient>

      {/* Advanced Face Authentication Modal */}
      <AdvancedFaceAuthentication
        visible={showFaceAuth}
        onClose={() => setShowFaceAuth(false)}
        onSuccess={handleFaceAuthSuccess}
        onFallbackToEmail={() => setShowFaceAuth(false)}
      />

      {/* Advanced Face Registration Modal */}
      <AdvancedFaceRegistration
        visible={showFaceRegistration}
        onClose={() => setShowFaceRegistration(false)}
        onSuccess={handleFaceRegistrationSuccess}
      />

      {/* Camera Demo Modal */}
      {showCameraDemo && (
        <VisionCameraFaceRecognition
          mode="register"
          onFaceDetected={handleCameraDemoResult}
          onClose={() => setShowCameraDemo(false)}
          title="Camera Demo"
          subtitle="Test face detection capabilities"
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    flex: 1,
  },
  header: {
    alignItems: 'center',
    paddingTop: 60,
    paddingBottom: 30,
    paddingHorizontal: 20,
  },
  headerIcon: {
    width: 80,
    height: 80,
    borderRadius: 40,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
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
    marginBottom: 10,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 16,
    color: COLORS['muted-foreground'],
    textAlign: 'center',
    lineHeight: 24,
  },
  featuresSection: {
    paddingHorizontal: 20,
    marginBottom: 30,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: COLORS.foreground,
    marginBottom: 20,
  },
  featureCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.card,
    borderRadius: 16,
    padding: 20,
    marginBottom: 15,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  disabledCard: {
    opacity: 0.6,
  },
  featureHeader: {
    position: 'relative',
    marginRight: 15,
  },
  featureIcon: {
    width: 50,
    height: 50,
    borderRadius: 25,
    justifyContent: 'center',
    alignItems: 'center',
  },
  badge: {
    position: 'absolute',
    top: -5,
    right: -5,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 8,
  },
  badgeText: {
    color: '#fff',
    fontSize: 10,
    fontWeight: 'bold',
  },
  featureContent: {
    flex: 1,
  },
  featureTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.foreground,
    marginBottom: 5,
  },
  featureDescription: {
    fontSize: 14,
    color: COLORS['muted-foreground'],
    lineHeight: 20,
  },
  disabledText: {
    color: COLORS.muted,
  },
  unavailableText: {
    fontSize: 12,
    color: COLORS.destructive,
    marginTop: 5,
    fontStyle: 'italic',
  },
  technicalSection: {
    paddingHorizontal: 20,
    marginBottom: 30,
  },
  technicalGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  technicalCard: {
    width: '48%',
    backgroundColor: COLORS.card,
    borderRadius: 12,
    padding: 15,
    marginBottom: 15,
    alignItems: 'center',
  },
  technicalTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.foreground,
    marginTop: 10,
    marginBottom: 5,
    textAlign: 'center',
  },
  technicalDescription: {
    fontSize: 12,
    color: COLORS['muted-foreground'],
    textAlign: 'center',
    lineHeight: 16,
  },
  infoSection: {
    paddingHorizontal: 20,
    paddingBottom: 30,
  },
  infoCard: {
    flexDirection: 'row',
    backgroundColor: COLORS.card,
    borderRadius: 12,
    padding: 20,
    marginBottom: 20,
    borderLeftWidth: 4,
    borderLeftColor: COLORS.primary,
  },
  infoContent: {
    flex: 1,
    marginLeft: 15,
  },
  infoTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.foreground,
    marginBottom: 8,
  },
  infoText: {
    fontSize: 14,
    color: COLORS['muted-foreground'],
    lineHeight: 20,
  },
  requirementsCard: {
    backgroundColor: COLORS.card,
    borderRadius: 12,
    padding: 20,
  },
  requirementsTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.foreground,
    marginBottom: 15,
  },
  requirement: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  requirementText: {
    fontSize: 14,
    color: COLORS['muted-foreground'],
    marginLeft: 10,
  },
});