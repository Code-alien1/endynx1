import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS } from '@/constants/theme';
import { geolocationService, LocationData } from '../services/geolocation';
import { apiService } from '../services/api';
import { useAuth } from '../contexts/AuthContext';

interface EnhancedAttendanceMarkingProps {
  sessionId: string;
  onAttendanceMarked: (success: boolean) => void;
}

export default function EnhancedAttendanceMarking({
  sessionId,
  onAttendanceMarked,
}: EnhancedAttendanceMarkingProps) {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [locationData, setLocationData] = useState<LocationData | null>(null);
  const [locationStatus, setLocationStatus] = useState<'checking' | 'valid' | 'invalid' | 'unavailable'>('checking');

  useEffect(() => {
    checkLocation();
  }, []);

  const checkLocation = async () => {
    setLocationStatus('checking');
    try {
      const location = await geolocationService.getCurrentLocation();
      if (location) {
        setLocationData(location);
        
        // Get address for display
        const address = await geolocationService.reverseGeocode(
          location.latitude,
          location.longitude
        );
        
        setLocationData({ ...location, address: address || undefined });
        
        // Validate location with backend
        const validation = await validateLocationWithBackend(location);
        setLocationStatus(validation.isValid ? 'valid' : 'invalid');
      } else {
        setLocationStatus('unavailable');
      }
    } catch (error) {
      console.error('Location check error:', error);
      setLocationStatus('unavailable');
    }
  };

  const validateLocationWithBackend = async (location: LocationData) => {
    try {
      const response = await apiService.post('/attendance/validate-location/', {
        latitude: location.latitude,
        longitude: location.longitude,
        accuracy: location.accuracy,
      });
      return response.data;
    } catch (error) {
      console.error('Location validation error:', error);
      return { isValid: false, reason: 'Validation failed' };
    }
  };

  const markAttendanceWithLocation = async () => {
    if (!locationData) {
      Alert.alert('Location Required', 'Please enable location services to mark attendance.');
      return;
    }

    setLoading(true);
    try {
      // Mark attendance with location data
      const response = await apiService.post('/attendance/mark-with-location/', {
        session_id: sessionId,
        location: {
          latitude: locationData.latitude,
          longitude: locationData.longitude,
          accuracy: locationData.accuracy,
          address: locationData.address,
          timestamp: locationData.timestamp,
        },
      });

      Alert.alert('Success', 'Attendance marked successfully!');
      onAttendanceMarked(true);
    } catch (error: any) {
      console.error('Attendance marking error:', error);
      Alert.alert(
        'Error',
        error.response?.data?.message || 'Failed to mark attendance'
      );
      onAttendanceMarked(false);
    } finally {
      setLoading(false);
    }
  };

  const markAttendanceWithFaceAndLocation = async () => {
    if (!locationData) {
      Alert.alert('Location Required', 'Please enable location services.');
      return;
    }

    setLoading(true);
    try {
      // This would integrate with your existing face recognition component
      // For now, we'll simulate the face recognition process
      
      Alert.alert(
        'Face Recognition',
        'This will open the camera for face recognition with location verification.',
        [
          { text: 'Cancel', style: 'cancel' },
          { 
            text: 'Continue', 
            onPress: () => {
              // Navigate to face recognition component
              // Pass location data along with face recognition
              console.log('Opening face recognition with location:', locationData);
            }
          }
        ]
      );
    } finally {
      setLoading(false);
    }
  };

  const getLocationStatusColor = () => {
    switch (locationStatus) {
      case 'valid': return COLORS.success;
      case 'invalid': return COLORS.destructive;
      case 'unavailable': return COLORS.muted;
      default: return COLORS.primary;
    }
  };

  const getLocationStatusText = () => {
    switch (locationStatus) {
      case 'checking': return 'Checking location...';
      case 'valid': return 'Location verified ✓';
      case 'invalid': return 'Outside school area ⚠️';
      case 'unavailable': return 'Location unavailable';
      default: return 'Unknown status';
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Mark Attendance</Text>
        <Text style={styles.subtitle}>Enhanced with Location & Face Recognition</Text>
      </View>

      {/* Location Status */}
      <View style={styles.locationCard}>
        <View style={styles.locationHeader}>
          <Ionicons 
            name="location" 
            size={24} 
            color={getLocationStatusColor()} 
          />
          <Text style={[styles.locationStatus, { color: getLocationStatusColor() }]}>
            {getLocationStatusText()}
          </Text>
        </View>

        {locationData && (
          <View style={styles.locationDetails}>
            <Text style={styles.locationText}>
              📍 {locationData.address || 'Getting address...'}
            </Text>
            <Text style={styles.coordinatesText}>
              Lat: {locationData.latitude.toFixed(6)}, 
              Lng: {locationData.longitude.toFixed(6)}
            </Text>
            <Text style={styles.accuracyText}>
              Accuracy: ±{Math.round(locationData.accuracy)}m
            </Text>
          </View>
        )}

        <TouchableOpacity 
          style={styles.refreshButton} 
          onPress={checkLocation}
          disabled={locationStatus === 'checking'}
        >
          <Ionicons name="refresh" size={20} color={COLORS.primary} />
          <Text style={styles.refreshText}>Refresh Location</Text>
        </TouchableOpacity>
      </View>

      {/* Attendance Options */}
      <View style={styles.optionsContainer}>
        <TouchableOpacity
          style={[
            styles.attendanceButton,
            locationStatus === 'invalid' && styles.disabledButton
          ]}
          onPress={markAttendanceWithLocation}
          disabled={loading || locationStatus === 'invalid'}
        >
          {loading ? (
            <ActivityIndicator color={COLORS.background} />
          ) : (
            <>
              <Ionicons name="checkmark-circle" size={24} color={COLORS.background} />
              <Text style={styles.buttonText}>Mark Attendance (Location Only)</Text>
            </>
          )}
        </TouchableOpacity>

        <TouchableOpacity
          style={[
            styles.attendanceButton,
            styles.faceButton,
            locationStatus === 'invalid' && styles.disabledButton
          ]}
          onPress={markAttendanceWithFaceAndLocation}
          disabled={loading || locationStatus === 'invalid'}
        >
          {loading ? (
            <ActivityIndicator color={COLORS.background} />
          ) : (
            <>
              <Ionicons name="camera" size={24} color={COLORS.background} />
              <Text style={styles.buttonText}>Face Recognition + Location</Text>
            </>
          )}
        </TouchableOpacity>
      </View>

      {locationStatus === 'invalid' && (
        <View style={styles.warningCard}>
          <Ionicons name="warning" size={20} color={COLORS.destructive} />
          <Text style={styles.warningText}>
            You are outside the school area. Please move closer to mark attendance.
          </Text>
        </View>
      )}

      {locationStatus === 'unavailable' && (
        <View style={styles.warningCard}>
          <Ionicons name="information-circle" size={20} color={COLORS.muted} />
          <Text style={styles.warningText}>
            Location services are unavailable. Some features may be limited.
          </Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 16,
    backgroundColor: COLORS.background,
  },
  header: {
    alignItems: 'center',
    marginBottom: 24,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: COLORS.foreground,
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 14,
    color: COLORS.muted,
  },
  locationCard: {
    backgroundColor: COLORS.card,
    borderRadius: 12,
    padding: 16,
    marginBottom: 24,
  },
  locationHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  locationStatus: {
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
  locationDetails: {
    marginBottom: 16,
  },
  locationText: {
    fontSize: 14,
    color: COLORS.foreground,
    marginBottom: 4,
  },
  coordinatesText: {
    fontSize: 12,
    color: COLORS.muted,
    marginBottom: 2,
  },
  accuracyText: {
    fontSize: 12,
    color: COLORS.muted,
  },
  refreshButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  refreshText: {
    fontSize: 14,
    color: COLORS.primary,
    marginLeft: 8,
  },
  optionsContainer: {
    gap: 12,
    marginBottom: 24,
  },
  attendanceButton: {
    backgroundColor: COLORS.primary,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderRadius: 12,
    gap: 12,
  },
  faceButton: {
    backgroundColor: COLORS.secondary,
  },
  disabledButton: {
    backgroundColor: COLORS.muted,
    opacity: 0.6,
  },
  buttonText: {
    color: COLORS.background,
    fontSize: 16,
    fontWeight: '600',
  },
  warningCard: {
    backgroundColor: COLORS.card,
    borderRadius: 8,
    padding: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    borderLeftWidth: 4,
    borderLeftColor: COLORS.destructive,
  },
  warningText: {
    flex: 1,
    fontSize: 14,
    color: COLORS.foreground,
  },
});
