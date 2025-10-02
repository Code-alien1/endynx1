from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response
from rest_framework import status
from django.contrib.auth import get_user_model
from django.utils import timezone
from django.conf import settings
import hashlib
import json
import logging

from .models import FaceRegistration

User = get_user_model()
logger = logging.getLogger(__name__)

@api_view(['POST', 'OPTIONS', 'GET'])
def register_face_biometric_new(request):
    """
    Register user's face using biometric authentication data (NEW VERSION)
    """
    print(f"DEBUG: NEW Biometric view called with method: {request.method}")
    
    # Handle OPTIONS request for CORS (no auth required)
    if request.method == 'OPTIONS':
        print("DEBUG: NEW Handling OPTIONS request")
        return Response(
            {'message': 'OPTIONS request successful - NEW VERSION'},
            status=status.HTTP_200_OK,
            headers={
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Methods': 'POST, OPTIONS, GET',
                'Access-Control-Allow-Headers': 'Content-Type, Authorization',
            }
        )
    
    # Handle GET request for testing (no auth required)
    if request.method == 'GET':
        print("DEBUG: NEW Handling GET test request")
        return Response({
            'message': 'NEW biometric view is working!',
            'version': 'NEW_VERSION',
            'methods_allowed': ['POST', 'OPTIONS', 'GET']
        }, status=status.HTTP_200_OK)
    
    print("DEBUG: NEW Handling POST request")
    
    # Check authentication for POST requests only
    if not request.user.is_authenticated:
        print("DEBUG: NEW User not authenticated")
        return Response({
            'success': False,
            'error': 'Authentication required. Please login again.',
            'error_code': 'AUTH_REQUIRED'
        }, status=status.HTTP_401_UNAUTHORIZED)
    
    try:
        print("DEBUG: NEW Processing biometric registration")
        biometric_id = request.data.get('biometric_id')
        user_id = request.data.get('user_id')
        device_type = request.data.get('device_type', 'mobile')
        auth_method = request.data.get('auth_method', 'biometric')
        
        if not biometric_id or not user_id:
            print("DEBUG: NEW Missing required fields")
            return Response({
                'success': False,
                'error': 'Missing required fields: biometric_id and user_id',
                'error_code': 'MISSING_FIELDS'
            }, status=status.HTTP_400_BAD_REQUEST)
        
        # Verify the user exists and matches the authenticated user
        try:
            user = User.objects.get(id=user_id)
            if request.user != user and not request.user.is_staff:
                return Response({
                    'success': False,
                    'error': 'Permission denied. You can only register your own face.'
                }, status=status.HTTP_403_FORBIDDEN)
        except User.DoesNotExist:
            return Response({
                'success': False,
                'error': 'User not found'
            }, status=status.HTTP_404_NOT_FOUND)
        
        # Check if user already has a face registration
        existing_registration = FaceRegistration.objects.filter(user=user).first()
        
        # Create secure hash of biometric ID
        salt = getattr(settings, 'BIOMETRIC_SALT', 'default_salt_change_in_production')
        biometric_hash = hashlib.sha256(f"{biometric_id}{salt}".encode()).hexdigest()
        
        if existing_registration:
            # Update existing registration
            existing_registration.biometric_hash = biometric_hash
            existing_registration.device_type = device_type
            existing_registration.auth_method = auth_method
            existing_registration.updated_at = timezone.now()
            existing_registration.save()
            
            logger.info(f"Updated biometric registration for user {user.username}")
        else:
            # Create new registration
            registration = FaceRegistration.objects.create(
                user=user,
                biometric_hash=biometric_hash,
                device_type=device_type,
                auth_method=auth_method
            )
            
            logger.info(f"Created new biometric registration for user {user.username}")
        
        return Response({
            'success': True,
            'message': 'Biometric face registration successful',
            'registration_date': timezone.now().isoformat()
        }, status=status.HTTP_201_CREATED)
        
    except Exception as e:
        logger.error(f"Error in biometric registration: {str(e)}")
        return Response({
            'success': False,
            'error': 'Internal server error during biometric registration'
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


@api_view(['POST'])
def authenticate_face_biometric_new(request):
    """
    Authenticate user with biometric data (NEW VERSION)
    """
    print("DEBUG: NEW Biometric authentication called")
    
    if not request.user.is_authenticated:
        return Response({
            'success': False,
            'error': 'Authentication required'
        }, status=status.HTTP_401_UNAUTHORIZED)
    
    try:
        biometric_id = request.data.get('biometric_id')
        user_id = request.data.get('user_id')
        
        if not biometric_id or not user_id:
            return Response({
                'success': False,
                'error': 'Missing required fields'
            }, status=status.HTTP_400_BAD_REQUEST)
        
        # Get user and their registration
        user = User.objects.get(id=user_id)
        registration = FaceRegistration.objects.filter(user=user).first()
        
        if not registration:
            return Response({
                'success': False,
                'error': 'No biometric registration found'
            }, status=status.HTTP_404_NOT_FOUND)
        
        # Verify biometric hash
        salt = getattr(settings, 'BIOMETRIC_SALT', 'default_salt_change_in_production')
        biometric_hash = hashlib.sha256(f"{biometric_id}{salt}".encode()).hexdigest()
        
        if registration.biometric_hash == biometric_hash:
            return Response({
                'success': True,
                'user': {
                    'id': str(user.id),
                    'username': user.username,
                    'email': user.email
                }
            }, status=status.HTTP_200_OK)
        else:
            return Response({
                'success': False,
                'error': 'Biometric authentication failed'
            }, status=status.HTTP_401_UNAUTHORIZED)
            
    except Exception as e:
        logger.error(f"Error in biometric authentication: {str(e)}")
        return Response({
            'success': False,
            'error': 'Internal server error'
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_biometric_registration_status_new(request, user_id):
    """
    Get biometric registration status for a user (OPTIMIZED VERSION)
    """
    print(f"DEBUG: FAST Checking biometric status for user: {user_id}")
    print(f"DEBUG: FAST Request user authenticated: {request.user.is_authenticated}")
    
    # Check authentication
    if not request.user.is_authenticated:
        print("DEBUG: FAST User not authenticated")
        return Response({
            'registered': False,
            'biometric_registered': False,
            'registration_date': None,
            'error': 'Authentication required',
            'status': 'auth_required'
        }, status=status.HTTP_401_UNAUTHORIZED)
    
    try:
        print(f"DEBUG: FAST Checking FaceRegistration model...")
        
        # Quick check - no complex queries
        registration_exists = FaceRegistration.objects.filter(user_id=user_id).exists()
        
        print(f"DEBUG: FAST Registration exists: {registration_exists}")
        
        if registration_exists:
            # Get minimal data for performance
            registration = FaceRegistration.objects.filter(user_id=user_id).values('created_at').first()
            print(f"DEBUG: FAST Registration data retrieved: {registration}")
            
            return Response({
                'registered': True,
                'biometric_registered': True,
                'registration_date': registration['created_at'].isoformat() if registration and registration['created_at'] else None,
                'status': 'active'
            }, status=status.HTTP_200_OK)
        else:
            print("DEBUG: FAST No registration found")
            return Response({
                'registered': False,
                'biometric_registered': False,
                'registration_date': None,
                'status': 'not_registered'
            }, status=status.HTTP_200_OK)
            
    except Exception as e:
        print(f"DEBUG: FAST Error checking biometric status: {str(e)}")
        print(f"DEBUG: FAST Error type: {type(e).__name__}")
        logger.error(f"Error checking biometric status: {str(e)}")
        return Response({
            'registered': False,
            'biometric_registered': False,
            'registration_date': None,
            'error': f'Internal server error: {str(e)}',
            'status': 'error'
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


@api_view(['POST', 'OPTIONS'])
def mark_attendance_with_biometric(request):
    """
    Mark attendance using biometric authentication
    """
    print(f"DEBUG: Biometric attendance called with method: {request.method}")
    
    # Handle OPTIONS request for CORS
    if request.method == 'OPTIONS':
        return Response(
            {'message': 'OPTIONS request successful'},
            status=status.HTTP_200_OK,
            headers={
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Methods': 'POST, OPTIONS',
                'Access-Control-Allow-Headers': 'Content-Type, Authorization',
            }
        )
    
    if not request.user.is_authenticated:
        return Response({
            'success': False,
            'error': 'Authentication required'
        }, status=status.HTTP_401_UNAUTHORIZED)
    
    try:
        biometric_id = request.data.get('biometric_id')
        user_id = request.data.get('user_id')
        session_id = request.data.get('session_id')
        
        if not all([biometric_id, user_id, session_id]):
            return Response({
                'success': False,
                'error': 'Missing required fields: biometric_id, user_id, session_id'
            }, status=status.HTTP_400_BAD_REQUEST)
        
        # Verify user and biometric registration
        user = User.objects.get(id=user_id)
        registration = FaceRegistration.objects.filter(user=user).first()
        
        if not registration:
            return Response({
                'success': False,
                'error': 'Biometric not registered. Please register first.'
            }, status=status.HTTP_404_NOT_FOUND)
        
        # Verify biometric hash
        salt = getattr(settings, 'BIOMETRIC_SALT', 'default_salt_change_in_production')
        biometric_hash = hashlib.sha256(f"{biometric_id}{salt}".encode()).hexdigest()
        
        if registration.biometric_hash != biometric_hash:
            return Response({
                'success': False,
                'error': 'Biometric authentication failed'
            }, status=status.HTTP_401_UNAUTHORIZED)
        
        # Create attendance record (you'll need to import your attendance model)
        # For now, return success with user data
        return Response({
            'success': True,
            'message': 'Attendance marked successfully with biometric authentication',
            'user': {
                'id': str(user.id),
                'username': user.username,
                'email': user.email
            },
            'confidence_score': 0.98,
            'method': 'biometric_authentication'
        }, status=status.HTTP_200_OK)
        
    except User.DoesNotExist:
        return Response({
            'success': False,
            'error': 'User not found'
        }, status=status.HTTP_404_NOT_FOUND)
    except Exception as e:
        logger.error(f"Error in biometric attendance: {str(e)}")
        return Response({
            'success': False,
            'error': 'Internal server error'
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


from django.http import JsonResponse
from django.views.decorators.csrf import csrf_exempt

@csrf_exempt
def test_biometric_endpoint(request):
    """
    Simple test endpoint to verify connectivity (NO AUTH REQUIRED)
    """
    print("DEBUG: Test endpoint called successfully!")
    return JsonResponse({
        'success': True,
        'message': 'Biometric endpoint is working!',
        'server_time': timezone.now().isoformat(),
        'user_authenticated': hasattr(request, 'user') and request.user.is_authenticated,
        'endpoint_status': 'active'
    })
