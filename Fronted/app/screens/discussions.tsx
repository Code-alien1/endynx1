import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useAuth } from '../../contexts/AuthContext';
import { theme } from '../../constants/theme';

export default function DiscussionsScreen() {
  const { user } = useAuth();

  const discussions = [
    {
      id: '1',
      studentName: 'Alice Johnson',
      lastMessage: 'Thank you for the advice on math problems!',
      timestamp: '2024-08-26 10:30',
      unread: 2
    },
    {
      id: '2',
      studentName: 'Bob Smith',
      lastMessage: 'Can we schedule a meeting this week?',
      timestamp: '2024-08-25 15:45',
      unread: 0
    }
  ];

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Discussions</Text>
        <Text style={styles.subtitle}>Chat with your mentees</Text>
      </View>

      <View style={styles.content}>
        {discussions.map((discussion) => (
          <TouchableOpacity key={discussion.id} style={styles.discussionCard}>
            <View style={styles.discussionInfo}>
              <View style={styles.discussionHeader}>
                <Text style={styles.studentName}>{discussion.studentName}</Text>
                <Text style={styles.timestamp}>{discussion.timestamp}</Text>
              </View>
              <Text style={styles.lastMessage}>{discussion.lastMessage}</Text>
            </View>
            {discussion.unread > 0 && (
              <View style={styles.unreadBadge}>
                <Text style={styles.unreadText}>{discussion.unread}</Text>
              </View>
            )}
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
  discussionCard: {
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
    alignItems: 'center',
  },
  discussionInfo: {
    flex: 1,
  },
  discussionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 5,
  },
  studentName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: theme.colors.text,
  },
  timestamp: {
    fontSize: 12,
    color: theme.colors.textSecondary,
  },
  lastMessage: {
    fontSize: 14,
    color: theme.colors.textSecondary,
    lineHeight: 18,
  },
  unreadBadge: {
    backgroundColor: theme.colors.error,
    borderRadius: 12,
    minWidth: 24,
    height: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 10,
  },
  unreadText: {
    color: 'white',
    fontSize: 12,
    fontWeight: 'bold',
  },
});
