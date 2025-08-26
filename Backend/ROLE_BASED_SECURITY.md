# Role-Based Authentication and Authorization System

## Overview

The Edynx mobile app implements a comprehensive role-based authentication and authorization system that ensures secure access control and data filtering across all backend endpoints. This system provides granular permissions and data access controls based on user roles.

## User Roles

### 1. **Student**
- **Access Level**: Restricted to own data
- **Permissions**: 
  - View own attendance records
  - View own profile information
  - Access assigned mentors
- **Data Filtering**: Can only see their own attendance and profile data

### 2. **Parent**
- **Access Level**: Access to children's data
- **Permissions**:
  - View children's attendance records
  - View children's profile information
  - Communicate with teachers and mentors
- **Data Filtering**: Can only see data related to their children

### 3. **Teacher**
- **Access Level**: Access to students in their classes
- **Permissions**:
  - Manage attendance for their classes
  - View student records in their classes
  - Create and manage attendance sessions
  - Generate attendance reports
- **Data Filtering**: Can only see students and data from classes they teach

### 4. **Mentor**
- **Access Level**: Access to assigned mentees
- **Permissions**:
  - View mentee attendance and progress
  - Provide guidance and support
  - Access mentee academic records
- **Data Filtering**: Can only see data for students they mentor

### 5. **Administration**
- **Access Level**: Full access to school data
- **Permissions**:
  - Manage all users and roles
  - Access all attendance records
  - Generate comprehensive reports
  - Manage system settings
- **Data Filtering**: Can access all data within the system

### 6. **SuperAdmin**
- **Access Level**: Complete system access
- **Permissions**:
  - All administration permissions
  - System configuration and maintenance
  - User role management
  - Security settings
- **Data Filtering**: Unrestricted access to all data

## Security Components

### 1. **Permissions System** (`edynx_backend/permissions.py`)

#### Base Permission Classes
- `RoleBasedPermission`: Base class for all role-based permissions
- `IsStudent`, `IsTeacher`, `IsParent`, `IsMentor`: Role-specific permissions
- `IsAdministration`, `IsSuperAdmin`: Administrative permissions

#### Action-Based Permissions
- `CanManageUsers`: Permission to create, update, delete users
- `CanManageAttendance`: Permission to manage attendance records
- `CanViewAllStudents`: Permission to view all student data
- `CanGenerateReports`: Permission to generate system reports

#### Relationship-Based Permissions
- `IsOwnerOrAdmin`: Access to own data or admin access
- `ParentChildPermission`: Parent access to children's data
- `MentorMenteePermission`: Mentor access to mentee data
- `TeacherStudentPermission`: Teacher access to student data

### 2. **Middleware System** (`edynx_backend/middleware.py`)

#### JWT Role Middleware
- Extracts and validates JWT tokens
- Adds user role information to request context
- Handles token expiration and validation errors

#### Role Validation Middleware
- Validates user roles against endpoint requirements
- Enriches request with permission context
- Provides role-based request filtering

#### Role-Based Access Middleware
- Enforces endpoint-level access control
- Returns appropriate error responses for unauthorized access
- Logs security violations

#### Data Filter Middleware
- Adds data filtering context to requests
- Provides role-based query filtering
- Ensures data isolation between roles

#### Audit Log Middleware
- Logs all user actions for security auditing
- Tracks access attempts and data modifications
- Provides audit trail for compliance

### 3. **Data Filtering System** (`edynx_backend/filters.py`)

#### Role-Based Data Filter
- `filter_attendance_queryset()`: Filters attendance data by role
- `filter_users_queryset()`: Filters user data by role
- `filter_classes_queryset()`: Filters class data by role
- `can_access_user_data()`: Checks data access permissions

#### Attendance Data Filter
- `get_filtered_attendance_data()`: Role-aware attendance filtering
- `get_attendance_statistics()`: Role-based statistics calculation
- Advanced filtering with date ranges, classes, and status

## API Endpoints

### Authentication Endpoints
- `POST /api/users/register/` - User registration
- `POST /api/users/login/` - User login with role-based tokens
- `POST /api/users/logout/` - Secure logout with token blacklisting

### Role-Based Endpoints
- `GET /api/users/permissions/` - Get user permissions and accessible data
- `GET /api/users/role-based-users/` - Get filtered user list based on role
- `POST /api/users/access-check/` - Check access permissions for target user

### Attendance Endpoints
- `GET /api/attendance/role-based/` - Get role-filtered attendance data
- `GET /api/attendance/statistics/` - Get role-based attendance statistics

## Security Features

### 1. **Token-Based Authentication**
- JWT tokens with role information embedded
- Automatic token validation on each request
- Token blacklisting for secure logout
- Role-specific token claims

### 2. **Permission-Based Authorization**
- Granular permissions for different actions
- Role-based endpoint protection
- Object-level permissions for data access
- Relationship-based access control

