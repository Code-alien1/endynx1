import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useAuth } from '../../contexts/AuthContext';
import { theme } from '../../constants/theme';

export default function MentorAssignmentScreen() {
  const { user } = useAuth();

  const assignments = [
    {
      student: 'Alice Johnson',
      level: 1,
      class: '1A',
      mentor: 'John Doe (Level 3)',
      status: 'assigned'
    },
    {
      student: 'Bob Smith',
      level: 2,
      class: '2B',
      mentor: 'Unassigned',
      status: 'pending'
    }
  ];

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Mentor Assignment</Text>
        <Text style={styles.subtitle}>Assign mentors to students</Text>
      </View>

      <View style={styles.content}>
        {assignments.map((assignment, index) => (
          <View key={index} style={styles.assignmentCard}>
            <View style={styles.studentInfo}>
              <Text style={styles.studentName}>{assignment.student}</Text>
              <Text style={styles.studentDetails}>Level {assignment.level} - Class {assignment.class}</Text>
            </View>
            
            <View style={styles.mentorSection}>
              <Text style={styles.mentorLabel}>Mentor:</Text>
              <Text style={[
                styles.mentorName,
                { color: assignment.status === 'assigned' ? theme.colors.success : theme.colors.error }
              ]}>
                {assignment.mentor}
              </Text>
            </View>

            <TouchableOpacity style={styles.actionButton}>
              <Text style={styles.actionButtonText}>
                {assignment.status === 'assigned' ? 'Reassign' : 'Assign Mentor'}
              </Text>
            </TouchableOpacity>
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
    backgroundColor: theme.colors.info,
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
  assignmentCard: {
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
  studentInfo: {
    marginBottom: 10,
  },
  studentName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: theme.colors.text,
  },
  studentDetails: {
    fontSize: 14,
    color: theme.colors.textSecondary,
    marginTop: 2,
  },
  mentorSection: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 15,
    gap: 8,
  },
  mentorLabel: {
    fontSize: 14,
    color: theme.colors.text,
    fontWeight: '500',
  },
  mentorName: {
    fontSize: 14,
    fontWeight: 'bold',
  },
  actionButton: {
    backgroundColor: theme.colors.primary,
    padding: 10,
    borderRadius: 8,
    alignItems: 'center',
  },
  actionButtonText: {
    color: 'white',
    fontSize: 14,
    fontWeight: 'bold',
  },
});
