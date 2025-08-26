import React from 'react';
import { View, Text } from 'react-native';
import { settingsStyles } from '../../styles/settings.styles';

interface SystemInfoRowProps {
  label: string;
  value: string;
  isLast?: boolean;
}

const SystemInfoRow: React.FC<SystemInfoRowProps> = ({ label, value, isLast = false }) => {
  return (
    <View style={[
      settingsStyles.systemInfoRow,
      isLast && { borderBottomWidth: 0 }
    ]}>
      <Text style={settingsStyles.systemInfoKey}>{label}</Text>
      <Text style={settingsStyles.systemInfoValue}>{value}</Text>
    </View>
  );
};

export default SystemInfoRow;