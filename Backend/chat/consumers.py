import json
from channels.generic.websocket import AsyncWebsocketConsumer
from channels.db import database_sync_to_async
from django.contrib.auth import get_user_model
from .models import ChatRoom, Message
from .serializers import MessageSerializer

User = get_user_model()

class ChatConsumer(AsyncWebsocketConsumer):
    async def connect(self):
        self.room_id = self.scope['url_route']['kwargs']['room_id']
        self.room_group_name = f'chat_{self.room_id}'

        # Join room group
        await self.channel_layer.group_add(
            self.room_group_name,
            self.channel_name
        )

        await self.accept()

    async def disconnect(self, close_code):
        # Leave room group
        await self.channel_layer.group_discard(
            self.room_group_name,
            self.channel_name
        )

    # Receive message from WebSocket
    async def receive(self, text_data):
        text_data_json = json.loads(text_data)
        message_type = text_data_json.get('type', 'chat_message')
        
        if message_type == 'chat_message':
            message_content = text_data_json['message']
            user_id = text_data_json['user_id']
            
            # Save message to database
            message = await self.save_message(user_id, message_content)
            
            if message:
                # Send message to room group
                await self.channel_layer.group_send(
                    self.room_group_name,
                    {
                        'type': 'chat_message',
                        'message': message
                    }
                )
        
        elif message_type == 'mark_read':
            message_id = text_data_json['message_id']
            await self.mark_message_read(message_id)
            
            # Notify other users that message was read
            await self.channel_layer.group_send(
                self.room_group_name,
                {
                    'type': 'message_read',
                    'message_id': message_id
                }
            )

    # Receive message from room group
    async def chat_message(self, event):
        message = event['message']

        # Send message to WebSocket
        await self.send(text_data=json.dumps({
            'type': 'chat_message',
            'message': message
        }))

    # Receive message read notification from room group
    async def message_read(self, event):
        message_id = event['message_id']

        # Send read notification to WebSocket
        await self.send(text_data=json.dumps({
            'type': 'message_read',
            'message_id': message_id
        }))

    @database_sync_to_async
    def save_message(self, user_id, content):
        try:
            user = User.objects.get(id=user_id)
            chat_room = ChatRoom.objects.get(id=self.room_id)
            
            message = Message.objects.create(
                chat_room=chat_room,
                sender=user,
                content=content,
                message_type='text'
            )
            
            # Serialize the message for sending
            serializer = MessageSerializer(message)
            return serializer.data
        except Exception as e:
            print(f"Error saving message: {e}")
            return None

    @database_sync_to_async
    def mark_message_read(self, message_id):
        try:
            message = Message.objects.get(id=message_id)
            message.is_read = True
            message.save()
            return True
        except Exception as e:
            print(f"Error marking message as read: {e}")
            return False
