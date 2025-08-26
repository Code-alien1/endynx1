import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useAuth } from '../../contexts/AuthContext';
import { theme } from '../../constants/theme';

export default function MenteesScreen() {
  const { user } = useAuth();

  const mentees = [
    {
      id: '1',
      name: 'Alice Johnson',
      level: 1,
      class: '1A',
      progress: 85,
      lastContact: '2024-08-25'
    },
    {
      id: '2',
      name: 'Bob Smith',
      level: 2,
      class: '2B',
      progress: 78,
      lastContact: '2024-08-24'
    }
  ];

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>My Students</Text>
        <Text style={styles.subtitle}>Mentor your assigned students</Text>
      </View>

      <View style={styles.content}>
        {mentees.map((mentee) => (
          <TouchableOpacity key={mentee.id} style={styles.menteeCard}>
            <View style={styles.menteeInfo}>
              <Text style={styles.menteeName}>{mentee.name}</Text>
              <Text style={styles.menteeDetails}>Level {mentee.level} - Class {mentee.class}</Text>
              <Text style={styles.lastContact}>Last contact: {mentee.lastContact}</Text>
            </View>
            <View style={styles.progressSection}>
              <Text style={styles.progressText}>{mentee.progress}%</Text>
              <Text style={styles.progressLabel}>Progress</Text>
            </View>
          </TouchableOpacity>
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
    backgroundColor: theme.colors.success,
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
  menteeCard: {
    backgroundColor: 'white',
    padding: 15,
    borderRadius: 10,
    marginBottom: 15,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  menteeInfo: {
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
  lastContact: {
    fontSize: 12,
    color: theme.colors.textSecondary,
    marginTop: 4,
  },
  progressSection: {
    alignItems: 'center',
  },
  progressText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: theme.colors.primary,
  },
  progressLabel: {
    fontSize: 12,
    color: theme.colors.textSecondary,
  },
});
