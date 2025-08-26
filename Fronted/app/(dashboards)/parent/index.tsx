import React from 'react';
import LogoutButton from '../../../components/LogoutButton';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useAuth } from '../../../contexts/AuthContext';
import { theme } from '../../../constants/theme';

export default function ParentDashboard() {
  const { user } = useAuth();

  const dashboardItems = [
    {
      title: 'Children\'s Attendance',
      icon: 'calendar-account',
      description: 'Monitor your children\'s attendance',
      color: theme.colors.primary,
    },
    {
      title: 'Academic Progress',
      icon: 'chart-line',
      description: 'Track academic performance',
      color: theme.colors.success,
    },
    {
      title: 'Teacher Communications',
      icon: 'message-text',
      description: 'Messages from teachers',
      color: theme.colors.info,
    },
    {
      title: 'School Events',
      icon: 'calendar-star',
      description: 'Upcoming school events',
      color: theme.colors.warning,
    },
    {
      title: 'Fee Payments',
      icon: 'credit-card',
      description: 'Manage school fees',
      color: theme.colors.secondary,
    },
    {
      title: 'Reports',
      icon: 'file-chart',
      description: 'Download progress reports',
      color: theme.colors.error,
    },
  ];

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.welcomeText}>Welcome, {user?.first_name}!</Text>
        <Text style={styles.roleText}>Parent Dashboard</Text>
        <Text style={styles.childrenText}>Managing children's education</Text>
      </View>

      <View style={styles.statsContainer}>
        <View style={styles.statCard}>
          <MaterialCommunityIcons name="account-multiple" size={24} color={theme.colors.primary} />
          <Text style={styles.statNumber}>2</Text>
          <Text style={styles.statLabel}>Children</Text>
        </View>
        <View style={styles.statCard}>
          <MaterialCommunityIcons name="calendar-check" size={24} color={theme.colors.success} />
          <Text style={styles.statNumber}>92%</Text>
          <Text style={styles.statLabel}>Avg Attendance</Text>
        </View>
        <View style={styles.statCard}>
          <MaterialCommunityIcons name="message-alert" size={24} color={theme.colors.warning} />
          <Text style={styles.statNumber}>3</Text>
          <Text style={styles.statLabel}>New Messages</Text>
        </View>
      </View>

      <View style={styles.childrenSection}>
        <Text style={styles.sectionTitle}>My Children</Text>
        <View style={styles.childCard}>
          <MaterialCommunityIcons name="account" size={40} color={theme.colors.primary} />
          <View style={styles.childInfo}>
            <Text style={styles.childName}>John Doe</Text>
            <Text style={styles.childDetails}>Level 2 • Class A</Text>
            <Text style={styles.childStatus}>Attendance: 95% • GPA: 3.7</Text>
          </View>
        </View>
        <View style={styles.childCard}>
          <MaterialCommunityIcons name="account" size={40} color={theme.colors.secondary} />
          <View style={styles.childInfo}>
            <Text style={styles.childName}>Jane Doe</Text>
            <Text style={styles.childDetails}>Level 1 • Class B</Text>
            <Text style={styles.childStatus}>Attendance: 89% • GPA: 3.9</Text>
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
    backgroundColor: theme.colors.secondary,
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
  childrenText: {
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
  childrenSection: {
    padding: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: theme.colors.text,
    marginBottom: 15,
  },
  childCard: {
    backgroundColor: 'white',
    padding: 15,
    borderRadius: 10,
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  childInfo: {
    marginLeft: 15,
    flex: 1,
  },
  childName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: theme.colors.text,
  },
  childDetails: {
    fontSize: 14,
    color: theme.colors.textSecondary,
    marginTop: 2,
  },
  childStatus: {
    fontSize: 12,
    color: theme.colors.success,
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
