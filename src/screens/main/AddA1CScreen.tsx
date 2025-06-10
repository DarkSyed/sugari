import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  Alert,
  TouchableOpacity,
  Platform,
  KeyboardAvoidingView,
  TouchableWithoutFeedback,
  ScrollView,
  Keyboard,
} from "react-native";
import { useNavigation, useRoute, RouteProp } from "@react-navigation/native";
import { StackNavigationProp } from "@react-navigation/stack";
import { COLORS, SIZES, VALIDATION } from "../../constants";
import { addA1CReading, updateA1CReading } from "../../services/database";
import Container from "../../components/Container";
import Input from "../../components/Input";
import Button from "../../components/Button";
import { Ionicons } from "@expo/vector-icons";
import Card from "../../components/Card";
import { MainStackParamList } from "../../types";
import DateTimeField from "../../components/DateTimeField";
import { useForm, Controller } from "react-hook-form";

type FormData = {
  a1c: string;
  notes: string;
};

type RouteParams = RouteProp<MainStackParamList, "AddA1C">;

const AddA1CScreen: React.FC = () => {
  const navigation = useNavigation<StackNavigationProp<any>>();
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
      a1c: "",
      notes: "",
    },
  });

  useEffect(() => {
    if (route.params?.initialData) {
      setValue("a1c", route.params.initialData.value.toString());
      setValue("notes", route.params.initialData.notes || "");
      setTimestamp(new Date(route.params.initialData.timestamp));
    }
  }, [route.params, setValue]);

  const onSubmit = async (data: FormData) => {
    try {
      setIsSubmitting(true);
      const readingData = {
        value: parseFloat(data.a1c),
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

      navigation.navigate("SugarLog");
    } catch (error) {
      console.error("Error saving A1C reading:", error);
      Alert.alert("Error", "Failed to save A1C reading. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Container keyboardAvoiding={false}>
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        keyboardVerticalOffset={Platform.select({ ios: 90, android: 0, default: 0 })}
        style={{ flex: 1 }}
      >
        <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
          <ScrollView
            style={styles.scrollView}
            contentContainerStyle={styles.scrollViewContent}
            bounces={false}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
          >
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
                    {isEditing ? "Edit A1C Reading" : "Add A1C Reading"}
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
                      value: /^[0-9]*\.?[0-9]+$/,
                      message: "Please enter a valid number",
                    },
                    validate: {
                      min: (value) =>
                        parseFloat(value) > 3 || VALIDATION.A1C_MIN,
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
                    disabled={isSubmitting}
                  />
                  <Button
                    title={isEditing ? "Update" : "Save"}
                    onPress={handleSubmit(onSubmit)}
                    loading={isSubmitting}
                    disabled={isSubmitting}
                    style={styles.saveButton}
                  />
                </View>
              </Card>
            </View>
          </ScrollView>
        </TouchableWithoutFeedback>
      </KeyboardAvoidingView>
    </Container>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: SIZES.md,
  },
  scrollView: {
    flex: 1,
  },
  scrollViewContent: {
    flexGrow: 1,
    paddingBottom: SIZES.xl,
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
  inputContainer: {
    marginBottom: SIZES.md,
  },
  label: {
    fontSize: 16,
    fontWeight: "500",
    color: COLORS.text,
    marginBottom: SIZES.xs,
  },
  input: {
    fontSize: 18,
  },
  notesInput: {
    height: 100,
  },
  footer: {
    marginTop: "auto",
    marginBottom: SIZES.lg,
  },
  saveButton: {
    backgroundColor: COLORS.primary,
  },
  buttonGroup: {
    flexDirection: "row",
    marginTop: SIZES.md,
  },
  cancelButton: {
    flex: 1,
    marginRight: SIZES.sm,
  },
});

export default AddA1CScreen;
