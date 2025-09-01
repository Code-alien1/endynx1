from rest_framework import viewsets, status, permissions
from rest_framework.decorators import action
from rest_framework.response import Response
from django.contrib.auth.models import User
from django.db.models import Q, Prefetch
from django.shortcuts import get_object_or_404
from .models import ChatRoom, Message, MentorAssignment, MentorRating
from .serializers import ChatRoomSerializer, MessageSerializer, MentorAssignmentSerializer, MentorRatingSerializer


class ChatRoomViewSet(viewsets.ModelViewSet):
    serializer_class = ChatRoomSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        user = self.request.user
        return ChatRoom.objects.filter(
            Q(student=user) | Q(mentor=user),
            is_active=True
        ).select_related('student', 'mentor')

    @action(detail=True, methods=['get'])
    def messages(self, request, pk=None):
        """Get messages for a specific chat room"""
        chat_room = self.get_object()
        
        # Verify user has access to this chat room
        if request.user not in [chat_room.student, chat_room.mentor]:
            return Response(
                {'error': 'You do not have access to this chat room'}, 
                status=status.HTTP_403_FORBIDDEN
            )
        
        messages = chat_room.messages.all()
        page = self.paginate_queryset(messages)
        if page is not None:
            serializer = MessageSerializer(page, many=True)
            return self.get_paginated_response(serializer.data)
        
        serializer = MessageSerializer(messages, many=True)
        return Response(serializer.data)

    @action(detail=True, methods=['post'])
    def send_message(self, request, pk=None):
        """Send a message in a chat room"""
        chat_room = self.get_object()
        
        # Verify user has access to this chat room
        if request.user not in [chat_room.student, chat_room.mentor]:
            return Response(
                {'error': 'You do not have access to this chat room'}, 
                status=status.HTTP_403_FORBIDDEN
            )
        
        serializer = MessageSerializer(
            data=request.data, 
            context={'request': request}
        )
        if serializer.is_valid():
            message = serializer.save(
                chat_room=chat_room,
                sender=request.user
            )
            
            # Update chat room's updated_at timestamp
            chat_room.save()
            
            return Response(
                MessageSerializer(message).data, 
                status=status.HTTP_201_CREATED
            )
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    @action(detail=True, methods=['post'])
    def mark_messages_read(self, request, pk=None):
        """Mark all messages in chat room as read for current user"""
        chat_room = self.get_object()
        
        # Verify user has access to this chat room
        if request.user not in [chat_room.student, chat_room.mentor]:
            return Response(
                {'error': 'You do not have access to this chat room'}, 
                status=status.HTTP_403_FORBIDDEN
            )
        
        # Mark all unread messages from other user as read
        unread_messages = chat_room.messages.filter(
            is_read=False
        ).exclude(sender=request.user)
        
        count = unread_messages.update(is_read=True)
        
        return Response({
            'message': f'Marked {count} messages as read'
        })


class MessageViewSet(viewsets.ModelViewSet):
    queryset = Message.objects.all()
    serializer_class = MessageSerializer
    permission_classes = [permissions.IsAuthenticated]
    
    def create(self, request, *args, **kwargs):
        import logging
        logger = logging.getLogger(__name__)
        
        logger.error(f"MessageViewSet.create called - User: {request.user.email}")
        logger.error(f"Request data: {request.data}")
        logger.error(f"Request method: {request.method}")
        logger.error(f"Content type: {request.content_type}")
        
        return super().create(request, *args, **kwargs)

    def get_queryset(self):
        user = self.request.user
        return Message.objects.filter(
            Q(chat_room__student=user) | Q(chat_room__mentor=user)
        ).select_related('sender', 'chat_room')

    def perform_create(self, serializer):
        import logging
        logger = logging.getLogger(__name__)
        
        logger.error(f"Message creation attempt - User: {self.request.user.email} ({self.request.user.role})")
        logger.error(f"Request data: {self.request.data}")
        
        chat_room_id = self.request.data.get('chat_room')
        logger.error(f"Chat room ID: {chat_room_id}, Type: {type(chat_room_id)}")
        
        try:
            chat_room = get_object_or_404(ChatRoom, id=chat_room_id)
            logger.error(f"Found chat room: {chat_room.id}, Student: {chat_room.student.email}, Mentor: {chat_room.mentor.email}")
        except Exception as e:
            logger.error(f"Error finding chat room: {e}")
            raise
            
        if self.request.user not in [chat_room.student, chat_room.mentor]:
            logger.error(f"Access denied - User {self.request.user.email} not in chat room")
            raise serializers.ValidationError('You do not have access to this chat room')
            
        try:
            serializer.save(chat_room=chat_room, sender=self.request.user)
            logger.error(f"Message saved successfully")
        except Exception as e:
            logger.error(f"Error saving message: {e}")
            raise


class MentorAssignmentViewSet(viewsets.ModelViewSet):
    serializer_class = MentorAssignmentSerializer
    permission_classes = [permissions.IsAuthenticated]

    def create(self, request, *args, **kwargs):
        print(f"DEBUG: Creating mentor assignment with data: {request.data}")
        print(f"DEBUG: User: {request.user.email} (role: {request.user.role})")
        
        # Check if user has permission to create assignments
        if request.user.role != 'administration' and not request.user.is_staff:
            return Response(
                {'error': 'Only administrators can create mentor assignments'}, 
                status=status.HTTP_403_FORBIDDEN
            )
        
        return super().create(request, *args, **kwargs)

    def get_queryset(self):
        user = self.request.user
        
        # Admin users can see all assignments
        if user.is_staff or user.role == 'administration':
            return MentorAssignment.objects.all().select_related(
                'student', 'mentor', 'assigned_by'
            )
        
        # Mentors can see their assignments
        elif user.role == 'mentor':
            return MentorAssignment.objects.filter(
                mentor=user, is_active=True
            ).select_related('student', 'mentor', 'assigned_by')
        
        # Students can see their assignment
        elif user.role == 'student':
            return MentorAssignment.objects.filter(
                student=user, is_active=True
            ).select_related('student', 'mentor', 'assigned_by')
        
        return MentorAssignment.objects.none()

    @action(detail=False, methods=['get'])
    def my_mentor(self, request):
        """Get the current user's mentor assignment (for students)"""
        if not request.user.role == 'student':
            return Response(
                {'error': 'Only students can access this endpoint'}, 
                status=status.HTTP_403_FORBIDDEN
            )
        
        try:
            assignment = MentorAssignment.objects.get(
                student=request.user, 
                is_active=True
            )
            serializer = self.get_serializer(assignment)
            return Response(serializer.data)
        except MentorAssignment.DoesNotExist:
            return Response(
                {'message': 'No mentor assigned'}, 
                status=status.HTTP_404_NOT_FOUND
            )

    @action(detail=False, methods=['get'])
    def my_students(self, request):
        """Get the current user's assigned students (for mentors)"""
        if not request.user.role == 'mentor':
            return Response(
                {'error': 'Only mentors can access this endpoint'}, 
                status=status.HTTP_403_FORBIDDEN
            )
        
        assignments = MentorAssignment.objects.filter(
            mentor=request.user, 
            is_active=True
        ).select_related('student')
        
        serializer = self.get_serializer(assignments, many=True)
        return Response(serializer.data)


class MentorRatingViewSet(viewsets.ModelViewSet):
    serializer_class = MentorRatingSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        user = self.request.user
        
        # Admin users can see all ratings
        if user.is_staff or user.role == 'administration':
            return MentorRating.objects.all().select_related('mentor', 'student')
        
        # Mentors can see their own ratings
        elif user.role == 'mentor':
            return MentorRating.objects.filter(mentor=user).select_related('student')
        
        # Students can see their own given ratings
        elif user.role == 'student':
            return MentorRating.objects.filter(student=user).select_related('mentor')
        
        return MentorRating.objects.none()

    def create(self, request, *args, **kwargs):
        # Only students can create ratings
        if request.user.role != 'student':
            return Response(
                {'error': 'Only students can rate mentors'}, 
                status=status.HTTP_403_FORBIDDEN
            )
        
        return super().create(request, *args, **kwargs)
