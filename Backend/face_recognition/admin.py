from django.contrib import admin
from django.utils.html import format_html
from django.urls import reverse
from django.utils.safestring import mark_safe
from .models import FaceEncoding, FaceRecognitionAttempt, FaceRecognitionSettings, FaceRecognitionAuditLog


@admin.register(FaceEncoding)
class FaceEncodingAdmin(admin.ModelAdmin):
    list_display = [
        'user', 'confidence_score', 'image_quality', 
        'registration_date', 'last_updated', 'update_count'
    ]
    list_filter = ['registration_date', 'last_updated', 'confidence_score']
    search_fields = ['user__email', 'user__first_name', 'user__last_name']
    readonly_fields = [
        'id', 'registration_date', 'last_updated', 'encoding_data',
        'source_image_width', 'source_image_height', 'face_bounding_box'
    ]
    
    fieldsets = (
        ('User Information', {
            'fields': ('user',)
        }),
        ('Encoding Data', {
            'fields': ('encoding_data', 'confidence_score', 'image_quality'),
            'classes': ('collapse',)
        }),
        ('Image Metadata', {
            'fields': (
                'source_image_width', 'source_image_height', 'source_image_format',
                'face_landmarks_count', 'face_bounding_box'
            ),
            'classes': ('collapse',)
        }),
        ('Timestamps', {
            'fields': ('registration_date', 'last_updated', 'update_count'),
            'classes': ('collapse',)
        }),
    )
    
    def get_queryset(self, request):
        return super().get_queryset(request).select_related('user')


@admin.register(FaceRecognitionAttempt)
class FaceRecognitionAttemptAdmin(admin.ModelAdmin):
    list_display = [
        'user', 'attempt_type', 'result', 'confidence_score',
        'faces_detected', 'processing_time', 'timestamp'
    ]
    list_filter = [
        'attempt_type', 'result', 'timestamp', 'faces_detected'
    ]
    search_fields = ['user__email', 'user__first_name', 'user__last_name', 'ip_address']
    readonly_fields = [
        'id', 'timestamp', 'processing_time', 'ip_address', 'user_agent'
    ]
    date_hierarchy = 'timestamp'
    
    fieldsets = (
        ('Attempt Information', {
            'fields': ('user', 'attempt_type', 'result', 'confidence_score')
        }),
        ('Request Details', {
            'fields': ('ip_address', 'user_agent', 'device_info'),
            'classes': ('collapse',)
        }),
        ('Image Details', {
            'fields': (
                'image_size', 'image_width', 'image_height', 'faces_detected'
            ),
            'classes': ('collapse',)
        }),
        ('Processing', {
            'fields': ('processing_time', 'timestamp', 'error_message'),
            'classes': ('collapse',)
        }),
    )
    
    def get_queryset(self, request):
        return super().get_queryset(request).select_related('user')
    
    def has_add_permission(self, request):
        return False  # Don't allow manual creation
    
    def has_change_permission(self, request, obj=None):
        return False  # Don't allow editing


@admin.register(FaceRecognitionSettings)
class FaceRecognitionSettingsAdmin(admin.ModelAdmin):
    list_display = [
        'recognition_threshold', 'enable_face_recognition', 
        'enable_logging', 'updated_at'
    ]
    readonly_fields = ['created_at', 'updated_at']
    
    fieldsets = (
        ('Recognition Settings', {
            'fields': ('recognition_threshold', 'enable_face_recognition')
        }),
        ('Image Requirements', {
            'fields': (
                'min_image_width', 'min_image_height', 'max_image_size',
                'min_face_size', 'max_faces_allowed'
            )
        }),
        ('Security Settings', {
            'fields': (
                'max_attempts_per_minute', 'max_failed_attempts', 'lockout_duration'
            )
        }),
        ('System Settings', {
            'fields': ('enable_logging', 'enable_image_storage')
        }),
        ('Timestamps', {
            'fields': ('created_at', 'updated_at'),
            'classes': ('collapse',)
        }),
    )
    
    def has_add_permission(self, request):
        # Only allow one settings instance
        return not FaceRecognitionSettings.objects.exists()
    
    def has_delete_permission(self, request, obj=None):
        return False  # Don't allow deletion


@admin.register(FaceRecognitionAuditLog)
class FaceRecognitionAuditLogAdmin(admin.ModelAdmin):
    list_display = [
        'user', 'admin_user', 'action_type', 'description', 'timestamp'
    ]
    list_filter = ['action_type', 'timestamp']
    search_fields = [
        'user__email', 'user__first_name', 'user__last_name',
        'admin_user__email', 'description'
    ]
    readonly_fields = [
        'id', 'user', 'admin_user', 'action_type', 'description',
        'ip_address', 'user_agent', 'additional_data', 'timestamp'
    ]
    date_hierarchy = 'timestamp'
    
    fieldsets = (
        ('Action Information', {
            'fields': ('user', 'admin_user', 'action_type', 'description')
        }),
        ('Request Details', {
            'fields': ('ip_address', 'user_agent'),
            'classes': ('collapse',)
        }),
        ('Additional Data', {
            'fields': ('additional_data',),
            'classes': ('collapse',)
        }),
        ('Timestamp', {
            'fields': ('timestamp',)
        }),
    )
    
    def get_queryset(self, request):
        return super().get_queryset(request).select_related('user', 'admin_user')
    
    def has_add_permission(self, request):
        return False  # Don't allow manual creation
    
    def has_change_permission(self, request, obj=None):
        return False  # Don't allow editing
    
    def has_delete_permission(self, request, obj=None):
        return request.user.is_superuser  # Only superusers can delete audit logs


# Custom admin site configuration
admin.site.site_header = "Edynx Face Recognition Admin"
admin.site.site_title = "Face Recognition Admin"
admin.site.index_title = "Face Recognition Management"