import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  Alert,
  Modal,
  TextInput,
  ScrollView,
  RefreshControl,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { StyleSheet } from 'react-native';
import { useAuth } from '../../contexts/AuthContext';
import { theme } from '../../constants/theme';

interface User {
  id: string;
  username: string;
  email: string;
  first_name: string;
  last_name: string;
  role: string;
  student_class?: string;
}

export default function UsersTab() {
  const { user } = useAuth();
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [showUserModal, setShowUserModal] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);

  const [userForm, setUserForm] = useState({
    username: '',
    email: '',
    first_name: '',
    last_name: '',
    role: 'student',
    student_class: '',
    password: '',
  });

  const classes = ['BA1A', 'BA1B', 'BA2A', 'BA2B', 'BA3A', 'BA3B'];
  const roles = ['student', 'teacher', 'parent', 'administration'];

  useEffect(() => {
    loadUsers();
  }, []);

  const loadUsers = async () => {
    try {
      // Mock data for now
      setUsers([
        {
          id: '1',
          username: 'john_doe',
          email: 'john@example.com',
          first_name: 'John',
          last_name: 'Doe',
          role: 'student',
          student_class: 'BA1A',
        },
        {
          id: '2',
          username: 'jane_smith',
          email: 'jane@example.com',
          first_name: 'Jane',
          last_name: 'Smith',
          role: 'teacher',
        },
      ]);
    } catch (error) {
      console.error('Error loading users:', error);
    }
  };

  const handleCreateUser = async () => {
    try {
      Alert.alert('Success', 'User created successfully');
      setShowUserModal(false);
      resetUserForm();
      loadUsers();
    } catch (error) {
      Alert.alert('Error', 'Failed to create user');
    }
  };

  const handleUpdateUser = async () => {
    try {
      Alert.alert('Success', 'User updated successfully');
      setShowUserModal(false);
      resetUserForm();
      loadUsers();
    } catch (error) {
      Alert.alert('Error', 'Failed to update user');
    }
  };

  const handleDeleteUser = (userId: string) => {
    Alert.alert(
      'Delete User',
      'Are you sure you want to delete this user?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => {
            Alert.alert('Success', 'User deleted successfully');
            loadUsers();
          },
        },
      ]
    );
  };

  const resetUserForm = () => {
    setUserForm({
      username: '',
      email: '',
      first_name: '',
      last_name: '',
      role: 'student',
      student_class: '',
      password: '',
    });
  };

  const openUserModal = (user?: User) => {
    if (user) {
      setEditingUser(user);
      setUserForm({
        username: user.username,
        email: user.email,
        first_name: user.first_name,
        last_name: user.last_name,
        role: user.role,
        student_class: user.student_class || '',
        password: '',
      });
    } else {
      setEditingUser(null);
      resetUserForm();
    }
    setShowUserModal(true);
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadUsers();
    setRefreshing(false);
  };

  const getRoleColor = (role: string) => {
    switch (role) {
      case 'student': return theme.colors.primary;
      case 'teacher': return theme.colors.success;
      case 'parent': return theme.colors.warning;
      case 'administration': return theme.colors.error;
      default: return '#6B7280';
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.pageTitle}>User Management</Text>
        <TouchableOpacity style={styles.addButton} onPress={() => openUserModal()}>
          <Ionicons name="add" size={20} color="white" />
          <Text style={styles.addButtonText}>Add User</Text>
        </TouchableOpacity>
      </View>

      <FlatList
        data={users}
        keyExtractor={(item) => item.id}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        renderItem={({ item }) => (
          <View style={styles.userCard}>
            <View style={styles.userInfo}>
              <Text style={styles.userName}>
                {item.first_name} {item.last_name}
              </Text>
              <Text style={styles.userEmail}>{item.email}</Text>
              <View style={styles.userMeta}>
                <View style={[styles.roleBadge, { backgroundColor: getRoleColor(item.role) }]}>
                  <Text style={styles.roleText}>{item.role.toUpperCase()}</Text>
                </View>
                {item.student_class && (
                  <Text style={styles.classText}>Class: {item.student_class}</Text>
                )}
              </View>
            </View>
            <View style={styles.userActions}>
              <TouchableOpacity
                style={styles.editButton}
                onPress={() => openUserModal(item)}
              >
                <Ionicons name="pencil" size={16} color={theme.colors.primary} />
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.deleteButton}
                onPress={() => handleDeleteUser(item.id)}
              >
                <Ionicons name="trash" size={16} color={theme.colors.error} />
              </TouchableOpacity>
            </View>
          </View>
        )}
      />

      {/* User Modal */}
      <Modal visible={showUserModal} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <ScrollView>
              <Text style={styles.modalTitle}>
                {editingUser ? 'Edit User' : 'Add New User'}
              </Text>

              <Text style={styles.inputLabel}>Username</Text>
              <TextInput
                style={styles.input}
                value={userForm.username}
                onChangeText={(text) => setUserForm({ ...userForm, username: text })}
                placeholder="Enter username"
                placeholderTextColor="#6B7280"
              />

              <Text style={styles.inputLabel}>Email</Text>
              <TextInput
                style={styles.input}
                value={userForm.email}
                onChangeText={(text) => setUserForm({ ...userForm, email: text })}
                placeholder="Enter email"
                placeholderTextColor="#6B7280"
                keyboardType="email-address"
              />

              <Text style={styles.inputLabel}>First Name</Text>
              <TextInput
                style={styles.input}
                value={userForm.first_name}
                onChangeText={(text) => setUserForm({ ...userForm, first_name: text })}
                placeholder="Enter first name"
                placeholderTextColor="#6B7280"
              />

              <Text style={styles.inputLabel}>Last Name</Text>
              <TextInput
                style={styles.input}
                value={userForm.last_name}
                onChangeText={(text) => setUserForm({ ...userForm, last_name: text })}
                placeholder="Enter last name"
                placeholderTextColor="#6B7280"
              />

              <Text style={styles.inputLabel}>Role</Text>
              <View style={styles.roleSelector}>
                {roles.map((role) => (
                  <TouchableOpacity
                    key={role}
                    style={[
                      styles.roleOption,
                      userForm.role === role && styles.roleOptionActive,
                    ]}
                    onPress={() => setUserForm({ ...userForm, role })}
                  >
                    <Text
                      style={[
                        styles.roleOptionText,
                        userForm.role === role && styles.roleOptionTextActive,
                      ]}
                    >
                      {role}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              {userForm.role === 'student' && (
                <>
                  <Text style={styles.inputLabel}>Class</Text>
                  <View style={styles.classSelector}>
                    {classes.map((cls) => (
                      <TouchableOpacity
                        key={cls}
                        style={[
                          styles.classOption,
                          userForm.student_class === cls && styles.classOptionActive,
                        ]}
                        onPress={() => setUserForm({ ...userForm, student_class: cls })}
                      >
                        <Text
                          style={[
                            styles.classOptionText,
                            userForm.student_class === cls && styles.classOptionTextActive,
                          ]}
                        >
                          {cls}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </>
              )}

              {!editingUser && (
                <>
                  <Text style={styles.inputLabel}>Password</Text>
                  <TextInput
                    style={styles.input}
                    value={userForm.password}
                    onChangeText={(text) => setUserForm({ ...userForm, password: text })}
                    placeholder="Enter password"
                    placeholderTextColor="#6B7280"
                    secureTextEntry
                  />
                </>
              )}

              <View style={styles.modalActions}>
                <TouchableOpacity
                  style={[styles.modalButton, styles.cancelButton]}
                  onPress={() => setShowUserModal(false)}
                >
                  <Text style={styles.cancelButtonText}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.modalButton, styles.saveButton]}
                  onPress={editingUser ? handleUpdateUser : handleCreateUser}
                >
                  <Text style={styles.saveButtonText}>
                    {editingUser ? 'Update' : 'Create'}
                  </Text>
                </TouchableOpacity>
              </View>
            </ScrollView>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
    padding: 16,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  pageTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: theme.colors.text,
  },
  addButton: {
    backgroundColor: theme.colors.primary,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
  },
  addButtonText: {
    color: 'white',
    marginLeft: 8,
    fontWeight: '600',
  },
  userCard: {
    backgroundColor: theme.colors.card,
    padding: 16,
    marginBottom: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: theme.colors.border,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  userInfo: {
    flex: 1,
  },
  userName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: theme.colors.text,
    marginBottom: 4,
  },
  userEmail: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 8,
  },
  userMeta: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  roleBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    marginRight: 8,
  },
  roleText: {
    fontSize: 10,
    fontWeight: 'bold',
    color: 'white',
  },
  classText: {
    fontSize: 12,
    color: '#6B7280',
  },
  userActions: {
    flexDirection: 'row',
  },
  editButton: {
    padding: 8,
    marginRight: 8,
  },
  deleteButton: {
    padding: 8,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: theme.colors.card,
    borderRadius: 12,
    padding: 20,
    width: '90%',
    maxHeight: '80%',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: theme.colors.text,
    marginBottom: 20,
    textAlign: 'center',
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: theme.colors.text,
    marginBottom: 8,
    marginTop: 12,
  },
  input: {
    backgroundColor: theme.colors.background,
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    color: theme.colors.text,
  },
  roleSelector: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: 8,
  },
  roleOption: {
    backgroundColor: theme.colors.background,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 16,
    marginRight: 8,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  roleOptionActive: {
    backgroundColor: theme.colors.primary,
  },
  roleOptionText: {
    fontSize: 12,
    color: theme.colors.text,
    textTransform: 'capitalize',
  },
  roleOptionTextActive: {
    color: 'white',
  },
  classSelector: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: 8,
  },
  classOption: {
    backgroundColor: theme.colors.background,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 16,
    marginRight: 8,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  classOptionActive: {
    backgroundColor: theme.colors.primary,
  },
  classOptionText: {
    fontSize: 12,
    color: theme.colors.text,
  },
  classOptionTextActive: {
    color: 'white',
  },
  modalActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 24,
  },
  modalButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    marginHorizontal: 4,
  },
  cancelButton: {
    backgroundColor: '#6B7280',
  },
  saveButton: {
    backgroundColor: theme.colors.primary,
  },
  cancelButtonText: {
    color: 'white',
    textAlign: 'center',
    fontWeight: '600',
  },
  saveButtonText: {
    color: 'white',
    textAlign: 'center',
    fontWeight: '600',
  },
});
