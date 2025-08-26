import React from 'react';
import LogoutButton from '../../../components/LogoutButton';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useAuth } from '../../../contexts/AuthContext';
import { theme } from '../../../constants/theme';

export default function StudentDashboard() {
  const { user } = useAuth();

  const dashboardItems = [
    {
      title: 'My Attendance',
      icon: 'calendar-check',
      description: 'View your attendance records',
      color: theme.colors.primary,
    },
    {
      title: 'My Grades',
      icon: 'school',
      description: 'Check your academic performance',
      color: theme.colors.success,
    },
    {
      title: 'Assignments',
      icon: 'file-document',
      description: 'View and submit assignments',
      color: theme.colors.warning,
    },
    {
      title: 'My Mentor',
      icon: 'account-supervisor',
      description: 'Connect with your mentor',
      color: theme.colors.info,
    },
    {
      title: 'Schedule',
      icon: 'timetable',
      description: 'View your class schedule',
      color: theme.colors.secondary,
    },
    {
      title: 'Announcements',
      icon: 'bullhorn',
      description: 'Latest school announcements',
      color: theme.colors.error,
    },
  ];

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.welcomeText}>Welcome back, {user?.first_name}!</Text>
        <Text style={styles.roleText}>Student Dashboard</Text>
        <Text style={styles.classText}>Class: {user?.class_name || 'Not assigned'}</Text>
        <Text style={styles.levelText}>Level: {user?.level || 'Not set'}</Text>
      </View>

      <View style={styles.statsContainer}>
        <View style={styles.statCard}>
          <MaterialCommunityIcons name="calendar-check" size={24} color={theme.colors.primary} />
          <Text style={styles.statNumber}>95%</Text>
          <Text style={styles.statLabel}>Attendance</Text>
        </View>
        <View style={styles.statCard}>
          <MaterialCommunityIcons name="trophy" size={24} color={theme.colors.success} />
          <Text style={styles.statNumber}>3.8</Text>
          <Text style={styles.statLabel}>GPA</Text>
        </View>
        <View style={styles.statCard}>
          <MaterialCommunityIcons name="file-document" size={24} color={theme.colors.warning} />
          <Text style={styles.statNumber}>5</Text>
          <Text style={styles.statLabel}>Pending</Text>
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
    backgroundColor: theme.colors.primary,
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
  classText: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.8)',
  },
  levelText: {
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
  quickActions: {
    padding: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: theme.colors.text,
    marginBottom: 15,
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
