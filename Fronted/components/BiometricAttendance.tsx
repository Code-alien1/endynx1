
/**
 * SIMPLE BIOMETRIC ATTENDANCE COMPONENT
 * Uses phone's built-in biometric authentication for attendance marking
 */
import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, Alert, ActivityIndicator, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as LocalAuthentication from 'expo-local-authentication';
import * as Location from 'expo-location';

interface AttendanceSession {
  id: string;
  class_name: string;
  session_type: string;
  date: string;
  start_time: string;
  end_time: string;
  attendance_marked: boolean;
}

interface BiometricAttendanceProps {
  userId: string;
  onAttendanceMarked?: (attendance: any) => void;
  onError?: (error: string) => void;
}

export default function BiometricAttendance({
  userId,
  onAttendanceMarked,
  onError
}: BiometricAttendanceProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [sessions, setSessions] = useState<AttendanceSession[]>([]);
  const [biometricAvailable, setBiometricAvailable] = useState(false);
  const [loadingSessions, setLoadingSessions] = useState(true);
  const [locationPermission, setLocationPermission] = useState(false);
  const [currentLocation, setCurrentLocation] = useState<Location.LocationObject | null>(null);

  const baseUrl = 'http://192.168.2.33:8000/api';

  useEffect(() => {
    initializeBiometric();
    initializeLocation();
    loadSessions();
  }, [userId]);

  const initializeBiometric = async () => {
    try {
      console.log('🔍 Checking biometric availability...');
      
      // Check if device has biometric hardware
      const hasHardware = await LocalAuthentication.hasHardwareAsync();
      if (!hasHardware) {
        console.log('❌ No biometric hardware available');
        setBiometricAvailable(false);
        return;
      }

      // Check if biometrics are enrolled
      const isEnrolled = await LocalAuthentication.isEnrolledAsync();
      if (!isEnrolled) {
        console.log('❌ No biometrics enrolled');
        setBiometricAvailable(false);
        return;
      }

      console.log('✅ Biometric authentication available');
      setBiometricAvailable(true);
      
    } catch (error) {
      console.error('❌ Error checking biometric availability:', error);
      setBiometricAvailable(false);
    }
  };

  const initializeLocation = async () => {
    try {
      console.log('📍 Requesting location permissions...');
      
      // Request location permissions
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        console.log('❌ Location permission denied');
        setLocationPermission(false);
        return;
      }

      console.log('✅ Location permission granted');
      setLocationPermission(true);

      // Get current location
      const location = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.High,
      });
      
      setCurrentLocation(location);
      console.log('📍 Current location:', location.coords);
      
    } catch (error) {
      console.error('❌ Error getting location:', error);
      setLocationPermission(false);
    }
  };

  const loadSessions = async () => {
    try {
      setLoadingSessions(true);
      console.log('📅 Loading sessions for user:', userId);
      
      const response = await fetch(`${baseUrl}/attendance/sessions/${userId}/`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        const data = await response.json();
        setSessions(data.sessions || []);
        console.log('✅ Loaded sessions:', data.sessions?.length || 0);
      } else {
        console.error('❌ Failed to load sessions:', response.status);
        setSessions([]);
      }
    } catch (error: any) {
      console.error('❌ Error loading sessions:', error);
      setSessions([]);
      onError?.(error.message);
    } finally {
      setLoadingSessions(false);
    }
  };

  const handleBiometricAuth = async (sessionId?: string) => {
    if (!biometricAvailable) {
      Alert.alert('Error', 'Biometric authentication is not available on this device');
      return;
    }

    if (!locationPermission || !currentLocation) {
      Alert.alert('Location Required', 'Location access is required to mark attendance. Please enable location permissions.');
      return;
    }

    setIsLoading(true);
    try {
      console.log('🔐 Starting biometric + location attendance...');

      // Step 1: Validate location first
      console.log('📍 Validating location...');
      const locationValid = await validateLocation();
      if (!locationValid) {
        Alert.alert('Location Error', 'You are not within the allowed area to mark attendance.');
        return;
      }

      // Step 2: Prompt for biometric authentication
      console.log('🔐 Requesting biometric authentication...');
      const result = await LocalAuthentication.authenticateAsync({
        promptMessage: 'Confirm Attendance with Biometrics',
        fallbackLabel: 'Use Passcode',
        cancelLabel: 'Cancel',
        disableDeviceFallback: false,
      });

      if (!result.success) {
        console.log('❌ Biometric authentication failed');
        Alert.alert('Failed', 'Biometric authentication failed');
        return;
      }

      console.log('✅ Biometric authentication successful');

      // Step 3: Mark attendance with both biometric and location verification
      await markAttendanceWithLocation(sessionId);

    } catch (error: any) {
      console.error('❌ Biometric + location authentication error:', error);
      Alert.alert('Error', error.message);
      onError?.(error.message);
    } finally {
      setIsLoading(false);
    }
  };

  const validateLocation = async (): Promise<boolean> => {
    try {
      if (!currentLocation) {
        console.log('❌ No current location available');
        return false;
      }

      console.log('📍 Validating location with backend...');
      
      const response = await fetch(`${baseUrl}/attendance/validate-location/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          latitude: currentLocation.coords.latitude,
          longitude: currentLocation.coords.longitude,
          accuracy: currentLocation.coords.accuracy,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        console.log('✅ Location validation result:', data);
        return data.valid || false;
      } else {
        console.error('❌ Location validation failed:', response.status);
        return false;
      }
    } catch (error: any) {
      console.error('❌ Location validation error:', error);
      return false;
    }
  };

  const markAttendanceWithLocation = async (sessionId?: string) => {
    try {
      console.log('📤 Marking attendance with biometric + location...');
      
      if (!currentLocation) {
        throw new Error('Location not available');
      }

      const attendanceData = {
        userId: userId,
        biometric_verified: true,
        session_id: sessionId,
        location: {
          latitude: currentLocation.coords.latitude,
          longitude: currentLocation.coords.longitude,
          accuracy: currentLocation.coords.accuracy,
        },
        timestamp: new Date().toISOString()
      };

      // Use the existing geolocation + face recognition endpoint
      const response = await fetch(`${baseUrl}/attendance/mark-with-face-and-location/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(attendanceData),
      });

      if (response.ok) {
        const data = await response.json();
        console.log('✅ Attendance marked successfully with location:', data);
        
        Alert.alert(
          'Success!', 
          `Attendance marked with biometric + location verification!`,
          [{ text: 'OK', onPress: () => loadSessions() }]
        );
        
        onAttendanceMarked?.(data.attendance);
      } else {
        const errorData = await response.json().catch(() => ({}));
        console.error('❌ Failed to mark attendance:', response.status, errorData);
        
        Alert.alert(
          'Failed to Mark Attendance', 
          errorData.error || `HTTP ${response.status}`
        );
        onError?.(errorData.error || 'Failed to mark attendance');
      }

    } catch (error: any) {
      console.error('❌ Attendance marking error:', error);
      Alert.alert('Error', error.message);
      onError?.(error.message);
    }
  };

  const markAttendance = async (sessionId?: string) => {
    try {
      console.log('📤 Marking attendance...');
      
      const attendanceData = {
        userId: userId,
        biometric_verified: true,
        session_id: sessionId,
        timestamp: new Date().toISOString()
      };

      const response = await fetch(`${baseUrl}/attendance/biometric/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(attendanceData),
      });

      if (response.ok) {
        const data = await response.json();
        console.log('✅ Attendance marked successfully:', data);
        
        Alert.alert(
          'Success!', 
          `Attendance marked for ${data.attendance?.session?.class_name || 'your class'}`,
          [{ text: 'OK', onPress: () => loadSessions() }]
        );
        
        onAttendanceMarked?.(data.attendance);
      } else {
        const errorData = await response.json().catch(() => ({}));
        console.error('❌ Failed to mark attendance:', response.status, errorData);
        
        Alert.alert(
          'Failed to Mark Attendance', 
          errorData.error || `HTTP ${response.status}`
        );
        onError?.(errorData.error || 'Failed to mark attendance');
      }

    } catch (error: any) {
      console.error('❌ Attendance marking error:', error);
      Alert.alert('Error', error.message);
      onError?.(error.message);
    }
  };

  const testConnection = async () => {
    try {
      console.log('🧪 Testing connection...');
      
      const response = await fetch(`${baseUrl}/attendance/biometric-test/`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        const data = await response.json();
        Alert.alert('Connection Test', data.message);
        console.log('✅ Connection test successful:', data);
      } else {
        Alert.alert('Connection Failed', `HTTP ${response.status}`);
      }
    } catch (error: any) {
      Alert.alert('Connection Error', error.message);
      console.error('❌ Connection test failed:', error);
    }
  };

  return (
    <ScrollView style={{ flex: 1 }}>
      <View style={{
        padding: 20,
        backgroundColor: '#1a1a1a',
        borderRadius: 12,
        margin: 16,
      }}>
        {/* Header */}
        <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 16 }}>
          <Ionicons name="finger-print" size={24} color="#4CAF50" />
          <Text style={{ 
            fontSize: 18, 
            fontWeight: 'bold', 
            color: 'white', 
            marginLeft: 8 
          }}>
            Biometric Attendance
          </Text>
        </View>

        {/* Status */}
        <View style={{ 
          padding: 12,
          backgroundColor: '#2a2a2a',
          borderRadius: 8,
          marginBottom: 16
        }}>
          {/* Biometric Status */}
          <View style={{ 
            flexDirection: 'row', 
            alignItems: 'center', 
            marginBottom: 8
          }}>
            <View style={{
              width: 8,
              height: 8,
              borderRadius: 4,
              backgroundColor: biometricAvailable ? '#4CAF50' : '#F44336',
              marginRight: 8
            }} />
            <Text style={{ color: 'white', fontSize: 14 }}>
              Biometric: {biometricAvailable ? '✅ Available' : '❌ Not Available'}
            </Text>
          </View>

          {/* Location Status */}
          <View style={{ 
            flexDirection: 'row', 
            alignItems: 'center'
          }}>
            <View style={{
              width: 8,
              height: 8,
              borderRadius: 4,
              backgroundColor: locationPermission && currentLocation ? '#4CAF50' : '#F44336',
              marginRight: 8
            }} />
            <Text style={{ color: 'white', fontSize: 14 }}>
              Location: {locationPermission && currentLocation ? '✅ Available' : '❌ Not Available'}
            </Text>
          </View>
        </View>

        {/* Quick Mark Attendance */}
        {biometricAvailable && locationPermission && currentLocation && (
          <TouchableOpacity
            style={{
              backgroundColor: '#4CAF50',
              padding: 16,
              borderRadius: 8,
              flexDirection: 'row',
              alignItems: 'center',
              justifyContent: 'center',
              marginBottom: 16,
              opacity: isLoading ? 0.6 : 1
            }}
            onPress={() => handleBiometricAuth()}
            disabled={isLoading}
          >
            {isLoading ? (
              <ActivityIndicator color="white" size="small" />
            ) : (
              <>
                <Ionicons name="finger-print" size={20} color="white" />
                <Text style={{ 
                  color: 'white', 
                  fontSize: 16, 
                  fontWeight: 'bold',
                  marginLeft: 8
                }}>
                  Mark Attendance (Biometric + Location)
                </Text>
              </>
            )}
          </TouchableOpacity>
        )}

        {/* Show message if requirements not met */}
        {(!biometricAvailable || !locationPermission || !currentLocation) && (
          <View style={{
            backgroundColor: '#FF5722',
            padding: 12,
            borderRadius: 8,
            marginBottom: 16,
            alignItems: 'center'
          }}>
            <Ionicons name="warning" size={20} color="white" />
            <Text style={{ color: 'white', fontSize: 14, marginTop: 4, textAlign: 'center' }}>
              {!biometricAvailable && 'Biometric authentication not available. '}
              {!locationPermission && 'Location permission required. '}
              {!currentLocation && 'Unable to get current location. '}
              Please check your device settings.
            </Text>
          </View>
        )}

        {/* Available Sessions */}
        <Text style={{ 
          color: 'white', 
          fontSize: 16, 
          fontWeight: 'bold',
          marginBottom: 12
        }}>
          Today's Sessions
        </Text>

        {loadingSessions ? (
          <View style={{ alignItems: 'center', padding: 20 }}>
            <ActivityIndicator color="#4CAF50" size="small" />
            <Text style={{ color: 'white', marginTop: 8 }}>Loading sessions...</Text>
          </View>
        ) : sessions.length === 0 ? (
          <View style={{ 
            padding: 16, 
            backgroundColor: '#2a2a2a', 
            borderRadius: 8,
            alignItems: 'center'
          }}>
            <Ionicons name="calendar-outline" size={24} color="#666" />
            <Text style={{ color: '#666', marginTop: 8 }}>No sessions available today</Text>
          </View>
        ) : (
          sessions.map((session) => (
            <View
              key={session.id}
              style={{
                backgroundColor: '#2a2a2a',
                padding: 12,
                borderRadius: 8,
                marginBottom: 8,
                borderLeftWidth: 4,
                borderLeftColor: session.attendance_marked ? '#4CAF50' : '#FF9800'
              }}
            >
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                <View style={{ flex: 1 }}>
                  <Text style={{ color: 'white', fontSize: 16, fontWeight: 'bold' }}>
                    {session.class_name}
                  </Text>
                  <Text style={{ color: '#ccc', fontSize: 14 }}>
                    {session.session_type} • {session.start_time} - {session.end_time}
                  </Text>
                  <Text style={{ 
                    color: session.attendance_marked ? '#4CAF50' : '#FF9800', 
                    fontSize: 12,
                    marginTop: 4
                  }}>
                    {session.attendance_marked ? '✅ Attendance Marked' : '⏳ Pending'}
                  </Text>
                </View>
                
                {!session.attendance_marked && biometricAvailable && locationPermission && currentLocation && (
                  <TouchableOpacity
                    style={{
                      backgroundColor: '#2196F3',
                      padding: 8,
                      borderRadius: 6,
                      opacity: isLoading ? 0.6 : 1
                    }}
                    onPress={() => handleBiometricAuth(session.id)}
                    disabled={isLoading}
                  >
                    <Ionicons name="finger-print" size={16} color="white" />
                  </TouchableOpacity>
                )}
              </View>
            </View>
          ))
        )}

        {/* Test Connection Button */}
        <TouchableOpacity
          style={{
            backgroundColor: '#666',
            padding: 12,
            borderRadius: 8,
            alignItems: 'center',
            marginTop: 16
          }}
          onPress={testConnection}
        >
          <Text style={{ color: 'white', fontSize: 14 }}>Test Connection</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}
