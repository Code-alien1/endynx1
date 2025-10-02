from django.db import models
from django.contrib.auth import get_user_model
from django.core.validators import MinValueValidator, MaxValueValidator
import uuid
import json

User = get_user_model()


class FaceRegistration(models.Model):
    """
    Store face registration data including biometric authentication
    """
    AUTH_METHODS = [
        ('camera', 'Camera-based'),
        ('biometric', 'Biometric (Face ID/Touch ID)'),
    ]
    
    DEVICE_TYPES = [
        ('mobile', 'Mobile Device'),
        ('web', 'Web Browser'),
        ('desktop', 'Desktop Application'),
    ]
    
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name='face_registration')
    
    # Authentication method and device info
    auth_method = models.CharField(max_length=20, choices=AUTH_METHODS, default='camera')
    device_type = models.CharField(max_length=20, choices=DEVICE_TYPES, default='mobile')
    
    # Face encoding data (for camera-based registration)
    face_encoding = models.TextField(blank=True, help_text="Face encoding as JSON string")
    
    # Biometric data (for biometric-based registration)
    biometric_id = models.CharField(max_length=255, blank=True, help_text="Hashed biometric identifier")
    
    # Metadata
    confidence_score = models.FloatField(
        default=0.0,
        validators=[MinValueValidator(0.0), MaxValueValidator(1.0)],
        help_text="Confidence score of the registration"
    )
    
    # Timestamps
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    last_authenticated = models.DateTimeField(null=True, blank=True)
    
    # Registration metadata
    registration_ip = models.GenericIPAddressField(null=True, blank=True)
    user_agent = models.TextField(null=True, blank=True)
    
    class Meta:
        db_table = 'face_registrations'
        verbose_name = 'Face Registration'
        verbose_name_plural = 'Face Registrations'
    
    def __str__(self):
        return f"Face registration for {self.user.get_full_name()} ({self.get_auth_method_display()})"
    
    def get_face_encoding_array(self):
        """Convert JSON string back to array format"""
        if not self.face_encoding:
            return None
        try:
            return json.loads(self.face_encoding)
        except (json.JSONDecodeError, TypeError):
            return None
    
    def set_face_encoding_array(self, encoding_array):
        """Convert array to JSON string for storage"""
        if encoding_array is not None:
            if hasattr(encoding_array, 'tolist'):
                encoding_list = encoding_array.tolist()
            else:
                encoding_list = list(encoding_array)
            self.face_encoding = json.dumps(encoding_list)
        else:
            self.face_encoding = ''
    
    def is_biometric_registration(self):
        """Check if this is a biometric registration"""
        return self.auth_method == 'biometric' and bool(self.biometric_id)
    
    def is_camera_registration(self):
        """Check if this is a camera-based registration"""
        return self.auth_method == 'camera' and bool(self.face_encoding)


class FaceEncoding(models.Model):
    """
    Store face encodings for users with metadata
    """
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name='face_encoding_data')
    
    # Face encoding data (stored as JSON string)
    encoding_data = models.TextField(help_text="Face encoding as JSON string")
    
    # Metadata
    confidence_score = models.FloatField(
        validators=[MinValueValidator(0.0), MaxValueValidator(1.0)],
        help_text="Confidence score of the face encoding"
    )
    image_quality = models.FloatField(
        default=0.0,
        validators=[MinValueValidator(0.0), MaxValueValidator(1.0)],
        help_text="Quality score of the source image"
    )
    
    # Registration details
    registration_date = models.DateTimeField(auto_now_add=True)
    last_updated = models.DateTimeField(auto_now=True)
    update_count = models.IntegerField(default=0, help_text="Number of times encoding was updated")
    
    # Source image metadata
    source_image_width = models.IntegerField(null=True, blank=True)
    source_image_height = models.IntegerField(null=True, blank=True)
    source_image_format = models.CharField(max_length=10, null=True, blank=True)
    
    # Face detection metadata
    face_landmarks_count = models.IntegerField(default=0)
    face_bounding_box = models.TextField(null=True, blank=True, help_text="Face bounding box as JSON")
    
    class Meta:
        db_table = 'face_encodings'
        verbose_name = 'Face Encoding'
        verbose_name_plural = 'Face Encodings'
    
    def __str__(self):
        return f"Face encoding for {self.user.get_full_name()}"
    
    def get_encoding_array(self):
        """Convert JSON string back to numpy array format"""
        try:
            return json.loads(self.encoding_data)
        except (json.JSONDecodeError, TypeError):
            return None
    
    def set_encoding_array(self, encoding_array):
        """Convert numpy array to JSON string for storage"""
        if encoding_array is not None:
            # Convert numpy array to list for JSON serialization
            if hasattr(encoding_array, 'tolist'):
                encoding_list = encoding_array.tolist()
            else:
                encoding_list = list(encoding_array)
            self.encoding_data = json.dumps(encoding_list)
        else:
            self.encoding_data = None
    
    def get_bounding_box(self):
        """Get face bounding box as dictionary"""
        try:
            return json.loads(self.face_bounding_box) if self.face_bounding_box else None
        except (json.JSONDecodeError, TypeError):
            return None
    
    def set_bounding_box(self, bbox):
        """Set face bounding box from dictionary or tuple"""
        if bbox is not None:
            if isinstance(bbox, (list, tuple)):
                # Convert (top, right, bottom, left) to dict
                bbox_dict = {
                    'top': bbox[0],
                    'right': bbox[1],
                    'bottom': bbox[2],
                    'left': bbox[3]
                }
            else:
                bbox_dict = bbox
            self.face_bounding_box = json.dumps(bbox_dict)
        else:
            self.face_bounding_box = None


