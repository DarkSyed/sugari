import React, { useState, useEffect } from "react";
import { View, Text, Alert, TouchableOpacity, Platform } from "react-native";
import { useNavigation, useRoute, RouteProp } from "@react-navigation/native";
import { StackNavigationProp } from "@react-navigation/stack";
import { useForm, Controller } from "react-hook-form";
import { KeyboardAwareScrollView } from "react-native-keyboard-aware-scroll-view";
import {
  COLORS,
  VALIDATION,
  NORMAL_SUGAR_MIN,
  NORMAL_SUGAR_MAX,
  MEAL_CONTEXTS,
} from "../../constants";
import {
  addBloodSugarReading,
  updateBloodSugarReading,
} from "../../services/database";
import Container from "../../components/Container";
import Input from "../../components/Input";
import Button from "../../components/Button";
import Card from "../../components/Card";
import { Ionicons } from "@expo/vector-icons";
import { MainStackParamList, ROUTES } from "../../types";
import DateTimeField from "../../components/DateTimeField";
import SelectionModal from "../../components/SelectionModal";

const inputAccessoryViewID = "inputAccessoryViewGlucoseScreen";

type FormData = {
  value: string;
  mealContext: "before_meal" | "after_meal" | "fasting" | "bedtime" | "other";
  notes: string;
};

type NavigationProp = StackNavigationProp<MainStackParamList>;
type RouteParams = RouteProp<MainStackParamList, typeof ROUTES.ADD_GLUCOSE>;

const AddGlucoseScreen: React.FC = () => {
  const navigation = useNavigation<NavigationProp>();
  const route = useRoute<RouteParams>();
  const [isLoading, setIsLoading] = useState(false);
  const [showMealContextPicker, setShowMealContextPicker] = useState(false);
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
    const initialData = route.params?.initialData;
    if (initialData) {
      setValue("value", initialData.value.toString());
      setValue(
        "mealContext",
        (initialData.context || "before_meal") as FormData["mealContext"]
      );
      setValue("notes", initialData.notes || "");
      setTimestamp(new Date(initialData.timestamp));
    }
  }, [route.params, setValue]);

  const onSubmit = async (data: FormData) => {
    try {
      setIsLoading(true);

      const valueNumber = parseFloat(data.value);
      if (isNaN(valueNumber) || !isFinite(valueNumber)) {
        Alert.alert("Error", "Please enter a valid number for blood glucose");
        return;
      }

      const readingData = {
        value: valueNumber,
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
      Alert.alert(
        "Error",
        error instanceof Error
          ? error.message
          : "Failed to save blood sugar reading"
      );
    } finally {
      setIsLoading(false);
    }
  };

  const getStatusColor = (value: string) => {
    const numValue = parseFloat(value);
    if (isNaN(numValue)) return COLORS.text;
    if (numValue < NORMAL_SUGAR_MIN) return COLORS.danger;
    if (numValue > NORMAL_SUGAR_MAX) return COLORS.danger;
    return COLORS.success;
  };

  const getMealContextLabel = (value: string) => {
    const context = MEAL_CONTEXTS.find((ctx) => ctx.value === value);
    return context ? context.label : "Before Meal";
  };

  const handleMealSelect = (value: string) => {
    setValue("mealContext", value as FormData["mealContext"]);
  };

  return (
    <View className="flex-1">
      <KeyboardAwareScrollView
        contentContainerStyle={{ flexGrow: 1, paddingBottom: 20 }}
        enableOnAndroid={true}
        enableAutomaticScroll={true}
        keyboardOpeningTime={0}
        extraScrollHeight={20}
        showsVerticalScrollIndicator={false}
      >
        <Container keyboardAvoiding={false}>
          <View className="flex-1 p-4">
            <View className="flex-row items-center justify-between mb-4 w-full">
              <TouchableOpacity
                className="p-2"
                onPress={() => navigation.goBack()}
                accessibilityLabel="Go back"
                accessibilityHint="Returns to previous screen"
                accessibilityRole="button"
              >
                <Ionicons name="arrow-back-outline" size={24} color="#2563eb" />
              </TouchableOpacity>
              <Text className="text-lg font-bold text-gray-800 text-center">
                {isEditing ? "Edit Blood Sugar" : "Add Blood Sugar"}
              </Text>
              <View className="w-10" />
            </View>

            <Card variant="elevated" className="p-4">
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
                  <View className="flex-row items-end mb-4">
                    <View className="flex-1">
                      <Input
                        label="Blood Glucose"
                        placeholder="Enter value"
                        keyboardType="numeric"
                        value={value}
                        onChangeText={onChange}
                        onBlur={onBlur}
                        error={errors.value?.message}
                        touched={value !== ""}
                        containerStyle={{ marginBottom: 0 }}
                        inputAccessoryViewID={
                          Platform.OS === "ios"
                            ? inputAccessoryViewID
                            : undefined
                        }
                        labelStyle={{ fontWeight: 500, fontSize: 16 }}
                      />
                    </View>
                    <View className="flex-shrink-0 ml-3 items-end pb-2.5 max-w-[80px]">
                      <Text
                        className="text-2xl font-bold"
                        style={{ color: getStatusColor(value) }}
                        numberOfLines={1}
                      >
                        {value || "---"}
                      </Text>
                      <Text className="text-sm text-gray-500">mg/dL</Text>
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

              <View className="mb-4">
                <Text className="text-lg mb-2 text-gray-800 font-medium">
                  Meal Context
                </Text>
                <TouchableOpacity
                  className="flex-row justify-between items-center bg-gray-100 rounded border border-gray-300 p-3"
                  onPress={() => setShowMealContextPicker(true)}
                  accessibilityLabel={`Selected meal context: ${getMealContextLabel(getValues().mealContext)}`}
                  accessibilityHint="Opens meal context selection"
                  accessibilityRole="button"
                >
                  <Text className="text-base text-gray-800">
                    {getMealContextLabel(getValues().mealContext)}
                  </Text>
                  <Ionicons name="chevron-down" size={20} color="#111827" />
                </TouchableOpacity>
              </View>

              <Controller
                control={control}
                name="notes"
                render={({ field: { onChange, onBlur, value } }) => (
                  <Input
                    label="Notes (Optional)"
                    placeholder="Add any notes about this reading"
                    multiline
                    numberOfLines={3}
                    value={value}
                    onChangeText={onChange}
                    onBlur={onBlur}
                    inputStyle={{ height: 80, textAlignVertical: "top" }}
                    labelStyle={{ fontWeight: 500, fontSize: 16 }}
                  />
                )}
              />

              <View className="flex-row justify-between mt-4">
                <Button
                  title="Cancel"
                  variant="outline"
                  onPress={() => navigation.goBack()}
                  className="flex-1 mr-2"
                  disabled={isLoading}
                />
                <Button
                  title={isEditing ? "Update" : "Save"}
                  onPress={handleSubmit(onSubmit)}
                  loading={isLoading}
                  disabled={isLoading}
                  className="flex-1 ml-2"
                />
              </View>
            </Card>
          </View>

          <SelectionModal
            visible={showMealContextPicker}
            onClose={() => setShowMealContextPicker(false)}
            title="Select Meal Context"
            options={MEAL_CONTEXTS}
            selectedValue={getValues().mealContext}
            onSelect={handleMealSelect}
          />
        </Container>
      </KeyboardAwareScrollView>
    </View>
  );
};

export default AddGlucoseScreen;
