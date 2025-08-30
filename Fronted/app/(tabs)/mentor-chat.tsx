import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TextInput,
  TouchableOpacity,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useAuth } from '../../contexts/AuthContext';
import { theme } from '../../constants/theme';
import { apiService } from '../../services/api';

interface Message {
  id: string;
  content: string;
  timestamp: string;
  is_read: boolean;
  message_type: 'text' | 'image' | 'file';
  attachment?: string;
  sender: {
    id: number;
    username: string;
    first_name: string;
    last_name: string;
  };
}

interface ChatRoom {
  id: string;
  student: {
    id: number;
    username: string;
    first_name: string;
    last_name: string;
  };
  mentor: {
    id: number;
    username: string;
    first_name: string;
    last_name: string;
  };
  created_at: string;
  updated_at: string;
  is_active: boolean;
  last_message?: Message;
  unread_count: number;
}

export default function MentorChatScreen() {
  const { user } = useAuth();
  const [chatRooms, setChatRooms] = useState<ChatRoom[]>([]);
  const [selectedChatRoom, setSelectedChatRoom] = useState<ChatRoom | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const flatListRef = useRef<FlatList>(null);

  useEffect(() => {
    loadChatRooms();
  }, []);

  useEffect(() => {
    if (selectedChatRoom) {
      loadMessages();
      // Set up polling for new messages
      const interval = setInterval(loadMessages, 3000);
      return () => clearInterval(interval);
    }
  }, [selectedChatRoom]);

  const loadChatRooms = async () => {
    try {
      setLoading(true);
      const response = await apiService.get('/api/chat/chat-rooms/');
      
      if (response.data && response.data.results) {
        setChatRooms(response.data.results);
        if (response.data.results.length > 0 && !selectedChatRoom) {
          setSelectedChatRoom(response.data.results[0]);
        }
      }
    } catch (error) {
      console.error('Error loading chat rooms:', error);
      Alert.alert('Error', 'Failed to load chats. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const loadMessages = async () => {
    if (!selectedChatRoom) return;

    try {
      const response = await apiService.get(`/api/chat/chat-rooms/${selectedChatRoom.id}/messages/`);
      
      if (response.data) {
        const messagesData = response.data.results || response.data;
        setMessages(messagesData.reverse());
        
        // Mark messages as read
        await markMessagesAsRead();
      }
    } catch (error) {
      console.error('Error loading messages:', error);
    }
  };

  const markMessagesAsRead = async () => {
    if (!selectedChatRoom) return;

    try {
      await apiService.post(`/api/chat/chat-rooms/${selectedChatRoom.id}/mark_messages_read/`);
    } catch (error) {
      console.error('Error marking messages as read:', error);
    }
  };

  const sendMessage = async () => {
    if (!newMessage.trim() || !selectedChatRoom || sending) return;

    setSending(true);
    try {
      const response = await apiService.post(`/api/chat/chat-rooms/${selectedChatRoom.id}/send_message/`, {
        content: newMessage.trim(),
        message_type: 'text'
      });

      if (response.data) {
        setMessages(prev => [...prev, response.data]);
        setNewMessage('');
        
        setTimeout(() => {
          flatListRef.current?.scrollToEnd({ animated: true });
        }, 100);
      }
    } catch (error) {
      console.error('Error sending message:', error);
      Alert.alert('Error', 'Failed to send message. Please try again.');
    } finally {
      setSending(false);
    }
  };

  const formatTime = (timestamp: string) => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const formatDate = (timestamp: string) => {
    const date = new Date(timestamp);
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    if (date.toDateString() === today.toDateString()) {
      return 'Today';
    } else if (date.toDateString() === yesterday.toDateString()) {
      return 'Yesterday';
    } else {
      return date.toLocaleDateString();
    }
  };

  const renderChatRoomItem = ({ item }: { item: ChatRoom }) => {
    const studentName = `${item.student.first_name} ${item.student.last_name}`.trim() || item.student.username;
    const isSelected = selectedChatRoom?.id === item.id;

    return (
      <TouchableOpacity
        style={[styles.chatRoomItem, isSelected && styles.selectedChatRoom]}
        onPress={() => setSelectedChatRoom(item)}
      >
        <View style={styles.studentAvatar}>
          <MaterialCommunityIcons name="account" size={24} color={theme.colors.primary} />
        </View>
        <View style={styles.chatRoomInfo}>
          <Text style={styles.studentName}>{studentName}</Text>
          {item.last_message && (
            <Text style={styles.lastMessage} numberOfLines={1}>
              {item.last_message.content}
            </Text>
          )}
        </View>
        {item.unread_count > 0 && (
          <View style={styles.unreadBadge}>
            <Text style={styles.unreadCount}>{item.unread_count}</Text>
          </View>
        )}
      </TouchableOpacity>
    );
  };

  const renderMessage = ({ item, index }: { item: Message; index: number }) => {
    const isMyMessage = item.sender.id === Number(user?.id);
    const showDate = index === 0 || 
      formatDate(item.timestamp) !== formatDate(messages[index - 1]?.timestamp);

    return (
      <View>
        {showDate && (
          <View style={styles.dateSeparator}>
            <Text style={styles.dateText}>{formatDate(item.timestamp)}</Text>
          </View>
        )}
        <View style={[
          styles.messageContainer,
          isMyMessage ? styles.myMessage : styles.theirMessage
        ]}>
          <View style={[
            styles.messageBubble,
            isMyMessage ? styles.myMessageBubble : styles.theirMessageBubble
          ]}>
            <Text style={[
              styles.messageText,
              isMyMessage ? styles.myMessageText : styles.theirMessageText
            ]}>
              {item.content}
            </Text>
            <Text style={[
              styles.messageTime,
              isMyMessage ? styles.myMessageTime : styles.theirMessageTime
            ]}>
              {formatTime(item.timestamp)}
            </Text>
          </View>
        </View>
      </View>
    );
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <MaterialCommunityIcons name="loading" size={40} color={theme.colors.primary} />
        <Text style={styles.loadingText}>Loading chats...</Text>
      </View>
    );
  }

  if (chatRooms.length === 0) {
    return (
      <View style={styles.noChatsContainer}>
        <MaterialCommunityIcons name="chat-outline" size={80} color={theme.colors.muted} />
        <Text style={styles.noChatsTitle}>No Student Chats</Text>
        <Text style={styles.noChatsText}>
          You don't have any students assigned yet. Contact your administrator to get students assigned.
        </Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Chat Rooms List */}
      <View style={styles.chatRoomsContainer}>
        <Text style={styles.sectionTitle}>Your Students</Text>
        <FlatList
          data={chatRooms}
          keyExtractor={(item) => item.id}
          renderItem={renderChatRoomItem}
          style={styles.chatRoomsList}
        />
      </View>

      {/* Chat Messages */}
      {selectedChatRoom && (
        <KeyboardAvoidingView 
          style={styles.chatContainer}
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        >
          {/* Chat Header */}
          <View style={styles.chatHeader}>
            <Text style={styles.chatTitle}>
              {`${selectedChatRoom.student.first_name} ${selectedChatRoom.student.last_name}`.trim() || selectedChatRoom.student.username}
            </Text>
          </View>

          {/* Messages */}
          <FlatList
            ref={flatListRef}
            data={messages}
            keyExtractor={(item) => item.id}
            renderItem={renderMessage}
            style={styles.messagesList}
            contentContainerStyle={styles.messagesContent}
            onContentSizeChange={() => flatListRef.current?.scrollToEnd({ animated: true })}
          />

          {/* Input */}
          <View style={styles.inputContainer}>
            <TextInput
              style={styles.textInput}
              placeholder="Type a message..."
              placeholderTextColor={theme.colors.textSecondary}
              value={newMessage}
              onChangeText={setNewMessage}
              multiline
              maxLength={1000}
            />
            <TouchableOpacity
              style={[styles.sendButton, (!newMessage.trim() || sending) && styles.sendButtonDisabled]}
              onPress={sendMessage}
              disabled={!newMessage.trim() || sending}
            >
              <MaterialCommunityIcons 
                name={sending ? "loading" : "send"} 
                size={24} 
                color={(!newMessage.trim() || sending) ? theme.colors.muted : theme.colors.primary}
              />
            </TouchableOpacity>
          </View>
        </KeyboardAvoidingView>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    flexDirection: 'row',
    backgroundColor: theme.colors.background,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: theme.colors.background,
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: theme.colors.text,
  },
  noChatsContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: theme.colors.background,
    padding: 40,
  },
  noChatsTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: theme.colors.text,
    marginTop: 20,
    marginBottom: 10,
  },
  noChatsText: {
    fontSize: 16,
    color: theme.colors.textSecondary,
    textAlign: 'center',
    lineHeight: 24,
  },
  chatRoomsContainer: {
    width: '40%',
    backgroundColor: theme.colors.card,
    borderRightWidth: 1,
    borderRightColor: theme.colors["card-border"],
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: theme.colors.text,
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors["card-border"],
  },
  chatRoomsList: {
    flex: 1,
  },
  chatRoomItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors["card-border"],
  },
  selectedChatRoom: {
    backgroundColor: theme.colors.primary + '20',
  },
  studentAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: theme.colors.background,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  chatRoomInfo: {
    flex: 1,
  },
  studentName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: theme.colors.text,
  },
  lastMessage: {
    fontSize: 14,
    color: theme.colors.textSecondary,
    marginTop: 2,
  },
  unreadBadge: {
    backgroundColor: theme.colors.primary,
    borderRadius: 10,
    minWidth: 20,
    height: 20,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 6,
  },
  unreadCount: {
    color: 'white',
    fontSize: 12,
    fontWeight: 'bold',
  },
  chatContainer: {
    flex: 1,
  },
  chatHeader: {
    backgroundColor: theme.colors.card,
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors["card-border"],
  },
  chatTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: theme.colors.text,
  },
  messagesList: {
    flex: 1,
  },
  messagesContent: {
    padding: 16,
  },
  dateSeparator: {
    alignItems: 'center',
    marginVertical: 16,
  },
  dateText: {
    fontSize: 12,
    color: theme.colors.textSecondary,
    backgroundColor: theme.colors.muted,
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  messageContainer: {
    marginVertical: 2,
  },
  myMessage: {
    alignItems: 'flex-end',
  },
  theirMessage: {
    alignItems: 'flex-start',
  },
  messageBubble: {
    maxWidth: '80%',
    padding: 12,
    borderRadius: 18,
  },
  myMessageBubble: {
    backgroundColor: theme.colors.primary,
    borderBottomRightRadius: 4,
  },
  theirMessageBubble: {
    backgroundColor: theme.colors.card,
    borderBottomLeftRadius: 4,
  },
  messageText: {
    fontSize: 16,
    lineHeight: 20,
  },
  myMessageText: {
    color: 'white',
  },
  theirMessageText: {
    color: theme.colors.text,
  },
  messageTime: {
    fontSize: 12,
    marginTop: 4,
  },
  myMessageTime: {
    color: 'rgba(255, 255, 255, 0.7)',
    textAlign: 'right',
  },
  theirMessageTime: {
    color: theme.colors.textSecondary,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    padding: 16,
    backgroundColor: theme.colors.card,
    borderTopWidth: 1,
    borderTopColor: theme.colors["card-border"],
  },
  textInput: {
    flex: 1,
    borderWidth: 1,
    borderColor: theme.colors["card-border"],
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    color: theme.colors.text,
    backgroundColor: theme.colors.background,
    maxHeight: 100,
  },
  sendButton: {
    marginLeft: 12,
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: theme.colors.background,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: theme.colors.primary,
  },
  sendButtonDisabled: {
    borderColor: theme.colors.muted,
  },
});
