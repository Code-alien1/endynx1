from django.urls import path
from . import views

app_name = 'attendance'

urlpatterns = [
    # Class Management
    path('classes/', views.ClassListView.as_view(), name='class-list'),
    path('classes/<uuid:pk>/', views.ClassDetailView.as_view(), name='class-detail'),
    
    # Attendance Sessions
    path('sessions/', views.AttendanceSessionListView.as_view(), name='session-list'),
    path('sessions/<uuid:pk>/', views.AttendanceSessionDetailView.as_view(), name='session-detail'),
    
    # Attendance Records
    path('records/', views.AttendanceListView.as_view(), name='attendance-list'),
    path('records/<uuid:pk>/', views.AttendanceDetailView.as_view(), name='attendance-detail'),
    
    # Face Recognition Attendance
    path('face-recognition/', views.FaceRecognitionAttendanceView.as_view(), name='face-recognition-attendance'),
    
    # QR Code Attendance
    path('qr-attendance/', views.QRCodeAttendanceView.as_view(), name='qr-attendance'),
    path('qr-generate/', views.QRCodeGenerateView.as_view(), name='qr-generate'),
    
    # Peer Attendance
    path('peer-attendance/', views.PeerAttendanceView.as_view(), name='peer-attendance'),
    
    # Absence Justification
    path('justifications/', views.AbsenceJustificationListView.as_view(), name='justification-list'),
    path('justifications/<uuid:pk>/', views.AbsenceJustificationDetailView.as_view(), name='justification-detail'),
    
    # Attendance Verification
    path('verify/', views.AttendanceVerificationView.as_view(), name='verify-attendance'),
    
    # Reports and Statistics
    path('reports/', views.AttendanceReportView.as_view(), name='attendance-report'),
    path('statistics/', views.AttendanceStatisticsView.as_view(), name='attendance-statistics'),
    
    # Role-based attendance endpoints
    path('role-based/', views.RoleBasedAttendanceView.as_view(), name='role-based-attendance'),
]
