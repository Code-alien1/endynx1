from rest_framework import serializers
from django.contrib.auth.models import User
from .models import ChatRoom, Message, MentorAssignment


class UserSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ['id', 'username', 'first_name', 'last_name', 'email']


class MessageSerializer(serializers.ModelSerializer):
    sender = UserSerializer(read_only=True)
    sender_id = serializers.IntegerField(write_only=True)
    
    class Meta:
        model = Message
        fields = ['id', 'content', 'timestamp', 'is_read', 'message_type', 
                 'attachment', 'sender', 'sender_id']
        read_only_fields = ['id', 'timestamp']

    def create(self, validated_data):
        validated_data['sender_id'] = self.context['request'].user.id
        return super().create(validated_data)


class ChatRoomSerializer(serializers.ModelSerializer):
    student = UserSerializer(read_only=True)
    mentor = UserSerializer(read_only=True)
    last_message = MessageSerializer(read_only=True)
    unread_count = serializers.SerializerMethodField()
    
    class Meta:
        model = ChatRoom
        fields = ['id', 'student', 'mentor', 'created_at', 'updated_at', 
                 'is_active', 'last_message', 'unread_count']
        read_only_fields = ['id', 'created_at', 'updated_at']

    def get_unread_count(self, obj):
        user = self.context['request'].user
        return obj.messages.filter(is_read=False).exclude(sender=user).count()


class MentorAssignmentSerializer(serializers.ModelSerializer):
    student = UserSerializer(read_only=True)
    mentor = UserSerializer(read_only=True)
    assigned_by = UserSerializer(read_only=True)
    student_id = serializers.IntegerField(write_only=True)
    mentor_id = serializers.IntegerField(write_only=True)
    
    class Meta:
        model = MentorAssignment
        fields = ['id', 'student', 'mentor', 'assigned_by', 'assigned_at', 
                 'is_active', 'notes', 'student_id', 'mentor_id']
        read_only_fields = ['id', 'assigned_at', 'assigned_by']

    def create(self, validated_data):
        validated_data['assigned_by'] = self.context['request'].user
        return super().create(validated_data)

    def validate(self, data):
        # Ensure student and mentor are different users
        if data.get('student_id') == data.get('mentor_id'):
            raise serializers.ValidationError("Student and mentor cannot be the same person.")
        
        # Check if student already has an active mentor assignment
        if self.instance is None:  # Creating new assignment
            existing = MentorAssignment.objects.filter(
                student_id=data.get('student_id'),
                is_active=True
            ).exists()
            if existing:
                raise serializers.ValidationError("Student already has an active mentor assignment.")
        
        return data
