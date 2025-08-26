from rest_framework import status, generics, permissions
from rest_framework.decorators import api_view, permission_classes
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework_simplejwt.tokens import RefreshToken
from django.contrib.auth import authenticate
from django.db.models import Q
from django.shortcuts import get_object_or_404

from edynx_backend.permissions import (
    CanManageUsers, IsOwnerOrAdmin, ParentChildPermission,
    MentorMenteePermission, get_user_permissions
)
from edynx_backend.filters import RoleBasedDataFilter

from .models import User, UserProfile, UserSession
from .serializers import (
    UserSerializer, StudentSerializer, ParentSerializer, TeacherSerializer,
    MentorSerializer, AdministrationSerializer, SuperAdminSerializer,
    UserRegistrationSerializer, UserLoginSerializer, PasswordChangeSerializer,
    UserProfileUpdateSerializer, FaceRecognitionSerializer, UserSessionSerializer
)


class UserRegistrationView(APIView):
    """View for user registration"""
    permission_classes = [permissions.AllowAny]
    
    def post(self, request):
        serializer = UserRegistrationSerializer(data=request.data)
        if serializer.is_valid():
            user = serializer.save()
            
            # Generate tokens
            refresh = RefreshToken.for_user(user)
            
            return Response({
                'message': 'User registered successfully',
                'user': UserSerializer(user).data,
                'tokens': {
                    'refresh': str(refresh),
                    'access': str(refresh.access_token),
                }
            }, status=status.HTTP_201_CREATED)
        
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class UserLoginView(APIView):
    """View for user login"""
    permission_classes = [permissions.AllowAny]
    
    def post(self, request):
        print(f"Login request data: {request.data}")  # Debug log
        print(f"Request content type: {request.content_type}")  # Debug log
        serializer = UserLoginSerializer(data=request.data)
        if serializer.is_valid():
            user = serializer.validated_data['user']
            
            # Generate tokens
            refresh = RefreshToken.for_user(user)
            
            # Create session
            UserSession.objects.create(
                user=user,
                session_key=refresh.access_token,
                device_info=request.META.get('HTTP_USER_AGENT', ''),
                ip_address=request.META.get('REMOTE_ADDR', ''),
                user_agent=request.META.get('HTTP_USER_AGENT', '')
            )
            
            return Response({
                'message': 'Login successful',
                'user': UserSerializer(user).data,
                'tokens': {
                    'refresh': str(refresh),
                    'access': str(refresh.access_token),
                }
            }, status=status.HTTP_200_OK)
        
        print(f"Login validation errors: {serializer.errors}")  # Debug log
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class UserLogoutView(APIView):
    """View for user logout"""
    permission_classes = [permissions.IsAuthenticated]
    
    def post(self, request):
        try:
            refresh_token = request.data.get('refresh_token')
            if refresh_token:
                token = RefreshToken(refresh_token)
                token.blacklist()
            
            # Deactivate current session
            UserSession.objects.filter(
                user=request.user,
                session_key=request.auth
            ).update(is_active=False)
            
            return Response({'message': 'Logout successful'}, status=status.HTTP_200_OK)
        except Exception as e:
            return Response({'error': str(e)}, status=status.HTTP_400_BAD_REQUEST)


class UserProfileView(APIView):
    """View for getting and updating user profile"""
    permission_classes = [permissions.IsAuthenticated]
    
    def get(self, request):
        serializer = UserSerializer(request.user)
        return Response(serializer.data)
    
    def put(self, request):
        serializer = UserProfileUpdateSerializer(request.user, data=request.data, partial=True)
        if serializer.is_valid():
            serializer.save()
            return Response({
                'message': 'Profile updated successfully',
                'user': UserSerializer(request.user).data
            })
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class PasswordChangeView(APIView):
    """View for changing password"""
    permission_classes = [permissions.IsAuthenticated]
    
    def post(self, request):
        serializer = PasswordChangeSerializer(data=request.data, context={'request': request})
        if serializer.is_valid():
            user = request.user
            user.set_password(serializer.validated_data['new_password'])
            user.save()
            return Response({'message': 'Password changed successfully'})
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class FaceRecognitionView(APIView):
    """View for face recognition data"""
    permission_classes = [permissions.IsAuthenticated]
    
    def post(self, request):
        serializer = FaceRecognitionSerializer(request.user, data=request.data, partial=True)
        if serializer.is_valid():
            serializer.save()
            return Response({'message': 'Face recognition data updated successfully'})
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


# Role-specific views
class StudentListView(generics.ListAPIView):
    """View for listing students"""
    permission_classes = [permissions.IsAuthenticated, ParentChildPermission]
    serializer_class = StudentSerializer
    queryset = User.objects.filter(role='student')
    
    def get_queryset(self):
        queryset = User.objects.filter(role='student')
        
        # Apply role-based filtering
        queryset = RoleBasedDataFilter.filter_users_queryset(queryset, self.request.user)
        
        # Filter by level
        level = self.request.query_params.get('level', None)
        if level:
            queryset = queryset.filter(level=level)
        
        # Filter by class
        class_name = self.request.query_params.get('class_name', None)
        if class_name:
            queryset = queryset.filter(class_name=class_name)
        
        return queryset


class StudentDetailView(generics.RetrieveUpdateAPIView):
    """View for student details"""
    permission_classes = [permissions.IsAuthenticated]
    serializer_class = StudentSerializer
    queryset = User.objects.filter(role='student')
    
    def get_queryset(self):
        if self.request.user.is_parent():
            return User.objects.filter(role='student', parent=self.request.user)
        return User.objects.filter(role='student')


class ParentListView(generics.ListAPIView):
    """View for listing parents"""
    permission_classes = [permissions.IsAuthenticated]
    serializer_class = ParentSerializer
    queryset = User.objects.filter(role='parent')


class ParentDetailView(generics.RetrieveUpdateAPIView):
    """View for parent details"""
    permission_classes = [permissions.IsAuthenticated]
    serializer_class = ParentSerializer
    queryset = User.objects.filter(role='parent')


class TeacherListView(generics.ListAPIView):
    """View for listing teachers"""
    permission_classes = [permissions.IsAuthenticated]
    serializer_class = TeacherSerializer
    queryset = User.objects.filter(role='teacher')
    
    def get_queryset(self):
        queryset = User.objects.filter(role='teacher')
        
        # Filter by department
        department = self.request.query_params.get('department', None)
        if department:
            queryset = queryset.filter(department=department)
        
        # Filter by subject
        subject = self.request.query_params.get('subject', None)
        if subject:
            queryset = queryset.filter(subject_taught__icontains=subject)
        
        return queryset


class TeacherDetailView(generics.RetrieveUpdateAPIView):
    """View for teacher details"""
    permission_classes = [permissions.IsAuthenticated]
    serializer_class = TeacherSerializer
    queryset = User.objects.filter(role='teacher')


class MentorListView(generics.ListAPIView):
    """View for listing mentors"""
    permission_classes = [permissions.IsAuthenticated]
    serializer_class = MentorSerializer
    queryset = User.objects.filter(role='mentor')
    
    def get_queryset(self):
        queryset = User.objects.filter(role='mentor')
        
        # Filter by level
        level = self.request.query_params.get('level', None)
        if level:
            queryset = queryset.filter(level=level)
        
        # Filter by rating
        min_rating = self.request.query_params.get('min_rating', None)
        if min_rating:
            queryset = queryset.filter(rating__gte=min_rating)
        
        return queryset


class MentorDetailView(generics.RetrieveUpdateAPIView):
    """View for mentor details"""
    permission_classes = [permissions.IsAuthenticated]
    serializer_class = MentorSerializer
    queryset = User.objects.filter(role='mentor')


class AdministrationListView(generics.ListAPIView):
    """View for listing administration users"""
    permission_classes = [permissions.IsAuthenticated]
    serializer_class = AdministrationSerializer
    queryset = User.objects.filter(role='administration')


class AdministrationDetailView(generics.RetrieveUpdateAPIView):
    """View for administration details"""
    permission_classes = [permissions.IsAuthenticated]
    serializer_class = AdministrationSerializer
    queryset = User.objects.filter(role='administration')


# Special views for mentor-student relationships
class MentorAssignmentView(APIView):
    """View for assigning mentors to students"""
    permission_classes = [permissions.IsAuthenticated, CanManageUsers]
    
    def post(self, request):
        student_id = request.data.get('student_id')
        mentor_id = request.data.get('mentor_id')
        
        if not student_id or not mentor_id:
            return Response(
                {'error': 'Both student_id and mentor_id are required'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        try:
            student = User.objects.get(id=student_id, role='student')
            mentor = User.objects.get(id=mentor_id, role='mentor')
            
            # Check if student can have a mentor
            if not student.can_have_mentor():
                return Response(
                    {'error': 'This student cannot have a mentor'},
                    status=status.HTTP_400_BAD_REQUEST
                )
            
            # Check if mentor level is appropriate
            if mentor.level not in student.get_available_mentor_levels():
                return Response(
                    {'error': 'Mentor level is not appropriate for this student'},
                    status=status.HTTP_400_BAD_REQUEST
                )
            
            # Assign mentor
            student.mentors.add(mentor)
            
            return Response({
                'message': 'Mentor assigned successfully',
                'student': StudentSerializer(student).data,
                'mentor': MentorSerializer(mentor).data
            })
            
        except User.DoesNotExist:
            return Response(
                {'error': 'Student or mentor not found'},
                status=status.HTTP_404_NOT_FOUND
            )


class MentorRatingView(APIView):
    """View for rating mentors"""
    permission_classes = [permissions.IsAuthenticated]
    
    def post(self, request):
        mentor_id = request.data.get('mentor_id')
        rating = request.data.get('rating')
        
        if not mentor_id or not rating:
            return Response(
                {'error': 'Both mentor_id and rating are required'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        try:
            rating = float(rating)
            if not (0 <= rating <= 5):
                return Response(
                    {'error': 'Rating must be between 0 and 5'},
                    status=status.HTTP_400_BAD_REQUEST
                )
        except ValueError:
            return Response(
                {'error': 'Rating must be a valid number'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        try:
            mentor = User.objects.get(id=mentor_id, role='mentor')
            
            # Check if current user is a mentee of this mentor
            if not request.user.mentors.filter(id=mentor_id).exists():
                return Response(
                    {'error': 'You can only rate your assigned mentor'},
                    status=status.HTTP_403_FORBIDDEN
                )
            
            # Update mentor rating
            total_ratings = mentor.total_ratings + 1
            new_rating = ((mentor.rating * mentor.total_ratings) + rating) / total_ratings
            
            mentor.rating = new_rating
            mentor.total_ratings = total_ratings
            mentor.save()
            
            return Response({
                'message': 'Rating submitted successfully',
                'mentor': MentorSerializer(mentor).data
            })
            
        except User.DoesNotExist:
            return Response(
                {'error': 'Mentor not found'},
                status=status.HTTP_404_NOT_FOUND
            )


# Search functionality
class UserSearchView(APIView):
    """View for searching users"""
    permission_classes = [permissions.IsAuthenticated]
    
    def get(self, request):
        query = request.query_params.get('q', '')
        role = request.query_params.get('role', '')
        
        if not query:
            return Response(
                {'error': 'Search query is required'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        queryset = User.objects.filter(
            Q(first_name__icontains=query) |
            Q(last_name__icontains=query) |
            Q(email__icontains=query) |
            Q(student_id__icontains=query) |
            Q(teacher_id__icontains=query) |
            Q(mentor_id__icontains=query)
        )
        
        if role:
            queryset = queryset.filter(role=role)
        
        # Apply role-specific filters
        if request.user.is_parent():
            queryset = queryset.filter(parent=request.user)
        
        serializer = UserSerializer(queryset[:20], many=True)  # Limit to 20 results
        return Response(serializer.data)


# Session management
class UserSessionsView(generics.ListAPIView):
    """View for listing user sessions"""
    permission_classes = [permissions.IsAuthenticated]
    serializer_class = UserSessionSerializer
    
    def get_queryset(self):
        return UserSession.objects.filter(user=self.request.user, is_active=True)


class DeactivateSessionView(APIView):
    """View for deactivating a session"""
    permission_classes = [permissions.IsAuthenticated]
    
    def post(self, request):
        session_id = request.data.get('session_id')
        
        try:
            session = UserSession.objects.get(
                id=session_id,
                user=request.user
            )
            session.is_active = False
            session.save()
            
            return Response({'message': 'Session deactivated successfully'})
            
        except UserSession.DoesNotExist:
            return Response(
                {'error': 'Session not found'},
                status=status.HTTP_404_NOT_FOUND
            )


class UserPermissionsView(APIView):
    """View for getting user permissions"""
    permission_classes = [permissions.IsAuthenticated]
    
    def get(self, request):
        user_permissions = get_user_permissions(request.user)
        accessible_student_ids = RoleBasedDataFilter.get_accessible_student_ids(request.user)
        
        return Response({
            'user_id': request.user.id,
            'role': request.user.role,
            'permissions': user_permissions,
            'accessible_student_ids': accessible_student_ids,
            'can_access_all_data': request.user.role in ['administration', 'superadmin']
        })


class RoleBasedUserListView(APIView):
    """View for getting filtered user list based on role"""
    permission_classes = [permissions.IsAuthenticated]
    
    def get(self, request):
        role_filter = request.query_params.get('role', None)
        queryset = User.objects.all()
        
        if role_filter:
            queryset = queryset.filter(role=role_filter)
        
        # Apply role-based filtering
        queryset = RoleBasedDataFilter.filter_users_queryset(queryset, request.user)
        
        # Apply additional filters
        department = request.query_params.get('department', None)
        if department:
            queryset = RoleBasedDataFilter.apply_department_filter(
                queryset, request.user, 'department'
            )
        
        level = request.query_params.get('level', None)
        if level:
            queryset = RoleBasedDataFilter.apply_level_filter(
                queryset, request.user, 'level'
            )
        
        serializer = UserSerializer(queryset, many=True)
        return Response({
            'users': serializer.data,
            'total_count': queryset.count(),
            'filtered_by_role': request.user.role
        })


class UserAccessCheckView(APIView):
    """View for checking if user can access another user's data"""
    permission_classes = [permissions.IsAuthenticated]
    
    def post(self, request):
        target_user_id = request.data.get('target_user_id')
        
        if not target_user_id:
            return Response(
                {'error': 'target_user_id is required'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        try:
            target_user = User.objects.get(id=target_user_id)
            can_access = RoleBasedDataFilter.can_access_user_data(
                request.user, target_user
            )
            
            return Response({
                'can_access': can_access,
                'requesting_user_role': request.user.role,
                'target_user_role': target_user.role,
                'reason': self._get_access_reason(request.user, target_user, can_access)
            })
            
        except User.DoesNotExist:
            return Response(
                {'error': 'Target user not found'},
                status=status.HTTP_404_NOT_FOUND
            )
    
    def _get_access_reason(self, requesting_user, target_user, can_access):
        """Get reason for access decision"""
        if requesting_user.id == target_user.id:
            return "Own data access"
        
        if requesting_user.role in ['administration', 'superadmin']:
            return "Admin access"
        
        if requesting_user.role == 'teacher' and target_user.role == 'student':
            return "Teacher-student relationship" if can_access else "No teacher-student relationship"
        
        if requesting_user.role == 'mentor':
            return "Mentor-mentee relationship" if can_access else "No mentor-mentee relationship"
        
        if requesting_user.role == 'parent':
            return "Parent-child relationship" if can_access else "No parent-child relationship"
        
        return "No access permissions" if not can_access else "Access granted"
