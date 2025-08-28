import React, { useState } from 'react';
import { 
  View, 
  Text, 
  ScrollView, 
  TouchableOpacity, 
  Alert,
  Platform
} from 'react-native';
import { useRouter } from 'expo-router';
import { useAuth } from '../../contexts/AuthContext';
import { settingsStyles } from '../../styles/settings.styles';
import { mockRootProps, UserProfile, UserPreferences } from '../../data/settingsMockData';

// Components
import AppBackground from '../../components/AppBackground';
import SettingsSection from '../../components/settings/SettingsSection';
import ToggleSwitch from '../../components/settings/ToggleSwitch';
import EditableProfileField from '../../components/settings/EditableProfileField';
import SystemInfoRow from '../../components/settings/SystemInfoRow';
import ActionButton from '../../components/settings/ActionButton';

// Icons (using Expo Vector Icons)
import { Ionicons } from '@expo/vector-icons';

export default function Setting() {
  const router = useRouter();
  const { logout } = useAuth();
  const [userProfile, setUserProfile] = useState<UserProfile>(mockRootProps.user);
  const [preferences, setPreferences] = useState<UserPreferences>(mockRootProps.preferences);
  const [isProfileChanged, setIsProfileChanged] = useState(false);

  const handleProfileChange = (field: keyof UserProfile, value: string) => {
    setUserProfile(prev => ({ ...prev, [field]: value }));
    setIsProfileChanged(true);
  };

  const handlePreferenceChange = (field: keyof UserPreferences, value: boolean) => {
    setPreferences(prev => ({ ...prev, [field]: value }));
  };

  const handleSaveProfile = () => {
    // Here you would typically make an API call to save the profile
    Alert.alert('Success', 'Profile updated successfully!');
    setIsProfileChanged(false);
  };

  const handleHelpSupport = () => {
    Alert.alert('Help & Support', 'Contact support at support@edynx.edu');
  };

  const handleSignOut = () => {
    if (Platform.OS === 'web') {
      const confirmed = window.confirm('Are you sure you want to sign out?');
      if (confirmed) {
        (async () => {
          try {
            await logout();
            router.replace('/');
          } catch (error) {
            console.error('Logout error:', error);
            alert('Failed to sign out. Please try again.');
          }
        })();
      }
      return;
    }

    Alert.alert(
      'Sign Out',
      'Are you sure you want to sign out?',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Sign Out', style: 'destructive', onPress: async () => {
          try {
            await logout();
            router.replace('/');
          } catch (error) {
            console.error('Logout error:', error);
            Alert.alert('Error', 'Failed to sign out. Please try again.');
          }
        }}
      ]
    );
  };

  return (
    <AppBackground>
      <ScrollView 
        style={settingsStyles.scrollContainer}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={settingsStyles.header}>
          <Text style={settingsStyles.title}>Settings</Text>
          <Text style={settingsStyles.subtitle}>
            Manage your account and preferences
          </Text>
        </View>

        {/* Profile Information */}
        <SettingsSection 
          title="Profile Information" 
          icon={<Ionicons name="person-outline" size={24} color="#2ecc71" />}
        >
          <View style={settingsStyles.profileContainer}>
            <View style={settingsStyles.avatar}>
              <Text style={settingsStyles.avatarText}>
                {userProfile.avatarInitials}
              </Text>
            </View>
            <Text style={settingsStyles.userName}>{userProfile.fullName}</Text>
            <View style={settingsStyles.userInfo}>
              <Text style={settingsStyles.studentId}>{userProfile.studentId}</Text>
              <View style={settingsStyles.gradeBadge}>
                <Text style={settingsStyles.gradeText}>{userProfile.grade}</Text>
              </View>
            </View>
          </View>

          <EditableProfileField
            label="Full Name"
            value={userProfile.fullName}
            onChangeText={(text) => handleProfileChange('fullName', text)}
            placeholder="Enter your full name"
          />

          <EditableProfileField
            label="Email Address"
            value={userProfile.email}
            onChangeText={(text) => handleProfileChange('email', text)}
            keyboardType="email-address"
            autoCapitalize="none"
            placeholder="Enter your email"
          />

          <EditableProfileField
            label="Phone Number"
            value={userProfile.phone}
            onChangeText={(text) => handleProfileChange('phone', text)}
            keyboardType="phone-pad"
            placeholder="Enter your phone number"
          />

          <TouchableOpacity 
            style={[
              settingsStyles.saveButton,
              !isProfileChanged && { opacity: 0.6 }
            ]}
            onPress={handleSaveProfile}
            disabled={!isProfileChanged}
            activeOpacity={0.7}
          >
            <Text style={settingsStyles.saveButtonText}>Save Profile</Text>
          </TouchableOpacity>
        </SettingsSection>

        {/* Notifications */}
        <SettingsSection 
          title="Notifications" 
          icon={<Ionicons name="notifications-outline" size={24} color="#2ecc71" />}
        >
          <ToggleSwitch
            label="Push Notifications"
            description="Receive alerts for attendance, assignments, and messages"
            value={preferences.pushNotifications}
            onValueChange={(value) => handlePreferenceChange('pushNotifications', value)}
          />
          <ToggleSwitch
            label="Sound Effects"
            description="Play sounds for interactions and notifications"
            value={preferences.soundEffects}
            onValueChange={(value) => handlePreferenceChange('soundEffects', value)}
            isLast
          />
        </SettingsSection>

        {/* Security & Privacy */}
        <SettingsSection 
          title="Security & Privacy" 
          icon={<Ionicons name="shield-checkmark-outline" size={24} color="#2ecc71" />}
        >
          <ToggleSwitch
            label="Face ID Login"
            description="Use biometric authentication for quick access"
            value={preferences.faceIdLogin}
            onValueChange={(value) => handlePreferenceChange('faceIdLogin', value)}
          />
          <ToggleSwitch
            label="Location Services"
            description="Enable location-based attendance marking"
            value={preferences.locationServices}
            onValueChange={(value) => handlePreferenceChange('locationServices', value)}
            isLast
          />
        </SettingsSection>

        {/* App Preferences */}
        <SettingsSection 
          title="App Preferences" 
          icon={<Ionicons name="settings-outline" size={24} color="#2ecc71" />}
        >
          <ToggleSwitch
            label="Dark Mode"
            description="Switch to dark theme for better visibility"
            value={preferences.darkMode}
            onValueChange={(value) => handlePreferenceChange('darkMode', value)}
          />
          <ToggleSwitch
            label="Auto Sync"
            description="Automatically sync data when connected to WiFi"
            value={preferences.autoSync}
            onValueChange={(value) => handlePreferenceChange('autoSync', value)}
            isLast
          />
        </SettingsSection>

        {/* System Information */}
        <SettingsSection 
          title="System Information" 
          icon={<Ionicons name="information-circle-outline" size={24} color="#2ecc71" />}
        >
          <SystemInfoRow 
            label="App Version" 
            value={mockRootProps.systemInfo.appVersion} 
          />
          <SystemInfoRow 
            label="Storage Used" 
            value={mockRootProps.systemInfo.storageUsed} 
          />
          <SystemInfoRow 
            label="Last Sync" 
            value={mockRootProps.systemInfo.lastSync} 
          />
          <SystemInfoRow 
            label="Cache Size" 
            value={mockRootProps.systemInfo.cacheSize} 
            isLast
          />
        </SettingsSection>

        {/* Action Buttons */}
        <ActionButton
          title="Help & Support"
          icon={<Ionicons name="help-circle-outline" size={20} color="#f7f7f7" />}
          onPress={handleHelpSupport}
        />

        <ActionButton
          title="Sign Out"
          icon={<Ionicons name="exit-outline" size={20} color="#e74c3c" />}
          onPress={handleSignOut}
          variant="destructive"
        />

        {/* Footer */}
        <View style={settingsStyles.footer}>
          <Text style={settingsStyles.footerText}>
            Edynx School Management System{'\n'}
            © 2024 All rights reserved
          </Text>
        </View>
      </ScrollView>
    </AppBackground>
  );
}