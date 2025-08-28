import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import AppBackground from '../../components/AppBackground';
import ExpoCameraFaceAuth from '../../components/ExpoCameraFaceAuth';
import { COLORS } from '../../constants/theme';
import { useAuth } from '../../contexts/AuthContext';
import { getRoleDashboardTitle } from '../../utils/roleRedirect';
import faceRecognitionService from '../../services/faceRecognitionService';

export default function DashboardScreen() {
  const { user } = useAuth();
  const [showFaceRegistration, setShowFaceRegistration] = useState(false);
  const [faceRegistrationStatus, setFaceRegistrationStatus] = useState<{
    registered: boolean;
    loading: boolean;
  }>({ registered: false, loading: true });

  if (!user) return null;

  const dashboardTitle = getRoleDashboardTitle(user.role);
  const currentTime = new Date();
  const greeting = currentTime.getHours() < 12 ? 'Good Morning' : 
                  currentTime.getHours() < 18 ? 'Good Afternoon' : 'Good Evening';

  useEffect(() => {
    if (user.role === 'student') {
      checkFaceRegistrationStatus();
    }
  }, [user]);

  const checkFaceRegistrationStatus = async () => {
    try {
      const status = await faceRecognitionService.getFaceRegistrationStatus(user.id);
      setFaceRegistrationStatus({ registered: status.registered, loading: false });
    } catch (error) {
      console.error('Error checking face registration status:', error);
      setFaceRegistrationStatus({ registered: false, loading: false });
    }
  };

  const handleFaceRegistrationSuccess = async (userData?: any, faceEncoding?: string, confidenceScore?: number) => {
    try {
      const result = await faceRecognitionService.registerFace(faceEncoding || 'mock_encoding', user.id);
      
      if (result.success) {
        Alert.alert(
          'Success!',
          'Your face has been registered successfully. You can now use face recognition for attendance.',
          [{ 
            text: 'OK',
            onPress: () => {
              setShowFaceRegistration(false);
              checkFaceRegistrationStatus();
            }
          }]
        );
      } else {
        Alert.alert('Error', result.error || 'Failed to register face. Please try again.');
      }
    } catch (error) {
      console.error('Face registration error:', error);
      Alert.alert('Error', 'Failed to register face. Please try again.');
    }
  };

  return (
    <AppBackground>
      <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
        {/* Welcome Header */}
        <View style={styles.welcomeSection}>
          <View style={styles.greetingContainer}>
            <Text style={styles.greetingText}>{greeting},</Text>
            <Text style={styles.userName}>{user.first_name || user.email}</Text>
          </View>
          <Text style={styles.roleText}>{dashboardTitle}</Text>
        </View>

        {/* Dashboard Content */}
        <View style={styles.dashboardContent}>
          <View style={styles.welcomeCard}>
            <View style={styles.cardHeader}>
              <MaterialCommunityIcons name="view-dashboard" size={24} color={COLORS.primary} />
              <Text style={styles.cardTitle}>Welcome to Edynx</Text>
            </View>
            <Text style={styles.cardDescription}>
              Your digital education management platform. Navigate through the tabs below to access your features.
            </Text>
          </View>

          {/* Role-specific quick info */}
          {user.role === 'student' && (
            <>
              <View style={styles.infoCard}>
                <MaterialCommunityIcons name="school" size={20} color={COLORS.primary} />
                <Text style={styles.infoText}>
                  Use the Attendance tab to mark your presence and manage your academic records.
                </Text>
              </View>

              {/* Face Registration Card */}
              <View style={styles.faceRegistrationCard}>
                <View style={styles.cardHeader}>
                  <MaterialCommunityIcons 
                    name="face-recognition" 
                    size={24} 
                    color={faceRegistrationStatus.registered ? COLORS.primary : COLORS.warning} 
                  />
                  <Text style={styles.cardTitle}>Face Recognition</Text>
                </View>
                
                {faceRegistrationStatus.loading ? (
                  <Text style={styles.cardDescription}>Checking registration status...</Text>
                ) : faceRegistrationStatus.registered ? (
                  <View>
                    <Text style={styles.cardDescription}>
                      ✅ Your face is registered! You can use face recognition for attendance.
                    </Text>
                    <TouchableOpacity 
                      style={styles.updateFaceButton}
                      onPress={() => setShowFaceRegistration(true)}
                    >
                      <MaterialCommunityIcons name="camera-retake" size={20} color={COLORS.primary} />
                      <Text style={styles.updateFaceButtonText}>Update Face Registration</Text>
                    </TouchableOpacity>
                  </View>
                ) : (
                  <View>
                    <Text style={styles.cardDescription}>
                      Register your face to enable quick attendance marking with face recognition.
                    </Text>
                    <TouchableOpacity 
                      style={styles.registerFaceButton}
                      onPress={() => setShowFaceRegistration(true)}
                    >
                      <MaterialCommunityIcons name="camera" size={20} color="#fff" />
                      <Text style={styles.registerFaceButtonText}>Register My Face</Text>
                    </TouchableOpacity>
                  </View>
                )}
              </View>
            </>
          )}

          {user.role === 'teacher' && (
            <View style={styles.infoCard}>
              <MaterialCommunityIcons name="clipboard-check" size={20} color={COLORS.primary} />
              <Text style={styles.infoText}>
                Manage student attendance and access your teaching tools from the navigation tabs.
              </Text>
            </View>
          )}

          {(user.role === 'administration' || user.role === 'superadmin') && (
            <View style={styles.infoCard}>
              <MaterialCommunityIcons name="cog" size={20} color={COLORS.primary} />
              <Text style={styles.infoText}>
                Access system management and administrative tools through the settings panel.
              </Text>
            </View>
          )}

          {user.role === 'parent' && (
            <View style={styles.infoCard}>
              <MaterialCommunityIcons name="account-group" size={20} color={COLORS.primary} />
              <Text style={styles.infoText}>
                Monitor your child's academic progress and stay connected with their education.
              </Text>
            </View>
          )}

          {user.role === 'mentor' && (
            <View style={styles.infoCard}>
              <MaterialCommunityIcons name="account-heart" size={20} color={COLORS.primary} />
              <Text style={styles.infoText}>
                Support and guide your mentees through their academic journey.
              </Text>
            </View>
          )}
        </View>
      </ScrollView>

      {/* Face Registration Modal */}
      {showFaceRegistration && (
        <ExpoCameraFaceAuth
          visible={showFaceRegistration}
          onClose={() => setShowFaceRegistration(false)}
          onSuccess={handleFaceRegistrationSuccess}
          mode="register"
          title="Register Your Face"
          subtitle="Position your face in the frame to register for attendance"
        />
      )}
    </AppBackground>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
  },
  welcomeSection: {
    marginBottom: 30,
    paddingTop: 20,
  },
  greetingContainer: {
    marginBottom: 8,
  },
  greetingText: {
    fontSize: 24,
    color: COLORS['muted-foreground'],
    fontWeight: '400',
  },
  userName: {
    fontSize: 32,
    fontWeight: 'bold',
    color: COLORS.foreground,
    marginTop: 4,
  },
  roleText: {
    fontSize: 16,
    color: COLORS.primary,
    fontWeight: '600',
    textTransform: 'capitalize',
  },
  dashboardContent: {
    gap: 20,
  },
  welcomeCard: {
    backgroundColor: COLORS.card,
    borderRadius: 16,
    padding: 20,
    borderWidth: 1,
    borderColor: COLORS.border,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    gap: 12,
  },
  cardTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: COLORS.foreground,
  },
  cardDescription: {
    fontSize: 14,
    color: COLORS['muted-foreground'],
    lineHeight: 20,
  },
  infoCard: {
    backgroundColor: 'rgba(46, 204, 113, 0.1)',
    borderRadius: 12,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    borderLeftWidth: 4,
    borderLeftColor: COLORS.primary,
  },
  infoText: {
    fontSize: 14,
    color: COLORS.foreground,
    flex: 1,
    lineHeight: 18,
  },
  faceRegistrationCard: {
    backgroundColor: COLORS.card,
    borderRadius: 16,
    padding: 20,
    borderWidth: 1,
    borderColor: COLORS.border,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  registerFaceButton: {
    backgroundColor: COLORS.primary,
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 12,
  },
  registerFaceButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  updateFaceButton: {
    backgroundColor: 'transparent',
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 12,
    borderWidth: 1,
    borderColor: COLORS.primary,
  },
  updateFaceButtonText: {
    color: COLORS.primary,
    fontSize: 14,
    fontWeight: '600',
  },
});