class FaceRecognitionAttempt(models.Model):
    """
    Log all face recognition attempts for security and analytics
    """
    ATTEMPT_TYPES = [
        ('authentication', 'Authentication'),
        ('registration', 'Registration'),
        ('update', 'Update Registration'),
    ]
    
    ATTEMPT_RESULTS = [
        ('success', 'Success'),
        ('failed', 'Failed'),
        ('no_face', 'No Face Detected'),
        ('multiple_faces', 'Multiple Faces'),
        ('low_quality', 'Low Quality Image'),
        ('no_match', 'No Match Found'),
        ('error', 'System Error'),
    ]
    
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    user = models.ForeignKey(User, on_delete=models.CASCADE, null=True, blank=True, related_name='face_attempts')
    
    # Attempt details
    attempt_type = models.CharField(max_length=20, choices=ATTEMPT_TYPES)
    result = models.CharField(max_length=20, choices=ATTEMPT_RESULTS)
    confidence_score = models.FloatField(null=True, blank=True)
    
    # Request metadata
    ip_address = models.GenericIPAddressField(null=True, blank=True)
    user_agent = models.TextField(null=True, blank=True)
    device_info = models.TextField(null=True, blank=True)
    
    # Image metadata
    image_size = models.IntegerField(null=True, blank=True, help_text="Image size in bytes")
    image_width = models.IntegerField(null=True, blank=True)
    image_height = models.IntegerField(null=True, blank=True)
    faces_detected = models.IntegerField(default=0)
    
    # Timing
    processing_time = models.FloatField(null=True, blank=True, help_text="Processing time in seconds")
    timestamp = models.DateTimeField(auto_now_add=True)
    
    # Error details
    error_message = models.TextField(null=True, blank=True)
    
    class Meta:
        db_table = 'face_recognition_attempts'
        verbose_name = 'Face Recognition Attempt'
        verbose_name_plural = 'Face Recognition Attempts'
        ordering = ['-timestamp']
    
    def __str__(self):
        user_str = self.user.get_full_name() if self.user else "Unknown"
        return f"{self.get_attempt_type_display()} - {user_str} - {self.get_result_display()}"


class FaceRecognitionSettings(models.Model):
    """
    Global settings for face recognition system
    """
    # Recognition thresholds
    recognition_threshold = models.FloatField(
        default=0.6,
        validators=[MinValueValidator(0.0), MaxValueValidator(1.0)],
        help_text="Threshold for face recognition matching (lower = more strict)"
    )
    
    # Image quality requirements
    min_image_width = models.IntegerField(default=200, help_text="Minimum image width in pixels")
    min_image_height = models.IntegerField(default=200, help_text="Minimum image height in pixels")
    max_image_size = models.IntegerField(default=5242880, help_text="Maximum image size in bytes (5MB)")
    
    # Face detection settings
    min_face_size = models.IntegerField(default=50, help_text="Minimum face size in pixels")
    max_faces_allowed = models.IntegerField(default=1, help_text="Maximum number of faces allowed in image")
    
    # Security settings
    max_attempts_per_minute = models.IntegerField(default=5, help_text="Maximum attempts per minute per IP")
    max_failed_attempts = models.IntegerField(default=3, help_text="Maximum failed attempts before lockout")
    lockout_duration = models.IntegerField(default=300, help_text="Lockout duration in seconds")
    
    # System settings
    enable_face_recognition = models.BooleanField(default=True)
    enable_logging = models.BooleanField(default=True)
    enable_image_storage = models.BooleanField(default=False, help_text="Store face images for debugging")
    
    # Timestamps
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        db_table = 'face_recognition_settings'
        verbose_name = 'Face Recognition Settings'
        verbose_name_plural = 'Face Recognition Settings'
    
    def __str__(self):
        return f"Face Recognition Settings (Updated: {self.updated_at})"
    
    @classmethod
    def get_settings(cls):
        """Get or create default settings"""
        settings, created = cls.objects.get_or_create(pk=1)
        return settings


class FaceRecognitionAuditLog(models.Model):
    """
    Audit log for face recognition system changes
    """
    ACTION_TYPES = [
        ('registration', 'Face Registration'),
        ('update', 'Face Update'),
        ('deletion', 'Face Deletion'),
        ('authentication', 'Authentication'),
        ('settings_change', 'Settings Change'),
        ('system_error', 'System Error'),
    ]
    
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    user = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, blank=True)
    admin_user = models.ForeignKey(
        User, 
        on_delete=models.SET_NULL, 
        null=True, 
        blank=True, 
        related_name='face_admin_actions'
    )
    
    action_type = models.CharField(max_length=20, choices=ACTION_TYPES)
    description = models.TextField()
    
    # Request details
    ip_address = models.GenericIPAddressField(null=True, blank=True)
    user_agent = models.TextField(null=True, blank=True)
    
    # Additional data
    additional_data = models.TextField(null=True, blank=True, help_text="Additional data as JSON")
    
    timestamp = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        db_table = 'face_recognition_audit_log'
        verbose_name = 'Face Recognition Audit Log'
        verbose_name_plural = 'Face Recognition Audit Logs'
        ordering = ['-timestamp']
    
    def __str__(self):
        user_str = self.user.get_full_name() if self.user else "System"
        return f"{self.get_action_type_display()} - {user_str} - {self.timestamp}"