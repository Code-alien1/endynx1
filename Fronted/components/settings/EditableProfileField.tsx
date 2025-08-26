import React, { useState } from 'react';
import { View, Text, TextInput } from 'react-native';
import { settingsStyles } from '../../styles/settings.styles';

interface EditableProfileFieldProps {
  label: string;
  value: string;
  onChangeText: (text: string) => void;
  keyboardType?: 'default' | 'email-address' | 'phone-pad';
  autoCapitalize?: 'none' | 'sentences' | 'words' | 'characters';
  placeholder?: string;
}

const EditableProfileField: React.FC<EditableProfileFieldProps> = ({
  label,
  value,
  onChangeText,
  keyboardType = 'default',
  autoCapitalize = 'sentences',
  placeholder
}) => {
  const [isFocused, setIsFocused] = useState(false);

  return (
    <View style={settingsStyles.formField}>
      <Text style={settingsStyles.fieldLabel}>{label}</Text>
      <TextInput
        style={[
          settingsStyles.input,
          isFocused && { borderColor: '#2ecc71' }
        ]}
        value={value}
        onChangeText={onChangeText}
        keyboardType={keyboardType}
        autoCapitalize={autoCapitalize}
        placeholder={placeholder}
        placeholderTextColor="#9CA3AF"
        onFocus={() => setIsFocused(true)}
        onBlur={() => setIsFocused(false)}
      />
    </View>
  );
};

export default EditableProfileField;