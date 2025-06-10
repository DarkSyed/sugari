import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  Alert,
  TouchableOpacity,
  Platform,
  Modal,
  KeyboardAvoidingView,
  ScrollView,
  Keyboard,
  InputAccessoryView,
  TouchableWithoutFeedback,
} from "react-native";
import { useNavigation, useRoute, RouteProp } from "@react-navigation/native";
import { StackNavigationProp } from "@react-navigation/stack";
import { useForm, Controller } from "react-hook-form";
import { Ionicons } from "@expo/vector-icons";
import { COLORS, SIZES, VALIDATION } from "../../constants";
import { useAuth } from "../../contexts/AuthContext";
import { addFoodEntry, updateFoodEntry } from "../../services/database";
import Container from "../../components/Container";
import Input from "../../components/Input";
import Button from "../../components/Button";
import Card from "../../components/Card";
import { MainStackParamList } from "../../types";
import DateTimeField from "../../components/DateTimeField";

const inputAccessoryViewID = "inputAccessoryViewFoodScreen";

type FormData = {
  name: string;
  carbs: string;
  meal_type: "breakfast" | "lunch" | "dinner" | "snack";
  notes: string;
};

const MEAL_OPTIONS = [
  { label: "Breakfast", value: "breakfast" },
  { label: "Lunch", value: "lunch" },
  { label: "Dinner", value: "dinner" },
  { label: "Snack", value: "snack" },
];

type RouteParams = RouteProp<MainStackParamList, "AddFood">;

const AddFoodScreen: React.FC = () => {
  const { authState } = useAuth();
  const navigation = useNavigation<StackNavigationProp<any>>();
  const route = useRoute<RouteParams>();
  const [isLoading, setIsLoading] = useState(false);
  const [timestamp, setTimestamp] = useState(new Date());
  const [showMealPicker, setShowMealPicker] = useState(false);
  const [keyboardVisible, setKeyboardVisible] = useState(false);
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
      name: "",
      carbs: "",
      meal_type: "breakfast",
      notes: "",
    },
  });

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
      setValue("name", route.params.initialData.name);
      setValue("carbs", route.params.initialData.carbs?.toString() || "");
      setValue(
        "meal_type",
        (route.params.initialData.meal_type ||
          "breakfast") as FormData["meal_type"]
      );
      setTimestamp(new Date(route.params.initialData.timestamp));
    }
  }, [route.params, setValue]);

  const onSubmit = async (data: FormData) => {
    try {
      setIsLoading(true);
      const readingData = {
        name: data.name,
        carbs: parseFloat(data.carbs),
        timestamp: timestamp.getTime(),
        meal_type: data.meal_type,
        notes: data.notes.trim(),
      };

      if (route.params?.initialData) {
        await updateFoodEntry(route.params.initialData.id, readingData);
        Alert.alert("Success", "Food entry updated successfully");
      } else {
        await addFoodEntry(readingData);
        Alert.alert("Success", "Food entry reading added successfully");
        reset();
      }

      navigation.goBack();
    } catch (error) {
      console.error("Error saving food entry:", error);
      Alert.alert("Error", "Failed to save food entry. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const getMealLabel = (value: string) => {
    const meal = MEAL_OPTIONS.find((m) => m.value === value);
    return meal ? meal.label : "Breakfast";
  };

  const renderMealContextModal = () => {
    return (
      <Modal
        visible={showMealPicker}
        transparent
        statusBarTranslucent={true}
        animationType="slide"
        onRequestClose={() => setShowMealPicker(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Select Meal</Text>
              <TouchableOpacity onPress={() => setShowMealPicker(false)}>
                <Ionicons name="close" size={24} color={COLORS.text} />
              </TouchableOpacity>
            </View>

            <View style={styles.mealContextList}>
              {MEAL_OPTIONS.map((meal) => (
                <TouchableOpacity
                  key={meal.value}
                  style={[
                    styles.mealContextItem,
                    getValues().meal_type === meal.value &&
                      styles.selectedMealContext,
                  ]}
                  onPress={() => {
                    setValue("meal_type", meal.value as any);
                    setShowMealPicker(false);
                  }}
                >
                  <Text
                    style={[
                      styles.mealContextText,
                      getValues().meal_type === meal.value &&
                        styles.selectedMealContextText,
                    ]}
                  >
                    {meal.label}
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
                    {isEditing ? "Edit Food" : "Add Food"}
                  </Text>
                </View>
                <View style={styles.headerSpacer} />
              </View>

              <Card variant="elevated" style={styles.inputCard}>
                <Controller
                  control={control}
                  rules={{
                    required: VALIDATION.REQUIRED,
                  }}
                  render={({ field: { onChange, onBlur, value } }) => (
                    <Input
                      label="Food Name"
                      placeholder="Enter food name"
                      value={value}
                      onChangeText={onChange}
                      onBlur={onBlur}
                      error={errors.name?.message}
                      touched={value !== ""}
                    />
                  )}
                  name="name"
                />

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
                        parseFloat(value) > 0 || VALIDATION.CARBS_MIN,
                      max: (value) =>
                        parseFloat(value) <= 500 || VALIDATION.CARBS_MAX,
                    },
                  }}
                  render={({ field: { onChange, onBlur, value } }) => (
                    <Input
                      label="Carbohydrates (g)"
                      placeholder="Enter carbs"
                      keyboardType="numeric"
                      value={value}
                      onChangeText={onChange}
                      onBlur={onBlur}
                      error={errors.carbs?.message}
                      touched={value !== ""}
                      inputAccessoryViewID={
                        Platform.OS === "ios" ? inputAccessoryViewID : undefined
                      }
                    />
                  )}
                  name="carbs"
                />

                <DateTimeField
                  label={"When did you eat this?"}
                  timestamp={timestamp}
                  onChange={setTimestamp}
                />

                <View style={styles.mealContextContainer}>
                  <Text style={styles.label}>Meal</Text>
                  <TouchableOpacity
                    style={styles.mealContextButton}
                    onPress={() => setShowMealPicker(true)}
                  >
                    <Text style={styles.mealContextButtonText}>
                      {getMealLabel(getValues().meal_type)}
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
                      placeholder="Add any additional notes"
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
                    onPress={() => navigation.goBack()}
                    style={styles.cancelButton}
                    disabled={isLoading}
                  />
                  <Button
                    title={isEditing ? "Update" : "Save"}
                    onPress={handleSubmit(onSubmit)}
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

export default AddFoodScreen;
