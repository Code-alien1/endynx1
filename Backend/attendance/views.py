from rest_framework import generics, permissions, status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.response import Response
from rest_framework.views import APIView
from django.utils import timezone
from django.db.models import Q, Count, Avg
from django.http import JsonResponse
from datetime import timedelta, datetime
from django.shortcuts import get_object_or_404
import qrcode
import base64
from io import BytesIO

from edynx_backend.permissions import ParentChildPermission, IsOwnerOrAdmin, MentorMenteePermission, IsTeacherOrAdmin
from edynx_backend.filters import RoleBasedDataFilter, AttendanceDataFilter

from .models import (
    Class, AttendanceSession, Attendance, QRCode, AbsenceJustification,
    AttendanceStatistics, FaceRecognitionLog, PeerAttendanceLog
)
from .serializers import (
    ClassSerializer, AttendanceSessionSerializer, AttendanceSerializer,
    QRCodeSerializer, AbsenceJustificationSerializer, AttendanceStatisticsSerializer,
    FaceRecognitionLogSerializer, PeerAttendanceLogSerializer,
    FaceRecognitionAttendanceSerializer, QRCodeAttendanceSerializer,
    PeerAttendanceSerializer, AbsenceJustificationCreateSerializer,
    AttendanceVerificationSerializer, AttendanceReportSerializer,
    AttendanceSessionCreateSerializer, QRCodeGenerateSerializer,
    AttendanceStatisticsCalculateSerializer
)
from users.models import User


def is_session_within_marking_window(session):
    """
    Check if the session is within the marking window.
    Returns True if current time is within the session's active period.
    """
    now = timezone.now()
    
    # Convert session start and end times to datetime objects for today
    session_date = session.date
    start_datetime = timezone.make_aware(
        datetime.combine(session_date, session.start_time)
    )
    end_datetime = timezone.make_aware(
        datetime.combine(session_date, session.end_time)
    )
    
    # Allow marking attendance from session start time until end time
    return start_datetime <= now <= end_datetime and session.is_active


class AttendanceStatisticsView(APIView):
    """View for getting attendance statistics with role-based filtering"""
    permission_classes = [permissions.IsAuthenticated, IsTeacherOrAdmin]
    
    def get(self, request):
        # Get filters from query parameters
        filters = {}
        
        start_date = request.query_params.get('start_date')
        end_date = request.query_params.get('end_date')
        if start_date and end_date:
            filters['start_date'] = start_date
            filters['end_date'] = end_date
        
        class_id = request.query_params.get('class_id')
        if class_id:
            filters['class_id'] = class_id
        
        student_id = request.query_params.get('student_id')
        if student_id:
            filters['student_id'] = student_id
        
        # Get statistics using role-based filtering
        statistics = AttendanceDataFilter.get_attendance_statistics(request.user, filters)
        
        return Response({
            'statistics': statistics,
            'user_role': request.user.role,
            'filters_applied': filters
        })


class RoleBasedAttendanceView(APIView):
    """View for getting attendance data filtered by user role"""
    permission_classes = [permissions.IsAuthenticated, IsTeacherOrAdmin]
    
    def get(self, request):
        # Build filters from query parameters
        filters = {}
        
        start_date = request.query_params.get('start_date')
        end_date = request.query_params.get('end_date')
        if start_date and end_date:
            filters['start_date'] = start_date
            filters['end_date'] = end_date
        
        class_id = request.query_params.get('class_id')
        if class_id:
            filters['class_id'] = class_id
        
        student_id = request.query_params.get('student_id')
        if student_id:
            filters['student_id'] = student_id
        
        status_filter = request.query_params.get('status')
        if status_filter:
            filters['status'] = status_filter
        
        # Get filtered attendance data
        queryset = AttendanceDataFilter.get_filtered_attendance_data(request.user, filters)
        
        # Paginate results
        page_size = int(request.query_params.get('page_size', 20))
        page = int(request.query_params.get('page', 1))
        
        start_index = (page - 1) * page_size
        end_index = start_index + page_size
        
        paginated_queryset = queryset[start_index:end_index]
        serializer = AttendanceSerializer(paginated_queryset, many=True)
        
        return Response({
            'attendance_records': serializer.data,
            'total_count': queryset.count(),
            'page': page,
            'page_size': page_size,
            'user_role': request.user.role,
            'accessible_student_ids': RoleBasedDataFilter.get_accessible_student_ids(request.user)
        })


