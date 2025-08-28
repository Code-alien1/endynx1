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
        // For students, we'll control tab order explicitly in JSX:
        // 1) Dashboard 2) Attendance 3) Justify Absences 4) My Mentor 5) Settings
        // So only return Dashboard and Attendance here; others are rendered explicitly later
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
            icon: 'view-dashboard',
            iconSet: 'MaterialCommunityIcons'
          },
          {
            name: 'setting',
            title: 'Settings',
            icon: 'settings'
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
        {/* Hide the index tab from navigation */}
        <Tabs.Screen
          name="index"
          options={{
            href: null, // This hides the tab from the tab bar
          }}
        />
        
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

        {/* Student-only extra tabs in desired order after Dashboard & Attendance */}
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

        {/* Ensure Settings appears last for students */}
        {user.role === 'student' && (
          <Tabs.Screen
            name="setting"
            options={{
              title: 'Settings',
              tabBarIcon: ({size, color}) => renderIcon('settings', 'Ionicons', size, color),
            }}
          />
        )}
    </Tabs>
  )
}