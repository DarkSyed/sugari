import React, { useState, useEffect } from "react";
import { View, Text, Alert, TouchableOpacity } from "react-native";
import { useNavigation, useRoute, RouteProp } from "@react-navigation/native";
import { StackNavigationProp } from "@react-navigation/stack";
import { VALIDATION } from "../../constants";
import { addA1CReading, updateA1CReading } from "../../services/database";
import Container from "../../components/Container";
import Input from "../../components/Input";
import Button from "../../components/Button";
import { Ionicons } from "@expo/vector-icons";
import Card from "../../components/Card";
import { MainStackParamList, ROUTES } from "../../types";
import DateTimeField from "../../components/DateTimeField";
import { useForm, Controller } from "react-hook-form";
import { KeyboardAwareScrollView } from "react-native-keyboard-aware-scroll-view";

type FormData = {
  a1c: string;
  notes: string;
};

type NavigationProp = StackNavigationProp<MainStackParamList>;
type RouteParams = RouteProp<MainStackParamList, typeof ROUTES.ADD_A1C>;

const AddA1CScreen: React.FC = () => {
  const navigation = useNavigation<NavigationProp>();
  const route = useRoute<RouteParams>();
  const [timestamp, setTimestamp] = useState(new Date());
  const [isLoading, setIsLoading] = useState(false);
  const isEditing = route.params?.isEditing;

  const {
    control,
    handleSubmit,
    formState: { errors },
    reset,
    setValue,
  } = useForm<FormData>({
    defaultValues: {
      a1c: "",
      notes: "",
    },
  });

  useEffect(() => {
    const initialData = route.params?.initialData;
    if (initialData) {
      setValue("a1c", initialData.value.toString());
      setValue("notes", initialData.notes || "");
      setTimestamp(new Date(initialData.timestamp));
    }
  }, [route.params, setValue]);

  const onSubmit = async (data: FormData) => {
    try {
      setIsLoading(true);

      const valueNumber = parseFloat(data.a1c);
      if (isNaN(valueNumber) || !isFinite(valueNumber)) {
        Alert.alert("Error", "Please enter a valid number for A1C");
        return;
      }

      const readingData = {
        value: valueNumber,
        timestamp: timestamp.getTime(),
        notes: data.notes.trim(),
      };

      if (route.params?.initialData) {
        await updateA1CReading(route.params.initialData.id, readingData);
        Alert.alert("Success", "A1C reading updated successfully");
      } else {
        await addA1CReading(readingData);
        Alert.alert("Success", "A1C reading added successfully");
        reset();
      }

      navigation.navigate(ROUTES.SUGAR_LOG, {});
    } catch (error) {
      console.error("Error saving A1C reading:", error);
      Alert.alert(
        "Error",
        error instanceof Error
          ? error.message
          : "Failed to save A1C reading. Please try again."
      );
    } finally {
      setIsLoading(false);
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
                {isEditing ? "Edit A1C Reading" : "Add A1C Reading"}
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
                    min: (value) => parseFloat(value) > 3 || VALIDATION.A1C_MIN,
                    max: (value) =>
                      parseFloat(value) <= 20 || VALIDATION.A1C_MAX,
                  },
                }}
                render={({ field: { onChange, onBlur, value } }) => (
                  <Input
                    label="A1C Value (%)"
                    placeholder="e.g., 7.2"
                    keyboardType="decimal-pad"
                    value={value}
                    onChangeText={onChange}
                    onBlur={onBlur}
                    error={errors.a1c?.message}
                    touched={value !== ""}
                    labelStyle={{ fontWeight: 500, fontSize: 16 }}
                  />
                )}
                name="a1c"
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
        </Container>
      </KeyboardAwareScrollView>
    </View>
  );
};

export default AddA1CScreen;
