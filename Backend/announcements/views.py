from rest_framework import generics, serializers
from rest_framework.permissions import IsAuthenticated
from rest_framework.serializers import ModelSerializer
from .models import Announcement

class AnnouncementSerializer(ModelSerializer):
    created_by = serializers.SerializerMethodField()
    
    class Meta:
        model = Announcement
        fields = ['id', 'title', 'content', 'created_at', 'is_active', 'created_by']
        read_only_fields = ['created_by']
    
    def get_created_by(self, obj):
        return {
            'id': str(obj.created_by.id),
            'username': obj.created_by.username,
            'first_name': obj.created_by.first_name,
            'last_name': obj.created_by.last_name,
        }

class AnnouncementListView(generics.ListCreateAPIView):
    serializer_class = AnnouncementSerializer
    permission_classes = [IsAuthenticated]
    
    def get_queryset(self):
        # Return active announcements for all users, all announcements for admins
        if self.request.user.is_administration() or self.request.user.is_superadmin():
            return Announcement.objects.all().order_by('-created_at')
        return Announcement.objects.filter(is_active=True).order_by('-created_at')
    
    def perform_create(self, serializer):
        # Only allow admins to create announcements
        if not (self.request.user.is_administration() or self.request.user.is_superadmin()):
            from rest_framework.exceptions import PermissionDenied
            raise PermissionDenied("Only administrators can create announcements")
        serializer.save(created_by=self.request.user)

class AnnouncementDetailView(generics.RetrieveAPIView):
    serializer_class = AnnouncementSerializer
    permission_classes = [IsAuthenticated]
    
    def get_queryset(self):
        if self.request.user.is_administration() or self.request.user.is_superadmin():
            return Announcement.objects.all()
        return Announcement.objects.filter(is_active=True)
