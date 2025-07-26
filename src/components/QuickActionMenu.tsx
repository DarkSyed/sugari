import { useRef, useState } from "react";
import { ROUTES } from "../types";
import { Ionicons } from "@expo/vector-icons";
import { Animated, Easing, View, TouchableOpacity, Text } from "react-native";

const QuickActionMenu = () => {
  const [isExpanded, setIsExpanded] = useState(false);
  const animationValue = useRef(new Animated.Value(0)).current;
  const rotationValue = useRef(new Animated.Value(0)).current;

  const actions = [
    {
      id: "meal",
      title: "Add a Meal",
      icon: "restaurant-outline",
      route: ROUTES.ADD_FOOD,
    },
    {
      id: "activity",
      title: "Add Activity",
      icon: "pulse-outline",
      route: null,
    },
    {
      id: "measurement",
      title: "Add a Reading",
      icon: "stats-chart-outline",
      route: null,
    },
    { id: "scan", title: "Scan Sensor", icon: "scan-outline", route: null },
  ];

  const toggleMenu = () => {
    const toValue = Number(!isExpanded);

    Animated.parallel([
      Animated.timing(animationValue, {
        toValue,
        duration: 250,
        easing: Easing.out(Easing.ease),
        useNativeDriver: true,
      }),
      Animated.timing(rotationValue, {
        toValue,
        duration: 250,
        easing: Easing.out(Easing.ease),
        useNativeDriver: true,
      }),
    ]).start();

    setIsExpanded(!isExpanded);
  };

  const handleActionPress = () => {
    toggleMenu();
  };

  const rotation = rotationValue.interpolate({
    inputRange: [0, 1],
    outputRange: ["0deg", "135deg"],
  });

  const menuOpacity = animationValue.interpolate({
    inputRange: [0, 1],
    outputRange: [0, 1],
  });

  return (
    <View className="flex-1 justify-end items-center">
      <TouchableOpacity
        className="flex-1"
        onPress={toggleMenu}
        activeOpacity={1}
      />

      <Animated.View
        className="absolute bottom-24 bg-gray-800 rounded-2xl shadow-lg z-20 w-64"
        style={{
          opacity: menuOpacity,
          pointerEvents: isExpanded ? "auto" : "none",
        }}
      >
        {actions.map((action, index) => (
          <TouchableOpacity
            key={action.id}
            className={`flex-row items-center py-4 px-4 ${
              index !== actions.length - 1 ? "border-b border-gray-700" : ""
            }`}
            onPress={() => handleActionPress()}
            activeOpacity={0.7}
          >
            <View className="w-6 h-6 justify-center items-center mr-4">
              <Ionicons
                name={action.icon as keyof typeof Ionicons.glyphMap}
                size={20}
                color="#FFFFFF"
              />
            </View>
            <Text className="text-white text-base font-normal flex-1">
              {action.title}
            </Text>
          </TouchableOpacity>
        ))}
      </Animated.View>

      <View className="mb-1">
        <TouchableOpacity
          className="w-[68px] h-[68px] rounded-full bg-blue-400 justify-center items-center shadow-lg z-30"
          onPress={toggleMenu}
          activeOpacity={0.8}
          style={{
            elevation: 8,
            shadowColor: "#000",
            shadowOffset: { width: 0, height: 4 },
            shadowOpacity: 0.3,
            shadowRadius: 8,
          }}
        >
          <Animated.View style={{ transform: [{ rotate: rotation }] }}>
            <Ionicons name="add" size={32} color="#111827" />
          </Animated.View>
        </TouchableOpacity>
      </View>
    </View>
  );
};

export default QuickActionMenu;
