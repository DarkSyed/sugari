import React from "react";
import {
  TouchableOpacity,
  Text,
  ActivityIndicator,
  ViewStyle,
  TextStyle,
} from "react-native";
import { COLORS } from "../constants";

interface ButtonProps {
  title: string;
  onPress: () => void;
  variant?: "primary" | "secondary" | "outline" | "danger";
  size?: "small" | "medium" | "large";
  disabled?: boolean;
  loading?: boolean;
  className?: string;
  textClassName?: string;
  style?: ViewStyle;
  textStyle?: TextStyle;
}

const Button: React.FC<ButtonProps> = ({
  title,
  onPress,
  variant = "primary",
  size = "medium",
  disabled = false,
  loading = false,
  className = "",
  textClassName = "",
  style,
  textStyle,
}) => {
  const padding = {
    small: "py-2 px-4",
    medium: "py-3 px-5",
    large: "py-4 px-6",
  }[size];

  const buttonVariantClass = {
    primary: "bg-primary",
    secondary: "bg-secondary",
    outline: "border border-primary bg-transparent",
    danger: "bg-red-600",
  }[variant];

  const textSize = {
    small: "text-sm",
    medium: "text-base",
    large: "text-lg",
  }[size];

  const getTextColor = () => {
    switch (variant) {
      case "outline":
        return COLORS.primary;
      case "primary":
      case "secondary":
      case "danger":
      default:
        return "#fff";
    }
  };

  const baseButtonClasses = `rounded-2xl justify-center items-center flex-row min-w-[100px] ${padding} ${buttonVariantClass} ${
    disabled ? "opacity-50" : ""
  } ${className}`;

  const baseTextClasses = `font-bold text-center ${textSize} ${textClassName}`;

  return (
    <TouchableOpacity
      className={baseButtonClasses}
      onPress={onPress}
      disabled={disabled || loading}
      activeOpacity={0.8}
      style={style}
    >
      {loading && (
        <ActivityIndicator
          size="small"
          color={variant === "outline" ? COLORS.primary : "#fff"}
          className="mr-2"
        />
      )}
      <Text
        className={baseTextClasses}
        style={[{ color: getTextColor() }, textStyle]}
      >
        {title}
      </Text>
    </TouchableOpacity>
  );
};

export default Button;
