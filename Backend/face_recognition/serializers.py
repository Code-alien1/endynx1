from rest_framework import serializers
from django.contrib.auth import get_user_model
from .models import FaceRegistration, FaceEncoding, FaceRecognitionAttempt

User = get_user_model()


class FaceRegistrationSerializer(serializers.ModelSerializer):
    """
    Serializer for FaceRegistration model
    """
    user_name = serializers.CharField(source='user.get_full_name', read_only=True)
    user_username = serializers.CharField(source='user.username', read_only=True)
    
    class Meta:
        model = FaceRegistration
        fields = [
            'id', 'user', 'user_name', 'user_username', 'auth_method', 
            'device_type', 'confidence_score', 'created_at', 'updated_at', 
            'last_authenticated'
        ]
        read_only_fields = ['id', 'created_at', 'updated_at', 'user_name', 'user_username']


class FaceEncodingSerializer(serializers.ModelSerializer):
    """
    Serializer for FaceEncoding model
    """
    user_name = serializers.CharField(source='user.get_full_name', read_only=True)
    
    class Meta:
        model = FaceEncoding
        fields = [
            'id', 'user', 'user_name', 'confidence_score', 'image_quality',
            'registration_date', 'last_updated', 'update_count'
        ]
        read_only_fields = ['id', 'registration_date', 'last_updated', 'user_name']


class FaceRecognitionAttemptSerializer(serializers.ModelSerializer):
    """
    Serializer for FaceRecognitionAttempt model
    """
    user_name = serializers.CharField(source='user.get_full_name', read_only=True)
    attempt_type_display = serializers.CharField(source='get_attempt_type_display', read_only=True)
    result_display = serializers.CharField(source='get_result_display', read_only=True)
    
    class Meta:
        model = FaceRecognitionAttempt
        fields = [
            'id', 'user', 'user_name', 'attempt_type', 'attempt_type_display',
            'result', 'result_display', 'confidence_score', 'timestamp',
            'processing_time', 'faces_detected'
        ]
        read_only_fields = ['id', 'timestamp', 'user_name', 'attempt_type_display', 'result_display']


class FaceRegistrationCreateSerializer(serializers.Serializer):
    """
    Serializer for creating face registrations
    """
    image = serializers.CharField(help_text="Base64 encoded image")
    user_id = serializers.UUIDField(required=False, help_text="User ID (optional, defaults to current user)")
    
    def validate_image(self, value):
        """
        Validate the base64 image data
        """
        if not value:
            raise serializers.ValidationError("Image data is required")
        
        # Basic validation - check if it looks like base64
        try:
            import base64
            base64.b64decode(value[:100])  # Test decode first 100 chars
        except Exception:
            raise serializers.ValidationError("Invalid base64 image data")
        
        return value


class FaceAuthenticationSerializer(serializers.Serializer):
    """
    Serializer for face authentication requests
    """
    image = serializers.CharField(help_text="Base64 encoded image")
    
    def validate_image(self, value):
        """
        Validate the base64 image data
        """
        if not value:
            raise serializers.ValidationError("Image data is required")
        
        # Basic validation - check if it looks like base64
        try:
            import base64
            base64.b64decode(value[:100])  # Test decode first 100 chars
        except Exception:
            raise serializers.ValidationError("Invalid base64 image data")
        
        return value


class BiometricRegistrationSerializer(serializers.Serializer):
    """
    Serializer for biometric face registration
    """
    biometric_id = serializers.CharField(max_length=255, help_text="Biometric identifier")
    user_id = serializers.UUIDField(help_text="User ID")
    device_type = serializers.ChoiceField(
        choices=['mobile', 'web', 'desktop'], 
        default='mobile',
        help_text="Device type"
    )
    auth_method = serializers.ChoiceField(
        choices=['biometric'], 
        default='biometric',
        help_text="Authentication method"
    )


class BiometricAuthenticationSerializer(serializers.Serializer):
    """
    Serializer for biometric face authentication
    """
    biometric_id = serializers.CharField(max_length=255, help_text="Biometric identifier")
    user_id = serializers.UUIDField(help_text="User ID")
    device_type = serializers.ChoiceField(
        choices=['mobile', 'web', 'desktop'], 
        default='mobile',
        help_text="Device type"
    )
    auth_method = serializers.ChoiceField(
        choices=['biometric'], 
        default='biometric',
        help_text="Authentication method"
    )
