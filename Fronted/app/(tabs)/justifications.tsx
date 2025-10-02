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
import apiService from '../../services/api';

interface Justification {
  id: string;
  student: {
    first_name: string;
    last_name: string;
    id: string;
    username: string;
  };
  attendance: {
    id: string;
    session: {
      class_name: string;
      date: string;
      session_type: string;
    };
  };
  reason: string;
  status: 'pending' | 'approved' | 'rejected';
  photo?: string;
  submitted_at: string;
  reviewed_at?: string;
  reviewed_by?: {
    first_name: string;
    last_name: string;
  };
  review_notes?: string;
}

export default function JustificationsTab() {
  const { user } = useAuth();
  const [justifications, setJustifications] = useState<Justification[]>([]);
  const [filteredJustifications, setFilteredJustifications] = useState<Justification[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
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
      console.log('Loading justifications from API...');
      
      // Try multiple endpoints for justifications
      let response;
      try {
        response = await apiService.get('/edynx-admin/justifications/');
        console.log('API Response from /edynx-admin/justifications/:', response);
      } catch (adminError) {
        console.log('Admin justifications endpoint failed, trying attendance justifications:', adminError);
        response = await apiService.get('/attendance/justifications/');
        console.log('API Response from /attendance/justifications/:', response);
      }
      
      const justificationsData = response.data?.results || response.data || response;
      console.log('Justifications data:', justificationsData);
      
      if (!Array.isArray(justificationsData)) {
        console.error('Justifications data is not an array:', justificationsData);
        Alert.alert('Error', 'Invalid response format from server');
        setJustifications([]);
        return;
      }
      
      // Transform API data to match our interface
      const transformedJustifications: Justification[] = justificationsData.map((item: any) => ({
        id: item.id?.toString() || Math.random().toString(),
        student: {
          first_name: item.student?.first_name || 'Unknown',
          last_name: item.student?.last_name || 'Student',
          id: item.student?.id || item.student_id || '',
          username: item.student?.username || item.student?.email?.split('@')[0] || 'unknown',
        },
        attendance: {
          id: item.attendance?.id || item.attendance_id || '',
          session: {
            class_name: item.attendance?.session?.class_name || item.session?.class_name || 'Unknown Class',
            date: item.attendance?.session?.date || item.session?.date || new Date().toISOString().split('T')[0],
            session_type: item.attendance?.session?.session_type || item.session?.session_type || 'morning',
          },
        },
        reason: item.reason || 'No reason provided',
        status: item.status || 'pending',
        photo: item.photo,
        submitted_at: item.submitted_at || new Date().toISOString(),
        reviewed_at: item.reviewed_at,
        reviewed_by: item.reviewed_by ? {
          first_name: item.reviewed_by.first_name || 'Admin',
          last_name: item.reviewed_by.last_name || 'User',
        } : undefined,
        review_notes: item.review_notes,
      }));
      
      console.log('Transformed justifications:', transformedJustifications);
      setJustifications(transformedJustifications);
      setFilteredJustifications(transformedJustifications);
      
      if (transformedJustifications.length > 0) {
        console.log(`Loaded ${transformedJustifications.length} justifications from database`);
      }
      
    } catch (error: any) {
      console.error('Error loading justifications:', error);
      
      let errorMessage = 'Failed to load justifications from server.';
      if (error.response) {
        errorMessage += ` Status: ${error.response.status}`;
        if (error.response.data) {
          errorMessage += ` - ${JSON.stringify(error.response.data)}`;
        }
      } else if (error.message) {
        errorMessage += ` Error: ${error.message}`;
      }
      
      Alert.alert('Error', errorMessage);
      setJustifications([]);
      setFilteredJustifications([]);
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
      const status = actionType === 'approve' ? 'approved' : 'rejected';
      
      // Try multiple endpoints for updating justification status
      try {
        await apiService.patch(`/edynx-admin/justifications/${selectedJustification.id}/`, {
          status: status,
          review_notes: adminComment,
        });
      } catch (adminError) {
        console.log('Admin justifications update failed, trying attendance endpoint:', adminError);
        await apiService.patch(`/attendance/justifications/${selectedJustification.id}/`, {
          status: status,
          review_notes: adminComment,
        });
      }

      // Update local state
      const updatedJustifications = justifications.map(j => 
        j.id === selectedJustification.id 
          ? { 
              ...j, 
              status: status as 'approved' | 'rejected',
              review_notes: adminComment,
              reviewed_at: new Date().toISOString(),
              reviewed_by: {
                first_name: user?.first_name || 'Admin',
                last_name: user?.last_name || 'User',
              }
            }
          : j
      );
      setJustifications(updatedJustifications);
      filterJustifications(updatedJustifications, searchQuery);

      Alert.alert('Success', `Justification ${actionType}d successfully`);
      setShowActionModal(false);
      setSelectedJustification(null);
      setAdminComment('');
    } catch (error: any) {
      console.error('Error updating justification:', error);
      Alert.alert('Error', 'Failed to update justification');
    }
  };

  const filterJustifications = (justificationsList: Justification[], query: string) => {
    if (!query.trim()) {
      setFilteredJustifications(justificationsList);
      return;
    }

    const filtered = justificationsList.filter(justification => {
      const studentName = `${justification.student.first_name} ${justification.student.last_name}`.toLowerCase();
      const username = justification.student.username.toLowerCase();
      const className = justification.attendance.session.class_name.toLowerCase();
      const reason = justification.reason.toLowerCase();
      const status = justification.status.toLowerCase();
      const searchTerm = query.toLowerCase();

      return (
        studentName.includes(searchTerm) ||
        username.includes(searchTerm) ||
        className.includes(searchTerm) ||
        reason.includes(searchTerm) ||
        status.includes(searchTerm)
      );
    });

    setFilteredJustifications(filtered);
  };

  const handleSearchChange = (query: string) => {
    setSearchQuery(query);
    filterJustifications(justifications, query);
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
      
      {/* Search Filter */}
      <View style={styles.searchContainer}>
        <View style={styles.searchInputContainer}>
          <MaterialCommunityIcons name="magnify" size={20} color={theme.colors.textSecondary} style={styles.searchIcon} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search by student name, class, reason, or status..."
            placeholderTextColor={theme.colors.textSecondary}
            value={searchQuery}
            onChangeText={handleSearchChange}
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity
              style={styles.clearSearchButton}
              onPress={() => handleSearchChange('')}
            >
              <MaterialCommunityIcons name="close" size={20} color={theme.colors.textSecondary} />
            </TouchableOpacity>
          )}
        </View>
        {searchQuery.length > 0 && (
          <Text style={styles.searchResultsText}>
            {filteredJustifications.length} of {justifications.length} justifications
          </Text>
        )}
      </View>
      
      <FlatList
        data={filteredJustifications}
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
              {item.attendance.session.class_name} - {new Date(item.attendance.session.date).toLocaleDateString()}
            </Text>
            <Text style={styles.justificationReason}>{item.reason}</Text>
            
            <View style={styles.justificationMeta}>
              <Text style={styles.submittedDate}>
                Submitted: {new Date(item.submitted_at).toLocaleDateString()} at {new Date(item.submitted_at).toLocaleTimeString()}
              </Text>
              {item.photo && (
                <View style={styles.photoIndicator}>
                  <MaterialCommunityIcons name="camera" size={16} color={theme.colors.primary} />
                  <Text style={styles.photoText}>Photo attached</Text>
                </View>
              )}
            </View>

            {item.review_notes && (
              <View style={styles.adminCommentSection}>
                <Text style={styles.adminCommentLabel}>Admin Response:</Text>
                <Text style={styles.adminCommentText}>{item.review_notes}</Text>
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
          <View style={styles.emptyContainer}>
            <MaterialCommunityIcons 
              name={searchQuery ? "magnify" : "clipboard-text-outline"} 
              size={64} 
              color={theme.colors.textSecondary} 
            />
            <Text style={styles.emptyText}>
              {searchQuery ? `No justifications found for "${searchQuery}"` : 'No justifications found'}
            </Text>
            {searchQuery && (
              <TouchableOpacity 
                style={styles.clearSearchButton}
                onPress={() => handleSearchChange('')}
              >
                <Text style={styles.clearSearchText}>Clear search</Text>
              </TouchableOpacity>
            )}
          </View>
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
                  {selectedJustification.attendance.session.class_name} - {new Date(selectedJustification.attendance.session.date).toLocaleDateString()}
                </Text>
                
                <Text style={styles.previewLabel}>Reason:</Text>
                <Text style={styles.previewText}>{selectedJustification.reason}</Text>
                
                {selectedJustification.photo && (
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
  // Search styles
  searchContainer: {
    marginBottom: 16,
  },
  searchInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.card,
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: theme.colors.text,
    paddingVertical: 8,
  },
  clearSearchButton: {
    padding: 4,
    marginLeft: 8,
  },
  searchResultsText: {
    fontSize: 14,
    color: theme.colors.textSecondary,
    marginTop: 8,
    textAlign: 'center',
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 40,
  },
  clearSearchText: {
    fontSize: 16,
    color: theme.colors.primary,
    fontWeight: '500',
    marginTop: 12,
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
    marginTop: 16,
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
