from django.urls import path
from . import views

app_name = 'users'

urlpatterns = [
    # Health check endpoint
    path('health/', views.health_check, name='health-check'),
    
    # User list endpoint for admin
    path('', views.UserListView.as_view(), name='user-list'),
    path('list/', views.UserListView.as_view(), name='user-list-alt'),
    
    # Authentication endpoints
    path('register/', views.UserRegistrationView.as_view(), name='register'),
    path('login/', views.UserLoginView.as_view(), name='login'),
    path('logout/', views.UserLogoutView.as_view(), name='logout'),
    
    # Profile management
    path('profile/', views.UserProfileView.as_view(), name='profile'),
    path('change-password/', views.PasswordChangeView.as_view(), name='change-password'),
    path('face-recognition/', views.FaceRecognitionView.as_view(), name='face-recognition'),
    
    # General user detail endpoint
    path('<uuid:pk>/', views.UserDetailView.as_view(), name='user-detail'),
    path('<uuid:pk>/delete/', views.UserDeleteView.as_view(), name='user-delete'),
    # Student progress endpoint
    path('students/<uuid:student_id>/progress/', views.StudentProgressView.as_view(), name='student-progress'),
    
    # Parent assignment endpoints
    path('parent-assignments/', views.ParentAssignmentView.as_view(), name='parent-assignments'),
    
    # Student endpoints
    path('students/', views.StudentListView.as_view(), name='student-list'),
    path('students/<uuid:pk>/', views.StudentDetailView.as_view(), name='student-detail'),
    
    # Parent endpoints
    path('parents/', views.ParentListView.as_view(), name='parent-list'),
    path('parents/<uuid:pk>/', views.ParentDetailView.as_view(), name='parent-detail'),
    
    # Teacher endpoints
    path('teachers/', views.TeacherListView.as_view(), name='teacher-list'),
    path('teachers/<uuid:pk>/', views.TeacherDetailView.as_view(), name='teacher-detail'),
    
    # Mentor endpoints
    path('mentors/', views.MentorListView.as_view(), name='mentor-list'),
    path('mentors/<uuid:pk>/', views.MentorDetailView.as_view(), name='mentor-detail'),
    
    # Administration endpoints
    path('administration/', views.AdministrationListView.as_view(), name='administration-list'),
    path('administration/<uuid:pk>/', views.AdministrationDetailView.as_view(), name='administration-detail'),
    
    # Mentor-student relationship endpoints
    path('assign-mentor/', views.MentorAssignmentView.as_view(), name='assign-mentor'),
    path('rate-mentor/', views.MentorRatingView.as_view(), name='rate-mentor'),
    
    # Search functionality
    path('search/', views.UserSearchView.as_view(), name='user-search'),
    
    # Session management
    path('sessions/', views.UserSessionsView.as_view(), name='user-sessions'),
    path('deactivate-session/', views.DeactivateSessionView.as_view(), name='deactivate-session'),
    
    # Role-based endpoints
    path('permissions/', views.UserPermissionsView.as_view(), name='user-permissions'),
    path('role-based-users/', views.RoleBasedUserListView.as_view(), name='role-based-users'),
    path('access-check/', views.UserAccessCheckView.as_view(), name='access-check'),
]
