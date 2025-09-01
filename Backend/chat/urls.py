from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import ChatRoomViewSet, MessageViewSet, MentorAssignmentViewSet, MentorRatingViewSet

router = DefaultRouter()
router.register(r'chat-rooms', ChatRoomViewSet, basename='chatroom')
router.register(r'messages', MessageViewSet, basename='message')
router.register(r'mentor-assignments', MentorAssignmentViewSet, basename='mentorassignment')
router.register(r'mentor-ratings', MentorRatingViewSet, basename='mentorrating')

urlpatterns = [
    path('', include(router.urls)),
]
