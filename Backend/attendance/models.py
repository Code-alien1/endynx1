from django.db import models
from django.core.validators import MinValueValidator, MaxValueValidator
from users.models import User
import uuid


class Class(models.Model):
    """Model for school classes"""
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    name = models.CharField(max_length=100)
    level = models.IntegerField(choices=User.LEVELS)
    teacher = models.ForeignKey(User, on_delete=models.CASCADE, related_name='classes_taught')
    students = models.ManyToManyField(User, related_name='enrolled_classes', blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        db_table = 'classes'
        verbose_name_plural = 'Classes'
    
    def __str__(self):
        return f"{self.name} - Level {self.level}"


class AttendanceSession(models.Model):
    """Model for attendance sessions (daily class sessions)"""
    SESSION_TYPES = [
        ('morning', 'Morning Session'),
        ('afternoon', 'Afternoon Session'),
        ('evening', 'Evening Session'),
        ('custom', 'Custom Session'),
    ]
    
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    class_obj = models.ForeignKey(Class, on_delete=models.CASCADE, related_name='attendance_sessions')
    session_type = models.CharField(max_length=20, choices=SESSION_TYPES)
    date = models.DateField()
    start_time = models.TimeField()
    end_time = models.TimeField()
    is_active = models.BooleanField(default=True)
    created_by = models.ForeignKey(User, on_delete=models.CASCADE, related_name='created_sessions')
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        db_table = 'attendance_sessions'
        unique_together = ['class_obj', 'date', 'session_type']
    
    def __str__(self):
        return f"{self.class_obj.name} - {self.date} - {self.get_session_type_display()}"


class Attendance(models.Model):
    """Model for individual student attendance records"""
    ATTENDANCE_STATUS = [
        ('present', 'Present'),
        ('absent', 'Absent'),
        ('late', 'Late'),
        ('excused', 'Excused'),
        ('pending', 'Pending Verification'),
    ]
    
    ATTENDANCE_METHOD = [
        ('face_recognition', 'Face Recognition'),
        ('qr_code', 'QR Code'),
        ('peer_scan', 'Peer Scan'),
        ('manual', 'Manual Entry'),
        ('justification', 'Absence Justification'),
    ]
    
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    student = models.ForeignKey(User, on_delete=models.CASCADE, related_name='attendance_records')
    session = models.ForeignKey(AttendanceSession, on_delete=models.CASCADE, related_name='attendance_records')
    status = models.CharField(max_length=20, choices=ATTENDANCE_STATUS, default='pending')
    method = models.CharField(max_length=20, choices=ATTENDANCE_METHOD)
    timestamp = models.DateTimeField(auto_now_add=True)
    location = models.CharField(max_length=255, blank=True, null=True)  # GPS coordinates or location name
    verified_by = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, blank=True, related_name='verified_attendance')
    verified_at = models.DateTimeField(null=True, blank=True)
    notes = models.TextField(blank=True, null=True)
    
    class Meta:
        db_table = 'attendance'
        unique_together = ['student', 'session']
    
    def __str__(self):
        return f"{self.student.get_full_name()} - {self.session} - {self.get_status_display()}"


class QRCode(models.Model):
    """Model for QR codes used in attendance"""
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    session = models.ForeignKey(AttendanceSession, on_delete=models.CASCADE, related_name='qr_codes')
    code = models.CharField(max_length=255, unique=True)  # Generated QR code string
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    expires_at = models.DateTimeField(null=True, blank=True)
    
    class Meta:
        db_table = 'qr_codes'
    
    def __str__(self):
        return f"QR Code for {self.session}"


class AbsenceJustification(models.Model):
    """Model for absence justifications submitted by students"""
    JUSTIFICATION_STATUS = [
        ('pending', 'Pending Review'),
        ('approved', 'Approved'),
        ('rejected', 'Rejected'),
    ]
    
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    student = models.ForeignKey(User, on_delete=models.CASCADE, related_name='absence_justifications')
    attendance = models.OneToOneField(Attendance, on_delete=models.CASCADE, related_name='justification')
    reason = models.TextField()
    photo = models.ImageField(upload_to='absence_justifications/', blank=True, null=True)
    status = models.CharField(max_length=20, choices=JUSTIFICATION_STATUS, default='pending')
    reviewed_by = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, blank=True, related_name='reviewed_justifications')
    reviewed_at = models.DateTimeField(null=True, blank=True)
    review_notes = models.TextField(blank=True, null=True)
    submitted_at = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        db_table = 'absence_justifications'
    
    def __str__(self):
        return f"Justification by {self.student.get_full_name()} for {self.attendance.session.date}"


class AttendanceStatistics(models.Model):
    """Model for tracking attendance statistics"""
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    student = models.ForeignKey(User, on_delete=models.CASCADE, related_name='attendance_stats')
    class_obj = models.ForeignKey(Class, on_delete=models.CASCADE, related_name='attendance_stats')
    total_sessions = models.IntegerField(default=0)
    present_count = models.IntegerField(default=0)
    absent_count = models.IntegerField(default=0)
    late_count = models.IntegerField(default=0)
    excused_count = models.IntegerField(default=0)
    attendance_rate = models.DecimalField(max_digits=5, decimal_places=2, default=0.00, validators=[MinValueValidator(0), MaxValueValidator(100)])
    period_start = models.DateField()
    period_end = models.DateField()
    calculated_at = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        db_table = 'attendance_statistics'
        unique_together = ['student', 'class_obj', 'period_start', 'period_end']
    
    def __str__(self):
        return f"Stats for {self.student.get_full_name()} - {self.class_obj.name}"


class FaceRecognitionLog(models.Model):
    """Model for logging face recognition attempts"""
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    student = models.ForeignKey(User, on_delete=models.CASCADE, related_name='face_recognition_logs')
    session = models.ForeignKey(AttendanceSession, on_delete=models.CASCADE, related_name='face_recognition_logs')
    confidence_score = models.DecimalField(max_digits=5, decimal_places=3, validators=[MinValueValidator(0), MaxValueValidator(1)])
    success = models.BooleanField()
    image_data = models.TextField(blank=True, null=True)  # Base64 encoded image or face encoding
    device_info = models.TextField(blank=True, null=True)
    ip_address = models.GenericIPAddressField(blank=True, null=True)
    timestamp = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        db_table = 'face_recognition_logs'
    
    def __str__(self):
        return f"Face recognition for {self.student.get_full_name()} - {'Success' if self.success else 'Failed'}"


class PeerAttendanceLog(models.Model):
    """Model for logging peer attendance scans"""
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    scanner = models.ForeignKey(User, on_delete=models.CASCADE, related_name='peer_scans_given')
    scanned_student = models.ForeignKey(User, on_delete=models.CASCADE, related_name='peer_scans_received')
    session = models.ForeignKey(AttendanceSession, on_delete=models.CASCADE, related_name='peer_attendance_logs')
    success = models.BooleanField()
    notes = models.TextField(blank=True, null=True)
    timestamp = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        db_table = 'peer_attendance_logs'
    
    def __str__(self):
        return f"Peer scan: {self.scanner.get_full_name()} → {self.scanned_student.get_full_name()}"
