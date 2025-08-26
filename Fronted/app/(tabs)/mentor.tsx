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
  Image,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import AppBackground from '../../components/AppBackground';
import { COLORS } from '../../constants/theme';
import { useAuth } from '../../contexts/AuthContext';
import apiService, { User } from '../../services/api';

interface MentorScreenProps {}

export default function MentorScreen({}: MentorScreenProps) {
  const { user } = useAuth();
  const [selectedTab, setSelectedTab] = useState<'mentors' | 'appointments' | 'messages'>('mentors');
  const [mentors, setMentors] = useState<User[]>([]);
  const [appointments, setAppointments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedMentor, setSelectedMentor] = useState<User | null>(null);
  const [showMentorModal, setShowMentorModal] = useState(false);
  const [showScheduleModal, setShowScheduleModal] = useState(false);
  const [selectedDate, setSelectedDate] = useState('');
  const [selectedTime, setSelectedTime] = useState('');
  const [appointmentSubject, setAppointmentSubject] = useState('');

  useEffect(() => {
    loadMentorData();
  }, []);

  const loadMentorData = async () => {
    try {
      setLoading(true);
      const mentorsData = await apiService.getMentors();
      console.log('Mentors data:', mentorsData); // Debug log
      // Ensure mentorsData is always an array
      setMentors(Array.isArray(mentorsData) ? mentorsData : []);
      
      // For now, we'll use mock appointments since we haven't built the appointment system yet
      setAppointments([
        {
          id: '1',
          mentorId: '1',
          mentorName: 'John Doe',
          date: '2024-01-15',
          time: '14:00',
          status: 'scheduled',
          subject: 'Mathematics',
        },
        {
          id: '2',
          mentorId: '2',
          mentorName: 'Jane Smith',
          date: '2024-01-16',
          time: '10:00',
          status: 'completed',
          subject: 'Physics',
        },
      ]);
    } catch (error) {
      console.error('Error loading mentor data:', error);
      Alert.alert('Error', 'Failed to load mentor data');
    } finally {
      setLoading(false);
    }
  };

  const handleRateMentor = async (mentorId: string, rating: number) => {
    try {
      await apiService.rateMentor(mentorId, rating);
      Alert.alert('Success', 'Rating submitted successfully!');
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
      Alert.alert('Success', 'Appointment scheduled successfully!');
      setShowScheduleModal(false);
      setSelectedDate('');
      setSelectedTime('');
      setAppointmentSubject('');
      loadMentorData();
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

  const renderMentorCard = (mentor: User) => (
    <TouchableOpacity
      key={mentor.id}
      style={{
        backgroundColor: COLORS.card,
        padding: 16,
        borderRadius: 12,
        marginBottom: 12,
        flexDirection: 'row',
        alignItems: 'center',
      }}
      onPress={() => {
        setSelectedMentor(mentor);
        setShowMentorModal(true);
      }}
    >
      <View
        style={{
          width: 50,
          height: 50,
          borderRadius: 25,
          backgroundColor: COLORS.primary,
          justifyContent: 'center',
          alignItems: 'center',
          marginRight: 12,
        }}
      >
        <Text style={{ color: '#fff', fontSize: 18, fontWeight: 'bold' }}>
          {mentor.first_name?.[0]}{mentor.last_name?.[0]}
        </Text>
      </View>
      
      <View style={{ flex: 1 }}>
        <Text style={{ fontSize: 16, fontWeight: '600', color: COLORS.foreground }}>
          {mentor.first_name} {mentor.last_name}
        </Text>
        <Text style={{ color: COLORS['muted-foreground'], marginTop: 2 }}>
          Level {mentor.level} • {mentor.class_name}
        </Text>
        <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 4 }}>
          {renderStars(mentor.rating || 0)}
          <Text style={{ color: COLORS['muted-foreground'], marginLeft: 8, fontSize: 12 }}>
            ({mentor.total_ratings || 0} reviews)
          </Text>
        </View>
      </View>
      
      <TouchableOpacity
        style={{
          backgroundColor: COLORS.primary,
          padding: 8,
          borderRadius: 8,
        }}
        onPress={() => {
          setSelectedMentor(mentor);
          setShowScheduleModal(true);
        }}
      >
        <Text style={{ color: '#fff', fontSize: 12, fontWeight: '600' }}>
          Schedule
        </Text>
      </TouchableOpacity>
    </TouchableOpacity>
  );

  const renderAppointmentCard = (appointment: any) => (
    <View
      key={appointment.id}
      style={{
        backgroundColor: COLORS.card,
        padding: 16,
        borderRadius: 12,
        marginBottom: 12,
      }}
    >
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
        <View>
          <Text style={{ fontSize: 16, fontWeight: '600', color: COLORS.foreground }}>
            {appointment.mentorName}
          </Text>
          <Text style={{ color: COLORS['muted-foreground'], marginTop: 2 }}>
            {appointment.subject}
          </Text>
          <Text style={{ color: COLORS['muted-foreground'], fontSize: 12, marginTop: 2 }}>
            {appointment.date} at {appointment.time}
          </Text>
        </View>
        
        <View
          style={{
            backgroundColor: appointment.status === 'completed' ? '#2ecc71' : 
                           appointment.status === 'cancelled' ? '#e74c3c' : '#f39c12',
            paddingHorizontal: 8,
            paddingVertical: 4,
            borderRadius: 12,
          }}
        >
          <Text style={{ color: '#fff', fontSize: 10, fontWeight: '600', textTransform: 'capitalize' }}>
            {appointment.status}
          </Text>
        </View>
      </View>
    </View>
  );

  const renderTabContent = () => {
    switch (selectedTab) {
      case 'mentors':
        return (
          <View>
            {!mentors || mentors.length === 0 ? (
              <View style={{ padding: 20, backgroundColor: COLORS.card, borderRadius: 12 }}>
                <Text style={{ color: COLORS['muted-foreground'], textAlign: 'center' }}>
                  No mentors available
                </Text>
              </View>
            ) : (
              mentors.map(renderMentorCard)
            )}
          </View>
        );
      
      case 'appointments':
        return (
          <View>
            {!appointments || appointments.length === 0 ? (
              <View style={{ padding: 20, backgroundColor: COLORS.card, borderRadius: 12 }}>
                <Text style={{ color: COLORS['muted-foreground'], textAlign: 'center' }}>
                  No appointments scheduled
                </Text>
              </View>
            ) : (
              appointments.map(renderAppointmentCard)
            )}
          </View>
        );
      
      case 'messages':
        return (
          <View style={{ padding: 20, backgroundColor: COLORS.card, borderRadius: 12 }}>
            <Text style={{ color: COLORS['muted-foreground'], textAlign: 'center' }}>
              Messaging system will be implemented in the next phase
            </Text>
          </View>
        );
      
      default:
        return null;
    }
  };

  if (loading) {
    return (
      <AppBackground>
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
          <ActivityIndicator size="large" color={COLORS.primary} />
          <Text style={{ color: COLORS.foreground, marginTop: 16 }}>Loading mentors...</Text>
        </View>
      </AppBackground>
    );
  }

  return (
    <AppBackground>
      <ScrollView style={{ flex: 1, padding: 16, paddingTop: 60 }}>
          {/* Header */}
          <View style={{ marginBottom: 24 }}>
                    <Text style={{ fontSize: 28, fontWeight: 'bold', color: COLORS.foreground, marginBottom: 8 }}>
          Mentor Hub
        </Text>
        <Text style={{ fontSize: 16, color: COLORS['muted-foreground'] }}>
          Connect with your mentors and track progress
        </Text>
          </View>

          {/* Tab Navigation */}
          <View style={{ flexDirection: 'row', backgroundColor: COLORS.card, borderRadius: 12, padding: 4, marginBottom: 24 }}>
            {[
              { key: 'mentors', label: 'Mentors', icon: 'people' },
              { key: 'appointments', label: 'Appointments', icon: 'calendar' },
              { key: 'messages', label: 'Messages', icon: 'chatbubbles' },
            ].map((tab) => (
              <TouchableOpacity
                key={tab.key}
                style={{
                  flex: 1,
                  backgroundColor: selectedTab === tab.key ? COLORS.primary : 'transparent',
                  paddingVertical: 12,
                  paddingHorizontal: 16,
                  borderRadius: 8,
                  alignItems: 'center',
                  flexDirection: 'row',
                  justifyContent: 'center',
                }}
                onPress={() => setSelectedTab(tab.key as any)}
              >
                <Ionicons
                  name={tab.icon as any}
                  size={16}
                  color={selectedTab === tab.key ? '#fff' : COLORS['muted-foreground']}
                  style={{ marginRight: 6 }}
                />
                <Text
                  style={{
                    color: selectedTab === tab.key ? '#fff' : COLORS['muted-foreground'],
                    fontWeight: selectedTab === tab.key ? '600' : '400',
                    fontSize: 14,
                  }}
                >
                  {tab.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* Tab Content */}
          {renderTabContent()}
      </ScrollView>

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
                        Level {selectedMentor.level} • {selectedMentor.class_name}
                      </Text>
                      <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 8 }}>
                        {renderStars(selectedMentor.rating || 0)}
                        <Text style={{ color: COLORS['muted-foreground'], marginLeft: 8 }}>
                          ({selectedMentor.total_ratings || 0} reviews)
                        </Text>
                      </View>
                    </View>

                    <View style={{ marginBottom: 20 }}>
                      <Text style={{ fontSize: 16, fontWeight: '600', color: COLORS.foreground, marginBottom: 8 }}>
                        Contact Information
                      </Text>
                      <Text style={{ color: COLORS['muted-foreground'], marginBottom: 4 }}>
                        Email: {selectedMentor.email}
                      </Text>
                      {selectedMentor.phone_number && (
                        <Text style={{ color: COLORS['muted-foreground'] }}>
                          Phone: {selectedMentor.phone_number}
                        </Text>
                      )}
                    </View>

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
                          setShowScheduleModal(true);
                        }}
                      >
                        <Text style={{ color: '#fff', fontWeight: '600' }}>Schedule Meeting</Text>
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
                  backgroundColor: COLORS.input,
                  padding: 12,
                  borderRadius: 8,
                  color: COLORS.foreground,
                  marginBottom: 12,
                }}
                placeholder="Date (YYYY-MM-DD)"
                placeholderTextColor={COLORS['muted-foreground']}
                value={selectedDate}
                onChangeText={setSelectedDate}
              />

              <TextInput
                style={{
                  backgroundColor: COLORS.input,
                  padding: 12,
                  borderRadius: 8,
                  color: COLORS.foreground,
                  marginBottom: 12,
                }}
                placeholder="Time (HH:MM)"
                placeholderTextColor={COLORS['muted-foreground']}
                value={selectedTime}
                onChangeText={setSelectedTime}
              />

              <TextInput
                style={{
                  backgroundColor: COLORS.input,
                  padding: 12,
                  borderRadius: 8,
                  color: COLORS.foreground,
                  marginBottom: 20,
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