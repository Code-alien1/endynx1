import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Alert,
  Modal,
  TextInput,
  ScrollView,
  RefreshControl,
  SafeAreaView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { theme } from '../../constants/theme';
import apiService from '../../services/api';

interface User {
  id: string;
  email: string;
  username: string;
  first_name: string;
  last_name: string;
  role: 'student' | 'parent' | 'teacher' | 'mentor' | 'administration' | 'superadmin';
  student_id?: string;
  mentor_id?: string;
  level?: number;
  class_name?: string;
}

interface MentorAssignment {
  id: string;
  student_name: string;
  mentor_name: string;
  student_email: string;
  mentor_email: string;
  assigned_by_name: string;
  is_active: boolean;
  assigned_at: string;
}

export default function MentorAssignments() {
  const [assignments, setAssignments] = useState<MentorAssignment[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [showUserModal, setShowUserModal] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState<User | null>(null);
  const [selectedMentor, setSelectedMentor] = useState<User | null>(null);
  const [students, setStudents] = useState<User[]>([]);
  const [mentors, setMentors] = useState<User[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [userType, setUserType] = useState<'student' | 'mentor'>('student');

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      await Promise.all([
        fetchAssignments(),
        fetchUsers(),
      ]);
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchAssignments = async () => {
    try {
      const response = await apiService.get('/chat/mentor-assignments/');
      setAssignments(response.data.results || response.data);
    } catch (error) {
      console.error('Error loading assignments:', error);
    }
  };

  const fetchUsers = async () => {
    try {
      const [studentsResponse, mentorsResponse] = await Promise.all([
        apiService.getStudents(),
        apiService.getMentors()
      ]);
      
      // Handle both direct array and paginated response formats
      const studentsData = Array.isArray(studentsResponse) ? studentsResponse : (studentsResponse as any)?.results || [];
      const mentorsData = Array.isArray(mentorsResponse) ? mentorsResponse : (mentorsResponse as any)?.results || [];
      
      setStudents(studentsData);
      setMentors(mentorsData);
    } catch (error) {
      console.error('Error fetching users:', error);
      Alert.alert('Error', 'Failed to fetch users');
    }
  };

  const handleCreateAssignment = async () => {
    if (!selectedStudent || !selectedMentor) {
      Alert.alert('Error', 'Please select both student and mentor');
      return;
    }

    try {
      await apiService.post('/chat/mentor-assignments/', {
        student_id: selectedStudent.id,
        mentor_id: selectedMentor.id,
        is_active: true,
      });

      Alert.alert('Success', 'Mentor assignment created successfully');
      setShowModal(false);
      setShowUserModal(false);
      setSelectedStudent(null);
      setSelectedMentor(null);
      fetchAssignments();
    } catch (error) {
      console.error('Error creating assignment:', error);
      Alert.alert('Error', 'Failed to create assignment');
    }
  };

  const openUserSelection = (type: 'student' | 'mentor') => {
    setUserType(type);
    setSearchQuery('');
    setShowUserModal(true);
  };

  const selectUser = (user: User) => {
    if (userType === 'student') {
      setSelectedStudent(user);
    } else {
      setSelectedMentor(user);
    }
    setShowUserModal(false);
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
              await apiService.patch(`/chat/mentor-assignments/${assignmentId}/`, {
                is_active: false,
              });
              fetchAssignments();
              Alert.alert('Success', 'Assignment deactivated');
            } catch (error) {
              console.error('Error deactivating assignment:', error);
              Alert.alert('Error', 'Failed to deactivate assignment');
            }
          },
        },
      ]
    );
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  };

  const filteredUsers = (userType === 'student' ? students : mentors).filter(user => {
    const searchLower = searchQuery.toLowerCase();
    return (
      user.first_name.toLowerCase().includes(searchLower) ||
      user.last_name.toLowerCase().includes(searchLower) ||
      user.email.toLowerCase().includes(searchLower) ||
      (user.student_id && user.student_id.toLowerCase().includes(searchLower)) ||
      (user.mentor_id && user.mentor_id.toLowerCase().includes(searchLower))
    );
  });

  const renderAssignmentItem = ({ item }: { item: MentorAssignment }) => (
    <View style={styles.assignmentItem}>
      <View style={styles.assignmentInfo}>
        <View style={styles.userPair}>
          <View style={styles.studentInfo}>
            <Ionicons name="person" size={16} color={theme.colors.primary} />
            <Text style={styles.studentName}>
              {item.student_name}
            </Text>
            <Text style={styles.userEmail}>{item.student_email}</Text>
          </View>
          
          <Ionicons name="arrow-forward" size={16} color="#666" style={styles.arrow} />
          
          <View style={styles.mentorInfo}>
            <Ionicons name="school" size={16} color={theme.colors.secondary} />
            <Text style={styles.mentorName}>
              {item.mentor_name}
            </Text>
            <Text style={styles.userEmail}>{item.mentor_email}</Text>
          </View>
        </View>
        
        <Text style={styles.assignmentDate}>
          Assigned: {new Date(item.assigned_at).toLocaleDateString()}
        </Text>
        
        <View style={styles.statusContainer}>
          <View style={[styles.statusBadge, item.is_active ? styles.activeBadge : styles.inactiveBadge]}>
            <Text style={[styles.statusText, item.is_active ? styles.activeText : styles.inactiveText]}>
              {item.is_active ? 'Active' : 'Inactive'}
            </Text>
          </View>
        </View>
      </View>
      
      {item.is_active && (
        <TouchableOpacity
          style={styles.deactivateButton}
          onPress={() => deactivateAssignment(item.id)}
        >
          <Ionicons name="close-circle" size={24} color="#ff4444" />
        </TouchableOpacity>
      )}
    </View>
  );

  const renderUserItem = ({ item }: { item: User }) => (
    <TouchableOpacity
      style={styles.userItem}
      onPress={() => selectUser(item)}
    >
      <View style={styles.userInfo}>
        <Text style={styles.userName}>{item.first_name} {item.last_name}</Text>
        <Text style={styles.userEmail}>{item.email}</Text>
        <View style={styles.userDetails}>
          <Text style={styles.userRole}>{item.role}</Text>
          {item.student_id && <Text style={styles.userId}>ID: {item.student_id}</Text>}
          {item.mentor_id && <Text style={styles.userId}>ID: {item.mentor_id}</Text>}
          {item.level && <Text style={styles.userLevel}>Level: {item.level}</Text>}
          {item.class_name && <Text style={styles.userClass}>Class: {item.class_name}</Text>}
        </View>
      </View>
      <Ionicons 
        name="person-add" 
        size={24} 
        color={theme.colors.primary} 
      />
    </TouchableOpacity>
  );

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <Ionicons name="hourglass" size={40} color={theme.colors.primary} />
          <Text style={styles.loadingText}>Loading assignments...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Mentor Assignments</Text>
        <TouchableOpacity
          style={styles.addButton}
          onPress={() => setShowModal(true)}
        >
          <Ionicons name="add" size={24} color="white" />
        </TouchableOpacity>
      </View>

      <FlatList
        data={assignments}
        keyExtractor={(item) => item.id}
        renderItem={renderAssignmentItem}
        style={styles.list}
        contentContainerStyle={styles.listContent}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Ionicons name="people" size={60} color="#ccc" />
            <Text style={styles.emptyText}>No mentor assignments found</Text>
            <Text style={styles.emptySubtext}>Create your first assignment</Text>
          </View>
        }
      />

      {/* Create Assignment Modal */}
      <Modal
        visible={showModal}
        animationType="slide"
        presentationStyle="pageSheet"
      >
        <SafeAreaView style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Create Assignment</Text>
            <TouchableOpacity onPress={() => setShowModal(false)}>
              <Ionicons name="close" size={24} color="#666" />
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.modalContent}>
            {/* Student Selection */}
            <View style={styles.selectionSection}>
              <Text style={styles.sectionTitle}>Select Student</Text>
              {selectedStudent ? (
                <View style={styles.selectedUser}>
                  <Text style={styles.selectedUserName}>
                    {selectedStudent.first_name} {selectedStudent.last_name}
                  </Text>
                  <Text style={styles.selectedUserEmail}>{selectedStudent.email}</Text>
                  {selectedStudent.student_id && (
                    <Text style={styles.selectedUserId}>ID: {selectedStudent.student_id}</Text>
                  )}
                  <TouchableOpacity
                    style={styles.changeButton}
                    onPress={() => openUserSelection('student')}
                  >
                    <Text style={styles.changeButtonText}>Change</Text>
                  </TouchableOpacity>
                </View>
              ) : (
                <TouchableOpacity
                  style={styles.selectButton}
                  onPress={() => openUserSelection('student')}
                >
                  <Text style={styles.selectButtonText}>Select Student</Text>
                  <Ionicons name="person" size={20} color={theme.colors.primary} />
                </TouchableOpacity>
              )}
            </View>

            {/* Mentor Selection */}
            <View style={styles.selectionSection}>
              <Text style={styles.sectionTitle}>Select Mentor</Text>
              {selectedMentor ? (
                <View style={styles.selectedUser}>
                  <Text style={styles.selectedUserName}>
                    {selectedMentor.first_name} {selectedMentor.last_name}
                  </Text>
                  <Text style={styles.selectedUserEmail}>{selectedMentor.email}</Text>
                  {selectedMentor.mentor_id && (
                    <Text style={styles.selectedUserId}>ID: {selectedMentor.mentor_id}</Text>
                  )}
                  <TouchableOpacity
                    style={styles.changeButton}
                    onPress={() => openUserSelection('mentor')}
                  >
                    <Text style={styles.changeButtonText}>Change</Text>
                  </TouchableOpacity>
                </View>
              ) : (
                <TouchableOpacity
                  style={styles.selectButton}
                  onPress={() => openUserSelection('mentor')}
                >
                  <Text style={styles.selectButtonText}>Select Mentor</Text>
                  <Ionicons name="school" size={20} color={theme.colors.primary} />
                </TouchableOpacity>
              )}
            </View>
          </ScrollView>

          <View style={styles.modalFooter}>
            <TouchableOpacity
              style={[styles.footerButton, styles.cancelButton]}
              onPress={() => {
                setShowModal(false);
                setSelectedStudent(null);
                setSelectedMentor(null);
              }}
            >
              <Text style={styles.cancelButtonText}>Cancel</Text>
            </TouchableOpacity>
            
            <TouchableOpacity
              style={[
                styles.footerButton, 
                styles.createButton,
                (!selectedStudent || !selectedMentor) && styles.disabledButton
              ]}
              onPress={handleCreateAssignment}
              disabled={!selectedStudent || !selectedMentor}
            >
              <Text style={styles.createButtonText}>Create Assignment</Text>
            </TouchableOpacity>
          </View>
        </SafeAreaView>
      </Modal>

      {/* User Selection Modal */}
      <Modal
        visible={showUserModal}
        animationType="slide"
        presentationStyle="pageSheet"
      >
        <SafeAreaView style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>
              Select {userType === 'student' ? 'Student' : 'Mentor'}
            </Text>
            <TouchableOpacity onPress={() => setShowUserModal(false)}>
              <Ionicons name="close" size={24} color="#666" />
            </TouchableOpacity>
          </View>

          <View style={styles.searchContainer}>
            <Ionicons name="search" size={20} color="#666" style={styles.searchIcon} />
            <TextInput
              style={styles.searchInput}
              placeholder={`Search ${userType}s...`}
              value={searchQuery}
              onChangeText={setSearchQuery}
            />
          </View>

          <FlatList
            data={filteredUsers}
            keyExtractor={(item) => item.id}
            renderItem={renderUserItem}
            style={styles.userList}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.userListContent}
          />
        </SafeAreaView>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    backgroundColor: 'white',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
  },
  addButton: {
    backgroundColor: theme.colors.primary,
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: '#666',
  },
  list: {
    flex: 1,
  },
  listContent: {
    padding: 16,
  },
  assignmentItem: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    flexDirection: 'row',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  assignmentInfo: {
    flex: 1,
  },
  userPair: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  studentInfo: {
    flex: 1,
  },
  mentorInfo: {
    flex: 1,
  },
  arrow: {
    marginHorizontal: 8,
  },
  studentName: {
    fontSize: 16,
    fontWeight: '600',
    color: theme.colors.primary,
    marginLeft: 4,
  },
  mentorName: {
    fontSize: 16,
    fontWeight: '600',
    color: theme.colors.secondary,
    marginLeft: 4,
  },
  userEmail: {
    fontSize: 12,
    color: '#666',
    marginTop: 2,
  },
  assignmentDate: {
    fontSize: 12,
    color: '#888',
    marginBottom: 8,
  },
  statusContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  activeBadge: {
    backgroundColor: '#e8f5e8',
  },
  inactiveBadge: {
    backgroundColor: '#ffe8e8',
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
  },
  activeText: {
    color: '#2e7d32',
  },
  inactiveText: {
    color: '#d32f2f',
  },
  deactivateButton: {
    padding: 8,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingTop: 60,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#666',
    marginTop: 16,
  },
  emptySubtext: {
    fontSize: 14,
    color: '#999',
    marginTop: 4,
  },
  modalContainer: {
    flex: 1,
    backgroundColor: 'white',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
  },
  modalContent: {
    flex: 1,
    padding: 20,
  },
  selectionSection: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 12,
  },
  selectButton: {
    backgroundColor: '#f0f0f0',
    padding: 15,
    borderRadius: 8,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#ddd',
    borderStyle: 'dashed',
    gap: 8,
  },
  selectButtonText: {
    color: theme.colors.primary,
    fontWeight: '600',
  },
  selectedUser: {
    backgroundColor: '#f8f9fa',
    padding: 16,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: theme.colors.primary,
  },
  selectedUserName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  selectedUserEmail: {
    fontSize: 14,
    color: '#666',
    marginTop: 2,
  },
  selectedUserId: {
    fontSize: 12,
    color: '#888',
    marginTop: 2,
  },
  changeButton: {
    marginTop: 8,
    alignSelf: 'flex-start',
  },
  changeButtonText: {
    color: theme.colors.primary,
    fontSize: 14,
    fontWeight: '600',
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
    margin: 16,
    paddingHorizontal: 12,
    borderRadius: 8,
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    height: 40,
    fontSize: 16,
  },
  userList: {
    flex: 1,
  },
  userListContent: {
    padding: 16,
  },
  userItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    backgroundColor: 'white',
    borderRadius: 8,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  userInfo: {
    flex: 1,
  },
  userName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  userDetails: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: 4,
    gap: 8,
  },
  userRole: {
    fontSize: 12,
    color: theme.colors.primary,
    textTransform: 'capitalize',
    fontWeight: '500',
  },
  userId: {
    fontSize: 12,
    color: '#888',
  },
  userLevel: {
    fontSize: 12,
    color: '#888',
  },
  userClass: {
    fontSize: 12,
    color: '#888',
  },
  modalFooter: {
    flexDirection: 'row',
    padding: 20,
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
    gap: 12,
  },
  footerButton: {
    flex: 1,
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
  },
  cancelButton: {
    backgroundColor: '#f5f5f5',
  },
  cancelButtonText: {
    color: '#666',
    fontWeight: '600',
  },
  createButton: {
    backgroundColor: theme.colors.primary,
  },
  createButtonText: {
    color: 'white',
    fontWeight: '600',
  },
  disabledButton: {
    backgroundColor: '#ccc',
  },
});
