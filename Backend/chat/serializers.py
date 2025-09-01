from rest_framework import serializers
from django.contrib.auth.models import User
from .models import ChatRoom, Message, MentorAssignment, MentorRating


class UserSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ['id', 'username', 'first_name', 'last_name', 'email']


class MessageSerializer(serializers.ModelSerializer):
    sender_username = serializers.CharField(source='sender.username', read_only=True)
    sender_id = serializers.CharField(source='sender.id', read_only=True)
    
    class Meta:
        model = Message
        fields = ['id', 'content', 'timestamp', 'is_read', 'message_type', 
                 'sender_username', 'sender_id', 'chat_room']
        read_only_fields = ['id', 'timestamp', 'sender_username', 'sender_id']
    
    def create(self, validated_data):
        request = self.context.get('request')
        if request and hasattr(request, 'user'):
            validated_data['sender'] = request.user
        else:
            raise serializers.ValidationError("Authentication required")
        
        return super().create(validated_data)


class ChatRoomSerializer(serializers.ModelSerializer):
    student_name = serializers.SerializerMethodField()
    mentor_name = serializers.SerializerMethodField()
    student_email = serializers.SerializerMethodField()
    mentor_email = serializers.SerializerMethodField()
    last_message = serializers.SerializerMethodField()
    unread_count = serializers.SerializerMethodField()
    
    class Meta:
        model = ChatRoom
        fields = ['id', 'student_name', 'mentor_name', 'student_email', 'mentor_email', 
                 'created_at', 'updated_at', 'is_active', 'last_message', 'unread_count']
        read_only_fields = ['id', 'created_at', 'updated_at']

    def get_student_name(self, obj):
        return f"{obj.student.first_name} {obj.student.last_name}"
    
    def get_mentor_name(self, obj):
        return f"{obj.mentor.first_name} {obj.mentor.last_name}"
    
    def get_student_email(self, obj):
        return obj.student.email
    
    def get_mentor_email(self, obj):
        return obj.mentor.email

    def get_last_message(self, obj):
        last_message = obj.messages.first()
        if last_message:
            return {
                'id': last_message.id,
                'content': last_message.content,
                'timestamp': last_message.timestamp,
                'sender': {
                    'id': last_message.sender.id,
                    'username': last_message.sender.username,
                    'first_name': last_message.sender.first_name,
                    'last_name': last_message.sender.last_name,
                }
            }
        return None

    def get_unread_count(self, obj):
        user = self.context['request'].user
        return obj.messages.filter(is_read=False).exclude(sender=user).count()


class MentorAssignmentSerializer(serializers.ModelSerializer):
    student_id = serializers.SerializerMethodField()
    mentor_id = serializers.SerializerMethodField()
    student_name = serializers.SerializerMethodField()
    mentor_name = serializers.SerializerMethodField()
    student_email = serializers.SerializerMethodField()
    mentor_email = serializers.SerializerMethodField()
    assigned_by_name = serializers.SerializerMethodField()
    
    class Meta:
        model = MentorAssignment
        fields = ['id', 'student_name', 'mentor_name', 'student_email', 'mentor_email', 
                 'assigned_by_name', 'assigned_at', 'is_active', 'notes', 'student_id', 'mentor_id']
        read_only_fields = ['id', 'assigned_at']
    
    def get_student_name(self, obj):
        return f"{obj.student.first_name} {obj.student.last_name}"
    
    def get_mentor_name(self, obj):
        return f"{obj.mentor.first_name} {obj.mentor.last_name}"
    
    def get_student_email(self, obj):
        return obj.student.email
    
    def get_mentor_email(self, obj):
        return obj.mentor.email
    
    def get_assigned_by_name(self, obj):
        if obj.assigned_by:
            return f"{obj.assigned_by.first_name} {obj.assigned_by.last_name}"
        return None
    
    def get_student_id(self, obj):
        return str(obj.student.id)
    
    def get_mentor_id(self, obj):
        return str(obj.mentor.id)

    def create(self, validated_data):
        validated_data['assigned_by'] = self.context['request'].user
        return super().create(validated_data)

    def validate(self, data):
        print(f"DEBUG: Validating assignment data: {data}")
        
        student_id = data.get('student_id')
        mentor_id = data.get('mentor_id')
        
        print(f"DEBUG: student_id={student_id}, mentor_id={mentor_id}")
        
        if not student_id or not mentor_id:
            raise serializers.ValidationError("Both student_id and mentor_id are required.")
        
        if student_id == mentor_id:
            raise serializers.ValidationError("Student and mentor cannot be the same person.")
        
        from django.contrib.auth import get_user_model
        User = get_user_model()
        
        try:
            student_obj = User.objects.get(id=student_id)
            print(f"DEBUG: Found student: {student_obj.email} (role: {student_obj.role})")
            if student_obj.role != 'student':
                raise serializers.ValidationError("Selected user is not a student.")
        except User.DoesNotExist:
            print(f"DEBUG: Student with ID {student_id} not found")
            raise serializers.ValidationError("Student not found.")
        
        try:
            mentor_obj = User.objects.get(id=mentor_id)
            print(f"DEBUG: Found mentor: {mentor_obj.email} (role: {mentor_obj.role})")
            if mentor_obj.role != 'mentor':
                raise serializers.ValidationError("Selected user is not a mentor.")
        except User.DoesNotExist:
            print(f"DEBUG: Mentor with ID {mentor_id} not found")
            raise serializers.ValidationError("Mentor not found.")
        
        # Check if student already has an active mentor assignment
        if self.instance is None:  # Creating new assignment
            existing = MentorAssignment.objects.filter(
                student_id=student_id,
                is_active=True
            ).exists()
            if existing:
                raise serializers.ValidationError("Student already has an active mentor assignment.")
        
        return data


class MentorRatingSerializer(serializers.ModelSerializer):
    mentor_name = serializers.SerializerMethodField()
    student_name = serializers.SerializerMethodField()
    mentor_id = serializers.UUIDField(write_only=True)
    student_id = serializers.UUIDField(write_only=True)
    
    class Meta:
        model = MentorRating
        fields = ['id', 'mentor_name', 'student_name', 'rating', 'comment', 
                 'timestamp', 'reviewed_by_admin', 'admin_notes', 'mentor_id', 'student_id']
        read_only_fields = ['id', 'timestamp']
    
    def get_mentor_name(self, obj):
        return f"{obj.mentor.first_name} {obj.mentor.last_name}"
    
    def get_student_name(self, obj):
        return f"{obj.student.first_name} {obj.student.last_name}"
    
    def create(self, validated_data):
        from django.contrib.auth import get_user_model
        User = get_user_model()
        
        mentor_id = validated_data.pop('mentor_id')
        student_id = validated_data.pop('student_id')
        
        validated_data['mentor'] = User.objects.get(id=mentor_id)
        validated_data['student'] = User.objects.get(id=student_id)
        
        return super().create(validated_data)
