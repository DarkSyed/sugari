import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  Alert,
  TouchableOpacity,
  Platform,
  Modal,
  Keyboard,
  KeyboardAvoidingView,
  Dimensions,
  ScrollView,
  InputAccessoryView,
  TouchableWithoutFeedback,
} from "react-native";
import { useNavigation, useRoute, RouteProp } from "@react-navigation/native";
import { StackNavigationProp } from "@react-navigation/stack";
import { useForm, Controller } from "react-hook-form";
import DateTimePicker from "@react-native-community/datetimepicker";
import { Picker } from "@react-native-picker/picker";
import {
  COLORS,
  SIZES,
  VALIDATION,
  NORMAL_SUGAR_MIN,
  NORMAL_SUGAR_MAX,
  MEAL_CONTEXTS,
} from "../../constants";
import { useAuth } from "../../contexts/AuthContext";
import {
  addBloodSugarReading,
  addInsulinDose,
  updateBloodSugarReading,
} from "../../services/database";
import Container from "../../components/Container";
import Input from "../../components/Input";
import Button from "../../components/Button";
import Card from "../../components/Card";
import { Ionicons } from "@expo/vector-icons";
import { ROUTES } from "../../constants";
import { useApp } from "../../contexts/AppContext";
import { formatDate, formatTime } from "../../utils/dateUtils";
import { BloodSugarReading, MainStackParamList } from "../../types";

type FormData = {
  value: string;
  mealContext: "before_meal" | "after_meal" | "fasting" | "bedtime" | "other";
  notes: string;
  insulinType?: string;
};

type RouteParams = RouteProp<MainStackParamList, "AddGlucose">;

