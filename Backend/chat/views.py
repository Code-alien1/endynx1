from rest_framework import viewsets, status, permissions
from rest_framework.decorators import action
from rest_framework.response import Response
from django.contrib.auth.models import User
from django.db.models import Q, Prefetch
from django.shortcuts import get_object_or_404
from .models import ChatRoom, Message, MentorAssignment
from .serializers import ChatRoomSerializer, MessageSerializer, MentorAssignmentSerializer


class ChatRoomViewSet(viewsets.ModelViewSet):
    serializer_class = ChatRoomSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        user = self.request.user
        return ChatRoom.objects.filter(
            Q(student=user) | Q(mentor=user),
            is_active=True
        ).prefetch_related(
            Prefetch('messages', queryset=Message.objects.order_by('-timestamp')[:1])
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
    serializer_class = MessageSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        user = self.request.user
        return Message.objects.filter(
            Q(chat_room__student=user) | Q(chat_room__mentor=user)
        ).select_related('sender', 'chat_room')

    def perform_create(self, serializer):
        # Get chat room from request data
        chat_room_id = self.request.data.get('chat_room_id')
        chat_room = get_object_or_404(ChatRoom, id=chat_room_id)
        
        # Verify user has access to this chat room
        if self.request.user not in [chat_room.student, chat_room.mentor]:
            return Response(
                {'error': 'You do not have access to this chat room'}, 
                status=status.HTTP_403_FORBIDDEN
            )
        
        serializer.save(
            chat_room=chat_room,
            sender=self.request.user
        )


class MentorAssignmentViewSet(viewsets.ModelViewSet):
    serializer_class = MentorAssignmentSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        user = self.request.user
        
        # Admin users can see all assignments
        if user.is_staff or hasattr(user, 'profile') and user.profile.role == 'administration':
            return MentorAssignment.objects.all().select_related(
                'student', 'mentor', 'assigned_by'
            )
        
        # Mentors can see their assignments
        elif hasattr(user, 'profile') and user.profile.role == 'mentor':
            return MentorAssignment.objects.filter(
                mentor=user, is_active=True
            ).select_related('student', 'mentor', 'assigned_by')
        
        # Students can see their assignment
        elif hasattr(user, 'profile') and user.profile.role == 'student':
            return MentorAssignment.objects.filter(
                student=user, is_active=True
            ).select_related('student', 'mentor', 'assigned_by')
        
        return MentorAssignment.objects.none()

    @action(detail=False, methods=['get'])
    def my_mentor(self, request):
        """Get the current user's mentor assignment (for students)"""
        if not (hasattr(request.user, 'profile') and request.user.profile.role == 'student'):
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
        if not (hasattr(request.user, 'profile') and request.user.profile.role == 'mentor'):
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
