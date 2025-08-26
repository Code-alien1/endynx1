import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { COLORS } from '../constants/theme';

interface RoleOption {
  value: string;
  label: string;
  description: string;
  icon: string;
}

const roleOptions: RoleOption[] = [
  {
    value: 'student',
    label: 'Student',
    description: 'Access attendance, mentorship, and learning resources',
    icon: 'school'
  },
  {
    value: 'teacher',
    label: 'Teacher',
    description: 'Manage classes, track attendance, and guide students',
    icon: 'teach'
  },
  {
    value: 'mentor',
    label: 'Mentor',
    description: 'Provide guidance and support to assigned students',
    icon: 'account-supervisor'
  },
  {
    value: 'parent',
    label: 'Parent',
    description: 'Monitor your child\'s progress and attendance',
    icon: 'account-heart'
  },
  {
    value: 'administration',
    label: 'Administrator',
    description: 'Manage school operations and system settings',
    icon: 'shield-account'
  }
];

interface RoleSelectorProps {
  selectedRole: string;
  onRoleSelect: (role: string) => void;
}

export default function RoleSelector({ selectedRole, onRoleSelect }: RoleSelectorProps) {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Select Your Role</Text>
      <Text style={styles.subtitle}>Choose the role that best describes you</Text>
      
      <View style={styles.rolesContainer}>
        {roleOptions.map((role) => (
          <TouchableOpacity
            key={role.value}
            style={[
              styles.roleOption,
              selectedRole === role.value && styles.selectedRole
            ]}
            onPress={() => onRoleSelect(role.value)}
          >
            <View style={styles.roleHeader}>
              <MaterialCommunityIcons
                name={role.icon as any}
                size={24}
                color={selectedRole === role.value ? COLORS.primary : COLORS['muted-foreground']}
              />
              <Text style={[
                styles.roleLabel,
                selectedRole === role.value && styles.selectedRoleLabel
              ]}>
                {role.label}
              </Text>
            </View>
            <Text style={[
              styles.roleDescription,
              selectedRole === role.value && styles.selectedRoleDescription
            ]}>
              {role.description}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginVertical: 20,
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    color: COLORS.foreground,
    marginBottom: 8,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 14,
    color: COLORS['muted-foreground'],
    marginBottom: 20,
    textAlign: 'center',
  },
  rolesContainer: {
    gap: 12,
  },
  roleOption: {
    backgroundColor: COLORS.card,
    borderWidth: 2,
    borderColor: COLORS.border,
    borderRadius: 12,
    padding: 16,
  },
  selectedRole: {
    borderColor: COLORS.primary,
    backgroundColor: 'rgba(46, 204, 113, 0.05)',
  },
  roleHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  roleLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.foreground,
    marginLeft: 12,
  },
  selectedRoleLabel: {
    color: COLORS.primary,
  },
  roleDescription: {
    fontSize: 14,
    color: COLORS['muted-foreground'],
    lineHeight: 20,
  },
  selectedRoleDescription: {
    color: COLORS.foreground,
  },
});
