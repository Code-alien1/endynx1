import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  Alert,
  ActivityIndicator,
  StyleSheet,
  RefreshControl,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import AppBackground from '../../components/AppBackground';
import { COLORS } from '../../constants/theme';
import { useAuth } from '../../contexts/AuthContext';
import apiService, { AttendanceSession, AttendanceRecord } from '../../services/api';
import { getRolePermissions } from '../../utils/roleRedirect';

export default function AttendanceScreen() {
  const { user } = useAuth();
  const [sessions, setSessions] = useState<AttendanceSession[]>([]);
  const [attendanceRecords, setAttendanceRecords] = useState<AttendanceRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [activeTab, setActiveTab] = useState<'sessions' | 'records'>('sessions');

  if (!user) return null;
  
  const permissions = getRolePermissions(user.role);

  useEffect(() => {
    loadAttendanceData();
  }, []);

  const loadAttendanceData = async () => {
    try {
      setLoading(true);
      const [sessionsData, recordsData] = await Promise.all([
        apiService.getAttendanceSessions(),
        apiService.getAttendanceRecords(),
      ]);
      setSessions(Array.isArray(sessionsData) ? sessionsData : []);
      setAttendanceRecords(Array.isArray(recordsData) ? recordsData : []);
    } catch (error) {
      console.error('Error loading attendance data:', error);
      Alert.alert('Error', 'Failed to load attendance data');
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadAttendanceData();
    setRefreshing(false);
  };

  const handleFaceRecognition = async (session: AttendanceSession) => {
    try {
      const mockFaceEncoding = 'mock_face_encoding_data';
      const mockConfidenceScore = 0.95;
      
      await apiService.markAttendanceWithFaceRecognition(
        session.id,
        mockFaceEncoding,
        mockConfidenceScore,
        'Classroom A'
      );
      
      Alert.alert('Success', 'Attendance marked with face recognition!');
      loadAttendanceData();
    } catch (error) {
      console.error('Face recognition error:', error);
      Alert.alert('Error', 'Face recognition failed');
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'present': return COLORS.primary;
      case 'absent': return COLORS.destructive;
      case 'late': return '#f59e0b';
      case 'excused': return '#6366f1';
      default: return COLORS['muted-foreground'];
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'present': return 'check-circle';
      case 'absent': return 'close-circle';
      case 'late': return 'clock';
      case 'excused': return 'information';
      default: return 'help-circle';
    }
  };

  const renderSessionCard = (session: AttendanceSession) => (
    <View key={session.id} style={styles.sessionCard}>
      <View style={styles.sessionHeader}>
        <Text style={styles.sessionTitle}>{session.class_name}</Text>
        <View style={[styles.statusBadge, { backgroundColor: session.is_active ? COLORS.primary : COLORS['muted-foreground'] }]}>
          <Text style={styles.statusText}>{session.is_active ? 'Active' : 'Inactive'}</Text>
        </View>
      </View>
      
      <View style={styles.sessionInfo}>
        <Text style={styles.sessionDate}>{new Date(session.date).toLocaleDateString()}</Text>
        <Text style={styles.sessionTime}>{session.start_time} - {session.end_time}</Text>
        <Text style={styles.sessionType}>{session.session_type}</Text>
      </View>

      <View style={styles.attendanceStats}>
        <Text style={styles.statsText}>
          {session.attendance_count}/{session.total_students} Present
        </Text>
      </View>

      {session.is_active && user.role === 'student' && (
        <View style={styles.actionButtons}>
          <TouchableOpacity
            style={styles.actionButton}
            onPress={() => handleFaceRecognition(session)}
          >
            <MaterialCommunityIcons name="face-recognition" size={20} color={COLORS.primary} />
            <Text style={styles.actionButtonText}>Mark Attendance</Text>
          </TouchableOpacity>
        </View>
      )}

      {permissions.canManageAttendance && (
        <View style={styles.actionButtons}>
          <TouchableOpacity style={styles.actionButton}>
            <MaterialCommunityIcons name="qrcode-scan" size={20} color={COLORS.primary} />
            <Text style={styles.actionButtonText}>Generate QR</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.actionButton}>
            <MaterialCommunityIcons name="account-check" size={20} color={COLORS.primary} />
            <Text style={styles.actionButtonText}>Manual Entry</Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );

  const renderRecordCard = (record: AttendanceRecord) => (
    <View key={record.id} style={styles.recordCard}>
      <View style={styles.recordHeader}>
        <Text style={styles.recordStudent}>{record.student_name}</Text>
        <View style={[styles.statusBadge, { backgroundColor: getStatusColor(record.status) }]}>
          <MaterialCommunityIcons 
            name={getStatusIcon(record.status) as any} 
            size={16} 
            color="white" 
          />
          <Text style={styles.statusText}>{record.status}</Text>
        </View>
      </View>
      
      <View style={styles.recordInfo}>
        <Text style={styles.recordSession}>{record.session_info}</Text>
        <Text style={styles.recordMethod}>Method: {record.method}</Text>
        <Text style={styles.recordTime}>{new Date(record.timestamp).toLocaleString()}</Text>
      </View>

      {record.notes && (
        <Text style={styles.recordNotes}>{record.notes}</Text>
      )}
    </View>
  );

  if (loading) {
    return (
      <AppBackground>
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color={COLORS.primary} />
          <Text style={styles.loadingText}>Loading attendance data...</Text>
        </View>
      </AppBackground>
    );
  }

  return (
    <AppBackground>
      <View style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Attendance</Text>
          <TouchableOpacity onPress={loadAttendanceData}>
            <MaterialCommunityIcons name="refresh" size={24} color={COLORS.primary} />
          </TouchableOpacity>
        </View>

        {/* Tab Navigation */}
        <View style={styles.tabContainer}>
          <TouchableOpacity
            style={[styles.tab, activeTab === 'sessions' && styles.activeTab]}
            onPress={() => setActiveTab('sessions')}
          >
            <Text style={[styles.tabText, activeTab === 'sessions' && styles.activeTabText]}>
              Sessions
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.tab, activeTab === 'records' && styles.activeTab]}
            onPress={() => setActiveTab('records')}
          >
            <Text style={[styles.tabText, activeTab === 'records' && styles.activeTabText]}>
              Records
            </Text>
          </TouchableOpacity>
        </View>

        {/* Content */}
        <ScrollView
          style={styles.content}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
          }
          showsVerticalScrollIndicator={false}
        >
          {activeTab === 'sessions' ? (
            <View style={styles.sessionsContainer}>
              {sessions.length === 0 ? (
                <View style={styles.emptyState}>
                  <MaterialCommunityIcons name="calendar-blank" size={64} color={COLORS['muted-foreground']} />
                  <Text style={styles.emptyStateText}>No sessions available</Text>
                </View>
              ) : (
                sessions.map(renderSessionCard)
              )}
            </View>
          ) : (
            <View style={styles.recordsContainer}>
              {attendanceRecords.length === 0 ? (
                <View style={styles.emptyState}>
                  <MaterialCommunityIcons name="clipboard-text" size={64} color={COLORS['muted-foreground']} />
                  <Text style={styles.emptyStateText}>No attendance records</Text>
                </View>
              ) : (
                attendanceRecords.map(renderRecordCard)
              )}
            </View>
          )}
        </ScrollView>
      </View>
    </AppBackground>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
    paddingTop: 20,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: COLORS.foreground,
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: COLORS['muted-foreground'],
  },
  tabContainer: {
    flexDirection: 'row',
    backgroundColor: COLORS.card,
    borderRadius: 12,
    padding: 4,
    marginBottom: 20,
  },
  tab: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
    borderRadius: 8,
  },
  activeTab: {
    backgroundColor: COLORS.primary,
  },
  tabText: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS['muted-foreground'],
  },
  activeTabText: {
    color: COLORS['primary-foreground'],
  },
  content: {
    flex: 1,
  },
  sessionsContainer: {
    gap: 16,
  },
  recordsContainer: {
    gap: 12,
  },
  sessionCard: {
    backgroundColor: COLORS.card,
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  sessionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  sessionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: COLORS.foreground,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    gap: 4,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
    color: 'white',
  },
  sessionInfo: {
    marginBottom: 12,
  },
  sessionDate: {
    fontSize: 14,
    color: COLORS.foreground,
    marginBottom: 4,
  },
  sessionTime: {
    fontSize: 14,
    color: COLORS['muted-foreground'],
    marginBottom: 4,
  },
  sessionType: {
    fontSize: 14,
    color: COLORS['muted-foreground'],
    textTransform: 'capitalize',
  },
  attendanceStats: {
    marginBottom: 16,
  },
  statsText: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.primary,
  },
  actionButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(46, 204, 113, 0.1)',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    gap: 6,
  },
  actionButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.primary,
  },
  recordCard: {
    backgroundColor: COLORS.card,
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  recordHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  recordStudent: {
    fontSize: 16,
    fontWeight: 'bold',
    color: COLORS.foreground,
  },
  recordInfo: {
    marginBottom: 8,
  },
  recordSession: {
    fontSize: 14,
    color: COLORS.foreground,
    marginBottom: 4,
  },
  recordMethod: {
    fontSize: 14,
    color: COLORS['muted-foreground'],
    marginBottom: 4,
  },
  recordTime: {
    fontSize: 14,
    color: COLORS['muted-foreground'],
  },
  recordNotes: {
    fontSize: 14,
    color: COLORS['muted-foreground'],
    fontStyle: 'italic',
    marginTop: 8,
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
  },
  emptyStateText: {
    fontSize: 16,
    color: COLORS['muted-foreground'],
    marginTop: 16,
  },
});
