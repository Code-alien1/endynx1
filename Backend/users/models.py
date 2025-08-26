from django.contrib.auth.models import AbstractUser
from django.db import models
from django.core.validators import MinValueValidator, MaxValueValidator
import uuid


class User(AbstractUser):
    """
    Custom User model supporting all 6 roles in the Edynx system
    """
    USER_ROLES = [
        ('student', 'Student'),
        ('parent', 'Parent'),
        ('teacher', 'Teacher'),
        ('mentor', 'Mentor'),
        ('administration', 'School Administration'),
        ('superadmin', 'Super Admin'),
    ]
    
    LEVELS = [
        (1, 'Level 1'),
        (2, 'Level 2'),
        (3, 'Level 3'),
    ]
    
    # Basic fields
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    email = models.EmailField(unique=True)
    phone_number = models.CharField(max_length=15, blank=True, null=True)
    role = models.CharField(max_length=20, choices=USER_ROLES)
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    # Profile fields
    profile_picture = models.ImageField(upload_to='profile_pictures/', blank=True, null=True)
    date_of_birth = models.DateField(blank=True, null=True)
    address = models.TextField(blank=True, null=True)
    
    # Student specific fields
    student_id = models.CharField(max_length=20, blank=True, null=True, unique=True)
    level = models.IntegerField(choices=LEVELS, blank=True, null=True)
    class_name = models.CharField(max_length=50, blank=True, null=True)
    parent = models.ForeignKey('self', on_delete=models.SET_NULL, blank=True, null=True, related_name='children')
    
    # Teacher specific fields
    teacher_id = models.CharField(max_length=20, blank=True, null=True, unique=True)
    subject_taught = models.CharField(max_length=100, blank=True, null=True)
    department = models.CharField(max_length=100, blank=True, null=True)
    
    # Mentor specific fields (mentors are higher-level students)
    mentor_id = models.CharField(max_length=20, blank=True, null=True, unique=True)
    mentees = models.ManyToManyField('self', blank=True, related_name='mentors', symmetrical=False)
    rating = models.DecimalField(max_digits=3, decimal_places=2, default=0.00, validators=[MinValueValidator(0), MaxValueValidator(5)])
    total_ratings = models.IntegerField(default=0)
    
    # Administration specific fields
    admin_id = models.CharField(max_length=20, blank=True, null=True, unique=True)
    position = models.CharField(max_length=100, blank=True, null=True)
    
    # Face recognition fields
    face_encoding = models.TextField(blank=True, null=True)  # Store face encoding for recognition
    face_image = models.ImageField(upload_to='face_images/', blank=True, null=True)
    
    # Override username field to use email
    USERNAME_FIELD = 'email'
    REQUIRED_FIELDS = ['username', 'role']
    
    class Meta:
        db_table = 'users'
        verbose_name = 'User'
        verbose_name_plural = 'Users'
    
    def __str__(self):
        return f"{self.get_full_name()} ({self.get_role_display()})"
    
    def get_full_name(self):
        if self.first_name and self.last_name:
            return f"{self.first_name} {self.last_name}"
        return self.email
    
    def is_student(self):
        return self.role == 'student'
    
    def is_parent(self):
        return self.role == 'parent'
    
    def is_teacher(self):
        return self.role == 'teacher'
    
    def is_mentor(self):
        return self.role == 'mentor'
    
    def is_administration(self):
        return self.role == 'administration'
    
    def is_superadmin(self):
        return self.role == 'superadmin'
    
    def can_have_mentor(self):
        """Check if student can have a mentor based on level"""
        if not self.is_student():
            return False
        return self.level in [1, 2]  # Level 3 students don't have mentors
    
    def get_available_mentor_levels(self):
        """Get available mentor levels for this student"""
        if not self.is_student():
            return []
        if self.level == 1:
            return [2, 3]  # Level 1 students can have Level 2 or 3 mentors
        elif self.level == 2:
            return [3]  # Level 2 students can only have Level 3 mentors
        return []  # Level 3 students don't have mentors


class UserProfile(models.Model):
    """
    Extended profile information for users
    """
    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name='profile')
    bio = models.TextField(blank=True, null=True)
    emergency_contact = models.CharField(max_length=15, blank=True, null=True)
    emergency_contact_name = models.CharField(max_length=100, blank=True, null=True)
    
    # Academic information (for students)
    gpa = models.DecimalField(max_digits=3, decimal_places=2, blank=True, null=True)
    academic_year = models.CharField(max_length=20, blank=True, null=True)
    
    # Professional information (for teachers/mentors)
    experience_years = models.IntegerField(default=0)
    qualifications = models.TextField(blank=True, null=True)
    specializations = models.TextField(blank=True, null=True)
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        db_table = 'user_profiles'
    
    def __str__(self):
        return f"Profile for {self.user.get_full_name()}"


class UserSession(models.Model):
    """
    Track user login sessions and device information
    """
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='sessions')
    session_key = models.CharField(max_length=40, unique=True)
    device_info = models.TextField(blank=True, null=True)
    ip_address = models.GenericIPAddressField(blank=True, null=True)
    user_agent = models.TextField(blank=True, null=True)
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    last_activity = models.DateTimeField(auto_now=True)
    
    class Meta:
        db_table = 'user_sessions'
    
    def __str__(self):
        return f"Session for {self.user.get_full_name()} - {self.created_at}"
