import React from 'react';
import LogoutButton from '../../../components/LogoutButton';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useAuth } from '../../../contexts/AuthContext';
import { theme } from '../../../constants/theme';

export default function SuperAdminDashboard() {
  const { user } = useAuth();

  const dashboardItems = [
    {
      title: 'System Administration',
      icon: 'shield-crown',
      description: 'Full system control and configuration',
      color: theme.colors.primary,
    },
    {
      title: 'Global Analytics',
      icon: 'chart-timeline-variant',
      description: 'System-wide performance metrics',
      color: theme.colors.success,
    },
    {
      title: 'User Roles & Permissions',
      icon: 'account-key',
      description: 'Manage all user permissions',
      color: theme.colors.warning,
    },
    {
      title: 'Database Management',
      icon: 'database-cog',
      description: 'Database operations and maintenance',
      color: theme.colors.info,
    },
    {
      title: 'Security Center',
      icon: 'security',
      description: 'Monitor security and audit logs',
      color: theme.colors.secondary,
    },
    {
      title: 'System Backup',
      icon: 'backup-restore',
      description: 'Backup and restore operations',
      color: theme.colors.error,
    },
  ];

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.welcomeText}>Welcome, {user?.first_name}!</Text>
        <Text style={styles.roleText}>Super Admin Dashboard</Text>
        <Text style={styles.accessText}>Full System Access</Text>
        <Text style={styles.warningText}>⚠️ Use with caution</Text>
      </View>

      <View style={styles.statsContainer}>
        <View style={styles.statCard}>
          <MaterialCommunityIcons name="server" size={24} color={theme.colors.primary} />
          <Text style={styles.statNumber}>99.9%</Text>
          <Text style={styles.statLabel}>Uptime</Text>
        </View>
        <View style={styles.statCard}>
          <MaterialCommunityIcons name="database" size={24} color={theme.colors.success} />
          <Text style={styles.statNumber}>2.4GB</Text>
          <Text style={styles.statLabel}>DB Size</Text>
        </View>
        <View style={styles.statCard}>
          <MaterialCommunityIcons name="account-multiple" size={24} color={theme.colors.warning} />
          <Text style={styles.statNumber}>1,287</Text>
          <Text style={styles.statLabel}>Total Users</Text>
        </View>
      </View>

      <View style={styles.systemHealth}>
        <Text style={styles.sectionTitle}>System Health</Text>
        <View style={styles.healthGrid}>
          <View style={[styles.healthCard, { borderLeftColor: theme.colors.success }]}>
            <MaterialCommunityIcons name="check-circle" size={24} color={theme.colors.success} />
            <Text style={styles.healthStatus}>API Server</Text>
            <Text style={styles.healthValue}>Online</Text>
          </View>
          <View style={[styles.healthCard, { borderLeftColor: theme.colors.success }]}>
            <MaterialCommunityIcons name="check-circle" size={24} color={theme.colors.success} />
            <Text style={styles.healthStatus}>Database</Text>
            <Text style={styles.healthValue}>Healthy</Text>
          </View>
          <View style={[styles.healthCard, { borderLeftColor: theme.colors.warning }]}>
            <MaterialCommunityIcons name="alert-circle" size={24} color={theme.colors.warning} />
            <Text style={styles.healthStatus}>Storage</Text>
            <Text style={styles.healthValue}>85% Full</Text>
          </View>
          <View style={[styles.healthCard, { borderLeftColor: theme.colors.success }]}>
            <MaterialCommunityIcons name="check-circle" size={24} color={theme.colors.success} />
            <Text style={styles.healthStatus}>Backup</Text>
            <Text style={styles.healthValue}>Up to Date</Text>
          </View>
        </View>
      </View>

      <View style={styles.criticalActions}>
        <Text style={styles.sectionTitle}>Critical Actions</Text>
        <TouchableOpacity style={[styles.criticalCard, { backgroundColor: '#fff5f5', borderLeftColor: theme.colors.error }]}>
          <MaterialCommunityIcons name="database-refresh" size={24} color={theme.colors.error} />
          <View style={styles.criticalInfo}>
            <Text style={styles.criticalTitle}>Database Maintenance</Text>
            <Text style={styles.criticalDesc}>Schedule system maintenance window</Text>
          </View>
        </TouchableOpacity>
        <TouchableOpacity style={[styles.criticalCard, { backgroundColor: '#fff8e1', borderLeftColor: theme.colors.warning }]}>
          <MaterialCommunityIcons name="backup-restore" size={24} color={theme.colors.warning} />
          <View style={styles.criticalInfo}>
            <Text style={styles.criticalTitle}>System Backup</Text>
            <Text style={styles.criticalDesc}>Last backup: 6 hours ago</Text>
          </View>
        </TouchableOpacity>
      </View>

      <View style={styles.recentLogs}>
        <Text style={styles.sectionTitle}>Recent System Logs</Text>
        <View style={styles.logCard}>
          <MaterialCommunityIcons name="information" size={20} color={theme.colors.info} />
          <View style={styles.logInfo}>
            <Text style={styles.logMessage}>User authentication successful</Text>
            <Text style={styles.logTime}>2 minutes ago</Text>
          </View>
        </View>
        <View style={styles.logCard}>
          <MaterialCommunityIcons name="alert" size={20} color={theme.colors.warning} />
          <View style={styles.logInfo}>
            <Text style={styles.logMessage}>High memory usage detected</Text>
            <Text style={styles.logTime}>15 minutes ago</Text>
          </View>
        </View>
        <View style={styles.logCard}>
          <MaterialCommunityIcons name="check" size={20} color={theme.colors.success} />
          <View style={styles.logInfo}>
            <Text style={styles.logMessage}>Database backup completed</Text>
            <Text style={styles.logTime}>1 hour ago</Text>
          </View>
        </View>
      </View>

      <View style={styles.quickActions}>
        <Text style={styles.sectionTitle}>System Management</Text>
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
    backgroundColor: '#1a1a2e',
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
  accessText: {
    fontSize: 14,
    color: '#ffd700',
  },
  warningText: {
    fontSize: 12,
    color: '#ff6b6b',
    marginTop: 2,
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
  systemHealth: {
    padding: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: theme.colors.text,
    marginBottom: 15,
  },
  healthGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    gap: 10,
  },
  healthCard: {
    backgroundColor: 'white',
    padding: 15,
    borderRadius: 10,
    alignItems: 'center',
    width: '48%',
    borderLeftWidth: 4,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  healthStatus: {
    fontSize: 14,
    fontWeight: 'bold',
    color: theme.colors.text,
    marginTop: 5,
  },
  healthValue: {
    fontSize: 12,
    color: theme.colors.textSecondary,
    marginTop: 2,
  },
  criticalActions: {
    padding: 20,
    paddingTop: 0,
  },
  criticalCard: {
    padding: 15,
    borderRadius: 10,
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
    borderLeftWidth: 4,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  criticalInfo: {
    marginLeft: 15,
    flex: 1,
  },
  criticalTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: theme.colors.text,
  },
  criticalDesc: {
    fontSize: 14,
    color: theme.colors.textSecondary,
    marginTop: 2,
  },
  recentLogs: {
    padding: 20,
    paddingTop: 0,
  },
  logCard: {
    backgroundColor: 'white',
    padding: 12,
    borderRadius: 8,
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
    elevation: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 1,
  },
  logInfo: {
    marginLeft: 12,
    flex: 1,
  },
  logMessage: {
    fontSize: 14,
    color: theme.colors.text,
  },
  logTime: {
    fontSize: 12,
    color: theme.colors.textSecondary,
    marginTop: 1,
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
