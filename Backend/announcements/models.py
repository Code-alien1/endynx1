from django.db import models
from django.contrib.auth import get_user_model
import uuid

User = get_user_model()

class Announcement(models.Model):
    """Model for school announcements"""
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    title = models.CharField(max_length=200)
    content = models.TextField()
    created_by = models.ForeignKey(User, on_delete=models.CASCADE, related_name='created_announcements')
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    is_active = models.BooleanField(default=True)
    target_audience = models.CharField(
        max_length=20,
        choices=[
            ('all', 'All Users'),
            ('students', 'Students Only'),
            ('parents', 'Parents Only'),
            ('teachers', 'Teachers Only'),
        ],
        default='all'
    )
    
    class Meta:
        db_table = 'announcements'
        ordering = ['-created_at']
    
    def __str__(self):
        return f"{self.title} - {self.created_at.strftime('%Y-%m-%d')}"
