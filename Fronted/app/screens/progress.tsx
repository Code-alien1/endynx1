import React from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useAuth } from '../../contexts/AuthContext';
import { theme } from '../../constants/theme';

export default function ProgressScreen() {
  const { user } = useAuth();

  const progressData = [
    {
      studentName: 'Alice Johnson',
      overallProgress: 85,
      subjects: [
        { name: 'Mathematics', progress: 90 },
        { name: 'English', progress: 80 },
        { name: 'Science', progress: 85 }
      ],
      rating: 4.5
    },
    {
      studentName: 'Bob Smith',
      overallProgress: 78,
      subjects: [
        { name: 'Mathematics', progress: 75 },
        { name: 'English', progress: 82 },
        { name: 'Science', progress: 77 }
      ],
      rating: 4.2
    }
  ];

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Progress Tracking</Text>
        <Text style={styles.subtitle}>Monitor your mentees' progress</Text>
      </View>

      <View style={styles.content}>
        {progressData.map((student, index) => (
          <View key={index} style={styles.progressCard}>
            <View style={styles.studentHeader}>
              <Text style={styles.studentName}>{student.studentName}</Text>
              <View style={styles.ratingSection}>
                <MaterialCommunityIcons name="star" size={16} color={theme.colors.warning} />
                <Text style={styles.ratingText}>{student.rating}</Text>
              </View>
            </View>
            
            <View style={styles.overallProgress}>
              <Text style={styles.progressLabel}>Overall Progress</Text>
              <View style={styles.progressBar}>
                <View 
                  style={[
                    styles.progressFill, 
                    { width: `${student.overallProgress}%` }
                  ]} 
                />
              </View>
              <Text style={styles.progressText}>{student.overallProgress}%</Text>
            </View>

            <View style={styles.subjectsSection}>
              <Text style={styles.subjectsTitle}>Subject Progress</Text>
              {student.subjects.map((subject, subIndex) => (
                <View key={subIndex} style={styles.subjectRow}>
                  <Text style={styles.subjectName}>{subject.name}</Text>
                  <Text style={styles.subjectProgress}>{subject.progress}%</Text>
                </View>
              ))}
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
    backgroundColor: theme.colors.warning,
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
  progressCard: {
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
  studentHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 15,
  },
  studentName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: theme.colors.text,
  },
  ratingSection: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  ratingText: {
    fontSize: 14,
    fontWeight: 'bold',
    color: theme.colors.warning,
  },
  overallProgress: {
    marginBottom: 15,
  },
  progressLabel: {
    fontSize: 14,
    fontWeight: 'bold',
    color: theme.colors.text,
    marginBottom: 8,
  },
  progressBar: {
    height: 8,
    backgroundColor: '#f0f0f0',
    borderRadius: 4,
    overflow: 'hidden',
    marginBottom: 5,
  },
  progressFill: {
    height: '100%',
    backgroundColor: theme.colors.success,
  },
  progressText: {
    fontSize: 12,
    color: theme.colors.textSecondary,
    textAlign: 'right',
  },
  subjectsSection: {
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
    paddingTop: 15,
  },
  subjectsTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: theme.colors.text,
    marginBottom: 10,
  },
  subjectRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 5,
  },
  subjectName: {
    fontSize: 14,
    color: theme.colors.textSecondary,
  },
  subjectProgress: {
    fontSize: 14,
    fontWeight: 'bold',
    color: theme.colors.primary,
  },
});
