import { useState } from "react";
import { Platform } from "react-native";

export function useDateTimePicker(
  initialDate: Date = new Date(),
  onChange?: (date: Date) => void,
) {
  const [internalTimestamp, setInternalTimestamp] = useState(initialDate);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showTimePicker, setShowTimePicker] = useState(false);
  const [tempDate, setTempDate] = useState<Date | null>(null);
  const [tempTime, setTempTime] = useState<Date | null>(null);

  const updateTimestamp = (newDate: Date) => {
    setInternalTimestamp(newDate);
    onChange?.(newDate);
  };

  const onDateChange = (_event: any, selectedDate?: Date) => {
    if (Platform.OS === "android") {
      setShowDatePicker(false);
      if (selectedDate) updateTimestamp(new Date(selectedDate));
    } else {
      setTempDate(selectedDate ?? null);
    }
  };

  const onTimeChange = (_event: any, selectedTime?: Date) => {
    if (Platform.OS === "android") {
      setShowTimePicker(false);
      if (selectedTime) updateTimestamp(new Date(selectedTime));
    } else {
      setTempTime(selectedTime ?? null);
    }
  };

  const confirmIosDate = () => {
    if (tempDate) {
      const updated = new Date(
        tempDate.getFullYear(),
        tempDate.getMonth(),
        tempDate.getDate(),
        internalTimestamp.getHours(),
        internalTimestamp.getMinutes(),
      );
      updateTimestamp(updated);
    }
    setShowDatePicker(false);
    setTempDate(null);
  };

  const confirmIosTime = () => {
    if (tempTime) {
      const updated = new Date(
        internalTimestamp.getFullYear(),
        internalTimestamp.getMonth(),
        internalTimestamp.getDate(),
        tempTime.getHours(),
        tempTime.getMinutes(),
      );
      updateTimestamp(updated);
    }
    setShowTimePicker(false);
    setTempTime(null);
  };

  return {
    showDatePicker,
    showTimePicker,
    tempDate,
    tempTime,
    toggleDatePicker: () => setShowDatePicker((prev) => !prev),
    toggleTimePicker: () => setShowTimePicker((prev) => !prev),
    onDateChange,
    onTimeChange,
    confirmIosDate,
    confirmIosTime,
  };
}
