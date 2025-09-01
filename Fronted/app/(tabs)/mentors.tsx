import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  Alert,
  StyleSheet,
  RefreshControl,
  Modal,
  TextInput,
  FlatList,
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
  mentor_id?: string;
  mentor_name?: string;
}

interface Mentor {
  id: string;
  name: string;
  email: string;
  assigned_students: number;
  max_students: number;
  rating?: number;
  total_ratings?: number;
}

interface MentorAssignment {
  id: string;
  student_id: string;
  mentor_id: string;
  student_name: string;
  mentor_name: string;
  assigned_date: string;
}

export default function MentorsScreen() {
  const { user } = useAuth();
  const [students, setStudents] = useState<Student[]>([]);
  const [mentors, setMentors] = useState<Mentor[]>([]);
  const [assignments, setAssignments] = useState<MentorAssignment[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);
  const [selectedMentor, setSelectedMentor] = useState<string>('');
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState<'students' | 'mentors' | 'assignments'>('students');
  const [dataLoaded, setDataLoaded] = useState(false);

  useEffect(() => {
    if (!dataLoaded) {
      loadData();
    }
  }, [dataLoaded]);

  const loadData = async () => {
    try {
      setLoading(true);
      
      // Load real data from API
      const [studentsResponse, mentorsResponse, assignmentsResponse, ratingsResponse] = await Promise.all([
        apiService.get('/users/?role=student'),
        apiService.get('/users/?role=mentor'),
        apiService.get('/chat/mentor-assignments/'),
        apiService.get('/chat/mentor-ratings/')
      ]);

      const studentsData = studentsResponse.data;
      const mentorsData = mentorsResponse.data;
      const assignmentsData = assignmentsResponse.data;
      const ratingsData = ratingsResponse.data;

      // Transform API data to match interface
      const transformedStudents: Student[] = (studentsData.results || studentsData).map((student: any) => ({
        id: student.id,
        name: `${student.first_name} ${student.last_name}`,
        email: student.email,
        class_name: student.class_name || 'N/A',
        mentor_id: undefined,
        mentor_name: undefined
      }));

      const transformedMentors: Mentor[] = (mentorsData.results || mentorsData).map((mentor: any) => {
        const mentorRatings = ratingsData.filter((rating: any) => rating.mentor_id === mentor.id);
        const avgRating = mentorRatings.length > 0 
          ? mentorRatings.reduce((sum: number, r: any) => sum + r.rating, 0) / mentorRatings.length 
          : 0;
        
        return {
          id: mentor.id,
          name: `${mentor.first_name} ${mentor.last_name}`,
          email: mentor.email,
          assigned_students: 0, // Will be calculated from assignments
          max_students: 5, // Default capacity
          rating: avgRating,
          total_ratings: mentorRatings.length
        };
      });

      const transformedAssignments: MentorAssignment[] = (assignmentsData.results || assignmentsData).map((assignment: any) => ({
        id: assignment.id,
        student_id: assignment.student_id,
        mentor_id: assignment.mentor_id,
        student_name: assignment.student_name,
        mentor_name: assignment.mentor_name,
        assigned_date: assignment.assigned_at?.split('T')[0] || new Date().toISOString().split('T')[0]
      }));

      // Update students with mentor info from assignments
      const studentsWithMentors = transformedStudents.map(student => {
        const assignment = transformedAssignments.find(a => a.student_id === student.id);
        return assignment ? {
          ...student,
          mentor_id: assignment.mentor_id,
          mentor_name: assignment.mentor_name
        } : student;
      });

      // Update mentor assigned student counts
      const mentorsWithCounts = transformedMentors.map(mentor => ({
        ...mentor,
        assigned_students: transformedAssignments.filter(a => a.mentor_id === mentor.id).length
      }));

      setStudents(studentsWithMentors);
      setMentors(mentorsWithCounts);
      setAssignments(transformedAssignments);
    } catch (error) {
      console.error('Error loading mentor data:', error);
      Alert.alert('Error', 'Failed to load mentor data');
    } finally {
      setLoading(false);
      setDataLoaded(true);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  };

  const handleAssignMentor = (student: Student) => {
    setSelectedStudent(student);
    setSelectedMentor('');
    setShowAssignModal(true);
  };

  const confirmAssignment = async () => {
    if (!selectedStudent || !selectedMentor) {
      Alert.alert('Error', 'Please select a mentor');
      return;
    }

    try {
      // Create assignment via API
      const assignmentData = {
        student_id: selectedStudent.id,
        mentor_id: selectedMentor,
        notes: `Assigned via admin interface`
      };

      await apiService.post('/chat/mentor-assignments/', assignmentData);
      
      // Refresh data to show updated assignments
      await loadData();
      
      setShowAssignModal(false);
      Alert.alert('Success', 'Mentor assigned successfully!');
    } catch (error) {
      console.error('Error assigning mentor:', error);
      Alert.alert('Error', 'Failed to assign mentor');
    }
  };

  const handleRemoveAssignment = async (studentId: string) => {
    Alert.alert(
      'Remove Assignment',
      'Are you sure you want to remove this mentor assignment?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Remove',
          style: 'destructive',
          onPress: async () => {
            try {
              const assignment = assignments.find(a => a.student_id === studentId);
              if (!assignment) return;

              // Remove assignment via API
              await apiService.delete(`/chat/mentor-assignments/${assignment.id}/`);
              
              // Refresh data
              await loadData();

              Alert.alert('Success', 'Assignment removed successfully!');
            } catch (error) {
              console.error('Error removing assignment:', error);
              Alert.alert('Error', 'Failed to remove assignment');
            }
          }
        }
      ]
    );
  };

  const filteredStudents = students.filter(student =>
    student.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    student.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
    student.class_name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const filteredMentors = mentors.filter(mentor =>
    mentor.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    mentor.email.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const filteredAssignments = assignments.filter(assignment =>
    assignment.student_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    assignment.mentor_name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const renderStudentCard = ({ item }: { item: Student }) => (
    <View style={styles.card}>
      <View style={styles.cardHeader}>
        <View style={styles.cardTitleContainer}>
          <MaterialCommunityIcons name="account" size={20} color={COLORS.primary} />
          <Text style={styles.cardTitle}>{item.name}</Text>
        </View>
        <View style={styles.cardActions}>
          {item.mentor_id ? (
            <TouchableOpacity
              style={styles.removeButton}
              onPress={() => handleRemoveAssignment(item.id)}
            >
              <MaterialCommunityIcons name="close" size={16} color="white" />
            </TouchableOpacity>
          ) : (
            <TouchableOpacity
              style={styles.assignButton}
              onPress={() => handleAssignMentor(item)}
            >
              <MaterialCommunityIcons name="plus" size={16} color="white" />
            </TouchableOpacity>
          )}
        </View>
      </View>
      <Text style={styles.cardSubtitle}>{item.email}</Text>
      <Text style={styles.cardInfo}>Class: {item.class_name}</Text>
      {item.mentor_name ? (
        <View style={styles.mentorInfo}>
          <MaterialCommunityIcons name="account-tie" size={16} color={COLORS.success} />
          <Text style={styles.mentorText}>Mentor: {item.mentor_name}</Text>
        </View>
      ) : (
        <View style={styles.mentorInfo}>
          <MaterialCommunityIcons name="account-off" size={16} color={COLORS.destructive} />
          <Text style={[styles.mentorText, { color: COLORS.destructive }]}>No mentor assigned</Text>
        </View>
      )}
    </View>
  );

  const renderMentorCard = ({ item }: { item: Mentor }) => (
    <View style={styles.card}>
      <View style={styles.cardHeader}>
        <View style={styles.cardTitleContainer}>
          <MaterialCommunityIcons name="account-tie" size={20} color={COLORS.primary} />
          <Text style={styles.cardTitle}>{item.name}</Text>
        </View>
        <View style={[
          styles.capacityBadge,
          { backgroundColor: item.assigned_students >= item.max_students ? COLORS.destructive : COLORS.success }
        ]}>
          <Text style={styles.capacityText}>
            {item.assigned_students}/{item.max_students}
          </Text>
        </View>
      </View>
      <Text style={styles.cardSubtitle}>{item.email}</Text>
      <Text style={styles.cardInfo}>
        Capacity: {item.assigned_students} of {item.max_students} students
      </Text>
      {item.rating && item.total_ratings ? (
        <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 4 }}>
          <Ionicons name="star" size={16} color="#FFD700" />
          <Text style={styles.cardInfo}>
            {item.rating.toFixed(1)} ({item.total_ratings} ratings)
          </Text>
        </View>
      ) : (
        <Text style={[styles.cardInfo, { color: COLORS['muted-foreground'] }]}>
          No ratings yet
        </Text>
      )}
    </View>
  );

  const renderAssignmentCard = ({ item }: { item: MentorAssignment }) => (
    <View style={styles.card}>
      <View style={styles.cardHeader}>
        <View style={styles.cardTitleContainer}>
          <MaterialCommunityIcons name="link" size={20} color={COLORS.primary} />
          <Text style={styles.cardTitle}>Assignment</Text>
        </View>
        <TouchableOpacity
          style={styles.removeButton}
          onPress={() => handleRemoveAssignment(item.student_id)}
        >
          <MaterialCommunityIcons name="close" size={16} color="white" />
        </TouchableOpacity>
      </View>
      <Text style={styles.cardInfo}>Student: {item.student_name}</Text>
      <Text style={styles.cardInfo}>Mentor: {item.mentor_name}</Text>
      <Text style={styles.cardSubtitle}>Assigned: {new Date(item.assigned_date).toLocaleDateString()}</Text>
    </View>
  );

  if (loading) {
    return (
      <AppBackground>
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>Loading mentor data...</Text>
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
          <Text style={styles.title}>Mentor Management</Text>
          <Text style={styles.subtitle}>Assign mentors to students and manage relationships</Text>
        </View>

        {/* Search Bar */}
        <View style={styles.searchContainer}>
          <MaterialCommunityIcons name="magnify" size={20} color={COLORS['muted-foreground']} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search students, mentors, or assignments..."
            placeholderTextColor={COLORS['muted-foreground']}
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
        </View>

        {/* Tab Navigation */}
        <View style={styles.tabContainer}>
          <TouchableOpacity
            style={[styles.tab, activeTab === 'students' && styles.activeTab]}
            onPress={() => setActiveTab('students')}
          >
            <Text style={[styles.tabText, activeTab === 'students' && styles.activeTabText]}>
              Students ({filteredStudents.length})
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.tab, activeTab === 'mentors' && styles.activeTab]}
            onPress={() => setActiveTab('mentors')}
          >
            <Text style={[styles.tabText, activeTab === 'mentors' && styles.activeTabText]}>
              Mentors ({filteredMentors.length})
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.tab, activeTab === 'assignments' && styles.activeTab]}
            onPress={() => setActiveTab('assignments')}
          >
            <Text style={[styles.tabText, activeTab === 'assignments' && styles.activeTabText]}>
              Assignments ({filteredAssignments.length})
            </Text>
          </TouchableOpacity>
        </View>

        {/* Content */}
        <View style={styles.content}>
          {activeTab === 'students' && (
            <FlatList
              data={filteredStudents}
              renderItem={renderStudentCard}
              keyExtractor={(item) => item.id}
              scrollEnabled={false}
              showsVerticalScrollIndicator={false}
            />
          )}

          {activeTab === 'mentors' && (
            <FlatList
              data={filteredMentors}
              renderItem={renderMentorCard}
              keyExtractor={(item) => item.id}
              scrollEnabled={false}
              showsVerticalScrollIndicator={false}
            />
          )}

          {activeTab === 'assignments' && (
            <FlatList
              data={filteredAssignments}
              renderItem={renderAssignmentCard}
              keyExtractor={(item) => item.id}
              scrollEnabled={false}
              showsVerticalScrollIndicator={false}
            />
          )}
        </View>
      </ScrollView>

      {/* Assign Mentor Modal */}
      <Modal
        visible={showAssignModal}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setShowAssignModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Assign Mentor</Text>
              <TouchableOpacity onPress={() => setShowAssignModal(false)}>
                <MaterialCommunityIcons name="close" size={24} color={COLORS['muted-foreground']} />
              </TouchableOpacity>
            </View>

            {selectedStudent && (
              <View style={styles.studentInfo}>
                <Text style={styles.modalSubtitle}>Student: {selectedStudent.name}</Text>
                <Text style={styles.modalInfo}>Class: {selectedStudent.class_name}</Text>
              </View>
            )}

            <Text style={styles.sectionTitle}>Select Mentor:</Text>
            <ScrollView style={styles.mentorList}>
              {mentors.map((mentor) => (
                <TouchableOpacity
                  key={mentor.id}
                  style={[
                    styles.mentorOption,
                    selectedMentor === mentor.id && styles.selectedMentorOption,
                    mentor.assigned_students >= mentor.max_students && styles.disabledMentorOption
                  ]}
                  onPress={() => mentor.assigned_students < mentor.max_students && setSelectedMentor(mentor.id)}
                  disabled={mentor.assigned_students >= mentor.max_students}
                >
                  <View style={styles.mentorOptionContent}>
                    <Text style={[
                      styles.mentorOptionName,
                      mentor.assigned_students >= mentor.max_students && styles.disabledText
                    ]}>
                      {mentor.name}
                    </Text>
                    <Text style={[
                      styles.mentorOptionInfo,
                      mentor.assigned_students >= mentor.max_students && styles.disabledText
                    ]}>
                      {mentor.assigned_students}/{mentor.max_students} students
                    </Text>
                  </View>
                  {selectedMentor === mentor.id && (
                    <MaterialCommunityIcons name="check" size={20} color={COLORS.primary} />
                  )}
                </TouchableOpacity>
              ))}
            </ScrollView>

            <View style={styles.modalActions}>
              <TouchableOpacity
                style={styles.cancelButton}
                onPress={() => setShowAssignModal(false)}
              >
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.confirmButton, !selectedMentor && styles.disabledButton]}
                onPress={confirmAssignment}
                disabled={!selectedMentor}
              >
                <Text style={styles.confirmButtonText}>Assign</Text>
              </TouchableOpacity>
            </View>
          </View>
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
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.card,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  searchInput: {
    flex: 1,
    marginLeft: 12,
    fontSize: 16,
    color: COLORS.foreground,
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
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  cardTitleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.foreground,
    marginLeft: 8,
  },
  cardSubtitle: {
    fontSize: 14,
    color: COLORS['muted-foreground'],
    marginBottom: 4,
  },
  cardInfo: {
    fontSize: 14,
    color: COLORS.foreground,
    marginBottom: 4,
  },
  cardActions: {
    flexDirection: 'row',
    gap: 8,
  },
  assignButton: {
    backgroundColor: COLORS.primary,
    borderRadius: 6,
    padding: 6,
  },
  removeButton: {
    backgroundColor: COLORS.destructive,
    borderRadius: 6,
    padding: 6,
  },
  mentorInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
  },
  mentorText: {
    fontSize: 14,
    color: COLORS.success,
    marginLeft: 6,
    fontWeight: '500',
  },
  capacityBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  capacityText: {
    color: 'white',
    fontSize: 12,
    fontWeight: '600',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: COLORS.card,
    borderRadius: 16,
    padding: 20,
    width: '90%',
    maxHeight: '80%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: COLORS.foreground,
  },
  studentInfo: {
    backgroundColor: COLORS.background,
    borderRadius: 8,
    padding: 12,
    marginBottom: 20,
  },
  modalSubtitle: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.foreground,
    marginBottom: 4,
  },
  modalInfo: {
    fontSize: 14,
    color: COLORS['muted-foreground'],
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.foreground,
    marginBottom: 12,
  },
  mentorList: {
    maxHeight: 200,
    marginBottom: 20,
  },
  mentorOption: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 12,
    borderRadius: 8,
    marginBottom: 8,
    backgroundColor: COLORS.background,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  selectedMentorOption: {
    borderColor: COLORS.primary,
    backgroundColor: `${COLORS.primary}10`,
  },
  disabledMentorOption: {
    opacity: 0.5,
  },
  mentorOptionContent: {
    flex: 1,
  },
  mentorOptionName: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.foreground,
    marginBottom: 2,
  },
  mentorOptionInfo: {
    fontSize: 12,
    color: COLORS['muted-foreground'],
  },
  disabledText: {
    color: COLORS['muted-foreground'],
  },
  modalActions: {
    flexDirection: 'row',
    gap: 12,
  },
  cancelButton: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: COLORS.border,
    alignItems: 'center',
  },
  cancelButtonText: {
    color: COLORS.foreground,
    fontSize: 16,
    fontWeight: '500',
  },
  confirmButton: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 8,
    backgroundColor: COLORS.primary,
    alignItems: 'center',
  },
  disabledButton: {
    opacity: 0.5,
  },
  confirmButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
});
