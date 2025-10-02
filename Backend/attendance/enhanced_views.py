from rest_framework import status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from django.conf import settings
from .geolocation import GeolocationService
from .models import AttendanceSession, Attendance
from users.models import User
from face_recognition.external_apis import ExternalFaceRecognitionService
import json

@api_view(['POST'])
@permission_classes([IsAuthenticated])
def validate_location(request):
    """
    Validate if user's location is suitable for attendance marking
    """
    try:
        latitude = float(request.data.get('latitude'))
        longitude = float(request.data.get('longitude'))
        accuracy = float(request.data.get('accuracy', 0))
        
        # Validate location using GeolocationService
        validation_result = GeolocationService.validate_attendance_location(latitude, longitude)
        
        return Response({
            'isValid': validation_result['is_valid'],
            'distance': validation_result['distance_from_school'],
            'address': validation_result['address'],
            'schoolRadius': validation_result['school_radius'],
            'accuracy': accuracy,
            'message': 'Location validated successfully' if validation_result['is_valid'] 
                      else f"You are {validation_result['distance_from_school']}m from school"
        })
        
    except (ValueError, TypeError) as e:
        return Response({
            'error': 'Invalid location data provided',
            'details': str(e)
        }, status=status.HTTP_400_BAD_REQUEST)
    except Exception as e:
        return Response({
            'error': 'Location validation failed',
            'details': str(e)
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

@api_view(['POST'])
@permission_classes([IsAuthenticated])
def mark_attendance_with_location(request):
    """
    Mark attendance with location verification
    """
    try:
        session_id = request.data.get('session_id')
        location_data = request.data.get('location', {})
        
        if not session_id:
            return Response({
                'error': 'Session ID is required'
            }, status=status.HTTP_400_BAD_REQUEST)
        
        # Get attendance session
        try:
            session = AttendanceSession.objects.get(id=session_id, is_active=True)
        except AttendanceSession.DoesNotExist:
            return Response({
                'error': 'Active attendance session not found'
            }, status=status.HTTP_404_NOT_FOUND)
        
        # Validate location if provided
        if location_data:
            latitude = float(location_data.get('latitude'))
            longitude = float(location_data.get('longitude'))
            
            validation_result = GeolocationService.validate_attendance_location(latitude, longitude)
            
            # Check if location is valid (configurable strict mode)
            location_settings = getattr(settings, 'LOCATION_VALIDATION', {})
            strict_mode = location_settings.get('strict_mode', False)
            
            if strict_mode and not validation_result['is_valid']:
                return Response({
                    'error': 'Location verification failed',
                    'message': f"You must be within {validation_result['school_radius']}m of school",
                    'distance': validation_result['distance_from_school']
                }, status=status.HTTP_403_FORBIDDEN)
        
        # Create or update attendance record
        attendance, created = Attendance.objects.get_or_create(
            student=request.user,
            session=session,
            defaults={
                'status': 'present',
                'method': 'location_verified',
                'location_data': json.dumps(location_data) if location_data else None,
                'notes': f"Marked via location verification. Distance: {validation_result.get('distance_from_school', 'N/A')}m"
            }
        )
        
        if not created:
            # Update existing record
            attendance.status = 'present'
            attendance.method = 'location_verified'
            attendance.location_data = json.dumps(location_data) if location_data else None
            attendance.save()
        
        return Response({
            'message': 'Attendance marked successfully',
            'attendance_id': str(attendance.id),
            'status': attendance.status,
            'location_verified': validation_result['is_valid'] if location_data else False,
            'distance_from_school': validation_result.get('distance_from_school') if location_data else None
        })
        
    except Exception as e:
        return Response({
            'error': 'Failed to mark attendance',
            'details': str(e)
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

@api_view(['POST'])
@permission_classes([IsAuthenticated])
def mark_attendance_with_face_and_location(request):
    """
    Mark attendance with both face recognition and location verification
    """
    try:
        session_id = request.data.get('session_id')
        face_image = request.data.get('face_image')  # Base64 encoded
        location_data = request.data.get('location', {})
        
        if not session_id or not face_image:
            return Response({
                'error': 'Session ID and face image are required'
            }, status=status.HTTP_400_BAD_REQUEST)
        
        # Get attendance session
        try:
            session = AttendanceSession.objects.get(id=session_id, is_active=True)
        except AttendanceSession.DoesNotExist:
            return Response({
                'error': 'Active attendance session not found'
            }, status=status.HTTP_404_NOT_FOUND)
        
        # Validate location first
        location_valid = False
        location_distance = None
        if location_data:
            latitude = float(location_data.get('latitude'))
            longitude = float(location_data.get('longitude'))
            validation_result = GeolocationService.validate_attendance_location(latitude, longitude)
            location_valid = validation_result['is_valid']
            location_distance = validation_result['distance_from_school']
        
        # Get user's registered face for comparison
        if not hasattr(request.user, 'face_encoding') or not request.user.face_encoding:
            return Response({
                'error': 'Face not registered',
                'message': 'Please register your face first before using face recognition attendance'
            }, status=status.HTTP_400_BAD_REQUEST)
        
        # Perform face recognition using external APIs
        face_service = ExternalFaceRecognitionService()
        face_result = face_service.multi_api_face_recognition(
            request.user.face_encoding,  # Stored face
            face_image  # Current photo
        )
        
        if not face_result['success']:
            return Response({
                'error': 'Face recognition failed',
                'details': face_result.get('error', 'Unknown error')
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
        
        # Check face recognition confidence
        face_settings = getattr(settings, 'FACE_RECOGNITION_SETTINGS', {})
        min_confidence = face_settings.get('confidence_threshold', 75.0)
        
        if not face_result['is_match'] or face_result['confidence'] < min_confidence:
            return Response({
                'error': 'Face verification failed',
                'message': 'Face does not match registered profile',
                'confidence': face_result['confidence']
            }, status=status.HTTP_403_FORBIDDEN)
        
        # Create attendance record
        method = 'face_and_location' if location_data else 'face_recognition'
        notes = f"Face verified (confidence: {face_result['confidence']:.1f}%, API: {face_result['api_used']})"
        if location_data:
            notes += f". Location: {'verified' if location_valid else 'outside area'} ({location_distance}m)"
        
        attendance, created = Attendance.objects.get_or_create(
            student=request.user,
            session=session,
            defaults={
                'status': 'present',
                'method': method,
                'location_data': json.dumps(location_data) if location_data else None,
                'notes': notes,
                'confidence_score': face_result['confidence']
            }
        )
        
        if not created:
            attendance.status = 'present'
            attendance.method = method
            attendance.location_data = json.dumps(location_data) if location_data else None
            attendance.notes = notes
            attendance.confidence_score = face_result['confidence']
            attendance.save()
        
        return Response({
            'message': 'Attendance marked successfully with face and location verification',
            'attendance_id': str(attendance.id),
            'face_confidence': face_result['confidence'],
            'face_api_used': face_result['api_used'],
            'location_verified': location_valid,
            'distance_from_school': location_distance
        })
        
    except Exception as e:
        return Response({
            'error': 'Failed to mark attendance',
            'details': str(e)
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