# Class Management Views
class ClassListView(generics.ListCreateAPIView):
    """View for listing and creating classes"""
    permission_classes = [permissions.IsAuthenticated, IsOwnerOrAdmin]
    serializer_class = ClassSerializer
    
    def get_queryset(self):
        queryset = Class.objects.all()
        return RoleBasedDataFilter.filter_classes_queryset(queryset, self.request.user)


class ClassDetailView(generics.RetrieveUpdateDestroyAPIView):
    """View for class details"""
    permission_classes = [permissions.IsAuthenticated]
    serializer_class = ClassSerializer
    queryset = Class.objects.all()


# Attendance Session Views
class AttendanceSessionListView(generics.ListCreateAPIView):
    """View for listing and creating attendance sessions"""
    permission_classes = [permissions.IsAuthenticated, ParentChildPermission]
    
    def get_serializer_class(self):
        if self.request.method == 'POST':
            return AttendanceSessionCreateSerializer
        return AttendanceSessionSerializer
    
    def get_queryset(self):
        user = self.request.user
        print(f"DEBUG: User {user.username} (role: {user.role}) requesting sessions")
        
        if user.is_teacher():
            # Show all sessions for teachers, not just ones they created
            queryset = AttendanceSession.objects.all()
            print(f"DEBUG: Teacher queryset (all sessions): {queryset.count()} sessions")
            
            # Debug: show session details
            for session in queryset:
                creator = session.created_by.username if session.created_by else 'NULL'
                print(f"DEBUG: Session {session.id}: {session.class_obj.name} - {session.date} - created by: {creator}")
            
            return queryset
        elif user.is_student():
            print(f"DEBUG: Student {user.username} requesting sessions")
            print(f"DEBUG: Student class_name: {getattr(user, 'class_name', 'None')}")
            
            # TEMPORARY FIX: Show all sessions to students for testing
            # This allows students to see all sessions but they can only mark attendance for their class
            queryset = AttendanceSession.objects.all()
            print(f"DEBUG: Showing all {queryset.count()} sessions to student for testing")
            
            # Debug: show all sessions
            for session in queryset:
                print(f"DEBUG: Session {session.id}: class={session.class_obj.name}, date={session.date}")
            
            return queryset
        elif user.is_administration() or user.is_superadmin():
            queryset = AttendanceSession.objects.all()
            print(f"DEBUG: Admin queryset: {queryset.count()} sessions")
            return queryset
        
        print(f"DEBUG: No matching role, returning empty queryset")
        return AttendanceSession.objects.none()
    
    def perform_create(self, serializer):
        print(f"DEBUG: Creating session with data: {serializer.validated_data}")
        print(f"DEBUG: Created by user: {self.request.user.username}")
        session = serializer.save(created_by=self.request.user)
        print(f"DEBUG: Session created with ID: {session.id}")
        print(f"DEBUG: Session class: {session.class_obj.name}")
        print(f"DEBUG: Total sessions in DB after creation: {AttendanceSession.objects.count()}")
        return session


class AttendanceSessionDetailView(generics.RetrieveUpdateDestroyAPIView):
    """View for attendance session details"""
    permission_classes = [permissions.IsAuthenticated]
    serializer_class = AttendanceSessionSerializer
    queryset = AttendanceSession.objects.all()


# Attendance Views
class AttendanceListView(generics.ListAPIView):
    """View for listing attendance records"""
    permission_classes = [permissions.IsAuthenticated, ParentChildPermission]
    serializer_class = AttendanceSerializer
    
    def get_queryset(self):
        user = self.request.user
        if user.is_student():
            return Attendance.objects.filter(student=user)
        elif user.is_teacher():
            return Attendance.objects.filter(session__created_by=user)
        elif user.is_parent():
            return Attendance.objects.filter(student__parent=user)
        elif user.is_administration() or user.is_superadmin():
            return Attendance.objects.all()
        return Attendance.objects.none()


class AttendanceDetailView(generics.RetrieveUpdateAPIView):
    """View for attendance details"""
    permission_classes = [permissions.IsAuthenticated, IsOwnerOrAdmin]
    serializer_class = AttendanceSerializer
    queryset = Attendance.objects.all()


