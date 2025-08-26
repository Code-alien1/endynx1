import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useAuth } from '../../contexts/AuthContext';
import { theme } from '../../constants/theme';

export default function AttendanceManagementScreen() {
  const { user } = useAuth();

  const attendanceData = [
    {
      class: 'Level 1A',
      present: 22,
      absent: 3,
      total: 25,
      percentage: 88
    },
    {
      class: 'Level 2B',
      present: 18,
      absent: 2,
      total: 20,
      percentage: 90
    }
  ];

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Attendance Management</Text>
        <Text style={styles.subtitle}>Monitor school-wide attendance</Text>
      </View>

      <View style={styles.content}>
        {attendanceData.map((classData, index) => (
          <View key={index} style={styles.classCard}>
            <View style={styles.classHeader}>
              <Text style={styles.className}>{classData.class}</Text>
              <View style={[styles.percentageBadge, { backgroundColor: classData.percentage >= 90 ? theme.colors.success : theme.colors.warning }]}>
                <Text style={styles.percentageText}>{classData.percentage}%</Text>
              </View>
            </View>
            
            <View style={styles.statsRow}>
              <View style={styles.statItem}>
                <MaterialCommunityIcons name="check-circle" size={20} color={theme.colors.success} />
                <Text style={styles.statNumber}>{classData.present}</Text>
                <Text style={styles.statLabel}>Present</Text>
              </View>
              <View style={styles.statItem}>
                <MaterialCommunityIcons name="close-circle" size={20} color={theme.colors.error} />
                <Text style={styles.statNumber}>{classData.absent}</Text>
                <Text style={styles.statLabel}>Absent</Text>
              </View>
              <View style={styles.statItem}>
                <MaterialCommunityIcons name="account-group" size={20} color={theme.colors.info} />
                <Text style={styles.statNumber}>{classData.total}</Text>
                <Text style={styles.statLabel}>Total</Text>
              </View>
            </View>
          </View>
        ))}
      </View>
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
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: 'white',
    marginBottom: 5,
  },
  subtitle: {
    fontSize: 16,
    color: 'rgba(255,255,255,0.9)',
  },
  content: {
    padding: 20,
  },
  classCard: {
    backgroundColor: 'white',
    padding: 15,
    borderRadius: 10,
    marginBottom: 15,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  classHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 15,
  },
  className: {
    fontSize: 18,
    fontWeight: 'bold',
    color: theme.colors.text,
  },
  percentageBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 15,
  },
  percentageText: {
    color: 'white',
    fontSize: 14,
    fontWeight: 'bold',
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  statItem: {
    alignItems: 'center',
    gap: 5,
  },
  statNumber: {
    fontSize: 18,
    fontWeight: 'bold',
    color: theme.colors.text,
  },
  statLabel: {
    fontSize: 12,
    color: theme.colors.textSecondary,
  },
});
