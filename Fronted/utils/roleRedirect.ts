import { User } from '../services/api';
import type { Href } from 'expo-router';

export const getRoleBasedRoute = (user: User): Href => {
  // Route users to their role-specific dashboards
  switch (user.role) {
    case 'student':
      return '/(dashboards)/student' as Href;
    case 'teacher':
      return '/(dashboards)/teacher' as Href;
    case 'parent':
      return '/(dashboards)/parent' as Href;
    case 'mentor':
      return '/(dashboards)/mentor' as Href;
    case 'administration':
      return '/(dashboards)/administration' as Href;
    case 'superadmin':
      return '/(dashboards)/superadmin' as Href;
    default:
      return '/(tabs)/setting' as Href;
  }
};

export const getRoleDashboardTitle = (role: string): string => {
  switch (role) {
    case 'student':
      return 'Student Dashboard';
    case 'teacher':
      return 'Teacher Dashboard';
    case 'mentor':
      return 'Mentor Dashboard';
    case 'parent':
      return 'Parent Dashboard';
    case 'administration':
      return 'Admin Dashboard';
    case 'superadmin':
      return 'Super Admin Dashboard';
    default:
      return 'Dashboard';
  }
};

export const getRolePermissions = (role: string) => {
  const permissions = {
    canViewAllStudents: false,
    canManageAttendance: false,
    canViewReports: false,
    canManageUsers: false,
    canAccessSettings: false,
    canViewOwnData: true,
  };

  switch (role) {
    case 'superadmin':
      return {
        ...permissions,
        canViewAllStudents: true,
        canManageAttendance: true,
        canViewReports: true,
        canManageUsers: true,
        canAccessSettings: true,
      };
    case 'administration':
      return {
        ...permissions,
        canViewAllStudents: true,
        canManageAttendance: true,
        canViewReports: true,
        canManageUsers: true,
        canAccessSettings: true,
      };
    case 'teacher':
      return {
        ...permissions,
        canViewAllStudents: true,
        canManageAttendance: true,
        canViewReports: true,
      };
    case 'mentor':
      return {
        ...permissions,
        canViewReports: true,
      };
    case 'parent':
      return {
        ...permissions,
        canViewReports: true,
      };
    case 'student':
    default:
      return permissions;
  }
};
