from django.urls import path
from . import views

urlpatterns = [
    # User management
    path('users/', views.AdminUserListView.as_view(), name='admin-users-list'),
    path('users/<str:pk>/', views.AdminUserDetailView.as_view(), name='admin-user-detail'),
    
    # Justification management
    path('justifications/', views.AdminJustificationListView.as_view(), name='admin-justifications-list'),
    path('justifications/<str:justification_id>/', views.update_justification_status, name='admin-justification-update'),
    
    # Attendance records
    path('attendance-records/', views.AdminAttendanceRecordListView.as_view(), name='admin-attendance-records'),
    
    # Announcements (also accessible via /announcements/ for general use)
    path('announcements/', views.AdminAnnouncementListView.as_view(), name='admin-announcements-list'),
    path('announcements/<str:pk>/', views.AdminAnnouncementDetailView.as_view(), name='admin-announcement-detail'),
]
