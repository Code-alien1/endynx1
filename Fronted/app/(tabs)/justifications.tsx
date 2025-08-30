import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  Alert,
  RefreshControl,
  Modal,
  TextInput,
  ScrollView,
} from 'react-native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { StyleSheet } from 'react-native';
import { useAuth } from '../../contexts/AuthContext';
import { theme } from '../../constants/theme';

interface Justification {
  id: string;
  student: {
    first_name: string;
    last_name: string;
    id: string;
  };
  session: {
    subject: string;
    date: string;
  };
  reason: string;
  status: 'pending' | 'approved' | 'rejected';
  photo_uri?: string;
  submitted_at: string;
  admin_comment?: string;
}

export default function JustificationsTab() {
  const { user } = useAuth();
  const [justifications, setJustifications] = useState<Justification[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const [showActionModal, setShowActionModal] = useState(false);
  const [selectedJustification, setSelectedJustification] = useState<Justification | null>(null);
  const [adminComment, setAdminComment] = useState('');
  const [actionType, setActionType] = useState<'approve' | 'reject'>('approve');

  useEffect(() => {
    loadJustifications();
  }, []);

  const loadJustifications = async () => {
    try {
      // Enhanced mock data with photos and timestamps
      setJustifications([
        {
          id: '1',
          student: { first_name: 'John', last_name: 'Doe', id: 'student1' },
          session: { subject: 'Mathematics', date: '2024-01-15' },
          reason: 'Medical appointment - had to visit doctor for urgent checkup',
          status: 'pending',
          photo_uri: 'mock-medical-certificate',
          submitted_at: '2024-01-15T10:30:00Z',
        },
        {
          id: '2',
          student: { first_name: 'Jane', last_name: 'Smith', id: 'student2' },
          session: { subject: 'English', date: '2024-01-14' },
          reason: 'Family emergency - had to attend to sick relative',
          status: 'approved',
          submitted_at: '2024-01-14T08:15:00Z',
          admin_comment: 'Valid family emergency. Approved.',
        },
        {
          id: '3',
          student: { first_name: 'Mike', last_name: 'Johnson', id: 'student3' },
          session: { subject: 'Physics', date: '2024-01-16' },
          reason: 'Transportation issues due to bad weather',
          status: 'rejected',
          submitted_at: '2024-01-16T09:00:00Z',
          admin_comment: 'Weather was clear that day. Please provide valid documentation.',
        },
        {
          id: '4',
          student: { first_name: 'Sarah', last_name: 'Wilson', id: 'student4' },
          session: { subject: 'Chemistry', date: '2024-01-17' },
          reason: 'Dental appointment that could not be rescheduled',
          status: 'pending',
          photo_uri: 'mock-dental-appointment',
          submitted_at: '2024-01-17T11:45:00Z',
        },
      ]);
    } catch (error) {
      console.error('Error loading justifications:', error);
    }
  };

  const handleJustificationAction = (justification: Justification, action: 'approve' | 'reject') => {
    setSelectedJustification(justification);
    setActionType(action);
    setAdminComment('');
    setShowActionModal(true);
  };

  const submitJustificationAction = async () => {
    if (!selectedJustification) return;

    try {
      // Update justification status
      const updatedJustifications = justifications.map(j => 
        j.id === selectedJustification.id 
          ? { ...j, status: actionType === 'approve' ? 'approved' as const : 'rejected' as const, admin_comment: adminComment }
          : j
      );
      setJustifications(updatedJustifications);

      Alert.alert('Success', `Justification ${actionType}d successfully`);
      setShowActionModal(false);
      setSelectedJustification(null);
      setAdminComment('');
    } catch (error) {
      Alert.alert('Error', 'Failed to update justification');
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadJustifications();
    setRefreshing(false);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return theme.colors.warning;
      case 'approved': return theme.colors.success;
      case 'rejected': return theme.colors.error;
      default: return '#6B7280';
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.pageTitle}>Absence Justifications</Text>
      
      <FlatList
        data={justifications}
        keyExtractor={(item) => item.id}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        renderItem={({ item }) => (
          <View style={styles.justificationCard}>
            <View style={styles.justificationHeader}>
              <Text style={styles.studentName}>
                {item.student.first_name} {item.student.last_name}
              </Text>
              <View style={[styles.statusBadge, { backgroundColor: getStatusColor(item.status) }]}>
                <Text style={styles.statusText}>{item.status.toUpperCase()}</Text>
              </View>
            </View>
            <Text style={styles.sessionInfo}>
              {item.session.subject} - {new Date(item.session.date).toLocaleDateString()}
            </Text>
            <Text style={styles.justificationReason}>{item.reason}</Text>
            
            <View style={styles.justificationMeta}>
              <Text style={styles.submittedDate}>
                Submitted: {new Date(item.submitted_at).toLocaleDateString()} at {new Date(item.submitted_at).toLocaleTimeString()}
              </Text>
              {item.photo_uri && (
                <View style={styles.photoIndicator}>
                  <MaterialCommunityIcons name="camera" size={16} color={theme.colors.primary} />
                  <Text style={styles.photoText}>Photo attached</Text>
                </View>
              )}
            </View>

            {item.admin_comment && (
              <View style={styles.adminCommentSection}>
                <Text style={styles.adminCommentLabel}>Admin Response:</Text>
                <Text style={styles.adminCommentText}>{item.admin_comment}</Text>
              </View>
            )}

            {item.status === 'pending' && (
              <View style={styles.justificationActions}>
                <TouchableOpacity
                  style={[styles.actionButton, { backgroundColor: theme.colors.success }]}
                  onPress={() => handleJustificationAction(item, 'approve')}
                >
                  <MaterialCommunityIcons name="check" size={16} color="white" />
                  <Text style={styles.actionButtonText}>Approve</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.actionButton, { backgroundColor: theme.colors.error }]}
                  onPress={() => handleJustificationAction(item, 'reject')}
                >
                  <MaterialCommunityIcons name="close" size={16} color="white" />
                  <Text style={styles.actionButtonText}>Reject</Text>
                </TouchableOpacity>
              </View>
            )}
          </View>
        )}
        ListEmptyComponent={() => (
          <Text style={styles.emptyText}>No justifications found</Text>
        )}
      />

      {/* Action Modal */}
      <Modal
        visible={showActionModal}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setShowActionModal(false)}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>
              {actionType === 'approve' ? 'Approve' : 'Reject'} Justification
            </Text>
            <TouchableOpacity 
              onPress={() => setShowActionModal(false)}
              style={styles.closeButton}
            >
              <MaterialCommunityIcons name="close" size={24} color={theme.colors.text} />
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.modalContent}>
            {selectedJustification && (
              <View style={styles.justificationPreview}>
                <Text style={styles.previewLabel}>Student:</Text>
                <Text style={styles.previewText}>
                  {selectedJustification.student.first_name} {selectedJustification.student.last_name}
                </Text>
                
                <Text style={styles.previewLabel}>Session:</Text>
                <Text style={styles.previewText}>
                  {selectedJustification.session.subject} - {new Date(selectedJustification.session.date).toLocaleDateString()}
                </Text>
                
                <Text style={styles.previewLabel}>Reason:</Text>
                <Text style={styles.previewText}>{selectedJustification.reason}</Text>
                
                {selectedJustification.photo_uri && (
                  <View style={styles.photoIndicator}>
                    <MaterialCommunityIcons name="camera" size={16} color={theme.colors.primary} />
                    <Text style={styles.photoText}>Photo attached</Text>
                  </View>
                )}
              </View>
            )}

            <Text style={styles.fieldLabel}>Admin Comment (Optional)</Text>
            <TextInput
              style={styles.textInput}
              placeholder={`Add a comment for ${actionType === 'approve' ? 'approval' : 'rejection'}...`}
              value={adminComment}
              onChangeText={setAdminComment}
              multiline
              numberOfLines={4}
              textAlignVertical="top"
            />

            <View style={styles.modalActions}>
              <TouchableOpacity 
                style={styles.cancelButton}
                onPress={() => setShowActionModal(false)}
              >
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={[styles.submitButton, { backgroundColor: actionType === 'approve' ? theme.colors.success : theme.colors.error }]}
                onPress={submitJustificationAction}
              >
                <Text style={styles.submitButtonText}>
                  {actionType === 'approve' ? 'Approve' : 'Reject'}
                </Text>
              </TouchableOpacity>
            </View>
          </ScrollView>
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
  pageTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: theme.colors.text,
    marginBottom: 16,
  },
  justificationCard: {
    backgroundColor: theme.colors.card,
    padding: 16,
    marginBottom: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  justificationHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  studentName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: theme.colors.text,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusText: {
    fontSize: 10,
    fontWeight: 'bold',
    color: 'white',
  },
  sessionInfo: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 4,
  },
  justificationReason: {
    fontSize: 14,
    color: theme.colors.text,
    marginBottom: 12,
  },
  justificationActions: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  actionButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
    flex: 1,
    marginHorizontal: 4,
  },
  actionButtonText: {
    color: 'white',
    textAlign: 'center',
    fontWeight: '600',
  },
  emptyText: {
    textAlign: 'center',
    color: '#6B7280',
    fontSize: 16,
    marginTop: 32,
  },
  // New styles for enhanced justifications
  justificationMeta: {
    marginBottom: 12,
  },
  submittedDate: {
    fontSize: 12,
    color: theme.colors.textSecondary,
    marginBottom: 4,
  },
  photoIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  photoText: {
    fontSize: 12,
    color: theme.colors.primary,
    fontStyle: 'italic',
  },
  adminCommentSection: {
    backgroundColor: theme.colors.background,
    padding: 12,
    borderRadius: 8,
    marginTop: 8,
    borderLeftWidth: 3,
    borderLeftColor: theme.colors.primary,
  },
  adminCommentLabel: {
    fontSize: 12,
    fontWeight: 'bold',
    color: theme.colors.primary,
    marginBottom: 4,
  },
  adminCommentText: {
    fontSize: 14,
    color: theme.colors.text,
    lineHeight: 18,
  },
  // Modal styles
  modalContainer: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    paddingTop: 60,
    backgroundColor: theme.colors.primary,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: 'white',
  },
  closeButton: {
    padding: 5,
  },
  modalContent: {
    flex: 1,
    padding: 20,
  },
  justificationPreview: {
    backgroundColor: theme.colors.card,
    padding: 15,
    borderRadius: 10,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: theme.colors["card-border"],
  },
  previewLabel: {
    fontSize: 14,
    fontWeight: 'bold',
    color: theme.colors.primary,
    marginTop: 10,
    marginBottom: 4,
  },
  previewText: {
    fontSize: 14,
    color: theme.colors.text,
    marginBottom: 8,
  },
  fieldLabel: {
    fontSize: 16,
    fontWeight: 'bold',
    color: theme.colors.text,
    marginBottom: 8,
  },
  textInput: {
    backgroundColor: theme.colors.card,
    borderRadius: 10,
    padding: 15,
    fontSize: 16,
    color: theme.colors.text,
    borderWidth: 1,
    borderColor: theme.colors["card-border"],
    marginBottom: 20,
    minHeight: 100,
  },
  modalActions: {
    flexDirection: 'row',
    gap: 15,
  },
  cancelButton: {
    flex: 1,
    backgroundColor: theme.colors.card,
    borderRadius: 10,
    padding: 15,
    alignItems: 'center',
  },
  cancelButtonText: {
    fontSize: 16,
    color: theme.colors.text,
    fontWeight: '500',
  },
  submitButton: {
    flex: 1,
    borderRadius: 10,
    padding: 15,
    alignItems: 'center',
  },
  submitButtonText: {
    fontSize: 16,
    color: 'white',
    fontWeight: 'bold',
  },
});
