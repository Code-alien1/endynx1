from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status, permissions
from .models import AttendanceSession, Attendance
from .serializers import AttendanceSerializer

class TempFaceRecognitionAttendanceView(APIView):
    """Temporary face recognition attendance view for testing - bypasses enrollment checks"""
    permission_classes = [permissions.IsAuthenticated]
    
    def post(self, request):
        session_id = request.data.get('session_id')
        face_encoding = request.data.get('face_encoding', 'temp_encoding')
        confidence_score = request.data.get('confidence_score', 0.95)
        location = request.data.get('location', 'Mobile App')
        
        print(f"DEBUG: Temp attendance endpoint called")
        print(f"DEBUG: Session ID: {session_id}")
        print(f"DEBUG: User: {request.user.username}")
        
        try:
            session = AttendanceSession.objects.get(id=session_id)
            student = request.user
            
            print(f"DEBUG: Found session: {session.class_obj.name}")
            print(f"DEBUG: Session active: {session.is_active}")
            
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
            
            print(f"DEBUG: Attendance created successfully for {student.username}")
            
            return Response({
                'message': 'Attendance recorded successfully',
                'attendance': AttendanceSerializer(attendance).data
            })
            
        except AttendanceSession.DoesNotExist:
            print(f"DEBUG: Session {session_id} not found")
            return Response(
                {'error': 'Attendance session not found'},
                status=status.HTTP_404_NOT_FOUND
            )
        except Exception as e:
            print(f"DEBUG: Error: {str(e)}")
            return Response(
                {'error': f'Internal server error: {str(e)}'},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )
