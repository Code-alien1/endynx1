from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import ChatRoomViewSet, MessageViewSet, MentorAssignmentViewSet

router = DefaultRouter()
router.register(r'chat-rooms', ChatRoomViewSet, basename='chatroom')
router.register(r'messages', MessageViewSet, basename='message')
router.register(r'mentor-assignments', MentorAssignmentViewSet, basename='mentorassignment')

urlpatterns = [
    path('api/chat/', include(router.urls)),
]
