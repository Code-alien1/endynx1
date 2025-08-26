// Mock data for settings screen
export const mockRootProps = {
  user: {
    fullName: "Alex Johnson" as const,
    studentId: "EDX2024-001" as const,
    grade: "Grade 12" as const,
    email: "alex.johnson@student.edynx.edu" as const,
    phone: "+1 (555) 123-4567" as const,
    avatarInitials: "AJ" as const
  },
  systemInfo: {
    appVersion: "v2.1.0" as const,
    storageUsed: "142 MB" as const,
    lastSync: "Just now" as const,
    cacheSize: "28 MB" as const
  },
  preferences: {
    pushNotifications: true,
    soundEffects: true,
    faceIdLogin: true,
    locationServices: false,
    darkMode: true,
    autoSync: true
  }
};

// Types for settings screen data
export interface UserProfile {
  fullName: string;
  studentId: string;
  grade: string;
  email: string;
  phone: string;
  avatarInitials: string;
}

export interface SystemInfo {
  appVersion: string;
  storageUsed: string;
  lastSync: string;
  cacheSize: string;
}

export interface UserPreferences {
  pushNotifications: boolean;
  soundEffects: boolean;
  faceIdLogin: boolean;
  locationServices: boolean;
  darkMode: boolean;
  autoSync: boolean;
}

export interface SettingsProps {
  user: UserProfile;
  systemInfo: SystemInfo;
  preferences: UserPreferences;
}