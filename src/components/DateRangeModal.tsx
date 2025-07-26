import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  Platform,
} from "react-native";
import DateTimePicker from "@react-native-community/datetimepicker";
import { Ionicons } from "@expo/vector-icons";
import { COLORS, SIZES } from "../constants";
import Button from "./Button";

interface DateRangeModalProps {
  visible: boolean;
  onClose: () => void;
  onApply: (startDate: Date, endDate: Date) => void;
}

const DateRangeModal: React.FC<DateRangeModalProps> = ({
  visible,
  onClose,
  onApply,
}) => {
  const [startDate, setStartDate] = useState(
    new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
  ); // Default to 30 days ago
  const [endDate, setEndDate] = useState(new Date());
  const [showStartPicker, setShowStartPicker] = useState(false);
  const [showEndPicker, setShowEndPicker] = useState(false);

  const handleStartDateChange = (event: any, selectedDate?: Date) => {
    const currentDate = selectedDate || startDate;
    setShowStartPicker(Platform.OS === "ios");
    setStartDate(currentDate);
  };

  const handleEndDateChange = (event: any, selectedDate?: Date) => {
    const currentDate = selectedDate || endDate;
    setShowEndPicker(Platform.OS === "ios");
    setEndDate(currentDate);
  };

  const formatDate = (date: Date) => {
    return date.toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  const handleApply = () => {
    if (startDate > endDate) {
      // If start date is after end date, swap them
      const temp = startDate;
      setStartDate(endDate);
      setEndDate(temp);
      onApply(endDate, temp);
    } else {
      onApply(startDate, endDate);
    }
  };

  const handleQuickSelect = (days: number) => {
    const end = new Date();
    const start = new Date(end.getTime() - days * 24 * 60 * 60 * 1000);
    setStartDate(start);
    setEndDate(end);
  };

  return (
    <Modal
      visible={visible}
      transparent={true}
      animationType="slide"
      onRequestClose={onClose}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Select Date Range</Text>
            <TouchableOpacity onPress={onClose} style={styles.closeButton}>
              <Ionicons name="close" size={24} color={COLORS.text} />
            </TouchableOpacity>
          </View>

          <View style={styles.quickSelectContainer}>
            <Text style={styles.sectionTitle}>Quick Select</Text>
            <View style={styles.quickSelectButtons}>
              <TouchableOpacity
                style={styles.quickSelectButton}
                onPress={() => handleQuickSelect(7)}
              >
                <Text style={styles.quickSelectText}>Last 7 days</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.quickSelectButton}
                onPress={() => handleQuickSelect(30)}
              >
                <Text style={styles.quickSelectText}>Last 30 days</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.quickSelectButton}
                onPress={() => handleQuickSelect(90)}
              >
                <Text style={styles.quickSelectText}>Last 90 days</Text>
              </TouchableOpacity>
            </View>
          </View>

          <View style={styles.dateSelectionContainer}>
            <Text style={styles.sectionTitle}>Custom Range</Text>

            <View style={styles.datePickerRow}>
              <Text style={styles.dateLabel}>Start Date:</Text>
              <TouchableOpacity
                style={styles.datePickerButton}
                onPress={() => setShowStartPicker(true)}
              >
                <Text style={styles.dateText}>{formatDate(startDate)}</Text>
                <Ionicons
                  name="calendar-outline"
                  size={20}
                  color={COLORS.primary}
                />
              </TouchableOpacity>
            </View>

            {showStartPicker && (
              <DateTimePicker
                value={startDate}
                mode="date"
                display={Platform.OS === "ios" ? "spinner" : "default"}
                onChange={handleStartDateChange}
                maximumDate={new Date()}
              />
            )}

            <View style={styles.datePickerRow}>
              <Text style={styles.dateLabel}>End Date:</Text>
              <TouchableOpacity
                style={styles.datePickerButton}
                onPress={() => setShowEndPicker(true)}
              >
                <Text style={styles.dateText}>{formatDate(endDate)}</Text>
                <Ionicons
                  name="calendar-outline"
                  size={20}
                  color={COLORS.primary}
                />
              </TouchableOpacity>
            </View>

            {showEndPicker && (
              <DateTimePicker
                value={endDate}
                mode="date"
                display={Platform.OS === "ios" ? "spinner" : "default"}
                onChange={handleEndDateChange}
                maximumDate={new Date()}
                minimumDate={startDate}
              />
            )}
          </View>

          <View style={styles.buttonContainer}>
            <Button
              title="Cancel"
              variant="outline"
              onPress={onClose}
              style={styles.button}
            />
            <Button title="Apply" onPress={handleApply} style={styles.button} />
          </View>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "flex-end",
  },
  modalContent: {
    backgroundColor: COLORS.background,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: SIZES.lg,
    maxHeight: "80%",
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: SIZES.md,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: COLORS.text,
  },
  closeButton: {
    padding: SIZES.xs,
  },
  quickSelectContainer: {
    marginBottom: SIZES.md,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: COLORS.text,
    marginBottom: SIZES.sm,
  },
  quickSelectButtons: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  quickSelectButton: {
    backgroundColor: COLORS.cardBackground,
    paddingVertical: SIZES.sm,
    paddingHorizontal: SIZES.md,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  quickSelectText: {
    color: COLORS.primary,
    fontWeight: "500",
  },
  dateSelectionContainer: {
    marginBottom: SIZES.lg,
  },
  datePickerRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: SIZES.md,
  },
  dateLabel: {
    fontSize: 16,
    color: COLORS.text,
    fontWeight: "500",
  },
  datePickerButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: COLORS.cardBackground,
    paddingVertical: SIZES.sm,
    paddingHorizontal: SIZES.md,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  dateText: {
    color: COLORS.text,
    marginRight: SIZES.sm,
  },
  buttonContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  button: {
    flex: 1,
    marginHorizontal: SIZES.xs,
  },
});

export default DateRangeModal;
