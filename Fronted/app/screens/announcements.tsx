import React from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useAuth } from '../../contexts/AuthContext';
import { theme } from '../../constants/theme';

export default function AnnouncementsScreen() {
  const { user } = useAuth();

  const announcements = [
    {
      id: '1',
      title: 'Parent-Teacher Meeting',
      content: 'Scheduled for next Friday at 2:00 PM in the main hall.',
      date: '2024-08-26',
      priority: 'high'
    },
    {
      id: '2',
      title: 'School Holiday Notice',
      content: 'School will be closed on Monday for national holiday.',
      date: '2024-08-25',
      priority: 'medium'
    }
  ];

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>
          {user?.role === 'parent' ? 'School Dashboard' : 'Announcements'}
        </Text>
        <Text style={styles.subtitle}>
          {user?.role === 'parent' ? 'Stay updated with school information' : 'Manage school announcements'}
        </Text>
      </View>

      <View style={styles.content}>
        {announcements.map((announcement) => (
          <View key={announcement.id} style={styles.announcementCard}>
            <View style={styles.announcementHeader}>
              <Text style={styles.announcementTitle}>{announcement.title}</Text>
              <Text style={styles.announcementDate}>{announcement.date}</Text>
            </View>
            <Text style={styles.announcementContent}>{announcement.content}</Text>
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
  announcementCard: {
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
  announcementHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  announcementTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: theme.colors.text,
    flex: 1,
  },
  announcementDate: {
    fontSize: 12,
    color: theme.colors.textSecondary,
  },
  announcementContent: {
    fontSize: 14,
    color: theme.colors.textSecondary,
    lineHeight: 20,
  },
});
