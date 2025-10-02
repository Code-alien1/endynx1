"""
SIMPLE BIOMETRIC ATTENDANCE VIEWS
Clean and secure biometric attendance marking
"""
from django.http import JsonResponse
from django.views.decorators.csrf import csrf_exempt
from django.views.decorators.http import require_http_methods
from django.contrib.auth import get_user_model
from django.utils import timezone
import json
import logging

from .models import Attendance, AttendanceSession, Class

User = get_user_model()
logger = logging.getLogger(__name__)

@csrf_exempt
@require_http_methods(["POST"])
def mark_biometric_attendance(request):
    """
    Mark attendance after successful biometric verification on mobile device
    Only receives confirmation - no biometric data is transmitted
    """
    try:
        # Parse request data
        data = json.loads(request.body)
        user_id = data.get('userId')
        biometric_verified = data.get('biometric_verified', False)
        session_id = data.get('session_id', None)
        location_data = data.get('location', None)
        
        # Validate required fields
        if not user_id:
            return JsonResponse({
                'success': False,
                'error': 'User ID is required'
            }, status=400)
        
        if not biometric_verified:
            return JsonResponse({
                'success': False,
                'error': 'Biometric verification required'
            }, status=400)
        
        # Get user
        try:
            user = User.objects.get(id=user_id)
        except User.DoesNotExist:
            return JsonResponse({
                'success': False,
                'error': 'User not found'
            }, status=404)
        
        # Find or create today's attendance session
        today = timezone.now().date()
        
        if session_id:
            # Use specific session if provided
            try:
                session = AttendanceSession.objects.get(id=session_id, is_active=True)
            except AttendanceSession.DoesNotExist:
                return JsonResponse({
                    'success': False,
                    'error': 'Session not found or inactive'
                }, status=404)
        else:
            # Find user's class and get/create today's session
            user_class = Class.objects.filter(students=user).first()
            if not user_class:
                return JsonResponse({
                    'success': False,
                    'error': 'Student not enrolled in any class'
                }, status=400)
            
            # Get or create today's session
            session, created = AttendanceSession.objects.get_or_create(
                class_obj=user_class,
                date=today,
                session_type='morning',  # Default session
                defaults={
                    'start_time': timezone.now().time(),
                    'end_time': (timezone.now() + timezone.timedelta(hours=8)).time(),
                    'created_by': user_class.teacher,
                    'is_active': True
                }
            )
            
            if created:
                logger.info(f"Created new session for class {user_class.name} on {today}")
        
        # Check if attendance already exists
        existing_attendance = Attendance.objects.filter(
            student=user,
            session=session
        ).first()
        
        if existing_attendance:
            return JsonResponse({
                'success': False,
                'error': 'Attendance already marked for this session',
                'attendance': {
                    'status': existing_attendance.status,
                    'timestamp': existing_attendance.timestamp.isoformat(),
                    'method': existing_attendance.method
                }
            }, status=400)
        
        # Create attendance record with location data if provided
        attendance_data = {
            'student': user,
            'session': session,
            'status': 'present',
            'method': 'face_recognition',  # Using this for biometric
            'timestamp': timezone.now(),
            'confidence_score': 1.0,  # High confidence for biometric verification
            'notes': 'Biometric attendance - verified on device'
        }
        
        # Add location data if provided
        if location_data:
            attendance_data['location_data'] = location_data
            attendance_data['method'] = 'face_and_location'  # Updated method for biometric + location
            attendance_data['notes'] = 'Biometric + Location attendance - verified on device'
        
        attendance = Attendance.objects.create(**attendance_data)
        
        logger.info(f"Biometric attendance marked for {user.username} in session {session.id}")
        
        return JsonResponse({
            'success': True,
            'message': 'Attendance marked successfully',
            'attendance': {
                'id': str(attendance.id),
                'status': attendance.status,
                'method': attendance.method,
                'timestamp': attendance.timestamp.isoformat(),
                'confidence_score': float(attendance.confidence_score),
                'session': {
                    'id': str(session.id),
                    'date': session.date.isoformat(),
                    'class_name': session.class_obj.name,
                    'session_type': session.get_session_type_display()
                }
            }
        })
        
    except json.JSONDecodeError:
        return JsonResponse({
            'success': False,
            'error': 'Invalid JSON data'
        }, status=400)
    except Exception as e:
        logger.error(f"Biometric attendance error: {str(e)}")
        return JsonResponse({
            'success': False,
            'error': 'Failed to mark attendance'
        }, status=500)

@csrf_exempt
@require_http_methods(["GET"])
def get_user_sessions(request, user_id):
    """
    Get available attendance sessions for a user
    """
    try:
        user = User.objects.get(id=user_id)
        
        # Get user's classes
        user_classes = Class.objects.filter(students=user)
        
        # Get today's active sessions
        today = timezone.now().date()
        sessions = AttendanceSession.objects.filter(
            class_obj__in=user_classes,
            date=today,
            is_active=True
        ).select_related('class_obj')
        
        sessions_data = []
        for session in sessions:
            # Check if attendance already marked
            attendance_exists = Attendance.objects.filter(
                student=user,
                session=session
            ).exists()
            
            sessions_data.append({
                'id': str(session.id),
                'class_name': session.class_obj.name,
                'session_type': session.get_session_type_display(),
                'date': session.date.isoformat(),
                'start_time': session.start_time.strftime('%H:%M'),
                'end_time': session.end_time.strftime('%H:%M'),
                'attendance_marked': attendance_exists
            })
        
        return JsonResponse({
            'success': True,
            'sessions': sessions_data,
            'total_sessions': len(sessions_data)
        })
        
    except User.DoesNotExist:
        return JsonResponse({
            'success': False,
            'error': 'User not found'
        }, status=404)
    except Exception as e:
        logger.error(f"Get sessions error: {str(e)}")
        return JsonResponse({
            'success': False,
            'error': 'Failed to get sessions'
        }, status=500)

@csrf_exempt
@require_http_methods(["GET"])
def biometric_test(request):
    """Test endpoint for biometric attendance system"""
    return JsonResponse({
        'success': True,
        'message': 'Biometric attendance system is working!',
        'timestamp': timezone.now().isoformat(),
        'server': 'Django Backend',
        'endpoints': {
            'mark_attendance': '/api/attendance/biometric/',
            'get_sessions': '/api/attendance/sessions/{user_id}/',
            'test': '/api/attendance/biometric-test/'
        }
    })
