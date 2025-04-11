import React from 'react';
import { 
  View, 
  TextInput, 
  Text, 
  StyleSheet, 
  ViewStyle, 
  TextStyle, 
  TextInputProps,
  Platform,
  InputAccessoryView,
  Button,
  Keyboard
} from 'react-native';
import { COLORS, SIZES } from '../constants';

interface InputProps extends TextInputProps {
  label?: string;
  error?: string;
  touched?: boolean;
  containerStyle?: ViewStyle;
  labelStyle?: TextStyle;
  inputStyle?: ViewStyle;
  errorStyle?: TextStyle;
}

const Input: React.FC<InputProps> = ({
  label,
  error,
  touched,
  containerStyle,
  labelStyle,
  inputStyle,
  errorStyle,
  inputAccessoryViewID,
  ...props
}) => {
  const showError = error && touched;
  
  // Generate a unique inputAccessoryViewID if not provided
  const accessoryViewID = inputAccessoryViewID || `input-${Math.random().toString(36).substring(2, 10)}`;

  return (
    <View style={[styles.container, containerStyle]}>
      {label && <Text style={[styles.label, labelStyle]}>{label}</Text>}
      
      <TextInput
        style={[
          styles.input,
          showError && styles.inputError,
          inputStyle,
        ]}
        placeholderTextColor={COLORS.lightText}
        inputAccessoryViewID={Platform.OS === 'ios' ? accessoryViewID : undefined}
        returnKeyType="done"
        {...props}
      />
      
      {showError && (
        <Text style={[styles.errorText, errorStyle]}>{error}</Text>
      )}

      {Platform.OS === 'ios' && (
        <InputAccessoryView nativeID={accessoryViewID}>
          <View style={styles.accessoryContainer}>
            <Button
              onPress={() => Keyboard.dismiss()}
              title="Done"
              color={COLORS.primary}
            />
          </View>
        </InputAccessoryView>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: SIZES.md,
    width: '100%',
  },
  label: {
    fontSize: 16,
    marginBottom: SIZES.xs,
    color: COLORS.text,
    fontWeight: '500',
  },
  input: {
    backgroundColor: COLORS.inputBackground,
    borderRadius: SIZES.xs,
    padding: SIZES.sm,
    fontSize: 16,
    borderWidth: 1,
    borderColor: COLORS.border,
    color: COLORS.text,
  },
  inputError: {
    borderColor: COLORS.error,
  },
  errorText: {
    color: COLORS.error,
    fontSize: 12,
    marginTop: 4,
  },
  accessoryContainer: {
    backgroundColor: '#f8f8f8',
    borderTopWidth: 1,
    borderTopColor: '#dedede',
    padding: 8,
    flexDirection: 'row',
    justifyContent: 'flex-end',
  },
});

export default Input;
