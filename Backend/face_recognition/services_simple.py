import base64
import json
import time
import logging
import random
from typing import Optional, Tuple, List, Dict, Any
from django.contrib.auth import get_user_model

User = get_user_model()
logger = logging.getLogger(__name__)


class SimpleFaceRecognitionService:
    """
    Simple face recognition service for development and testing
    This simulates face recognition functionality without requiring actual ML libraries
    """
    
    def process_face_authentication(self, image_data: str, request_meta: Dict = None) -> Dict[str, Any]:
        """
        Mock face authentication - simulates the process
        """
        try:
            # Mock image validation
            if not self._mock_validate_image(image_data):
                return {
                    'success': False,
                    'error': 'Invalid image data'
                }
            
            # Mock face detection
            faces_detected = random.randint(0, 2)  # Simulate 0-2 faces
            
            if faces_detected == 0:
                return {
                    'success': False,
                    'error': 'No face detected in the image'
                }
            
            if faces_detected > 1:
                return {
                    'success': False,
                    'error': 'Multiple faces detected. Please ensure only one face is visible.'
                }
            
            # Mock face matching - find a user with face encoding
            user, confidence = self._mock_find_matching_user()
            
            if user is None:
                return {
                    'success': False,
                    'error': 'Face not recognized. Please register your face first or use email login.'
                }
            
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
            return {
                'success': False,
                'error': 'System error during face authentication. Please try again.'
            }
    
    def process_face_registration(self, image_data: str, user_id: str, request_meta: Dict = None) -> Dict[str, Any]:
        """
        Mock face registration - simulates the process
        """
        try:
            # Get user
            user = User.objects.get(id=user_id)
        except User.DoesNotExist:
            return {
                'success': False,
                'error': 'User not found'
            }
        
        try:
            # Mock image validation
            if not self._mock_validate_image(image_data):
                return {
                    'success': False,
                    'error': 'Invalid image data'
                }
            
            # Mock face detection
            faces_detected = random.randint(0, 2)
            
            if faces_detected == 0:
                return {
                    'success': False,
                    'error': 'No face detected in the image'
                }
            
            if faces_detected > 1:
                return {
                    'success': False,
                    'error': 'Multiple faces detected. Please ensure only one face is visible.'
                }
            
            # Mock face encoding generation
            mock_encoding = [random.random() for _ in range(128)]  # 128-dimensional encoding
            quality_score = random.uniform(0.7, 0.95)  # Good quality score
            
            # For simplicity, just store in user model
            user.face_encoding = json.dumps(mock_encoding)
            user.save()
            
            return {
                'success': True,
                'message': 'Face registered successfully (Mock)'
            }
            
        except Exception as e:
            logger.error(f"Mock face registration error: {str(e)}")
            return {
                'success': False,
                'error': 'System error during face registration. Please try again.'
            }
    
    def process_face_attendance(self, image_data: str, request_meta: Dict = None) -> Dict[str, Any]:
        """
        Process face recognition for attendance marking
        """
        try:
            # Mock image validation
            if not self._mock_validate_image(image_data):
                return {
                    'success': False,
                    'error': 'Invalid image data'
                }
            
            # Mock face detection
            faces_detected = random.randint(0, 2)
            
            if faces_detected == 0:
                return {
                    'success': False,
                    'error': 'No face detected in the image'
                }
            
            if faces_detected > 1:
                return {
                    'success': False,
                    'error': 'Multiple faces detected. Please ensure only one face is visible.'
                }
            
            # Mock face matching for attendance
            user, confidence = self._mock_find_matching_user()
            
            if user is None:
                return {
                    'success': False,
                    'error': 'Face not recognized. Please register your face first.'
                }
            
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
                'message': 'Face recognized for attendance',
                'attendance_eligible': True
            }
            
        except Exception as e:
            logger.error(f"Mock face attendance error: {str(e)}")
            return {
                'success': False,
                'error': 'System error during face recognition. Please try again.'
            }
    
    def delete_face_registration(self, user_id: str, request_meta: Dict = None) -> Dict[str, Any]:
        """
        Delete user's face registration
        """
        try:
            user = User.objects.get(id=user_id)
            
            if not user.face_encoding:
                return {
                    'success': False,
                    'error': 'No face registration found for this user'
                }
            
            user.face_encoding = None
            if user.face_image:
                user.face_image.delete()
            user.save()
            
            return {
                'success': True,
                'message': 'Face registration deleted successfully'
            }
            
        except User.DoesNotExist:
            return {
                'success': False,
                'error': 'User not found'
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
            
            if user.face_encoding:
                return {
                    'registered': True,
                    'registration_date': user.updated_at.isoformat(),
                }
            else:
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
        users_with_faces = User.objects.filter(face_encoding__isnull=False).exclude(face_encoding='')
        
        if not users_with_faces.exists():
            return None, 0.0
        
        # Simulate matching with random confidence
        if random.random() > 0.3:  # 70% chance of finding a match
            selected_user = random.choice(users_with_faces)
            confidence = random.uniform(0.75, 0.95)  # High confidence
            return selected_user, confidence
        
        return None, 0.0


# Global service instance
face_recognition_service = SimpleFaceRecognitionService()