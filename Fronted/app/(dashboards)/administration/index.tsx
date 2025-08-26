import React from 'react';
import LogoutButton from '../../../components/LogoutButton';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useAuth } from '../../../contexts/AuthContext';
import { theme } from '../../../constants/theme';

export default function AdministrationDashboard() {
  const { user } = useAuth();

  const dashboardItems = [
    {
      title: 'User Management',
      icon: 'account-cog',
      description: 'Manage students, teachers, and staff',
      color: theme.colors.primary,
    },
    {
      title: 'School Analytics',
      icon: 'chart-bar',
      description: 'View comprehensive school statistics',
      color: theme.colors.success,
    },
    {
      title: 'Attendance Overview',
      icon: 'calendar-multiple-check',
      description: 'Monitor school-wide attendance',
      color: theme.colors.warning,
    },
    {
      title: 'Academic Reports',
      icon: 'file-chart',
      description: 'Generate academic performance reports',
      color: theme.colors.info,
    },
    {
      title: 'System Settings',
      icon: 'cog-outline',
      description: 'Configure system preferences',
      color: theme.colors.secondary,
    },
    {
      title: 'Announcements',
      icon: 'bullhorn',
      description: 'Manage school announcements',
      color: theme.colors.error,
    },
  ];

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.welcomeText}>Welcome, {user?.first_name}!</Text>
        <Text style={styles.roleText}>Administration Dashboard</Text>
        <Text style={styles.positionText}>Role: {user?.role || 'Administrator'}</Text>
        <Text style={styles.adminIdText}>ID: {user?.admin_id || 'Not set'}</Text>
      </View>

      <View style={styles.statsContainer}>
        <View style={styles.statCard}>
          <MaterialCommunityIcons name="account-group" size={24} color={theme.colors.primary} />
          <Text style={styles.statNumber}>1,245</Text>
          <Text style={styles.statLabel}>Total Users</Text>
        </View>
        <View style={styles.statCard}>
          <MaterialCommunityIcons name="school" size={24} color={theme.colors.success} />
          <Text style={styles.statNumber}>987</Text>
          <Text style={styles.statLabel}>Students</Text>
        </View>
        <View style={styles.statCard}>
          <MaterialCommunityIcons name="account-tie" size={24} color={theme.colors.warning} />
          <Text style={styles.statNumber}>45</Text>
          <Text style={styles.statLabel}>Teachers</Text>
        </View>
      </View>

      <View style={styles.overviewSection}>
        <Text style={styles.sectionTitle}>Today's Overview</Text>
        <View style={styles.overviewGrid}>
          <View style={styles.overviewCard}>
            <MaterialCommunityIcons name="calendar-check" size={32} color={theme.colors.success} />
            <Text style={styles.overviewNumber}>92%</Text>
            <Text style={styles.overviewLabel}>Attendance Rate</Text>
          </View>
          <View style={styles.overviewCard}>
            <MaterialCommunityIcons name="account-plus" size={32} color={theme.colors.primary} />
            <Text style={styles.overviewNumber}>12</Text>
            <Text style={styles.overviewLabel}>New Registrations</Text>
          </View>
          <View style={styles.overviewCard}>
            <MaterialCommunityIcons name="alert-circle" size={32} color={theme.colors.warning} />
            <Text style={styles.overviewNumber}>3</Text>
            <Text style={styles.overviewLabel}>Pending Issues</Text>
          </View>
          <View style={styles.overviewCard}>
            <MaterialCommunityIcons name="message-alert" size={32} color={theme.colors.info} />
            <Text style={styles.overviewNumber}>8</Text>
            <Text style={styles.overviewLabel}>New Messages</Text>
          </View>
        </View>
      </View>

      <View style={styles.recentActivity}>
        <Text style={styles.sectionTitle}>Recent Activity</Text>
        <View style={styles.activityCard}>
          <MaterialCommunityIcons name="account-plus" size={24} color={theme.colors.success} />
          <View style={styles.activityInfo}>
            <Text style={styles.activityTitle}>New teacher registered</Text>
            <Text style={styles.activityTime}>2 hours ago</Text>
          </View>
        </View>
        <View style={styles.activityCard}>
          <MaterialCommunityIcons name="file-document" size={24} color={theme.colors.info} />
          <View style={styles.activityInfo}>
            <Text style={styles.activityTitle}>Monthly report generated</Text>
            <Text style={styles.activityTime}>4 hours ago</Text>
          </View>
        </View>
        <View style={styles.activityCard}>
          <MaterialCommunityIcons name="cog" size={24} color={theme.colors.warning} />
          <View style={styles.activityInfo}>
            <Text style={styles.activityTitle}>System settings updated</Text>
            <Text style={styles.activityTime}>1 day ago</Text>
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
    backgroundColor: theme.colors.warning,
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
  positionText: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.8)',
  },
  adminIdText: {
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
  overviewSection: {
    padding: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: theme.colors.text,
    marginBottom: 15,
  },
  overviewGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    gap: 10,
  },
  overviewCard: {
    backgroundColor: 'white',
    padding: 15,
    borderRadius: 10,
    alignItems: 'center',
    width: '48%',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  overviewNumber: {
    fontSize: 18,
    fontWeight: 'bold',
    color: theme.colors.text,
    marginTop: 5,
  },
  overviewLabel: {
    fontSize: 12,
    color: theme.colors.textSecondary,
    marginTop: 2,
    textAlign: 'center',
  },
  recentActivity: {
    padding: 20,
    paddingTop: 0,
  },
  activityCard: {
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
  activityInfo: {
    marginLeft: 15,
    flex: 1,
  },
  activityTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: theme.colors.text,
  },
  activityTime: {
    fontSize: 12,
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
