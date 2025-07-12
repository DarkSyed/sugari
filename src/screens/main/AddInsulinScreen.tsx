import React, { useEffect, useState } from "react";
import {
  View,
  Text,
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
import { VALIDATION, INSULIN_TYPES } from "../../constants";
import { addInsulinDose, updateInsulinDose } from "../../services/database";
import Container from "../../components/Container";
import Input from "../../components/Input";
import Button from "../../components/Button";
import Card from "../../components/Card";
import { MainStackParamList, ROUTES } from "../../types";
import DateTimeField from "../../components/DateTimeField";

const inputAccessoryViewID = "inputAccessoryViewInsulinScreen";

type FormData = {
  units: string;
  insulinType: "rapid" | "long" | "mixed" | "other";
  notes: string;
};

type NavigationProp = StackNavigationProp<MainStackParamList>;
type RouteParams = RouteProp<MainStackParamList, typeof ROUTES.ADD_INSULIN>;

const AddInsulinScreen: React.FC = () => {
  const navigation = useNavigation<NavigationProp>();
  const route = useRoute<RouteParams>();
  const [isLoading, setIsLoading] = useState(false);
  const [timestamp, setTimestamp] = useState(new Date());
  const [showInsulinTypePicker, setShowInsulinTypePicker] = useState(false);
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
      units: "",
      insulinType: "rapid",
      notes: "",
    },
  });

  useEffect(() => {
    const initialData = route.params?.initialData;
    if (initialData) {
      setValue("units", initialData.units.toString());
      setValue(
        "insulinType",
        (initialData.type || "rapid") as FormData["insulinType"]
      );
      setValue("notes", initialData.notes || "");
      setTimestamp(new Date(initialData.timestamp));
    }
  }, [route.params, setValue]);

  const onSubmit = async (data: FormData) => {
    try {
      setIsLoading(true);

      const unitsValue = parseFloat(data.units);
      if (isNaN(unitsValue) || !isFinite(unitsValue)) {
        Alert.alert("Error", "Please enter a valid number for units.");
        return;
      }

      const readingData = {
        units: unitsValue,
        type: data.insulinType,
        timestamp: timestamp.getTime(),
        notes: data.notes.trim(),
      };

      if (route.params?.initialData) {
        await updateInsulinDose(route.params.initialData.id, readingData);
        Alert.alert("Success", "Insulin dose updated successfully!");
      } else {
        await addInsulinDose(readingData);
        Alert.alert("Success", "Insulin dose added successfully!");
        reset();
      }

      navigation.navigate(ROUTES.SUGAR_LOG, {});
    } catch (error) {
      console.error("Error saving insulin dose:", error);
      Alert.alert(
        "Error",
        error instanceof Error
          ? error.message
          : "Failed to save insulin dose. Please try again."
      );
    } finally {
      setIsLoading(false);
    }
  };

  const getInsulinTypeLabel = (value: string) => {
    const insulinType = INSULIN_TYPES.find((t) => t.value === value);
    return insulinType ? insulinType.label : "Rapid Acting";
  };

  const renderInsulinTypeModal = () => {
    const currentInsulinType = getValues().insulinType;

    return (
      <Modal
        visible={showInsulinTypePicker}
        transparent
        statusBarTranslucent={true}
        animationType="slide"
        onRequestClose={() => setShowInsulinTypePicker(false)}
      >
        <View className="flex-1 bg-black/50 justify-end">
          <View className="bg-white rounded-t-xl p-4 max-h-[70%]">
            <View className="flex-row justify-between items-center mb-4">
              <Text className="text-lg font-bold text-gray-800">
                Select Insulin Type
              </Text>
              <TouchableOpacity
                onPress={() => setShowInsulinTypePicker(false)}
                accessibilityLabel="Close insulin type picker"
                accessibilityRole="button"
              >
                <Ionicons name="close" size={24} color="#111827" />
              </TouchableOpacity>
            </View>

            <View className="mb-4">
              {INSULIN_TYPES.map((insulinType) => {
                const isSelected = currentInsulinType === insulinType.value;
                return (
                  <TouchableOpacity
                    key={insulinType.value}
                    className={`py-2 px-4 rounded mb-1 ${
                      isSelected ? "bg-primary/10" : "bg-white"
                    }`}
                    onPress={() => {
                      setValue(
                        "insulinType",
                        insulinType.value as FormData["insulinType"]
                      );
                      setShowInsulinTypePicker(false);
                    }}
                    accessibilityLabel={insulinType.label}
                    accessibilityHint={
                      isSelected ? "Currently selected" : "Tap to select"
                    }
                    accessibilityRole="button"
                    accessibilityState={{ selected: isSelected }}
                  >
                    <Text
                      className={`text-base ${
                        isSelected ? "text-primary font-bold" : "text-gray-800"
                      }`}
                    >
                      {insulinType.label}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>
        </View>
      </Modal>
    );
  };

  return (
    <Container keyboardAvoiding={false}>
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        className="flex-1"
        keyboardVerticalOffset={Platform.OS === "ios" ? 90 : 20}
      >
        <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
          <ScrollView
            showsVerticalScrollIndicator={false}
            bounces={false}
            alwaysBounceVertical={false}
            keyboardShouldPersistTaps="handled"
            contentContainerStyle={{ flexGrow: 1, paddingBottom: 20 }}
          >
            <View className="flex-1 p-4">
              <View className="flex-row items-center justify-between mb-4 w-full">
                <TouchableOpacity
                  className="p-2"
                  onPress={() => navigation.goBack()}
                  accessibilityLabel="Go back"
                  accessibilityHint="Returns to the previous screen"
                  accessibilityRole="button"
                >
                  <Ionicons
                    name="arrow-back-outline"
                    size={24}
                    color="#2563eb"
                  />
                </TouchableOpacity>
                <Text className="text-lg font-bold text-gray-800 text-center">
                  {isEditing ? "Edit Insulin Dose" : "Add Insulin Dose"}
                </Text>
                <View className="w-10" />
              </View>

              <Card variant="elevated" className="p-4">
                <Controller
                  control={control}
                  rules={{
                    required: VALIDATION.REQUIRED,
                    pattern: {
                      value: /^[0-9]*\.?[0-9]+$/,
                      message: "Please enter a valid number",
                    },
                    validate: {
                      min: (value) =>
                        parseFloat(value) > 0 || VALIDATION.INSULIN_MIN,
                      max: (value) =>
                        parseFloat(value) <= 100 || VALIDATION.INSULIN_MAX,
                    },
                  }}
                  render={({ field: { onChange, onBlur, value } }) => (
                    <Input
                      label="Units"
                      placeholder="Enter insulin units"
                      keyboardType="numeric"
                      value={value}
                      onChangeText={onChange}
                      onBlur={onBlur}
                      error={errors.units?.message}
                      touched={value !== ""}
                      inputAccessoryViewID={
                        Platform.OS === "ios" ? inputAccessoryViewID : undefined
                      }
                      labelStyle={{ fontWeight: 500, fontSize: 16 }}
                    />
                  )}
                  name="units"
                />

                <DateTimeField
                  label={"When did you take this insulin?"}
                  timestamp={timestamp}
                  onChange={setTimestamp}
                />

                <Text className="text-lg mb-2 text-gray-800 font-medium">
                  Insulin Type
                </Text>
                <Controller
                  control={control}
                  render={({ field: { value } }) => (
                    <TouchableOpacity
                      className="flex-row justify-between items-center bg-gray-100 rounded border border-gray-300 p-3 mb-4"
                      onPress={() => setShowInsulinTypePicker(true)}
                      accessibilityLabel={`Selected insulin type: ${getInsulinTypeLabel(value)}`}
                      accessibilityHint="Opens insulin type selection"
                      accessibilityRole="button"
                    >
                      <Text className="text- text-gray-800">
                        {getInsulinTypeLabel(value)}
                      </Text>
                      <Ionicons name="chevron-down" size={16} color="#111827" />
                    </TouchableOpacity>
                  )}
                  name="insulinType"
                />

                <Controller
                  control={control}
                  render={({ field: { onChange, onBlur, value } }) => (
                    <Input
                      label="Notes (Optional)"
                      placeholder="Add any additional notes"
                      multiline
                      numberOfLines={3}
                      value={value}
                      onChangeText={onChange}
                      onBlur={onBlur}
                      inputStyle={{ height: 80, textAlignVertical: "top" }}
                      labelStyle={{ fontWeight: 500, fontSize: 16 }}
                    />
                  )}
                  name="notes"
                />

                <View className="flex-row justify-between mt-4">
                  <Button
                    title="Cancel"
                    variant="outline"
                    onPress={() => navigation.goBack()}
                    className="flex-1 mr-2"
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
          </ScrollView>
        </TouchableWithoutFeedback>
      </KeyboardAvoidingView>
      {renderInsulinTypeModal()}
      {Platform.OS === "ios" && (
        <InputAccessoryView nativeID={inputAccessoryViewID}>
          <View className="h-11 bg-gray-100 border-t border-gray-300 flex-row justify-end items-center px-4 w-full">
            <TouchableOpacity
              className="p-2"
              onPress={() => Keyboard.dismiss()}
            >
              <Text className="text-primary text-base font-semibold">Done</Text>
            </TouchableOpacity>
          </View>
        </InputAccessoryView>
      )}
    </Container>
  );
};

export default AddInsulinScreen;