# Face Recognition Attendance
class FaceRecognitionAttendanceView(APIView):
    """View for face recognition attendance"""
    permission_classes = [permissions.IsAuthenticated]
    
    def post(self, request):
        print(f"DEBUG: Face recognition attendance request data: {request.data}")
        serializer = FaceRecognitionAttendanceSerializer(data=request.data)
        if serializer.is_valid():
            session_id = serializer.validated_data['session_id']
            face_encoding = serializer.validated_data['face_encoding']
            confidence_score = serializer.validated_data['confidence_score']
            location = serializer.validated_data.get('location', '')
            image_data = serializer.validated_data.get('image_data', '')
            print(f"DEBUG: Validated data - session_id: {session_id}, face_encoding length: {len(face_encoding) if face_encoding else 0}")
            
            try:
                session = AttendanceSession.objects.get(id=session_id)
                student = request.user
                
                # Check if student is enrolled in this class
                if not session.class_obj.students.filter(id=student.id).exists():
                    return Response(
                        {'error': 'You are not enrolled in this class'},
                        status=status.HTTP_403_FORBIDDEN
                    )
                
                # Check if session is within the 15-minute marking window
                if not is_session_within_marking_window(session):
                    return Response(
                        {'error': 'Session marking window has closed. You can only mark attendance within 15 minutes of session creation.'},
                        status=status.HTTP_400_BAD_REQUEST
                    )
                
                # Check if attendance already exists
                attendance, created = Attendance.objects.get_or_create(
                    student=student,
                    session=session,
                    defaults={
                        'status': 'present',
                        'method': 'face_recognition',
                        'location': location
                    }
                )
                
                if not created:
                    return Response(
                        {'error': 'Attendance already recorded for this session'},
                        status=status.HTTP_400_BAD_REQUEST
                    )
                
                # Log face recognition attempt
                FaceRecognitionLog.objects.create(
                    student=student,
                    session=session,
                    confidence_score=confidence_score,
                    success=True,
                    image_data=image_data,
                    device_info=request.META.get('HTTP_USER_AGENT', ''),
                    ip_address=request.META.get('REMOTE_ADDR', '')
                )
                
                return Response({
                    'message': 'Attendance recorded successfully',
                    'attendance': AttendanceSerializer(attendance).data
                })
                
            except AttendanceSession.DoesNotExist:
                return Response(
                    {'error': 'Attendance session not found'},
                    status=status.HTTP_404_NOT_FOUND
                )
        
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


# QR Code Attendance
class QRCodeAttendanceView(APIView):
    """View for QR code attendance"""
    permission_classes = [permissions.IsAuthenticated]
    
    def post(self, request):
        serializer = QRCodeAttendanceSerializer(data=request.data)
        if serializer.is_valid():
            session_id = serializer.validated_data['session_id']
            qr_code = serializer.validated_data['qr_code']
            location = serializer.validated_data.get('location', '')
            
            try:
                session = AttendanceSession.objects.get(id=session_id)
                student = request.user
                
                # Check if student is enrolled in this class
                if not session.class_obj.students.filter(id=student.id).exists():
                    return Response(
                        {'error': 'You are not enrolled in this class'},
                        status=status.HTTP_403_FORBIDDEN
                    )
                
                # Check if session is within the 15-minute marking window
                if not is_session_within_marking_window(session):
                    return Response(
                        {'error': 'Session marking window has closed. You can only mark attendance within 15 minutes of session creation.'},
                        status=status.HTTP_400_BAD_REQUEST
                    )
                
                # Verify QR code
                qr_obj = QRCode.objects.filter(
                    session=session,
                    code=qr_code,
                    is_active=True
                ).first()
                
                if not qr_obj:
                    return Response(
                        {'error': 'Invalid or expired QR code'},
                        status=status.HTTP_400_BAD_REQUEST
                    )
                
                if qr_obj.expires_at and timezone.now() > qr_obj.expires_at:
                    return Response(
                        {'error': 'QR code has expired'},
                        status=status.HTTP_400_BAD_REQUEST
                    )
                
                # Check if attendance already exists
                attendance, created = Attendance.objects.get_or_create(
                    student=student,
                    session=session,
                    defaults={
                        'status': 'present',
                        'method': 'qr_code',
                        'location': location
                    }
                )
                
                if not created:
                    return Response(
                        {'error': 'Attendance already recorded for this session'},
                        status=status.HTTP_400_BAD_REQUEST
                    )
                
                return Response({
                    'message': 'Attendance recorded successfully',
                    'attendance': AttendanceSerializer(attendance).data
                })
                
            except AttendanceSession.DoesNotExist:
                return Response(
                    {'error': 'Attendance session not found'},
                    status=status.HTTP_404_NOT_FOUND
                )
        
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


