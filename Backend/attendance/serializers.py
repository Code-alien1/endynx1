from rest_framework import serializers
from django.utils import timezone
from datetime import datetime, timedelta
from .models import (
    Class, AttendanceSession, Attendance, QRCode, AbsenceJustification,
    AttendanceStatistics, FaceRecognitionLog, PeerAttendanceLog
)
from users.serializers import UserSerializer


class ClassSerializer(serializers.ModelSerializer):
    """Serializer for Class model"""
    teacher_name = serializers.CharField(source='teacher.get_full_name', read_only=True)
    students_count = serializers.SerializerMethodField()
    
    class Meta:
        model = Class
        fields = [
            'id', 'name', 'level', 'teacher', 'teacher_name', 'students_count',
            'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'created_at', 'updated_at']
    
    def get_students_count(self, obj):
        return obj.students.count()


class AttendanceSessionSerializer(serializers.ModelSerializer):
    """Serializer for AttendanceSession model"""
    class_name = serializers.CharField(source='class_obj.name', read_only=True)
    teacher_name = serializers.CharField(source='created_by.get_full_name', read_only=True)
    attendance_count = serializers.SerializerMethodField()
    total_students = serializers.SerializerMethodField()
    
    class Meta:
        model = AttendanceSession
        fields = [
            'id', 'class_obj', 'class_name', 'session_type', 'date', 'start_time', 'end_time',
            'is_active', 'created_by', 'teacher_name', 'attendance_count', 'total_students',
            'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'created_at', 'updated_at']
    
    def get_attendance_count(self, obj):
        return obj.attendance_records.filter(status='present').count()
    
    def get_total_students(self, obj):
        return obj.class_obj.students.count()


class AttendanceSerializer(serializers.ModelSerializer):
    """Serializer for Attendance model"""
    student_name = serializers.CharField(source='student.get_full_name', read_only=True)
    session_info = serializers.CharField(source='session.__str__', read_only=True)
    verified_by_name = serializers.CharField(source='verified_by.get_full_name', read_only=True)
    
    class Meta:
        model = Attendance
        fields = [
            'id', 'student', 'student_name', 'session', 'session_info', 'status', 'method',
            'timestamp', 'location', 'verified_by', 'verified_by_name', 'verified_at', 'notes'
        ]
        read_only_fields = ['id', 'timestamp', 'verified_at']


class QRCodeSerializer(serializers.ModelSerializer):
    """Serializer for QRCode model"""
    session_info = serializers.CharField(source='session.__str__', read_only=True)
    is_expired = serializers.SerializerMethodField()
    
    class Meta:
        model = QRCode
        fields = [
            'id', 'session', 'session_info', 'code', 'is_active', 'is_expired',
            'created_at', 'expires_at'
        ]
        read_only_fields = ['id', 'created_at']
    
    def get_is_expired(self, obj):
        if obj.expires_at:
            return timezone.now() > obj.expires_at
        return False


class AbsenceJustificationSerializer(serializers.ModelSerializer):
    """Serializer for AbsenceJustification model"""
    student_name = serializers.CharField(source='student.get_full_name', read_only=True)
    reviewed_by_name = serializers.CharField(source='reviewed_by.get_full_name', read_only=True)
    attendance_info = serializers.CharField(source='attendance.__str__', read_only=True)
    
    class Meta:
        model = AbsenceJustification
        fields = [
            'id', 'student', 'student_name', 'attendance', 'attendance_info', 'reason',
            'photo', 'status', 'reviewed_by', 'reviewed_by_name', 'reviewed_at',
            'review_notes', 'submitted_at'
        ]
        read_only_fields = ['id', 'student', 'submitted_at', 'reviewed_at']


class AttendanceStatisticsSerializer(serializers.ModelSerializer):
    """Serializer for AttendanceStatistics model"""
    student_name = serializers.CharField(source='student.get_full_name', read_only=True)
    class_name = serializers.CharField(source='class_obj.name', read_only=True)
    
    class Meta:
        model = AttendanceStatistics
        fields = [
            'id', 'student', 'student_name', 'class_obj', 'class_name', 'total_sessions',
            'present_count', 'absent_count', 'late_count', 'excused_count', 'attendance_rate',
            'period_start', 'period_end', 'calculated_at'
        ]
        read_only_fields = ['id', 'calculated_at']


class FaceRecognitionLogSerializer(serializers.ModelSerializer):
    """Serializer for FaceRecognitionLog model"""
    student_name = serializers.CharField(source='student.get_full_name', read_only=True)
    session_info = serializers.CharField(source='session.__str__', read_only=True)
    
    class Meta:
        model = FaceRecognitionLog
        fields = [
            'id', 'student', 'student_name', 'session', 'session_info', 'confidence_score',
            'success', 'image_data', 'device_info', 'ip_address', 'timestamp'
        ]
        read_only_fields = ['id', 'timestamp']


class PeerAttendanceLogSerializer(serializers.ModelSerializer):
    """Serializer for PeerAttendanceLog model"""
    scanner_name = serializers.CharField(source='scanner.get_full_name', read_only=True)
    scanned_student_name = serializers.CharField(source='scanned_student.get_full_name', read_only=True)
    session_info = serializers.CharField(source='session.__str__', read_only=True)
    
    class Meta:
        model = PeerAttendanceLog
        fields = [
            'id', 'scanner', 'scanner_name', 'scanned_student', 'scanned_student_name',
            'session', 'session_info', 'success', 'notes', 'timestamp'
        ]
        read_only_fields = ['id', 'timestamp']


# Special serializers for specific operations
class FaceRecognitionAttendanceSerializer(serializers.Serializer):
    """Serializer for face recognition attendance"""
    session_id = serializers.UUIDField()
    face_encoding = serializers.CharField()
    confidence_score = serializers.DecimalField(max_digits=5, decimal_places=3)
    location = serializers.CharField(required=False, allow_blank=True)
    image_data = serializers.CharField(required=False, allow_blank=True)


class QRCodeAttendanceSerializer(serializers.Serializer):
    """Serializer for QR code attendance"""
    session_id = serializers.UUIDField()
    qr_code = serializers.CharField()
    location = serializers.CharField(required=False, allow_blank=True)


class PeerAttendanceSerializer(serializers.Serializer):
    """Serializer for peer attendance"""
    session_id = serializers.UUIDField()
    scanned_student_id = serializers.UUIDField()
    notes = serializers.CharField(required=False, allow_blank=True)


class AbsenceJustificationCreateSerializer(serializers.ModelSerializer):
    """Serializer for creating absence justifications"""
    student_name = serializers.CharField(source='student.get_full_name', read_only=True)
    
    class Meta:
        model = AbsenceJustification
        fields = [
            'id', 'student', 'student_name', 'attendance', 'reason', 'photo', 'status',
            'submitted_at'
        ]
        read_only_fields = ['id', 'status', 'submitted_at']


class AttendanceVerificationSerializer(serializers.Serializer):
    """Serializer for attendance verification by teachers"""
    attendance_id = serializers.UUIDField()
    status = serializers.ChoiceField(choices=Attendance.ATTENDANCE_STATUS)
    notes = serializers.CharField(required=False, allow_blank=True)


class AttendanceReportSerializer(serializers.Serializer):
    """Serializer for attendance reports"""
    class_id = serializers.UUIDField(required=False)
    student_id = serializers.UUIDField(required=False)
    start_date = serializers.DateField()
    end_date = serializers.DateField()
    include_justifications = serializers.BooleanField(default=False)


class AttendanceSessionCreateSerializer(serializers.ModelSerializer):
    """Serializer for creating attendance sessions"""
    class_name = serializers.CharField(source='class_obj.name', read_only=True)
    
    class Meta:
        model = AttendanceSession
        fields = [
            'id', 'class_obj', 'class_name', 'session_type', 'date', 'start_time', 'end_time',
            'is_active', 'created_by', 'created_at'
        ]
        read_only_fields = ['id', 'created_at']
    
    def validate(self, attrs):
        # Check for existing session with same class, date, and session type
        existing_session = AttendanceSession.objects.filter(
            class_obj=attrs['class_obj'],
            date=attrs['date'],
            session_type=attrs['session_type']
        ).first()
        
        if existing_session:
            raise serializers.ValidationError({
                'non_field_errors': [
                    f"A session for class '{attrs['class_obj'].name}' on {attrs['date']} "
                    f"with '{attrs['session_type']}' session type already exists. "
                    f"Please choose a different session type or date."
                ]
            })
        
        return attrs


class QRCodeGenerateSerializer(serializers.Serializer):
    """Serializer for generating QR codes"""
    session_id = serializers.UUIDField()
    expires_in_minutes = serializers.IntegerField(default=30, min_value=1, max_value=1440)  # Max 24 hours


class AttendanceStatisticsCalculateSerializer(serializers.Serializer):
    """Serializer for calculating attendance statistics"""
    student_id = serializers.UUIDField(required=False)
    class_id = serializers.UUIDField(required=False)
    period_start = serializers.DateField()
    period_end = serializers.DateField()
    
    def validate(self, attrs):
        if attrs['period_start'] > attrs['period_end']:
            raise serializers.ValidationError("Start date cannot be after end date")
        return attrs
