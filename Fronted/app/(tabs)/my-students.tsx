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
  Modal,
  ActivityIndicator,
} from 'react-native';
import { MaterialCommunityIcons, Ionicons } from '@expo/vector-icons';
import AppBackground from '../../components/AppBackground';
import { COLORS } from '../../constants/theme';
import { useAuth } from '../../contexts/AuthContext';
import apiService from '../../services/api';

interface Student {
  id: string;
  name: string;
  email: string;
  class_name: string;
  attendance_rate: number;
  last_active: string;
  academic_status: 'excellent' | 'good' | 'needs_attention' | 'at_risk';
  notes?: string;
  absences?: any[];
  progress_reports?: any[];
  assignment_id?: number;
  assigned_by_name?: string;
  assigned_at?: string;
  assignment_notes?: string;
}

interface MentorRating {
  id: string;
  student_name: string;
  rating: number;
  comment: string;
  timestamp: string;
  status: 'pending' | 'reviewed';
}

export default function MyStudentsScreen() {
  const { user } = useAuth();
  const [students, setStudents] = useState<Student[]>([]);
  const [ratings, setRatings] = useState<MentorRating[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [activeTab, setActiveTab] = useState<'students' | 'ratings'>('students');
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);
  const [showReportsModal, setShowReportsModal] = useState(false);
  const [studentReports, setStudentReports] = useState<any>(null);
  const [dataLoaded, setDataLoaded] = useState(false);

  useEffect(() => {
    if (!dataLoaded) {
      loadData();
    }
  }, [dataLoaded]);

  const loadData = async () => {
    try {
      setLoading(true);
      
      // Load real assigned students from API
      const assignmentsResponse = await apiService.get('/chat/mentor-assignments/');
      const assignments = assignmentsResponse.data.results || assignmentsResponse.data;
      
      // Filter assignments for current mentor
      const mentorAssignments = assignments.filter((a: any) => 
        a.mentor_id === user?.id || a.mentor_email === user?.email
      );
      console.log('Mentor assignments found:', mentorAssignments.length);
      
      // Get student details for each assignment
      const studentPromises = mentorAssignments.map(async (assignment: any) => {
        try {
          // Use student info from assignment if student_id is available
          let student;
          if (assignment.student_id) {
            try {
              const studentResponse = await apiService.get(`/users/${assignment.student_id}/`);
              student = studentResponse.data;
            } catch (studentError) {
              console.log('Using assignment data for student:', assignment.student_name);
              // Fallback to assignment data
              student = {
                id: assignment.student_id || 'unknown',
                first_name: assignment.student_name?.split(' ')[0] || 'Unknown',
                last_name: assignment.student_name?.split(' ')[1] || 'Student',
                email: assignment.student_email,
                class_name: 'N/A'
              };
            }
          } else {
            // Use assignment data directly
            student = {
              id: 'unknown',
              first_name: assignment.student_name?.split(' ')[0] || 'Unknown',
              last_name: assignment.student_name?.split(' ')[1] || 'Student', 
              email: assignment.student_email,
              class_name: 'N/A'
            };
          }
          
          // Get attendance data for the student
          let attendanceRate = 0;
          try {
            const attendanceResponse = await apiService.get(`/attendance/?student_id=${student.id}`);
            const attendanceData = attendanceResponse.data.results || attendanceResponse.data;
            const totalDays = attendanceData.length;
            const presentDays = attendanceData.filter((a: any) => a.status === 'present').length;
            attendanceRate = totalDays > 0 ? Math.round((presentDays / totalDays) * 100) : 0;
          } catch (attendanceError) {
            console.log('No attendance data found for student');
          }
          
          return {
            id: student.id,
            name: `${student.first_name} ${student.last_name}`,
            email: student.email,
            class_name: student.class_name || 'N/A',
            attendance_rate: attendanceRate,
            last_active: new Date().toISOString(),
            academic_status: attendanceRate >= 90 ? 'excellent' : 
                           attendanceRate >= 75 ? 'good' : 
                           attendanceRate >= 60 ? 'needs_attention' : 'at_risk',
            notes: assignment.notes || '',
            assignment_id: assignment.id,
            assigned_by_name: assignment.assigned_by_name || 'Administrator',
            assigned_at: assignment.assigned_at,
            assignment_notes: assignment.notes
          } as Student;
        } catch (error) {
          console.error('Error loading student details:', error);
          return null;
        }
      });
      
      const studentsData = await Promise.all(studentPromises);
      setStudents(studentsData.filter(s => s !== null));
      
      // Load mentor ratings
      try {
        const ratingsResponse = await apiService.get('/chat/mentor-ratings/');
        const allRatings = ratingsResponse.data.results || ratingsResponse.data;
        const mentorRatings = allRatings.filter((r: any) => r.mentor_id === user?.id);
        setRatings(mentorRatings);
      } catch (ratingsError) {
        console.log('No ratings found');
      }
      
    } catch (error) {
      console.error('Error loading data:', error);
      Alert.alert('Error', 'Failed to load student data');
    } finally {
      setLoading(false);
      setDataLoaded(true);
    }
  };

  const loadStudentReports = async (studentId: string) => {
    try {
      const [absencesResponse, progressResponse] = await Promise.all([
        apiService.get(`/attendance/?student_id=${studentId}&status=absent`),
        apiService.get(`/users/${studentId}/progress/`) // Assuming this endpoint exists
      ]);
      
      setStudentReports({
        absences: absencesResponse.data.results || absencesResponse.data,
        progress: progressResponse.data || []
      });
    } catch (error) {
      console.error('Error loading student reports:', error);
      setStudentReports({ absences: [], progress: [] });
    }
  };

  const handleStudentPress = (student: Student) => {
    setSelectedStudent(student);
    loadStudentReports(student.id);
    setShowReportsModal(true);
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
    <TouchableOpacity 
      style={styles.card}
      onPress={() => handleStudentPress(item)}
    >
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

      {/* Assignment Information */}
      <View style={styles.assignmentContainer}>
        <Text style={styles.assignmentTitle}>Assignment Details</Text>
        <View style={styles.assignmentDetailItem}>
          <MaterialCommunityIcons name="account-supervisor" size={16} color={COLORS['muted-foreground']} />
          <Text style={styles.assignmentDetailText}>
            Assigned by: {item.assigned_by_name || 'Administrator'}
          </Text>
        </View>
        <View style={styles.assignmentDetailItem}>
          <MaterialCommunityIcons name="calendar" size={16} color={COLORS['muted-foreground']} />
          <Text style={styles.assignmentDetailText}>
            Assigned on: {item.assigned_at ? new Date(item.assigned_at).toLocaleDateString() : 'N/A'}
          </Text>
        </View>
        {item.assignment_notes && (
          <View style={styles.assignmentDetailItem}>
            <MaterialCommunityIcons name="text" size={16} color={COLORS['muted-foreground']} />
            <Text style={styles.assignmentDetailText}>
              Assignment notes: {item.assignment_notes}
            </Text>
          </View>
        )}
      </View>

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
    </TouchableOpacity>
  );

  const renderRatingCard = ({ item }: { item: MentorRating }) => (
    <View style={styles.card}>
      <View style={styles.cardHeader}>
        <View style={styles.ratingInfo}>
          <View style={styles.ratingTitleContainer}>
            <MaterialCommunityIcons 
              name="star" 
              size={20} 
              color={COLORS.primary} 
            />
            <Text style={styles.ratingTitle}>{item.student_name}</Text>
          </View>
          <View style={[
            styles.statusBadge, 
            { 
              backgroundColor: item.status === 'reviewed' ? COLORS.success : COLORS.primary
            }
          ]}>
            <Text style={styles.statusText}>{item.status.toUpperCase()}</Text>
          </View>
        </View>
      </View>

      <View style={styles.ratingDetails}>
        <View style={styles.ratingDetailItem}>
          <MaterialCommunityIcons name="star-outline" size={16} color={COLORS['muted-foreground']} />
          <Text style={styles.ratingDetailText}>
            {item.rating}/5 stars
          </Text>
        </View>
        <View style={styles.ratingDetailItem}>
          <MaterialCommunityIcons name="calendar" size={16} color={COLORS['muted-foreground']} />
          <Text style={styles.ratingDetailText}>
            {new Date(item.timestamp).toLocaleDateString()}
          </Text>
        </View>
      </View>

      <View style={styles.notesContainer}>
        <MaterialCommunityIcons name="comment-text" size={16} color={COLORS['muted-foreground']} />
        <Text style={styles.notesText}>{item.comment}</Text>
      </View>
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
            <Text style={styles.statCardNumber}>{ratings.filter((r: MentorRating) => r.status === 'reviewed').length}</Text>
            <Text style={styles.statCardLabel}>Ratings Reviewed</Text>
          </View>
          <View style={styles.statCard}>
            <MaterialCommunityIcons name="calendar-clock" size={24} color="#f59e0b" />
            <Text style={styles.statCardNumber}>{ratings.filter((r: MentorRating) => r.status === 'pending').length}</Text>
            <Text style={styles.statCardLabel}>Pending Ratings</Text>
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
            style={[styles.tab, activeTab === 'ratings' && styles.activeTab]}
            onPress={() => setActiveTab('ratings')}
          >
            <Text style={[styles.tabText, activeTab === 'ratings' && styles.activeTabText]}>
              Ratings ({ratings.length})
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

          {activeTab === 'ratings' && (
            <FlatList
              data={ratings}
              renderItem={renderRatingCard}
              keyExtractor={(item) => item.id}
              scrollEnabled={false}
              showsVerticalScrollIndicator={false}
            />
          )}
        </View>
      </ScrollView>

      {/* Student Reports Modal */}
      <Modal
        visible={showReportsModal}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setShowReportsModal(false)}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>
              {selectedStudent?.name} - Reports
            </Text>
            <TouchableOpacity
              onPress={() => setShowReportsModal(false)}
              style={styles.closeButton}
            >
              <Ionicons name="close" size={24} color={COLORS.foreground} />
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.modalContent}>
            {/* Absences Section */}
            <View style={styles.reportSection}>
              <Text style={styles.reportSectionTitle}>
                Recent Absences ({studentReports?.absences?.length || 0})
              </Text>
              {studentReports?.absences?.length > 0 ? (
                studentReports.absences.map((absence: any, index: number) => (
                  <View key={index} style={styles.reportItem}>
                    <View style={styles.reportItemHeader}>
                      <MaterialCommunityIcons 
                        name="calendar-remove" 
                        size={16} 
                        color={COLORS.destructive} 
                      />
                      <Text style={styles.reportItemDate}>
                        {new Date(absence.date).toLocaleDateString()}
                      </Text>
                    </View>
                    <Text style={styles.reportItemReason}>
                      Reason: {absence.reason || 'Not specified'}
                    </Text>
                    {absence.notes && (
                      <Text style={styles.reportItemNotes}>
                        Notes: {absence.notes}
                      </Text>
                    )}
                  </View>
                ))
              ) : (
                <View style={styles.emptyState}>
                  <MaterialCommunityIcons 
                    name="calendar-check" 
                    size={48} 
                    color={COLORS.success} 
                  />
                  <Text style={styles.emptyStateText}>No recent absences</Text>
                </View>
              )}
            </View>

            {/* Progress Reports Section */}
            <View style={styles.reportSection}>
              <Text style={styles.reportSectionTitle}>
                Progress Reports ({studentReports?.progress?.length || 0})
              </Text>
              {studentReports?.progress?.length > 0 ? (
                studentReports.progress.map((report: any, index: number) => (
                  <View key={index} style={styles.reportItem}>
                    <View style={styles.reportItemHeader}>
                      <MaterialCommunityIcons 
                        name="chart-line" 
                        size={16} 
                        color={COLORS.primary} 
                      />
                      <Text style={styles.reportItemDate}>
                        {new Date(report.date).toLocaleDateString()}
                      </Text>
                      <View style={[
                        styles.gradeBadge,
                        { backgroundColor: report.grade >= 80 ? COLORS.success : 
                                          report.grade >= 60 ? '#f59e0b' : COLORS.destructive }
                      ]}>
                        <Text style={styles.gradeText}>{report.grade}%</Text>
                      </View>
                    </View>
                    <Text style={styles.reportItemSubject}>
                      Subject: {report.subject}
                    </Text>
                    {report.comments && (
                      <Text style={styles.reportItemNotes}>
                        Comments: {report.comments}
                      </Text>
                    )}
                  </View>
                ))
              ) : (
                <View style={styles.emptyState}>
                  <MaterialCommunityIcons 
                    name="chart-line-variant" 
                    size={48} 
                    color={COLORS['muted-foreground']} 
                  />
                  <Text style={styles.emptyStateText}>No progress reports available</Text>
                </View>
              )}
            </View>
          </ScrollView>
        </View>
      </Modal>
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
  ratingInfo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  ratingTitleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  ratingTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.foreground,
    marginLeft: 8,
  },
  ratingDetails: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  ratingDetailItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  ratingDetailText: {
    fontSize: 14,
    color: COLORS['muted-foreground'],
  },
  modalContainer: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: COLORS.foreground,
  },
  closeButton: {
    padding: 8,
  },
  modalContent: {
    flex: 1,
    padding: 20,
  },
  reportSection: {
    marginBottom: 32,
  },
  reportSectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: COLORS.foreground,
    marginBottom: 16,
  },
  reportItem: {
    backgroundColor: COLORS.card,
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  reportItemHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
    gap: 8,
  },
  reportItemDate: {
    fontSize: 14,
    fontWeight: '500',
    color: COLORS.foreground,
    flex: 1,
  },
  reportItemReason: {
    fontSize: 14,
    color: COLORS['muted-foreground'],
    marginBottom: 4,
  },
  reportItemSubject: {
    fontSize: 14,
    color: COLORS['muted-foreground'],
    marginBottom: 4,
  },
  reportItemNotes: {
    fontSize: 14,
    color: COLORS.foreground,
    fontStyle: 'italic',
  },
  gradeBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  gradeText: {
    color: 'white',
    fontSize: 12,
    fontWeight: '600',
  },
  emptyState: {
    alignItems: 'center',
    padding: 32,
  },
  emptyStateText: {
    fontSize: 16,
    color: COLORS['muted-foreground'],
    marginTop: 12,
    textAlign: 'center',
  },
  assignmentContainer: {
    backgroundColor: COLORS.background,
    borderRadius: 8,
    padding: 12,
    marginBottom: 12,
  },
  assignmentTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.foreground,
    marginBottom: 8,
  },
  assignmentDetailItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
    gap: 8,
  },
  assignmentDetailText: {
    fontSize: 13,
    color: COLORS['muted-foreground'],
    flex: 1,
  },
});
