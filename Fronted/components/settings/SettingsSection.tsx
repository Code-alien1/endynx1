import React from 'react';
import { View, Text } from 'react-native';
import { settingsStyles } from '../../styles/settings.styles';

interface SettingsSectionProps {
  title: string;
  icon: React.ReactNode;
  children: React.ReactNode;
}

const SettingsSection: React.FC<SettingsSectionProps> = ({ title, icon, children }) => {
  return (
    <View style={settingsStyles.section}>
      <View style={settingsStyles.sectionHeader}>
        <View style={settingsStyles.sectionIcon}>
          {icon}
        </View>
        <Text style={settingsStyles.sectionTitle}>{title}</Text>
      </View>
      <View style={settingsStyles.sectionContent}>
        {children}
      </View>
    </View>
  );
};

export default SettingsSection;