# Peer Attendance
class PeerAttendanceView(APIView):
    """View for peer attendance"""
    permission_classes = [permissions.IsAuthenticated]
    
    def post(self, request):
        serializer = PeerAttendanceSerializer(data=request.data)
        if serializer.is_valid():
            session_id = serializer.validated_data['session_id']
            scanned_student_id = serializer.validated_data['scanned_student_id']
            notes = serializer.validated_data.get('notes', '')
            
            try:
                session = AttendanceSession.objects.get(id=session_id)
                scanner = request.user
                scanned_student = User.objects.get(id=scanned_student_id, role='student')
                
                # Check if scanner is enrolled in this class
                if not session.class_obj.students.filter(id=scanner.id).exists():
                    return Response(
                        {'error': 'You are not enrolled in this class'},
                        status=status.HTTP_403_FORBIDDEN
                    )
                
                # Check if session is within the 15-minute marking window
                if not is_session_within_marking_window(session):
                    return Response(
                        {'error': 'Session marking window has closed. You can only mark attendance within 15 minutes of session creation.'},
                        status=status.HTTP_400_BAD_REQUEST
                    )
                
                # Check if scanned student is enrolled in this class
                if not session.class_obj.students.filter(id=scanned_student.id).exists():
                    return Response(
                        {'error': 'Scanned student is not enrolled in this class'},
                        status=status.HTTP_400_BAD_REQUEST
                    )
                
                # Check if attendance already exists for scanned student
                attendance, created = Attendance.objects.get_or_create(
                    student=scanned_student,
                    session=session,
                    defaults={
                        'status': 'present',
                        'method': 'peer_scan',
                        'notes': notes
                    }
                )
                
                if not created:
                    return Response(
                        {'error': 'Attendance already recorded for this student'},
                        status=status.HTTP_400_BAD_REQUEST
                    )
                
                # Log peer attendance
                PeerAttendanceLog.objects.create(
                    scanner=scanner,
                    scanned_student=scanned_student,
                    session=session,
                    success=True,
                    notes=notes
                )
                
                return Response({
                    'message': 'Peer attendance recorded successfully',
                    'attendance': AttendanceSerializer(attendance).data
                })
                
            except (AttendanceSession.DoesNotExist, User.DoesNotExist):
                return Response(
                    {'error': 'Session or student not found'},
                    status=status.HTTP_404_NOT_FOUND
                )
        
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


# Absence Justification Views
class AbsenceJustificationListView(generics.ListCreateAPIView):
    """View for listing and creating absence justifications"""
    permission_classes = [permissions.IsAuthenticated]
    serializer_class = AbsenceJustificationSerializer
    
    def get_queryset(self):
        user = self.request.user
        if user.is_student():
            return AbsenceJustification.objects.filter(student=user)
        elif user.is_teacher():
            return AbsenceJustification.objects.filter(attendance__session__created_by=user)
        elif user.is_administration() or user.is_superadmin():
            return AbsenceJustification.objects.all()
        return AbsenceJustification.objects.none()
    
    def perform_create(self, serializer):
        serializer.save(student=self.request.user)


class AbsenceJustificationDetailView(generics.RetrieveUpdateAPIView):
    """View for absence justification details"""
    permission_classes = [permissions.IsAuthenticated]
    serializer_class = AbsenceJustificationSerializer
    queryset = AbsenceJustification.objects.all()


# QR Code Management
class QRCodeGenerateView(APIView):
    """View for generating QR codes"""
    permission_classes = [permissions.IsAuthenticated, IsTeacherOrAdmin]
    
    def post(self, request):
        serializer = QRCodeGenerateSerializer(data=request.data)
        if serializer.is_valid():
            session_id = serializer.validated_data['session_id']
            expires_in_minutes = serializer.validated_data['expires_in_minutes']
            
            try:
                session = AttendanceSession.objects.get(id=session_id)
                
                # Check if user can generate QR codes for this session
                if not (request.user.is_teacher() and session.created_by == request.user) and not request.user.is_administration():
                    return Response(
                        {'error': 'You are not authorized to generate QR codes for this session'},
                        status=status.HTTP_403_FORBIDDEN
                    )
                
                # Generate unique QR code
                qr_code_string = f"EDYNX_ATTENDANCE_{session.id}_{uuid.uuid4().hex[:8]}"
                
                # Create QR code object
                expires_at = timezone.now() + timedelta(minutes=expires_in_minutes)
                qr_obj = QRCode.objects.create(
                    session=session,
                    code=qr_code_string,
                    expires_at=expires_at
                )
                
                # Generate QR code image
                qr = qrcode.QRCode(version=1, box_size=10, border=5)
                qr.add_data(qr_code_string)
                qr.make(fit=True)
                
                img = qr.make_image(fill_color="black", back_color="white")
                buffer = BytesIO()
                img.save(buffer, format='PNG')
                qr_image = base64.b64encode(buffer.getvalue()).decode()
                
                return Response({
                    'message': 'QR code generated successfully',
                    'qr_code': QRCodeSerializer(qr_obj).data,
                    'qr_image': qr_image
                })
                
            except AttendanceSession.DoesNotExist:
                return Response(
                    {'error': 'Attendance session not found'},
                    status=status.HTTP_404_NOT_FOUND
                )
        
        print(f"DEBUG: Face recognition serializer validation errors: {serializer.errors}")
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


