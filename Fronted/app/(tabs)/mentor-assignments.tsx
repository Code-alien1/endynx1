import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Alert,
  Modal,
  ScrollView,
} from 'react-native';
import { MaterialCommunityIcons, Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../contexts/AuthContext';
import { theme } from '../../constants/theme';
import { apiService } from '../../services/api';

interface User {
  id: number;
  username: string;
  email: string;
  first_name: string;
  last_name: string;
  role: string;
}

interface MentorAssignment {
  id: string;
  student: User;
  mentor: User;
  assigned_date: string;
  is_active: boolean;
}

export default function MentorAssignmentsScreen() {
  const { user } = useAuth();
  const [assignments, setAssignments] = useState<MentorAssignment[]>([]);
  const [students, setStudents] = useState<User[]>([]);
  const [mentors, setMentors] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState<User | null>(null);
  const [selectedMentor, setSelectedMentor] = useState<User | null>(null);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      await Promise.all([
        loadAssignments(),
        loadUsers()
      ]);
    } catch (error) {
      console.error('Error loading data:', error);
      Alert.alert('Error', 'Failed to load data. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const loadAssignments = async () => {
    try {
      const response = await apiService.get('/api/chat/mentor-assignments/');
      if (response.data) {
        setAssignments(response.data.results || response.data);
      }
    } catch (error) {
      console.error('Error loading assignments:', error);
    }
  };

  const loadUsers = async () => {
    try {
      const response = await apiService.get('/api/users/');
      if (response.data) {
        const users = response.data.results || response.data;
        setStudents(users.filter((u: User) => u.role === 'student'));
        setMentors(users.filter((u: User) => u.role === 'mentor'));
      }
    } catch (error) {
      console.error('Error loading users:', error);
    }
  };

  const createAssignment = async () => {
    if (!selectedStudent || !selectedMentor) {
      Alert.alert('Error', 'Please select both a student and a mentor.');
      return;
    }

    try {
      const response = await apiService.post('/api/chat/mentor-assignments/', {
        student_id: selectedStudent.id,
        mentor_id: selectedMentor.id
      });

      if (response.data) {
        setAssignments(prev => [...prev, response.data]);
        setShowAssignModal(false);
        setSelectedStudent(null);
        setSelectedMentor(null);
        Alert.alert('Success', 'Mentor assignment created successfully!');
      }
    } catch (error: any) {
      console.error('Error creating assignment:', error);
      const errorMessage = error.response?.data?.detail || 'Failed to create assignment. Please try again.';
      Alert.alert('Error', errorMessage);
    }
  };

  const deactivateAssignment = async (assignmentId: string) => {
    Alert.alert(
      'Deactivate Assignment',
      'Are you sure you want to deactivate this mentor assignment?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Deactivate',
          style: 'destructive',
          onPress: async () => {
            try {
              await apiService.patch(`/api/chat/mentor-assignments/${assignmentId}/`, {
                is_active: false
              });
              
              setAssignments(prev => 
                prev.map(assignment => 
                  assignment.id === assignmentId 
                    ? { ...assignment, is_active: false }
                    : assignment
                )
              );
              
              Alert.alert('Success', 'Assignment deactivated successfully!');
            } catch (error) {
              console.error('Error deactivating assignment:', error);
              Alert.alert('Error', 'Failed to deactivate assignment. Please try again.');
            }
          }
        }
      ]
    );
  };

  const getUnassignedStudents = () => {
    const assignedStudentIds = assignments
      .filter(a => a.is_active)
      .map(a => a.student.id);
    return students.filter(s => !assignedStudentIds.includes(s.id));
  };

  const renderAssignmentItem = ({ item }: { item: MentorAssignment }) => {
    const studentName = `${item.student.first_name} ${item.student.last_name}`.trim() || item.student.username;
    const mentorName = `${item.mentor.first_name} ${item.mentor.last_name}`.trim() || item.mentor.username;

    return (
      <View style={[styles.assignmentCard, !item.is_active && styles.inactiveCard]}>
        <View style={styles.assignmentHeader}>
          <View style={styles.userInfo}>
            <MaterialCommunityIcons name="account-circle" size={24} color={theme.colors.primary} />
            <Text style={styles.studentName}>{studentName}</Text>
          </View>
          <View style={styles.assignmentActions}>
            {item.is_active && (
              <TouchableOpacity
                style={styles.deactivateButton}
                onPress={() => deactivateAssignment(item.id)}
              >
                <MaterialCommunityIcons name="close" size={20} color={theme.colors.error} />
              </TouchableOpacity>
            )}
          </View>
        </View>
        
        <View style={styles.mentorInfo}>
          <MaterialCommunityIcons name="school" size={20} color={theme.colors.textSecondary} />
          <Text style={styles.mentorName}>Mentor: {mentorName}</Text>
        </View>
        
        <View style={styles.assignmentFooter}>
          <Text style={styles.assignmentDate}>
            Assigned: {new Date(item.assigned_date).toLocaleDateString()}
          </Text>
          <View style={[
            styles.statusBadge,
            item.is_active ? styles.activeBadge : styles.inactiveBadge
          ]}>
            <Text style={[
              styles.statusText,
              item.is_active ? styles.activeText : styles.inactiveText
            ]}>
              {item.is_active ? 'Active' : 'Inactive'}
            </Text>
          </View>
        </View>
      </View>
    );
  };

  const renderUserItem = ({ item, isSelected, onPress }: { 
    item: User; 
    isSelected: boolean; 
    onPress: () => void; 
  }) => {
    const name = `${item.first_name} ${item.last_name}`.trim() || item.username;
    
    return (
      <TouchableOpacity
        style={[styles.userItem, isSelected && styles.selectedUser]}
        onPress={onPress}
      >
        <MaterialCommunityIcons 
          name="account" 
          size={24} 
          color={isSelected ? theme.colors.primary : theme.colors.textSecondary} 
        />
        <View style={styles.userDetails}>
          <Text style={[styles.userName, isSelected && styles.selectedUserName]}>{name}</Text>
          <Text style={styles.userEmail}>{item.email}</Text>
        </View>
        {isSelected && (
          <MaterialCommunityIcons name="check" size={24} color={theme.colors.primary} />
        )}
      </TouchableOpacity>
    );
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <MaterialCommunityIcons name="loading" size={40} color={theme.colors.primary} />
        <Text style={styles.loadingText}>Loading assignments...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>Mentor Assignments</Text>
        <TouchableOpacity
          style={styles.addButton}
          onPress={() => setShowAssignModal(true)}
        >
          <MaterialCommunityIcons name="plus" size={24} color="white" />
          <Text style={styles.addButtonText}>Assign Mentor</Text>
        </TouchableOpacity>
      </View>

      {/* Assignments List */}
      {assignments.length === 0 ? (
        <View style={styles.emptyContainer}>
          <MaterialCommunityIcons name="account-group-outline" size={80} color={theme.colors.muted} />
          <Text style={styles.emptyTitle}>No Assignments</Text>
          <Text style={styles.emptyText}>
            No mentor assignments have been created yet. Tap "Assign Mentor" to create one.
          </Text>
        </View>
      ) : (
        <FlatList
          data={assignments}
          keyExtractor={(item) => item.id}
          renderItem={renderAssignmentItem}
          style={styles.assignmentsList}
          contentContainerStyle={styles.assignmentsContent}
        />
      )}

      {/* Assignment Modal */}
      <Modal
        visible={showAssignModal}
        animationType="slide"
        presentationStyle="pageSheet"
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <TouchableOpacity onPress={() => setShowAssignModal(false)}>
              <MaterialCommunityIcons name="close" size={24} color={theme.colors.text} />
            </TouchableOpacity>
            <Text style={styles.modalTitle}>Assign Mentor</Text>
            <TouchableOpacity
              onPress={createAssignment}
              disabled={!selectedStudent || !selectedMentor}
            >
              <Text style={[
                styles.saveButton,
                (!selectedStudent || !selectedMentor) && styles.saveButtonDisabled
              ]}>
                Save
              </Text>
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.modalContent}>
            {/* Student Selection */}
            <Text style={styles.sectionTitle}>Select Student</Text>
            {getUnassignedStudents().length === 0 ? (
              <Text style={styles.noUsersText}>All students have been assigned mentors.</Text>
            ) : (
              <FlatList
                data={getUnassignedStudents()}
                keyExtractor={(item) => item.id.toString()}
                renderItem={({ item }) => renderUserItem({
                  item,
                  isSelected: selectedStudent?.id === item.id,
                  onPress: () => setSelectedStudent(item)
                })}
                style={styles.usersList}
                scrollEnabled={false}
              />
            )}

            {/* Mentor Selection */}
            <Text style={styles.sectionTitle}>Select Mentor</Text>
            {mentors.length === 0 ? (
              <Text style={styles.noUsersText}>No mentors available.</Text>
            ) : (
              <FlatList
                data={mentors}
                keyExtractor={(item) => item.id.toString()}
                renderItem={({ item }) => renderUserItem({
                  item,
                  isSelected: selectedMentor?.id === item.id,
                  onPress: () => setSelectedMentor(item)
                })}
                style={styles.usersList}
                scrollEnabled={false}
              />
            )}
          </ScrollView>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: theme.colors.background,
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: theme.colors.text,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    backgroundColor: theme.colors.card,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors["card-border"],
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: theme.colors.text,
  },
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.primary,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
  },
  addButtonText: {
    color: 'white',
    fontWeight: 'bold',
    marginLeft: 8,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
  },
  emptyTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: theme.colors.text,
    marginTop: 20,
    marginBottom: 10,
  },
  emptyText: {
    fontSize: 16,
    color: theme.colors.textSecondary,
    textAlign: 'center',
    lineHeight: 24,
  },
  assignmentsList: {
    flex: 1,
  },
  assignmentsContent: {
    padding: 16,
  },
  assignmentCard: {
    backgroundColor: theme.colors.card,
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: theme.colors["card-border"],
  },
  inactiveCard: {
    opacity: 0.6,
  },
  assignmentHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  userInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  studentName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: theme.colors.text,
    marginLeft: 8,
  },
  assignmentActions: {
    flexDirection: 'row',
  },
  deactivateButton: {
    padding: 4,
  },
  mentorInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  mentorName: {
    fontSize: 16,
    color: theme.colors.textSecondary,
    marginLeft: 8,
  },
  assignmentFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  assignmentDate: {
    fontSize: 14,
    color: theme.colors.textSecondary,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  activeBadge: {
    backgroundColor: theme.colors.success + '20',
  },
  inactiveBadge: {
    backgroundColor: theme.colors.muted + '20',
  },
  statusText: {
    fontSize: 12,
    fontWeight: 'bold',
  },
  activeText: {
    color: theme.colors.success,
  },
  inactiveText: {
    color: theme.colors.muted,
  },
  modalContainer: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    backgroundColor: theme.colors.card,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors["card-border"],
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: theme.colors.text,
  },
  saveButton: {
    fontSize: 16,
    fontWeight: 'bold',
    color: theme.colors.primary,
  },
  saveButtonDisabled: {
    color: theme.colors.muted,
  },
  modalContent: {
    flex: 1,
    padding: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: theme.colors.text,
    marginBottom: 16,
    marginTop: 20,
  },
  noUsersText: {
    fontSize: 16,
    color: theme.colors.textSecondary,
    textAlign: 'center',
    padding: 20,
  },
  usersList: {
    marginBottom: 20,
  },
  userItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    backgroundColor: theme.colors.card,
    borderRadius: 8,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: theme.colors["card-border"],
  },
  selectedUser: {
    borderColor: theme.colors.primary,
    backgroundColor: theme.colors.primary + '10',
  },
  userDetails: {
    flex: 1,
    marginLeft: 12,
  },
  userName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: theme.colors.text,
  },
  selectedUserName: {
    color: theme.colors.primary,
  },
  userEmail: {
    fontSize: 14,
    color: theme.colors.textSecondary,
    marginTop: 2,
  },
});
