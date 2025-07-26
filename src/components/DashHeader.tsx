import React, { useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  SafeAreaView,
  ScrollView,
  useWindowDimensions,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { DayData, DashHeaderProps, DaySelectorProps } from "../types";

const dayLetters = ["S", "M", "T", "W", "T", "F", "S"];

const generateDays = (): DayData[] => {
  const days: DayData[] = [];
  const today = new Date();

  for (let i = 13; i >= 0; i--) {
    const date = new Date(today);
    date.setDate(today.getDate() - i);

    days.push({
      dayLetter: dayLetters[date.getDay()],
      date: date.getDate(),
      avgGlucose: Math.floor(Math.random() * 40) + 80,
      isSelected: false,
      isToday: isSameDate(date, today),
    });
  }

  return days;
};

const isSameDate = (d1: Date, d2: Date): boolean =>
  d1.getDate() === d2.getDate() &&
  d1.getMonth() === d2.getMonth() &&
  d1.getFullYear() === d2.getFullYear();

const DaySelector: React.FC<DaySelectorProps> = ({
  days,
  selectedIndex,
  onDaySelect,
}) => {
  const { width } = useWindowDimensions();
  return (
    <View className="bg-gray-900 rounded-2xl pb-3">
      <ScrollView horizontal showsHorizontalScrollIndicator={false}>
        <View className="flex-row gap-10 px-2">
          {days.map((day, index) => {
            const isSelected = selectedIndex === index;
            return (
              <TouchableOpacity
                key={index}
                onPress={() => onDaySelect?.(index)}
                className="items-center"
              >
                <Text
                  className={`text-sm mb-1 ${isSelected ? "text-white" : "text-gray-400"}`}
                >
                  {day.dayLetter}
                </Text>
                <View
                  className={`w-10 h-10 items-center justify-center rounded-full ${
                    isSelected ? "bg-blue-300" : "bg-gray-800"
                  }`}
                >
                  <Text
                    className={`text-sm font-medium ${
                      isSelected ? "text-blue-900" : "text-gray-400"
                    }`}
                  >
                    {day.avgGlucose}
                  </Text>
                </View>
              </TouchableOpacity>
            );
          })}
        </View>
      </ScrollView>
    </View>
  );
};

const Header: React.FC<DashHeaderProps> = ({
  selectedDay,
  onProfilePress,
  onCalendarPress,
  onCGMPress,
  onNotificationPress,
}) => {
  const displayDate = selectedDay?.isToday
    ? "Today"
    : new Date().setDate(selectedDay?.date ?? 0) &&
      new Date(
        new Date().getFullYear(),
        new Date().getMonth(),
        selectedDay?.date,
      ).toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
      });

  return (
    <SafeAreaView className="bg-gray-900">
      <View className="flex-row justify-between items-center px-4 py-3">
        <View className="flex-row items-center space-x-5">
          <TouchableOpacity onPress={onProfilePress}>
            <Ionicons name="person-circle-outline" size={34} color="#FFFFFF" />
          </TouchableOpacity>
          <TouchableOpacity
            onPress={onCalendarPress}
            className="flex-row items-center space-x-2 pl-6"
          >
            <Ionicons name="calendar-outline" size={22} color="#FFFFFF" />
            <Text className="text-white text-lg font-medium pl-1">
              {displayDate}
            </Text>
          </TouchableOpacity>
        </View>

        <View className="flex-row items-center space-x-4 gap-2">
          <TouchableOpacity onPress={onCGMPress}>
            <View className="flex-row items-center">
              <Ionicons name="radio-outline" size={26} color="#90D5FF" />
            </View>
          </TouchableOpacity>
          <TouchableOpacity onPress={onNotificationPress}>
            <Ionicons name="notifications" size={22} color="white" />
          </TouchableOpacity>
        </View>
      </View>
    </SafeAreaView>
  );
};

const DashHeader: React.FC = () => {
  const [days] = useState<DayData[]>(generateDays());
  const [selectedIndex, setSelectedIndex] = useState(
    days.findIndex((d) => d.isToday),
  );
  const selectedDay = days[selectedIndex];

  return (
    <View className="bg-gray-900">
      <Header
        selectedDay={selectedDay}
        onProfilePress={() => console.log("Profile pressed")}
        onCalendarPress={() => console.log("Calendar pressed")}
        onCGMPress={() => console.log("CGM pressed")}
        onNotificationPress={() => console.log("Notification pressed")}
      />
      <View>
        <DaySelector
          days={days}
          selectedIndex={selectedIndex}
          onDaySelect={setSelectedIndex}
        />
      </View>
    </View>
  );
};

export default DashHeader;