# Attendance Verification
class AttendanceVerificationView(APIView):
    """View for verifying attendance by teachers"""
    permission_classes = [permissions.IsAuthenticated, IsTeacherOrAdmin]
    
    def post(self, request):
        serializer = AttendanceVerificationSerializer(data=request.data)
        if serializer.is_valid():
            attendance_id = serializer.validated_data['attendance_id']
            status = serializer.validated_data['status']
            notes = serializer.validated_data.get('notes', '')
            
            try:
                attendance = Attendance.objects.get(id=attendance_id)
                
                # Check if user can verify this attendance
                if not (request.user.is_teacher() and attendance.session.created_by == request.user) and not request.user.is_administration():
                    return Response(
                        {'error': 'You are not authorized to verify this attendance'},
                        status=status.HTTP_403_FORBIDDEN
                    )
                
                attendance.status = status
                attendance.verified_by = request.user
                attendance.verified_at = timezone.now()
                attendance.notes = notes
                attendance.save()
                
                return Response({
                    'message': 'Attendance verified successfully',
                    'attendance': AttendanceSerializer(attendance).data
                })
                
            except Attendance.DoesNotExist:
                return Response(
                    {'error': 'Attendance record not found'},
                    status=status.HTTP_404_NOT_FOUND
                )
        
        print(f"DEBUG: Face recognition serializer validation errors: {serializer.errors}")
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


# Attendance Reports
class AttendanceReportView(APIView):
    """View for generating attendance reports"""
    permission_classes = [permissions.IsAuthenticated, ParentChildPermission]
    
    def post(self, request):
        serializer = AttendanceReportSerializer(data=request.data)
        if serializer.is_valid():
            class_id = serializer.validated_data.get('class_id')
            student_id = serializer.validated_data.get('student_id')
            start_date = serializer.validated_data['start_date']
            end_date = serializer.validated_data['end_date']
            include_justifications = serializer.validated_data['include_justifications']
            
            # Build query based on user role
            user = request.user
            if user.is_student():
                queryset = Attendance.objects.filter(student=user)
            elif user.is_teacher():
                queryset = Attendance.objects.filter(session__created_by=user)
            elif user.is_parent():
                queryset = Attendance.objects.filter(student__parent=user)
            elif user.is_administration() or user.is_superadmin():
                queryset = Attendance.objects.all()
            else:
                return Response(
                    {'error': 'You are not authorized to view attendance reports'},
                    status=status.HTTP_403_FORBIDDEN
                )
            
            # Apply filters
            queryset = queryset.filter(
                session__date__range=[start_date, end_date]
            )
            
            if class_id:
                queryset = queryset.filter(session__class_obj_id=class_id)
            
            if student_id:
                queryset = queryset.filter(student_id=student_id)
            
            # Get attendance data
            attendance_data = queryset.select_related('student', 'session', 'session__class_obj')
            
            # Calculate statistics
            total_records = attendance_data.count()
            present_count = attendance_data.filter(status='present').count()
            absent_count = attendance_data.filter(status='absent').count()
            late_count = attendance_data.filter(status='late').count()
            excused_count = attendance_data.filter(status='excused').count()
            
            attendance_rate = (present_count / total_records * 100) if total_records > 0 else 0
            
            # Get justifications if requested
            justifications = []
            if include_justifications:
                justification_queryset = AbsenceJustification.objects.filter(
                    attendance__in=attendance_data.filter(status='absent')
                )
                justifications = AbsenceJustificationSerializer(justification_queryset, many=True).data
            
            return Response({
                'report_period': {
                    'start_date': start_date,
                    'end_date': end_date
                },
                'statistics': {
                    'total_records': total_records,
                    'present_count': present_count,
                    'absent_count': absent_count,
                    'late_count': late_count,
                    'excused_count': excused_count,
                    'attendance_rate': round(attendance_rate, 2)
                },
                'attendance_records': AttendanceSerializer(attendance_data, many=True).data,
                'justifications': justifications
            })
        
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


