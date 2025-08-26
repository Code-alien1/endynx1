from django.contrib import admin
from django.contrib.auth.admin import UserAdmin as BaseUserAdmin
from django.utils.html import format_html
from .models import User, UserProfile, UserSession


class UserProfileInline(admin.StackedInline):
    model = UserProfile
    can_delete = False
    verbose_name_plural = 'Profile'
    fk_name = 'user'


class UserAdmin(BaseUserAdmin):
    inlines = (UserProfileInline,)
    list_display = ('email', 'first_name', 'last_name', 'role', 'level', 'is_active', 'created_at')
    list_filter = ('role', 'level', 'is_active', 'created_at')
    search_fields = ('email', 'first_name', 'last_name', 'student_id', 'teacher_id', 'mentor_id')
    ordering = ('-created_at',)
    
    fieldsets = (
        (None, {'fields': ('email', 'password')}),
        ('Personal info', {'fields': ('first_name', 'last_name', 'phone_number', 'date_of_birth', 'address', 'profile_picture')}),
        ('Role Information', {'fields': ('role', 'level', 'class_name')}),
        ('Student Info', {'fields': ('student_id', 'parent'), 'classes': ('collapse',)}),
        ('Teacher Info', {'fields': ('teacher_id', 'subject_taught', 'department'), 'classes': ('collapse',)}),
        ('Mentor Info', {'fields': ('mentor_id', 'mentees', 'rating', 'total_ratings'), 'classes': ('collapse',)}),
        ('Administration Info', {'fields': ('admin_id', 'position'), 'classes': ('collapse',)}),
        ('Face Recognition', {'fields': ('face_encoding', 'face_image'), 'classes': ('collapse',)}),
        ('Permissions', {'fields': ('is_active', 'is_staff', 'is_superuser', 'groups', 'user_permissions')}),
        ('Important dates', {'fields': ('last_login', 'date_joined')}),
    )
    
    add_fieldsets = (
        (None, {
            'classes': ('wide',),
            'fields': ('email', 'password1', 'password2', 'role'),
        }),
    )
    
    def get_queryset(self, request):
        return super().get_queryset(request).select_related('profile')
    
    def get_inline_instances(self, request, obj=None):
        if not obj:
            return []
        return super().get_inline_instances(request, obj)


class UserProfileAdmin(admin.ModelAdmin):
    list_display = ('user', 'gpa', 'academic_year', 'experience_years', 'emergency_contact')
    list_filter = ('academic_year', 'experience_years')
    search_fields = ('user__email', 'user__first_name', 'user__last_name')
    raw_id_fields = ('user',)


class UserSessionAdmin(admin.ModelAdmin):
    list_display = ('user', 'session_key', 'ip_address', 'is_active', 'created_at', 'last_activity')
    list_filter = ('is_active', 'created_at', 'last_activity')
    search_fields = ('user__email', 'user__first_name', 'user__last_name', 'ip_address')
    readonly_fields = ('created_at', 'last_activity')
    raw_id_fields = ('user',)


# Register models
admin.site.register(User, UserAdmin)
admin.site.register(UserProfile, UserProfileAdmin)
admin.site.register(UserSession, UserSessionAdmin)
