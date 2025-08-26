from django.db.models import Q
from django.contrib.auth import get_user_model
from attendance.models import Attendance, AttendanceSession, Class
from users.models import User

User = get_user_model()


class RoleBasedDataFilter:
    """
    Utility class for filtering data based on user roles
    """
    
    @staticmethod
    def filter_attendance_queryset(queryset, user):
        """
        Filter attendance queryset based on user role
        """
        if user.role == 'student':
            return queryset.filter(student=user)
        
        elif user.role == 'teacher':
            return queryset.filter(session__created_by=user)
        
        elif user.role == 'mentor':
            # Mentors can see their mentees' attendance
            return queryset.filter(student__in=user.mentees.all())
        
        elif user.role == 'parent':
            # Parents can see their children's attendance
            return queryset.filter(student__parent=user)
        
        elif user.role in ['administration', 'superadmin']:
            # Admins can see all attendance
            return queryset
        
        return queryset.none()
    
    @staticmethod
    def filter_attendance_sessions_queryset(queryset, user):
        """
        Filter attendance sessions based on user role
        """
        if user.role == 'student':
            return queryset.filter(class_obj__students=user)
        
        elif user.role == 'teacher':
            return queryset.filter(created_by=user)
        
        elif user.role == 'mentor':
            # Mentors can see sessions for their mentees' classes
            mentee_classes = Class.objects.filter(students__in=user.mentees.all())
            return queryset.filter(class_obj__in=mentee_classes)
        
        elif user.role == 'parent':
            # Parents can see sessions for their children's classes
            children_classes = Class.objects.filter(students__parent=user)
            return queryset.filter(class_obj__in=children_classes)
        
        elif user.role in ['administration', 'superadmin']:
            return queryset
        
        return queryset.none()
    
    @staticmethod
    def filter_users_queryset(queryset, user):
        """
        Filter users queryset based on user role
        """
        if user.role == 'student':
            # Students can only see themselves and their mentors
            return queryset.filter(
                Q(id=user.id) | 
                Q(id__in=user.mentors.all())
            )
        
        elif user.role == 'teacher':
            # Teachers can see students in their classes and other teachers
            teacher_classes = Class.objects.filter(teacher=user)
            students_in_classes = User.objects.filter(
                role='student',
                class_name__in=teacher_classes.values_list('name', flat=True)
            )
            return queryset.filter(
                Q(id=user.id) |
                Q(role='teacher') |
                Q(id__in=students_in_classes)
            )
        
        elif user.role == 'mentor':
            # Mentors can see themselves, their mentees, and other mentors
            return queryset.filter(
                Q(id=user.id) |
                Q(id__in=user.mentees.all()) |
                Q(role='mentor')
            )
        
        elif user.role == 'parent':
            # Parents can see themselves and their children
            return queryset.filter(
                Q(id=user.id) |
                Q(parent=user)
            )
        
        elif user.role in ['administration', 'superadmin']:
            return queryset
        
        return queryset.filter(id=user.id)
    
    @staticmethod
    def filter_classes_queryset(queryset, user):
        """
        Filter classes queryset based on user role
        """
        if user.role == 'student':
            return queryset.filter(students=user)
        
        elif user.role == 'teacher':
            return queryset.filter(teacher=user)
        
        elif user.role == 'mentor':
            # Mentors can see classes where their mentees are enrolled
            return queryset.filter(students__in=user.mentees.all()).distinct()
        
        elif user.role == 'parent':
            # Parents can see classes where their children are enrolled
            return queryset.filter(students__parent=user).distinct()
        
        elif user.role in ['administration', 'superadmin']:
            return queryset
        
        return queryset.none()
    
    @staticmethod
    def can_access_user_data(requesting_user, target_user):
        """
        Check if requesting user can access target user's data
        """
        # Users can always access their own data
        if requesting_user.id == target_user.id:
            return True
        
        # Admins can access all data
        if requesting_user.role in ['administration', 'superadmin']:
            return True
        
        # Teachers can access their students' data
        if requesting_user.role == 'teacher' and target_user.role == 'student':
            teacher_classes = Class.objects.filter(teacher=requesting_user)
            return teacher_classes.filter(students=target_user).exists()
        
        # Mentors can access their mentees' data
        if requesting_user.role == 'mentor':
            return requesting_user.mentees.filter(id=target_user.id).exists()
        
        # Parents can access their children's data
        if requesting_user.role == 'parent':
            return target_user.parent == requesting_user
        
        return False
    
    @staticmethod
    def get_accessible_student_ids(user):
        """
        Get list of student IDs that the user can access
        """
        if user.role == 'student':
            return [user.id]
        
        elif user.role == 'teacher':
            teacher_classes = Class.objects.filter(teacher=user)
            return list(User.objects.filter(
                role='student',
                class_name__in=teacher_classes.values_list('name', flat=True)
            ).values_list('id', flat=True))
        
        elif user.role == 'mentor':
            return list(user.mentees.values_list('id', flat=True))
        
        elif user.role == 'parent':
            return list(User.objects.filter(parent=user).values_list('id', flat=True))
        
        elif user.role in ['administration', 'superadmin']:
            return list(User.objects.filter(role='student').values_list('id', flat=True))
        
        return []
    
    @staticmethod
    def apply_department_filter(queryset, user, model_field='department'):
        """
        Apply department-based filtering for teachers
        """
        if user.role == 'teacher' and user.department:
            filter_kwargs = {model_field: user.department}
            return queryset.filter(**filter_kwargs)
        
        return queryset
    
    @staticmethod
    def apply_level_filter(queryset, user, model_field='level'):
        """
        Apply level-based filtering for mentors
        """
        if user.role == 'mentor' and user.level:
            # Mentors can access students from lower levels
            filter_kwargs = {f"{model_field}__lt": user.level}
            return queryset.filter(**filter_kwargs)
        
        return queryset


