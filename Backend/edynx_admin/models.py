from django.db import models
from django.contrib.auth import get_user_model

User = get_user_model()

class AdminAction(models.Model):
    ACTION_TYPES = [
        ('user_create', 'User Created'),
        ('user_update', 'User Updated'),
        ('user_delete', 'User Deleted'),
        ('justification_approve', 'Justification Approved'),
        ('justification_reject', 'Justification Rejected'),
        ('announcement_create', 'Announcement Created'),
        ('announcement_update', 'Announcement Updated'),
    ]
    
    admin_user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='admin_actions')
    action_type = models.CharField(max_length=50, choices=ACTION_TYPES)
    target_user = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, blank=True, related_name='admin_actions_received')
    description = models.TextField()
    timestamp = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        ordering = ['-timestamp']
    
    def __str__(self):
        return f"{self.admin_user.username} - {self.action_type} at {self.timestamp}"
