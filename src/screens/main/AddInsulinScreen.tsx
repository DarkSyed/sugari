import React, { useEffect, useState } from "react";
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
import { COLORS, SIZES, VALIDATION, INSULIN_TYPES } from "../../constants";
import { useAuth } from "../../contexts/AuthContext";
import { addInsulinDose, updateInsulinDose } from "../../services/database";
import Container from "../../components/Container";
import Input from "../../components/Input";
import Button from "../../components/Button";
import Card from "../../components/Card";
import { MainStackParamList } from "../../types";
import DateTimeField from "../../components/DateTimeField";

const inputAccessoryViewID = "inputAccessoryViewInsulinScreen";

type FormData = {
  units: string;
  insulinType: "rapid" | "long" | "mixed" | "other";
  notes: string;
};

const INSULIN_TYPE_OPTIONS = [
  { label: "Rapid Acting", value: "rapid" },
  { label: "Long Acting", value: "long" },
  { label: "Mixed", value: "mixed" },
  { label: "Other", value: "other" },
];

type RouteParams = RouteProp<MainStackParamList, "AddInsulin">;

const AddInsulinScreen: React.FC = () => {
  const { authState } = useAuth();
  const navigation = useNavigation<StackNavigationProp<any>>();
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
    if (route.params?.initialData) {
      setValue("units", route.params.initialData.units.toString());
      setValue(
        "insulinType",
        (route.params.initialData.type || "rapid") as FormData["insulinType"]
      );
      setValue("notes", route.params.initialData.notes || "");
      setTimestamp(new Date(route.params.initialData.timestamp));
    }
  }, [route.params, setValue]);

  const onSubmit = async (data: FormData) => {
    try {
      setIsLoading(true);
      const readingData = {
        units: parseFloat(data.units),
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

      navigation.navigate("SugarLog");
    } catch (error) {
      console.error("Error saving insulin dose:", error);
      Alert.alert("Error", "Failed to save insulin dose. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const getInsulinTypeLabel = (value: string) => {
    const insulinType = INSULIN_TYPE_OPTIONS.find((t) => t.value === value);
    return insulinType ? insulinType.label : "Rapid Acting";
  };

  const renderInsulinTypeModal = () => {
    return (
      <Modal
        visible={showInsulinTypePicker}
        transparent
        statusBarTranslucent={true}
        animationType="slide"
        onRequestClose={() => setShowInsulinTypePicker(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Select Insulin Type</Text>
              <TouchableOpacity onPress={() => setShowInsulinTypePicker(false)}>
                <Ionicons name="close" size={24} color={COLORS.text} />
              </TouchableOpacity>
            </View>

            <View style={styles.insulinTypeList}>
              {INSULIN_TYPE_OPTIONS.map((insulinType) => (
                <TouchableOpacity
                  key={insulinType.value}
                  style={[
                    styles.insulinTypeItem,
                    getValues().insulinType === insulinType.value &&
                      styles.selectedInsulinType,
                  ]}
                  onPress={() => {
                    setValue("insulinType", insulinType.value as any);
                    setShowInsulinTypePicker(false);
                  }}
                >
                  <Text
                    style={[
                      styles.insulinTypeText,
                      getValues().insulinType === insulinType.value &&
                        styles.selectedInsulinTypeText,
                    ]}
                  >
                    {insulinType.label}
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
    <Container keyboardAvoiding={false}>
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={{ flex: 1 }}
        keyboardVerticalOffset={Platform.OS === "ios" ? 90 : 20}
      >
        <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
          <ScrollView
            showsVerticalScrollIndicator={false}
            bounces={false}
            alwaysBounceVertical={false}
            keyboardShouldPersistTaps="handled"
            contentContainerStyle={styles.scrollViewContent}
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
                    {isEditing ? "Edit Insulin Dose" : "Add Insulin Dose"}
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
                    />
                  )}
                  name="units"
                />

                <DateTimeField
                  label={"When did you take this insulin?"}
                  timestamp={timestamp}
                  onChange={setTimestamp}
                />

                <Text style={styles.label}>Insulin Type</Text>
                <Controller
                  control={control}
                  render={({ field: { value } }) => (
                    <TouchableOpacity
                      style={styles.insulinTypeButton}
                      onPress={() => setShowInsulinTypePicker(true)}
                    >
                      <Text style={styles.insulinTypeButtonText}>
                        {getInsulinTypeLabel(value)}
                      </Text>
                      <Ionicons
                        name="chevron-down"
                        size={16}
                        color={COLORS.text}
                      />
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
                      inputStyle={styles.notesInput}
                    />
                  )}
                  name="notes"
                />

                <View style={styles.buttonContainer}>
                  <Button
                    title="Cancel"
                    variant="outline"
                    onPress={() => navigation.goBack()}
                    style={styles.cancelButton}
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
          </ScrollView>
        </TouchableWithoutFeedback>
      </KeyboardAvoidingView>
      {renderInsulinTypeModal()}
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
  );
};

const styles = StyleSheet.create({
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
  headerTitleContainer: {
    // No flex needed with space-between and spacer
  },
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
    marginBottom: SIZES.xs,
    color: COLORS.text,
    fontWeight: "500",
  },
  notesInput: {
    height: 80,
    textAlignVertical: "top",
  },
  buttonContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
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
  insulinTypeButton: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: COLORS.inputBackground,
    borderRadius: SIZES.xs,
    borderWidth: 1,
    borderColor: COLORS.border,
    padding: SIZES.sm,
    marginBottom: SIZES.md,
  },
  insulinTypeButtonText: {
    fontSize: 16,
    color: COLORS.text,
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
  insulinTypeList: {
    marginBottom: SIZES.md,
  },
  insulinTypeItem: {
    paddingVertical: SIZES.sm,
    paddingHorizontal: SIZES.md,
    borderRadius: SIZES.xs,
    marginBottom: SIZES.xs,
    backgroundColor: "white",
  },
  selectedInsulinType: {
    backgroundColor: `${COLORS.primary}20`,
  },
  insulinTypeText: {
    fontSize: 16,
    color: COLORS.text,
  },
  selectedInsulinTypeText: {
    color: COLORS.primary,
    fontWeight: "bold",
  },
  scrollViewContent: {
    flexGrow: 1,
    paddingBottom: 20,
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

export default AddInsulinScreen;