class AttendanceDataFilter:
    """
    Specialized filter for attendance-related data
    """
    
    @staticmethod
    def get_filtered_attendance_data(user, filters=None):
        """
        Get attendance data filtered by user role and additional filters
        """
        queryset = Attendance.objects.select_related(
            'student', 'session', 'session__class_obj'
        )
        
        # Apply role-based filtering
        queryset = RoleBasedDataFilter.filter_attendance_queryset(queryset, user)
        
        # Apply additional filters if provided
        if filters:
            if 'start_date' in filters and 'end_date' in filters:
                queryset = queryset.filter(
                    session__date__range=[filters['start_date'], filters['end_date']]
                )
            
            if 'class_id' in filters:
                queryset = queryset.filter(session__class_obj_id=filters['class_id'])
            
            if 'student_id' in filters:
                # Verify user can access this student's data
                try:
                    target_student = User.objects.get(id=filters['student_id'])
                    if RoleBasedDataFilter.can_access_user_data(user, target_student):
                        queryset = queryset.filter(student_id=filters['student_id'])
                    else:
                        return queryset.none()
                except User.DoesNotExist:
                    return queryset.none()
            
            if 'status' in filters:
                queryset = queryset.filter(status=filters['status'])
        
        return queryset
    
    @staticmethod
    def get_attendance_statistics(user, filters=None):
        """
        Get attendance statistics filtered by user role
        """
        queryset = AttendanceDataFilter.get_filtered_attendance_data(user, filters)
        
        total_records = queryset.count()
        if total_records == 0:
            return {
                'total_records': 0,
                'present_count': 0,
                'absent_count': 0,
                'late_count': 0,
                'excused_count': 0,
                'attendance_rate': 0
            }
        
        present_count = queryset.filter(status='present').count()
        absent_count = queryset.filter(status='absent').count()
        late_count = queryset.filter(status='late').count()
        excused_count = queryset.filter(status='excused').count()
        
        attendance_rate = (present_count / total_records * 100) if total_records > 0 else 0
        
        return {
            'total_records': total_records,
            'present_count': present_count,
            'absent_count': absent_count,
            'late_count': late_count,
            'excused_count': excused_count,
            'attendance_rate': round(attendance_rate, 2)
        }
