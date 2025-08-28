from rest_framework import status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated, AllowAny
from rest_framework.response import Response
from django.contrib.auth import get_user_model
from django.utils.decorators import method_decorator
from django.views.decorators.csrf import csrf_exempt
from django.views.decorators.cache import never_cache
from django.http import JsonResponse
import json
import logging
from .services_simple import face_recognition_service
from .models import FaceRecognitionSettings, FaceRecognitionAttempt, FaceRecognitionAuditLog

User = get_user_model()
logger = logging.getLogger(__name__)


def get_client_ip(request):
    """Get client IP address from request"""
    x_forwarded_for = request.META.get('HTTP_X_FORWARDED_FOR')
    if x_forwarded_for:
        ip = x_forwarded_for.split(',')[0]
    else:
        ip = request.META.get('REMOTE_ADDR')
    return ip


def get_request_metadata(request):
    """Extract request metadata for logging"""
    return {
        'ip_address': get_client_ip(request),
        'user_agent': request.META.get('HTTP_USER_AGENT', ''),
        'device_info': request.META.get('HTTP_X_DEVICE_INFO', ''),
    }


@api_view(['POST'])
@permission_classes([AllowAny])
@csrf_exempt
@never_cache
def face_recognition_endpoint(request):
    """
    Main face recognition endpoint for authentication and registration
    
    POST /api/face-recognition/
    {
        "image": "base64_encoded_image_data",
        "action": "authenticate" | "register",
        "user_id": "uuid" // required for registration
    }
    """
    try:
        # Parse request data
        if request.content_type == 'application/json':
            data = json.loads(request.body)
        else:
            data = request.data
        
        image_data = data.get('image')
        action = data.get('action')
        user_id = data.get('user_id')
        
        # Validate required fields
        if not image_data:
            return Response({
                'success': False,
                'error': 'Image data is required'
            }, status=status.HTTP_400_BAD_REQUEST)
        
        if not action or action not in ['authenticate', 'register']:
            return Response({
                'success': False,
                'error': 'Valid action is required (authenticate or register)'
            }, status=status.HTTP_400_BAD_REQUEST)
        
        # Get request metadata
        request_meta = get_request_metadata(request)
        
        # Process based on action
        if action == 'authenticate':
            result = face_recognition_service.process_face_authentication(
                image_data=image_data,
                request_meta=request_meta
            )
            
            if result['success']:
                return Response(result, status=status.HTTP_200_OK)
            else:
                # Determine appropriate HTTP status code
                error_msg = result.get('error', '')
                if 'not recognized' in error_msg.lower() or 'no match' in error_msg.lower():
                    return Response(result, status=status.HTTP_404_NOT_FOUND)
                elif 'no face' in error_msg.lower() or 'multiple faces' in error_msg.lower():
                    return Response(result, status=status.HTTP_400_BAD_REQUEST)
                else:
                    return Response(result, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
        
        elif action == 'register':
            if not user_id:
                return Response({
                    'success': False,
                    'error': 'User ID is required for registration'
                }, status=status.HTTP_400_BAD_REQUEST)
            
            result = face_recognition_service.process_face_registration(
                image_data=image_data,
                user_id=user_id,
                request_meta=request_meta
            )
            
            if result['success']:
                return Response(result, status=status.HTTP_200_OK)
            else:
                error_msg = result.get('error', '')
                if 'user not found' in error_msg.lower():
                    return Response(result, status=status.HTTP_404_NOT_FOUND)
                elif 'no face' in error_msg.lower() or 'multiple faces' in error_msg.lower():
                    return Response(result, status=status.HTTP_400_BAD_REQUEST)
                else:
                    return Response(result, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
    
    except json.JSONDecodeError:
        return Response({
            'success': False,
            'error': 'Invalid JSON data'
        }, status=status.HTTP_400_BAD_REQUEST)
    
    except Exception as e:
        logger.error(f"Face recognition endpoint error: {str(e)}")
        return Response({
            'success': False,
            'error': 'Internal server error'
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


@api_view(['PUT'])
@permission_classes([IsAuthenticated])
def update_face_registration(request):
    """
    Update existing face registration
    
    PUT /api/face-recognition/
    {
        "image": "base64_encoded_image_data",
        "user_id": "uuid" // optional, defaults to current user
    }
    """
    try:
        data = request.data
        image_data = data.get('image')
        user_id = data.get('user_id', str(request.user.id))
        
        if not image_data:
            return Response({
                'success': False,
                'error': 'Image data is required'
            }, status=status.HTTP_400_BAD_REQUEST)
        
        # Check if user can update this registration
        if str(request.user.id) != user_id and not request.user.is_staff:
            return Response({
                'success': False,
                'error': 'Permission denied'
            }, status=status.HTTP_403_FORBIDDEN)
        
        request_meta = get_request_metadata(request)
        request_meta['admin_user'] = request.user
        
        result = face_recognition_service.process_face_registration(
            image_data=image_data,
            user_id=user_id,
            request_meta=request_meta
        )
        
        if result['success']:
            return Response(result, status=status.HTTP_200_OK)
        else:
            error_msg = result.get('error', '')
            if 'user not found' in error_msg.lower():
                return Response(result, status=status.HTTP_404_NOT_FOUND)
            else:
                return Response(result, status=status.HTTP_400_BAD_REQUEST)
    
    except Exception as e:
        logger.error(f"Face registration update error: {str(e)}")
        return Response({
            'success': False,
            'error': 'Internal server error'
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


@api_view(['DELETE'])
@permission_classes([IsAuthenticated])
def delete_face_registration(request, user_id):
    """
    Delete face registration
    
    DELETE /api/face-recognition/{user_id}/
    """
    try:
        # Check if user can delete this registration
        if str(request.user.id) != user_id and not request.user.is_staff:
            return Response({
                'success': False,
                'error': 'Permission denied'
            }, status=status.HTTP_403_FORBIDDEN)
        
        request_meta = get_request_metadata(request)
        request_meta['admin_user'] = request.user
        
        result = face_recognition_service.delete_face_registration(
            user_id=user_id,
            request_meta=request_meta
        )
        
        if result['success']:
            return Response(result, status=status.HTTP_200_OK)
        else:
            error_msg = result.get('error', '')
            if 'not found' in error_msg.lower():
                return Response(result, status=status.HTTP_404_NOT_FOUND)
            else:
                return Response(result, status=status.HTTP_400_BAD_REQUEST)
    
    except Exception as e:
        logger.error(f"Face registration deletion error: {str(e)}")
        return Response({
            'success': False,
            'error': 'Internal server error'
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def face_registration_status(request, user_id):
    """
    Get face registration status
    
    GET /api/face-recognition/status/{user_id}/
    """
    try:
        # Check if user can view this status
        if str(request.user.id) != user_id and not request.user.is_staff:
            return Response({
                'success': False,
                'error': 'Permission denied'
            }, status=status.HTTP_403_FORBIDDEN)
        
        result = face_recognition_service.get_face_registration_status(user_id)
        
        return Response(result, status=status.HTTP_200_OK)
    
    except Exception as e:
        logger.error(f"Face registration status error: {str(e)}")
        return Response({
            'success': False,
            'error': 'Internal server error'
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


@api_view(['POST'])
@permission_classes([AllowAny])
@csrf_exempt
@never_cache
def face_attendance_endpoint(request):
    """
    Face recognition endpoint for attendance marking
    
    POST /api/face-recognition/attendance/
    {
        "image": "base64_encoded_image_data"
    }
    """
    try:
        # Parse request data
        if request.content_type == 'application/json':
            data = json.loads(request.body)
        else:
            data = request.data
        
        image_data = data.get('image')
        
        # Validate required fields
        if not image_data:
            return Response({
                'success': False,
                'error': 'Image data is required'
            }, status=status.HTTP_400_BAD_REQUEST)
        
        # Get request metadata
        request_meta = get_request_metadata(request)
        
        # Process face recognition for attendance
        result = face_recognition_service.process_face_attendance(
            image_data=image_data,
            request_meta=request_meta
        )
        
        if result['success']:
            return Response(result, status=status.HTTP_200_OK)
        else:
            # Determine appropriate HTTP status code
            error_msg = result.get('error', '')
            if 'not recognized' in error_msg.lower():
                return Response(result, status=status.HTTP_404_NOT_FOUND)
            elif 'no face' in error_msg.lower() or 'multiple faces' in error_msg.lower():
                return Response(result, status=status.HTTP_400_BAD_REQUEST)
            else:
                return Response(result, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
    
    except json.JSONDecodeError:
        return Response({
            'success': False,
            'error': 'Invalid JSON data'
        }, status=status.HTTP_400_BAD_REQUEST)
    
    except Exception as e:
        logger.error(f"Face attendance endpoint error: {str(e)}")
        return Response({
            'success': False,
            'error': 'Internal server error'
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def face_registration_endpoint(request):
    """
    Face registration endpoint for students
    
    POST /api/face-recognition/register/
    {
        "image": "base64_encoded_image_data",
        "user_id": "uuid"
    }
    """
    try:
        data = request.data
        image_data = data.get('image')
        user_id = data.get('user_id', str(request.user.id))
        
        if not image_data:
            return Response({
                'success': False,
                'error': 'Image data is required'
            }, status=status.HTTP_400_BAD_REQUEST)
        
        # Check if user can register for this user_id
        if str(request.user.id) != user_id and not request.user.is_staff:
            return Response({
                'success': False,
                'error': 'Permission denied'
            }, status=status.HTTP_403_FORBIDDEN)
        
        request_meta = get_request_metadata(request)
        request_meta['user'] = request.user
        
        result = face_recognition_service.process_face_registration(
            image_data=image_data,
            user_id=user_id,
            request_meta=request_meta
        )
        
        if result['success']:
            return Response(result, status=status.HTTP_201_CREATED)
        else:
            error_msg = result.get('error', '')
            if 'user not found' in error_msg.lower():
                return Response(result, status=status.HTTP_404_NOT_FOUND)
            elif 'already registered' in error_msg.lower():
                return Response(result, status=status.HTTP_409_CONFLICT)
            else:
                return Response(result, status=status.HTTP_400_BAD_REQUEST)
    
    except Exception as e:
        logger.error(f"Face registration error: {str(e)}")
        return Response({
            'success': False,
            'error': 'Internal server error'
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def face_authenticate_endpoint(request):
    """
    Face authentication endpoint for attendance
    
    POST /api/face-recognition/authenticate/
    {
        "image": "base64_encoded_image_data"
    }
    """
    try:
        data = request.data
        image_data = data.get('image')
        
        if not image_data:
            return Response({
                'success': False,
                'error': 'Image data is required'
            }, status=status.HTTP_400_BAD_REQUEST)
        
        request_meta = get_request_metadata(request)
        request_meta['user'] = request.user
        
        result = face_recognition_service.process_face_authentication(
            image_data=image_data,
            request_meta=request_meta
        )
        
        if result['success']:
            return Response(result, status=status.HTTP_200_OK)
        else:
            error_msg = result.get('error', '')
            if 'not recognized' in error_msg.lower() or 'no match' in error_msg.lower():
                return Response(result, status=status.HTTP_404_NOT_FOUND)
            elif 'no face' in error_msg.lower() or 'multiple faces' in error_msg.lower():
                return Response(result, status=status.HTTP_400_BAD_REQUEST)
            else:
                return Response(result, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
    
    except Exception as e:
        logger.error(f"Face authentication error: {str(e)}")
        return Response({
            'success': False,
            'error': 'Internal server error'
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)