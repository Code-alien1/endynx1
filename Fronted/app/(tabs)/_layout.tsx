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
        // For students: Dashboard, Attendance, Justify Absences, My Mentor, Settings
        return [
          {
            name: 'dashboard',
            title: 'Dashboard',
            icon: 'view-dashboard',
            iconSet: 'MaterialCommunityIcons'
          },
          {
            name: 'attendance',
            title: 'Attendance',
            icon: 'person-circle-check',
            iconSet: 'FontAwesome6'
          },
          {
            name: 'setting',
            title: 'Settings',
            icon: 'settings',
            iconSet: 'Ionicons'
          }
        ]
      
      case 'parent':
        return [
          {
            name: 'dashboard',
            title: 'Dashboard',
            icon: 'view-dashboard',
            iconSet: 'MaterialCommunityIcons'
          },
          {
            name: 'setting',
            title: 'Settings',
            icon: 'settings'
          }
        ]
      
      case 'teacher':
        return [
          {
            name: 'dashboard',
            title: 'Dashboard',
            icon: 'view-dashboard',
            iconSet: 'MaterialCommunityIcons'
          },
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
            name: 'dashboard',
            title: 'Dashboard',
            icon: 'view-dashboard',
            iconSet: 'MaterialCommunityIcons'
          },
          {
            name: 'my-students',
            title: 'My Students',
            icon: 'account-group',
            iconSet: 'MaterialCommunityIcons'
          },
          {
            name: 'setting',
            title: 'Settings',
            icon: 'settings'
          }
        ]
      
      case 'administration':
        return [
          {
            name: 'dashboard',
            title: 'Dashboard',
            icon: 'grid',
            iconSet: 'Ionicons'
          },
          {
            name: 'users',
            title: 'Users',
            icon: 'people',
            iconSet: 'Ionicons'
          },
          {
            name: 'attendance',
            title: 'Attendance',
            icon: 'checkmark-circle',
            iconSet: 'Ionicons'
          },
          {
            name: 'justifications',
            title: 'Justifications',
            icon: 'document-text',
            iconSet: 'Ionicons'
          },
          {
            name: 'announcements',
            title: 'Announcements',
            icon: 'megaphone',
            iconSet: 'Ionicons'
          },
          {
            name: 'mentors',
            title: 'Mentors',
            icon: 'people-circle',
            iconSet: 'Ionicons'
          },
          {
            name: 'setting',
            title: 'Settings',
            icon: 'settings',
            iconSet: 'Ionicons'
          }
        ]
      
      case 'superadmin':
        return [
          {
            name: 'dashboard',
            title: 'Dashboard',
            icon: 'view-dashboard',
            iconSet: 'MaterialCommunityIcons'
          },
          {
            name: 'setting',
            title: 'Manage System',
            icon: 'settings'
          }
        ]
      
      default:
        return [
          {
            name: 'dashboard',
            title: 'Dashboard',
            icon: 'view-dashboard',
            iconSet: 'MaterialCommunityIcons'
          },
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
        {/* Always hide index tab */}
        <Tabs.Screen
          name="index"
          options={{
            href: null,
          }}
        />
        
        {/* Dashboard - visible for all roles */}
        <Tabs.Screen
          name="dashboard"
          options={{
            href: tabs.some(tab => tab.name === 'dashboard') ? undefined : null,
            title: tabs.find(tab => tab.name === 'dashboard')?.title || 'Dashboard',
            tabBarIcon: ({size, color}) => {
              const dashboardTab = tabs.find(tab => tab.name === 'dashboard')
              return renderIcon(dashboardTab?.icon || 'view-dashboard', dashboardTab?.iconSet || 'MaterialCommunityIcons', size, color)
            },
          }}
        />

        {/* Attendance - visible for students, teachers, and admins */}
        <Tabs.Screen
          name="attendance"
          options={{
            href: tabs.some(tab => tab.name === 'attendance') ? undefined : null,
            title: 'Attendance',
            tabBarIcon: ({size, color}) => {
              const attendanceTab = tabs.find(tab => tab.name === 'attendance')
              return renderIcon(attendanceTab?.icon || 'clipboard-check', attendanceTab?.iconSet || 'MaterialCommunityIcons', size, color)
            },
          }}
        />

        {/* Student-specific tabs */}
        <Tabs.Screen
          name="absences"
          options={{
            href: user.role === 'student' ? undefined : null,
            title: 'Justify Absences',
            tabBarIcon: ({size, color}) => renderIcon('calendar-remove', 'MaterialCommunityIcons', size, color),
          }}
        />

        <Tabs.Screen
          name="mentor"
          options={{
            href: user.role === 'student' ? undefined : null,
            title: 'My Mentor',
            tabBarIcon: ({size, color}) => renderIcon('school', 'Ionicons', size, color),
          }}
        />

        <Tabs.Screen
          name="chat"
          options={{
            href: user.role === 'student' ? undefined : null,
            title: 'Chat',
            tabBarIcon: ({size, color}) => renderIcon('chat', 'MaterialCommunityIcons', size, color),
          }}
        />

        {/* Admin-specific tabs */}
        <Tabs.Screen
          name="users"
          options={{
            href: user.role === 'administration' ? undefined : null,
            title: 'Users',
            tabBarIcon: ({size, color}) => renderIcon('people', 'Ionicons', size, color),
          }}
        />

        <Tabs.Screen
          name="justifications"
          options={{
            href: user.role === 'administration' ? undefined : null,
            title: 'Justifications',
            tabBarIcon: ({size, color}) => renderIcon('document-text', 'Ionicons', size, color),
          }}
        />

        <Tabs.Screen
          name="announcements"
          options={{
            href: user.role === 'administration' ? undefined : null,
            title: 'Announcements',
            tabBarIcon: ({size, color}) => renderIcon('megaphone', 'Ionicons', size, color),
          }}
        />

        <Tabs.Screen
          name="mentor-assignments"
          options={{
            href: user.role === 'administration' ? undefined : null,
            title: 'Mentor Assignments',
            tabBarIcon: ({size, color}) => renderIcon('account-group', 'MaterialCommunityIcons', size, color),
          }}
        />

        <Tabs.Screen
          name="mentors"
          options={{
            href: user.role === 'administration' ? undefined : null,
            title: 'Mentors',
            tabBarIcon: ({size, color}) => renderIcon('people-circle', 'Ionicons', size, color),
          }}
        />

        {/* Mentor-specific tabs */}
        <Tabs.Screen
          name="my-students"
          options={{
            href: user.role === 'mentor' ? undefined : null,
            title: 'My Students',
            tabBarIcon: ({size, color}) => renderIcon('account-group', 'MaterialCommunityIcons', size, color),
          }}
        />

        <Tabs.Screen
          name="mentor-chat"
          options={{
            href: user.role === 'mentor' ? undefined : null,
            title: 'Student Chats',
            tabBarIcon: ({size, color}) => renderIcon('chat-multiple', 'MaterialCommunityIcons', size, color),
          }}
        />

        {/* Settings - visible for students, teachers, mentors, parents, superadmin (NOT administration) */}
        <Tabs.Screen
          name="setting"
          options={{
            href: ['student', 'teacher', 'mentor', 'parent', 'superadmin'].includes(user.role) ? undefined : null,
            title: tabs.find(tab => tab.name === 'setting')?.title || 'Settings',
            tabBarIcon: ({size, color}) => renderIcon('settings', 'Ionicons', size, color),
          }}
        />
    </Tabs>
  )
}