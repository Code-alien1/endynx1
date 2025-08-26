from rest_framework import serializers
from django.contrib.auth import authenticate
from django.contrib.auth.password_validation import validate_password
from .models import User, UserProfile, UserSession


class UserProfileSerializer(serializers.ModelSerializer):
    """Serializer for UserProfile model"""
    
    class Meta:
        model = UserProfile
        fields = [
            'bio', 'emergency_contact', 'emergency_contact_name',
            'gpa', 'academic_year', 'experience_years', 'qualifications', 'specializations'
        ]


class UserSerializer(serializers.ModelSerializer):
    """Main User serializer for general operations"""
    profile = UserProfileSerializer(read_only=True)
    full_name = serializers.SerializerMethodField()
    role_display = serializers.CharField(source='get_role_display', read_only=True)
    level_display = serializers.CharField(source='get_level_display', read_only=True)
    
    class Meta:
        model = User
        fields = [
            'id', 'email', 'username', 'first_name', 'last_name', 'full_name',
            'phone_number', 'role', 'role_display', 'is_active', 'created_at',
            'profile_picture', 'date_of_birth', 'address',
            'student_id', 'level', 'level_display', 'class_name',
            'teacher_id', 'subject_taught', 'department',
            'mentor_id', 'rating', 'total_ratings',
            'admin_id', 'position',
            'profile'
        ]
        read_only_fields = ['id', 'created_at', 'rating', 'total_ratings']
    
    def get_full_name(self, obj):
        return obj.get_full_name()


class StudentSerializer(serializers.ModelSerializer):
    """Serializer specifically for Student users"""
    profile = UserProfileSerializer(read_only=True)
    parent_name = serializers.CharField(source='parent.get_full_name', read_only=True)
    mentor_name = serializers.CharField(source='mentors.first.get_full_name', read_only=True)
    can_have_mentor = serializers.BooleanField(read_only=True)
    available_mentor_levels = serializers.ListField(read_only=True)
    
    class Meta:
        model = User
        fields = [
            'id', 'email', 'username', 'first_name', 'last_name',
            'phone_number', 'student_id', 'level', 'class_name',
            'parent', 'parent_name', 'mentor_name', 'can_have_mentor',
            'available_mentor_levels', 'profile_picture', 'profile'
        ]
        read_only_fields = ['id', 'can_have_mentor', 'available_mentor_levels']
    
    def to_representation(self, instance):
        data = super().to_representation(instance)
        data['can_have_mentor'] = instance.can_have_mentor()
        data['available_mentor_levels'] = instance.get_available_mentor_levels()
        return data


class ParentSerializer(serializers.ModelSerializer):
    """Serializer specifically for Parent users"""
    children = StudentSerializer(many=True, read_only=True)
    children_count = serializers.SerializerMethodField()
    
    class Meta:
        model = User
        fields = [
            'id', 'email', 'username', 'first_name', 'last_name',
            'phone_number', 'children', 'children_count', 'profile_picture'
        ]
        read_only_fields = ['id']
    
    def get_children_count(self, obj):
        return obj.children.count()


class TeacherSerializer(serializers.ModelSerializer):
    """Serializer specifically for Teacher users"""
    profile = UserProfileSerializer(read_only=True)
    
    class Meta:
        model = User
        fields = [
            'id', 'email', 'username', 'first_name', 'last_name',
            'phone_number', 'teacher_id', 'subject_taught', 'department',
            'profile_picture', 'profile'
        ]
        read_only_fields = ['id']


class MentorSerializer(serializers.ModelSerializer):
    """Serializer specifically for Mentor users"""
    profile = UserProfileSerializer(read_only=True)
    mentees = StudentSerializer(many=True, read_only=True)
    mentees_count = serializers.SerializerMethodField()
    average_rating = serializers.SerializerMethodField()
    
    class Meta:
        model = User
        fields = [
            'id', 'email', 'username', 'first_name', 'last_name',
            'phone_number', 'mentor_id', 'level', 'rating', 'total_ratings',
            'mentees', 'mentees_count', 'average_rating', 'profile_picture', 'profile'
        ]
        read_only_fields = ['id', 'rating', 'total_ratings', 'average_rating']
    
    def get_mentees_count(self, obj):
        return obj.mentees.count()
    
    def get_average_rating(self, obj):
        if obj.total_ratings > 0:
            return float(obj.rating)
        return 0.0


