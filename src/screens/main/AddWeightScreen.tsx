import React, { useState, useEffect } from "react";
import { View, Text, Alert, TouchableOpacity } from "react-native";
import { RouteProp, useNavigation, useRoute } from "@react-navigation/native";
import { StackNavigationProp } from "@react-navigation/stack";
import { VALIDATION } from "../../constants";
import {
  addWeightMeasurement,
  updateWeightMeasurement,
} from "../../services/database";
import Container from "../../components/Container";
import Input from "../../components/Input";
import Button from "../../components/Button";
import { Ionicons } from "@expo/vector-icons";
import Card from "../../components/Card";
import { useApp } from "../../contexts/AppContext";
import { MainStackParamList, ROUTES } from "../../types";
import { Controller, useForm } from "react-hook-form";
import DateTimeField from "../../components/DateTimeField";
import { KeyboardAwareScrollView } from "react-native-keyboard-aware-scroll-view";

type FormData = {
  weight: string;
  notes: string;
};

type NavigationProp = StackNavigationProp<MainStackParamList>;
type RouteParams = RouteProp<MainStackParamList, typeof ROUTES.ADD_WEIGHT>;

const AddWeightScreen: React.FC = () => {
  const navigation = useNavigation<NavigationProp>();
  const route = useRoute<RouteParams>();
  const { userSettings } = useApp();
  const [timestamp, setTimestamp] = useState(new Date());
  const [isSubmitting, setIsSubmitting] = useState(false);
  const isEditing = route.params?.isEditing;

  const weightUnit = userSettings?.weightUnit || "(kg)";

  const {
    control,
    handleSubmit,
    formState: { errors },
    reset,
    setValue,
  } = useForm<FormData>({
    defaultValues: {
      weight: "",
      notes: "",
    },
  });

  useEffect(() => {
    const initialData = route.params?.initailData;
    if (initialData) {
      setValue("weight", initialData.value.toString());
      setValue("notes", initialData.notes || "");
      setTimestamp(new Date(initialData.timestamp));
    }
  }, [route.params, setValue]);

  const onSubmit = async (data: FormData) => {
    try {
      setIsSubmitting(true);

      const weightNumber = parseFloat(data.weight);
      if (isNaN(weightNumber) || !isFinite(weightNumber)) {
        Alert.alert("Error", "Please enter a valid number for weight.");
        return;
      }

      const readingData = {
        value: weightNumber,
        timestamp: timestamp.getTime(),
        notes: data.notes.trim(),
      };

      if (route.params?.initailData) {
        await updateWeightMeasurement(route.params.initailData.id, readingData);
        Alert.alert("Success", "Weight measurement updated successfully");
      } else {
        await addWeightMeasurement(readingData);
        Alert.alert("Success", "Weight measurement added successfully");
        reset();
      }

      navigation.goBack();
    } catch (error) {
      console.error("Error saving weight measurement:", error);
      Alert.alert(
        "Error",
        error instanceof Error
          ? error.message
          : "Failed to save weight measurement",
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
                {isEditing
                  ? "Edit Weight Measurement"
                  : "Add Weight Measurement"}
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
                }}
                render={({ field: { onChange, onBlur, value } }) => (
                  <Input
                    label={`Weight ${weightUnit}`}
                    placeholder={`e.g., ${weightUnit === "(kg)" ? "120" : "160"}`} //erm, this will probably need to be adjusted later :)
                    keyboardType="decimal-pad"
                    value={value}
                    onChangeText={onChange}
                    onBlur={onBlur}
                    error={errors.weight?.message}
                    touched={value !== ""}
                    labelStyle={{ fontWeight: 500, fontSize: 16 }}
                  />
                )}
                name="weight"
              />

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

export default AddWeightScreen;
