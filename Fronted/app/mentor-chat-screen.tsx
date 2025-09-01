import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  TextInput,
  Alert,
  ActivityIndicator,
  FlatList,
  KeyboardAvoidingView,
  Platform,
  SafeAreaView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import AppBackground from '../components/AppBackground';
import { COLORS } from '../constants/theme';
import { useAuth } from '../contexts/AuthContext';
import apiService from '../services/api';

export default function MentorChatScreen() {
  const { user } = useAuth();
  const [messages, setMessages] = useState<any[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [chatRoom, setChatRoom] = useState<any>(null);
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [isLoadingMessages, setIsLoadingMessages] = useState(false);
  const [loading, setLoading] = useState(true);
  const flatListRef = useRef<FlatList>(null);
  const router = useRouter();

  useEffect(() => {
    loadChatData();
  }, []);

  useEffect(() => {
    if (chatRoom) {
      loadMessages(chatRoom.id);
      
      // Set up polling for real-time updates
      const interval = setInterval(() => {
        loadMessages(chatRoom.id);
      }, 1000);

      return () => clearInterval(interval);
    }
  }, [chatRoom]);

  const loadChatData = async () => {
    try {
      setLoading(true);
      
      // Get current user profile
      const userResponse = await apiService.get('/users/profile/');
      setCurrentUser(userResponse.data);
      
      // Get chat rooms to find assigned mentor
      try {
        const chatRoomsResponse = await apiService.get('/chat/chat-rooms/');
        const chatRooms = chatRoomsResponse.data.results || chatRoomsResponse.data;
        
        if (chatRooms.length > 0) {
          setChatRoom(chatRooms[0]);
        } else {
          // No chat room exists, try to get mentor assignment and create room
          try {
            const assignmentsResponse = await apiService.get('/chat/mentor-assignments/');
            const assignments = assignmentsResponse.data.results || assignmentsResponse.data;
            const userAssignment = assignments.find((a: any) => a.student_id === userResponse.data.id);
            
            if (userAssignment) {
              // Create chat room with assigned mentor
              const roomData = {
                name: `Chat with ${userAssignment.mentor_name}`,
                participants: [userResponse.data.id, userAssignment.mentor_id]
              };
              
              const newRoomResponse = await apiService.post('/chat/chat-rooms/', roomData);
              setChatRoom(newRoomResponse.data);
            } else {
              Alert.alert('No Mentor', 'You have not been assigned a mentor yet.');
            }
          } catch (assignmentError) {
            console.log('No mentor assignment found');
            Alert.alert('No Mentor', 'You have not been assigned a mentor yet.');
          }
        }
      } catch (chatError) {
        console.error('Error loading chat rooms:', chatError);
        Alert.alert('Error', 'Failed to load chat information');
      }
    } catch (error) {
      console.error('Error loading chat data:', error);
      Alert.alert('Error', 'Failed to load chat information');
    } finally {
      setLoading(false);
    }
  };

  const loadMessages = async (roomId: string) => {
    if (isLoadingMessages) return;
    try {
      setIsLoadingMessages(true);
      const response = await apiService.get(`/chat/messages/?chat_room=${roomId}`);
      const messagesList = response.data.results || response.data;
      setMessages(messagesList.reverse());
      
      // Mark messages as read
      const unreadMessages = messagesList.filter((msg: any) => 
        !msg.is_read && msg.sender_id !== currentUser?.id
      );
      if (unreadMessages.length > 0) {
        await Promise.all(
          unreadMessages.map((msg: any) =>
            apiService.patch(`/chat/messages/${msg.id}/`, { is_read: true })
          )
        );
      }
    } catch (error) {
      console.error('Error loading messages:', error);
    } finally {
      setIsLoadingMessages(false);
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
      const newMsg = response.data;
      setMessages(prevMessages => [...prevMessages, newMsg]);
      setNewMessage('');
      setTimeout(() => {
        flatListRef.current?.scrollToEnd({ animated: true });
      }, 100);
      setTimeout(() => loadMessages(chatRoom.id), 1000);
    } catch (error) {
      console.error('Error sending message:', error);
      Alert.alert('Error', 'Failed to send message');
    }
  };

  const formatTime = (timestamp: string) => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const renderMessage = ({ item }: { item: any }) => {
    const isMyMessage = item.sender_id === currentUser?.id;
    
    return (
      <View style={{
        flexDirection: 'row',
        justifyContent: isMyMessage ? 'flex-end' : 'flex-start',
        marginBottom: 8,
        paddingHorizontal: 16,
      }}>
        <View style={{
          maxWidth: '80%',
          backgroundColor: isMyMessage ? COLORS.primary : COLORS.card,
          padding: 12,
          borderRadius: 16,
          borderBottomRightRadius: isMyMessage ? 4 : 16,
          borderBottomLeftRadius: isMyMessage ? 16 : 4,
        }}>
          <Text style={{
            color: isMyMessage ? '#fff' : COLORS.foreground,
            fontSize: 16,
          }}>
            {item.content}
          </Text>
          <Text style={{
            color: isMyMessage ? 'rgba(255,255,255,0.7)' : COLORS['muted-foreground'],
            fontSize: 12,
            marginTop: 4,
            textAlign: 'right',
          }}>
            {formatTime(item.timestamp)}
          </Text>
        </View>
      </View>
    );
  };

  if (loading) {
    return (
      <AppBackground>
        <SafeAreaView style={{ flex: 1 }}>
          <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
            <ActivityIndicator size="large" color={COLORS.primary} />
            <Text style={{ color: COLORS.foreground, marginTop: 16 }}>Loading chat...</Text>
          </View>
        </SafeAreaView>
      </AppBackground>
    );
  }

  return (
    <AppBackground>
      <SafeAreaView style={{ flex: 1 }}>
        <KeyboardAvoidingView 
          style={{ flex: 1 }} 
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        >
          {/* Chat Header */}
          <View style={{
            flexDirection: 'row',
            alignItems: 'center',
            backgroundColor: COLORS.primary,
            paddingVertical: 16,
            paddingHorizontal: 16,
            paddingTop: Platform.OS === 'ios' ? 16 : 40,
          }}>
            <TouchableOpacity 
              style={{ padding: 8, marginRight: 8 }}
              onPress={() => router.back()}
            >
              <Ionicons name="arrow-back" size={24} color="#fff" />
            </TouchableOpacity>
            
            <View style={{
              width: 40,
              height: 40,
              borderRadius: 20,
              backgroundColor: 'rgba(255,255,255,0.2)',
              justifyContent: 'center',
              alignItems: 'center',
              marginRight: 12,
            }}>
              <Text style={{ color: 'white', fontSize: 16, fontWeight: 'bold' }}>
                {chatRoom?.name?.split(' ').slice(-1)[0]?.charAt(0) || 'M'}
              </Text>
            </View>
            
            <View style={{ flex: 1 }}>
              <Text style={{ color: 'white', fontSize: 18, fontWeight: '600' }}>
                {chatRoom?.name || 'Mentor Chat'}
              </Text>
              <Text style={{ color: 'rgba(255,255,255,0.8)', fontSize: 14 }}>
                Your Mentor
              </Text>
            </View>
          </View>
          
          {chatRoom ? (
            <>
              {/* Messages */}
              <FlatList
                ref={flatListRef}
                data={messages}
                keyExtractor={(item) => item.id}
                renderItem={renderMessage}
                style={{ flex: 1, backgroundColor: '#f5f5f5' }}
                contentContainerStyle={{ paddingVertical: 8, flexGrow: 1 }}
                onContentSizeChange={() => flatListRef.current?.scrollToEnd()}
                onLayout={() => flatListRef.current?.scrollToEnd()}
              />
              
              {/* Message Input */}
              <View style={{
                flexDirection: 'row',
                alignItems: 'center',
                padding: 16,
                backgroundColor: '#fff',
                borderTopWidth: 1,
                borderTopColor: '#eee',
              }}>
                <TextInput
                  style={{
                    flex: 1,
                    borderWidth: 1,
                    borderColor: '#ddd',
                    borderRadius: 20,
                    paddingHorizontal: 16,
                    paddingVertical: 8,
                    marginRight: 8,
                    maxHeight: 100,
                  }}
                  placeholder="Type a message..."
                  value={newMessage}
                  onChangeText={setNewMessage}
                  multiline
                />
                <TouchableOpacity
                  style={{
                    backgroundColor: COLORS.primary,
                    borderRadius: 20,
                    padding: 8,
                    opacity: newMessage.trim() ? 1 : 0.5,
                  }}
                  onPress={sendMessage}
                  disabled={!newMessage.trim()}
                >
                  <Ionicons name="send" size={20} color="#fff" />
                </TouchableOpacity>
              </View>
            </>
          ) : (
            <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', padding: 20 }}>
              <Ionicons name="chatbubbles-outline" size={64} color={COLORS['muted-foreground']} />
              <Text style={{ 
                color: COLORS['muted-foreground'], 
                textAlign: 'center', 
                fontSize: 18,
                marginTop: 16 
              }}>
                No chat room available
              </Text>
              <Text style={{ 
                color: COLORS['muted-foreground'], 
                textAlign: 'center', 
                fontSize: 14,
                marginTop: 8 
              }}>
                You need to be assigned a mentor first
              </Text>
            </View>
          )}
        </KeyboardAvoidingView>
      </SafeAreaView>
    </AppBackground>
  );
}
