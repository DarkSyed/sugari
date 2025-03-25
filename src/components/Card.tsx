import React from 'react';
import { View, StyleSheet, ViewStyle } from 'react-native';
import { COLORS, SIZES } from '../constants';

interface CardProps {
  children: React.ReactNode;
  style?: ViewStyle;
  variant?: 'default' | 'elevated' | 'outline';
  padding?: 'none' | 'small' | 'medium' | 'large';
}

const Card: React.FC<CardProps> = ({
  children,
  style,
  variant = 'default',
  padding = 'medium',
}) => {
  const getCardStyle = (): ViewStyle => {
    let baseStyle: ViewStyle = {
      backgroundColor: COLORS.cardBackground,
      borderRadius: SIZES.sm,
    };

    // Variant styles
    switch (variant) {
      case 'elevated':
        baseStyle = {
          ...baseStyle,
          shadowColor: '#000',
          shadowOffset: { width: 0, height: 2 },
          shadowOpacity: 0.1,
          shadowRadius: 4,
          elevation: 2,
        };
        break;
      case 'outline':
        baseStyle = {
          ...baseStyle,
          backgroundColor: 'white',
          borderWidth: 1,
          borderColor: COLORS.border,
        };
        break;
      case 'default':
      default:
        break;
    }

    // Padding styles
    switch (padding) {
      case 'none':
        break;
      case 'small':
        baseStyle = {
          ...baseStyle,
          padding: SIZES.sm,
        };
        break;
      case 'large':
        baseStyle = {
          ...baseStyle,
          padding: SIZES.lg,
        };
        break;
      case 'medium':
      default:
        baseStyle = {
          ...baseStyle,
          padding: SIZES.md,
        };
        break;
    }

    return baseStyle;
  };

  return (
    <View style={[styles.card, getCardStyle(), style]}>
      {children}
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    width: '100%',
    marginBottom: SIZES.md,
  },
});

export default Card; 