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
  SafeAreaView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { theme } from '../../constants/theme';
import apiService from '../../services/api';

interface Message {
  id: string;
  content: string;
  timestamp: string;
  is_read: boolean;
  message_type: 'text' | 'image' | 'file';
  attachment?: string;
  sender_id: string;
  sender_username: string;
}

interface ChatRoom {
  id: string;
  student_name: string;
  mentor_name: string;
  student_email: string;
  mentor_email: string;
  created_at: string;
  updated_at: string;
  is_active: boolean;
  last_message?: Message;
}

export default function ChatScreen() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [chatRoom, setChatRoom] = useState<ChatRoom | null>(null);
  const [loading, setLoading] = useState(true);
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [isLoadingMessages, setIsLoadingMessages] = useState(false);
  const flatListRef = useRef<FlatList>(null);
  const router = useRouter();
  const intervalRef = useRef<any>(null);

  useEffect(() => {
    loadCurrentUser();
    loadStudentChatRoom();
  }, []);

  useEffect(() => {
    if (chatRoom) {
      loadMessages(chatRoom.id);
      
      // Clear any existing interval first
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
      
      // Set up single polling interval with longer delay
      intervalRef.current = setInterval(() => {
        if (!isLoadingMessages) {
          loadMessages(chatRoom.id);
        }
      }, 2000); // Poll every 2 seconds for faster message updates

      return () => {
        if (intervalRef.current) {
          clearInterval(intervalRef.current);
          intervalRef.current = null;
        }
      };
    }
    
    // Cleanup on unmount
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, [chatRoom]);

  const loadCurrentUser = async () => {
    try {
      const user = await apiService.getCurrentUser();
      setCurrentUser(user);
    } catch (error) {
      console.error('Error loading current user:', error);
    }
  };

  const loadMessages = async (roomId: string) => {
    if (isLoadingMessages) return; // Prevent multiple simultaneous requests
    
    try {
      setIsLoadingMessages(true);
      const response = await apiService.get(`/chat/messages/?chat_room=${roomId}`);
      const messagesList = response.data.results || response.data;
      
      // Sort messages by timestamp to ensure proper order
      const sortedMessages = messagesList.sort((a: Message, b: Message) => 
        new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
      );
      
      setMessages(sortedMessages);
      
      // Mark messages as read
      const unreadMessages = sortedMessages.filter((msg: Message) => 
        !msg.is_read && msg.sender_id !== currentUser?.id
      );
      
      if (unreadMessages.length > 0) {
        await Promise.all(
          unreadMessages.map((msg: Message) =>
            apiService.patch(`/chat/messages/${msg.id}/`, { is_read: true })
          )
        );
      }
      
      // Auto-scroll to bottom
      setTimeout(() => {
        flatListRef.current?.scrollToEnd({ animated: true });
      }, 100);
    } catch (error) {
      console.error('Error loading messages:', error);
    } finally {
      setIsLoadingMessages(false);
    }
  };

  const loadStudentChatRoom = async () => {
    try {
      const response = await apiService.get('/chat/chat-rooms/');
      const rooms = response.data.results || response.data;
      
      // Student should only have one chat room with their assigned mentor
      if (rooms.length > 0) {
        const room = rooms[0];
        setChatRoom(room);
        loadMessages(room.id);
      }
      setLoading(false);
    } catch (error) {
      console.error('Error loading chat room:', error);
      setLoading(false);
    }
  };

  const sendMessage = async () => {
    if (!newMessage.trim() || !chatRoom) return;

    try {
      const messageData = {
        chat_room: chatRoom.id,
        content: newMessage.trim(),
        message_type: 'text',
      };

      const response = await apiService.post('/chat/messages/', messageData);
      
      // Add the new message to the current messages list immediately
      const newMsg = response.data;
      setMessages(prevMessages => [...prevMessages, newMsg]);
      
      setNewMessage('');
      
      // Auto-scroll to bottom after sending message
      setTimeout(() => {
        flatListRef.current?.scrollToEnd({ animated: true });
      }, 100);
      
      // Don't reload messages immediately - let the interval handle it
    } catch (error) {
      console.error('Error sending message:', error);
      Alert.alert('Error', 'Failed to send message');
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
    const isMyMessage = item.sender_id === currentUser?.id;
    const showDate = index === 0 || 
      formatDate(item.timestamp) !== formatDate(messages[index - 1]?.timestamp);

    return (
      <View>
        {showDate && (
          <View style={styles.dateContainer}>
            <Text style={styles.dateText}>{formatDate(item.timestamp)}</Text>
          </View>
        )}
        
        <View style={[
          styles.messageContainer,
          isMyMessage ? styles.myMessageContainer : styles.otherMessageContainer
        ]}>
          <View style={[
            styles.messageBubble,
            isMyMessage ? styles.myMessage : styles.otherMessage
          ]}>
            <Text style={[
              styles.messageText,
              isMyMessage ? styles.myMessageText : styles.otherMessageText
            ]}>
              {item.content}
            </Text>
            
            <View style={styles.messageFooter}>
              <Text style={[
                styles.messageTime,
                isMyMessage ? styles.myMessageTime : styles.otherMessageTime
              ]}>
                {formatTime(item.timestamp)}
              </Text>
              
              {isMyMessage && (
                <Ionicons
                  name={item.is_read ? "checkmark-done" : "checkmark"}
                  size={16}
                  color={item.is_read ? "#4CAF50" : "#999"}
                  style={styles.readStatus}
                />
              )}
            </View>
          </View>
        </View>
      </View>
    );
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <Ionicons name="chatbubbles" size={40} color={theme.colors.primary} />
          <Text style={styles.loadingText}>Loading chat...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (!chatRoom) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.title}>My Mentor Chat</Text>
        </View>
        
        <View style={styles.emptyContainer}>
          <Ionicons name="person-add-outline" size={60} color="#ccc" />
          <Text style={styles.emptyText}>No mentor assigned</Text>
          <Text style={styles.emptySubtext}>
            You will be able to chat with your mentor once one is assigned to you
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView 
        style={styles.chatContainer}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
      >
        {/* Chat Header */}
        <View style={styles.chatHeader}>
          <TouchableOpacity 
            style={styles.backButton}
            onPress={() => {
              // Navigate back to mentor tab specifically
              router.push('/(tabs)/mentor');
            }}
          >
            <Ionicons name="arrow-back" size={24} color="#fff" />
          </TouchableOpacity>
          
          <View style={styles.chatHeaderInfo}>
            <View style={styles.headerAvatar}>
              <Text style={styles.headerAvatarText}>
                {chatRoom.mentor_name.split(' ').map(n => n.charAt(0)).join('')}
              </Text>
            </View>
            
            <View style={styles.headerText}>
              <Text style={styles.headerName}>
                {chatRoom.mentor_name}
              </Text>
              <Text style={styles.headerStatus}>Your Mentor</Text>
            </View>
          </View>
          
          <TouchableOpacity style={styles.moreButton}>
            <Ionicons name="ellipsis-vertical" size={20} color="#fff" />
          </TouchableOpacity>
        </View>

        {/* Messages */}
        <FlatList
          ref={flatListRef}
          data={messages}
          keyExtractor={(item) => item.id}
          renderItem={renderMessage}
          style={styles.messagesList}
          contentContainerStyle={styles.messagesContent}
          onContentSizeChange={() => flatListRef.current?.scrollToEnd()}
          onLayout={() => flatListRef.current?.scrollToEnd()}
          ListEmptyComponent={
            <View style={styles.emptyMessagesContainer}>
              <Ionicons name="chatbubble-outline" size={40} color="#ccc" />
              <Text style={styles.emptyMessagesText}>Start your conversation</Text>
              <Text style={styles.emptyMessagesSubtext}>
                Send a message to your mentor
              </Text>
            </View>
          }
        />

        {/* Message Input */}
        <View style={styles.inputContainer}>
          <View style={styles.inputWrapper}>
            <TextInput
              style={styles.textInput}
              value={newMessage}
              onChangeText={setNewMessage}
              placeholder="Type a message..."
              multiline
              maxLength={1000}
            />
            
            <TouchableOpacity
              style={[styles.sendButton, !newMessage.trim() && styles.sendButtonDisabled]}
              onPress={sendMessage}
              disabled={!newMessage.trim()}
            >
              <Ionicons 
                name="send" 
                size={20} 
                color={newMessage.trim() ? "#fff" : "#ccc"} 
              />
            </TouchableOpacity>
          </View>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: '#666',
  },
  header: {
    padding: 20,
    backgroundColor: 'white',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#666',
    marginTop: 16,
    textAlign: 'center',
  },
  emptySubtext: {
    fontSize: 14,
    color: '#999',
    marginTop: 8,
    textAlign: 'center',
    lineHeight: 20,
  },
  chatContainer: {
    flex: 1,
  },
  chatHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: theme.colors.primary,
    paddingVertical: 12,
    paddingHorizontal: 16,
  },
  chatHeaderInfo: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
  },
  headerAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  headerAvatarText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
  headerText: {
    flex: 1,
  },
  headerName: {
    color: 'white',
    fontSize: 18,
    fontWeight: '600',
  },
  headerStatus: {
    color: 'rgba(255,255,255,0.8)',
    fontSize: 14,
  },
  moreButton: {
    padding: 8,
  },
  backButton: {
    padding: 8,
    marginRight: 8,
  },
  messagesList: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  messagesContent: {
    paddingVertical: 8,
    flexGrow: 1,
  },
  emptyMessagesContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingTop: 60,
  },
  emptyMessagesText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#666',
    marginTop: 12,
  },
  emptyMessagesSubtext: {
    fontSize: 14,
    color: '#999',
    marginTop: 4,
  },
  dateContainer: {
    alignItems: 'center',
    marginVertical: 16,
  },
  dateText: {
    backgroundColor: 'rgba(0,0,0,0.1)',
    color: '#666',
    fontSize: 12,
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  messageContainer: {
    marginVertical: 2,
    marginHorizontal: 16,
  },
  myMessageContainer: {
    alignItems: 'flex-end',
  },
  otherMessageContainer: {
    alignItems: 'flex-start',
  },
  messageBubble: {
    maxWidth: '80%',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 18,
  },
  myMessage: {
    backgroundColor: theme.colors.primary,
    borderBottomRightRadius: 4,
  },
  otherMessage: {
    backgroundColor: 'white',
    borderBottomLeftRadius: 4,
  },
  messageText: {
    fontSize: 16,
    lineHeight: 20,
  },
  myMessageText: {
    color: 'white',
  },
  otherMessageText: {
    color: '#333',
  },
  messageFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
    justifyContent: 'flex-end',
  },
  messageTime: {
    fontSize: 12,
  },
  myMessageTime: {
    color: 'rgba(255,255,255,0.8)',
  },
  otherMessageTime: {
    color: '#999',
  },
  readStatus: {
    marginLeft: 4,
  },
  inputContainer: {
    backgroundColor: 'white',
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    backgroundColor: '#f5f5f5',
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  textInput: {
    flex: 1,
    fontSize: 16,
    maxHeight: 100,
    paddingVertical: 8,
  },
  sendButton: {
    backgroundColor: theme.colors.primary,
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 8,
  },
  sendButtonDisabled: {
    backgroundColor: '#ccc',
  },
});
