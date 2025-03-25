import React from 'react';
import { TouchableOpacity, Text, StyleSheet, ActivityIndicator, ViewStyle, TextStyle } from 'react-native';
import { COLORS, SIZES } from '../constants';

interface ButtonProps {
  title: string;
  onPress: () => void;
  variant?: 'primary' | 'secondary' | 'outline' | 'danger';
  size?: 'small' | 'medium' | 'large';
  disabled?: boolean;
  loading?: boolean;
  style?: ViewStyle;
  textStyle?: TextStyle;
}

const Button: React.FC<ButtonProps> = ({
  title,
  onPress,
  variant = 'primary',
  size = 'medium',
  disabled = false,
  loading = false,
  style,
  textStyle,
}) => {
  const getButtonStyle = (): ViewStyle => {
    let baseStyle: ViewStyle = {
      borderRadius: SIZES.md,
      justifyContent: 'center',
      alignItems: 'center',
      flexDirection: 'row',
    };

    // Size styles
    switch (size) {
      case 'small':
        baseStyle = {
          ...baseStyle,
          paddingVertical: SIZES.xs,
          paddingHorizontal: SIZES.md,
        };
        break;
      case 'large':
        baseStyle = {
          ...baseStyle,
          paddingVertical: SIZES.md,
          paddingHorizontal: SIZES.lg,
        };
        break;
      case 'medium':
      default:
        baseStyle = {
          ...baseStyle,
          paddingVertical: SIZES.sm,
          paddingHorizontal: SIZES.md,
        };
        break;
    }

    // Variant styles
    switch (variant) {
      case 'secondary':
        baseStyle = {
          ...baseStyle,
          backgroundColor: COLORS.secondary,
        };
        break;
      case 'outline':
        baseStyle = {
          ...baseStyle,
          backgroundColor: 'transparent',
          borderWidth: 1,
          borderColor: COLORS.primary,
        };
        break;
      case 'danger':
        baseStyle = {
          ...baseStyle,
          backgroundColor: COLORS.error,
        };
        break;
      case 'primary':
      default:
        baseStyle = {
          ...baseStyle,
          backgroundColor: COLORS.primary,
        };
        break;
    }

    // Disabled style
    if (disabled) {
      baseStyle = {
        ...baseStyle,
        opacity: 0.5,
      };
    }

    return baseStyle;
  };

  const getTextStyle = (): TextStyle => {
    let baseStyle: TextStyle = {
      fontWeight: 'bold',
    };

    // Size styles
    switch (size) {
      case 'small':
        baseStyle = {
          ...baseStyle,
          fontSize: 14,
        };
        break;
      case 'large':
        baseStyle = {
          ...baseStyle,
          fontSize: 18,
        };
        break;
      case 'medium':
      default:
        baseStyle = {
          ...baseStyle,
          fontSize: 16,
        };
        break;
    }

    // Variant styles
    switch (variant) {
      case 'outline':
        baseStyle = {
          ...baseStyle,
          color: COLORS.primary,
        };
        break;
      case 'primary':
      case 'secondary':
      case 'danger':
      default:
        baseStyle = {
          ...baseStyle,
          color: 'white',
        };
        break;
    }

    return baseStyle;
  };

  return (
    <TouchableOpacity
      style={[styles.button, getButtonStyle(), style]}
      onPress={onPress}
      disabled={disabled || loading}
      activeOpacity={0.8}
    >
      {loading ? (
        <ActivityIndicator
          size="small"
          color={variant === 'outline' ? COLORS.primary : 'white'}
          style={styles.loader}
        />
      ) : null}
      <Text style={[styles.text, getTextStyle(), textStyle]}>{title}</Text>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  button: {
    minWidth: 100,
  },
  text: {
    textAlign: 'center',
  },
  loader: {
    marginRight: 8,
  },
});

export default Button; 