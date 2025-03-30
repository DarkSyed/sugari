import React from 'react';
import { View, StyleSheet, TouchableOpacity } from 'react-native';
import { COLORS, SIZES } from '../constants';

interface CardProps {
  children: React.ReactNode;
  variant?: 'default' | 'elevated' | 'outline' | 'flat';
  style?: any;
  onPress?: () => void;
}

const Card: React.FC<CardProps> = ({ 
  children, 
  variant = 'default', 
  style, 
  onPress 
}) => {
  const cardStyle = [
    styles.card,
    variant === 'elevated' && styles.elevated,
    variant === 'outline' && styles.outline,
    variant === 'flat' && styles.flat,
    style
  ];

  if (onPress) {
    return (
      <TouchableOpacity
        style={cardStyle}
        onPress={onPress}
        activeOpacity={0.8}
      >
        {children}
      </TouchableOpacity>
    );
  }

  return <View style={cardStyle}>{children}</View>;
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: COLORS.cardBackground,
    borderRadius: SIZES.sm,
    padding: SIZES.md,
    marginBottom: SIZES.sm,
  },
  elevated: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  outline: {
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  flat: {
    backgroundColor: COLORS.cardBackground,
    borderWidth: 1,
    borderColor: COLORS.border,
    shadowOpacity: 0,
    elevation: 0,
  },
});

export default Card; 