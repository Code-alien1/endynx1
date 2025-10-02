# API Configuration Settings
# Add these to your main settings.py file

# Geolocation Settings
SCHOOL_LOCATION = {
    'latitude': 33.5731,  # Update with your school's actual coordinates
    'longitude': -7.5898,
    'radius_meters': 500,  # Attendance allowed within 500 meters
    'name': 'Edynx School Campus'
}

# Face Recognition API Settings
# AWS Rekognition
AWS_ACCESS_KEY_ID = 'your-aws-access-key'
AWS_SECRET_ACCESS_KEY = 'your-aws-secret-key'
AWS_REGION = 'us-east-1'

# Azure Face API
AZURE_FACE_API_KEY = 'your-azure-face-api-key'
AZURE_FACE_ENDPOINT = 'https://your-region.api.cognitive.microsoft.com/'

# Google Cloud Vision
GOOGLE_APPLICATION_CREDENTIALS = 'path/to/your/service-account-key.json'

# Face Recognition Settings
FACE_RECOGNITION_SETTINGS = {
    'confidence_threshold': 75.0,  # Minimum confidence for face match
    'use_multiple_apis': True,     # Use multiple APIs for better accuracy
    'fallback_enabled': True,      # Enable fallback to local recognition
    'max_face_size_mb': 5,         # Maximum image size in MB
}

# Location Validation Settings
LOCATION_VALIDATION = {
    'enabled': True,
    'strict_mode': False,  # If True, attendance only allowed within radius
    'warning_distance': 1000,  # Show warning if beyond this distance (meters)
    'offline_mode_enabled': True,  # Allow attendance when location unavailable
}
