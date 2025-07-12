import React from "react";
import { View, TouchableOpacity, ViewProps } from "react-native";

interface CardProps extends ViewProps {
  children: React.ReactNode;
  variant?: "default" | "elevated" | "outline" | "flat";
  onPress?: () => void;
  className?: string;
}

const Card: React.FC<CardProps> = ({
  children,
  variant = "default",
  onPress,
  className = "",
  ...rest
}) => {
  const variantClass = {
    default: "bg-white",
    elevated: "bg-white shadow-md",
    outline: "bg-white border border-gray-300",
    flat: "bg-white border border-gray-300 shadow-none",
  }[variant];

  const baseClass = `rounded-md p-4 mb-2 ${variantClass} ${className}`;

  if (onPress) {
    return (
      <TouchableOpacity
        className={baseClass}
        onPress={onPress}
        activeOpacity={0.8}
        {...rest}
      >
        {children}
      </TouchableOpacity>
    );
  }

  return (
    <View className={baseClass} {...rest}>
      {children}
    </View>
  );
};

export default Card;
