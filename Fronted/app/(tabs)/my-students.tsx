import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  RefreshControl,
  FlatList,
  Alert,
} from 'react-native';
import { MaterialCommunityIcons, Ionicons } from '@expo/vector-icons';
import AppBackground from '../../components/AppBackground';
import { COLORS } from '../../constants/theme';
import { useAuth } from '../../contexts/AuthContext';

interface Student {
  id: string;
  name: string;
  email: string;
  class_name: string;
  attendance_rate: number;
  last_active: string;
  academic_status: 'excellent' | 'good' | 'needs_attention' | 'at_risk';
  notes?: string;
}

interface MentorSession {
  id: string;
  student_id: string;
  student_name: string;
  date: string;
  type: 'academic' | 'personal' | 'career';
  notes: string;
  status: 'scheduled' | 'completed' | 'cancelled';
}

export default function MyStudentsScreen() {
  const { user } = useAuth();
  const [students, setStudents] = useState<Student[]>([]);
  const [sessions, setSessions] = useState<MentorSession[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [activeTab, setActiveTab] = useState<'students' | 'sessions'>('students');

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      
      // Mock data for demonstration
      const mockStudents: Student[] = [
        {
          id: '1',
          name: 'John Doe',
          email: 'john.doe@student.edu',
          class_name: 'BA1B',
          attendance_rate: 92,
          last_active: '2024-01-29',
          academic_status: 'excellent',
          notes: 'Excellent performance in all subjects. Very motivated student.'
        },
        {
          id: '2',
          name: 'Sarah Wilson',
          email: 'sarah.wilson@student.edu',
          class_name: 'BA1B',
          attendance_rate: 78,
          last_active: '2024-01-28',
          academic_status: 'needs_attention',
          notes: 'Struggling with mathematics. Needs additional support.'
        },
        {
          id: '3',
          name: 'Mike Johnson',
          email: 'mike.johnson@student.edu',
          class_name: 'CS1A',
          attendance_rate: 85,
          last_active: '2024-01-29',
          academic_status: 'good',
          notes: 'Good progress overall. Shows interest in programming.'
        }
      ];

      const mockSessions: MentorSession[] = [
        {
          id: '1',
          student_id: '1',
          student_name: 'John Doe',
          date: '2024-02-01',
          type: 'academic',
          notes: 'Discussed career goals and academic planning',
          status: 'scheduled'
        },
        {
          id: '2',
          student_id: '2',
          student_name: 'Sarah Wilson',
          date: '2024-01-28',
          type: 'academic',
          notes: 'Reviewed mathematics concepts and provided additional resources',
          status: 'completed'
        },
        {
          id: '3',
          student_id: '3',
          student_name: 'Mike Johnson',
          date: '2024-02-02',
          type: 'career',
          notes: 'Career guidance session - exploring internship opportunities',
          status: 'scheduled'
        }
      ];

      setStudents(mockStudents);
      setSessions(mockSessions);
    } catch (error) {
      console.error('Error loading student data:', error);
      Alert.alert('Error', 'Failed to load student data');
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'excellent': return COLORS.success;
      case 'good': return COLORS.primary;
      case 'needs_attention': return '#f59e0b';
      case 'at_risk': return COLORS.destructive;
      default: return COLORS['muted-foreground'];
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'excellent': return 'star';
      case 'good': return 'thumb-up';
      case 'needs_attention': return 'alert-circle';
      case 'at_risk': return 'alert-circle';
      default: return 'help-circle';
    }
  };

  const getAttendanceColor = (rate: number) => {
    if (rate >= 90) return COLORS.success;
    if (rate >= 75) return '#f59e0b';
    return COLORS.destructive;
  };

  const handleContactStudent = (student: Student) => {
    Alert.alert(
      'Contact Student',
      `Contact ${student.name}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Email', onPress: () => console.log(`Email: ${student.email}`) },
        { text: 'Message', onPress: () => console.log(`Message: ${student.name}`) }
      ]
    );
  };

  const handleScheduleSession = (student: Student) => {
    Alert.alert(
      'Schedule Session',
      `Schedule a mentoring session with ${student.name}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Academic', onPress: () => console.log(`Schedule academic session with ${student.name}`) },
        { text: 'Personal', onPress: () => console.log(`Schedule personal session with ${student.name}`) },
        { text: 'Career', onPress: () => console.log(`Schedule career session with ${student.name}`) }
      ]
    );
  };

  const renderStudentCard = ({ item }: { item: Student }) => (
    <View style={styles.card}>
      <View style={styles.cardHeader}>
        <View style={styles.studentInfo}>
          <View style={styles.studentTitleContainer}>
            <MaterialCommunityIcons name="account" size={20} color={COLORS.primary} />
            <Text style={styles.studentName}>{item.name}</Text>
          </View>
          <View style={[styles.statusBadge, { backgroundColor: getStatusColor(item.academic_status) }]}>
            <MaterialCommunityIcons 
              name={getStatusIcon(item.academic_status)} 
              size={12} 
              color="white" 
            />
            <Text style={styles.statusText}>{item.academic_status.replace('_', ' ').toUpperCase()}</Text>
          </View>
        </View>
      </View>

      <Text style={styles.studentEmail}>{item.email}</Text>
      <Text style={styles.studentClass}>Class: {item.class_name}</Text>

      <View style={styles.statsContainer}>
        <View style={styles.statItem}>
          <Text style={styles.statLabel}>Attendance</Text>
          <Text style={[styles.statValue, { color: getAttendanceColor(item.attendance_rate) }]}>
            {item.attendance_rate}%
          </Text>
        </View>
        <View style={styles.statItem}>
          <Text style={styles.statLabel}>Last Active</Text>
          <Text style={styles.statValue}>
            {new Date(item.last_active).toLocaleDateString()}
          </Text>
        </View>
      </View>

      {item.notes && (
        <View style={styles.notesContainer}>
          <MaterialCommunityIcons name="note-text" size={16} color={COLORS['muted-foreground']} />
          <Text style={styles.notesText}>{item.notes}</Text>
        </View>
      )}

      <View style={styles.cardActions}>
        <TouchableOpacity
          style={styles.actionButton}
          onPress={() => handleContactStudent(item)}
        >
          <MaterialCommunityIcons name="message" size={16} color={COLORS.primary} />
          <Text style={styles.actionButtonText}>Contact</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.actionButton, styles.primaryActionButton]}
          onPress={() => handleScheduleSession(item)}
        >
          <MaterialCommunityIcons name="calendar-plus" size={16} color="white" />
          <Text style={[styles.actionButtonText, { color: 'white' }]}>Schedule</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  const renderSessionCard = ({ item }: { item: MentorSession }) => (
    <View style={styles.card}>
      <View style={styles.cardHeader}>
        <View style={styles.sessionInfo}>
          <View style={styles.sessionTitleContainer}>
            <MaterialCommunityIcons 
              name={item.type === 'academic' ? 'school' : item.type === 'career' ? 'briefcase' : 'account-heart'} 
              size={20} 
              color={COLORS.primary} 
            />
            <Text style={styles.sessionTitle}>{item.student_name}</Text>
          </View>
          <View style={[
            styles.statusBadge, 
            { 
              backgroundColor: item.status === 'completed' ? COLORS.success : 
                              item.status === 'scheduled' ? COLORS.primary : COLORS.destructive 
            }
          ]}>
            <Text style={styles.statusText}>{item.status.toUpperCase()}</Text>
          </View>
        </View>
      </View>

      <View style={styles.sessionDetails}>
        <View style={styles.sessionDetailItem}>
          <MaterialCommunityIcons name="calendar" size={16} color={COLORS['muted-foreground']} />
          <Text style={styles.sessionDetailText}>
            {new Date(item.date).toLocaleDateString()}
          </Text>
        </View>
        <View style={styles.sessionDetailItem}>
          <MaterialCommunityIcons name="tag" size={16} color={COLORS['muted-foreground']} />
          <Text style={styles.sessionDetailText}>{item.type} session</Text>
        </View>
      </View>

      <View style={styles.notesContainer}>
        <MaterialCommunityIcons name="note-text" size={16} color={COLORS['muted-foreground']} />
        <Text style={styles.notesText}>{item.notes}</Text>
      </View>

      {item.status === 'scheduled' && (
        <View style={styles.cardActions}>
          <TouchableOpacity
            style={styles.actionButton}
            onPress={() => Alert.alert('Reschedule', `Reschedule session with ${item.student_name}`)}
          >
            <MaterialCommunityIcons name="calendar-edit" size={16} color={COLORS.primary} />
            <Text style={styles.actionButtonText}>Reschedule</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.actionButton, styles.primaryActionButton]}
            onPress={() => Alert.alert('Complete', `Mark session with ${item.student_name} as completed`)}
          >
            <MaterialCommunityIcons name="check" size={16} color="white" />
            <Text style={[styles.actionButtonText, { color: 'white' }]}>Complete</Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );

  if (loading) {
    return (
      <AppBackground>
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>Loading your students...</Text>
        </View>
      </AppBackground>
    );
  }

  return (
    <AppBackground>
      <ScrollView
        style={styles.container}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      >
        <View style={styles.header}>
          <Text style={styles.title}>My Students</Text>
          <Text style={styles.subtitle}>Manage and support your mentees</Text>
        </View>

        {/* Statistics */}
        <View style={styles.statsOverview}>
          <View style={styles.statCard}>
            <MaterialCommunityIcons name="account-group" size={24} color={COLORS.primary} />
            <Text style={styles.statCardNumber}>{students.length}</Text>
            <Text style={styles.statCardLabel}>Total Students</Text>
          </View>
          <View style={styles.statCard}>
            <MaterialCommunityIcons name="calendar-check" size={24} color={COLORS.success} />
            <Text style={styles.statCardNumber}>{sessions.filter(s => s.status === 'completed').length}</Text>
            <Text style={styles.statCardLabel}>Sessions Completed</Text>
          </View>
          <View style={styles.statCard}>
            <MaterialCommunityIcons name="calendar-clock" size={24} color="#f59e0b" />
            <Text style={styles.statCardNumber}>{sessions.filter(s => s.status === 'scheduled').length}</Text>
            <Text style={styles.statCardLabel}>Upcoming Sessions</Text>
          </View>
        </View>

        {/* Tab Navigation */}
        <View style={styles.tabContainer}>
          <TouchableOpacity
            style={[styles.tab, activeTab === 'students' && styles.activeTab]}
            onPress={() => setActiveTab('students')}
          >
            <Text style={[styles.tabText, activeTab === 'students' && styles.activeTabText]}>
              Students ({students.length})
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.tab, activeTab === 'sessions' && styles.activeTab]}
            onPress={() => setActiveTab('sessions')}
          >
            <Text style={[styles.tabText, activeTab === 'sessions' && styles.activeTabText]}>
              Sessions ({sessions.length})
            </Text>
          </TouchableOpacity>
        </View>

        {/* Content */}
        <View style={styles.content}>
          {activeTab === 'students' && (
            <FlatList
              data={students}
              renderItem={renderStudentCard}
              keyExtractor={(item) => item.id}
              scrollEnabled={false}
              showsVerticalScrollIndicator={false}
            />
          )}

          {activeTab === 'sessions' && (
            <FlatList
              data={sessions}
              renderItem={renderSessionCard}
              keyExtractor={(item) => item.id}
              scrollEnabled={false}
              showsVerticalScrollIndicator={false}
            />
          )}
        </View>
      </ScrollView>
    </AppBackground>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    color: COLORS.foreground,
    fontSize: 16,
  },
  header: {
    marginBottom: 24,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: COLORS.foreground,
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: COLORS['muted-foreground'],
  },
  statsOverview: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 24,
  },
  statCard: {
    backgroundColor: COLORS.card,
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    flex: 1,
    marginHorizontal: 4,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  statCardNumber: {
    fontSize: 24,
    fontWeight: 'bold',
    color: COLORS.foreground,
    marginTop: 8,
  },
  statCardLabel: {
    fontSize: 12,
    color: COLORS['muted-foreground'],
    marginTop: 4,
    textAlign: 'center',
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
    paddingHorizontal: 16,
    borderRadius: 8,
    alignItems: 'center',
  },
  activeTab: {
    backgroundColor: COLORS.primary,
  },
  tabText: {
    fontSize: 14,
    fontWeight: '500',
    color: COLORS['muted-foreground'],
  },
  activeTabText: {
    color: 'white',
  },
  content: {
    flex: 1,
  },
  card: {
    backgroundColor: COLORS.card,
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  cardHeader: {
    marginBottom: 12,
  },
  studentInfo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  studentTitleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  studentName: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.foreground,
    marginLeft: 8,
  },
  studentEmail: {
    fontSize: 14,
    color: COLORS['muted-foreground'],
    marginBottom: 4,
  },
  studentClass: {
    fontSize: 14,
    color: COLORS.foreground,
    marginBottom: 12,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    gap: 4,
  },
  statusText: {
    color: 'white',
    fontSize: 10,
    fontWeight: '600',
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 12,
    paddingVertical: 12,
    backgroundColor: COLORS.background,
    borderRadius: 8,
  },
  statItem: {
    alignItems: 'center',
  },
  statLabel: {
    fontSize: 12,
    color: COLORS['muted-foreground'],
    marginBottom: 4,
  },
  statValue: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.foreground,
  },
  notesContainer: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 12,
    padding: 8,
    backgroundColor: COLORS.background,
    borderRadius: 6,
  },
  notesText: {
    fontSize: 14,
    color: COLORS.foreground,
    marginLeft: 8,
    flex: 1,
    lineHeight: 20,
  },
  cardActions: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 8,
  },
  actionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: COLORS.border,
    gap: 6,
  },
  primaryActionButton: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  actionButtonText: {
    fontSize: 14,
    fontWeight: '500',
    color: COLORS.foreground,
  },
  sessionInfo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  sessionTitleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  sessionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.foreground,
    marginLeft: 8,
  },
  sessionDetails: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  sessionDetailItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  sessionDetailText: {
    fontSize: 14,
    color: COLORS['muted-foreground'],
  },
});