class AdministrationSerializer(serializers.ModelSerializer):
    """Serializer specifically for Administration users"""
    profile = UserProfileSerializer(read_only=True)
    
    class Meta:
        model = User
        fields = [
            'id', 'email', 'username', 'first_name', 'last_name',
            'phone_number', 'admin_id', 'position', 'profile_picture', 'profile'
        ]
        read_only_fields = ['id']


class SuperAdminSerializer(serializers.ModelSerializer):
    """Serializer specifically for Super Admin users"""
    profile = UserProfileSerializer(read_only=True)
    
    class Meta:
        model = User
        fields = [
            'id', 'email', 'username', 'first_name', 'last_name',
            'phone_number', 'profile_picture', 'profile'
        ]
        read_only_fields = ['id']


class UserRegistrationSerializer(serializers.ModelSerializer):
    """Serializer for user registration"""
    password = serializers.CharField(write_only=True, validators=[validate_password])
    password_confirm = serializers.CharField(write_only=True)
    profile = UserProfileSerializer(required=False)
    
    class Meta:
        model = User
        fields = [
            'email', 'username', 'password', 'password_confirm',
            'first_name', 'last_name', 'phone_number', 'role',
            'student_id', 'level', 'class_name', 'parent',
            'teacher_id', 'subject_taught', 'department',
            'mentor_id', 'admin_id', 'position',
            'date_of_birth', 'address', 'profile'
        ]
    
    def validate(self, attrs):
        if attrs['password'] != attrs['password_confirm']:
            raise serializers.ValidationError("Passwords don't match")
        return attrs
    
    def validate_email(self, value):
        if User.objects.filter(email=value).exists():
            raise serializers.ValidationError("A user with this email already exists")
        return value
    
    def create(self, validated_data):
        validated_data.pop('password_confirm')
        profile_data = validated_data.pop('profile', None)
        
        user = User.objects.create_user(**validated_data)
        
        if profile_data:
            UserProfile.objects.create(user=user, **profile_data)
        else:
            UserProfile.objects.create(user=user)
        
        return user


class UserLoginSerializer(serializers.Serializer):
    """Serializer for user login"""
    email = serializers.EmailField()
    password = serializers.CharField()
    
    def validate(self, attrs):
        email = attrs.get('email')
        password = attrs.get('password')
        
        if email and password:
            user = authenticate(username=email, password=password)
            if not user:
                raise serializers.ValidationError('Invalid email or password')
            if not user.is_active:
                raise serializers.ValidationError('User account is disabled')
            attrs['user'] = user
        else:
            raise serializers.ValidationError('Must include email and password')
        
        return attrs


class PasswordChangeSerializer(serializers.Serializer):
    """Serializer for password change"""
    old_password = serializers.CharField(required=True)
    new_password = serializers.CharField(required=True, validators=[validate_password])
    new_password_confirm = serializers.CharField(required=True)
    
    def validate(self, attrs):
        if attrs['new_password'] != attrs['new_password_confirm']:
            raise serializers.ValidationError("New passwords don't match")
        return attrs
    
    def validate_old_password(self, value):
        user = self.context['request'].user
        if not user.check_password(value):
            raise serializers.ValidationError('Old password is incorrect')
        return value


class UserProfileUpdateSerializer(serializers.ModelSerializer):
    """Serializer for updating user profile"""
    profile = UserProfileSerializer()
    
    class Meta:
        model = User
        fields = [
            'first_name', 'last_name', 'phone_number', 'date_of_birth',
            'address', 'profile_picture', 'profile'
        ]
    
    def update(self, instance, validated_data):
        profile_data = validated_data.pop('profile', {})
        
        # Update user fields
        for attr, value in validated_data.items():
            setattr(instance, attr, value)
        instance.save()
        
        # Update profile fields
        if profile_data:
            profile = instance.profile
            for attr, value in profile_data.items():
                setattr(profile, attr, value)
            profile.save()
        
        return instance


class FaceRecognitionSerializer(serializers.ModelSerializer):
    """Serializer for face recognition data"""
    
    class Meta:
        model = User
        fields = ['face_encoding', 'face_image']
    
    def validate_face_encoding(self, value):
        if not value:
            raise serializers.ValidationError("Face encoding is required")
        return value


class UserSessionSerializer(serializers.ModelSerializer):
    """Serializer for user sessions"""
    user_name = serializers.CharField(source='user.get_full_name', read_only=True)
    
    class Meta:
        model = UserSession
        fields = [
            'id', 'session_key', 'device_info', 'ip_address',
            'user_agent', 'is_active', 'created_at', 'last_activity', 'user_name'
        ]
        read_only_fields = ['id', 'created_at', 'last_activity', 'user_name']
