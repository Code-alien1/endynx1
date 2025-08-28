import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  Alert,
  ActivityIndicator,
  StyleSheet,
  RefreshControl,
  Modal,
  TextInput,
  Platform,
} from 'react-native';
// import { Picker } from '@react-native-picker/picker';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import AppBackground from '../../components/AppBackground';
import ExpoCameraFaceAuth from '../../components/ExpoCameraFaceAuth';
import { COLORS } from '../../constants/theme';
import { useAuth } from '../../contexts/AuthContext';
import apiService, { AttendanceSession, AttendanceRecord } from '../../services/api';
import { getRolePermissions } from '../../utils/roleRedirect';

export default function AttendanceScreen() {
  const { user } = useAuth();
  const [sessions, setSessions] = useState<AttendanceSession[]>([]);
  const [attendanceRecords, setAttendanceRecords] = useState<AttendanceRecord[]>([]);
  const [classes, setClasses] = useState<any[]>([]);
  const [selectedClass, setSelectedClass] = useState<string>('');
  const [activeTab, setActiveTab] = useState<'sessions' | 'records'>('sessions');
  const [currentTime, setCurrentTime] = useState(new Date());
  const [showFaceAuth, setShowFaceAuth] = useState(false);
  const [selectedSession, setSelectedSession] = useState<AttendanceSession | null>(null);
  const [showRegisterFace, setShowRegisterFace] = useState(false);
  const [showCreateSession, setShowCreateSession] = useState(false);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedSubject, setSelectedSubject] = useState('');
  const [studentAttendanceList, setStudentAttendanceList] = useState<any[]>([]);
  // Tick state to re-render countdown timers
  const [tick, setTick] = useState(0);
  // Record detail modal state
  const [showRecordDetail, setShowRecordDetail] = useState(false);
  const [selectedRecord, setSelectedRecord] = useState<AttendanceRecord | null>(null);
  // Web-only dropdown state for session type
  const [showSessionTypeDropdown, setShowSessionTypeDropdown] = useState(false);
  const [sessionForm, setSessionForm] = useState({
    classId: '',
    className: '',
    subject: '',
    sessionType: 'morning',
    startTime: '',
    endTime: '',
    location: ''
  });

  if (!user) return null;
  
  const permissions = getRolePermissions(user.role);

  useEffect(() => {
    loadAttendanceData();
  }, [user]);

  useEffect(() => {
    // Update current time every second for countdown timers
    const timer = setInterval(() => {
      setCurrentTime(new Date());
      setTick(prev => prev + 1); // Force re-render for countdown timers
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    // Auto-refresh data every 30 seconds to keep attendance lists updated
    const refreshTimer = setInterval(() => {
      loadAttendanceData();
    }, 30000);
    return () => clearInterval(refreshTimer);
  }, []);

  // Lightweight tick each second to refresh countdown UI
  useEffect(() => {
    const t = setInterval(() => setTick((v) => v + 1), 1000);
    return () => clearInterval(t);
  }, []);

  const loadAttendanceData = async () => {
    try {
      setLoading(true);
      console.log('=== LOADING ATTENDANCE DATA ===');
      console.log('User:', user.username, 'Role:', user.role, 'Class:', user.class_name);
      
      const promises: Promise<any>[] = [
        apiService.getAttendanceSessions(),
        apiService.getAttendanceRecords(),
      ];
      
      // Load classes if user is teacher
      if (user.role === 'teacher') {
        console.log('Loading predefined classes for teacher...');
        promises.push(apiService.getPredefinedClasses().catch(err => {
          console.error('Failed to load predefined classes:', err);
          return { classes: [] };
        }));
      }
      
      console.log('Making API calls...');
      const results = await Promise.all(promises);
      console.log('API Results received:', results.length, 'promises');
      
      // Handle paginated response from backend
      let sessionsResponse = results[0];
      let allSessions: AttendanceSession[] = [];
      
      if (sessionsResponse && typeof sessionsResponse === 'object') {
        // Check if it's a paginated response with results array
        if ('results' in sessionsResponse && Array.isArray(sessionsResponse.results)) {
          allSessions = sessionsResponse.results as AttendanceSession[];
          console.log('Paginated response - extracted sessions from results array');
        } else if (Array.isArray(sessionsResponse)) {
          allSessions = sessionsResponse as AttendanceSession[];
          console.log('Direct array response');
        }
      }
      
      console.log('Raw sessions from API:', JSON.stringify(allSessions, null, 2));
      console.log('Sessions count:', allSessions.length);
      console.log('User role:', user.role, 'User class:', user.class_name);
      
      // Log detailed session information for debugging
      allSessions.forEach((session, index) => {
        console.log(`Session ${index + 1}:`, {
          id: session.id,
          class_name: session.class_name,
          date: session.date,
          start_time: session.start_time,
          end_time: session.end_time,
          is_active: session.is_active,
          created_at: session.created_at,
          session_type: session.session_type
        });
      });
      
      // Students now see all ongoing sessions like teachers, but can only mark attendance for their class
      if (user.role === 'student') {
        console.log(`Student sees all ${allSessions.length} sessions`);
        // Check which sessions are active for debugging
        console.log('=== DEBUGGING SESSION ACTIVITY ===');
        allSessions.forEach((session, index) => {
          const isActive = isSessionActive(session);
          console.log(`Session ${index + 1} (${session.class_name}): ${isActive ? 'ACTIVE' : 'INACTIVE'}`);
        });
        
        const activeSessions = allSessions.filter(session => isSessionActive(session));
        console.log(`Active sessions: ${activeSessions.length}`);
        const userClassSessions = allSessions.filter(session => session.class_name === user.class_name);
        console.log(`Sessions for user's class (${user.class_name}): ${userClassSessions.length}`);
        const activeUserClassSessions = allSessions.filter(session => 
          session.class_name === user.class_name && isSessionActive(session)
        );
        console.log(`Active sessions for user's class: ${activeUserClassSessions.length}`);
        console.log('=== END DEBUGGING ===');
      } else if (user.role === 'teacher') {
        console.log(`Teacher sees all ${allSessions.length} sessions`);
      }
      
      setSessions(allSessions);
      setAttendanceRecords(Array.isArray(results[1]) ? results[1] as AttendanceRecord[] : []);
      
      if (user.role === 'teacher') {
        if (results[2]) {
          // Handle predefined classes response structure
          const classesData = results[2] as any;
          console.log('Raw classes response:', classesData);
          const classesArray = classesData?.classes || [];
          console.log('Extracted classes array:', classesArray);
          setClasses(Array.isArray(classesArray) ? classesArray : []);
        } else {
          // Fallback to mock data if API fails - but don't set classes since they won't have valid UUIDs
          console.log('No classes data received, API may have failed');
          setClasses([]);
        }
      }
      
      // Load student attendance for selected class if teacher
      if (user.role === 'teacher' && selectedClass) {
        loadStudentAttendance(selectedClass);
      }
    } catch (error) {
      console.error('Error loading attendance data:', error);
      Alert.alert('Error', 'Failed to load attendance data');
    } finally {
      setLoading(false);
    }
  };

  const loadStudentAttendance = async (className: string) => {
    try {
      // Mock data for student attendance list
      const mockStudentAttendance = [
        { id: 1, name: 'John Doe', status: 'present', time: '09:15 AM' },
        { id: 2, name: 'Jane Smith', status: 'present', time: '09:12 AM' },
        { id: 3, name: 'Mike Johnson', status: 'absent', time: null },
        { id: 4, name: 'Sarah Wilson', status: 'late', time: '09:25 AM' },
        { id: 5, name: 'David Brown', status: 'present', time: '09:10 AM' },
      ];
      setStudentAttendanceList(mockStudentAttendance);
    } catch (error) {
      console.error('Error loading student attendance:', error);
    }
  };

  const handleCreateSession = async () => {
    // For web: if user typed class name but no classId yet, try to resolve from loaded classes
    if (Platform.OS === 'web' && !sessionForm.classId && sessionForm.className) {
      const match = (classes || []).find((c: any) => String(c.label || c.name || c.class_name || '').trim().toLowerCase() === sessionForm.className.trim().toLowerCase());
      if (match) {
        setSessionForm(prev => ({ ...prev, classId: match.value || match.id || match.pk || '' }));
      } else {
        alert('Error: No class found with that name. Please ensure it matches exactly or use the class selector on mobile.');
        return;
      }
    }

    if (!sessionForm.classId || !sessionForm.startTime || !sessionForm.endTime) {
      Alert.alert('Error', 'Please select/enter a class and provide start and end times');
      return;
    }

    // Platform-specific confirmation for session creation
    if (Platform.OS === 'web') {
      const confirmed = window.confirm(
        `Create attendance session for ${sessionForm.className} - ${sessionForm.subject}?\n\n` +
        `Time: ${sessionForm.startTime} - ${sessionForm.endTime}\n` +
        `Students will have 15 minutes to mark attendance after creation.`
      );
      if (!confirmed) return;
    } else {
      // Show confirmation alert on mobile
      return new Promise<void>((resolve) => {
        Alert.alert(
          'Create Session',
          `Create attendance session for ${sessionForm.className} - ${sessionForm.subject}?\n\n` +
          `Time: ${sessionForm.startTime} - ${sessionForm.endTime}\n` +
          `Students will have 15 minutes to mark attendance after creation.`,
          [
            { text: 'Cancel', style: 'cancel', onPress: () => resolve() },
            { 
              text: 'Create Session', 
              onPress: () => {
                resolve();
                createSessionAfterConfirmation();
              }
            }
          ]
        );
      });
    }

    // For web, proceed directly after confirmation
    if (Platform.OS === 'web') {
      await createSessionAfterConfirmation();
    }
  };

  const createSessionAfterConfirmation = async () => {
    try {
      // Always try to get the proper UUID for the class
      let classId = sessionForm.classId;
      const className = sessionForm.className;
      
      console.log('Initial session form:', { classId, className });
      
      // Check if classId looks like a UUID (contains hyphens and is longer than 10 chars)
      const isUUID = classId && classId.includes('-') && classId.length > 10;
      
      if (!isUUID || !classId) {
        console.log('ClassId is not a valid UUID, attempting to find UUID...');
        
        // First try to get fresh classes from API
        try {
          const classesResponse = await apiService.getPredefinedClasses();
          const apiClasses = classesResponse?.classes || [];
          console.log('Available classes from API:', apiClasses);
          
          // Try to match by className or classId
          const apiMatch = apiClasses.find((c: any) => {
            const classLabel = c.label || c.name || '';
            return classLabel === className || classLabel === classId;
          });
          
          if (apiMatch && apiMatch.value) {
            classId = apiMatch.value;
            console.log(`Found class UUID from API: ${classId} for class: ${className}`);
          } else {
            // Try to find from loaded classes as fallback
            const matchedClass = classes.find((c: any) => {
              const classLabel = c.label || c.name || '';
              return classLabel === className || classLabel === classId;
            });
            
            if (matchedClass && matchedClass.value && matchedClass.value.includes('-')) {
              classId = matchedClass.value;
              console.log(`Found class UUID from loaded classes: ${classId}`);
            } else {
              throw new Error(`Cannot find UUID for class "${className}". Available classes: ${apiClasses.map(c => c.label).join(', ')}`);
            }
          }
        } catch (apiError) {
          console.error('Failed to get class UUID from API:', apiError);
          throw new Error(`Failed to validate class selection. Please try again or contact support.`);
        }
      }

      const sessionData = {
        class_obj: classId,
        session_type: sessionForm.sessionType,
        date: new Date().toISOString().split('T')[0],
        start_time: sessionForm.startTime,
        end_time: sessionForm.endTime,
        is_active: true,
        created_by: user.id
      };
      
      console.log('Sending session data:', sessionData);
      const newSession = await apiService.createAttendanceSession(sessionData);
      
      setShowCreateSession(false);
      setSessionForm({
        classId: '',
        className: '',
        subject: '',
        sessionType: 'morning',
        startTime: '',
        endTime: '',
        location: ''
      });
      
      if (Platform.OS === 'web') {
        alert('Session created successfully!');
      } else {
        Alert.alert('Success', 'Session created successfully!');
      }
      
      await loadAttendanceData(); // Refresh sessions list
    } catch (error: any) {
      console.error('Error creating session:', error);
      console.error('Error response:', error.response?.data);
      console.error('Session form data:', sessionForm);
      
      let errorMessage = 'Failed to create session';
      if (error.response?.data?.message) {
        errorMessage = error.response.data.message;
      } else if (error.response?.data?.error) {
        errorMessage = error.response.data.error;
      } else if (error.response?.data) {
        // Show validation errors if available
        const errors = error.response.data;
        if (typeof errors === 'object') {
          errorMessage = Object.values(errors).flat().join(', ');
          
          // Handle unique constraint error specifically
          if (errorMessage.includes('unique') || errorMessage.includes('already exists') || errorMessage.includes('must make a unique set')) {
            errorMessage = `A session for class "${sessionForm.className}" on ${new Date().toLocaleDateString()} with "${sessionForm.sessionType}" session type already exists. Please choose a different session type or modify the existing session.`;
          }
        } else {
          errorMessage = String(errors);
        }
      } else if (error.message) {
        errorMessage = error.message;
      }
      
      if (Platform.OS === 'web') {
        alert(`Error: ${errorMessage}`);
      } else {
        Alert.alert('Error', errorMessage);
      }
    }
  };

  const handleClassSelection = (className: string) => {
    setSelectedClass(className);
    if (className) {
      loadStudentAttendance(className);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadAttendanceData();
    setRefreshing(false);
  };

  const handleRegisterFace = () => {
    setShowRegisterFace(true);
  };

  const handleFaceRegisterSuccess = () => {
    setShowRegisterFace(false);
    Alert.alert('Success', 'Face registered successfully! You can now use face recognition for attendance.');
  };

  const isSessionActive = (session: AttendanceSession): boolean => {
    const now = new Date();
    const sessionDate = new Date(session.date);
    const [startHours, startMinutes] = session.start_time.split(':').map(Number);
    const [endHours, endMinutes] = session.end_time.split(':').map(Number);
    
    const startTime = new Date(sessionDate);
    startTime.setHours(startHours, startMinutes, 0, 0);
    
    const endTime = new Date(sessionDate);
    endTime.setHours(endHours, endMinutes, 0, 0);
    
    // Session is active if current time is between start and end time, and session is marked as active
    const isWithinTimeWindow = now >= startTime && now <= endTime;
    const isActive = isWithinTimeWindow && session.is_active;
    
    // Only log once per session to avoid spam
    if (!(session as any)._debugLogged) {
      console.log(`Session ${session.id} (${session.class_name}):`, {
        now: now.toLocaleString(),
        startTime: startTime.toLocaleString(),
        endTime: endTime.toLocaleString(),
        isWithinTimeWindow,
        sessionIsActive: session.is_active,
        finalResult: isActive
      });
      (session as any)._debugLogged = true;
    }
    
    return isActive;
  };

  const handleDeleteSession = async (sessionId: string) => {
    try {
      // Show confirmation dialog
      Alert.alert(
        'Delete Session',
        'Are you sure you want to delete this session? This action cannot be undone.',
        [
          { text: 'Cancel', style: 'cancel' },
          {
            text: 'Delete',
            style: 'destructive',
            onPress: async () => {
              try {
                await apiService.deleteAttendanceSession(sessionId);
                Alert.alert('Success', 'Session deleted successfully!');
                await loadAttendanceData(); // Refresh the list
              } catch (error: any) {
                console.error('Error deleting session:', error);
                Alert.alert('Error', 'Failed to delete session. Please try again.');
              }
            }
          }
        ]
      );
    } catch (error: any) {
      console.error('Error in delete session:', error);
      Alert.alert('Error', 'An unexpected error occurred.');
    }
  };

  const handleMarkAttendance = (session: AttendanceSession) => {
    if (!isSessionActive(session)) {
      Alert.alert(
        'Session Not Available', 
        'You can only mark attendance within 15 minutes of session creation.',
        [{ text: 'OK' }]
      );
      return;
    }

    // Check if student can mark attendance for this session (only their class)
    if (user.role === 'student' && user.class_name && session.class_name !== user.class_name) {
      Alert.alert(
        'Cannot Mark Attendance',
        `You can only mark attendance for your enrolled class (${user.class_name}). This session is for ${session.class_name}.`,
        [{ text: 'OK' }]
      );
      return;
    }
    
    setSelectedSession(session);
    setShowFaceAuth(true);
  };

  const handleQuickAttendance = () => {
    // Find today's active sessions for the student's class
    const today = new Date().toISOString().split('T')[0];
    console.log('Quick attendance - checking for active sessions on:', today);
    console.log('User class:', user.class_name);
    console.log('All sessions:', sessions.length);
    
    const todaySessions = sessions.filter(session => {
      const sessionDate = session.date.split('T')[0]; // Handle both date formats
      const isToday = sessionDate === today;
      const isActive = isSessionActive(session);
      const isUserClass = !user.class_name || session.class_name === user.class_name;
      
      console.log(`Session ${session.id}: date=${sessionDate}, isToday=${isToday}, isActive=${isActive}, isUserClass=${isUserClass}`);
      
      return isToday && isActive && isUserClass;
    });
    
    console.log('Found active sessions for user:', todaySessions.length);
    
    if (todaySessions.length === 0) {
      Alert.alert(
        'No Active Sessions', 
        'There are no active sessions available for your class at this time.',
        [{ text: 'OK' }]
      );
      return;
    }
    
    if (todaySessions.length === 1) {
      // If only one session, mark attendance directly
      setSelectedSession(todaySessions[0]);
      setShowFaceAuth(true);
    } else {
      // If multiple sessions, show selection
      Alert.alert(
        'Multiple Sessions Available',
        'Please select a session from the list below to mark attendance.',
        [{ text: 'OK' }]
      );
    }
  };

  const handleFaceAuthSuccess = async (userData?: any, faceEncoding?: string, confidenceScore?: number) => {
    try {
      console.log('API: Marking attendance with face recognition', {
        sessionId: selectedSession?.id,
        endpoint: '/attendance/face-recognition/',
        location: 'Mobile App',
        faceEncoding: faceEncoding || 'mock_face_encoding',
        confidenceScore: confidenceScore || 0.95
      });
      
      // Ensure we have valid face encoding data
      if (!faceEncoding || faceEncoding === 'mock_face_encoding') {
        console.warn('No valid face encoding provided, using mock data for testing');
      }
      
      const response = await apiService.markAttendanceWithFaceRecognition(
        selectedSession!.id,
        faceEncoding || 'mock_face_encoding',
        confidenceScore || 0.95,
        'Mobile App'
      );
      
      console.log('Face recognition attendance response:', response);
      
      // Refresh data after successful attendance marking
      await loadAttendanceData();
      
      Alert.alert(
        'Success!',
        'Attendance marked successfully with face recognition.',
        [{ 
          text: 'OK',
          onPress: () => {
            setSelectedSession(null);
            setShowFaceAuth(false);
          }
        }]
      );
    } catch (error: any) {
      console.error('Face recognition attendance error:', error);
      console.error('Error details:', {
        status: error.response?.status,
        data: error.response?.data,
        message: error.message
      });
      
      let errorMessage = 'Failed to mark attendance. Please try again.';
      
      if (error.response?.data?.error) {
        errorMessage = error.response.data.error;
      } else if (error.response?.data?.errors) {
        // Handle serializer errors
        const errors = error.response.data.errors;
        errorMessage = Object.values(errors).flat().join(', ');
      }
      
      Alert.alert(
        'Error',
        errorMessage,
        [{ text: 'OK' }]
      );
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'present': return COLORS.primary;
      case 'absent': return COLORS.destructive;
      case 'late': return '#f59e0b';
      case 'excused': return '#6366f1';
      default: return COLORS['muted-foreground'];
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'present': return 'check-circle';
      case 'absent': return 'close-circle';
      case 'late': return 'clock';
      case 'excused': return 'information';
      default: return 'help-circle';
    }
  };

  const getTimeRemaining = (session: AttendanceSession) => {
    const now = currentTime; // Use the state-managed current time for real-time updates
    const sessionDate = new Date(session.date);
    const [hours, minutes] = session.end_time.split(':').map(Number);
    const endTime = new Date(sessionDate);
    endTime.setHours(hours, minutes, 0, 0);
    
    const timeDiff = endTime.getTime() - now.getTime();
    
    if (timeDiff <= 0) {
      return 'Expired';
    }
    
    const totalMinutes = Math.floor(timeDiff / (1000 * 60));
    const remainingHours = Math.floor(totalMinutes / 60);
    const remainingMinutes = totalMinutes % 60;
    const seconds = Math.floor((timeDiff % (1000 * 60)) / 1000);
    
    if (remainingHours > 0) {
      return `${remainingHours}h ${remainingMinutes}m left`;
    } else if (remainingMinutes > 5) {
      return `${remainingMinutes}m left`;
    } else if (remainingMinutes > 0) {
      return `${remainingMinutes}m ${seconds}s left`;
    }
    
    return `${seconds}s left`;
  };

  const renderSessionCard = (session: AttendanceSession) => {
    const isActive = isSessionActive(session);
    const timeRemaining = getTimeRemaining(session);
    
    return (
      <View key={session.id} style={[
        styles.sessionCard,
        isActive && styles.activeSessionCard
      ]}>
        {/* Header with Class and Status */}
        <View style={styles.sessionHeader}>
          <View style={styles.sessionTitleContainer}>
            <MaterialCommunityIcons 
              name="school" 
              size={20} 
              color={COLORS.primary} 
            />
            <Text style={styles.sessionTitle}>{session.class_name}</Text>
          </View>
          <View style={styles.sessionHeaderActions}>
            <View style={[
              styles.statusBadge, 
              { backgroundColor: isActive ? COLORS.success : COLORS['muted-foreground'] }
            ]}>
              <Text style={styles.statusText}>{isActive ? 'LIVE' : 'Ended'}</Text>
            </View>
            {/* Delete button for ended sessions (teachers only) */}
            {!isActive && user?.role === 'teacher' && (
              <TouchableOpacity
                style={styles.deleteButton}
                onPress={() => handleDeleteSession(session.id)}
              >
                <MaterialCommunityIcons 
                  name="delete" 
                  size={18} 
                  color={COLORS.destructive} 
                />
              </TouchableOpacity>
            )}
          </View>
        </View>
        
        {/* Prominent Countdown Timer */}
        {isActive && (
          <View style={styles.countdownContainer}>
            <MaterialCommunityIcons 
              name="timer-sand" 
              size={24} 
              color={COLORS.warning} 
            />
            <Text style={styles.countdownText}>{timeRemaining}</Text>
            <Text style={styles.countdownLabel}>Time Remaining</Text>
          </View>
        )}
        
        {/* Session Details */}
        <View style={styles.sessionDetailsGrid}>
          <View style={styles.detailItem}>
            <MaterialCommunityIcons name="calendar" size={16} color={COLORS['muted-foreground']} />
            <Text style={styles.detailText}>{new Date(session.date).toLocaleDateString()}</Text>
          </View>
          <View style={styles.detailItem}>
            <MaterialCommunityIcons name="clock" size={16} color={COLORS['muted-foreground']} />
            <Text style={styles.detailText}>{session.start_time} - {session.end_time}</Text>
          </View>
          <View style={styles.detailItem}>
            <MaterialCommunityIcons name="tag" size={16} color={COLORS['muted-foreground']} />
            <Text style={styles.detailText}>{session.session_type.charAt(0).toUpperCase() + session.session_type.slice(1)}</Text>
          </View>
          <View style={styles.detailItem}>
            <MaterialCommunityIcons name="account-group" size={16} color={COLORS['muted-foreground']} />
            <Text style={styles.detailText}>{session.attendance_count}/{session.total_students} Present</Text>
          </View>
        </View>

        {/* Progress Bar for Attendance */}
        <View style={styles.progressContainer}>
          <View style={styles.progressBar}>
            <View style={[
              styles.progressFill,
              { width: `${(session.attendance_count / Math.max(session.total_students, 1)) * 100}%` }
            ]} />
          </View>
          <Text style={styles.progressText}>
            {Math.round((session.attendance_count / Math.max(session.total_students, 1)) * 100)}% Attendance
          </Text>
        </View>

      {user.role === 'student' && (
        <View style={styles.actionButtons}>
          <TouchableOpacity
            style={[
              styles.primaryActionButton, 
              (!isSessionActive(session) || (user.class_name && session.class_name !== user.class_name)) && styles.disabledActionButton
            ]}
            onPress={() => handleMarkAttendance(session)}
            disabled={!isSessionActive(session) || Boolean(user.class_name && session.class_name !== user.class_name)}
          >
            <MaterialCommunityIcons 
              name="check-circle" 
              size={20} 
              color={(isSessionActive(session) && (!user.class_name || session.class_name === user.class_name)) ? "white" : "#666"} 
            />
            <Text style={[
              styles.primaryActionButtonText,
              (!isSessionActive(session) || (user.class_name && session.class_name !== user.class_name)) && styles.disabledActionButtonText
            ]}>
              {!isSessionActive(session) 
                ? 'Session Unavailable' 
                : (user.class_name && session.class_name !== user.class_name)
                  ? 'Not Your Class'
                  : 'Mark Attendance'
              }
            </Text>
          </TouchableOpacity>
        </View>
      )}

      {permissions.canManageAttendance && (
        <View style={styles.actionButtons}>
          <TouchableOpacity style={styles.actionButton}>
            <MaterialCommunityIcons name="qrcode-scan" size={20} color={COLORS.primary} />
            <Text style={styles.actionButtonText}>Generate QR</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.actionButton}>
            <MaterialCommunityIcons name="account-check" size={20} color={COLORS.primary} />
            <Text style={styles.actionButtonText}>Manual Entry</Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
    );
  };

  const renderRecordCard = (record: AttendanceRecord) => (
    <TouchableOpacity 
      key={record.id} 
      style={styles.recordCard}
      onPress={() => {
        setSelectedRecord(record);
        setShowRecordDetail(true);
      }}
    >
      <View style={styles.recordHeader}>
        <View style={styles.recordTitleContainer}>
          <MaterialCommunityIcons 
            name="book-open-variant" 
            size={20} 
            color={COLORS.primary} 
          />
          <Text style={styles.recordSubject}>
            {record.session_info?.split(' - ')[0] || 'Subject'}
          </Text>
        </View>
        <View style={[styles.statusBadge, { backgroundColor: getStatusColor(record.status) }]}>
          <MaterialCommunityIcons 
            name={getStatusIcon(record.status) as any} 
            size={16} 
            color="white" 
          />
          <Text style={styles.statusText}>{record.status}</Text>
        </View>
      </View>
      
      <View style={styles.recordInfo}>
        <View style={styles.recordDetailItem}>
          <MaterialCommunityIcons name="calendar" size={16} color={COLORS['muted-foreground']} />
          <Text style={styles.recordDetailText}>
            {new Date(record.timestamp).toLocaleDateString()}
          </Text>
        </View>
        <View style={styles.recordDetailItem}>
          <MaterialCommunityIcons name="clock" size={16} color={COLORS['muted-foreground']} />
          <Text style={styles.recordDetailText}>
            {new Date(record.timestamp).toLocaleTimeString()}
          </Text>
        </View>
        <View style={styles.recordDetailItem}>
          <MaterialCommunityIcons name="account-check" size={16} color={COLORS['muted-foreground']} />
          <Text style={styles.recordDetailText}>{record.method}</Text>
        </View>
      </View>

      <View style={styles.recordFooter}>
        <Text style={styles.recordClass}>{record.session_info}</Text>
        <MaterialCommunityIcons name="chevron-right" size={20} color={COLORS['muted-foreground']} />
      </View>
    </TouchableOpacity>
  );

  if (loading) {
    return (
      <AppBackground>
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color={COLORS.primary} />
          <Text style={styles.loadingText}>Loading attendance data...</Text>
        </View>
      </AppBackground>
    );
  }

  return (
    <AppBackground>
      <View style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Attendance</Text>
          <View style={styles.headerActions}>
            {user.role === 'student' && (
              <TouchableOpacity 
                style={styles.registerFaceButton}
                onPress={handleRegisterFace}
              >
                <MaterialCommunityIcons name="face-recognition" size={20} color={COLORS.primary} />
                <Text style={styles.registerFaceText}>Register Face</Text>
              </TouchableOpacity>
            )}
            {user.role === 'teacher' && (
              <TouchableOpacity 
                style={styles.createSessionButton}
                onPress={() => setShowCreateSession(true)}
              >
                <MaterialCommunityIcons name="plus-circle" size={20} color={COLORS.primary} />
                <Text style={styles.createSessionText}>Create Session</Text>
              </TouchableOpacity>
            )}
            <TouchableOpacity onPress={loadAttendanceData}>
              <MaterialCommunityIcons name="refresh" size={24} color={COLORS.primary} />
            </TouchableOpacity>
          </View>
        </View>

        {/* Teacher Class and Subject Selection */}
        {user.role === 'teacher' && (
          <View style={styles.teacherControls}>
            <View style={styles.pickerContainer}>
              <Text style={styles.pickerLabel}>Select Class:</Text>
              <View style={styles.pickerWrapper}>
                <TouchableOpacity 
                  style={styles.pickerButton}
                  onPress={() => {
                    console.log('Classes state when clicking:', classes);
                    console.log('Classes length:', classes?.length);
                    console.log('User role:', user.role);
                    const options = Array.isArray(classes) && classes.length > 0
                      ? classes.map((c: any) => ({ text: c.label || c.name || c.class_name || 'Unnamed', onPress: () => handleClassSelection(c.label || c.name || c.class_name || '') }))
                      : [{ text: 'No classes available', onPress: () => {} }];
                    Alert.alert('Select Class', 'Choose a class:', [
                      ...options,
                      { text: 'Cancel', style: 'cancel' },
                    ]);
                  }}
                >
                  <Text style={styles.pickerButtonText}>
                    {selectedClass || 'Select a class...'}
                  </Text>
                  <MaterialCommunityIcons name="chevron-down" size={20} color={COLORS['muted-foreground']} />
                </TouchableOpacity>
              </View>
            </View>
            
            <View style={styles.pickerContainer}>
              <Text style={styles.pickerLabel}>Select Subject:</Text>
              <View style={styles.pickerWrapper}>
                <TouchableOpacity 
                  style={styles.pickerButton}
                  onPress={() => {
                    Alert.alert(
                      'Select Subject',
                      'Choose a subject:',
                      [
                        { text: 'Mathematics', onPress: () => setSelectedSubject('mathematics') },
                        { text: 'Physics', onPress: () => setSelectedSubject('physics') },
                        { text: 'Chemistry', onPress: () => setSelectedSubject('chemistry') },
                        { text: 'Biology', onPress: () => setSelectedSubject('biology') },
                        { text: 'English', onPress: () => setSelectedSubject('english') },
                        { text: 'History', onPress: () => setSelectedSubject('history') },
                        { text: 'Cancel', style: 'cancel' }
                      ]
                    );
                  }}
                >
                  <Text style={styles.pickerButtonText}>
                    {selectedSubject || 'Select a subject...'}
                  </Text>
                  <MaterialCommunityIcons name="chevron-down" size={20} color={COLORS['muted-foreground']} />
                </TouchableOpacity>
              </View>
            </View>
          </View>
        )}

        {/* Tab Navigation */}
        <View style={styles.tabContainer}>
          <TouchableOpacity
            style={[styles.tab, activeTab === 'sessions' && styles.activeTab]}
            onPress={() => setActiveTab('sessions')}
          >
            <Text style={[styles.tabText, activeTab === 'sessions' && styles.activeTabText]}>
              Sessions
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.tab, activeTab === 'records' && styles.activeTab]}
            onPress={() => setActiveTab('records')}
          >
            <Text style={[styles.tabText, activeTab === 'records' && styles.activeTabText]}>
              {user.role === 'teacher' ? 'Attendance List' : 'Records'}
            </Text>
          </TouchableOpacity>
        </View>

        {/* Content */}
        <ScrollView
          style={styles.content}
          contentContainerStyle={styles.scrollContent}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
          }
          showsVerticalScrollIndicator={false}
        >
          {activeTab === 'sessions' ? (
            <View style={styles.sessionsContainer}>
              {/* Mark Attendance Card for Students */}
              {user.role === 'student' && (
                <View style={styles.markAttendanceCard}>
                  <View style={styles.cardHeader}>
                    <MaterialCommunityIcons name="face-recognition" size={24} color="hsl(200, 10%, 70%) " />
                    <Text style={styles.cardTitle}>Attendance</Text>
                  </View>
                  <Text style={styles.cardDescription}>
                    Mark your presence for today's classes.
                  </Text>
                  <TouchableOpacity
                    style={styles.markAttendanceButton}
                    onPress={handleQuickAttendance}
                  >
                    <MaterialCommunityIcons name="check-circle" size={20} color="white" />
                    <Text style={styles.markAttendanceButtonText}>Mark Attendance</Text>
                  </TouchableOpacity>
                </View>
              )}
              
              {sessions.length === 0 ? (
                <View style={styles.emptyState}>
                  <MaterialCommunityIcons name="calendar-blank" size={64} color={COLORS['muted-foreground']} />
                  <Text style={styles.emptyStateText}>No sessions available</Text>
                </View>
              ) : (
                <>
                  {/* Active Sessions Section */}
                  {sessions.filter(session => isSessionActive(session)).length > 0 && (
                    <View style={styles.sectionContainer}>
                      <View style={styles.sectionHeader}>
                        <MaterialCommunityIcons name="clock-fast" size={20} color={COLORS.warning} />
                        <Text style={styles.sectionTitle}>Active Sessions</Text>
                        <View style={styles.activeBadge}>
                          <Text style={styles.activeBadgeText}>
                            {sessions.filter(session => isSessionActive(session)).length}
                          </Text>
                        </View>
                      </View>
                      <View style={styles.sessionGrid}>
                        {sessions.filter(session => isSessionActive(session)).map(renderSessionCard)}
                      </View>
                    </View>
                  )}
                  
                  {/* Ended Sessions Section */}
                  {sessions.filter(session => !isSessionActive(session)).length > 0 && (
                    <View style={styles.sectionContainer}>
                      <View style={styles.sectionHeader}>
                        <MaterialCommunityIcons name="clock-end" size={20} color={COLORS['muted-foreground']} />
                        <Text style={styles.sectionTitle}>Ended Sessions</Text>
                        <View style={[styles.activeBadge, { backgroundColor: COLORS['muted-foreground'] }]}>
                          <Text style={styles.activeBadgeText}>
                            {sessions.filter(session => !isSessionActive(session)).length}
                          </Text>
                        </View>
                      </View>
                      <View style={styles.sessionGrid}>
                        {sessions.filter(session => !isSessionActive(session)).map(renderSessionCard)}
                      </View>
                    </View>
                  )}
                </>
              )}
            </View>
          ) : (
            <View style={styles.recordsContainer}>
              {user.role === 'teacher' ? (
                // Teacher Attendance List View
                <View>
                  {!selectedClass ? (
                    <View style={styles.emptyState}>
                      <MaterialCommunityIcons name="school" size={64} color={COLORS['muted-foreground']} />
                      <Text style={styles.emptyStateText}>Please select a class to view attendance</Text>
                    </View>
                  ) : (
                    <View>
                      <View style={styles.attendanceHeader}>
                        <Text style={styles.attendanceTitle}>Class {selectedClass} Attendance</Text>
                        <Text style={styles.attendanceSubtitle}>
                          {studentAttendanceList.filter(s => s.status === 'present').length} / {studentAttendanceList.length} Present
                        </Text>
                      </View>
                      
                      {studentAttendanceList.map((student) => (
                        <View key={student.id} style={styles.studentAttendanceCard}>
                          <View style={styles.studentInfo}>
                            <Text style={styles.studentName}>{student.name}</Text>
                            {student.time && (
                              <Text style={styles.studentTime}>Marked at: {student.time}</Text>
                            )}
                          </View>
                          <View style={[styles.statusBadge, { backgroundColor: getStatusColor(student.status) }]}>
                            <MaterialCommunityIcons 
                              name={getStatusIcon(student.status) as any} 
                              size={16} 
                              color="white" 
                            />
                            <Text style={styles.statusText}>{student.status}</Text>
                          </View>
                        </View>
                      ))}
                    </View>
                  )}
                </View>
              ) : (
                // Student Records View
                <View>
                  {attendanceRecords.length === 0 ? (
                    <View style={styles.emptyState}>
                      <MaterialCommunityIcons name="clipboard-text" size={64} color={COLORS['muted-foreground']} />
                      <Text style={styles.emptyStateText}>No attendance records</Text>
                    </View>
                  ) : (
                    attendanceRecords.map(renderRecordCard)
                  )}
                </View>
              )}
            </View>
          )}
        </ScrollView>
      </View>

      {/* Face Registration Modal */}
      <ExpoCameraFaceAuth
        visible={showRegisterFace}
        onClose={() => setShowRegisterFace(false)}
        onSuccess={handleFaceRegisterSuccess}
        mode="register"
        title="Register Your Face"
        subtitle="Position your face in the camera to register for attendance"
      />

      {/* Face Authentication Modal for Attendance */}
      <ExpoCameraFaceAuth
        visible={showFaceAuth}
        onClose={() => setShowFaceAuth(false)}
        onSuccess={handleFaceAuthSuccess}
        mode="attendance"
        title="Mark Attendance"
        subtitle="Use face recognition to mark your attendance"
      />

      {/* Create Session Modal */}
      <Modal
        visible={showCreateSession}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setShowCreateSession(false)}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Create New Session</Text>
            <TouchableOpacity onPress={() => setShowCreateSession(false)}>
              <MaterialCommunityIcons name="close" size={24} color={COLORS.foreground} />
            </TouchableOpacity>
          </View>
          
          <ScrollView style={styles.modalContent}>
            {/* Class picker: on web allow manual class name input; on mobile keep selector */}
            {Platform.OS === 'web' ? (
              <View style={styles.formGroup}>
                <Text style={styles.formLabel}>Class Name *</Text>
                <TextInput
                  style={styles.formInput}
                  value={sessionForm.className}
                  onChangeText={(text) => {
                    // Clear classId when manually typing to force UUID lookup later
                    setSessionForm(prev => ({ ...prev, className: text, classId: '' }));
                  }}
                  placeholder="Enter exact class name (e.g., Class 10A)"
                  placeholderTextColor={COLORS['muted-foreground']}
                />
              </View>
            ) : (
              <View style={styles.formGroup}>
                <Text style={styles.formLabel}>Class *</Text>
                <TouchableOpacity
                  style={styles.formInput}
                  onPress={() => {
                    const options = Array.isArray(classes) && classes.length > 0
                      ? classes.map((c: any) => ({
                          text: c.label || c.name || c.class_name || 'Unnamed',
                          onPress: () => setSessionForm(prev => ({ ...prev, classId: c.value || c.id || c.pk || '', className: c.label || c.name || c.class_name || '' }))
                        }))
                      : [{ text: 'No classes available', onPress: () => {} }];
                    Alert.alert('Select Class', 'Choose a class for the session:', [
                      ...options,
                      { text: 'Cancel', style: 'cancel' },
                    ]);
                  }}
                >
                  <Text style={styles.formInputText}>{sessionForm.className || 'Select a class'}</Text>
                  <MaterialCommunityIcons name="chevron-down" size={20} color={COLORS['muted-foreground']} />
                </TouchableOpacity>
              </View>
            )}
            
            <View style={styles.formGroup}>
              <Text style={styles.formLabel}>Subject *</Text>
              <TextInput
                style={styles.formInput}
                value={sessionForm.subject}
                onChangeText={(text) => setSessionForm(prev => ({ ...prev, subject: text }))}
                placeholder="Enter subject"
                placeholderTextColor={COLORS['muted-foreground']}
              />
            </View>
            
            <View style={styles.formGroup}>
              <Text style={styles.formLabel}>Session Type</Text>
              {Platform.OS === 'web' ? (
                <View>
                  <TouchableOpacity
                    style={styles.formInput}
                    onPress={() => setShowSessionTypeDropdown((v) => !v)}
                  >
                    <Text style={styles.formInputText}>{sessionForm.sessionType || 'Select session type'}</Text>
                    <MaterialCommunityIcons name="chevron-down" size={20} color={COLORS['muted-foreground']} />
                  </TouchableOpacity>
                  {showSessionTypeDropdown && (
                    <View style={styles.dropdownMenu}>
                      {[
                        { key: 'morning', label: 'Morning' },
                        { key: 'afternoon', label: 'Afternoon' },
                        { key: 'evening', label: 'Evening' },
                        { key: 'custom', label: 'Custom' },
                      ].map((opt) => (
                        <TouchableOpacity
                          key={opt.key}
                          style={styles.dropdownItem}
                          onPress={() => {
                            setSessionForm((prev) => ({ ...prev, sessionType: opt.key as any }));
                            setShowSessionTypeDropdown(false);
                          }}
                        >
                          <Text style={styles.dropdownItemText}>{opt.label}</Text>
                        </TouchableOpacity>
                      ))}
                    </View>
                  )}
                </View>
              ) : (
                <TouchableOpacity 
                  style={styles.formInput}
                  onPress={() => {
                    Alert.alert(
                      'Session Type',
                      'Choose session type:',
                      [
                        { text: 'Morning', onPress: () => setSessionForm(prev => ({ ...prev, sessionType: 'morning' })) },
                        { text: 'Afternoon', onPress: () => setSessionForm(prev => ({ ...prev, sessionType: 'afternoon' })) },
                        { text: 'Evening', onPress: () => setSessionForm(prev => ({ ...prev, sessionType: 'evening' })) },
                        { text: 'Custom', onPress: () => setSessionForm(prev => ({ ...prev, sessionType: 'custom' })) },
                        { text: 'Cancel', style: 'cancel' }
                      ]
                    );
                  }}
                >
                  <Text style={styles.formInputText}>{sessionForm.sessionType || 'Select session type'}</Text>
                  <MaterialCommunityIcons name="chevron-down" size={20} color={COLORS['muted-foreground']} />
                </TouchableOpacity>
              )}
            </View>
            
            <View style={styles.formGroup}>
              <Text style={styles.formLabel}>Start Time *</Text>
              <TextInput
                style={styles.formInput}
                value={sessionForm.startTime}
                onChangeText={(text) => setSessionForm(prev => ({ ...prev, startTime: text }))}
                placeholder="HH:MM (e.g., 09:00)"
                placeholderTextColor={COLORS['muted-foreground']}
              />
            </View>
            
            <View style={styles.formGroup}>
              <Text style={styles.formLabel}>End Time *</Text>
              <TextInput
                style={styles.formInput}
                value={sessionForm.endTime}
                onChangeText={(text) => setSessionForm(prev => ({ ...prev, endTime: text }))}
                placeholder="HH:MM (e.g., 10:30)"
                placeholderTextColor={COLORS['muted-foreground']}
              />
            </View>
            
            <View style={styles.formGroup}>
              <Text style={styles.formLabel}>Location</Text>
              <TextInput
                style={styles.formInput}
                value={sessionForm.location}
                onChangeText={(text) => setSessionForm(prev => ({ ...prev, location: text }))}
                placeholder="Enter location (optional)"
                placeholderTextColor={COLORS['muted-foreground']}
              />
            </View>
          </ScrollView>
          
          <View style={styles.modalFooter}>
            <TouchableOpacity 
              style={styles.cancelButton}
              onPress={() => setShowCreateSession(false)}
            >
              <Text style={styles.cancelButtonText}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity 
              style={styles.createButton}
              onPress={handleCreateSession}
            >
              <Text style={styles.createButtonText}>Create Session</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Record Detail Modal */}
      <Modal
        visible={showRecordDetail}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setShowRecordDetail(false)}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Attendance Details</Text>
            <TouchableOpacity onPress={() => setShowRecordDetail(false)}>
              <MaterialCommunityIcons name="close" size={24} color={COLORS.foreground} />
            </TouchableOpacity>
          </View>
          
          {selectedRecord && (
            <ScrollView style={styles.modalContent}>
              <View style={styles.detailModalCard}>
                {/* Subject Header */}
                <View style={styles.detailModalHeader}>
                  <MaterialCommunityIcons 
                    name="book-open-variant" 
                    size={32} 
                    color={COLORS.primary} 
                  />
                  <View style={styles.detailModalTitleContainer}>
                    <Text style={styles.detailModalSubject}>
                      {selectedRecord.session_info?.split(' - ')[0] || 'Subject'}
                    </Text>
                    <View style={[styles.statusBadge, { backgroundColor: getStatusColor(selectedRecord.status) }]}>
                      <MaterialCommunityIcons 
                        name={getStatusIcon(selectedRecord.status) as any} 
                        size={16} 
                        color="white" 
                      />
                      <Text style={styles.statusText}>{selectedRecord.status}</Text>
                    </View>
                  </View>
                </View>

                {/* Attendance Information */}
                <View style={styles.detailModalSection}>
                  <Text style={styles.detailModalSectionTitle}>Attendance Information</Text>
                  
                  <View style={styles.detailModalItem}>
                    <MaterialCommunityIcons name="calendar" size={20} color={COLORS.primary} />
                    <View style={styles.detailModalItemContent}>
                      <Text style={styles.detailModalItemLabel}>Date</Text>
                      <Text style={styles.detailModalItemValue}>
                        {new Date(selectedRecord.timestamp).toLocaleDateString('en-US', {
                          weekday: 'long',
                          year: 'numeric',
                          month: 'long',
                          day: 'numeric'
                        })}
                      </Text>
                    </View>
                  </View>

                  <View style={styles.detailModalItem}>
                    <MaterialCommunityIcons name="clock" size={20} color={COLORS.primary} />
                    <View style={styles.detailModalItemContent}>
                      <Text style={styles.detailModalItemLabel}>Time</Text>
                      <Text style={styles.detailModalItemValue}>
                        {new Date(selectedRecord.timestamp).toLocaleTimeString('en-US', {
                          hour: '2-digit',
                          minute: '2-digit',
                          second: '2-digit'
                        })}
                      </Text>
                    </View>
                  </View>

                  <View style={styles.detailModalItem}>
                    <MaterialCommunityIcons name="account-check" size={20} color={COLORS.primary} />
                    <View style={styles.detailModalItemContent}>
                      <Text style={styles.detailModalItemLabel}>Method</Text>
                      <Text style={styles.detailModalItemValue}>{selectedRecord.method}</Text>
                    </View>
                  </View>

                  <View style={styles.detailModalItem}>
                    <MaterialCommunityIcons name="school" size={20} color={COLORS.primary} />
                    <View style={styles.detailModalItemContent}>
                      <Text style={styles.detailModalItemLabel}>Session</Text>
                      <Text style={styles.detailModalItemValue}>{selectedRecord.session_info}</Text>
                    </View>
                  </View>

                  {selectedRecord.notes && (
                    <View style={styles.detailModalItem}>
                      <MaterialCommunityIcons name="note-text" size={20} color={COLORS.primary} />
                      <View style={styles.detailModalItemContent}>
                        <Text style={styles.detailModalItemLabel}>Notes</Text>
                        <Text style={styles.detailModalItemValue}>{selectedRecord.notes}</Text>
                      </View>
                    </View>
                  )}
                </View>

                {/* Student Information (if available) */}
                {selectedRecord.student_name && (
                  <View style={styles.detailModalSection}>
                    <Text style={styles.detailModalSectionTitle}>Student Information</Text>
                    <View style={styles.detailModalItem}>
                      <MaterialCommunityIcons name="account" size={20} color={COLORS.primary} />
                      <View style={styles.detailModalItemContent}>
                        <Text style={styles.detailModalItemLabel}>Student Name</Text>
                        <Text style={styles.detailModalItemValue}>{selectedRecord.student_name}</Text>
                      </View>
                    </View>
                  </View>
                )}
              </View>
            </ScrollView>
          )}
          
          <View style={styles.modalFooter}>
            <TouchableOpacity 
              style={styles.createButton}
              onPress={() => setShowRecordDetail(false)}
            >
              <Text style={styles.createButtonText}>Close</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </AppBackground>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
    paddingTop: 20,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: COLORS.foreground,
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: COLORS['muted-foreground'],
  },
  tabContainer: {
    flexDirection: 'row',
    backgroundColor: COLORS.card,
    borderRadius: 12,
    padding: 4,
    marginBottom: 20,
  },
  tab: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
    borderRadius: 8,
  },
  activeTab: {
    backgroundColor: COLORS.primary,
  },
  tabText: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS['muted-foreground'],
  },
  activeTabText: {
    color: COLORS['primary-foreground'],
  },
  content: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
  },
  sessionsContainer: {
    gap: 16,
  },
  recordsContainer: {
    gap: 12,
  },
  sessionCard: {
    backgroundColor: COLORS.card,
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: COLORS.border,
    // Ensure absolute children (like delete button) position correctly
    position: 'relative',
    // Add vertical spacing between cards
    marginBottom: 20,
  },
  sessionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  sessionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: COLORS.foreground,
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
    fontSize: 12,
    fontWeight: '600',
    color: 'white',
  },
  sessionInfo: {
    marginBottom: 12,
  },
  sessionDate: {
    fontSize: 14,
    color: COLORS.foreground,
    marginBottom: 4,
  },
  sessionTime: {
    fontSize: 14,
    color: COLORS['muted-foreground'],
    marginBottom: 4,
  },
  sessionType: {
    fontSize: 14,
    color: COLORS['muted-foreground'],
    textTransform: 'capitalize',
  },
  timeRemainingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 4,
  },
  timeRemainingText: {
    fontSize: 12,
    fontWeight: '600',
  },
  attendanceStats: {
    marginBottom: 16,
  },
  statsText: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.primary,
  },
  actionButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(46, 204, 113, 0.1)',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    gap: 6,
  },
  actionButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.primary,
  },
  recordCard: {
    backgroundColor: COLORS.card,
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  recordHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  recordStudent: {
    fontSize: 16,
    fontWeight: 'bold',
    color: COLORS.foreground,
  },
  recordInfo: {
    marginBottom: 8,
  },
  recordSession: {
    fontSize: 14,
    color: COLORS.foreground,
    marginBottom: 4,
  },
  recordMethod: {
    fontSize: 14,
    color: COLORS['muted-foreground'],
    marginBottom: 4,
  },
  recordTime: {
    fontSize: 14,
    color: COLORS['muted-foreground'],
  },
  recordNotes: {
    fontSize: 14,
    color: COLORS['muted-foreground'],
    fontStyle: 'italic',
    marginTop: 8,
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
  },
  emptyStateText: {
    fontSize: 16,
    color: COLORS['muted-foreground'],
    marginTop: 16,
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  registerFaceButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(46, 204, 113, 0.1)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    gap: 6,
  },
  registerFaceText: {
    fontSize: 12,
    fontWeight: '600',
    color: COLORS.primary,
  },
  /* Teacher Controls */
  teacherControls: {
    flexDirection: 'row',
    gap: 12,
    backgroundColor: COLORS.card,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: COLORS.border,
    padding: 12,
    marginBottom: 16,
  },
  pickerContainer: {
    flex: 1,
    marginBottom: 8,
  },
  pickerLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.foreground,
    marginBottom: 6,
  },
  pickerWrapper: {
    backgroundColor: COLORS['background-secondary'],
    borderRadius: 10,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  pickerButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 12,
    paddingVertical: 12,
    borderRadius: 10,
    minHeight: 44,
  },
  pickerButtonText: {
    color: COLORS.foreground,
    fontSize: 14,
    flex: 1,
  },

  /* Header actions */
  createSessionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(46, 204, 113, 0.08)',
    borderWidth: 1,
    borderColor: COLORS.primary,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    gap: 6,
  },
  createSessionText: {
    fontSize: 12,
    fontWeight: '600',
    color: COLORS.primary,
  },

  /* Student quick card */
  markAttendanceCard: {
    backgroundColor: COLORS.card,
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 8,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: COLORS.foreground,
  },
  cardDescription: {
    fontSize: 14,
    color: COLORS['muted-foreground'],
    marginBottom: 12,
  },
  markAttendanceButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.primary,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 8,
    gap: 8,
    alignSelf: 'flex-start',
  },
  markAttendanceButtonText: {
    color: 'white',
    fontWeight: '600',
    fontSize: 14,
  },

  /* Attendance list (Teacher) */
  attendanceHeader: {
    marginBottom: 10,
  },
  attendanceTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: COLORS.foreground,
  },
  attendanceSubtitle: {
    fontSize: 14,
    color: COLORS['muted-foreground'],
    marginTop: 2,
  },
  studentAttendanceCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: COLORS.card,
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: COLORS.border,
    marginBottom: 10,
  },
  studentInfo: {
    flex: 1,
    marginRight: 10,
  },
  studentName: {
    color: COLORS.foreground,
    fontSize: 16,
    fontWeight: '600',
  },
  studentTime: {
    color: COLORS['muted-foreground'],
    fontSize: 12,
    marginTop: 2,
  },

  /* Session modal */
  modalContainer: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: COLORS.foreground,
  },
  modalContent: {
    padding: 16,
  },
  formGroup: {
    marginBottom: 12,
  },
  formLabel: {
    fontSize: 12,
    color: COLORS['muted-foreground'],
    marginBottom: 6,
  },
  formInput: {
    backgroundColor: COLORS['background-secondary'],
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    color: COLORS['primary-foreground'],
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    minHeight: 44,
  },
  // Web dropdown styles
  dropdownMenu: {
    backgroundColor: COLORS['background-secondary'],
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 10,
    marginTop: 8,
    overflow: 'hidden',
  },
  dropdownItem: {
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  dropdownItemText: {
    color: COLORS.foreground,
    fontSize: 14,
  },
  formInputText: {
    color: COLORS.foreground,
    fontSize: 14,
    flex: 1,
  },
  modalFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
    gap: 12,
  },
  cancelButton: {
    flex: 1,
    backgroundColor: COLORS.muted,
    paddingVertical: 12,
    borderRadius: 10,
    alignItems: 'center',
  },
  cancelButtonText: {
    color: COLORS['muted-foreground'],
    fontWeight: '600',
    fontSize: 14,
  },
  createButton: {
    flex: 1,
    backgroundColor: COLORS.primary,
    paddingVertical: 12,
    borderRadius: 10,
    alignItems: 'center',
  },
  createButtonText: {
    color: COLORS['primary-foreground'],
    fontWeight: '700',
    fontSize: 14,
  },

  /* Primary action state variants */
  primaryActionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.primary,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 8,
    gap: 8,
    flex: 1,
    justifyContent: 'center',
  },
  disabledActionButton: {
    backgroundColor: COLORS.muted,
  },
  disabledActionButtonText: {
    color: '#666',
    fontSize: 16,
    fontWeight: '600',
  },
  // Active Sessions Section Styles
  activeSectionsContainer: {
    marginBottom: 24,
    backgroundColor: COLORS.card,
    borderRadius: 12,
    padding: 16,
    borderWidth: 2,
    borderColor: COLORS.warning,
  },
  allSessionsContainer: {
    backgroundColor: COLORS.card,
    borderRadius: 12,
    padding: 16,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
    paddingBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: COLORS.foreground,
    marginLeft: 8,
    flex: 1,
  },
  activeBadge: {
    backgroundColor: COLORS.warning,
    borderRadius: 12,
    paddingHorizontal: 8,
    paddingVertical: 4,
    minWidth: 24,
    alignItems: 'center',
  },
  activeBadgeText: {
    color: 'white',
    fontSize: 12,
    fontWeight: 'bold',
  },
  // Enhanced Session Card Styles
  activeSessionCard: {
    borderWidth: 2,
    borderColor: COLORS.success,
    shadowColor: COLORS.success,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  sessionTitleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flex: 1,
  },
  countdownContainer: {
    backgroundColor: COLORS.warning + '15',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    marginVertical: 12,
    borderWidth: 1,
    borderColor: COLORS.warning + '30',
  },
  countdownText: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#FF6B35', // High contrast orange
    marginVertical: 4,
    textShadowColor: 'rgba(0, 0, 0, 0.3)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 2,
  },
  countdownLabel: {
    fontSize: 12,
    color: COLORS['muted-foreground'],
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  sessionDetailsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginVertical: 8,
  },
  detailItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    minWidth: '45%',
    paddingVertical: 4,
  },
  detailText: {
    fontSize: 14,
    color: COLORS.foreground,
    flex: 1,
  },
  progressContainer: {
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
  },
  progressBar: {
    height: 6,
    backgroundColor: COLORS.muted,
    borderRadius: 3,
    overflow: 'hidden',
    marginBottom: 6,
  },
  progressFill: {
    height: '100%',
    backgroundColor: COLORS.success,
    borderRadius: 3,
  },
  progressText: {
    fontSize: 12,
    color: COLORS['muted-foreground'],
    textAlign: 'center',
  },
  primaryActionButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  // Session Grid and Layout Styles
  sessionGrid: {
    gap: 20,
  },
  endedSectionsContainer: {
    marginBottom: 24,
    backgroundColor: COLORS.card,
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  sessionHeaderActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  deleteButton: {
    padding: 6,
    borderRadius: 14,
    backgroundColor: COLORS.card,
    borderWidth: 1,
    borderColor: COLORS.border,
    shadowColor: '#000',
    shadowOpacity: 0.08,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
    marginLeft: 8,
  },
  sectionContainer: {
    marginBottom: 24,
  },
  // Enhanced Record Card Styles
  recordTitleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flex: 1,
  },
  recordSubject: {
    fontSize: 16,
    fontWeight: 'bold',
    color: COLORS.foreground,
  },
  recordDetailItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 4,
  },
  recordDetailText: {
    fontSize: 14,
    color: COLORS['muted-foreground'],
  },
  recordFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 8,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
  },
  recordClass: {
    fontSize: 12,
    color: COLORS['muted-foreground'],
    flex: 1,
  },
  // Detail Modal Styles
  detailModalCard: {
    backgroundColor: COLORS.card,
    borderRadius: 16,
    padding: 20,
    margin: 16,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  detailModalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 24,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  detailModalTitleContainer: {
    flex: 1,
    marginLeft: 16,
  },
  detailModalSubject: {
    fontSize: 20,
    fontWeight: 'bold',
    color: COLORS.foreground,
    marginBottom: 8,
  },
  detailModalSection: {
    marginBottom: 24,
  },
  detailModalSectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.foreground,
    marginBottom: 16,
  },
  detailModalItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 16,
    paddingHorizontal: 8,
  },
  detailModalItemContent: {
    flex: 1,
    marginLeft: 12,
  },
  detailModalItemLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: COLORS['muted-foreground'],
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 4,
  },
  detailModalItemValue: {
    fontSize: 16,
    color: COLORS.foreground,
    lineHeight: 22,
  },
});
