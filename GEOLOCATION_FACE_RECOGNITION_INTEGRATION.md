# Geolocation and Face Recognition API Integration Guide

## Overview
This document provides comprehensive guidance for integrating geolocation and face recognition APIs into the Edynx mobile app for enhanced attendance functionality.

## 🚀 Quick Start

### 1. Backend Setup

#### Install Dependencies
```bash
cd Backend
pip install -r requirements_enhanced.txt
```

#### Environment Configuration
1. Copy `env_example.txt` to `.env`
2. Update with your actual API credentials:
   - AWS Rekognition credentials
   - Azure Face API key and endpoint
   - Google Cloud Vision service account key
   - School coordinates

#### Database Migration
```bash
python manage.py makemigrations attendance
python manage.py migrate
```

### 2. Frontend Setup

#### Install Dependencies
```bash
cd Fronted
npx expo install expo-location @react-native-async-storage/async-storage react-native-image-picker react-native-permissions
```

#### Update App Configuration
Add location permissions to `app.json`:
```json
{
  "expo": {
    "plugins": [
      [
        "expo-location",
        {
          "locationAlwaysAndWhenInUsePermission": "This app needs access to location for attendance verification."
        }
      ]
    ]
  }
}
```

## 📍 Geolocation Features

### Backend Implementation
- **GeolocationService**: Validates user location against school coordinates
- **Distance calculation**: Uses Haversine formula for accurate distance measurement
- **Configurable radius**: Set attendance allowed radius in settings
- **Address resolution**: Reverse geocoding for human-readable addresses

### Frontend Implementation
- **Permission handling**: Requests location permissions gracefully
- **Real-time location**: Gets current GPS coordinates with high accuracy
- **Location validation**: Checks if user is within school area
- **Visual feedback**: Shows location status with color-coded indicators

### API Endpoints
- `POST /api/attendance/validate-location/` - Validate user location
- `POST /api/attendance/mark-with-location/` - Mark attendance with location verification

## 🔍 Face Recognition Features

### Multi-API Support
The system supports multiple face recognition APIs for enhanced accuracy:

1. **AWS Rekognition**
   - High accuracy commercial API
   - Confidence scoring
   - Face comparison and verification

2. **Azure Face API**
   - Microsoft's cognitive services
   - Robust face detection and matching
   - Fallback option for AWS

3. **Google Cloud Vision**
   - Google's machine learning API
   - Additional verification layer
   - Face detection and analysis

### Backend Implementation
- **ExternalFaceRecognitionService**: Manages multiple API integrations
- **Fallback system**: Automatically tries alternative APIs if primary fails
- **Confidence scoring**: Configurable threshold for face match acceptance
- **Secure storage**: Face encodings stored securely in database

### Frontend Integration
- **Camera integration**: Uses device camera for face capture
- **Image processing**: Converts images to base64 for API transmission
- **Real-time feedback**: Shows face recognition status and confidence
- **Error handling**: Graceful handling of recognition failures

### API Endpoints
- `POST /api/attendance/mark-with-face-and-location/` - Combined face and location verification

## 🔧 Configuration

### School Location Settings
Update in `settings.py`:
```python
SCHOOL_LOCATION = {
    'latitude': 33.5731,  # Your school's latitude
    'longitude': -7.5898,  # Your school's longitude
    'radius_meters': 500,  # Allowed attendance radius
    'name': 'Your School Name'
}
```

### Face Recognition Settings
```python
FACE_RECOGNITION_SETTINGS = {
    'confidence_threshold': 75.0,  # Minimum confidence (0-100)
    'use_multiple_apis': True,     # Enable multi-API fallback
    'fallback_enabled': True,      # Enable local fallback
    'max_face_size_mb': 5,         # Maximum image size
}
```

