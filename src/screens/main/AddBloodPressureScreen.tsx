import React, { useState, useEffect } from "react";
import { View, Text, Alert, TouchableOpacity } from "react-native";
import { useNavigation, useRoute, RouteProp } from "@react-navigation/native";
import { StackNavigationProp } from "@react-navigation/stack";
import { useForm, Controller } from "react-hook-form";
import { VALIDATION } from "../../constants";
import {
  addBloodPressureReading,
  updateBloodPressureReading,
} from "../../services/database";
import Container from "../../components/Container";
import Input from "../../components/Input";
import Button from "../../components/Button";
import { Ionicons } from "@expo/vector-icons";
import { MainStackParamList, ROUTES } from "../../types";
import Card from "../../components/Card";
import DateTimeField from "../../components/DateTimeField";
import { KeyboardAwareScrollView } from "react-native-keyboard-aware-scroll-view";

type FormData = {
  systolic: string;
  diastolic: string;
  notes: string;
};

type NavigationProp = StackNavigationProp<MainStackParamList>;
type RouteParams = RouteProp<MainStackParamList, typeof ROUTES.ADD_BP>;

const AddBloodPressureScreen: React.FC = () => {
  const navigation = useNavigation<NavigationProp>();
  const route = useRoute<RouteParams>();
  const [timestamp, setTimestamp] = useState(new Date());
  const [isSubmitting, setIsSubmitting] = useState(false);
  const isEditing = route.params?.isEditing;

  const {
    control,
    handleSubmit,
    formState: { errors },
    reset,
    setValue,
  } = useForm<FormData>({
    defaultValues: {
      systolic: "",
      diastolic: "",
      notes: "",
    },
  });

  useEffect(() => {
    const initialData = route.params?.initialData;
    if (initialData) {
      setValue("systolic", initialData.systolic.toString());
      setValue("diastolic", initialData.diastolic.toString());
      setTimestamp(new Date(initialData.timestamp));
      setValue("notes", initialData.notes || "");
    }
  }, [route.params, setValue]);

  const onSubmit = async (data: FormData) => {
    try {
      setIsSubmitting(true);

      const systolicNumber = parseFloat(data.systolic);
      const diastolicNumber = parseFloat(data.diastolic);
      if (
        isNaN(systolicNumber || diastolicNumber) ||
        !isFinite(systolicNumber || diastolicNumber)
      ) {
        Alert.alert("Error", "Please enter valid blood pressure values.");
        return;
      }

      const readingData = {
        systolic: systolicNumber,
        diastolic: diastolicNumber,
        timestamp: timestamp.getTime(),
        notes: data.notes.trim(),
      };

      if (route.params?.initialData) {
        await updateBloodPressureReading(
          route.params.initialData.id,
          readingData,
        );
        Alert.alert("Success", "Blood pressure reading updated successfully");
      } else {
        await addBloodPressureReading(readingData);
        Alert.alert("Success", "Blood pressure reading added successfully");
        reset();
      }

      navigation.navigate(ROUTES.BP_LOG);
    } catch (error) {
      console.error("Error saving blood pressure reading:", error);
      Alert.alert(
        "Error",
        error instanceof Error
          ? error.message
          : "Failed to save blood pressure reading.",
      );
    } finally {
      setIsSubmitting(false);
    }
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
                accessibilityHint="Return to previous screen"
                accessibilityRole="button"
              >
                <Ionicons name="arrow-back-outline" size={24} color="#2563eb" />
              </TouchableOpacity>
              <Text className="text-lg font-bold text-gray-800 text-center">
                {isEditing ? "Edit Blood Pressure" : "Add Blood Pressure"}
              </Text>
              <View className="w-10" />
            </View>

            <Card variant="elevated" className="p-4">
              <View className="flex-row space-x-4">
                <View className="flex-1 mr-4">
                  <Controller
                    control={control}
                    rules={{
                      required: VALIDATION.REQUIRED,
                      pattern: {
                        value: /^[0-9]*\.?[0-9]+$/,
                        message: "Please enter a valid number",
                      },
                    }}
                    render={({ field: { onChange, onBlur, value } }) => (
                      <Input
                        label="Systolic (mmHg)"
                        placeholder="e.g., 120"
                        keyboardType="number-pad"
                        value={value}
                        onChangeText={onChange}
                        onBlur={onBlur}
                        error={errors.systolic?.message}
                        touched={value !== ""}
                        labelStyle={{ fontWeight: 500, fontSize: 16 }}
                      />
                    )}
                    name="systolic"
                  />
                </View>

                <View className="flex-1">
                  <Controller
                    control={control}
                    rules={{
                      required: VALIDATION.REQUIRED,
                      pattern: {
                        value: /^[0-9]*\.?[0-9]+$/,
                        message: "Please enter a valid number",
                      },
                    }}
                    render={({ field: { onChange, onBlur, value } }) => (
                      <Input
                        label="Diastolic (mmHg)"
                        placeholder="e.g., 80"
                        keyboardType="number-pad"
                        value={value}
                        onChangeText={onChange}
                        onBlur={onBlur}
                        error={errors.diastolic?.message}
                        touched={value !== ""}
                        labelStyle={{ fontWeight: 500, fontSize: 16 }}
                      />
                    )}
                    name="diastolic"
                  />
                </View>
              </View>

              <DateTimeField
                label={"Date & Time"}
                timestamp={timestamp}
                onChange={setTimestamp}
              />

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
                  disabled={isSubmitting}
                />
                <Button
                  title={isEditing ? "Update" : "Save"}
                  onPress={handleSubmit(onSubmit)}
                  loading={isSubmitting}
                  disabled={isSubmitting}
                  className="flex-1 ml-2"
                />
              </View>
            </Card>
          </View>
        </Container>
      </KeyboardAwareScrollView>
    </View>
  );
};

export default AddBloodPressureScreen;
