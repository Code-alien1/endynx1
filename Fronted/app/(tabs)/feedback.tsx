import { View, Text, ScrollView } from 'react-native'
import React from 'react'
import AppBackground from '../../components/AppBackground'
import { COLORS } from '../../constants/theme'
import { Ionicons } from '@expo/vector-icons'

export default function feedback() {
  return (
    <AppBackground>
      <ScrollView style={{ flex: 1, padding: 16, paddingTop: 60 }}>
        {/* Header */}
        <View style={{ marginBottom: 24 }}>
          <Text style={{ 
            fontSize: 28, 
            fontWeight: 'bold', 
            color: COLORS.foreground, 
            marginBottom: 8 
          }}>
            Feedback
          </Text>
          <Text style={{ 
            fontSize: 16, 
            color: COLORS['muted-foreground'] 
          }}>
            Share your thoughts and suggestions
          </Text>
        </View>

        {/* Coming Soon Card */}
        <View style={{
          backgroundColor: COLORS.card,
          padding: 24,
          borderRadius: 16,
          alignItems: 'center',
          borderWidth: 1,
          borderColor: COLORS['card-border']
        }}>
          <View style={{
            width: 80,
            height: 80,
            borderRadius: 40,
            backgroundColor: COLORS.primary,
            justifyContent: 'center',
            alignItems: 'center',
            marginBottom: 16
          }}>
            <Ionicons name="chatbubble-ellipses-outline" size={32} color="#fff" />
          </View>
          
          <Text style={{ 
            fontSize: 20, 
            fontWeight: '600', 
            color: COLORS.foreground, 
            marginBottom: 8,
            textAlign: 'center'
          }}>
            Feedback System
          </Text>
          
          <Text style={{ 
            fontSize: 16, 
            color: COLORS['muted-foreground'],
            textAlign: 'center',
            lineHeight: 24
          }}>
            We're working on an amazing feedback system where you can share your thoughts, 
            rate your experience, and help us improve the app.
          </Text>
          
          <View style={{
            backgroundColor: COLORS['primary-glow'],
            paddingHorizontal: 16,
            paddingVertical: 8,
            borderRadius: 20,
            marginTop: 16
          }}>
            <Text style={{ 
              color: COLORS.primary, 
              fontSize: 14, 
              fontWeight: '600' 
            }}>
              Coming Soon
            </Text>
          </View>
        </View>
      </ScrollView>
    </AppBackground>
  )
}