### Location Validation Settings
```python
LOCATION_VALIDATION = {
    'enabled': True,               # Enable location validation
    'strict_mode': False,          # Require location for attendance
    'warning_distance': 1000,      # Warning threshold (meters)
    'offline_mode_enabled': True,  # Allow offline attendance
}
```

## 📱 Usage Examples

### Enhanced Attendance Component
```tsx
import EnhancedAttendanceMarking from '@/components/EnhancedAttendanceMarking';

<EnhancedAttendanceMarking
  sessionId="session-uuid"
  onAttendanceMarked={(success) => {
    if (success) {
      // Handle successful attendance
    }
  }}
/>
```

### Geolocation Service
```typescript
import { geolocationService } from '@/services/geolocation';

// Get current location
const location = await geolocationService.getCurrentLocation();

// Check if within school radius
const isWithinRadius = geolocationService.isWithinRadius(
  userLat, userLng, schoolLat, schoolLng, radiusMeters
);
```

## 🔒 Security Considerations

### API Key Management
- Store API keys in environment variables
- Never commit credentials to version control
- Use different keys for development/production

### Data Privacy
- Face encodings are stored securely
- Location data is encrypted in transit
- User consent required for biometric data

### Permission Handling
- Request permissions with clear explanations
- Graceful degradation when permissions denied
- Respect user privacy choices

## 🚨 Troubleshooting

### Common Issues

1. **Location Permission Denied**
   - Check app permissions in device settings
   - Ensure location services are enabled
   - Verify permission request implementation

2. **Face Recognition API Errors**
   - Verify API credentials are correct
   - Check internet connectivity
   - Ensure image format is supported

3. **Distance Calculation Inaccurate**
   - Check GPS accuracy settings
   - Verify school coordinates are correct
   - Consider GPS signal quality

### Debug Mode
Enable debug logging in Django settings:
```python
LOGGING = {
    'version': 1,
    'disable_existing_loggers': False,
    'handlers': {
        'file': {
            'level': 'DEBUG',
            'class': 'logging.FileHandler',
            'filename': 'attendance_debug.log',
        },
    },
    'loggers': {
        'attendance': {
            'handlers': ['file'],
            'level': 'DEBUG',
            'propagate': True,
        },
    },
}
```

## 📊 Performance Optimization

### Caching Strategies
- Cache location validation results
- Store face encodings efficiently
- Implement request throttling

### Network Optimization
- Compress images before API calls
- Implement retry mechanisms
- Use connection pooling for API requests

### Battery Optimization
- Limit location update frequency
- Use appropriate location accuracy settings
- Implement background task management

## 🔄 Testing

### Unit Tests
```python
# Test location validation
def test_location_validation():
    service = GeolocationService()
    result = service.validate_attendance_location(33.5731, -7.5898)
    assert result['is_valid'] == True

# Test face recognition
def test_face_recognition():
    service = ExternalFaceRecognitionService()
    result = service.multi_api_face_recognition(stored_face, current_photo)
    assert result['success'] == True
```

### Integration Tests
- Test complete attendance flow
- Verify API error handling
- Test permission scenarios

## 📈 Monitoring and Analytics

### Metrics to Track
- Location validation success rate
- Face recognition accuracy
- API response times
- User adoption rates

### Error Monitoring
- API failure rates
- Permission denial rates
- Location accuracy issues

## 🚀 Deployment

### Production Checklist
- [ ] Update API credentials
- [ ] Configure school coordinates
- [ ] Set up monitoring
- [ ] Test on physical devices
- [ ] Verify permissions work correctly
- [ ] Test offline scenarios

### Scaling Considerations
- API rate limits and quotas
- Database performance for location data
- Image storage and processing
- Network bandwidth requirements

## 📞 Support

For technical support or questions about this integration:
1. Check the troubleshooting section
2. Review API documentation
3. Test with debug logging enabled
4. Verify all dependencies are installed correctly

---

**Note**: This integration enhances security and accuracy of attendance marking while providing a seamless user experience. Regular testing and monitoring ensure optimal performance.
