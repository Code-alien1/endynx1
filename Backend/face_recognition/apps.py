from django.apps import AppConfig


class FaceRecognitionConfig(AppConfig):
    default_auto_field = 'django.db.models.BigAutoField'
    name = 'face_recognition'
    verbose_name = 'Face Recognition'
    
    def ready(self):
        """
        Initialize face recognition settings when the app is ready
        """
        # Skip initialization during migrations
        import sys
        if 'migrate' in sys.argv or 'makemigrations' in sys.argv:
            return
            
        try:
            from .models import FaceRecognitionSettings
            # Ensure default settings exist
            FaceRecognitionSettings.get_settings()
        except Exception:
            # Ignore errors during migrations or initial setup
            pass