import React from "react";
import {
  View,
  TextInput,
  Text,
  Platform,
  InputAccessoryView,
  Button,
  Keyboard,
  TextInputProps,
  TextStyle,
  ViewStyle,
} from "react-native";

import { COLORS, SIZES } from "../constants";

interface InputProps extends TextInputProps {
  label?: string;
  error?: string;
  touched?: boolean;
  inputStyle?: TextStyle;
  containerStyle?: ViewStyle;
  labelStyle?: TextStyle;
  errorStyle?: TextStyle;
  className?: string;
  inputClassName?: string;
  labelClassName?: string;
  errorClassName?: string;
}

const Input: React.FC<InputProps> = ({
  label,
  error,
  touched,
  inputStyle,
  containerStyle,
  labelStyle,
  errorStyle,
  className = "",
  inputClassName = "",
  labelClassName = "",
  errorClassName = "",
  inputAccessoryViewID,
  ...props
}) => {
  const showError = !!(error && touched);
  const accessoryViewID =
    inputAccessoryViewID || `input-${Math.random().toString(36).slice(2, 10)}`;

  return (
    <View className={`mb-4 w-full ${className}`} style={containerStyle}>
      {label && (
        <Text
          className={`text-base text-text font-medium mb-1 ${labelClassName}`}
          style={labelStyle}
        >
          {label}
        </Text>
      )}

      <TextInput
        style={[
          {
            backgroundColor: COLORS.inputBackground,
            borderColor: showError ? COLORS.error : COLORS.border,
            borderWidth: 1,
            borderRadius: SIZES.xs,
            padding: SIZES.sm,
            fontSize: 16,
            color: COLORS.text,
          },
          inputStyle,
        ]}
        className={`${inputClassName}`}
        placeholderTextColor={COLORS.lightText}
        inputAccessoryViewID={
          Platform.OS === "ios" ? accessoryViewID : undefined
        }
        returnKeyType="done"
        {...props}
      />

      {showError && (
        <Text
          className={`text-xs text-error mt-1 ${errorClassName}`}
          style={errorStyle}
        >
          {error}
        </Text>
      )}

      {Platform.OS === "ios" && (
        <InputAccessoryView nativeID={accessoryViewID}>
          <View className="bg-gray-100 border-t border-gray-300 p-2 flex-row justify-end">
            <Button
              onPress={Keyboard.dismiss}
              title="Done"
              color={COLORS.primary}
            />
          </View>
        </InputAccessoryView>
      )}
    </View>
  );
};

export default Input;
