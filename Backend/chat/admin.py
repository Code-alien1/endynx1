from django.contrib import admin
from .models import ChatRoom, Message, MentorAssignment


@admin.register(ChatRoom)
class ChatRoomAdmin(admin.ModelAdmin):
    list_display = ('student', 'mentor', 'created_at', 'is_active', 'last_message_preview')
    list_filter = ('is_active', 'created_at')
    search_fields = ('student__username', 'mentor__username', 'student__email', 'mentor__email')
    readonly_fields = ('created_at', 'updated_at')
    
    def last_message_preview(self, obj):
        last_msg = obj.last_message
        if last_msg:
            return f"{last_msg.sender.username}: {last_msg.content[:30]}..."
        return "No messages"
    last_message_preview.short_description = "Last Message"


@admin.register(Message)
class MessageAdmin(admin.ModelAdmin):
    list_display = ('sender', 'chat_room', 'content_preview', 'timestamp', 'is_read', 'message_type')
    list_filter = ('is_read', 'message_type', 'timestamp')
    search_fields = ('sender__username', 'content', 'chat_room__student__username', 'chat_room__mentor__username')
    readonly_fields = ('timestamp',)
    
    def content_preview(self, obj):
        return obj.content[:50] + "..." if len(obj.content) > 50 else obj.content
    content_preview.short_description = "Content"


@admin.register(MentorAssignment)
class MentorAssignmentAdmin(admin.ModelAdmin):
    list_display = ('student', 'mentor', 'assigned_by', 'assigned_at', 'is_active')
    list_filter = ('is_active', 'assigned_at')
    search_fields = ('student__username', 'mentor__username', 'assigned_by__username')
    readonly_fields = ('assigned_at',)
    
    def save_model(self, request, obj, form, change):
        if not change:  # If creating new assignment
            obj.assigned_by = request.user
        super().save_model(request, obj, form, change)
