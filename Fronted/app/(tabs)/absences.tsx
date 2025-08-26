import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Image, Alert } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useAuth } from '../../contexts/AuthContext';
import { theme } from '../../constants/theme';

export default function AbsencesScreen() {
  const { user } = useAuth();
  const [absences, setAbsences] = useState([
    {
      id: '1',
      date: '2024-08-25',
      session: 'Morning Session',
      status: 'pending',
      reason: 'Medical appointment',
      hasJustification: true
    },
    {
      id: '2',
      date: '2024-08-23',
      session: 'Afternoon Session',
      status: 'approved',
      reason: 'Family emergency',
      hasJustification: true
    }
  ]);

  const handleJustifyAbsence = () => {
    Alert.alert(
      'Justify Absence',
      'This will open the absence justification form where you can upload a photo and explain your situation.',
      [{ text: 'OK' }]
    );
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'approved': return theme.colors.success;
      case 'rejected': return theme.colors.error;
      default: return theme.colors.warning;
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'approved': return 'check-circle';
      case 'rejected': return 'close-circle';
      default: return 'clock';
    }
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>My Absences</Text>
        <Text style={styles.subtitle}>Track and justify your absences</Text>
      </View>

      <TouchableOpacity style={styles.justifyButton} onPress={handleJustifyAbsence}>
        <MaterialCommunityIcons name="camera-plus" size={24} color="white" />
        <Text style={styles.justifyButtonText}>Justify New Absence</Text>
      </TouchableOpacity>

      <View style={styles.absencesList}>
        {absences.map((absence) => (
          <View key={absence.id} style={styles.absenceCard}>
            <View style={styles.absenceHeader}>
              <View>
                <Text style={styles.absenceDate}>{absence.date}</Text>
                <Text style={styles.absenceSession}>{absence.session}</Text>
              </View>
              <View style={[styles.statusBadge, { backgroundColor: getStatusColor(absence.status) }]}>
                <MaterialCommunityIcons 
                  name={getStatusIcon(absence.status)} 
                  size={16} 
                  color="white" 
                />
                <Text style={styles.statusText}>{absence.status.toUpperCase()}</Text>
              </View>
            </View>
            
            <Text style={styles.absenceReason}>{absence.reason}</Text>
            
            {absence.hasJustification && (
              <View style={styles.justificationIndicator}>
                <MaterialCommunityIcons name="file-document" size={16} color={theme.colors.primary} />
                <Text style={styles.justificationText}>Justification submitted</Text>
              </View>
            )}
          </View>
        ))}
      </View>

      <View style={styles.infoCard}>
        <MaterialCommunityIcons name="information" size={24} color={theme.colors.info} />
        <View style={styles.infoContent}>
          <Text style={styles.infoTitle}>How to justify an absence</Text>
          <Text style={styles.infoText}>
            • Take a clear photo of your justification document{'\n'}
            • Provide a detailed explanation{'\n'}
            • Submit within 48 hours of the absence
          </Text>
        </View>
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
  justifyButton: {
    backgroundColor: theme.colors.primary,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    margin: 20,
    padding: 15,
    borderRadius: 10,
    gap: 10,
  },
  justifyButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
  absencesList: {
    padding: 20,
    paddingTop: 0,
  },
  absenceCard: {
    backgroundColor: 'white',
    borderRadius: 10,
    padding: 15,
    marginBottom: 15,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  absenceHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 10,
  },
  absenceDate: {
    fontSize: 16,
    fontWeight: 'bold',
    color: theme.colors.text,
  },
  absenceSession: {
    fontSize: 14,
    color: theme.colors.textSecondary,
    marginTop: 2,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    gap: 4,
  },
  statusText: {
    color: 'white',
    fontSize: 10,
    fontWeight: 'bold',
  },
  absenceReason: {
    fontSize: 14,
    color: theme.colors.text,
    marginBottom: 10,
  },
  justificationIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  justificationText: {
    fontSize: 12,
    color: theme.colors.primary,
    fontStyle: 'italic',
  },
  infoCard: {
    backgroundColor: 'white',
    margin: 20,
    padding: 15,
    borderRadius: 10,
    flexDirection: 'row',
    gap: 15,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  infoContent: {
    flex: 1,
  },
  infoTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: theme.colors.text,
    marginBottom: 5,
  },
  infoText: {
    fontSize: 14,
    color: theme.colors.textSecondary,
    lineHeight: 20,
  },
});
