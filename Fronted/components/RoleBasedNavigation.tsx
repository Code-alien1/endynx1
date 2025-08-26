import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { useAuth } from '../contexts/AuthContext';
import { getRolePermissions } from '../utils/roleRedirect';
import { useRouter, usePathname } from 'expo-router';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { COLORS } from '../constants/theme';

interface NavItem {
  name: string;
  icon: string;
  route: string;
  permission?: keyof ReturnType<typeof getRolePermissions>;
}

const allNavItems: NavItem[] = [
  { name: 'Dashboard', icon: 'view-dashboard', route: '/(tabs)' },
  { name: 'Attendance', icon: 'calendar-check', route: '/(tabs)/attendance' },
  { name: 'Mentor', icon: 'account-supervisor', route: '/(tabs)/mentor' },
  { name: 'Feedback', icon: 'message-text', route: '/(tabs)/feedback' },
  { name: 'Settings', icon: 'cog', route: '/(tabs)/setting', permission: 'canAccessSettings' },
];

export default function RoleBasedNavigation() {
  const { user } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  if (!user) return null;

  const permissions = getRolePermissions(user.role);
  
  // Filter navigation items based on role permissions
  const availableNavItems = allNavItems.filter(item => {
    if (!item.permission) return true;
    return permissions[item.permission];
  });

  // Add role-specific items
  const roleSpecificItems: NavItem[] = [];
  
  if (user.role === 'administration' || user.role === 'superadmin') {
    roleSpecificItems.push(
      { name: 'Users', icon: 'account-multiple', route: '/(tabs)/users' },
      { name: 'Reports', icon: 'chart-bar', route: '/(tabs)/reports' }
    );
  }

  if (user.role === 'teacher') {
    roleSpecificItems.push(
      { name: 'Students', icon: 'account-group', route: '/(tabs)/students' }
    );
  }

  const finalNavItems = [...availableNavItems, ...roleSpecificItems];

  return (
    <View style={styles.container}>
      {finalNavItems.map((item, index) => {
        const isActive = pathname === item.route;
        return (
          <TouchableOpacity
            key={index}
            style={[styles.navItem, isActive && styles.activeNavItem]}
            onPress={() => router.push(item.route as any)}
          >
            <MaterialCommunityIcons
              name={item.icon as any}
              size={24}
              color={isActive ? COLORS.primary : COLORS['muted-foreground']}
            />
            <Text style={[
              styles.navText,
              isActive && styles.activeNavText
            ]}>
              {item.name}
            </Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    backgroundColor: COLORS.card,
    paddingVertical: 8,
    paddingHorizontal: 4,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
  },
  navItem: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 4,
    borderRadius: 8,
  },
  activeNavItem: {
    backgroundColor: 'rgba(46, 204, 113, 0.1)',
  },
  navText: {
    fontSize: 12,
    color: COLORS['muted-foreground'],
    marginTop: 4,
    textAlign: 'center',
  },
  activeNavText: {
    color: COLORS.primary,
    fontWeight: '600',
  },
});