const AddGlucoseScreen: React.FC = () => {
  const { authState } = useAuth();
  const navigation = useNavigation<StackNavigationProp<any>>();
  const route = useRoute<RouteParams>();
  const { settings } = useApp();
  const [isLoading, setIsLoading] = useState(false);
  const [timestamp, setTimestamp] = useState(new Date());
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showTimePicker, setShowTimePicker] = useState(false);
  const [showMealContextPicker, setShowMealContextPicker] = useState(false);
  const [tempDate, setTempDate] = useState<Date | null>(null);
  const [tempTime, setTempTime] = useState<Date | null>(null);
  const [keyboardVisible, setKeyboardVisible] = useState(false);
  const inputAccessoryViewID = "inputAccessoryViewGlucoseScreen";
  const isEditing = route.params?.isEditing;

  const {
    control,
    handleSubmit,
    formState: { errors },
    reset,
    watch,
    setValue,
  } = useForm<FormData>({
    defaultValues: {
      value: "",
      mealContext: "before_meal",
      notes: "",
    },
  });

  const mealContext = watch("mealContext");
  const value = watch("value");
  const notes = watch("notes");

  useEffect(() => {
    const keyboardDidShowListener = Keyboard.addListener(
      Platform.OS === "ios" ? "keyboardWillShow" : "keyboardDidShow",
      () => {
        setKeyboardVisible(true);
      }
    );
    const keyboardDidHideListener = Keyboard.addListener(
      Platform.OS === "ios" ? "keyboardWillHide" : "keyboardDidHide",
      () => {
        setKeyboardVisible(false);
      }
    );

    return () => {
      keyboardDidShowListener.remove();
      keyboardDidHideListener.remove();
    };
  }, []);

  useEffect(() => {
    if (route.params?.initialData) {
      setValue("value", route.params.initialData.value.toString());
      setValue(
        "mealContext",
        (route.params.initialData.context ||
          "before_meal") as FormData["mealContext"]
      );
      setValue("notes", route.params.initialData.notes || "");
      setTimestamp(new Date(route.params.initialData.timestamp));
    }
  }, [route.params, setValue]);

  const handleSave = async () => {
    if (!value) {
      Alert.alert("Error", "Please enter a blood sugar value");
      return;
    }

    try {
      setIsLoading(true);

      const readingData = {
        value: parseFloat(value),
        timestamp: timestamp.getTime(),
        context: mealContext,
        notes: notes,
      };

      if (route.params?.initialData) {
        await updateBloodSugarReading(route.params.initialData.id, readingData);
        Alert.alert("Success", "Blood sugar reading updated successfully");
      } else {
        await addBloodSugarReading(readingData);
        Alert.alert("Success", "Blood sugar reading added successfully");
      }

      navigation.goBack();
    } catch (error) {
      console.error("Error saving blood sugar reading:", error);
      Alert.alert("Error", "Failed to save blood sugar reading");
    } finally {
      setIsLoading(false);
    }
  };

  const handleCancel = () => {
    navigation.goBack();
  };

  const dateTimePickerStyle =
    Platform.OS === "ios"
      ? {
          alignSelf: "center" as const,
          marginBottom: SIZES.md,
          width: "100%" as unknown as number,
        }
      : {};

  const showDatepicker = () => {
    if (showDatePicker) {
      setShowDatePicker(false);
    } else {
      setShowTimePicker(false);
      setShowDatePicker(true);
    }
  };

  const showTimepicker = () => {
    if (showTimePicker) {
      setShowTimePicker(false);
    } else {
      setShowDatePicker(false);
      setShowTimePicker(true);
    }
  };

  const confirmIosDate = () => {
    if (tempDate) {
      setTimestamp(tempDate);
    }
    setShowDatePicker(false);
    setTempDate(null);
  };

  const confirmIosTime = () => {
    if (tempTime) {
      setTimestamp(tempTime);
    }
    setShowTimePicker(false);
    setTempTime(null);
  };

  const onDateChange = (event: any, selectedDate?: Date) => {
    if (Platform.OS === "android") {
      setShowDatePicker(false);
      if (event.type === "set" && selectedDate) {
        const currentTime = new Date(timestamp);
        selectedDate.setHours(currentTime.getHours());
        selectedDate.setMinutes(currentTime.getMinutes());
        setTimestamp(selectedDate);
      }
    } else {
      if (selectedDate) {
        const currentTime = new Date(timestamp);
        selectedDate.setHours(currentTime.getHours());
        selectedDate.setMinutes(currentTime.getMinutes());
        setTempDate(selectedDate);
      }
    }
  };

  const onTimeChange = (event: any, selectedTime?: Date) => {
    if (Platform.OS === "android") {
      setShowTimePicker(false);
      if (event.type === "set" && selectedTime) {
        const newDate = new Date(timestamp);
        newDate.setHours(selectedTime.getHours());
        newDate.setMinutes(selectedTime.getMinutes());
        setTimestamp(newDate);
      }
    } else {
      if (selectedTime) {
        const newDate = new Date(timestamp);
        newDate.setHours(selectedTime.getHours());
        newDate.setMinutes(selectedTime.getMinutes());
        setTempTime(newDate);
      }
    }
  };

  const formatDate = (date: Date) => {
    return date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString("en-US", {
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const getStatusColor = (value: string) => {
    const numValue = parseFloat(value);
    if (isNaN(numValue)) {
      return COLORS.text;
    }

    if (numValue < NORMAL_SUGAR_MIN) {
      return COLORS.warning;
    } else if (numValue > NORMAL_SUGAR_MAX) {
      return COLORS.danger;
    }
    return COLORS.success;
  };

  const getMealContextLabel = (value: string) => {
    const context = MEAL_CONTEXTS.find((ctx) => ctx.value === value);
    return context ? context.label : "Before Meal";
  };

  const renderMealContextModal = () => {
    return (
      <Modal
        visible={showMealContextPicker}
        transparent
        statusBarTranslucent={true}
        animationType="slide"
        onRequestClose={() => setShowMealContextPicker(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Select Meal Context</Text>
              <TouchableOpacity onPress={() => setShowMealContextPicker(false)}>
                <Ionicons name="close" size={24} color={COLORS.text} />
              </TouchableOpacity>
            </View>

            <View style={styles.mealContextList}>
              {MEAL_CONTEXTS.map((context) => (
                <TouchableOpacity
                  key={context.value}
                  style={[
                    styles.mealContextItem,
                    mealContext === context.value && styles.selectedMealContext,
                  ]}
                  onPress={() => {
                    setValue("mealContext", context.value as any);
                    setShowMealContextPicker(false);
                  }}
                >
                  <Text
                    style={[
                      styles.mealContextText,
                      mealContext === context.value &&
                        styles.selectedMealContextText,
                    ]}
                  >
                    {context.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        </View>
      </Modal>
    );
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      style={{ flex: 1 }}
      keyboardVerticalOffset={Platform.OS === "ios" ? 90 : 0}
    >
      <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollViewContent}
          bounces={false}
          alwaysBounceVertical={false}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <Container keyboardAvoiding={false}>
            <View style={styles.container}>
              <View style={styles.header}>
                <TouchableOpacity
                  style={styles.backButton}
                  onPress={() => navigation.goBack()}
                >
                  <Ionicons
                    name="arrow-back-outline"
                    size={24}
                    color={COLORS.primary}
                  />
                </TouchableOpacity>
                <View style={styles.headerTitleContainer}>
                  <Text style={styles.title}>
                    {isEditing ? "Edit Blood Sugar" : "Add Blood Sugar"}
                  </Text>
                </View>
                <View style={styles.headerSpacer} />
              </View>

              <Card variant="elevated" style={styles.inputCard}>
                <Controller
                  control={control}
                  rules={{
                    required: VALIDATION.REQUIRED,
                    pattern: {
                      value: /^[0-9]+$/,
                      message: "Please enter a valid number",
                    },
                    validate: {
                      min: (value) =>
                        parseFloat(value) >= 40 || VALIDATION.SUGAR_MIN,
                      max: (value) =>
                        parseFloat(value) <= 400 || VALIDATION.SUGAR_MAX,
                    },
                  }}
                  render={({ field: { onChange, onBlur, value } }) => (
                    <View style={styles.glucoseInputContainer}>
                      <Input
                        label="Blood Glucose"
                        placeholder="Enter value"
                        keyboardType="numeric"
                        value={value}
                        onChangeText={onChange}
                        onBlur={onBlur}
                        error={errors.value?.message}
                        touched={value !== ""}
                        containerStyle={styles.glucoseInput}
                        inputAccessoryViewID={
                          Platform.OS === "ios"
                            ? inputAccessoryViewID
                            : undefined
                        }
                      />
                      <View style={styles.unitContainer}>
                        <Text
                          style={[
                            styles.valuePreview,
                            { color: getStatusColor(value) },
                          ]}
                          numberOfLines={1}
                          ellipsizeMode="tail"
                        >
                          {value ? value : "---"}
                        </Text>
                        <Text style={styles.unitText}>mg/dL</Text>
                      </View>
                    </View>
                  )}
                  name="value"
                />

                <Text style={styles.label}>When was this reading taken?</Text>
                <View style={styles.dateTimeContainer}>
                  <TouchableOpacity
                    style={styles.dateTimeButton}
                    onPress={showDatepicker}
                  >
                    <Text style={styles.dateTimeText}>
                      {formatDate(timestamp)}
                    </Text>
                    <Ionicons
                      name="calendar-outline"
                      size={20}
                      color={COLORS.primary}
                      style={styles.dateTimeIcon}
                    />
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={styles.dateTimeButton}
                    onPress={showTimepicker}
                  >
                    <Text style={styles.dateTimeText}>
                      {formatTime(timestamp)}
                    </Text>
                    <Ionicons
                      name="time-outline"
                      size={20}
                      color={COLORS.primary}
                      style={styles.dateTimeIcon}
                    />
                  </TouchableOpacity>
                </View>

                {/* --- iOS Date Picker --- */}
                {Platform.OS === "ios" && showDatePicker && (
                  <View style={styles.iosPickerContainer}>
                    <DateTimePicker
                      value={tempDate || timestamp}
                      mode="date"
                      display="spinner"
                      onChange={onDateChange}
                      style={dateTimePickerStyle}
                    />
                    <View style={styles.pickerButtonsContainer}>
                      <TouchableOpacity
                        onPress={() => {
                          setShowDatePicker(false);
                          setTempDate(null);
                        }}
                        style={[styles.pickerButton, styles.cancelPickerButton]}
                      >
                        <Text style={styles.cancelPickerButtonText}>
                          Cancel
                        </Text>
                      </TouchableOpacity>
                      <TouchableOpacity
                        onPress={confirmIosDate}
                        style={[styles.pickerButton, styles.okPickerButton]}
                      >
                        <Text style={styles.okPickerButtonText}>OK</Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                )}
                {/* --- Android Date Picker --- */}
                {Platform.OS === "android" && showDatePicker && (
                  <DateTimePicker
                    value={timestamp}
                    mode="date"
                    display="default"
                    onChange={onDateChange}
                  />
                )}

                {/* --- iOS Time Picker --- */}
                {Platform.OS === "ios" && showTimePicker && (
                  <View style={styles.iosPickerContainer}>
                    <DateTimePicker
                      value={tempTime || timestamp}
                      mode="time"
                      display="spinner"
                      onChange={onTimeChange}
                      style={dateTimePickerStyle}
                    />
                    <View style={styles.pickerButtonsContainer}>
                      <TouchableOpacity
                        onPress={() => {
                          setShowTimePicker(false);
                          setTempTime(null);
                        }}
                        style={[styles.pickerButton, styles.cancelPickerButton]}
                      >
                        <Text style={styles.cancelPickerButtonText}>
                          Cancel
                        </Text>
                      </TouchableOpacity>
                      <TouchableOpacity
                        onPress={confirmIosTime}
                        style={[styles.pickerButton, styles.okPickerButton]}
                      >
                        <Text style={styles.okPickerButtonText}>OK</Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                )}
                {/* --- Android Time Picker --- */}
                {Platform.OS === "android" && showTimePicker && (
                  <DateTimePicker
                    value={timestamp}
                    mode="time"
                    display="default"
                    onChange={onTimeChange}
                  />
                )}

                <View style={styles.mealContextContainer}>
                  <Text style={styles.label}>Meal Context</Text>
                  <TouchableOpacity
                    style={styles.mealContextButton}
                    onPress={() => setShowMealContextPicker(true)}
                  >
                    <Text style={styles.mealContextButtonText}>
                      {getMealContextLabel(mealContext)}
                    </Text>
                    <Ionicons
                      name="chevron-down"
                      size={20}
                      color={COLORS.text}
                    />
                  </TouchableOpacity>
                </View>

                <Controller
                  control={control}
                  render={({ field: { onChange, onBlur, value } }) => (
                    <Input
                      label="Notes (optional)"
                      placeholder="Add any notes about this reading"
                      multiline
                      numberOfLines={3}
                      textAlignVertical="top"
                      value={value}
                      onChangeText={onChange}
                      onBlur={onBlur}
                      style={styles.notesInput}
                    />
                  )}
                  name="notes"
                />

                <View style={styles.buttonGroup}>
                  <Button
                    title="Cancel"
                    variant="outline"
                    onPress={handleCancel}
                    style={styles.cancelButton}
                    disabled={isLoading}
                  />
                  <Button
                    title={isEditing ? "Update" : "Save"}
                    onPress={handleSave}
                    loading={isLoading}
                    disabled={isLoading}
                    style={styles.saveButton}
                  />
                </View>
              </Card>
            </View>
            {renderMealContextModal()}

            {Platform.OS === "ios" && (
              <InputAccessoryView nativeID={inputAccessoryViewID}>
                <View style={styles.keyboardAccessory}>
                  <TouchableOpacity
                    style={styles.doneButton}
                    onPress={() => Keyboard.dismiss()}
                  >
                    <Text style={styles.doneButtonText}>Done</Text>
                  </TouchableOpacity>
                </View>
              </InputAccessoryView>
            )}
          </Container>
        </ScrollView>
      </TouchableWithoutFeedback>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  keyboardAvoidingContainer: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  scrollViewContent: {
    flexGrow: 1,
    paddingBottom: SIZES.xl,
  },
  container: {
    flex: 1,
    padding: SIZES.md,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: SIZES.md,
    width: "100%",
  },
  backButton: {
    padding: SIZES.xs,
  },
  headerTitleContainer: {},
  title: {
    fontSize: 18,
    fontWeight: "bold",
    color: COLORS.text,
    textAlign: "center",
  },
  headerSpacer: {
    width: 40,
  },
  inputCard: {
    padding: SIZES.md,
  },
  glucoseInputContainer: {
    flexDirection: "row",
    alignItems: "flex-end",
    marginBottom: SIZES.md,
  },
  glucoseInput: {
    flex: 1,
    minWidth: 0,
    marginBottom: 0,
  },
  unitContainer: {
    flexShrink: 0,
    marginLeft: SIZES.sm,
    alignItems: "flex-end",
    paddingBottom: 10,
    maxWidth: 80,
  },
  valuePreview: {
    fontSize: 24,
    fontWeight: "bold",
    color: COLORS.success,
  },
  unitText: {
    fontSize: 14,
    color: COLORS.lightText,
  },
  insulinInputContainer: {
    flexDirection: "row",
    alignItems: "flex-end",
    marginBottom: SIZES.md,
  },
  insulinInput: {
    flex: 1,
    marginBottom: 0,
  },
  insulinUnitText: {
    marginLeft: SIZES.sm,
    paddingBottom: 10,
    fontSize: 14,
    color: COLORS.lightText,
  },
  label: {
    fontSize: 16,
    fontWeight: "500",
    marginBottom: SIZES.xs,
    color: COLORS.text,
  },
  dateTimeContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: SIZES.md,
  },
  dateTimeButton: {
    width: "48.5%",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: COLORS.inputBackground,
    borderRadius: SIZES.xs,
    paddingVertical: SIZES.sm,
    paddingHorizontal: SIZES.xs,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  dateTimeIcon: {
    marginLeft: SIZES.xs,
  },
  dateTimeText: {
    fontSize: 16,
    color: COLORS.text,
  },
  mealContextContainer: {
    marginBottom: SIZES.md,
  },
  mealContextButton: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: COLORS.inputBackground,
    borderRadius: SIZES.xs,
    padding: SIZES.sm,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  mealContextButtonText: {
    fontSize: 16,
    color: COLORS.text,
  },
  notesInput: {
    height: 80,
  },
  buttonGroup: {
    flexDirection: "row",
    marginTop: SIZES.md,
  },
  cancelButton: {
    flex: 1,
    marginRight: SIZES.sm,
  },
  saveButton: {
    flex: 1,
    marginLeft: SIZES.sm,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "flex-end",
  },
  modalContent: {
    backgroundColor: "white",
    borderTopLeftRadius: SIZES.md,
    borderTopRightRadius: SIZES.md,
    padding: SIZES.md,
    maxHeight: "70%",
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
  mealContextList: {
    marginBottom: SIZES.md,
  },
  mealContextItem: {
    paddingVertical: SIZES.sm,
    paddingHorizontal: SIZES.md,
    borderRadius: SIZES.xs,
    marginBottom: SIZES.xs,
    backgroundColor: "white",
  },
  selectedMealContext: {
    backgroundColor: `${COLORS.primary}20`,
  },
  mealContextText: {
    fontSize: 16,
    color: COLORS.text,
  },
  selectedMealContextText: {
    color: COLORS.primary,
    fontWeight: "bold",
  },
  pickerButtonsContainer: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    paddingTop: SIZES.sm,
  },
  pickerButton: {
    paddingVertical: SIZES.xs + 2,
    paddingHorizontal: SIZES.lg,
    borderRadius: 20,
    marginHorizontal: SIZES.sm,
  },
  cancelPickerButton: {
    backgroundColor: "#E0E0E0",
  },
  okPickerButton: {
    backgroundColor: COLORS.primary,
  },
  cancelPickerButtonText: {
    color: COLORS.text,
    fontSize: 16,
    fontWeight: "500",
  },
  okPickerButtonText: {
    color: "white",
    fontWeight: "bold",
    fontSize: 16,
  },
  keyboardAccessory: {
    height: 44,
    backgroundColor: "#f8f8f8",
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: "#d8d8d8",
    flexDirection: "row",
    justifyContent: "flex-end",
    alignItems: "center",
    paddingHorizontal: 16,
    width: "100%",
  },
  doneButton: {
    padding: 8,
  },
  doneButtonText: {
    color: COLORS.primary,
    fontSize: 16,
    fontWeight: "600",
  },
  iosPickerContainer: {
    borderRadius: SIZES.sm,
    marginBottom: SIZES.md,
  },
});

export default AddGlucoseScreen;
