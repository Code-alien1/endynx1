import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useAuth } from '../../../contexts/AuthContext';
import { theme } from '../../../constants/theme';
import LogoutButton from '../../../components/LogoutButton';

export default function TeacherDashboard() {
  const { user } = useAuth();

  const dashboardItems = [
    {
      title: 'My Classes',
      icon: 'google-classroom',
      description: 'Manage your classes and students',
      color: theme.colors.primary,
    },
    {
      title: 'Attendance Management',
      icon: 'clipboard-check',
      description: 'Mark and track student attendance',
      color: theme.colors.success,
    },
    {
      title: 'Grade Students',
      icon: 'school',
      description: 'Enter and manage grades',
      color: theme.colors.warning,
    },
    {
      title: 'Assignments',
      icon: 'file-document-multiple',
      description: 'Create and manage assignments',
      color: theme.colors.info,
    },
    {
      title: 'Parent Communication',
      icon: 'message-text-outline',
      description: 'Communicate with parents',
      color: theme.colors.secondary,
    },
    {
      title: 'Reports',
      icon: 'chart-box',
      description: 'Generate class reports',
      color: theme.colors.error,
    },
  ];

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.welcomeText}>Welcome, {user?.first_name}!</Text>
        <Text style={styles.roleText}>Teacher Dashboard</Text>
        <Text style={styles.subjectText}>Subject: {user?.subject_taught || 'Not assigned'}</Text>
        <Text style={styles.departmentText}>Department: {user?.department || 'Not set'}</Text>
      </View>

      <View style={styles.statsContainer}>
        <View style={styles.statCard}>
          <MaterialCommunityIcons name="account-group" size={24} color={theme.colors.primary} />
          <Text style={styles.statNumber}>45</Text>
          <Text style={styles.statLabel}>Students</Text>
        </View>
        <View style={styles.statCard}>
          <MaterialCommunityIcons name="google-classroom" size={24} color={theme.colors.success} />
          <Text style={styles.statNumber}>3</Text>
          <Text style={styles.statLabel}>Classes</Text>
        </View>
        <View style={styles.statCard}>
          <MaterialCommunityIcons name="file-document" size={24} color={theme.colors.warning} />
          <Text style={styles.statNumber}>12</Text>
          <Text style={styles.statLabel}>Assignments</Text>
        </View>
      </View>

      <View style={styles.todaySection}>
        <Text style={styles.sectionTitle}>Today's Schedule</Text>
        <View style={styles.scheduleCard}>
          <View style={styles.timeSlot}>
            <Text style={styles.timeText}>9:00 AM</Text>
            <View style={styles.classInfo}>
              <Text style={styles.className}>Mathematics - Level 2A</Text>
              <Text style={styles.classRoom}>Room 101 • 25 students</Text>
            </View>
          </View>
          <View style={styles.timeSlot}>
            <Text style={styles.timeText}>11:00 AM</Text>
            <View style={styles.classInfo}>
              <Text style={styles.className}>Mathematics - Level 1B</Text>
              <Text style={styles.classRoom}>Room 103 • 20 students</Text>
            </View>
          </View>
          <View style={styles.timeSlot}>
            <Text style={styles.timeText}>2:00 PM</Text>
            <View style={styles.classInfo}>
              <Text style={styles.className}>Advanced Mathematics</Text>
              <Text style={styles.classRoom}>Room 105 • 15 students</Text>
            </View>
          </View>
        </View>
      </View>

      <View style={styles.quickActions}>
        <Text style={styles.sectionTitle}>Quick Actions</Text>
        <View style={styles.actionsGrid}>
          {dashboardItems.map((item, index) => (
            <TouchableOpacity key={index} style={[styles.actionCard, { borderLeftColor: item.color }]}>
              <MaterialCommunityIcons name={item.icon as any} size={32} color={item.color} />
              <Text style={styles.actionTitle}>{item.title}</Text>
              <Text style={styles.actionDescription}>{item.description}</Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {/* Logout Button */}
      <LogoutButton />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  header: {
    backgroundColor: theme.colors.success,
    padding: 20,
    paddingTop: 60,
  },
  welcomeText: {
    fontSize: 24,
    fontWeight: 'bold',
    color: 'white',
    marginBottom: 5,
  },
  roleText: {
    fontSize: 16,
    color: 'rgba(255,255,255,0.9)',
    marginBottom: 5,
  },
  subjectText: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.8)',
  },
  departmentText: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.8)',
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    padding: 20,
    backgroundColor: 'white',
    marginTop: -20,
    marginHorizontal: 20,
    borderRadius: 10,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  statCard: {
    alignItems: 'center',
  },
  statNumber: {
    fontSize: 20,
    fontWeight: 'bold',
    color: theme.colors.text,
    marginTop: 5,
  },
  statLabel: {
    fontSize: 12,
    color: theme.colors.textSecondary,
    marginTop: 2,
  },
  todaySection: {
    padding: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: theme.colors.text,
    marginBottom: 15,
  },
  scheduleCard: {
    backgroundColor: 'white',
    borderRadius: 10,
    padding: 15,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  timeSlot: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  timeText: {
    fontSize: 14,
    fontWeight: 'bold',
    color: theme.colors.primary,
    width: 80,
  },
  classInfo: {
    flex: 1,
    marginLeft: 15,
  },
  className: {
    fontSize: 16,
    fontWeight: 'bold',
    color: theme.colors.text,
  },
  classRoom: {
    fontSize: 14,
    color: theme.colors.textSecondary,
    marginTop: 2,
  },
  quickActions: {
    padding: 20,
    paddingTop: 0,
  },
  actionsGrid: {
    gap: 15,
  },
  actionCard: {
    backgroundColor: 'white',
    padding: 20,
    borderRadius: 10,
    borderLeftWidth: 4,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  actionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: theme.colors.text,
    marginTop: 10,
  },
  actionDescription: {
    fontSize: 14,
    color: theme.colors.textSecondary,
    marginTop: 5,
  },
});
