from django.contrib import admin
from .models import (
    Class, AttendanceSession, Attendance, QRCode, AbsenceJustification,
    AttendanceStatistics, FaceRecognitionLog, PeerAttendanceLog
)


class ClassAdmin(admin.ModelAdmin):
    list_display = ('name', 'level', 'teacher', 'students_count', 'created_at')
    list_filter = ('level', 'created_at')
    search_fields = ('name', 'teacher__first_name', 'teacher__last_name', 'teacher__email')
    filter_horizontal = ('students',)
    readonly_fields = ('created_at', 'updated_at')
    
    def students_count(self, obj):
        return obj.students.count()
    students_count.short_description = 'Students'


class AttendanceSessionAdmin(admin.ModelAdmin):
    list_display = ('class_obj', 'session_type', 'date', 'start_time', 'end_time', 'is_active', 'created_by')
    list_filter = ('session_type', 'date', 'is_active', 'created_at')
    search_fields = ('class_obj__name', 'created_by__first_name', 'created_by__last_name')
    readonly_fields = ('created_at', 'updated_at')


class AttendanceAdmin(admin.ModelAdmin):
    list_display = ('student', 'session', 'status', 'method', 'timestamp', 'verified_by')
    list_filter = ('status', 'method', 'timestamp', 'session__date')
    search_fields = ('student__first_name', 'student__last_name', 'student__email', 'session__class_obj__name')
    readonly_fields = ('timestamp', 'verified_at')
    raw_id_fields = ('student', 'session', 'verified_by')


class QRCodeAdmin(admin.ModelAdmin):
    list_display = ('session', 'code', 'is_active', 'is_expired', 'created_at', 'expires_at')
    list_filter = ('is_active', 'created_at')
    search_fields = ('session__class_obj__name', 'code')
    readonly_fields = ('created_at',)
    
    def is_expired(self, obj):
        from django.utils import timezone
        if obj.expires_at:
            return timezone.now() > obj.expires_at
        return False
    is_expired.boolean = True
    is_expired.short_description = 'Expired'


class AbsenceJustificationAdmin(admin.ModelAdmin):
    list_display = ('student', 'attendance', 'status', 'submitted_at', 'reviewed_by', 'reviewed_at')
    list_filter = ('status', 'submitted_at', 'reviewed_at')
    search_fields = ('student__first_name', 'student__last_name', 'reason')
    readonly_fields = ('submitted_at', 'reviewed_at')
    raw_id_fields = ('student', 'attendance', 'reviewed_by')


class AttendanceStatisticsAdmin(admin.ModelAdmin):
    list_display = ('student', 'class_obj', 'total_sessions', 'attendance_rate', 'period_start', 'period_end')
    list_filter = ('period_start', 'period_end', 'calculated_at')
    search_fields = ('student__first_name', 'student__last_name', 'class_obj__name')
    readonly_fields = ('calculated_at',)


class FaceRecognitionLogAdmin(admin.ModelAdmin):
    list_display = ('student', 'session', 'confidence_score', 'success', 'timestamp')
    list_filter = ('success', 'timestamp', 'session__date')
    search_fields = ('student__first_name', 'student__last_name', 'session__class_obj__name')
    readonly_fields = ('timestamp',)
    raw_id_fields = ('student', 'session')


class PeerAttendanceLogAdmin(admin.ModelAdmin):
    list_display = ('scanner', 'scanned_student', 'session', 'success', 'timestamp')
    list_filter = ('success', 'timestamp', 'session__date')
    search_fields = ('scanner__first_name', 'scanner__last_name', 'scanned_student__first_name', 'scanned_student__last_name')
    readonly_fields = ('timestamp',)
    raw_id_fields = ('scanner', 'scanned_student', 'session')


# Register models
admin.site.register(Class, ClassAdmin)
admin.site.register(AttendanceSession, AttendanceSessionAdmin)
admin.site.register(Attendance, AttendanceAdmin)
admin.site.register(QRCode, QRCodeAdmin)
admin.site.register(AbsenceJustification, AbsenceJustificationAdmin)
admin.site.register(AttendanceStatistics, AttendanceStatisticsAdmin)
admin.site.register(FaceRecognitionLog, FaceRecognitionLogAdmin)
admin.site.register(PeerAttendanceLog, PeerAttendanceLogAdmin)
