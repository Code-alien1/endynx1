import React from 'react';
import { View, Text, Switch } from 'react-native';
import { settingsStyles } from '../../styles/settings.styles';
import { COLORS } from '../../constants/theme';

interface ToggleSwitchProps {
  label: string;
  description: string;
  value: boolean;
  onValueChange: (value: boolean) => void;
  isLast?: boolean;
}

const ToggleSwitch: React.FC<ToggleSwitchProps> = ({ 
  label, 
  description, 
  value, 
  onValueChange, 
  isLast = false 
}) => {
  return (
    <View style={[settingsStyles.settingItem, isLast && settingsStyles.lastSettingItem]}>
      <View style={settingsStyles.settingInfo}>
        <Text style={settingsStyles.settingLabel}>{label}</Text>
        <Text style={settingsStyles.settingDescription}>{description}</Text>
      </View>
      <Switch
        value={value}
        onValueChange={onValueChange}
        trackColor={{ 
          false: COLORS.muted, 
          true: COLORS['primary-glow'] 
        }}
        thumbColor={value ? COLORS.primary : COLORS['muted-foreground']}
        ios_backgroundColor={COLORS.muted}
      />
    </View>
  );
};

export default ToggleSwitch;