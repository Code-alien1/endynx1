from rest_framework import generics, status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from django.contrib.auth import get_user_model
from django.contrib.auth.hashers import make_password
from rest_framework.serializers import ModelSerializer
from attendance.models import Attendance, AbsenceJustification
from announcements.models import Announcement
from .models import AdminAction

User = get_user_model()

class UserSerializer(ModelSerializer):
    class Meta:
        model = User
        fields = ['id', 'username', 'email', 'first_name', 'last_name', 'role', 'student_class', 'is_active', 'date_joined']
        extra_kwargs = {'password': {'write_only': True}}

    def create(self, validated_data):
        if 'password' in validated_data:
            validated_data['password'] = make_password(validated_data['password'])
        return super().create(validated_data)

    def update(self, instance, validated_data):
        if 'password' in validated_data:
            validated_data['password'] = make_password(validated_data['password'])
        return super().update(instance, validated_data)

class JustificationSerializer(ModelSerializer):
    student = UserSerializer(read_only=True)
    
    class Meta:
        model = AbsenceJustification
        fields = ['id', 'student', 'session', 'reason', 'status', 'submitted_at', 'reviewed_at', 'reviewed_by']

class AttendanceRecordSerializer(ModelSerializer):
    student = UserSerializer(read_only=True)
    
    class Meta:
        model = Attendance
        fields = ['id', 'student', 'session', 'timestamp', 'status']

class AnnouncementSerializer(ModelSerializer):
    class Meta:
        model = Announcement
        fields = ['id', 'title', 'content', 'created_at', 'is_active', 'created_by']

class AdminUserListView(generics.ListCreateAPIView):
    serializer_class = UserSerializer
    permission_classes = [IsAuthenticated]
    
    def get_queryset(self):
        if not self.request.user.is_administration() and not self.request.user.is_superadmin():
            return User.objects.none()
        return User.objects.all().order_by('-date_joined')
    
    def perform_create(self, serializer):
        user = serializer.save()
        AdminAction.objects.create(
            admin_user=self.request.user,
            action_type='user_create',
            target_user=user,
            description=f"Created user {user.username} with role {user.role}"
        )

class AdminUserDetailView(generics.RetrieveUpdateDestroyAPIView):
    serializer_class = UserSerializer
    permission_classes = [IsAuthenticated]
    
    def get_queryset(self):
        if not self.request.user.is_administration() and not self.request.user.is_superadmin():
            return User.objects.none()
        return User.objects.all()
    
    def perform_update(self, serializer):
        user = serializer.save()
        AdminAction.objects.create(
            admin_user=self.request.user,
            action_type='user_update',
            target_user=user,
            description=f"Updated user {user.username}"
        )
    
    def perform_destroy(self, instance):
        AdminAction.objects.create(
            admin_user=self.request.user,
            action_type='user_delete',
            target_user=instance,
            description=f"Deleted user {instance.username}"
        )
        instance.delete()

class AdminJustificationListView(generics.ListAPIView):
    serializer_class = JustificationSerializer
    permission_classes = [IsAuthenticated]
    
    def get_queryset(self):
        if not self.request.user.is_administration() and not self.request.user.is_superadmin():
            return AbsenceJustification.objects.none()
        return AbsenceJustification.objects.all().order_by('-submitted_at')

@api_view(['PATCH'])
@permission_classes([IsAuthenticated])
def update_justification_status(request, justification_id):
    if not request.user.is_administration() and not request.user.is_superadmin():
        return Response({'error': 'Permission denied'}, status=status.HTTP_403_FORBIDDEN)
    
    try:
        justification = AbsenceJustification.objects.get(id=justification_id)
        new_status = request.data.get('status')
        
        if new_status not in ['approved', 'rejected']:
            return Response({'error': 'Invalid status'}, status=status.HTTP_400_BAD_REQUEST)
        
        justification.status = new_status
        justification.reviewed_by = request.user
        justification.save()
        
        AdminAction.objects.create(
            admin_user=request.user,
            action_type=f'justification_{new_status.replace("ed", "")}',
            target_user=justification.student,
            description=f"{new_status.title()} justification for {justification.student.username}"
        )
        
        return Response({'message': f'Justification {new_status} successfully'})
    
    except AbsenceJustification.DoesNotExist:
        return Response({'error': 'Justification not found'}, status=status.HTTP_404_NOT_FOUND)

class AdminAttendanceRecordListView(generics.ListAPIView):
    serializer_class = AttendanceRecordSerializer
    permission_classes = [IsAuthenticated]
    
    def get_queryset(self):
        if not self.request.user.is_administration() and not self.request.user.is_superadmin():
            return Attendance.objects.none()
        
        queryset = Attendance.objects.all().order_by('-timestamp')
        class_filter = self.request.query_params.get('class', None)
        
        if class_filter and class_filter != 'all':
            queryset = queryset.filter(student__student_class=class_filter)
        
        return queryset

class AdminAnnouncementListView(generics.ListCreateAPIView):
    serializer_class = AnnouncementSerializer
    permission_classes = [IsAuthenticated]
    
    def get_queryset(self):
        if not self.request.user.is_administration() and not self.request.user.is_superadmin():
            return Announcement.objects.none()
        return Announcement.objects.all().order_by('-created_at')
    
    def perform_create(self, serializer):
        announcement = serializer.save(created_by=self.request.user)
        AdminAction.objects.create(
            admin_user=self.request.user,
            action_type='announcement_create',
            description=f"Created announcement: {announcement.title}"
        )

class AdminAnnouncementDetailView(generics.RetrieveUpdateDestroyAPIView):
    serializer_class = AnnouncementSerializer
    permission_classes = [IsAuthenticated]
    
    def get_queryset(self):
        if not self.request.user.is_administration() and not self.request.user.is_superadmin():
            return Announcement.objects.none()
        return Announcement.objects.all()
    
    def perform_update(self, serializer):
        announcement = serializer.save()
        AdminAction.objects.create(
            admin_user=self.request.user,
            action_type='announcement_update',
            description=f"Updated announcement: {announcement.title}"
        )
