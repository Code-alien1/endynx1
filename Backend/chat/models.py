from django.db import models
from django.contrib.auth import get_user_model
from django.conf import settings
from django.utils import timezone

User = get_user_model()


class ChatRoom(models.Model):
    """
    Represents a chat room between a student and mentor
    """
    student = models.ForeignKey(
        settings.AUTH_USER_MODEL, 
        on_delete=models.CASCADE, 
        related_name='student_chat_rooms'
    )
    mentor = models.ForeignKey(
        settings.AUTH_USER_MODEL, 
        on_delete=models.CASCADE, 
        related_name='mentor_chat_rooms'
    )
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    is_active = models.BooleanField(default=True)

    class Meta:
        unique_together = ('student', 'mentor')
        ordering = ['-updated_at']

    def __str__(self):
        return f"Chat: {self.student.username} - {self.mentor.username}"

    @property
    def last_message(self):
        return self.messages.first()


class Message(models.Model):
    """
    Represents individual messages in a chat room
    """
    chat_room = models.ForeignKey(
        ChatRoom, 
        on_delete=models.CASCADE, 
        related_name='messages'
    )
    sender = models.ForeignKey(
        settings.AUTH_USER_MODEL, 
        on_delete=models.CASCADE, 
        related_name='sent_messages'
    )
    content = models.TextField()
    timestamp = models.DateTimeField(auto_now_add=True)
    is_read = models.BooleanField(default=False)
    message_type = models.CharField(
        max_length=20,
        choices=[
            ('text', 'Text'),
            ('image', 'Image'),
            ('file', 'File'),
        ],
        default='text'
    )
    attachment = models.FileField(
        upload_to='chat_attachments/', 
        null=True, 
        blank=True
    )

    class Meta:
        ordering = ['-timestamp']

    def __str__(self):
        return f"{self.sender.username}: {self.content[:50]}..."

    def mark_as_read(self):
        self.is_read = True
        self.save()


class MentorAssignment(models.Model):
    """
    Represents the assignment of mentors to students
    """
    student = models.ForeignKey(
        settings.AUTH_USER_MODEL, 
        on_delete=models.CASCADE, 
        related_name='mentor_assignments_as_student'
    )
    mentor = models.ForeignKey(
        settings.AUTH_USER_MODEL, 
        on_delete=models.CASCADE, 
        related_name='mentor_assignments_as_mentor'
    )
    assigned_by = models.ForeignKey(
        settings.AUTH_USER_MODEL, 
        on_delete=models.SET_NULL, 
        null=True, 
        blank=True,
        related_name='mentor_assignments_created'
    )
    assigned_at = models.DateTimeField(auto_now_add=True)
    is_active = models.BooleanField(default=True)
    notes = models.TextField(blank=True, null=True)

    class Meta:
        ordering = ['-assigned_at']

    def __str__(self):
        return f"{self.student.username} -> {self.mentor.username}"

    def save(self, *args, **kwargs):
        super().save(*args, **kwargs)
        # Automatically create or activate chat room when assignment is made
        if self.is_active:
            chat_room, created = ChatRoom.objects.get_or_create(
                student=self.student,
                mentor=self.mentor,
                defaults={'is_active': True}
            )
            if not created:
                chat_room.is_active = True
                chat_room.save()


class MentorRating(models.Model):
    """
    Represents student ratings of mentors for admin review
    """
    mentor = models.ForeignKey(
        settings.AUTH_USER_MODEL, 
        on_delete=models.CASCADE, 
        related_name='received_ratings'
    )
    student = models.ForeignKey(
        settings.AUTH_USER_MODEL, 
        on_delete=models.CASCADE, 
        related_name='given_ratings'
    )
    rating = models.IntegerField(choices=[(i, i) for i in range(1, 6)])  # 1-5 stars
    comment = models.TextField(blank=True, null=True)
    timestamp = models.DateTimeField(auto_now_add=True)
    reviewed_by_admin = models.BooleanField(default=False)
    admin_notes = models.TextField(blank=True, null=True)

    class Meta:
        ordering = ['-timestamp']
        unique_together = ('mentor', 'student')  # One rating per student-mentor pair

    def __str__(self):
        return f"{self.student.username} rated {self.mentor.username}: {self.rating}/5"
