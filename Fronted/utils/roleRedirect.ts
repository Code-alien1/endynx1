import { User } from '../services/api';

export const getRoleBasedRoute = (user: User): string => {
  // For now, all roles redirect to the same tabs structure
  // but we can customize the dashboard content based on role
  return '/(tabs)';
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
