from rest_framework import generics
from rest_framework.permissions import IsAuthenticated
from rest_framework.serializers import ModelSerializer
from .models import Announcement

class AnnouncementSerializer(ModelSerializer):
    class Meta:
        model = Announcement
        fields = ['id', 'title', 'content', 'created_at', 'is_active', 'created_by']
        read_only_fields = ['created_by']

class AnnouncementListView(generics.ListAPIView):
    serializer_class = AnnouncementSerializer
    permission_classes = [IsAuthenticated]
    
    def get_queryset(self):
        # Return active announcements for all users, all announcements for admins
        if self.request.user.is_administration() or self.request.user.is_superadmin():
            return Announcement.objects.all().order_by('-created_at')
        return Announcement.objects.filter(is_active=True).order_by('-created_at')

class AnnouncementDetailView(generics.RetrieveAPIView):
    serializer_class = AnnouncementSerializer
    permission_classes = [IsAuthenticated]
    
    def get_queryset(self):
        if self.request.user.is_administration() or self.request.user.is_superadmin():
            return Announcement.objects.all()
        return Announcement.objects.filter(is_active=True)
