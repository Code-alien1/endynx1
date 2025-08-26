import React from 'react';
import LogoutButton from '../../../components/LogoutButton';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useAuth } from '../../../contexts/AuthContext';
import { theme } from '../../../constants/theme';

export default function MentorDashboard() {
  const { user } = useAuth();

  const dashboardItems = [
    {
      title: 'My Mentees',
      icon: 'account-supervisor-circle',
      description: 'Manage your assigned mentees',
      color: theme.colors.primary,
    },
    {
      title: 'Mentoring Sessions',
      icon: 'calendar-clock',
      description: 'Schedule and track sessions',
      color: theme.colors.success,
    },
    {
      title: 'Progress Tracking',
      icon: 'chart-line',
      description: 'Monitor mentee progress',
      color: theme.colors.warning,
    },
    {
      title: 'Resources',
      icon: 'book-open-variant',
      description: 'Mentoring resources and guides',
      color: theme.colors.info,
    },
    {
      title: 'Feedback & Reports',
      icon: 'clipboard-text',
      description: 'Submit mentee evaluations',
      color: theme.colors.secondary,
    },
    {
      title: 'Mentor Community',
      icon: 'account-group',
      description: 'Connect with other mentors',
      color: theme.colors.error,
    },
  ];

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.welcomeText}>Welcome, {user?.first_name}!</Text>
        <Text style={styles.roleText}>Mentor Dashboard</Text>
        <Text style={styles.levelText}>Level: {user?.level || 'Not set'}</Text>
        <Text style={styles.ratingText}>Rating: {user?.rating || '0.0'}/5.0</Text>
      </View>

      <View style={styles.statsContainer}>
        <View style={styles.statCard}>
          <MaterialCommunityIcons name="account-supervisor" size={24} color={theme.colors.primary} />
          <Text style={styles.statNumber}>8</Text>
          <Text style={styles.statLabel}>Mentees</Text>
        </View>
        <View style={styles.statCard}>
          <MaterialCommunityIcons name="calendar-check" size={24} color={theme.colors.success} />
          <Text style={styles.statNumber}>24</Text>
          <Text style={styles.statLabel}>Sessions</Text>
        </View>
        <View style={styles.statCard}>
          <MaterialCommunityIcons name="star" size={24} color={theme.colors.warning} />
          <Text style={styles.statNumber}>4.8</Text>
          <Text style={styles.statLabel}>Rating</Text>
        </View>
      </View>

      <View style={styles.menteesSection}>
        <Text style={styles.sectionTitle}>My Mentees</Text>
        <View style={styles.menteeCard}>
          <MaterialCommunityIcons name="account-circle" size={40} color={theme.colors.primary} />
          <View style={styles.menteeInfo}>
            <Text style={styles.menteeName}>Alice Johnson</Text>
            <Text style={styles.menteeDetails}>Level 1 • Class A</Text>
            <Text style={styles.menteeStatus}>Last session: 2 days ago</Text>
          </View>
          <MaterialCommunityIcons name="chevron-right" size={24} color={theme.colors.textSecondary} />
        </View>
        <View style={styles.menteeCard}>
          <MaterialCommunityIcons name="account-circle" size={40} color={theme.colors.secondary} />
          <View style={styles.menteeInfo}>
            <Text style={styles.menteeName}>Bob Smith</Text>
            <Text style={styles.menteeDetails}>Level 2 • Class B</Text>
            <Text style={styles.menteeStatus}>Next session: Tomorrow</Text>
          </View>
          <MaterialCommunityIcons name="chevron-right" size={24} color={theme.colors.textSecondary} />
        </View>
        <TouchableOpacity style={styles.viewAllButton}>
          <Text style={styles.viewAllText}>View All Mentees</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.upcomingSection}>
        <Text style={styles.sectionTitle}>Upcoming Sessions</Text>
        <View style={styles.sessionCard}>
          <View style={styles.sessionTime}>
            <Text style={styles.sessionDate}>Today</Text>
            <Text style={styles.sessionHour}>3:00 PM</Text>
          </View>
          <View style={styles.sessionInfo}>
            <Text style={styles.sessionTitle}>1-on-1 with Alice Johnson</Text>
            <Text style={styles.sessionType}>Academic Support</Text>
          </View>
        </View>
        <View style={styles.sessionCard}>
          <View style={styles.sessionTime}>
            <Text style={styles.sessionDate}>Tomorrow</Text>
            <Text style={styles.sessionHour}>2:00 PM</Text>
          </View>
          <View style={styles.sessionInfo}>
            <Text style={styles.sessionTitle}>Group Session</Text>
            <Text style={styles.sessionType}>Study Skills Workshop</Text>
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
    backgroundColor: theme.colors.info,
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
  levelText: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.8)',
  },
  ratingText: {
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
  menteesSection: {
    padding: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: theme.colors.text,
    marginBottom: 15,
  },
  menteeCard: {
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
  menteeInfo: {
    marginLeft: 15,
    flex: 1,
  },
  menteeName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: theme.colors.text,
  },
  menteeDetails: {
    fontSize: 14,
    color: theme.colors.textSecondary,
    marginTop: 2,
  },
  menteeStatus: {
    fontSize: 12,
    color: theme.colors.success,
    marginTop: 2,
  },
  viewAllButton: {
    backgroundColor: theme.colors.primary,
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 10,
  },
  viewAllText: {
    color: 'white',
    fontWeight: 'bold',
  },
  upcomingSection: {
    padding: 20,
    paddingTop: 0,
  },
  sessionCard: {
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
  sessionTime: {
    alignItems: 'center',
    marginRight: 15,
  },
  sessionDate: {
    fontSize: 12,
    color: theme.colors.textSecondary,
  },
  sessionHour: {
    fontSize: 16,
    fontWeight: 'bold',
    color: theme.colors.primary,
  },
  sessionInfo: {
    flex: 1,
  },
  sessionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: theme.colors.text,
  },
  sessionType: {
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
