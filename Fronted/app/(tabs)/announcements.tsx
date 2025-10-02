import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  Alert,
  Modal,
  TextInput,
  ScrollView,
  RefreshControl,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { StyleSheet } from 'react-native';
import { useAuth } from '../../contexts/AuthContext';
import { theme } from '../../constants/theme';
import { apiService } from '../../services/api';

interface Announcement {
  id: string;
  title: string;
  content: string;
  created_by: {
    id: string;
    username: string;
    first_name: string;
    last_name: string;
  };
  created_at: string;
  is_active: boolean;
}

export default function AnnouncementsTab() {
  const { user } = useAuth();
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const [showAnnouncementModal, setShowAnnouncementModal] = useState(false);
  
  // Show create button only for administration role
  const canCreateAnnouncement = user?.role === 'administration';

  const [announcementForm, setAnnouncementForm] = useState({
    title: '',
    content: '',
  });

  useEffect(() => {
    loadAnnouncements();
    
    // Set up real-time polling for parents
    let interval: ReturnType<typeof setInterval>;
    if (user?.role === 'parent') {
      interval = setInterval(() => {
        loadAnnouncements();
      }, 30000); // Refresh every 30 seconds for parents
    }
    
    return () => {
      if (interval) {
        clearInterval(interval);
      }
    };
  }, [user?.role]);

  const loadAnnouncements = async () => {
    try {
      const response = await apiService.getAllAnnouncements();
      setAnnouncements(response);
    } catch (error) {
      console.error('Error loading announcements:', error);
      // Fallback to mock data for development
      setAnnouncements([
        {
          id: '1',
          title: 'School Holiday',
          content: 'School will be closed next week for holidays.',
          created_by: { id: '1', username: 'admin', first_name: 'Admin', last_name: 'User' },
          created_at: '2024-01-15T10:00:00Z',
          is_active: true,
        },
        {
          id: '2',
          title: 'Parent-Teacher Meeting',
          content: 'Parent-teacher meetings will be held on Friday from 2-5 PM.',
          created_by: { id: '1', username: 'admin', first_name: 'Admin', last_name: 'User' },
          created_at: '2024-01-14T09:00:00Z',
          is_active: true,
        },
      ]);
    }
  };

  const handleCreateAnnouncement = async () => {
    try {
      const newAnnouncement = await apiService.createAnnouncement(announcementForm);
      
      // Add the new announcement to the current list immediately
      setAnnouncements(prev => [newAnnouncement, ...prev]);
      
      // Close modal and reset form
      setShowAnnouncementModal(false);
      resetAnnouncementForm();
      
      // Show success message without alert to prevent navigation issues
      console.log('Announcement created successfully');
      
      // Refresh the list to ensure consistency with backend
      await loadAnnouncements();
    } catch (error) {
      console.error('Error creating announcement:', error);
      Alert.alert('Error', 'Failed to create announcement');
    }
  };

  const resetAnnouncementForm = () => {
    setAnnouncementForm({
      title: '',
      content: '',
    });
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadAnnouncements();
    setRefreshing(false);
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.pageTitle}>Announcements</Text>
        {canCreateAnnouncement && (
          <TouchableOpacity style={styles.addButton} onPress={() => setShowAnnouncementModal(true)}>
            <Ionicons name="add" size={20} color="white" />
            <Text style={styles.addButtonText}>New Announcement</Text>
          </TouchableOpacity>
        )}
      </View>

      <FlatList
        data={announcements}
        keyExtractor={(item) => item.id}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        renderItem={({ item }) => (
          <View style={styles.announcementCard}>
            <Text style={styles.announcementTitle}>{item.title}</Text>
            <Text style={styles.announcementContent}>{item.content}</Text>
            <Text style={styles.announcementDate}>
              {new Date(item.created_at).toLocaleDateString()}
            </Text>
            <View style={styles.announcementMeta}>
              <Text style={styles.createdBy}>
                by IAI Administrator
              </Text>
              <View style={[styles.statusIndicator, { backgroundColor: item.is_active ? theme.colors.success : '#6B7280' }]} />
            </View>
          </View>
        )}
        ListEmptyComponent={() => (
          <Text style={styles.emptyText}>No announcements found</Text>
        )}
      />

      {/* Announcement Modal */}
      <Modal visible={showAnnouncementModal} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <ScrollView>
              <Text style={styles.modalTitle}>Create New Announcement</Text>

              <Text style={styles.inputLabel}>Title</Text>
              <TextInput
                style={styles.input}
                value={announcementForm.title}
                onChangeText={(text) => setAnnouncementForm({ ...announcementForm, title: text })}
                placeholder="Enter announcement title"
                placeholderTextColor="#6B7280"
              />

              <Text style={styles.inputLabel}>Content</Text>
              <TextInput
                style={[styles.input, styles.textArea]}
                value={announcementForm.content}
                onChangeText={(text) => setAnnouncementForm({ ...announcementForm, content: text })}
                placeholder="Enter announcement content"
                placeholderTextColor="#6B7280"
                multiline
                numberOfLines={4}
              />

              <View style={styles.modalActions}>
                <TouchableOpacity
                  style={[styles.modalButton, styles.cancelButton]}
                  onPress={() => setShowAnnouncementModal(false)}
                >
                  <Text style={styles.cancelButtonText}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.modalButton, styles.saveButton]}
                  onPress={handleCreateAnnouncement}
                >
                  <Text style={styles.saveButtonText}>Create</Text>
                </TouchableOpacity>
              </View>
            </ScrollView>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
    padding: 16,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  pageTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: theme.colors.text,
  },
  addButton: {
    backgroundColor: theme.colors.primary,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
  },
  addButtonText: {
    color: 'white',
    marginLeft: 8,
    fontWeight: '600',
  },
  announcementCard: {
    backgroundColor: theme.colors.card,
    padding: 16,
    marginBottom: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  announcementTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: theme.colors.text,
    marginBottom: 8,
  },
  announcementContent: {
    fontSize: 14,
    color: theme.colors.text,
    marginBottom: 12,
    lineHeight: 20,
  },
  announcementDate: {
    fontSize: 12,
    color: '#6B7280',
    marginBottom: 8,
  },
  announcementMeta: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  createdBy: {
    fontSize: 12,
    color: '#6B7280',
  },
  statusIndicator: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  emptyText: {
    textAlign: 'center',
    color: '#6B7280',
    fontSize: 16,
    marginTop: 32,
  },
  footer: {
    paddingVertical: 20,
    paddingHorizontal: 16,
    alignItems: 'center',
    marginTop: 16,
  },
  footerText: {
    fontSize: 14,
    color: '#6B7280',
    fontStyle: 'italic',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: theme.colors.card,
    borderRadius: 12,
    padding: 20,
    width: '90%',
    maxHeight: '80%',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: theme.colors.text,
    marginBottom: 20,
    textAlign: 'center',
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: theme.colors.text,
    marginBottom: 8,
    marginTop: 12,
  },
  input: {
    backgroundColor: theme.colors.background,
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    color: theme.colors.text,
  },
  textArea: {
    height: 100,
    textAlignVertical: 'top',
  },
  modalActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 24,
  },
  modalButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    marginHorizontal: 4,
  },
  cancelButton: {
    backgroundColor: '#6B7280',
  },
  saveButton: {
    backgroundColor: theme.colors.primary,
  },
  cancelButtonText: {
    color: 'white',
    textAlign: 'center',
    fontWeight: '600',
  },
  saveButtonText: {
    color: 'white',
    textAlign: 'center',
    fontWeight: '600',
  },
});
