import { View, Text, ScrollView, TouchableOpacity, StyleSheet } from 'react-native'
import React from 'react'
import { useRouter } from 'expo-router'
import AppBackground from '../../components/AppBackground'
import { COLORS } from '../../constants/theme'
import { useAuth } from '../../contexts/AuthContext'
import { getRoleDashboardTitle, getRolePermissions } from '../../utils/roleRedirect'
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons'

export default function Dashboard() {
  const { user, logout } = useAuth()
  const router = useRouter()

  if (!user) {
    return (
      <AppBackground>
        <View style={styles.centerContainer}>
          <Text style={styles.errorText}>Please log in to continue</Text>
        </View>
      </AppBackground>
    )
  }

  const permissions = getRolePermissions(user.role)
  const dashboardTitle = getRoleDashboardTitle(user.role)

  const handleLogout = async () => {
    await logout()
    router.replace('/')
  }

  const renderRoleSpecificContent = () => {
    switch (user.role) {
      case 'student':
        return (
          <View style={styles.roleContent}>
            <Text style={styles.roleTitle}>Student Portal</Text>
            <View style={styles.quickActions}>
              <TouchableOpacity style={styles.actionCard} onPress={() => router.push('/(tabs)/attendance')}>
                <MaterialCommunityIcons name="calendar-check" size={32} color={COLORS.primary} />
                <Text style={styles.actionTitle}>My Attendance</Text>
                <Text style={styles.actionSubtitle}>View attendance records</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.actionCard} onPress={() => router.push('/(tabs)/mentor')}>
                <MaterialCommunityIcons name="account-supervisor" size={32} color={COLORS.primary} />
                <Text style={styles.actionTitle}>My Mentor</Text>
                <Text style={styles.actionSubtitle}>Connect with mentor</Text>
              </TouchableOpacity>
            </View>
          </View>
        )
      
      case 'teacher':
        return (
          <View style={styles.roleContent}>
            <Text style={styles.roleTitle}>Teacher Dashboard</Text>
            <View style={styles.quickActions}>
              <TouchableOpacity style={styles.actionCard} onPress={() => router.push('/(tabs)/attendance')}>
                <MaterialCommunityIcons name="clipboard-check" size={32} color={COLORS.primary} />
                <Text style={styles.actionTitle}>Manage Attendance</Text>
                <Text style={styles.actionSubtitle}>Track student attendance</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.actionCard}>
                <MaterialCommunityIcons name="account-group" size={32} color={COLORS.primary} />
                <Text style={styles.actionTitle}>My Students</Text>
                <Text style={styles.actionSubtitle}>View student list</Text>
              </TouchableOpacity>
            </View>
          </View>
        )
      
      case 'mentor':
        return (
          <View style={styles.roleContent}>
            <Text style={styles.roleTitle}>Mentor Hub</Text>
            <View style={styles.quickActions}>
              <TouchableOpacity style={styles.actionCard} onPress={() => router.push('/(tabs)/mentor')}>
                <MaterialCommunityIcons name="account-heart" size={32} color={COLORS.primary} />
                <Text style={styles.actionTitle}>My Mentees</Text>
                <Text style={styles.actionSubtitle}>Manage mentorship</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.actionCard}>
                <MaterialCommunityIcons name="chart-line" size={32} color={COLORS.primary} />
                <Text style={styles.actionTitle}>Progress Reports</Text>
                <Text style={styles.actionSubtitle}>Track student progress</Text>
              </TouchableOpacity>
            </View>
          </View>
        )
      
      case 'administration':
      case 'superadmin':
        return (
          <View style={styles.roleContent}>
            <Text style={styles.roleTitle}>Admin Panel</Text>
            <View style={styles.quickActions}>
              <TouchableOpacity style={styles.actionCard}>
                <MaterialCommunityIcons name="account-multiple" size={32} color={COLORS.primary} />
                <Text style={styles.actionTitle}>User Management</Text>
                <Text style={styles.actionSubtitle}>Manage all users</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.actionCard} onPress={() => router.push('/(tabs)/attendance')}>
                <MaterialCommunityIcons name="chart-bar" size={32} color={COLORS.primary} />
                <Text style={styles.actionTitle}>System Reports</Text>
                <Text style={styles.actionSubtitle}>View analytics</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.actionCard} onPress={() => router.push('/(tabs)/setting')}>
                <MaterialCommunityIcons name="cog" size={32} color={COLORS.primary} />
                <Text style={styles.actionTitle}>System Settings</Text>
                <Text style={styles.actionSubtitle}>Configure system</Text>
              </TouchableOpacity>
            </View>
          </View>
        )
      
      default:
        return (
          <View style={styles.roleContent}>
            <Text style={styles.roleTitle}>Welcome</Text>
            <Text style={styles.roleSubtitle}>Your role: {user.role}</Text>
          </View>
        )
    }
  }

  return (
    <AppBackground>
      <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.header}>
          <View>
            <Text style={styles.welcomeText}>Welcome back,</Text>
            <Text style={styles.userName}>{user.first_name} {user.last_name}</Text>
            <Text style={styles.userRole}>{dashboardTitle}</Text>
          </View>
          <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
            <MaterialCommunityIcons name="logout" size={24} color={COLORS.destructive} />
          </TouchableOpacity>
        </View>

        {/* Role-specific content */}
        {renderRoleSpecificContent()}

        {/* User Info Card */}
        <View style={styles.userInfoCard}>
          <Text style={styles.cardTitle}>Account Information</Text>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Email:</Text>
            <Text style={styles.infoValue}>{user.email}</Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Role:</Text>
            <Text style={styles.infoValue}>{user.role}</Text>
          </View>
          {user.student_id && (
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Student ID:</Text>
              <Text style={styles.infoValue}>{user.student_id}</Text>
            </View>
          )}
          {user.class_name && (
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Class:</Text>
              <Text style={styles.infoValue}>{user.class_name}</Text>
            </View>
          )}
        </View>
      </ScrollView>
    </AppBackground>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 30,
    paddingTop: 20,
  },
  welcomeText: {
    fontSize: 16,
    color: COLORS['muted-foreground'],
    marginBottom: 4,
  },
  userName: {
    fontSize: 24,
    fontWeight: 'bold',
    color: COLORS.foreground,
    marginBottom: 4,
  },
  userRole: {
    fontSize: 14,
    color: COLORS.primary,
    fontWeight: '600',
  },
  logoutButton: {
    padding: 8,
    borderRadius: 8,
    backgroundColor: 'rgba(239, 68, 68, 0.1)',
  },
  roleContent: {
    marginBottom: 30,
  },
  roleTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: COLORS.foreground,
    marginBottom: 16,
  },
  roleSubtitle: {
    fontSize: 16,
    color: COLORS['muted-foreground'],
  },
  quickActions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 16,
  },
  actionCard: {
    backgroundColor: COLORS.card,
    padding: 20,
    borderRadius: 12,
    flex: 1,
    minWidth: 150,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  actionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.foreground,
    marginTop: 12,
    marginBottom: 4,
    textAlign: 'center',
  },
  actionSubtitle: {
    fontSize: 12,
    color: COLORS['muted-foreground'],
    textAlign: 'center',
  },
  userInfoCard: {
    backgroundColor: COLORS.card,
    padding: 20,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: COLORS.border,
    marginBottom: 20,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: COLORS.foreground,
    marginBottom: 16,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  infoLabel: {
    fontSize: 14,
    color: COLORS['muted-foreground'],
    fontWeight: '500',
  },
  infoValue: {
    fontSize: 14,
    color: COLORS.foreground,
    fontWeight: '600',
  },
  errorText: {
    fontSize: 16,
    color: COLORS.destructive,
    textAlign: 'center',
  },
})