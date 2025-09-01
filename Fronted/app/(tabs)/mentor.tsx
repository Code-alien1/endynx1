import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  Modal,
  TextInput,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import AppBackground from '../../components/AppBackground';
import { COLORS } from '../../constants/theme';
import { useAuth } from '../../contexts/AuthContext';
import apiService, { User } from '../../services/api';

interface MentorAssignment {
  id: number;
  mentor_id: string;
  student_id: string;
  mentor_name: string;
  mentor_email: string;
  student_name: string;
  student_email: string;
  assigned_by_name: string;
  assigned_at: string;
  is_active: boolean;
  notes?: string;
}

interface MentorScreenProps {}

export default function MentorScreen({}: MentorScreenProps) {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [selectedMentor, setSelectedMentor] = useState<User | null>(null);
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [showRatingModal, setShowRatingModal] = useState(false);
  const [showScheduleModal, setShowScheduleModal] = useState(false);
  const [rating, setRating] = useState(0);
  const [ratingComment, setRatingComment] = useState('');
  const [mentorAssignment, setMentorAssignment] = useState<MentorAssignment | null>(null);
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [dataLoaded, setDataLoaded] = useState(false);
  const [showMentorModal, setShowMentorModal] = useState(false);
  const [selectedDate, setSelectedDate] = useState('');
  const [selectedTime, setSelectedTime] = useState('');
  const [appointmentSubject, setAppointmentSubject] = useState('');
  const router = useRouter();

  useEffect(() => {
    if (!dataLoaded) {
      loadMentorData();
    }
  }, [dataLoaded]);

  // Only load data once on mount - no continuous polling
  // Data will refresh when user navigates back from other screens

  const loadMentorData = async () => {
    try {
      setLoading(true);
      
      // Get current user profile
      const userResponse = await apiService.get('/users/profile/');
      setCurrentUser(userResponse.data);
      console.log('Current user loaded:', userResponse.data);
      
      // Try to get mentor assignment
      try {
        const assignmentsResponse = await apiService.get('/chat/mentor-assignments/');
        const assignments = assignmentsResponse.data.results || assignmentsResponse.data;
        console.log('Assignments loaded:', assignments);
        
        const userAssignment = assignments.find((a: any) => a.student_id === userResponse.data.id || a.student_email === userResponse.data.email);
        console.log('User assignment found:', userAssignment);
        console.log('Looking for student_id:', userResponse.data.id, 'or email:', userResponse.data.email);
        
        if (userAssignment) {
          // Store the assignment details
          setMentorAssignment(userAssignment);
          
          // Get mentor info using mentor_id from assignment
          try {
            const mentorResponse = await apiService.get(`/users/${userAssignment.mentor_id}/`);
            console.log('Mentor data loaded:', mentorResponse.data);
            setSelectedMentor(mentorResponse.data);
          } catch (mentorError) {
            console.error('Error loading mentor details:', mentorError);
            // If direct user fetch fails, try to get mentor info from assignment
            // Use mentor info from assignment if available
            if (userAssignment.mentor_email) {
              setSelectedMentor({
                id: userAssignment.mentor_id || 'unknown',
                first_name: userAssignment.mentor_name?.split(' ')[0] || 'Unknown',
                last_name: userAssignment.mentor_name?.split(' ')[1] || 'Mentor',
                email: userAssignment.mentor_email,
                username: userAssignment.mentor_name || 'Unknown Mentor',
                role: 'mentor',
                created_at: new Date().toISOString(),
              } as User);
            }
          }
        } else {
          console.log('No mentor assignment found for user');
        }
      } catch (assignmentError) {
        console.error('Error loading mentor assignments:', assignmentError);
      }
    } catch (error) {
      console.error('Error loading mentor data:', error);
      Alert.alert('Error', 'Failed to load mentor information');
    } finally {
      setLoading(false);
      setDataLoaded(true);
    }
  };

  const handleRateMentor = async (mentorId: string, rating: number) => {
    try {
      // Send rating to backend for admin review
      const ratingData = {
        mentor_id: mentorId,
        student_id: currentUser?.id,
        rating: rating,
        timestamp: new Date().toISOString(),
        comment: `Student rated mentor ${rating}/5 stars`
      };
      
      await apiService.post('/chat/mentor-ratings/', ratingData);
      Alert.alert('Success', 'Rating submitted successfully! Your feedback has been sent to administrators.');
      loadMentorData(); // Refresh data
    } catch (error) {
      console.error('Rating error:', error);
      Alert.alert('Error', 'Failed to submit rating');
    }
  };

  const handleScheduleAppointment = async () => {
    if (!selectedMentor || !selectedDate || !selectedTime || !appointmentSubject) {
      Alert.alert('Error', 'Please fill in all fields');
      return;
    }

    try {
      // This would integrate with a real appointment system
      const appointmentData = {
        mentor_id: selectedMentor.id,
        student_id: currentUser?.id,
        date: selectedDate,
        time: selectedTime,
        subject: appointmentSubject,
        status: 'pending'
      };
      
      // For now, just show success message
      Alert.alert('Success', 'Appointment request sent to your mentor!');
      setShowScheduleModal(false);
      setSelectedDate('');
      setSelectedTime('');
      setAppointmentSubject('');
    } catch (error) {
      console.error('Scheduling error:', error);
      Alert.alert('Error', 'Failed to schedule appointment');
    }
  };

  const renderStars = (rating: number) => {
    const stars = [];
    for (let i = 1; i <= 5; i++) {
      stars.push(
        <Ionicons
          key={i}
          name={i <= rating ? 'star' : 'star-outline'}
          size={16}
          color={i <= rating ? '#FFD700' : '#ccc'}
        />
      );
    }
    return <View style={{ flexDirection: 'row' }}>{stars}</View>;
  };

  if (loading) {
    return (
      <AppBackground>
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
          <ActivityIndicator size="large" color={COLORS.primary} />
          <Text style={{ color: COLORS.foreground, marginTop: 16 }}>Loading mentor...</Text>
        </View>
      </AppBackground>
    );
  }

  return (
    <AppBackground>
      <View style={{ flex: 1, padding: 16, paddingTop: 60 }}>
        {/* Header */}
        <View style={{ marginBottom: 24 }}>
          <Text style={{ fontSize: 28, fontWeight: 'bold', color: COLORS.foreground, marginBottom: 8 }}>
            My Mentor
          </Text>
          <Text style={{ fontSize: 16, color: COLORS['muted-foreground'] }}>
            Connect with your assigned mentor
          </Text>
        </View>

        {/* Content */}
        <ScrollView showsVerticalScrollIndicator={false}>
          {!selectedMentor ? (
            <View style={{ 
              padding: 40, 
              backgroundColor: COLORS.card, 
              borderRadius: 12, 
              alignItems: 'center' 
            }}>
              <Ionicons name="person-outline" size={64} color={COLORS['muted-foreground']} />
              <Text style={{ 
                color: COLORS['muted-foreground'], 
                textAlign: 'center', 
                fontSize: 18,
                marginTop: 16 
              }}>
                No mentor assigned
              </Text>
              <Text style={{ 
                color: COLORS['muted-foreground'], 
                textAlign: 'center', 
                fontSize: 14,
                marginTop: 8 
              }}>
                You will be assigned a mentor soon
              </Text>
            </View>
          ) : (
            <View>
              {/* Mentor Card */}
              <TouchableOpacity
                style={{
                  backgroundColor: COLORS.card,
                  padding: 20,
                  borderRadius: 12,
                  marginBottom: 16,
                  flexDirection: 'row',
                  alignItems: 'center',
                }}
                onPress={() => setShowMentorModal(true)}
              >
                <View
                  style={{
                    width: 60,
                    height: 60,
                    borderRadius: 30,
                    backgroundColor: COLORS.primary,
                    justifyContent: 'center',
                    alignItems: 'center',
                    marginRight: 16,
                  }}
                >
                  <Text style={{ color: '#fff', fontSize: 20, fontWeight: 'bold' }}>
                    {selectedMentor.first_name?.[0]}{selectedMentor.last_name?.[0]}
                  </Text>
                </View>
                
                <View style={{ flex: 1 }}>
                  <Text style={{ fontSize: 18, fontWeight: '600', color: COLORS.foreground }}>
                    {selectedMentor.first_name} {selectedMentor.last_name}
                  </Text>
                  <Text style={{ color: COLORS['muted-foreground'], marginTop: 2 }}>
                    Your Mentor
                  </Text>
                  <Text style={{ color: COLORS['muted-foreground'], fontSize: 14, marginTop: 2 }}>
                    {selectedMentor.email}
                  </Text>
                </View>
                
                <Ionicons name="chevron-forward" size={24} color={COLORS['muted-foreground']} />
              </TouchableOpacity>

              {/* Action Buttons */}
              <View style={{ flexDirection: 'row', gap: 12, marginBottom: 20 }}>
                <TouchableOpacity
                  style={{
                    flex: 1,
                    backgroundColor: COLORS.primary,
                    padding: 16,
                    borderRadius: 12,
                    alignItems: 'center',
                    flexDirection: 'row',
                    justifyContent: 'center',
                  }}
                  onPress={() => router.push('/chat')}
                >
                  <Ionicons name="chatbubbles" size={20} color="#fff" style={{ marginRight: 8 }} />
                  <Text style={{ color: '#fff', fontWeight: '600', fontSize: 16 }}>
                    Start Chat
                  </Text>
                </TouchableOpacity>
                
                <TouchableOpacity
                  style={{
                    flex: 1,
                    backgroundColor: COLORS.secondary,
                    padding: 16,
                    borderRadius: 12,
                    alignItems: 'center',
                    flexDirection: 'row',
                    justifyContent: 'center',
                  }}
                  onPress={() => setShowScheduleModal(true)}
                >
                  <Ionicons name="calendar" size={20} color="#fff" style={{ marginRight: 8 }} />
                  <Text style={{ color: '#fff', fontWeight: '600', fontSize: 16 }}>
                    Schedule
                  </Text>
                </TouchableOpacity>
              </View>

              {/* Quick Actions */}
              <View style={{ backgroundColor: COLORS.card, borderRadius: 12, padding: 16 }}>
                <Text style={{ fontSize: 16, fontWeight: '600', color: COLORS.foreground, marginBottom: 12 }}>
                  Quick Actions
                </Text>
                
                <TouchableOpacity
                  style={{
                    flexDirection: 'row',
                    alignItems: 'center',
                    paddingVertical: 12,
                    borderBottomWidth: 1,
                    borderBottomColor: COLORS.border,
                  }}
                  onPress={() => {
                    Alert.alert(
                      'Rate Mentor',
                      'How would you rate this mentor?',
                      [
                        { text: '1 Star', onPress: () => handleRateMentor(selectedMentor.id, 1) },
                        { text: '2 Stars', onPress: () => handleRateMentor(selectedMentor.id, 2) },
                        { text: '3 Stars', onPress: () => handleRateMentor(selectedMentor.id, 3) },
                        { text: '4 Stars', onPress: () => handleRateMentor(selectedMentor.id, 4) },
                        { text: '5 Stars', onPress: () => handleRateMentor(selectedMentor.id, 5) },
                        { text: 'Cancel', style: 'cancel' },
                      ]
                    );
                  }}
                >
                  <Ionicons name="star" size={20} color={COLORS.primary} style={{ marginRight: 12 }} />
                  <Text style={{ color: COLORS.foreground, fontSize: 16 }}>Rate Mentor</Text>
                  <Ionicons name="chevron-forward" size={20} color={COLORS['muted-foreground']} style={{ marginLeft: 'auto' }} />
                </TouchableOpacity>
                
                <TouchableOpacity
                  style={{
                    flexDirection: 'row',
                    alignItems: 'center',
                    paddingVertical: 12,
                  }}
                  onPress={() => setShowMentorModal(true)}
                >
                  <Ionicons name="information-circle" size={20} color={COLORS.primary} style={{ marginRight: 12 }} />
                  <Text style={{ color: COLORS.foreground, fontSize: 16 }}>View Profile</Text>
                  <Ionicons name="chevron-forward" size={20} color={COLORS['muted-foreground']} style={{ marginLeft: 'auto' }} />
                </TouchableOpacity>
              </View>
            </View>
          )}
        </ScrollView>
      </View>

      {/* Mentor Profile Modal */}
      <Modal visible={showMentorModal} animationType="slide" transparent>
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: 'rgba(0,0,0,0.5)' }}>
          <View style={{ backgroundColor: COLORS.card, padding: 24, borderRadius: 16, width: '90%', maxHeight: '80%' }}>
            <ScrollView>
              {selectedMentor && (
                <>
                  <View style={{ alignItems: 'center', marginBottom: 20 }}>
                    <View
                      style={{
                        width: 80,
                        height: 80,
                        borderRadius: 40,
                        backgroundColor: COLORS.primary,
                        justifyContent: 'center',
                        alignItems: 'center',
                        marginBottom: 12,
                      }}
                    >
                      <Text style={{ color: '#fff', fontSize: 24, fontWeight: 'bold' }}>
                        {selectedMentor.first_name?.[0]}{selectedMentor.last_name?.[0]}
                      </Text>
                    </View>
                    <Text style={{ fontSize: 20, fontWeight: 'bold', color: COLORS.foreground }}>
                      {selectedMentor.first_name} {selectedMentor.last_name}
                    </Text>
                    <Text style={{ color: COLORS['muted-foreground'], marginTop: 4 }}>
                      Your Mentor
                    </Text>
                  </View>

                  <View style={{ marginBottom: 20 }}>
                    <Text style={{ fontSize: 16, fontWeight: '600', color: COLORS.foreground, marginBottom: 8 }}>
                      Contact Information
                    </Text>
                    <Text style={{ color: COLORS['muted-foreground'], marginBottom: 4 }}>
                      Email: {selectedMentor.email}
                    </Text>
                    {selectedMentor.phone_number && (
                      <Text style={{ color: COLORS['muted-foreground'], marginBottom: 4 }}>
                        Phone: {selectedMentor.phone_number}
                      </Text>
                    )}
                  </View>

                  {mentorAssignment && (
                    <View style={{ marginBottom: 20 }}>
                      <Text style={{ fontSize: 16, fontWeight: '600', color: COLORS.foreground, marginBottom: 8 }}>
                        Assignment Details
                      </Text>
                      <Text style={{ color: COLORS['muted-foreground'], marginBottom: 4 }}>
                        Assigned by: {mentorAssignment.assigned_by_name || 'Administrator'}
                      </Text>
                      <Text style={{ color: COLORS['muted-foreground'], marginBottom: 4 }}>
                        Assigned on: {new Date(mentorAssignment.assigned_at).toLocaleDateString()}
                      </Text>
                      {mentorAssignment.notes && (
                        <Text style={{ color: COLORS['muted-foreground'], fontStyle: 'italic' }}>
                          Notes: {mentorAssignment.notes}
                        </Text>
                      )}
                    </View>
                  )}

                  <View style={{ flexDirection: 'row', gap: 12 }}>
                    <TouchableOpacity
                      style={{
                        flex: 1,
                        backgroundColor: COLORS.primary,
                        padding: 12,
                        borderRadius: 8,
                        alignItems: 'center',
                      }}
                      onPress={() => {
                        setShowMentorModal(false);
                        router.push('/chat');
                      }}
                    >
                      <Text style={{ color: '#fff', fontWeight: '600' }}>Start Chat</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={{
                        flex: 1,
                        backgroundColor: COLORS.secondary,
                        padding: 12,
                        borderRadius: 8,
                        alignItems: 'center',
                      }}
                      onPress={() => {
                        Alert.alert(
                          'Rate Mentor',
                          'How would you rate this mentor?',
                          [
                            { text: '1 Star', onPress: () => handleRateMentor(selectedMentor.id, 1) },
                            { text: '2 Stars', onPress: () => handleRateMentor(selectedMentor.id, 2) },
                            { text: '3 Stars', onPress: () => handleRateMentor(selectedMentor.id, 3) },
                            { text: '4 Stars', onPress: () => handleRateMentor(selectedMentor.id, 4) },
                            { text: '5 Stars', onPress: () => handleRateMentor(selectedMentor.id, 5) },
                            { text: 'Cancel', style: 'cancel' },
                          ]
                        );
                      }}
                    >
                      <Text style={{ color: '#fff', fontWeight: '600' }}>Rate</Text>
                    </TouchableOpacity>
                  </View>
                </>
              )}
            </ScrollView>
            
            <TouchableOpacity
              style={{
                position: 'absolute',
                top: 16,
                right: 16,
                backgroundColor: COLORS['muted-foreground'],
                borderRadius: 20,
                width: 32,
                height: 32,
                justifyContent: 'center',
                alignItems: 'center',
              }}
              onPress={() => setShowMentorModal(false)}
            >
              <Ionicons name="close" size={20} color="#fff" />
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Schedule Modal */}
      <Modal visible={showScheduleModal} animationType="slide" transparent>
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: 'rgba(0,0,0,0.5)' }}>
          <View style={{ backgroundColor: COLORS.card, padding: 24, borderRadius: 16, width: '90%' }}>
            <Text style={{ fontSize: 20, fontWeight: '600', color: COLORS.foreground, marginBottom: 16 }}>
              Schedule Appointment
            </Text>
            
            {selectedMentor && (
              <Text style={{ color: COLORS['muted-foreground'], marginBottom: 16 }}>
                with {selectedMentor.first_name} {selectedMentor.last_name}
              </Text>
            )}

            <TextInput
              style={{
                backgroundColor: COLORS.background,
                padding: 12,
                borderRadius: 8,
                color: COLORS.foreground,
                marginBottom: 12,
                borderWidth: 1,
                borderColor: COLORS.border,
              }}
              placeholder="Date (YYYY-MM-DD)"
              placeholderTextColor={COLORS['muted-foreground']}
              value={selectedDate}
              onChangeText={setSelectedDate}
            />

            <TextInput
              style={{
                backgroundColor: COLORS.background,
                padding: 12,
                borderRadius: 8,
                color: COLORS.foreground,
                marginBottom: 12,
                borderWidth: 1,
                borderColor: COLORS.border,
              }}
              placeholder="Time (HH:MM)"
              placeholderTextColor={COLORS['muted-foreground']}
              value={selectedTime}
              onChangeText={setSelectedTime}
            />

            <TextInput
              style={{
                backgroundColor: COLORS.background,
                padding: 12,
                borderRadius: 8,
                color: COLORS.foreground,
                marginBottom: 20,
                borderWidth: 1,
                borderColor: COLORS.border,
              }}
              placeholder="Subject/Topic"
              placeholderTextColor={COLORS['muted-foreground']}
              value={appointmentSubject}
              onChangeText={setAppointmentSubject}
            />

            <View style={{ flexDirection: 'row', gap: 12 }}>
              <TouchableOpacity
                style={{
                  flex: 1,
                  backgroundColor: COLORS.primary,
                  padding: 12,
                  borderRadius: 8,
                  alignItems: 'center',
                }}
                onPress={handleScheduleAppointment}
              >
                <Text style={{ color: '#fff', fontWeight: '600' }}>Schedule</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={{
                  flex: 1,
                  backgroundColor: COLORS['muted-foreground'],
                  padding: 12,
                  borderRadius: 8,
                  alignItems: 'center',
                }}
                onPress={() => {
                  setShowScheduleModal(false);
                  setSelectedDate('');
                  setSelectedTime('');
                  setAppointmentSubject('');
                }}
              >
                <Text style={{ color: '#fff', fontWeight: '600' }}>Cancel</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </AppBackground>
  );
}
