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
  ScrollView,
  InputAccessoryView,
  TouchableWithoutFeedback,
} from "react-native";
import { useNavigation, useRoute, RouteProp } from "@react-navigation/native";
import { StackNavigationProp } from "@react-navigation/stack";
import { useForm, Controller } from "react-hook-form";
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
  updateBloodSugarReading,
} from "../../services/database";
import Container from "../../components/Container";
import Input from "../../components/Input";
import Button from "../../components/Button";
import Card from "../../components/Card";
import { Ionicons } from "@expo/vector-icons";
import { useApp } from "../../contexts/AppContext";
import { MainStackParamList } from "../../types";
import DateTimeField from "../../components/DateTimeField";

const inputAccessoryViewID = "inputAccessoryViewGlucoseScreen";

type FormData = {
  value: string;
  mealContext: "before_meal" | "after_meal" | "fasting" | "bedtime" | "other";
  notes: string;
};

type RouteParams = RouteProp<MainStackParamList, "AddGlucose">;

const AddGlucoseScreen: React.FC = () => {
  const { authState } = useAuth();
  const navigation = useNavigation<StackNavigationProp<any>>();
  const route = useRoute<RouteParams>();
  const { settings } = useApp();
  const [isLoading, setIsLoading] = useState(false);
  const [showMealContextPicker, setShowMealContextPicker] = useState(false);
  const [keyboardVisible, setKeyboardVisible] = useState(false);
  const [timestamp, setTimestamp] = useState(new Date());
  const isEditing = route.params?.isEditing;

  const {
    control,
    handleSubmit,
    formState: { errors },
    reset,
    setValue,
    getValues,
  } = useForm<FormData>({
    defaultValues: {
      value: "",
      mealContext: "before_meal",
      notes: "",
    },
  });

  useEffect(() => {
    const keyboardDidShowListener = Keyboard.addListener(
      Platform.OS === "ios" ? "keyboardWillShow" : "keyboardDidShow",
      () => setKeyboardVisible(true)
    );
    const keyboardDidHideListener = Keyboard.addListener(
      Platform.OS === "ios" ? "keyboardWillHide" : "keyboardDidHide",
      () => setKeyboardVisible(false)
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

  const handleSave = async (data: FormData) => {
    try {
      setIsLoading(true);
      const readingData = {
        value: parseFloat(data.value),
        timestamp: timestamp.getTime(),
        context: data.mealContext,
        notes: data.notes.trim(),
      };

      if (route.params?.initialData) {
        await updateBloodSugarReading(route.params.initialData.id, readingData);
        Alert.alert("Success", "Blood sugar reading updated successfully");
      } else {
        await addBloodSugarReading(readingData);
        Alert.alert("Success", "Blood sugar reading added successfully");
        reset();
      }

      navigation.goBack();
    } catch (error) {
      console.error("Error saving blood sugar reading:", error);
      Alert.alert("Error", "Failed to save blood sugar reading");
    } finally {
      setIsLoading(false);
    }
  };

  const getStatusColor = (value: string) => {
    const numValue = parseFloat(value);
    if (isNaN(numValue)) return COLORS.text;
    if (numValue < NORMAL_SUGAR_MIN) return COLORS.warning;
    if (numValue > NORMAL_SUGAR_MAX) return COLORS.danger;
    return COLORS.success;
  };

  const getMealContextLabel = (value: string) => {
    const context = MEAL_CONTEXTS.find((ctx) => ctx.value === value);
    return context ? context.label : "Before Meal";
  };

  const renderMealContextModal = () => (
    <Modal
      visible={showMealContextPicker}
      transparent
      statusBarTranslucent
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
                  getValues().mealContext === context.value &&
                    styles.selectedMealContext,
                ]}
                onPress={() => {
                  setValue("mealContext", context.value as FormData["mealContext"]);
                  setShowMealContextPicker(false);
                }}
              >
                <Text
                  style={[
                    styles.mealContextText,
                    getValues().mealContext === context.value &&
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
                        >
                          {value || "---"}
                        </Text>
                        <Text style={styles.unitText}>mg/dL</Text>
                      </View>
                    </View>
                  )}
                  name="value"
                />

                <DateTimeField
                  label={"Date & Time"}
                  timestamp={timestamp}
                  onChange={setTimestamp}
                />

                <View style={styles.mealContextContainer}>
                  <Text style={styles.label}>Meal Context</Text>
                  <TouchableOpacity
                    style={styles.mealContextButton}
                    onPress={() => setShowMealContextPicker(true)}
                  >
                    <Text style={styles.mealContextButtonText}>
                      {getMealContextLabel(getValues().mealContext)}
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
                  name="notes"
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
                />

                <View style={styles.buttonGroup}>
                  <Button
                    title="Cancel"
                    variant="outline"
                    onPress={() => navigation.goBack()}
                    style={styles.cancelButton}
                    disabled={isLoading}
                  />
                  <Button
                    title={isEditing ? "Update" : "Save"}
                    onPress={handleSubmit(handleSave)}
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
});

export default AddGlucoseScreen;
