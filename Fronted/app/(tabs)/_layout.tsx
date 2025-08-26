import { View, Text } from 'react-native'
import React from 'react'
import { Tabs } from 'expo-router'
import { Ionicons, MaterialCommunityIcons, FontAwesome6 } from '@expo/vector-icons'
import { COLORS } from '@/constants/theme'
import { useAuth } from '../../contexts/AuthContext'
import { getRolePermissions } from '../../utils/roleRedirect'

export default function Tablayout() {
  const { user } = useAuth()
  
  if (!user) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <Text>Loading...</Text>
      </View>
    )
  }

  const permissions = getRolePermissions(user.role)

  // Role-specific tab configurations based on exact requirements
  const getTabsForRole = () => {
    switch (user.role) {
      case 'student':
        return [
          {
            name: 'attendance',
            title: 'Attendance',
            icon: 'person-circle-check',
            iconSet: 'FontAwesome6'
          },
          {
            name: 'absences',
            title: 'Justify Absences',
            icon: 'calendar-remove',
            iconSet: 'MaterialCommunityIcons'
          },
          {
            name: 'mentor',
            title: 'My Mentor',
            icon: 'school'
          },
          {
            name: 'setting',
            title: 'Settings',
            icon: 'settings'
          }
        ]
      
      case 'parent':
        return [
          {
            name: 'setting',
            title: 'Settings',
            icon: 'settings'
          }
        ]
      
      case 'teacher':
        return [
          {
            name: 'attendance',
            title: 'Attendance',
            icon: 'clipboard-check',
            iconSet: 'MaterialCommunityIcons'
          },
          {
            name: 'setting',
            title: 'Settings',
            icon: 'settings'
          }
        ]
      
      case 'mentor':
        return [
          {
            name: 'setting',
            title: 'Settings',
            icon: 'settings'
          }
        ]
      
      case 'administration':
        return [
          {
            name: 'setting',
            title: 'Settings',
            icon: 'settings'
          }
        ]
      
      case 'superadmin':
        return [
          {
            name: 'setting',
            title: 'Manage System',
            icon: 'settings'
          }
        ]
      
      default:
        return [
          {
            name: 'setting',
            title: 'Home',
            icon: 'home-sharp'
          }
        ]
    }
  }

  const tabs = getTabsForRole()

  const renderIcon = (iconName: string, iconSet: string = 'Ionicons', size: number, color: string) => {
    switch (iconSet) {
      case 'MaterialCommunityIcons':
        return <MaterialCommunityIcons name={iconName as any} size={size} color={color} />
      case 'FontAwesome6':
        return <FontAwesome6 name={iconName as any} size={size} color={color} />
      default:
        return <Ionicons name={iconName as any} size={size} color={color} />
    }
  }

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
                height: 60,
                paddingBottom: 8,
                paddingTop: 8,
            },
            tabBarLabelStyle: {
                fontSize: 11,
                fontWeight: '500'
            }
        }}
    >
        {tabs.map((tab) => (
          <Tabs.Screen
              key={tab.name}
              name={tab.name}
              options={{
                  title: tab.title,
                  tabBarIcon: ({size, color}) => renderIcon(tab.icon, tab.iconSet, size, color),
              }}
          />
        ))}
    </Tabs>
  )
}