# Attendance Statistics
class AttendanceStatisticsView(APIView):
    """View for calculating and retrieving attendance statistics"""
    permission_classes = [permissions.IsAuthenticated]
    
    def post(self, request):
        serializer = AttendanceStatisticsCalculateSerializer(data=request.data)
        if serializer.is_valid():
            student_id = serializer.validated_data.get('student_id')
            class_id = serializer.validated_data.get('class_id')
            period_start = serializer.validated_data['period_start']
            period_end = serializer.validated_data['period_end']
            
            # Build query based on user role
            user = request.user
            if user.is_student():
                queryset = Attendance.objects.filter(student=user)
            elif user.is_teacher():
                queryset = Attendance.objects.filter(session__created_by=user)
            elif user.is_parent():
                queryset = Attendance.objects.filter(student__parent=user)
            elif user.is_administration() or user.is_superadmin():
                queryset = Attendance.objects.all()
            else:
                return Response(
                    {'error': 'You are not authorized to view attendance statistics'},
                    status=status.HTTP_403_FORBIDDEN
                )
            
            # Apply filters
            queryset = queryset.filter(
                session__date__range=[period_start, period_end]
            )
            
            if student_id:
                queryset = queryset.filter(student_id=student_id)
            
            if class_id:
                queryset = queryset.filter(session__class_obj_id=class_id)
            
            # Calculate statistics
            stats = queryset.aggregate(
                total_sessions=Count('id'),
                present_count=Count('id', filter=Q(status='present')),
                absent_count=Count('id', filter=Q(status='absent')),
                late_count=Count('id', filter=Q(status='late')),
                excused_count=Count('id', filter=Q(status='excused'))
            )
            
            total_sessions = stats['total_sessions']
            attendance_rate = (stats['present_count'] / total_sessions * 100) if total_sessions > 0 else 0
            
            return Response({
                'period': {
                    'start': period_start,
                    'end': period_end
                },
                'statistics': {
                    'total_sessions': total_sessions,
                    'present_count': stats['present_count'],
                    'absent_count': stats['absent_count'],
                    'late_count': stats['late_count'],
                    'excused_count': stats['excused_count'],
                    'attendance_rate': round(attendance_rate, 2)
                }
            })
        
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

# Predefined Classes API
class PredefinedClassesView(APIView):
    """View to return predefined classes for dropdowns"""
    permission_classes = [permissions.AllowAny]  # Allow access for dropdowns
    
    def get(self, request):
        """Get predefined classes for dropdowns"""
        try:
            # Get all classes from database
            classes = Class.objects.all().order_by('name')
            predefined_classes = []
            
            for class_obj in classes:
                predefined_classes.append({
                    'value': str(class_obj.id),  # UUID as string
                    'label': class_obj.name,
                    'level': class_obj.level
                })
            
            # If no classes in database, create them automatically
            if not predefined_classes:
                from users.models import User
                
                # Get or create a default teacher
                teacher, created = User.objects.get_or_create(
                    email='default.teacher@edynx.com',
                    defaults={
                        'username': 'default_teacher',
                        'first_name': 'Default',
                        'last_name': 'Teacher',
                        'role': 'teacher',
                        'is_active': True,
                    }
                )
                
                if created:
                    teacher.set_password('defaultpassword123')
                    teacher.save()
                
                # Create predefined classes
                classes_data = [
                    {'name': 'BA1A', 'level': 1},
                    {'name': 'BA1B', 'level': 1},
                    {'name': 'BA1C', 'level': 1},
                    {'name': 'BA1D', 'level': 1},
                    {'name': 'BA2A', 'level': 2},
                    {'name': 'BA2B', 'level': 2},
                ]
                
                for class_data in classes_data:
                    class_obj, created = Class.objects.get_or_create(
                        name=class_data['name'],
                        defaults={
                            'level': class_data['level'],
                            'teacher': teacher,
                        }
                    )
                    predefined_classes.append({
                        'value': str(class_obj.id),
                        'label': class_obj.name,
                        'level': class_obj.level
                    })
            
            return Response({'classes': predefined_classes})
        except Exception as e:
            return Response(
                {'error': f'Failed to fetch predefined classes: {str(e)}'}, 
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )
