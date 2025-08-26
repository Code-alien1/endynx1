from rest_framework import permissions
from django.contrib.auth import get_user_model
from django.core.exceptions import PermissionDenied

User = get_user_model()


class RoleBasedPermission(permissions.BasePermission):
    """
    Base permission class for role-based access control
    """
    required_roles = []
    
    def has_permission(self, request, view):
        if not request.user or not request.user.is_authenticated:
            return False
        
        if not self.required_roles:
            return True
            
        return request.user.role in self.required_roles
    
    def has_object_permission(self, request, view, obj):
        return self.has_permission(request, view)


class IsStudent(RoleBasedPermission):
    """Permission for student role only"""
    required_roles = ['student']


class IsTeacher(RoleBasedPermission):
    """Permission for teacher role only"""
    required_roles = ['teacher']


class IsMentor(RoleBasedPermission):
    """Permission for mentor role only"""
    required_roles = ['mentor']


class IsParent(RoleBasedPermission):
    """Permission for parent role only"""
    required_roles = ['parent']


class IsAdministration(RoleBasedPermission):
    """Permission for administration role only"""
    required_roles = ['administration']


class IsSuperAdmin(RoleBasedPermission):
    """Permission for superadmin role only"""
    required_roles = ['superadmin']


class IsTeacherOrAdmin(RoleBasedPermission):
    """Permission for teachers and administrators"""
    required_roles = ['teacher', 'administration', 'superadmin']


class IsAdminOrSuperAdmin(RoleBasedPermission):
    """Permission for administrators and superadmins"""
    required_roles = ['administration', 'superadmin']


class CanManageAttendance(RoleBasedPermission):
    """Permission for roles that can manage attendance"""
    required_roles = ['teacher', 'administration', 'superadmin']


class CanViewAllStudents(RoleBasedPermission):
    """Permission for roles that can view all student data"""
    required_roles = ['teacher', 'administration', 'superadmin']


class CanManageUsers(RoleBasedPermission):
    """Permission for roles that can manage users"""
    required_roles = ['administration', 'superadmin']


class IsOwnerOrAdmin(permissions.BasePermission):
    """
    Permission that allows users to access their own data or admins to access any data
    """
    def has_permission(self, request, view):
        return request.user and request.user.is_authenticated
    
    def has_object_permission(self, request, view, obj):
        # Admin roles can access any object
        if request.user.role in ['administration', 'superadmin']:
            return True
        
        # Users can access their own data
        if hasattr(obj, 'user'):
            return obj.user == request.user
        elif hasattr(obj, 'student') and hasattr(request.user, 'id'):
            return obj.student == request.user
        elif isinstance(obj, User):
            return obj == request.user
        
        return False


class ParentChildPermission(permissions.BasePermission):
    """
    Permission for parents to access their children's data
    """
    def has_permission(self, request, view):
        return request.user and request.user.is_authenticated
    
    def has_object_permission(self, request, view, obj):
        # Admin roles can access any object
        if request.user.role in ['administration', 'superadmin']:
            return True
        
        # Teachers can access their students' data
        if request.user.role == 'teacher':
            return True
        
        # Parents can access their children's data
        if request.user.role == 'parent':
            if hasattr(obj, 'student'):
                return obj.student.parent == request.user
            elif hasattr(obj, 'user') and obj.user.parent:
                return obj.user.parent == request.user
        
        # Users can access their own data
        if hasattr(obj, 'user'):
            return obj.user == request.user
        elif isinstance(obj, User):
            return obj == request.user
        
        return False


class MentorMenteePermission(permissions.BasePermission):
    """
    Permission for mentors to access their mentees' data
    """
    def has_permission(self, request, view):
        return request.user and request.user.is_authenticated
    
    def has_object_permission(self, request, view, obj):
        # Admin roles can access any object
        if request.user.role in ['administration', 'superadmin']:
            return True
        
        # Teachers can access their students' data
        if request.user.role == 'teacher':
            return True
        
        # Mentors can access their mentees' data
        if request.user.role == 'mentor':
            if hasattr(obj, 'student'):
                return obj.student in request.user.mentees.all()
            elif hasattr(obj, 'user'):
                return obj.user in request.user.mentees.all()
        
        # Users can access their own data
        if hasattr(obj, 'user'):
            return obj.user == request.user
        elif isinstance(obj, User):
            return obj == request.user
        
        return False


def check_role_permission(user, required_roles):
    """
    Utility function to check if user has required role
    """
    if not user or not user.is_authenticated:
        return False
    
    if not required_roles:
        return True
    
    return user.role in required_roles


def get_user_permissions(user):
    """
    Get all permissions for a user based on their role
    """
    if not user or not user.is_authenticated:
        return {}
    
    permissions = {
        'can_view_own_data': True,
        'can_view_all_students': False,
        'can_manage_attendance': False,
        'can_view_reports': False,
        'can_manage_users': False,
        'can_access_settings': False,
        'can_create_sessions': False,
        'can_delete_records': False,
        'can_manage_mentors': False,
        'can_view_parent_data': False,
    }
    
    role = user.role
    
    if role == 'superadmin':
        return {key: True for key in permissions.keys()}
    
    elif role == 'administration':
        permissions.update({
            'can_view_all_students': True,
            'can_manage_attendance': True,
            'can_view_reports': True,
            'can_manage_users': True,
            'can_access_settings': True,
            'can_create_sessions': True,
            'can_delete_records': True,
            'can_manage_mentors': True,
        })
    
    elif role == 'teacher':
        permissions.update({
            'can_view_all_students': True,
            'can_manage_attendance': True,
            'can_view_reports': True,
            'can_create_sessions': True,
        })
    
    elif role == 'mentor':
        permissions.update({
            'can_view_reports': True,
            'can_manage_mentors': True,
        })
    
    elif role == 'parent':
        permissions.update({
            'can_view_reports': True,
            'can_view_parent_data': True,
        })
    
    return permissions