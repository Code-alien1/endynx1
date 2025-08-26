import { View, Text } from 'react-native'
import React from 'react'
import { Tabs } from 'expo-router'
import { Ionicons }from '@expo/vector-icons'
import { FontAwesome6 } from '@expo/vector-icons'
import { COLORS } from '@/constants/theme'
import { useAuth } from '../../contexts/AuthContext'
import { getRolePermissions } from '../../utils/roleRedirect'

export default function Tablayout() {
  const { user } = useAuth()
  
  if (!user) {
    return null
  }

  const permissions = getRolePermissions(user.role)

  return (
    <Tabs
        screenOptions={{
            headerShown: false,
            tabBarActiveTintColor: COLORS.primary,
            tabBarInactiveTintColor: COLORS.foreground,
            tabBarStyle: {
                backgroundColor: COLORS.background,
                borderTopWidth: 0,
                elevation: 0,
                height: 50,
                paddingBottom: 8,
            },
        }}
    >
        <Tabs.Screen
            name='index'
            options={{
                title: 'Home',
                tabBarIcon: ({size , color}) => <Ionicons name="home-sharp" size={size} color={color} />,
                
            }}
        />
        
        {/* Show Mentor tab for all roles except administration */}
        {user.role !== 'administration' && user.role !== 'superadmin' && (
          <Tabs.Screen
              name='mentor'
              options={{
                  title: user.role === 'mentor' ? 'Mentees' : 'Mentor',
                  tabBarIcon: ({size , color}) => <Ionicons name="people" size={size} color={color} />,
              }}
          />
        )}
        
        <Tabs.Screen
            name='attendance'
            options={{
                title: 'Attendance',
                tabBarIcon: ({size , color}) => <FontAwesome6 name="person-circle-check" size={size} color={color} />,             
            }}
        />
        
        <Tabs.Screen
            name='feedback'
            options={{
                title: user.role === 'teacher' || user.role === 'mentor' ? 'Messages' : 'Chat',
                tabBarIcon: ({size , color}) => <Ionicons name="chatbox" size={size} color={color} />,
            }}
        />
        
        {/* Show Settings tab only for roles with permission */}
        {permissions.canAccessSettings && (
          <Tabs.Screen
              name='setting'
              options={{
                  title: 'Settings',
                  tabBarIcon: ({size , color}) => <Ionicons name="settings" size={size} color={color} />,
              }}
          />
        )}
    </Tabs>
  )
}