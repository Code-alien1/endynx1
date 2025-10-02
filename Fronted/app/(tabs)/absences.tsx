import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Image, Alert, Modal, TextInput } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { useAuth } from '../../contexts/AuthContext';
import { theme } from '../../constants/theme';
import { apiService } from '../../services/api';

interface Absence {
  id: string;
  date: string;
  session_name: string;
  subject: string;
  start_time: string;
  end_time: string;
  status: 'absent' | 'justified' | 'pending' | 'approved' | 'rejected';
  reason?: string;
  justification_id?: string;
  approval_status?: 'pending' | 'approved' | 'rejected';
  admin_comment?: string;
}

interface JustificationSubmission {
  absence_id: string;
  reason: string;
  photo_uri?: string;
  photo_base64?: string;
}

export default function AbsencesScreen() {
  const { user } = useAuth();
  const [absences, setAbsences] = useState<Absence[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const [showJustifyModal, setShowJustifyModal] = useState(false);
  const [selectedAbsenceId, setSelectedAbsenceId] = useState<string | null>(null);
  const [justificationReason, setJustificationReason] = useState('');
  const [selectedPhoto, setSelectedPhoto] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [justifications, setJustifications] = useState<any[]>([]);

  useEffect(() => {
    loadAbsences();
    loadJustifications();
  }, []);

  const loadAbsences = async () => {
    try {
      setIsLoading(true);
      // Get sessions where student was absent (didn't mark attendance)
      const sessionsResponse = await apiService.getAttendanceSessions();
      const attendanceResponse = await apiService.getAttendanceRecords();
      
      // Handle paginated response format
      let sessions: any[] = [];
      if (sessionsResponse && (sessionsResponse as any).results && Array.isArray((sessionsResponse as any).results)) {
        sessions = (sessionsResponse as any).results;
      } else if (Array.isArray(sessionsResponse)) {
        sessions = sessionsResponse;
      }

      let attendanceRecords: any[] = [];
      if (attendanceResponse && (attendanceResponse as any).results && Array.isArray((attendanceResponse as any).results)) {
        attendanceRecords = (attendanceResponse as any).results;
      } else if (Array.isArray(attendanceResponse)) {
        attendanceRecords = attendanceResponse;
      }
      
      // Find sessions where student didn't mark attendance
      const absentSessions = sessions.filter((session: any) => {
        const hasAttendance = attendanceRecords.some((record: any) => 
          record.session === session.id && record.student === user?.id
        );
        return !hasAttendance && new Date(session.date + ' ' + session.end_time) < new Date();
      });

      const absenceData: Absence[] = absentSessions.map(session => ({
        id: session.id,
        date: session.date,
        session_name: session.class_name,
        subject: session.class_name || 'General Session',
        start_time: session.start_time,
        end_time: session.end_time,
        status: 'absent' as const,
        reason: 'Did not mark attendance'
      }));

      setAbsences(absenceData);
    } catch (error) {
      console.error('Error loading absences:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleJustifyAbsence = (absenceId?: string) => {
    setSelectedAbsenceId(absenceId || null);
    setShowJustifyModal(true);
  };

  const pickImageFromGallery = async () => {
    try {
      // Request permission to access media library
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission Required', 'Please grant permission to access your photo gallery.');
        return;
      }

      // Launch image picker
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [4, 3],
        quality: 0.8,
        base64: true,
      });

      if (!result.canceled && result.assets[0]) {
        setSelectedPhoto(result.assets[0].uri);
        console.log('Photo selected from gallery:', result.assets[0].uri);
      }
    } catch (error) {
      console.error('Error picking image:', error);
      Alert.alert('Error', 'Failed to select image from gallery.');
    }
  };

  const takePhotoWithCamera = async () => {
    try {
      // Request camera permission
      const { status } = await ImagePicker.requestCameraPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission Required', 'Please grant permission to access your camera.');
        return;
      }

      // Launch camera
      const result = await ImagePicker.launchCameraAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [4, 3],
        quality: 0.8,
        base64: true,
      });

      if (!result.canceled && result.assets[0]) {
        setSelectedPhoto(result.assets[0].uri);
        console.log('Photo taken with camera:', result.assets[0].uri);
      }
    } catch (error) {
      console.error('Error taking photo:', error);
      Alert.alert('Error', 'Failed to take photo with camera.');
    }
  };

  const showImagePickerOptions = () => {
    Alert.alert(
      'Select Photo',
      'Choose how you want to add a photo',
      [
        { text: 'Camera', onPress: takePhotoWithCamera },
        { text: 'Gallery', onPress: pickImageFromGallery },
        { text: 'Cancel', style: 'cancel' }
      ]
    );
  };


  const handleSubmitJustification = async () => {
    if (!justificationReason.trim()) {
      Alert.alert('Error', 'Please provide a reason for your absence.');
      return;
    }

    setIsSubmitting(true);
    try {
      console.log('Submitting justification:', {
        selectedAbsenceId,
        reason: justificationReason,
        photo: selectedPhoto
      });

      // Create justification without specific attendance record (general justification)
      const formData = new FormData();
      formData.append('reason', justificationReason);
      
      // Add photo if selected
      if (selectedPhoto) {
        const filename = selectedPhoto.split('/').pop() || 'justification.jpg';
        const match = /\.(\w+)$/.exec(filename);
        const type = match ? `image/${match[1]}` : 'image/jpeg';
        
        formData.append('photo', {
          uri: selectedPhoto,
          name: filename,
          type: type,
        } as any);
      }
      
      console.log('Submitting FormData with reason and photo (no attendance record required)');
      
      // Use FormData for file upload - student field will be set automatically by backend
      const response = await apiService.api.post('/attendance/justifications/', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      console.log('Justification submitted successfully:', response.data);

      // Update local state to show submitted justification
      const newJustification = {
        id: response.data.id || Date.now().toString(),
        student_id: user?.id,
        student_name: user?.username || user?.email || 'Student',
        absence_id: selectedAbsenceId || 'general',
        reason: justificationReason,
        photo_uri: selectedPhoto,
        status: 'pending',
        submitted_at: new Date().toISOString(),
        admin_comment: null
      };
      
      setJustifications(prev => [newJustification, ...prev]);

      Alert.alert(
        'Success',
        'Your absence justification has been submitted successfully. You will be notified once it is reviewed.',
        [
          {
            text: 'OK',
            onPress: () => {
              setShowJustifyModal(false);
              setJustificationReason('');
              setSelectedPhoto(null);
              setSelectedAbsenceId(null);
              loadAbsences(); // Refresh the list
            }
          }
        ]
      );
    } catch (error: any) {
      console.error('Error submitting justification:', error);
      console.error('Error response:', error.response?.data);
      console.error('Error status:', error.response?.status);
      
      let errorMessage = 'Failed to submit justification. Please try again.';
      if (error.response?.data?.message) {
        errorMessage = error.response.data.message;
      } else if (error.response?.data?.error) {
        errorMessage = error.response.data.error;
      } else if (error.response?.data) {
        // Handle validation errors
        const errors = error.response.data;
        if (typeof errors === 'object') {
          errorMessage = Object.values(errors).flat().join(', ');
        }
      } else if (error.message) {
        errorMessage = error.message;
      }
      
      Alert.alert('Error', errorMessage);
    } finally {
      setIsSubmitting(false);
    }
  };

  const loadJustifications = async () => {
    try {
      // Mock justifications data - in real app this would come from API
      const mockJustifications = [
        {
          id: '1',
          student_id: user?.id,
          student_name: user?.username || user?.email || 'Student',
          absence_id: 'absence_1',
          reason: 'Medical appointment',
          photo_uri: 'mock-photo-1',
          status: 'approved',
          submitted_at: '2024-01-15T10:00:00Z',
          admin_comment: 'Valid medical certificate provided'
        },
        {
          id: '2',
          student_id: user?.id,
          student_name: user?.username || user?.email || 'Student',
          absence_id: 'absence_2',
          reason: 'Family emergency',
          photo_uri: null,
          status: 'pending',
          submitted_at: '2024-01-20T14:30:00Z',
          admin_comment: null
        }
      ];
      
      setJustifications(mockJustifications);
    } catch (error) {
      console.error('Error loading justifications:', error);
    }
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

      <TouchableOpacity style={styles.justifyButton} onPress={() => handleJustifyAbsence()}>
        <MaterialCommunityIcons name="camera-plus" size={24} color="white" />
        <Text style={styles.justifyButtonText}>Justify New Absence</Text>
      </TouchableOpacity>

      <View style={styles.absencesList}>
        {isLoading ? (
          <View style={styles.loadingContainer}>
            <Text style={styles.loadingText}>Loading absences...</Text>
          </View>
        ) : absences.length === 0 ? (
          <View style={styles.emptyContainer}>
            <MaterialCommunityIcons name="check-circle" size={48} color={theme.colors.success} />
            <Text style={styles.emptyTitle}>Perfect Attendance!</Text>
            <Text style={styles.emptyText}>You haven't missed any sessions recently.</Text>
          </View>
        ) : (
          absences.map((absence) => (
            <View key={absence.id} style={styles.absenceCard}>
              <View style={styles.absenceHeader}>
                <View>
                  <Text style={styles.absenceDate}>{absence.date}</Text>
                  <Text style={styles.absenceSession}>{absence.subject}</Text>
                  <Text style={styles.absenceTime}>
                    {absence.start_time} - {absence.end_time}
                  </Text>
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
              
              {absence.status === 'justified' && (
                <View style={styles.justificationIndicator}>
                  <MaterialCommunityIcons name="file-document" size={16} color={theme.colors.primary} />
                  <Text style={styles.justificationText}>Justification submitted</Text>
                </View>
              )}
            </View>
          ))
        )}
      </View>

      {/* My Justifications Section */}
      {justifications.length > 0 && (
        <View style={styles.justificationsSection}>
          <Text style={styles.sectionTitle}>My Justifications</Text>
          {justifications.map((justification) => (
            <View key={justification.id} style={styles.justificationCard}>
              <View style={styles.justificationHeader}>
                <Text style={styles.justificationReason}>{justification.reason}</Text>
                <View style={[styles.statusBadge, { backgroundColor: getStatusColor(justification.status) }]}>
                  <MaterialCommunityIcons 
                    name={getStatusIcon(justification.status)} 
                    size={12} 
                    color="white" 
                  />
                  <Text style={styles.statusText}>{justification.status.toUpperCase()}</Text>
                </View>
              </View>
              
              <Text style={styles.justificationDate}>
                Submitted: {new Date(justification.submitted_at).toLocaleDateString()}
              </Text>
              
              {justification.photo_uri && (
                <View style={styles.photoIndicator}>
                  <MaterialCommunityIcons name="camera" size={16} color={theme.colors.primary} />
                  <Text style={styles.photoIndicatorText}>Photo attached</Text>
                </View>
              )}
              
              {justification.admin_comment && (
                <View style={styles.adminComment}>
                  <Text style={styles.adminCommentLabel}>Admin Response:</Text>
                  <Text style={styles.adminCommentText}>{justification.admin_comment}</Text>
                </View>
              )}
            </View>
          ))}
        </View>
      )}

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

      {/* Justify Absence Modal */}
      <Modal
        visible={showJustifyModal}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setShowJustifyModal(false)}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Justify Absence</Text>
            <TouchableOpacity 
              onPress={() => setShowJustifyModal(false)}
              style={styles.closeButton}
            >
              <MaterialCommunityIcons name="close" size={24} color={theme.colors.text} />
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.modalContent}>
            <Text style={styles.fieldLabel}>Reason for Absence *</Text>
            <TextInput
              style={styles.textInput}
              placeholder="Explain the reason for your absence..."
              value={justificationReason}
              onChangeText={setJustificationReason}
              multiline
              numberOfLines={4}
              textAlignVertical="top"
            />

            <TouchableOpacity style={styles.photoButton} onPress={showImagePickerOptions}>
              <MaterialCommunityIcons name={selectedPhoto ? "check-circle" : "camera"} size={24} color={theme.colors.primary} />
              <Text style={styles.photoButtonText}>
                {selectedPhoto ? 'Photo Selected ✓' : 'Add Photo (Optional)'}
              </Text>
            </TouchableOpacity>
            
            {selectedPhoto && (
              <View style={styles.photoPreview}>
                <Image 
                  source={{ uri: selectedPhoto }} 
                  style={styles.selectedImage}
                  resizeMode="cover"
                />
                <Text style={styles.photoPreviewText}>Photo ready to submit</Text>
                <TouchableOpacity 
                  style={styles.removePhotoButton}
                  onPress={() => setSelectedPhoto(null)}
                >
                  <MaterialCommunityIcons name="close-circle" size={20} color={theme.colors.destructive} />
                  <Text style={styles.removePhotoText}>Remove</Text>
                </TouchableOpacity>
              </View>
            )}

            <View style={styles.modalActions}>
              <TouchableOpacity 
                style={styles.cancelButton}
                onPress={() => setShowJustifyModal(false)}
              >
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={[styles.submitButton, isSubmitting && styles.submitButtonDisabled]}
                onPress={handleSubmitJustification}
                disabled={isSubmitting}
              >
                <Text style={styles.submitButtonText}>
                  {isSubmitting ? 'Submitting...' : 'Submit'}
                </Text>
              </TouchableOpacity>
            </View>
          </ScrollView>
        </View>
      </Modal>
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
    backgroundColor: theme.colors.card,
    borderRadius: 10,
    padding: 15,
    marginBottom: 15,
    borderWidth: 1,
    borderColor: theme.colors["card-border"],
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
    color: theme.colors["primary-foreground"],
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
    backgroundColor: theme.colors.card,
    margin: 20,
    padding: 15,
    borderRadius: 10,
    flexDirection: 'row',
    gap: 15,
    borderWidth: 1,
    borderColor: theme.colors["card-border"],
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
  photoButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: theme.colors.card,
    borderRadius: 10,
    padding: 15,
    borderWidth: 2,
    borderColor: theme.colors.primary,
    borderStyle: 'dashed',
    marginBottom: 30,
    gap: 10,
  },
  photoButtonText: {
    fontSize: 16,
    color: theme.colors.primary,
    fontWeight: '500',
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
    backgroundColor: theme.colors.primary,
    borderRadius: 10,
    padding: 15,
    alignItems: 'center',
  },
  submitButtonDisabled: {
    backgroundColor: theme.colors.textSecondary,
  },
  submitButtonText: {
    fontSize: 16,
    color: 'white',
    fontWeight: 'bold',
  },
  // Loading and empty states
  loadingContainer: {
    padding: 40,
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 16,
    color: theme.colors.textSecondary,
  },
  emptyContainer: {
    padding: 40,
    alignItems: 'center',
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: theme.colors.text,
    marginTop: 15,
    marginBottom: 5,
  },
  emptyText: {
    fontSize: 14,
    color: theme.colors.textSecondary,
    textAlign: 'center',
  },
  absenceTime: {
    fontSize: 12,
    color: theme.colors.textSecondary,
    marginTop: 2,
  },
  // New styles for justifications and photo upload
  justificationsSection: {
    padding: 20,
    paddingTop: 0,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: theme.colors.text,
    marginBottom: 15,
  },
  justificationCard: {
    backgroundColor: theme.colors.card,
    borderRadius: 10,
    padding: 15,
    marginBottom: 15,
    borderWidth: 1,
    borderColor: theme.colors["card-border"],
  },
  justificationHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 10,
  },
  justificationReason: {
    fontSize: 16,
    fontWeight: '500',
    color: theme.colors.text,
    flex: 1,
    marginRight: 10,
  },
  justificationDate: {
    fontSize: 12,
    color: theme.colors.textSecondary,
    marginBottom: 8,
  },
  photoIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    marginBottom: 8,
  },
  photoIndicatorText: {
    fontSize: 12,
    color: theme.colors.primary,
    fontStyle: 'italic',
  },
  adminComment: {
    backgroundColor: theme.colors.background,
    padding: 10,
    borderRadius: 8,
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
  photoPreview: {
    backgroundColor: theme.colors.card,
    borderRadius: 10,
    padding: 15,
    alignItems: 'center',
    marginBottom: 20,
    borderWidth: 1,
    borderColor: theme.colors.primary,
  },
  selectedImage: {
    width: 200,
    height: 150,
    borderRadius: 8,
    marginBottom: 8,
  },
  photoPreviewText: {
    fontSize: 14,
    color: theme.colors.text,
    marginTop: 8,
    marginBottom: 10,
  },
  removePhotoButton: {
    backgroundColor: theme.colors.error,
    paddingHorizontal: 15,
    paddingVertical: 8,
    borderRadius: 6,
  },
  removePhotoText: {
    color: 'white',
    fontSize: 12,
    fontWeight: '500',
  },
});
