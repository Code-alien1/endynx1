import React from 'react';
import { TouchableOpacity, Text, View } from 'react-native';
import { settingsStyles } from '../../styles/settings.styles';

interface ActionButtonProps {
  title: string;
  icon: React.ReactNode;
  onPress: () => void;
  variant?: 'default' | 'destructive';
}

const ActionButton: React.FC<ActionButtonProps> = ({ 
  title, 
  icon, 
  onPress, 
  variant = 'default' 
}) => {
  return (
    <TouchableOpacity 
      style={[
        settingsStyles.actionButton,
        variant === 'destructive' && settingsStyles.signOutButton
      ]}
      onPress={onPress}
      activeOpacity={0.7}
    >
      {icon}
      <Text style={[
        settingsStyles.actionButtonText,
        variant === 'destructive' && settingsStyles.signOutButtonText
      ]}>
        {title}
      </Text>
    </TouchableOpacity>
  );
};

export default ActionButton;