import React from "react";
import {
  View,
  Text,
  TouchableOpacity,
  Platform,
  StyleSheet,
  ViewStyle,
} from "react-native";
import DateTimePicker from "@react-native-community/datetimepicker";
import { Ionicons } from "@expo/vector-icons";
import { formatDate, formatTime } from "../utils/dateUtils";
import { useDateTimePicker } from "../hooks/useDateTimePicker";
import { COLORS, SIZES } from "../constants";

type Props = {
  label?: string;
  timestamp: Date;
  onChange: (date: Date) => void;
};

const DateTimeField: React.FC<Props> = ({ label, timestamp, onChange }) => {
  const {
    showDatePicker,
    showTimePicker,
    tempDate,
    tempTime,
    toggleDatePicker,
    toggleTimePicker,
    onDateChange,
    onTimeChange,
    confirmIosDate,
    confirmIosTime,
  } = useDateTimePicker(timestamp, onChange);

  const dateTimePickerStyle: ViewStyle =
    Platform.OS === "ios"
      ? {
          alignSelf: "center" as ViewStyle["alignSelf"],
          marginBottom: SIZES.md,
          width: "100%",
        }
      : {};

  return (
    <View style={{ marginBottom: SIZES.md }}>
      <Text style={styles.label}>{label}</Text>
      <View style={styles.row}>
        <TouchableOpacity onPress={toggleDatePicker} style={styles.button}>
          <Text style={styles.text}>{formatDate(timestamp)}</Text>
          <Ionicons name="calendar-outline" size={18} color={COLORS.primary} />
        </TouchableOpacity>
        <TouchableOpacity onPress={toggleTimePicker} style={styles.button}>
          <Text style={styles.text}>{formatTime(timestamp)}</Text>
          <Ionicons name="time-outline" size={18} color={COLORS.primary} />
        </TouchableOpacity>
      </View>

      {Platform.OS === "ios" && showDatePicker && (
        <>
          <DateTimePicker
            value={tempDate || timestamp}
            mode="date"
            display="spinner"
            onChange={onDateChange}
            style={dateTimePickerStyle}
          />
          <View style={styles.pickerButtons}>
            <TouchableOpacity onPress={toggleDatePicker} style={styles.cancel}>
              <Text style={styles.cancelText}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={confirmIosDate} style={styles.ok}>
              <Text style={styles.okText}>OK</Text>
            </TouchableOpacity>
          </View>
        </>
      )}
      {Platform.OS === "android" && showDatePicker && (
        <DateTimePicker
          value={timestamp}
          mode="date"
          display="default"
          onChange={onDateChange}
        />
      )}

      {Platform.OS === "ios" && showTimePicker && (
        <>
          <DateTimePicker
            value={tempTime || timestamp}
            mode="time"
            display="spinner"
            onChange={onTimeChange}
            style={dateTimePickerStyle}
          />
          <View style={styles.pickerButtons}>
            <TouchableOpacity onPress={toggleTimePicker} style={styles.cancel}>
              <Text style={styles.cancelText}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={confirmIosTime} style={styles.ok}>
              <Text style={styles.okText}>OK</Text>
            </TouchableOpacity>
          </View>
        </>
      )}
      {Platform.OS === "android" && showTimePicker && (
        <DateTimePicker
          value={timestamp}
          mode="time"
          display="default"
          onChange={onTimeChange}
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  label: {
    fontSize: 16,
    fontWeight: "500",
    color: COLORS.text,
    marginBottom: SIZES.xs,
  },
  row: { flexDirection: "row", justifyContent: "space-between" },
  button: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: COLORS.inputBackground,
    padding: SIZES.sm,
    borderRadius: SIZES.xs,
    borderWidth: 1,
    borderColor: COLORS.border,
    width: "48%",
  },
  text: { fontSize: 14, color: COLORS.text },
  pickerButtons: {
    flexDirection: "row",
    justifyContent: "center",
    marginTop: SIZES.xs,
    marginBottom: SIZES.sm,
  },
  cancel: {
    paddingHorizontal: 20,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: "#E0E0E0",
    marginHorizontal: 8,
  },
  ok: {
    paddingHorizontal: 20,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: COLORS.primary,
    marginHorizontal: 8,
  },
  cancelText: { color: COLORS.text, fontWeight: "500" },
  okText: { color: "white", fontWeight: "500" },
});

export default DateTimeField;
