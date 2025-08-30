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
  Image,
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

export default function ChatScreen() {
  const { user } = useAuth();
  const [chatRoom, setChatRoom] = useState<ChatRoom | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const flatListRef = useRef<FlatList>(null);

  useEffect(() => {
    loadChatRoom();
  }, []);

  useEffect(() => {
    if (chatRoom) {
      loadMessages();
      // Set up polling for new messages
      const interval = setInterval(loadMessages, 3000);
      return () => clearInterval(interval);
    }
  }, [chatRoom]);

  const loadChatRoom = async () => {
    try {
      setLoading(true);
      const response = await apiService.get('/api/chat/chat-rooms/');
      
      if (response.data && response.data.results && response.data.results.length > 0) {
        setChatRoom(response.data.results[0]);
      } else {
        // No chat room found - student doesn't have a mentor assigned
        setChatRoom(null);
      }
    } catch (error) {
      console.error('Error loading chat room:', error);
      Alert.alert('Error', 'Failed to load chat. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const loadMessages = async () => {
    if (!chatRoom) return;

    try {
      const response = await apiService.get(`/api/chat/chat-rooms/${chatRoom.id}/messages/`);
      
      if (response.data) {
        const messagesData = response.data.results || response.data;
        setMessages(messagesData.reverse()); // Reverse to show newest at bottom
        
        // Mark messages as read
        await markMessagesAsRead();
      }
    } catch (error) {
      console.error('Error loading messages:', error);
    }
  };

  const markMessagesAsRead = async () => {
    if (!chatRoom) return;

    try {
      await apiService.post(`/api/chat/chat-rooms/${chatRoom.id}/mark_messages_read/`);
    } catch (error) {
      console.error('Error marking messages as read:', error);
    }
  };

  const sendMessage = async () => {
    if (!newMessage.trim() || !chatRoom || sending) return;

    setSending(true);
    try {
      const response = await apiService.post(`/api/chat/chat-rooms/${chatRoom.id}/send_message/`, {
        content: newMessage.trim(),
        message_type: 'text'
      });

      if (response.data) {
        setMessages(prev => [...prev, response.data]);
        setNewMessage('');
        
        // Scroll to bottom
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
        <Text style={styles.loadingText}>Loading chat...</Text>
      </View>
    );
  }

  if (!chatRoom) {
    return (
      <View style={styles.noMentorContainer}>
        <MaterialCommunityIcons name="account-question" size={80} color={theme.colors.muted} />
        <Text style={styles.noMentorTitle}>No Mentor Assigned</Text>
        <Text style={styles.noMentorText}>
          You don't have a mentor assigned yet. Please contact your administrator to get a mentor assigned.
        </Text>
      </View>
    );
  }

  const mentorName = `${chatRoom.mentor.first_name} ${chatRoom.mentor.last_name}`.trim() || chatRoom.mentor.username;

  return (
    <KeyboardAvoidingView 
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.mentorInfo}>
          <View style={styles.mentorAvatar}>
            <MaterialCommunityIcons name="account" size={24} color={theme.colors.primary} />
          </View>
          <View>
            <Text style={styles.mentorName}>{mentorName}</Text>
            <Text style={styles.mentorRole}>Your Mentor</Text>
          </View>
        </View>
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
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
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
  noMentorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: theme.colors.background,
    padding: 40,
  },
  noMentorTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: theme.colors.text,
    marginTop: 20,
    marginBottom: 10,
  },
  noMentorText: {
    fontSize: 16,
    color: theme.colors.textSecondary,
    textAlign: 'center',
    lineHeight: 24,
  },
  header: {
    backgroundColor: theme.colors.card,
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors["card-border"],
  },
  mentorInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  mentorAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: theme.colors.background,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  mentorName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: theme.colors.text,
  },
  mentorRole: {
    fontSize: 14,
    color: theme.colors.textSecondary,
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
