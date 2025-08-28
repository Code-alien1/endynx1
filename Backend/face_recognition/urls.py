from django.urls import path
from . import views

app_name = 'face_recognition'

urlpatterns = [
    # Main face recognition endpoint
    path('', views.face_recognition_endpoint, name='face_recognition'),
    
    # Face registration endpoints
    path('register/', views.face_registration_endpoint, name='face_registration'),
    path('authenticate/', views.face_authenticate_endpoint, name='face_authenticate'),
    
    # Face recognition for attendance
    path('attendance/', views.face_attendance_endpoint, name='face_attendance'),
    
    # Face registration management
    path('update/', views.update_face_registration, name='update_face_registration'),
    path('<str:user_id>/', views.delete_face_registration, name='delete_face_registration'),
    path('status/<str:user_id>/', views.face_registration_status, name='face_registration_status'),
]