### 3. **Data Isolation**
- Role-based query filtering
- Automatic data scoping by user role
- Prevention of cross-role data access
- Secure data aggregation and statistics

### 4. **Audit and Monitoring**
- Comprehensive audit logging
- Security violation tracking
- Access attempt monitoring
- Compliance reporting capabilities

## Usage Examples

### Frontend Permission Checking
```typescript
// Check user permissions
const permissions = await api.getUserPermissions();
if (permissions.canManageAttendance) {
  // Show attendance management UI
}

// Check access to specific user data
const canAccess = await api.checkUserAccess(targetUserId);
if (canAccess) {
  // Load user data
}
```

### Backend Permission Enforcement
```python
# In views.py
class AttendanceListView(generics.ListAPIView):
    permission_classes = [IsAuthenticated, CanViewAttendance]
    
    def get_queryset(self):
        queryset = Attendance.objects.all()
        return RoleBasedDataFilter.filter_attendance_queryset(
            queryset, self.request.user
        )
```

### Role-Based Data Filtering
```python
# Get filtered attendance data
filters = {
    'start_date': '2024-01-01',
    'end_date': '2024-12-31',
    'class_id': 'class-uuid'
}
attendance_data = AttendanceDataFilter.get_filtered_attendance_data(
    user, filters
)
```

## Testing

### Security Test Script
Run the comprehensive security test suite:
```bash
cd Backend
python test_role_security.py
```

### Test Coverage
- User permission validation
- Role-based data access
- Cross-role access prevention
- Attendance data filtering
- Statistics calculation
- Unauthorized access blocking

## Configuration

### Django Settings
```python
MIDDLEWARE = [
    # ... other middleware
    'edynx_backend.middleware.JWTRoleMiddleware',
    'edynx_backend.middleware.RoleValidationMiddleware',
    'edynx_backend.middleware.RoleBasedAccessMiddleware',
    'edynx_backend.middleware.DataFilterMiddleware',
    'edynx_backend.middleware.AuditLogMiddleware',
]

# JWT Configuration
SIMPLE_JWT = {
    'ACCESS_TOKEN_LIFETIME': timedelta(hours=1),
    'REFRESH_TOKEN_LIFETIME': timedelta(days=7),
    'ROTATE_REFRESH_TOKENS': True,
    'BLACKLIST_AFTER_ROTATION': True,
}
```

## Security Best Practices

### 1. **Token Management**
- Short-lived access tokens (1 hour)
- Refresh token rotation
- Automatic token blacklisting
- Secure token storage

### 2. **Permission Validation**
- Multiple layers of permission checking
- Both endpoint and object-level permissions
- Fail-secure defaults (deny by default)
- Regular permission audits

### 3. **Data Protection**
- Automatic data filtering by role
- Prevention of data leakage
- Secure query construction
- Input validation and sanitization

### 4. **Monitoring and Auditing**
- Comprehensive audit logging
- Real-time security monitoring
- Access pattern analysis
- Compliance reporting

## Troubleshooting

### Common Issues

#### 1. **Permission Denied Errors**
- Check user role assignments
- Verify permission class configuration
- Review middleware order
- Validate JWT token claims

#### 2. **Data Access Issues**
- Verify role-based filtering logic
- Check relationship configurations
- Review queryset filtering
- Validate user-data relationships

#### 3. **Authentication Failures**
- Check JWT token validity
- Verify middleware configuration
- Review token blacklist status
- Validate user account status

### Debug Commands
```bash
# Check user permissions
python manage.py shell
>>> from users.models import User
>>> from edynx_backend.permissions import get_user_permissions
>>> user = User.objects.get(email='user@example.com')
>>> permissions = get_user_permissions(user)
>>> print(permissions)

# Test data filtering
>>> from edynx_backend.filters import RoleBasedDataFilter
>>> queryset = User.objects.all()
>>> filtered = RoleBasedDataFilter.filter_users_queryset(queryset, user)
>>> print(filtered.count())
```

## Future Enhancements

### Planned Features
- Dynamic permission assignment
- Time-based access controls
- IP-based access restrictions
- Multi-factor authentication
- Advanced audit analytics
- Role hierarchy management

### Security Improvements
- Enhanced token encryption
- Biometric authentication integration
- Advanced threat detection
- Automated security scanning
- Compliance automation

## Compliance

This role-based security system is designed to meet:
- **FERPA** (Family Educational Rights and Privacy Act)
- **COPPA** (Children's Online Privacy Protection Act)
- **GDPR** (General Data Protection Regulation)
- **SOC 2** (Service Organization Control 2)

## Support

For security-related issues or questions:
1. Review this documentation
2. Run the security test suite
3. Check audit logs for violations
4. Contact the development team for assistance

---

**Last Updated**: August 2024  
**Version**: 1.0  
**Maintainer**: Edynx Development Team
