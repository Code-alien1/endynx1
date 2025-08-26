import face_recognition
import numpy as np
from PIL import Image
import io
import base64
import json
import time
import logging
from typing import Optional, Tuple, List, Dict, Any
from django.contrib.auth import get_user_model
from django.core.files.base import ContentFile
from django.utils import timezone
from .models import FaceEncoding, FaceRecognitionAttempt, FaceRecognitionSettings, FaceRecognitionAuditLog

User = get_user_model()
logger = logging.getLogger(__name__)


class FaceRecognitionService:
    """
    Comprehensive face recognition service for authentication and registration
    """
    
    def __init__(self):
        self.settings = FaceRecognitionSettings.get_settings()
    
    def process_face_authentication(self, image_data: str, request_meta: Dict = None) -> Dict[str, Any]:
        """
        Process face authentication request
        
        Args:
            image_data: Base64 encoded image data
            request_meta: Request metadata (IP, user agent, etc.)
        
        Returns:
            Dictionary with authentication result
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
            
            # Decode and validate image
            image_array, image_metadata = self._decode_and_validate_image(image_data)
            if image_array is None:
                return self._create_error_response(
                    "Invalid image data",
                    attempt_data,
                    'error'
                )
            
            attempt_data.update(image_metadata)
            
            # Detect faces in the image
            face_locations = face_recognition.face_locations(image_array)
            
            if len(face_locations) == 0:
                return self._create_error_response(
                    "No face detected in the image",
                    attempt_data,
                    'no_face'
                )
            
            if len(face_locations) > self.settings.max_faces_allowed:
                return self._create_error_response(
                    f"Multiple faces detected. Please ensure only one face is visible.",
                    attempt_data,
                    'multiple_faces'
                )
            
            attempt_data['faces_detected'] = len(face_locations)
            
            # Extract face encoding
            face_encodings = face_recognition.face_encodings(image_array, face_locations)
            if len(face_encodings) == 0:
                return self._create_error_response(
                    "Could not extract face features",
                    attempt_data,
                    'error'
                )
            
            current_encoding = face_encodings[0]
            
            # Find matching user
            user, confidence = self._find_matching_user(current_encoding)
            
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
                'processing_time': processing_time
            })
            
            self._log_attempt(attempt_data)
            
            # Log audit trail
            self._log_audit_action(
                user=user,
                action_type='authentication',
                description=f"Successful face authentication with {confidence:.2%} confidence",
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
                'message': 'Authentication successful'
            }
            
        except Exception as e:
            logger.error(f"Face authentication error: {str(e)}")
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
        Process face registration request
        
        Args:
            image_data: Base64 encoded image data
            user_id: User ID to register face for
            request_meta: Request metadata
        
        Returns:
            Dictionary with registration result
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
            
            # Decode and validate image
            image_array, image_metadata = self._decode_and_validate_image(image_data)
            if image_array is None:
                return self._create_error_response(
                    "Invalid image data",
                    attempt_data,
                    'error'
                )
            
            attempt_data.update(image_metadata)
            
            # Detect faces in the image
            face_locations = face_recognition.face_locations(image_array)
            
            if len(face_locations) == 0:
                return self._create_error_response(
                    "No face detected in the image",
                    attempt_data,
                    'no_face'
                )
            
            if len(face_locations) > self.settings.max_faces_allowed:
                return self._create_error_response(
                    f"Multiple faces detected. Please ensure only one face is visible.",
                    attempt_data,
                    'multiple_faces'
                )
            
            attempt_data['faces_detected'] = len(face_locations)
            
            # Extract face encoding
            face_encodings = face_recognition.face_encodings(image_array, face_locations)
            if len(face_encodings) == 0:
                return self._create_error_response(
                    "Could not extract face features",
                    attempt_data,
                    'error'
                )
            
            current_encoding = face_encodings[0]
            face_location = face_locations[0]
            
            # Calculate image quality score
            quality_score = self._calculate_image_quality(image_array, face_location)
            
            # Check if user already has face encoding
            existing_encoding = None
            try:
                existing_encoding = FaceEncoding.objects.get(user=user)
                # This is an update
                attempt_data['attempt_type'] = 'update'
            except FaceEncoding.DoesNotExist:
                pass
            
            # Create or update face encoding
            if existing_encoding:
                existing_encoding.set_encoding_array(current_encoding)
                existing_encoding.confidence_score = quality_score
                existing_encoding.image_quality = quality_score
                existing_encoding.update_count += 1
                existing_encoding.source_image_width = image_metadata.get('image_width')
                existing_encoding.source_image_height = image_metadata.get('image_height')
                existing_encoding.set_bounding_box(face_location)
                existing_encoding.save()
                
                message = "Face registration updated successfully"
                action_description = f"Face encoding updated (update #{existing_encoding.update_count})"
            else:
                face_encoding_obj = FaceEncoding.objects.create(
                    user=user,
                    confidence_score=quality_score,
                    image_quality=quality_score,
                    source_image_width=image_metadata.get('image_width'),
                    source_image_height=image_metadata.get('image_height'),
                    face_landmarks_count=68,  # Standard face_recognition landmarks
                )
                face_encoding_obj.set_encoding_array(current_encoding)
                face_encoding_obj.set_bounding_box(face_location)
                face_encoding_obj.save()
                
                message = "Face registered successfully"
                action_description = "New face encoding registered"
            
            # Store face image if enabled
            if self.settings.enable_image_storage:
                self._store_face_image(user, image_data)
            
            # Log successful attempt
            processing_time = time.time() - start_time
            attempt_data.update({
                'result': 'success',
                'confidence_score': quality_score,
                'processing_time': processing_time
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
            logger.error(f"Face registration error: {str(e)}")
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
                description="Face registration deleted",
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
    
    def _decode_and_validate_image(self, image_data: str) -> Tuple[Optional[np.ndarray], Dict]:
        """
        Decode base64 image and validate it
        """
        try:
            # Decode base64 image
            image_bytes = base64.b64decode(image_data)
            
            # Check image size
            if len(image_bytes) > self.settings.max_image_size:
                return None, {'error': 'Image too large'}
            
            # Open image with PIL
            image = Image.open(io.BytesIO(image_bytes))
            
            # Convert to RGB if necessary
            if image.mode != 'RGB':
                image = image.convert('RGB')
            
            # Check image dimensions
            width, height = image.size
            if width < self.settings.min_image_width or height < self.settings.min_image_height:
                return None, {'error': 'Image too small'}
            
            # Convert to numpy array
            image_array = np.array(image)
            
            metadata = {
                'image_size': len(image_bytes),
                'image_width': width,
                'image_height': height,
                'image_format': image.format or 'JPEG'
            }
            
            return image_array, metadata
            
        except Exception as e:
            logger.error(f"Image decode error: {str(e)}")
            return None, {'error': str(e)}
    
    def _find_matching_user(self, current_encoding: np.ndarray) -> Tuple[Optional[User], float]:
        """
        Find user with matching face encoding
        """
        best_match_user = None
        best_confidence = 0.0
        
        # Get all face encodings
        face_encodings = FaceEncoding.objects.select_related('user').all()
        
        for face_encoding_obj in face_encodings:
            stored_encoding = face_encoding_obj.get_encoding_array()
            if stored_encoding is None:
                continue
            
            # Convert to numpy array
            stored_encoding = np.array(stored_encoding)
            
            # Calculate face distance (lower is better)
            face_distance = face_recognition.face_distance([stored_encoding], current_encoding)[0]
            
            # Convert distance to confidence (higher is better)
            confidence = 1 - face_distance
            
            # Check if this is the best match and above threshold
            if confidence > best_confidence and confidence >= self.settings.recognition_threshold:
                best_confidence = confidence
                best_match_user = face_encoding_obj.user
        
        return best_match_user, best_confidence
    
    def _calculate_image_quality(self, image_array: np.ndarray, face_location: Tuple) -> float:
        """
        Calculate image quality score based on various factors
        """
        try:
            # Extract face region
            top, right, bottom, left = face_location
            face_image = image_array[top:bottom, left:right]
            
            # Calculate face size score
            face_width = right - left
            face_height = bottom - top
            face_size = min(face_width, face_height)
            size_score = min(face_size / 200.0, 1.0)  # Normalize to 200px
            
            # Calculate sharpness (Laplacian variance)
            gray_face = np.mean(face_image, axis=2)
            laplacian_var = np.var(gray_face)
            sharpness_score = min(laplacian_var / 1000.0, 1.0)  # Normalize
            
            # Calculate brightness score
            brightness = np.mean(face_image)
            brightness_score = 1.0 - abs(brightness - 128) / 128.0  # Optimal around 128
            
            # Combine scores
            quality_score = (size_score * 0.4 + sharpness_score * 0.4 + brightness_score * 0.2)
            
            return min(max(quality_score, 0.0), 1.0)
            
        except Exception as e:
            logger.error(f"Quality calculation error: {str(e)}")
            return 0.5  # Default medium quality
    
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
        if not self.settings.enable_logging:
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
            'error_message': error_message
        })
        self._log_attempt(attempt_data)
        
        return {
            'success': False,
            'error': error_message
        }


# Global service instance
face_recognition_service = FaceRecognitionService()