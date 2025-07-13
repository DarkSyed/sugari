import React, { useState, useEffect } from "react";
import { View, Text, Alert, TouchableOpacity, Platform } from "react-native";
import { useNavigation, useRoute, RouteProp } from "@react-navigation/native";
import { StackNavigationProp } from "@react-navigation/stack";
import { useForm, Controller } from "react-hook-form";
import { KeyboardAwareScrollView } from "react-native-keyboard-aware-scroll-view";
import { Ionicons } from "@expo/vector-icons";
import { VALIDATION, MEAL_OPTIONS } from "../../constants";
import { addFoodEntry, updateFoodEntry } from "../../services/database";
import Container from "../../components/Container";
import Input from "../../components/Input";
import Button from "../../components/Button";
import Card from "../../components/Card";
import { MainStackParamList, ROUTES } from "../../types";
import DateTimeField from "../../components/DateTimeField";
import SelectionModal from "../../components/SelectionModal";

const inputAccessoryViewID = "inputAccessoryViewFoodScreen";

type FormData = {
  name: string;
  carbs: string;
  meal_type: "breakfast" | "lunch" | "dinner" | "snack";
  notes: string;
};

type NavigationProp = StackNavigationProp<MainStackParamList>;
type RouteParams = RouteProp<MainStackParamList, typeof ROUTES.ADD_FOOD>;

const AddFoodScreen: React.FC = () => {
  const navigation = useNavigation<NavigationProp>();
  const route = useRoute<RouteParams>();
  const [isLoading, setIsLoading] = useState(false);
  const [timestamp, setTimestamp] = useState(new Date());
  const [showMealPicker, setShowMealPicker] = useState(false);
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
    const initialData = route.params?.initialData;
    if (initialData) {
      setValue("name", initialData.name);
      setValue("carbs", initialData.carbs?.toString() || "");
      setValue(
        "meal_type",
        (initialData.meal_type || "breakfast") as FormData["meal_type"]
      );
      setTimestamp(new Date(initialData.timestamp));
    }
  }, [route.params, setValue]);

  const onSubmit = async (data: FormData) => {
    try {
      setIsLoading(true);

      const carbsNumber = parseFloat(data.carbs);
      if (isNaN(carbsNumber) || !isFinite(carbsNumber)) {
        Alert.alert("Error", "Please enter a valid number for carbs");
        return;
      }

      const readingData = {
        name: data.name,
        carbs: carbsNumber,
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
      Alert.alert(
        "Error",
        error instanceof Error
          ? error.message
          : "Failed to save food entry. Please try again."
      );
    } finally {
      setIsLoading(false);
    }
  };

  const getMealLabel = (value: string) => {
    const meal = MEAL_OPTIONS.find((m) => m.value === value);
    return meal ? meal.label : "Breakfast";
  };

  const handleMealSelect = (value: string) => {
    setValue("meal_type", value as FormData["meal_type"]);
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
                accessibilityHint="Returns to the previous screen"
                accessibilityRole="button"
              >
                <Ionicons name="arrow-back-outline" size={24} color="#2563eb" />
              </TouchableOpacity>
              <Text className="text-lg font-bold text-gray-800 text-center">
                {isEditing ? "Edit Food" : "Add Food"}
              </Text>
              <View className="w-10" />
            </View>

            <Card variant="elevated" className="p-4">
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
                    labelStyle={{ fontWeight: 500, fontSize: 16 }}
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
                    labelStyle={{ fontWeight: 500, fontSize: 16 }}
                  />
                )}
                name="carbs"
              />

              <DateTimeField
                label={"When did you eat this?"}
                timestamp={timestamp}
                onChange={setTimestamp}
              />

              <View className="mb-4">
                <Text className="text-lg mb-2 text-grey-800 font-medium">
                  Meal Type
                </Text>
                <TouchableOpacity
                  className="flex-row justify-between items-center bg-gray-100 rounded border border-gray-300 p-3"
                  onPress={() => setShowMealPicker(true)}
                  accessibilityLabel={`Selected meal: ${getMealLabel(getValues().meal_type)}`}
                  accessibilityHint="Opens meal type selection"
                  accessibilityRole="button"
                >
                  <Text className="text-base text-gray-800">
                    {getMealLabel(getValues().meal_type)}
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
            visible={showMealPicker}
            onClose={() => setShowMealPicker(false)}
            title="Select Meal"
            options={MEAL_OPTIONS}
            selectedValue={getValues().meal_type}
            onSelect={handleMealSelect}
          />
        </Container>
      </KeyboardAwareScrollView>
    </View>
  );
};

export default AddFoodScreen;
