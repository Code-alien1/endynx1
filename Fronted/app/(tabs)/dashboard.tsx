import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  RefreshControl,
} from 'react-native';
import { MaterialCommunityIcons, Ionicons } from '@expo/vector-icons';
import AppBackground from '../../components/AppBackground';
import ExpoCameraFaceAuth from '../../components/ExpoCameraFaceAuth';
import { COLORS, theme } from '../../constants/theme';
import { useAuth } from '../../contexts/AuthContext';
import { getRoleDashboardTitle } from '../../utils/roleRedirect';
import faceRecognitionService from '../../services/faceRecognitionService';
import { router } from 'expo-router';

export default function DashboardScreen() {
  const { user } = useAuth();
  const [refreshing, setRefreshing] = useState(false);
  const [stats, setStats] = useState({
    totalUsers: 0,
    pendingJustifications: 0,
    activeAnnouncements: 0,
    attendanceRecords: 0,
  });

  if (!user) return null;

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      // Mock data for now - replace with actual API calls
      setStats({
        totalUsers: 156,
        pendingJustifications: 8,
        activeAnnouncements: 3,
        attendanceRecords: 1247,
      });
    } catch (error) {
      console.error('Error loading dashboard data:', error);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadDashboardData();
    setRefreshing(false);
  };

  const navigateToTab = (tabName: string) => {
    router.push(`/(tabs)/${tabName}`);
  };

  // Show admin dashboard for administration users
  if (user.role === 'administration') {
    return (
      <AppBackground>
        <ScrollView 
          style={styles.container} 
          showsVerticalScrollIndicator={false}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        >
          <View style={styles.adminHeader}>
            <Text style={styles.adminTitle}>Administration Dashboard</Text>
            <Text style={styles.welcomeText}>Welcome back, {user.first_name}</Text>
          </View>
          
          <View style={styles.statsContainer}>
            <View style={[styles.statCard, styles.primaryStatCard]}>
              <View style={styles.statIconContainer}>
                <Ionicons name="people" size={28} color="white" />
              </View>
              <View style={styles.statTextContainer}>
                <Text style={styles.statNumber}>{stats.totalUsers}</Text>
                <Text style={styles.statLabel}>Total Users</Text>
              </View>
            </View>
            
            <View style={[styles.statCard, styles.warningStatCard]}>
              <View style={styles.statIconContainer}>
                <Ionicons name="document-text" size={28} color="white" />
              </View>
              <View style={styles.statTextContainer}>
                <Text style={styles.statNumber}>{stats.pendingJustifications}</Text>
                <Text style={styles.statLabel}>Pending Justifications</Text>
              </View>
            </View>
            
            <View style={[styles.statCard, styles.successStatCard]}>
              <View style={styles.statIconContainer}>
                <Ionicons name="megaphone" size={28} color="white" />
              </View>
              <View style={styles.statTextContainer}>
                <Text style={styles.statNumber}>{stats.activeAnnouncements}</Text>
                <Text style={styles.statLabel}>Active Announcements</Text>
              </View>
            </View>
            
            <View style={[styles.statCard, styles.infoStatCard]}>
              <View style={styles.statIconContainer}>
                <Ionicons name="calendar" size={28} color="white" />
              </View>
              <View style={styles.statTextContainer}>
                <Text style={styles.statNumber}>{stats.attendanceRecords}</Text>
                <Text style={styles.statLabel}>Attendance Records</Text>
              </View>
            </View>
          </View>

          <View style={styles.quickActionsContainer}>
            <Text style={styles.sectionTitle}>Quick Actions</Text>
            <View style={styles.quickActionsGrid}>
              <TouchableOpacity 
                style={styles.quickActionCard}
                onPress={() => navigateToTab('users')}
              >
                <Ionicons name="person-add" size={24} color={theme.colors.primary} />
                <Text style={styles.quickActionText}>Add User</Text>
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={styles.quickActionCard}
                onPress={() => navigateToTab('announcements')}
              >
                <Ionicons name="megaphone" size={24} color={theme.colors.primary} />
                <Text style={styles.quickActionText}>New Announcement</Text>
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={styles.quickActionCard}
                onPress={() => navigateToTab('justifications')}
              >
                <Ionicons name="checkmark-circle" size={24} color={theme.colors.primary} />
                <Text style={styles.quickActionText}>Review Justifications</Text>
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={styles.quickActionCard}
                onPress={() => navigateToTab('attendance')}
              >
                <Ionicons name="list" size={24} color={theme.colors.primary} />
                <Text style={styles.quickActionText}>View Attendance</Text>
              </TouchableOpacity>
            </View>
          </View>
        </ScrollView>
      </AppBackground>
    );
  }

  // Original dashboard for other roles
  const dashboardTitle = getRoleDashboardTitle(user.role);
  const currentTime = new Date();
  const greeting = currentTime.getHours() < 12 ? 'Good Morning' : 
                  currentTime.getHours() < 18 ? 'Good Afternoon' : 'Good Evening';

  const [showFaceRegistration, setShowFaceRegistration] = useState(false);
  const [faceRegistrationStatus, setFaceRegistrationStatus] = useState<{
    registered: boolean;
    loading: boolean;
  }>({ registered: false, loading: true });

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
                      Your face is registered! You can use face recognition for attendance.
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
    marginLeft: 8,
    color: COLORS.primary,
    fontSize: 14,
    fontWeight: '600',
  },
  // Admin Dashboard Styles
  adminHeader: {
    marginBottom: 24,
    paddingHorizontal: 4,
  },
  adminTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: theme.colors.text,
  },
  welcomeText: {
    fontSize: 16,
    color: '#9CA3AF',
    marginTop: 4,
  },
  statsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginBottom: 24,
  },
  statCard: {
    backgroundColor: theme.colors.card,
    padding: 20,
    borderRadius: 16,
    flexDirection: 'row',
    alignItems: 'center',
    width: '48%',
    marginBottom: 16,
    borderWidth: 1,
    borderColor: theme.colors.border,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  primaryStatCard: {
    backgroundColor: theme.colors.primary,
  },
  warningStatCard: {
    backgroundColor: theme.colors.warning,
  },
  successStatCard: {
    backgroundColor: theme.colors.success,
  },
  infoStatCard: {
    backgroundColor: '#3B82F6',
  },
  statIconContainer: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  statTextContainer: {
    flex: 1,
  },
  statNumber: {
    fontSize: 24,
    fontWeight: 'bold',
    color: 'white',
  },
  statLabel: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.8)',
    marginTop: 4,
  },
  quickActionsContainer: {
    marginTop: 24,
    paddingHorizontal: 4,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: theme.colors.text,
    marginBottom: 16,
  },
  quickActionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  quickActionCard: {
    backgroundColor: theme.colors.card,
    padding: 20,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: theme.colors.border,
    width: '48%',
    marginBottom: 12,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 100,
  },
  quickActionText: {
    fontSize: 14,
    color: theme.colors.text,
    marginTop: 8,
    textAlign: 'center',
    fontWeight: '500',
  },
});
