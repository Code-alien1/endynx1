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
import FaceAuthentication from './FaceAuthentication';
import FaceRegistration from './FaceRegistration';
import FaceAttendance from './FaceAttendance';
import { useAuth } from '../contexts/AuthContext';

export default function FaceRecognitionDemo() {
  const [showFaceAuth, setShowFaceAuth] = useState(false);
  const [showFaceRegistration, setShowFaceRegistration] = useState(false);
  const [showFaceAttendance, setShowFaceAttendance] = useState(false);
  const { user } = useAuth();

  // Mock attendance session for demo
  const mockSession = {
    id: 'demo-session-1',
    class_obj: 'demo-class',
    class_name: 'Computer Science 101',
    session_type: 'morning' as const,
    date: new Date().toISOString().split('T')[0],
    start_time: '09:00:00',
    end_time: '10:30:00',
    is_active: true,
    attendance_count: 15,
    total_students: 25,
  };

  const handleFaceAuthSuccess = (userData: any) => {
    Alert.alert('Success!', `Welcome back, ${userData.first_name}!`);
  };

  const handleFaceRegistrationSuccess = () => {
    Alert.alert('Success!', 'Face registration completed successfully!');
  };

  const handleAttendanceSuccess = (attendance: any) => {
    Alert.alert('Success!', 'Attendance marked successfully!');
  };

  const features = [
    {
      title: 'Face Authentication',
      description: 'Login using face recognition',
      icon: 'finger-print',
      onPress: () => setShowFaceAuth(true),
      available: true,
    },
    {
      title: 'Face Registration',
      description: 'Register your face for recognition',
      icon: 'scan',
      onPress: () => setShowFaceRegistration(true),
      available: !!user,
    },
    {
      title: 'Face Attendance',
      description: 'Mark attendance using face recognition',
      icon: 'checkmark-circle',
      onPress: () => setShowFaceAttendance(true),
      available: !!user,
    },
  ];

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={[COLORS.background, COLORS['background-secondary']]}
        style={styles.content}
      >
        <View style={styles.header}>
          <Text style={styles.title}>Face Recognition Demo</Text>
          <Text style={styles.subtitle}>
            Test the face recognition capabilities of Edynx
          </Text>
        </View>

        <ScrollView style={styles.featuresContainer} showsVerticalScrollIndicator={false}>
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
              <LinearGradient
                colors={feature.available 
                  ? [COLORS.primary, COLORS['primary-glow']] 
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
        </ScrollView>

        <View style={styles.infoCard}>
          <Ionicons name="information-circle" size={20} color={COLORS.primary} />
          <Text style={styles.infoText}>
            Face recognition uses advanced AI to securely authenticate users and mark attendance.
          </Text>
        </View>
      </LinearGradient>

      {/* Face Authentication Modal */}
      <FaceAuthentication
        visible={showFaceAuth}
        onClose={() => setShowFaceAuth(false)}
        onSuccess={handleFaceAuthSuccess}
        onFallbackToEmail={() => setShowFaceAuth(false)}
      />

      {/* Face Registration Modal */}
      <FaceRegistration
        visible={showFaceRegistration}
        onClose={() => setShowFaceRegistration(false)}
        onSuccess={handleFaceRegistrationSuccess}
      />

      {/* Face Attendance Modal */}
      <FaceAttendance
        visible={showFaceAttendance}
        onClose={() => setShowFaceAttendance(false)}
        onSuccess={handleAttendanceSuccess}
        session={mockSession}
      />
    </View>
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
    marginTop: 40,
    marginBottom: 30,
    alignItems: 'center',
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: COLORS.foreground,
    marginBottom: 10,
  },
  subtitle: {
    fontSize: 16,
    color: COLORS['muted-foreground'],
    textAlign: 'center',
    lineHeight: 24,
  },
  featuresContainer: {
    flex: 1,
  },
  featureCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.card,
    borderRadius: 12,
    padding: 20,
    marginBottom: 15,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  disabledCard: {
    opacity: 0.6,
  },
  featureIcon: {
    width: 50,
    height: 50,
    borderRadius: 25,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 15,
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
  infoCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: COLORS.card,
    borderRadius: 12,
    padding: 15,
    marginTop: 20,
    borderLeftWidth: 4,
    borderLeftColor: COLORS.primary,
  },
  infoText: {
    flex: 1,
    fontSize: 14,
    color: COLORS['muted-foreground'],
    marginLeft: 10,
    lineHeight: 20,
  },
});