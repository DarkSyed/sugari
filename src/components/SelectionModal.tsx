import React, { useEffect, useRef, useState } from "react";
import { View, Text, TouchableOpacity, Modal, Animated } from "react-native";
import { Ionicons } from "@expo/vector-icons";

export interface SelectionOptions {
  value: string;
  label: string;
}

interface SelectionModalProps {
  visible: boolean;
  onClose: () => void;
  title: string;
  options: SelectionOptions[];
  selectedValue: string;
  onSelect: (value: string) => void;
}

const SelectionModal: React.FC<SelectionModalProps> = ({
  visible,
  onClose,
  title,
  options,
  selectedValue,
  onSelect,
}) => {
  const [modalVisible, setModalVisible] = useState(false);
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(300)).current;

  useEffect(() => {
    if (visible) {
      setModalVisible(true);
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 200,
          useNativeDriver: true,
        }),
        Animated.timing(slideAnim, {
          toValue: 0,
          duration: 300,
          useNativeDriver: true,
        }),
      ]).start();
    } else if (modalVisible) {
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 0,
          duration: 150,
          useNativeDriver: true,
        }),
        Animated.timing(slideAnim, {
          toValue: 300,
          duration: 250,
          useNativeDriver: true,
        }),
      ]).start(() => {
        setModalVisible(false);
      });
    }
  }, [visible, fadeAnim, slideAnim, modalVisible]);

  const handleClose = () => {
    onClose();
  };

  const handleSelect = (value: string) => {
    onSelect(value);
    onClose();
  };

  return (
    <Modal
      visible={modalVisible}
      transparent
      statusBarTranslucent={true}
      animationType="none"
      onRequestClose={handleClose}
    >
      <Animated.View
        className="flex-1 justify-end"
        style={{
          backgroundColor: "rgba(0, 0, 0, 0.5)",
          opacity: fadeAnim,
        }}
      >
        <TouchableOpacity
          className="flex-1"
          onPress={handleClose}
          activeOpacity={1}
        />

        <Animated.View
          className="bg-white rounded-t-xl p-4 max-h-[70%]"
          style={{
            transform: [{ translateY: slideAnim }],
          }}
        >
          <View className="flex-row justify-between items-center mb-4">
            <Text className="text-lg font-bold text-gray-800">{title}</Text>
            <TouchableOpacity
              onPress={handleClose}
              accessibilityLabel={`Close ${title.toLowerCase()}`}
              accessibilityRole="button"
            >
              <Ionicons name="close" size={24} color="#111827" />
            </TouchableOpacity>
          </View>

          <View className="mb-4">
            {options.map((option) => {
              const isSelected = selectedValue === option.value;
              return (
                <TouchableOpacity
                  key={option.value}
                  className={`py-2 px-4 rounded mb-1 ${
                    isSelected ? "bg-primary/10" : "bg-white"
                  }`}
                  onPress={() => handleSelect(option.value)}
                  accessibilityLabel={option.label}
                  accessibilityHint={
                    isSelected ? "Currently selected" : "Tap to select"
                  }
                  accessibilityRole="button"
                  accessibilityState={{ selected: isSelected }}
                >
                  <Text
                    className={`text-base ${
                      isSelected ? "text-primary font-bold" : "text-gray-800"
                    }`}
                  >
                    {option.label}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </Animated.View>
      </Animated.View>
    </Modal>
  );
};

export default SelectionModal;
