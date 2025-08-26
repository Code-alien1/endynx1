import base64
import json
import time
import logging
import random
from typing import Optional, Tuple, List, Dict, Any
from django.contrib.auth import get_user_model
from django.core.files.base import ContentFile
from django.utils import timezone
from .models import FaceEncoding, FaceRecognitionAttempt, FaceRecognitionSettings, FaceRecognitionAuditLog

User = get_user_model()
logger = logging.getLogger(__name__)


class MockFaceRecognitionService:
    """
    Mock face recognition service for development and testing
    This simulates face recognition functionality without requiring actual ML libraries
    """
    
    def __init__(self):
        try:
            self.settings = FaceRecognitionSettings.get_settings()
        except Exception:
            # Use default settings if database is not ready
            self.settings = None
    
    def process_face_authentication(self, image_data: str, request_meta: Dict = None) -> Dict[str, Any]:
        """
        Mock face authentication - simulates the process
        """
        start_time = time.time()
        attempt_data = {
            'attempt_type': 'authentication',
            'ip_address': request_meta.get('ip_address') if request_meta else None,
            'user_agent': request_meta.get('user_agent') if request_meta else None,
        }
        
        try:
            # Check if face recognition is enabled
            if not self.settings.enable_face_recognition:
                return self._create_error_response(
                    "Face recognition is currently disabled",
                    attempt_data,
                    'error'
                )
            
            # Mock image validation
            if not self._mock_validate_image(image_data):
                return self._create_error_response(
                    "Invalid image data",
                    attempt_data,
                    'error'
                )
            
            # Mock face detection
            faces_detected = random.randint(0, 2)  # Simulate 0-2 faces
            
            if faces_detected == 0:
                return self._create_error_response(
                    "No face detected in the image",
                    attempt_data,
                    'no_face'
                )
            
            if faces_detected > 1:
                return self._create_error_response(
                    "Multiple faces detected. Please ensure only one face is visible.",
                    attempt_data,
                    'multiple_faces'
                )
            
            attempt_data['faces_detected'] = faces_detected
            
            # Mock face matching - find a user with face encoding
            user, confidence = self._mock_find_matching_user()
            
            if user is None:
                return self._create_error_response(
                    "Face not recognized. Please register your face first or use email login.",
                    attempt_data,
                    'no_match'
                )
            
            # Log successful attempt
            processing_time = time.time() - start_time
            attempt_data.update({
                'user': user,
                'result': 'success',
                'confidence_score': confidence,
                'processing_time': processing_time,
                'image_size': len(image_data) * 3 // 4,  # Approximate base64 decoded size
                'image_width': 640,
                'image_height': 480,
            })
            
            self._log_attempt(attempt_data)
            
            # Log audit trail
            self._log_audit_action(
                user=user,
                action_type='authentication',
                description=f"Mock face authentication with {confidence:.2%} confidence",
                request_meta=request_meta
            )
            
            return {
                'success': True,
                'user': {
                    'id': str(user.id),
                    'username': user.username,
                    'email': user.email,
                    'first_name': user.first_name,
                    'last_name': user.last_name,
                    'role': user.role,
                },
                'confidence': confidence,
                'message': 'Mock authentication successful'
            }
            
        except Exception as e:
            logger.error(f"Mock face authentication error: {str(e)}")
            processing_time = time.time() - start_time
            attempt_data.update({
                'result': 'error',
                'processing_time': processing_time,
                'error_message': str(e)
            })
            self._log_attempt(attempt_data)
            
            return {
                'success': False,
                'error': 'System error during face authentication. Please try again.'
            }
    
    def process_face_registration(self, image_data: str, user_id: str, request_meta: Dict = None) -> Dict[str, Any]:
        """
        Mock face registration - simulates the process
        """
        start_time = time.time()
        
        try:
            # Get user
            user = User.objects.get(id=user_id)
        except User.DoesNotExist:
            return {
                'success': False,
                'error': 'User not found'
            }
        
        attempt_data = {
            'attempt_type': 'registration',
            'user': user,
            'ip_address': request_meta.get('ip_address') if request_meta else None,
            'user_agent': request_meta.get('user_agent') if request_meta else None,
        }
        
        try:
            # Check if face recognition is enabled
            if not self.settings.enable_face_recognition:
                return self._create_error_response(
                    "Face recognition is currently disabled",
                    attempt_data,
                    'error'
                )
            
            # Mock image validation
            if not self._mock_validate_image(image_data):
                return self._create_error_response(
                    "Invalid image data",
                    attempt_data,
                    'error'
                )
            
            # Mock face detection
            faces_detected = random.randint(0, 2)
            
            if faces_detected == 0:
                return self._create_error_response(
                    "No face detected in the image",
                    attempt_data,
                    'no_face'
                )
            
            if faces_detected > 1:
                return self._create_error_response(
                    "Multiple faces detected. Please ensure only one face is visible.",
                    attempt_data,
                    'multiple_faces'
                )
            
            attempt_data['faces_detected'] = faces_detected
            
            # Mock face encoding generation
            mock_encoding = [random.random() for _ in range(128)]  # 128-dimensional encoding
            quality_score = random.uniform(0.7, 0.95)  # Good quality score
            
            # Check if user already has face encoding
            existing_encoding = None
            try:
                existing_encoding = FaceEncoding.objects.get(user=user)
                attempt_data['attempt_type'] = 'update'
            except FaceEncoding.DoesNotExist:
                pass
            
            # Create or update face encoding
            if existing_encoding:
                existing_encoding.set_encoding_array(mock_encoding)
                existing_encoding.confidence_score = quality_score
                existing_encoding.image_quality = quality_score
                existing_encoding.update_count += 1
                existing_encoding.source_image_width = 640
                existing_encoding.source_image_height = 480
                existing_encoding.set_bounding_box([100, 540, 380, 100])  # Mock bounding box
                existing_encoding.save()
                
                message = "Face registration updated successfully (Mock)"
                action_description = f"Mock face encoding updated (update #{existing_encoding.update_count})"
            else:
                face_encoding_obj = FaceEncoding.objects.create(
                    user=user,
                    confidence_score=quality_score,
                    image_quality=quality_score,
                    source_image_width=640,
                    source_image_height=480,
                    face_landmarks_count=68,
                )
                face_encoding_obj.set_encoding_array(mock_encoding)
                face_encoding_obj.set_bounding_box([100, 540, 380, 100])
                face_encoding_obj.save()
                
                message = "Face registered successfully (Mock)"
                action_description = "New mock face encoding registered"
            
            # Store face image if enabled
            if self.settings.enable_image_storage:
                self._store_face_image(user, image_data)
            
            # Log successful attempt
            processing_time = time.time() - start_time
            attempt_data.update({
                'result': 'success',
                'confidence_score': quality_score,
                'processing_time': processing_time,
                'image_size': len(image_data) * 3 // 4,
                'image_width': 640,
                'image_height': 480,
            })
            
            self._log_attempt(attempt_data)
            
            # Log audit trail
            self._log_audit_action(
                user=user,
                action_type='registration' if not existing_encoding else 'update',
                description=action_description,
                request_meta=request_meta
            )
            
            return {
                'success': True,
                'message': message
            }
            
        except Exception as e:
            logger.error(f"Mock face registration error: {str(e)}")
            processing_time = time.time() - start_time
            attempt_data.update({
                'result': 'error',
                'processing_time': processing_time,
                'error_message': str(e)
            })
            self._log_attempt(attempt_data)
            
            return {
                'success': False,
                'error': 'System error during face registration. Please try again.'
            }
    
    def delete_face_registration(self, user_id: str, request_meta: Dict = None) -> Dict[str, Any]:
        """
        Delete user's face registration
        """
        try:
            user = User.objects.get(id=user_id)
            face_encoding = FaceEncoding.objects.get(user=user)
            
            face_encoding.delete()
            
            # Clear face image from user model
            if user.face_image:
                user.face_image.delete()
                user.face_encoding = None
                user.save()
            
            # Log audit trail
            self._log_audit_action(
                user=user,
                action_type='deletion',
                description="Mock face registration deleted",
                request_meta=request_meta
            )
            
            return {
                'success': True,
                'message': 'Face registration deleted successfully'
            }
            
        except User.DoesNotExist:
            return {
                'success': False,
                'error': 'User not found'
            }
        except FaceEncoding.DoesNotExist:
            return {
                'success': False,
                'error': 'No face registration found for this user'
            }
        except Exception as e:
            logger.error(f"Face deletion error: {str(e)}")
            return {
                'success': False,
                'error': 'System error during face deletion'
            }
    
    def get_face_registration_status(self, user_id: str) -> Dict[str, Any]:
        """
        Get face registration status for user
        """
        try:
            user = User.objects.get(id=user_id)
            
            try:
                face_encoding = FaceEncoding.objects.get(user=user)
                return {
                    'registered': True,
                    'registration_date': face_encoding.registration_date.isoformat(),
                    'last_updated': face_encoding.last_updated.isoformat(),
                    'update_count': face_encoding.update_count,
                    'confidence_score': face_encoding.confidence_score,
                }
            except FaceEncoding.DoesNotExist:
                return {
                    'registered': False
                }
                
        except User.DoesNotExist:
            return {
                'registered': False,
                'error': 'User not found'
            }
    
    def _mock_validate_image(self, image_data: str) -> bool:
        """
        Mock image validation - basic checks
        """
        try:
            # Check if it's valid base64
            image_bytes = base64.b64decode(image_data)
            
            # Check size (simulate 5MB limit)
            if len(image_bytes) > 5 * 1024 * 1024:
                return False
            
            # Check minimum size (simulate 1KB minimum)
            if len(image_bytes) < 1024:
                return False
            
            return True
            
        except Exception:
            return False
    
    def _mock_find_matching_user(self) -> Tuple[Optional[User], float]:
        """
        Mock user matching - randomly select a user with face encoding
        """
        # Get users with face encodings
        face_encodings = FaceEncoding.objects.select_related('user').all()
        
        if not face_encodings:
            return None, 0.0
        
        # Simulate matching with random confidence
        if random.random() > 0.3:  # 70% chance of finding a match
            selected_encoding = random.choice(face_encodings)
            confidence = random.uniform(0.75, 0.95)  # High confidence
            return selected_encoding.user, confidence
        
        return None, 0.0
    
    def _store_face_image(self, user: User, image_data: str):
        """
        Store face image for debugging purposes
        """
        try:
            image_bytes = base64.b64decode(image_data)
            image_file = ContentFile(image_bytes, name=f'face_{user.id}_{int(time.time())}.jpg')
            user.face_image.save(image_file.name, image_file, save=True)
        except Exception as e:
            logger.error(f"Face image storage error: {str(e)}")
    
    def _log_attempt(self, attempt_data: Dict):
        """
        Log face recognition attempt
        """
        if self.settings and not self.settings.enable_logging:
            return
        
        try:
            FaceRecognitionAttempt.objects.create(**attempt_data)
        except Exception as e:
            logger.error(f"Attempt logging error: {str(e)}")
    
    def _log_audit_action(self, user: User, action_type: str, description: str, request_meta: Dict = None):
        """
        Log audit action
        """
        try:
            FaceRecognitionAuditLog.objects.create(
                user=user,
                action_type=action_type,
                description=description,
                ip_address=request_meta.get('ip_address') if request_meta else None,
                user_agent=request_meta.get('user_agent') if request_meta else None,
            )
        except Exception as e:
            logger.error(f"Audit logging error: {str(e)}")
    
    def _create_error_response(self, error_message: str, attempt_data: Dict, result_type: str) -> Dict[str, Any]:
        """
        Create standardized error response and log attempt
        """
        attempt_data.update({
            'result': result_type,
            'error_message': error_message,
            'processing_time': 0.1,  # Mock processing time
            'image_size': 50000,  # Mock image size
            'image_width': 640,
            'image_height': 480,
        })
        self._log_attempt(attempt_data)
        
        return {
            'success': False,
            'error': error_message
        }


# Global service instance
face_recognition_service = MockFaceRecognitionService()