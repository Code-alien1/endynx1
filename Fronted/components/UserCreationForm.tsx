import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ScrollView,
  Platform,
  Modal,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { COLORS } from '../constants/theme';
import apiService from '../services/api';

interface PredefinedClass {
  value: string;
  label: string;
  level: number;
}

interface UserCreationFormProps {
  visible: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export default function UserCreationForm({ visible, onClose, onSuccess }: UserCreationFormProps) {
  const [loading, setLoading] = useState(false);
  const [predefinedClasses, setPredefinedClasses] = useState<PredefinedClass[]>([]);
  const [showClassDropdown, setShowClassDropdown] = useState(false);
  const [showRoleDropdown, setShowRoleDropdown] = useState(false);
  
  const [formData, setFormData] = useState({
    email: '',
    username: '',
    password: '',
    password_confirm: '',
    first_name: '',
    last_name: '',
    phone_number: '',
    role: '',
    class_name: '',
    level: '',
    student_id: '',
    teacher_id: '',
    subject_taught: '',
    department: '',
  });

  const roles = [
    { value: 'student', label: 'Student' },
    { value: 'teacher', label: 'Teacher' },
    { value: 'parent', label: 'Parent' },
    { value: 'mentor', label: 'Mentor' },
    { value: 'administration', label: 'Administration' },
  ];

  useEffect(() => {
    if (visible) {
      loadPredefinedClasses();
    }
  }, [visible]);

  const loadPredefinedClasses = async () => {
    try {
      const response = await apiService.getPredefinedClasses();
      setPredefinedClasses(response.classes);
    } catch (error) {
      console.error('Error loading predefined classes:', error);
    }
  };

  const handleSubmit = async () => {
    if (!formData.email || !formData.password || !formData.first_name || !formData.last_name || !formData.role) {
      Alert.alert('Error', 'Please fill in all required fields');
      return;
    }

    if (formData.password !== formData.password_confirm) {
      Alert.alert('Error', 'Passwords do not match');
      return;
    }

    if (formData.role === 'student' && !formData.class_name) {
      Alert.alert('Error', 'Please select a class for the student');
      return;
    }

    setLoading(true);
    try {
      const userData = {
        ...formData,
        level: formData.class_name ? (formData.class_name.startsWith('BA1') ? 1 : 2) : undefined,
      };

      await apiService.register(userData);
      
      Alert.alert('Success', 'User created successfully!', [
        { text: 'OK', onPress: () => {
          resetForm();
          onSuccess();
          onClose();
        }}
      ]);
    } catch (error: any) {
      console.error('Error creating user:', error);
      const errorMessage = error.response?.data?.error || error.message || 'Failed to create user';
      Alert.alert('Error', errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setFormData({
      email: '',
      username: '',
      password: '',
      password_confirm: '',
      first_name: '',
      last_name: '',
      phone_number: '',
      role: '',
      class_name: '',
      level: '',
      student_id: '',
      teacher_id: '',
      subject_taught: '',
      department: '',
    });
    setShowClassDropdown(false);
    setShowRoleDropdown(false);
  };

  const handleClassSelect = (classItem: PredefinedClass) => {
    setFormData(prev => ({ 
      ...prev, 
      class_name: classItem.value,
      level: classItem.level.toString()
    }));
    setShowClassDropdown(false);
  };

  const handleRoleSelect = (role: { value: string; label: string }) => {
    setFormData(prev => ({ ...prev, role: role.value }));
    setShowRoleDropdown(false);
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <View style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.title}>Create New User</Text>
          <TouchableOpacity onPress={onClose}>
            <MaterialCommunityIcons name="close" size={24} color={COLORS.foreground} />
          </TouchableOpacity>
        </View>

        <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
          {/* Basic Information */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Basic Information</Text>
            
            <View style={styles.formGroup}>
              <Text style={styles.label}>Email *</Text>
              <TextInput
                style={styles.input}
                value={formData.email}
                onChangeText={(text) => setFormData(prev => ({ ...prev, email: text }))}
                placeholder="Enter email address"
                keyboardType="email-address"
                autoCapitalize="none"
              />
            </View>

            <View style={styles.formGroup}>
              <Text style={styles.label}>Username *</Text>
              <TextInput
                style={styles.input}
                value={formData.username}
                onChangeText={(text) => setFormData(prev => ({ ...prev, username: text }))}
                placeholder="Enter username"
                autoCapitalize="none"
              />
            </View>

            <View style={styles.formGroup}>
              <Text style={styles.label}>First Name *</Text>
              <TextInput
                style={styles.input}
                value={formData.first_name}
                onChangeText={(text) => setFormData(prev => ({ ...prev, first_name: text }))}
                placeholder="Enter first name"
              />
            </View>

            <View style={styles.formGroup}>
              <Text style={styles.label}>Last Name *</Text>
              <TextInput
                style={styles.input}
                value={formData.last_name}
                onChangeText={(text) => setFormData(prev => ({ ...prev, last_name: text }))}
                placeholder="Enter last name"
              />
            </View>

            <View style={styles.formGroup}>
              <Text style={styles.label}>Phone Number</Text>
              <TextInput
                style={styles.input}
                value={formData.phone_number}
                onChangeText={(text) => setFormData(prev => ({ ...prev, phone_number: text }))}
                placeholder="Enter phone number"
                keyboardType="phone-pad"
              />
            </View>
          </View>

          {/* Role Selection */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Role & Access</Text>
            
            <View style={styles.formGroup}>
              <Text style={styles.label}>Role *</Text>
              {Platform.OS === 'web' ? (
                <View>
                  <TouchableOpacity
                    style={styles.dropdown}
                    onPress={() => setShowRoleDropdown(!showRoleDropdown)}
                  >
                    <Text style={styles.dropdownText}>
                      {formData.role ? roles.find(r => r.value === formData.role)?.label : 'Select role'}
                    </Text>
                    <MaterialCommunityIcons name="chevron-down" size={20} color={COLORS['muted-foreground']} />
                  </TouchableOpacity>
                  {showRoleDropdown && (
                    <View style={styles.dropdownMenu}>
                      {roles.map((role) => (
                        <TouchableOpacity
                          key={role.value}
                          style={styles.dropdownItem}
                          onPress={() => handleRoleSelect(role)}
                        >
                          <Text style={styles.dropdownItemText}>{role.label}</Text>
                        </TouchableOpacity>
                      ))}
                    </View>
                  )}
                </View>
              ) : (
                <TouchableOpacity
                  style={styles.dropdown}
                  onPress={() => {
                    Alert.alert('Select Role', 'Choose a role:', [
                      ...roles.map(role => ({
                        text: role.label,
                        onPress: () => handleRoleSelect(role)
                      })),
                      { text: 'Cancel', style: 'cancel' }
                    ]);
                  }}
                >
                  <Text style={styles.dropdownText}>
                    {formData.role ? roles.find(r => r.value === formData.role)?.label : 'Select role'}
                  </Text>
                  <MaterialCommunityIcons name="chevron-down" size={20} color={COLORS['muted-foreground']} />
                </TouchableOpacity>
              )}
            </View>

            {/* Class Selection for Students */}
            {formData.role === 'student' && (
              <View style={styles.formGroup}>
                <Text style={styles.label}>Class *</Text>
                {Platform.OS === 'web' ? (
                  <View>
                    <TouchableOpacity
                      style={styles.dropdown}
                      onPress={() => setShowClassDropdown(!showClassDropdown)}
                    >
                      <Text style={styles.dropdownText}>
                        {formData.class_name || 'Select class'}
                      </Text>
                      <MaterialCommunityIcons name="chevron-down" size={20} color={COLORS['muted-foreground']} />
                    </TouchableOpacity>
                    {showClassDropdown && (
                      <View style={styles.dropdownMenu}>
                        {predefinedClasses.map((classItem) => (
                          <TouchableOpacity
                            key={classItem.value}
                            style={styles.dropdownItem}
                            onPress={() => handleClassSelect(classItem)}
                          >
                            <Text style={styles.dropdownItemText}>
                              {classItem.label} (Level {classItem.level})
                            </Text>
                          </TouchableOpacity>
                        ))}
                      </View>
                    )}
                  </View>
                ) : (
                  <TouchableOpacity
                    style={styles.dropdown}
                    onPress={() => {
                      Alert.alert('Select Class', 'Choose a class:', [
                        ...predefinedClasses.map(classItem => ({
                          text: `${classItem.label} (Level ${classItem.level})`,
                          onPress: () => handleClassSelect(classItem)
                        })),
                        { text: 'Cancel', style: 'cancel' }
                      ]);
                    }}
                  >
                    <Text style={styles.dropdownText}>
                      {formData.class_name || 'Select class'}
                    </Text>
                    <MaterialCommunityIcons name="chevron-down" size={20} color={COLORS['muted-foreground']} />
                  </TouchableOpacity>
                )}
              </View>
            )}

            {/* Student ID for Students */}
            {formData.role === 'student' && (
              <View style={styles.formGroup}>
                <Text style={styles.label}>Student ID</Text>
                <TextInput
                  style={styles.input}
                  value={formData.student_id}
                  onChangeText={(text) => setFormData(prev => ({ ...prev, student_id: text }))}
                  placeholder="Enter student ID"
                />
              </View>
            )}

            {/* Teacher fields */}
            {formData.role === 'teacher' && (
              <>
                <View style={styles.formGroup}>
                  <Text style={styles.label}>Teacher ID</Text>
                  <TextInput
                    style={styles.input}
                    value={formData.teacher_id}
                    onChangeText={(text) => setFormData(prev => ({ ...prev, teacher_id: text }))}
                    placeholder="Enter teacher ID"
                  />
                </View>
                <View style={styles.formGroup}>
                  <Text style={styles.label}>Subject Taught</Text>
                  <TextInput
                    style={styles.input}
                    value={formData.subject_taught}
                    onChangeText={(text) => setFormData(prev => ({ ...prev, subject_taught: text }))}
                    placeholder="Enter subject"
                  />
                </View>
                <View style={styles.formGroup}>
                  <Text style={styles.label}>Department</Text>
                  <TextInput
                    style={styles.input}
                    value={formData.department}
                    onChangeText={(text) => setFormData(prev => ({ ...prev, department: text }))}
                    placeholder="Enter department"
                  />
                </View>
              </>
            )}
          </View>

          {/* Password */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Security</Text>
            
            <View style={styles.formGroup}>
              <Text style={styles.label}>Password *</Text>
              <TextInput
                style={styles.input}
                value={formData.password}
                onChangeText={(text) => setFormData(prev => ({ ...prev, password: text }))}
                placeholder="Enter password"
                secureTextEntry
              />
            </View>

            <View style={styles.formGroup}>
              <Text style={styles.label}>Confirm Password *</Text>
              <TextInput
                style={styles.input}
                value={formData.password_confirm}
                onChangeText={(text) => setFormData(prev => ({ ...prev, password_confirm: text }))}
                placeholder="Confirm password"
                secureTextEntry
              />
            </View>
          </View>
        </ScrollView>

        <View style={styles.footer}>
          <TouchableOpacity
            style={styles.cancelButton}
            onPress={onClose}
          >
            <Text style={styles.cancelButtonText}>Cancel</Text>
          </TouchableOpacity>
          
          <TouchableOpacity
            style={[styles.submitButton, loading && styles.submitButtonDisabled]}
            onPress={handleSubmit}
            disabled={loading}
          >
            <Text style={styles.submitButtonText}>
              {loading ? 'Creating...' : 'Create User'}
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    color: COLORS.foreground,
  },
  content: {
    flex: 1,
    padding: 16,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: COLORS.foreground,
    marginBottom: 12,
  },
  formGroup: {
    marginBottom: 16,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.foreground,
    marginBottom: 6,
  },
  input: {
    backgroundColor: COLORS.card,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 16,
    color: COLORS.foreground,
  },
  dropdown: {
    backgroundColor: COLORS.card,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  dropdownText: {
    fontSize: 16,
    color: COLORS.foreground,
  },
  dropdownMenu: {
    backgroundColor: COLORS.card,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 8,
    marginTop: 4,
    maxHeight: 200,
  },
  dropdownItem: {
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  dropdownItemText: {
    fontSize: 16,
    color: COLORS.foreground,
  },
  footer: {
    flexDirection: 'row',
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
    gap: 12,
  },
  cancelButton: {
    flex: 1,
    backgroundColor: COLORS.muted,
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  cancelButtonText: {
    color: COLORS['muted-foreground'],
    fontSize: 16,
    fontWeight: '600',
  },
  submitButton: {
    flex: 1,
    backgroundColor: COLORS.primary,
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  submitButtonDisabled: {
    opacity: 0.6,
  },
  submitButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
});
