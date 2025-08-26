import React, { useState } from 'react';
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
    icon: 'account-tie'
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
  },
  
];

interface RoleSelectorProps {
  selectedRole: string;
  onRoleSelect: (role: string) => void;
}

export default function RoleSelector({ selectedRole, onRoleSelect }: RoleSelectorProps) {
  const [open, setOpen] = useState(false);
  const current = roleOptions.find(r => r.value === selectedRole) || roleOptions[0];

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Select Your Role</Text>
      <Text style={styles.subtitle}>Choose the role that best describes you</Text>

      {/* Dropdown trigger */}
      <TouchableOpacity
        style={styles.dropdown}
        onPress={() => setOpen(o => !o)}
        activeOpacity={0.8}
      >
        <View style={styles.selectedRow}>
          <MaterialCommunityIcons
            name={current.icon as any}
            size={22}
            color={COLORS.primary}
          />
          <View style={{ flex: 1 }}>
            <Text style={styles.selectedLabel}>{current.label}</Text>
            <Text style={styles.selectedDescription} numberOfLines={1}>
              {current.description}
            </Text>
          </View>
          <MaterialCommunityIcons
            name={open ? 'chevron-up' : 'chevron-down'}
            size={22}
            color={COLORS['muted-foreground']}
          />
        </View>
      </TouchableOpacity>

      {/* Options list */}
      {open && (
        <View style={styles.optionsPanel}>
          {roleOptions.map((role) => {
            const isActive = selectedRole === role.value;
            return (
              <TouchableOpacity
                key={role.value}
                style={[styles.optionRow, isActive && styles.optionRowActive]}
                onPress={() => {
                  onRoleSelect(role.value);
                  setOpen(false);
                }}
              >
                <MaterialCommunityIcons
                  name={role.icon as any}
                  size={20}
                  color={isActive ? COLORS.primary : COLORS['muted-foreground']}
                />
                <View style={{ flex: 1 }}>
                  <Text style={[styles.optionLabel, isActive && styles.optionLabelActive]}>
                    {role.label}
                  </Text>
                  <Text
                    style={[styles.optionDescription, isActive && styles.optionDescriptionActive]}
                    numberOfLines={1}
                  >
                    {role.description}
                  </Text>
                </View>
                {isActive && (
                  <MaterialCommunityIcons name="check" size={18} color={COLORS.primary} />
                )}
              </TouchableOpacity>
            );
          })}
        </View>
      )}
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
  dropdown: {
    backgroundColor: COLORS.card,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  selectedRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  selectedLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.foreground,
  },
  selectedDescription: {
    fontSize: 12,
    color: COLORS['muted-foreground'],
  },
  optionsPanel: {
    marginTop: 8,
    backgroundColor: COLORS.card,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 12,
    overflow: 'hidden',
  },
  optionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
  },
  optionRowActive: {
    backgroundColor: 'rgba(46, 204, 113, 0.05)',
  },
  optionLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.foreground,
  },
  optionLabelActive: {
    color: COLORS.primary,
  },
  optionDescription: {
    fontSize: 12,
    color: COLORS['muted-foreground'],
  },
  optionDescriptionActive: {
    color: COLORS.foreground,
  },
});
