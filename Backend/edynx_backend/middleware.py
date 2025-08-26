import json
import logging
from django.http import JsonResponse
from django.contrib.auth import get_user_model
from django.utils.deprecation import MiddlewareMixin
from django.core.exceptions import PermissionDenied
from rest_framework_simplejwt.authentication import JWTAuthentication
from rest_framework_simplejwt.exceptions import InvalidToken, TokenError
from .permissions import check_role_permission, get_user_permissions

User = get_user_model()
logger = logging.getLogger(__name__)


class RoleValidationMiddleware(MiddlewareMixin):
    """
    Middleware to validate user roles and add role information to requests
    """
    
    def process_request(self, request):
        """
        Add role information to request for easy access in views
        """
        if hasattr(request, 'user') and request.user.is_authenticated:
            # Add user permissions to request
            request.user_permissions = get_user_permissions(request.user)
            request.user_role = request.user.role
        else:
            request.user_permissions = {}
            request.user_role = None
        
        return None


class JWTRoleMiddleware(MiddlewareMixin):
    """
    Middleware to extract and validate JWT tokens with role information
    """
    
    def process_request(self, request):
        """
        Extract JWT token and validate user role
        """
        # Skip for certain paths
        skip_paths = [
            '/api/auth/login/',
            '/api/auth/register/',
            '/api/auth/refresh/',
            '/admin/',
            '/static/',
            '/media/',
        ]
        
        if any(request.path.startswith(path) for path in skip_paths):
            return None
        
        # Try to authenticate with JWT
        jwt_auth = JWTAuthentication()
        try:
            auth_result = jwt_auth.authenticate(request)
            if auth_result:
                user, token = auth_result
                request.user = user
                request.auth = token
                
                # Validate user is active and has valid role
                if not user.is_active:
                    return JsonResponse({
                        'error': 'User account is disabled',
                        'code': 'ACCOUNT_DISABLED'
                    }, status=403)
                
                if not user.role:
                    return JsonResponse({
                        'error': 'User role not assigned',
                        'code': 'NO_ROLE'
                    }, status=403)
                
        except (InvalidToken, TokenError) as e:
            # Only return error for API endpoints that require authentication
            if request.path.startswith('/api/') and not any(request.path.startswith(path) for path in skip_paths):
                return JsonResponse({
                    'error': 'Invalid or expired token',
                    'code': 'INVALID_TOKEN'
                }, status=401)
        
        return None


class AuditLogMiddleware(MiddlewareMixin):
    """
    Middleware to log user actions for security auditing
    """
    
    def process_request(self, request):
        """
        Log incoming requests for audit purposes
        """
        # Only log API requests from authenticated users
        if (request.path.startswith('/api/') and 
            hasattr(request, 'user') and 
            request.user.is_authenticated):
            
            # Log sensitive actions
            sensitive_actions = [
                'POST', 'PUT', 'PATCH', 'DELETE'
            ]
            
            if request.method in sensitive_actions:
                logger.info(f"User {request.user.email} ({request.user.role}) "
                           f"performed {request.method} on {request.path}")
        
        return None
    
    def process_response(self, request, response):
        """
        Log response status for failed requests
        """
        if (hasattr(request, 'user') and 
            request.user.is_authenticated and 
            response.status_code >= 400):
            
            logger.warning(f"User {request.user.email} ({request.user.role}) "
                          f"received {response.status_code} for {request.method} {request.path}")
        
        return response


class RoleBasedAccessMiddleware(MiddlewareMixin):
    """
    Middleware to enforce role-based access control on specific endpoints
    """
    
    # Define role requirements for specific endpoints
    ROLE_REQUIREMENTS = {
        # Administration-only sections
        '/api/admin/': ['administration', 'superadmin'],
        # Specific privileged actions (keep narrow to avoid blocking general user endpoints)
        '/api/attendance/sessions/create/': ['teacher', 'administration', 'superadmin'],
        '/api/attendance/manage/': ['teacher', 'administration', 'superadmin'],
        '/api/mentors/assign/': ['administration', 'superadmin'],
        '/api/reports/': ['teacher', 'mentor', 'parent', 'administration', 'superadmin'],
        # Example: user management screens could live under this path if added later
        '/api/users/administration/': ['administration', 'superadmin'],
    }
    
    def process_request(self, request):
        """
        Check if user has required role for the endpoint
        """
        if not hasattr(request, 'user') or not request.user.is_authenticated:
            return None
        
        # Check role requirements for specific endpoints
        for endpoint, required_roles in self.ROLE_REQUIREMENTS.items():
            if request.path.startswith(endpoint):
                if not check_role_permission(request.user, required_roles):
                    return JsonResponse({
                        'error': f'Access denied. Required roles: {", ".join(required_roles)}',
                        'code': 'INSUFFICIENT_PERMISSIONS',
                        'user_role': request.user.role
                    }, status=403)
        
        return None


class DataFilterMiddleware(MiddlewareMixin):
    """
    Middleware to add data filtering context based on user role
    """
    
    def process_request(self, request):
        """
        Add data filtering context to request
        """
        if hasattr(request, 'user') and request.user.is_authenticated:
            # Add filtering context based on role
            request.data_filter = self._get_data_filter(request.user)
        
        return None
    
    def _get_data_filter(self, user):
        """
        Get data filtering rules based on user role
        """
        filter_context = {
            'can_view_all_data': False,
            'own_data_only': True,
            'department_filter': None,
            'class_filter': None,
            'level_filter': None,
        }
        
        if user.role in ['administration', 'superadmin']:
            filter_context.update({
                'can_view_all_data': True,
                'own_data_only': False,
            })
        
        elif user.role == 'teacher':
            filter_context.update({
                'can_view_all_data': True,
                'own_data_only': False,
                'department_filter': user.department,
            })
        
        elif user.role == 'mentor':
            filter_context.update({
                'own_data_only': False,
                'level_filter': user.level,
            })
        
        elif user.role == 'parent':
            filter_context.update({
                'own_data_only': False,
                # Parents can only see their children's data
            })
        
        return filter_context


def require_role(allowed_roles):
    """
    Decorator to require specific roles for view functions
    """
    def decorator(view_func):
        def wrapper(request, *args, **kwargs):
            if not hasattr(request, 'user') or not request.user.is_authenticated:
                return JsonResponse({
                    'error': 'Authentication required',
                    'code': 'NOT_AUTHENTICATED'
                }, status=401)
            
            if not check_role_permission(request.user, allowed_roles):
                return JsonResponse({
                    'error': f'Access denied. Required roles: {", ".join(allowed_roles)}',
                    'code': 'INSUFFICIENT_PERMISSIONS',
                    'user_role': request.user.role
                }, status=403)
            
            return view_func(request, *args, **kwargs)
        return wrapper
    return decorator