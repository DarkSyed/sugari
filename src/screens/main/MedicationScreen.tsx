import React, { useState, useEffect, useRef } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  RefreshControl,
  Modal,
  TextInput,
  Platform,
  Image,
  Alert,
  ActivityIndicator,
  ScrollView,
  KeyboardAvoidingView,
  Keyboard,
  InputAccessoryView,
} from "react-native";
import { useNavigation, useFocusEffect } from "@react-navigation/native";
import { StackNavigationProp } from "@react-navigation/stack";
import { Ionicons } from "@expo/vector-icons";
import DateTimePicker from "@react-native-community/datetimepicker";
import * as ImagePicker from "expo-image-picker";
import { Camera } from "expo-camera";
import * as FileSystem from "expo-file-system";
import { COLORS, SIZES, ROUTES } from "../../constants";
import { useApp } from "../../contexts/AppContext";
import { InsulinDose } from "../../types";
import {
  getInsulinDoses,
  addInsulinDose,
  deleteInsulinDose,
  updateInsulinDose,
} from "../../services/database";
import Container from "../../components/Container";
import Card from "../../components/Card";
import Button from "../../components/Button";
import { formatDateTime, formatDate, formatTime } from "../../utils/dateUtils";

interface Medication {
  id?: number;
  name: string;
  type: "pill" | "insulin" | "injection";
  dosage: string;
  unit: string;
  timestamp: number;
  notes?: string;
  photoUri?: string;
}

const MedicationScreen: React.FC = () => {
  const { theme, userSettings } = useApp();
  const navigation = useNavigation<StackNavigationProp<any>>();
  const [medications, setMedications] = useState<InsulinDose[]>([]);
  const [filteredMedications, setFilteredMedications] = useState<InsulinDose[]>(
    [],
  );
  const [loading, setLoading] = useState(true);
  const [filterType, setFilterType] = useState<
    "all" | "pill" | "insulin" | "injection"
  >("all");
  const [search, setSearch] = useState("");

  // Modal states
  const [showAddModal, setShowAddModal] = useState(false);
  const [showImageModal, setShowImageModal] = useState(false);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);

  // New medication form state
  const [newMedication, setNewMedication] = useState<Medication>({
    name: "",
    type: "pill",
    dosage: "",
    unit: "mg",
    timestamp: new Date().getTime(),
    notes: "",
  });
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showTimePicker, setShowTimePicker] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const inputAccessoryViewID = "inputAccessoryViewMedicationScreen";

  // Camera ref
  const cameraRef = useRef<Camera>(null);
  const [hasCameraPermission, setHasCameraPermission] = useState<
    boolean | null
  >(null);
  const [isCameraActive, setIsCameraActive] = useState(false);

  // Load data when screen gains focus
  useFocusEffect(
    React.useCallback(() => {
      loadMedications();
      return () => {}; // cleanup function
    }, []),
  );

  // Request camera permissions
  useEffect(() => {
    (async () => {
      const { status } = await Camera.requestCameraPermissionsAsync();
      setHasCameraPermission(status === "granted");
    })();
  }, []);

  // Load medications from database
  const loadMedications = async () => {
    setLoading(true);
    try {
      const data = await getInsulinDoses();
      setMedications(data);
      applyFilters(data, filterType, search);
    } catch (error) {
      console.error("Error loading medications:", error);
      Alert.alert("Error", "Failed to load medications");
    } finally {
      setLoading(false);
    }
  };

  // Apply filters to medications
  const applyFilters = (
    data: InsulinDose[],
    type: "all" | "pill" | "insulin" | "injection",
    searchText: string,
  ) => {
    let filtered = data;

    // Filter by type
    if (type !== "all") {
      filtered = filtered.filter((med) => med.type === type);
    }

    // Filter by search text
    if (searchText) {
      const searchLower = searchText.toLowerCase();
      filtered = filtered.filter(
        (med) =>
          med.name.toLowerCase().includes(searchLower) ||
          med.dosage.toLowerCase().includes(searchLower) ||
          (med.notes && med.notes.toLowerCase().includes(searchLower)),
      );
    }

    setFilteredMedications(filtered);
  };

  // Handle search input
  const handleSearch = (text: string) => {
    setSearch(text);
    applyFilters(medications, filterType, text);
  };

  // Handle filter change
  const handleFilterChange = (
    type: "all" | "pill" | "insulin" | "injection",
  ) => {
    setFilterType(type);
    applyFilters(medications, type, search);
  };

  // Reset form
  const resetForm = () => {
    setNewMedication({
      name: "",
      type: "pill",
      dosage: "",
      unit: "mg",
      timestamp: new Date().getTime(),
      notes: "",
    });
    setSelectedImage(null);
  };

  const handleAddMedication = async () => {
    if (!newMedication.name.trim() || !newMedication.dosage.trim()) {
      Alert.alert("Error", "Please enter a name and dosage");
      return;
    }

    setIsSaving(true);

    try {
      // For now, we'll store insulin medications in the insulin_doses table
      // In a production app, we'd have a separate medications table
      if (newMedication.type === "insulin") {
        await addInsulinDose({
          units: parseFloat(newMedication.dosage),
          type: "rapid", // Default to rapid
          timestamp: newMedication.timestamp,
          notes: newMedication.notes || null,
        });
      }

      // Reset form and refresh data
      resetForm();
      await loadMedications();
    } catch (error) {
      console.error("Error saving medication:", error);
      Alert.alert("Error", "Failed to save medication. Please try again.");
    } finally {
      setIsSaving(false);
    }
  };

  const handleTypeSelect = (type: "pill" | "insulin" | "injection") => {
    setNewMedication((prev) => ({
      ...prev,
      type,
      unit: type === "insulin" ? "units" : type === "pill" ? "mg" : "ml",
    }));
  };

  const handleUnitSelect = (unit: string) => {
    setNewMedication((prev) => ({ ...prev, unit }));
  };

  const dateTimePickerStyle =
    Platform.OS === "ios"
      ? {
          alignSelf: "center" as const,
          marginBottom: SIZES.md,
          width: "100%" as unknown as number,
        }
      : {};

  const toggleDatePicker = () => {
    if (showDatePicker) {
      setShowDatePicker(false);
    } else {
      setShowTimePicker(false);
      setShowDatePicker(true);
    }
  };

  const toggleTimePicker = () => {
    if (showTimePicker) {
      setShowTimePicker(false);
    } else {
      setShowDatePicker(false);
      setShowTimePicker(true);
    }
  };

  const handleDateChange = (event: any, selectedDate?: Date) => {
    if (event.type === "set" && selectedDate) {
      const updatedMedication = { ...newMedication };
      const currentDate = new Date(updatedMedication.timestamp);
      selectedDate.setHours(currentDate.getHours());
      selectedDate.setMinutes(currentDate.getMinutes());
      updatedMedication.timestamp = selectedDate.getTime();
      setNewMedication(updatedMedication);
      setShowDatePicker(false);
    } else if (event.type === "dismissed") {
      setShowDatePicker(false);
    }
  };

  const handleTimeChange = (event: any, selectedTime?: Date) => {
    // Only close the picker and update the time when the user explicitly selects a time
    // For iOS, event.type will be 'set' when the user taps "Done" button
    // For Android, event.type will be 'set' when an option is tapped
    if (event.type === "set" && selectedTime) {
      const updatedMedication = { ...newMedication };
      const currentDate = new Date(updatedMedication.timestamp);
      currentDate.setHours(selectedTime.getHours());
      currentDate.setMinutes(selectedTime.getMinutes());
      updatedMedication.timestamp = currentDate.getTime();
      setNewMedication(updatedMedication);
      setShowTimePicker(false);
    } else if (event.type === "dismissed") {
      // Just close the picker without updating the time when dismissed
      setShowTimePicker(false);
    }
    // Important: Do nothing if the event.type is undefined,
    // which happens during scrolling on iOS pickers
  };

  const pickImage = async () => {
    try {
      const permissionResult =
        await ImagePicker.requestMediaLibraryPermissionsAsync();

      if (!permissionResult.granted) {
        Alert.alert(
          "Permission Required",
          "You need to grant access to your photos to upload an image",
        );
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [4, 3],
        quality: 0.8,
      });

      if (!result.canceled) {
        setSelectedImage(result.assets[0].uri);
        setNewMedication((prev) => ({
          ...prev,
          photoUri: result.assets[0].uri,
        }));
      }
    } catch (error) {
      console.error("Error picking image:", error);
      Alert.alert("Error", "Failed to pick image");
    }
  };

  const takePhoto = async () => {
    try {
      const permissionResult =
        await ImagePicker.requestCameraPermissionsAsync();

      if (!permissionResult.granted) {
        Alert.alert(
          "Permission Required",
          "You need to grant access to your camera to take a photo",
        );
        return;
      }

      const result = await ImagePicker.launchCameraAsync({
        allowsEditing: true,
        aspect: [4, 3],
        quality: 0.8,
      });

      if (!result.canceled) {
        setSelectedImage(result.assets[0].uri);
        setNewMedication((prev) => ({
          ...prev,
          photoUri: result.assets[0].uri,
        }));
      }
    } catch (error) {
      console.error("Error taking photo:", error);
      Alert.alert("Error", "Failed to take photo");
    }
  };

  const takePicture = async () => {
    if (cameraRef.current) {
      try {
        const photo = await cameraRef.current.takePictureAsync();

        const fileName = `medication_${Date.now()}.jpg`;
        const destFolder = `${FileSystem.documentDirectory}medications/`;

        // Create directory if it doesn't exist
        const dirInfo = await FileSystem.getInfoAsync(destFolder);
        if (!dirInfo.exists) {
          await FileSystem.makeDirectoryAsync(destFolder, {
            intermediates: true,
          });
        }

        const destPath = `${destFolder}${fileName}`;
        await FileSystem.copyAsync({
          from: photo.uri,
          to: destPath,
        });

        setNewMedication((prev) => ({
          ...prev,
          photoUri: destPath,
        }));

        setIsCameraActive(false);
      } catch (error) {
        console.error("Error taking picture:", error);
        Alert.alert("Error", "Failed to take picture");
      }
    }
  };

  const handleDeleteMedication = async (id: number) => {
    Alert.alert(
      "Confirm Delete",
      "Are you sure you want to delete this medication?",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: async () => {
            try {
              await deleteInsulinDose(id);
              await loadMedications();
            } catch (error) {
              console.error("Error deleting medication:", error);
              Alert.alert("Error", "Failed to delete medication");
            }
          },
        },
      ],
    );
  };

  const handleImagePress = (imagePath: string) => {
    setSelectedImage(imagePath);
    setShowImageModal(true);
  };

  const renderMedicationItem = ({ item }: { item: InsulinDose }) => (
    <Card variant="elevated" style={styles.medicationCard}>
      <View style={styles.medicationHeader}>
        <View>
          <Text style={styles.medicationType}>{item.type}</Text>
          <Text style={styles.medicationTime}>
            {formatDateTime(item.timestamp)}
          </Text>
        </View>
        <View style={styles.dosageContainer}>
          <Text style={styles.dosageValue}>{item.units}</Text>
          <Text style={styles.dosageUnit}>units</Text>
        </View>
      </View>
      {item.notes && (
        <View style={styles.notesContainer}>
          <Text style={styles.notesLabel}>Notes:</Text>
          <Text style={styles.notesText}>{item.notes}</Text>
        </View>
      )}
    </Card>
  );

  const renderAddMedicationModal = () => (
    <Modal
      visible={showAddModal}
      animationType="slide"
      transparent={false}
      onRequestClose={() => setShowAddModal(false)}
    >
      <Container scrollable={true}>
        <View style={styles.modalHeader}>
          <TouchableOpacity onPress={() => setShowAddModal(false)}>
            <Text style={styles.cancelButton}>Cancel</Text>
          </TouchableOpacity>
          <Text style={styles.modalTitle}>Add Medication</Text>
          <TouchableOpacity onPress={handleAddMedication} disabled={isSaving}>
            <Text style={styles.saveButton}>Save</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.formContainer}>
          <View style={styles.formGroup}>
            <Text style={styles.label}>Medication</Text>
            <TextInput
              style={styles.input}
              placeholder="Enter medication name"
              value={newMedication.name}
              onChangeText={(text) =>
                setNewMedication((prev) => ({ ...prev, name: text }))
              }
              inputAccessoryViewID={
                Platform.OS === "ios" ? inputAccessoryViewID : undefined
              }
            />
          </View>

          <View style={styles.formGroup}>
            <Text style={styles.label}>Type</Text>
            <View style={styles.typeContainer}>
              <TouchableOpacity
                style={[
                  styles.typeButton,
                  newMedication.type === "pill" && styles.typeButtonSelected,
                ]}
                onPress={() => handleTypeSelect("pill")}
              >
                <Ionicons
                  name="medical"
                  size={20}
                  color={newMedication.type === "pill" ? "white" : COLORS.text}
                />
                <Text
                  style={[
                    styles.typeButtonText,
                    newMedication.type === "pill" &&
                      styles.typeButtonTextSelected,
                  ]}
                >
                  Pill
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.typeButton,
                  newMedication.type === "insulin" && styles.typeButtonSelected,
                ]}
                onPress={() => handleTypeSelect("insulin")}
              >
                <Ionicons
                  name="fitness"
                  size={20}
                  color={
                    newMedication.type === "insulin" ? "white" : COLORS.text
                  }
                />
                <Text
                  style={[
                    styles.typeButtonText,
                    newMedication.type === "insulin" &&
                      styles.typeButtonTextSelected,
                  ]}
                >
                  Insulin
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.typeButton,
                  newMedication.type === "injection" &&
                    styles.typeButtonSelected,
                ]}
                onPress={() => handleTypeSelect("injection")}
              >
                <Ionicons
                  name="medkit-outline"
                  size={20}
                  color={
                    newMedication.type === "injection" ? "white" : COLORS.text
                  }
                />
                <Text
                  style={[
                    styles.typeButtonText,
                    newMedication.type === "injection" &&
                      styles.typeButtonTextSelected,
                  ]}
                >
                  Injection
                </Text>
              </TouchableOpacity>
            </View>
          </View>

          <View style={styles.formGroup}>
            <Text style={styles.label}>Dosage</Text>
            <View style={styles.dosageInputContainer}>
              <TextInput
                style={[
                  styles.dosageInput,
                  newMedication.type === "insulin" ? { flex: 1 } : { flex: 2 },
                ]}
                placeholder="Amount"
                keyboardType="numeric"
                value={newMedication.dosage}
                onChangeText={(text) =>
                  setNewMedication((prev) => ({ ...prev, dosage: text }))
                }
                inputAccessoryViewID={
                  Platform.OS === "ios" ? inputAccessoryViewID : undefined
                }
              />

              {newMedication.type === "insulin" ? (
                <View style={styles.fixedUnitDisplay}>
                  <Text style={styles.fixedUnitText}>units</Text>
                </View>
              ) : (
                <View style={styles.unitSelector}>
                  {newMedication.type === "pill" && (
                    <View
                      style={[styles.unitButton, styles.unitButtonSelected]}
                    >
                      <Text style={styles.unitButtonTextSelected}>mg</Text>
                    </View>
                  )}
                  {newMedication.type === "injection" && (
                    <View
                      style={[styles.unitButton, styles.unitButtonSelected]}
                    >
                      <Text style={styles.unitButtonTextSelected}>ml</Text>
                    </View>
                  )}
                </View>
              )}
            </View>
          </View>

          <View style={styles.formGroup}>
            <Text style={styles.label}>Date & Time</Text>
            <View style={styles.dateTimeContainer}>
              <TouchableOpacity
                style={styles.dateTimeButton}
                onPress={toggleDatePicker}
              >
                <Text style={styles.dateTimeText}>
                  {formatDate(new Date(newMedication.timestamp))}
                </Text>
                <Ionicons name="calendar" size={20} color={COLORS.primary} />
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.dateTimeButton}
                onPress={toggleTimePicker}
              >
                <Text style={styles.dateTimeText}>
                  {formatTime(new Date(newMedication.timestamp))}
                </Text>
                <Ionicons name="time" size={20} color={COLORS.primary} />
              </TouchableOpacity>
            </View>

            {showDatePicker && (
              <View style={dateTimePickerStyle}>
                <DateTimePicker
                  value={new Date(newMedication.timestamp)}
                  mode="date"
                  display={Platform.OS === "ios" ? "spinner" : "default"}
                  onChange={handleDateChange}
                  textColor={COLORS.text}
                />
                <View style={styles.pickerButtonsContainer}>
                  <TouchableOpacity
                    style={[styles.pickerButton, styles.cancelPickerButton]}
                    onPress={() => setShowDatePicker(false)}
                  >
                    <Text style={styles.cancelPickerButtonText}>Cancel</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.pickerButton, styles.okPickerButton]}
                    onPress={() => {
                      // Just close the picker as the onChange event already updates the value
                      setShowDatePicker(false);
                    }}
                  >
                    <Text style={styles.okPickerButtonText}>OK</Text>
                  </TouchableOpacity>
                </View>
              </View>
            )}

            {showTimePicker && (
              <View style={dateTimePickerStyle}>
                <DateTimePicker
                  value={new Date(newMedication.timestamp)}
                  mode="time"
                  display={Platform.OS === "ios" ? "spinner" : "default"}
                  onChange={handleTimeChange}
                  is24Hour={false}
                  textColor={COLORS.text}
                />
                <View style={styles.pickerButtonsContainer}>
                  <TouchableOpacity
                    style={[styles.pickerButton, styles.cancelPickerButton]}
                    onPress={() => setShowTimePicker(false)}
                  >
                    <Text style={styles.cancelPickerButtonText}>Cancel</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.pickerButton, styles.okPickerButton]}
                    onPress={() => {
                      // Just close the picker as the onChange event already updates the value
                      setShowTimePicker(false);
                    }}
                  >
                    <Text style={styles.okPickerButtonText}>OK</Text>
                  </TouchableOpacity>
                </View>
              </View>
            )}
          </View>

          <View style={styles.formGroup}>
            <Text style={styles.label}>Notes</Text>
            <TextInput
              style={styles.textArea}
              placeholder="Add optional notes"
              multiline
              numberOfLines={4}
              value={newMedication.notes}
              onChangeText={(text) =>
                setNewMedication((prev) => ({ ...prev, notes: text }))
              }
              inputAccessoryViewID={
                Platform.OS === "ios" ? inputAccessoryViewID : undefined
              }
            />
          </View>

          <View style={styles.formGroup}>
            <Text style={styles.label}>Photo</Text>
            <View style={styles.photoContainer}>
              {selectedImage ? (
                <View style={styles.selectedImageContainer}>
                  <Image
                    source={{ uri: selectedImage }}
                    style={styles.selectedImage}
                  />
                  <TouchableOpacity
                    style={styles.removeImageButton}
                    onPress={() => {
                      setSelectedImage(null);
                      setNewMedication((prev) => ({
                        ...prev,
                        photoUri: undefined,
                      }));
                    }}
                  >
                    <Ionicons
                      name="close-circle"
                      size={24}
                      color={COLORS.danger}
                    />
                  </TouchableOpacity>
                </View>
              ) : (
                <View style={styles.photoButtons}>
                  <TouchableOpacity
                    style={styles.photoButton}
                    onPress={takePhoto}
                  >
                    <Ionicons name="camera" size={24} color={COLORS.primary} />
                    <Text style={styles.photoButtonText}>Take Photo</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={styles.photoButton}
                    onPress={pickImage}
                  >
                    <Ionicons name="image" size={24} color={COLORS.primary} />
                    <Text style={styles.photoButtonText}>
                      Choose from Library
                    </Text>
                  </TouchableOpacity>
                </View>
              )}
            </View>
          </View>
        </View>

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
    </Modal>
  );

  const renderImageViewerModal = () => (
    <Modal
      visible={showImageModal}
      transparent={true}
      animationType="fade"
      onRequestClose={() => setShowImageModal(false)}
    >
      <View style={styles.imageViewerContainer}>
        <TouchableOpacity
          style={styles.imageViewerCloseButton}
          onPress={() => setShowImageModal(false)}
        >
          <Ionicons name="close" size={28} color="white" />
        </TouchableOpacity>

        {selectedImage && (
          <Image
            source={{ uri: selectedImage }}
            style={styles.fullImage}
            resizeMode="contain"
          />
        )}
      </View>
    </Modal>
  );

  return (
    <Container scrollable={false}>
      <View style={styles.header}>
        <Text style={styles.title}>Medication Log</Text>
        <Button
          title="Add Medication"
          onPress={() => setShowAddModal(true)}
          size="small"
        />
      </View>

      <View style={styles.statsContainer}>
        <Card variant="elevated" style={styles.statCard}>
          <Text style={styles.statValue}>{medications.length}</Text>
          <Text style={styles.statLabel}>Total Doses</Text>
        </Card>

        <Card variant="elevated" style={styles.statCard}>
          <Text style={styles.statValue}>
            {medications.reduce((sum, med) => sum + med.units, 0).toFixed(1)}
          </Text>
          <Text style={styles.statLabel}>Total Units</Text>
        </Card>

        <Card variant="elevated" style={styles.statCard}>
          <Text style={styles.statValue}>
            {medications.length > 0
              ? (
                  medications.reduce((sum, med) => sum + med.units, 0) /
                  medications.length
                ).toFixed(1)
              : "0"}
          </Text>
          <Text style={styles.statLabel}>Avg Units</Text>
        </Card>
      </View>

      <Text style={styles.sectionTitle}>Recent Medications</Text>

      {medications.length > 0 ? (
        <FlatList
          data={filteredMedications}
          renderItem={renderMedicationItem}
          keyExtractor={(item) => item.id?.toString() || ""}
          refreshControl={
            <RefreshControl refreshing={loading} onRefresh={loadMedications} />
          }
          contentContainerStyle={styles.listContainer}
        />
      ) : (
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyText}>No medications recorded yet</Text>
          <Button
            title="Add First Medication"
            onPress={() => setShowAddModal(true)}
            style={styles.addButton}
          />
        </View>
      )}

      {renderAddMedicationModal()}
      {renderImageViewerModal()}
    </Container>
  );
};

const styles = StyleSheet.create({
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: SIZES.md,
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    color: COLORS.text,
  },
  statsContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: SIZES.lg,
  },
  statCard: {
    flex: 1,
    marginHorizontal: 4,
    padding: SIZES.sm,
    alignItems: "center",
  },
  statValue: {
    fontSize: 20,
    fontWeight: "bold",
    color: COLORS.primary,
  },
  statLabel: {
    fontSize: 12,
    color: COLORS.lightText,
    marginTop: 4,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: SIZES.sm,
    color: COLORS.text,
  },
  listContainer: {
    paddingBottom: SIZES.lg,
  },
  medicationCard: {
    marginBottom: SIZES.sm,
  },
  medicationHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  medicationType: {
    fontSize: 16,
    fontWeight: "bold",
    color: COLORS.text,
  },
  medicationTime: {
    fontSize: 12,
    color: COLORS.lightText,
  },
  dosageContainer: {
    flexDirection: "row",
    alignItems: "baseline",
  },
  dosageValue: {
    fontSize: 22,
    fontWeight: "bold",
    color: COLORS.primary,
  },
  dosageUnit: {
    fontSize: 14,
    color: COLORS.lightText,
    marginLeft: 4,
  },
  notesContainer: {
    marginTop: SIZES.sm,
    paddingTop: SIZES.sm,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
  },
  notesLabel: {
    fontSize: 14,
    fontWeight: "bold",
    color: COLORS.text,
  },
  notesText: {
    fontSize: 14,
    color: COLORS.text,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: SIZES.xl,
  },
  emptyText: {
    fontSize: 16,
    color: COLORS.lightText,
    marginBottom: SIZES.md,
    textAlign: "center",
  },
  addButton: {
    marginTop: SIZES.sm,
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: SIZES.md,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: COLORS.text,
  },
  saveButton: {
    color: COLORS.primary,
    fontSize: 16,
    fontWeight: "bold",
  },
  formContainer: {
    paddingVertical: SIZES.sm,
  },
  formGroup: {
    marginBottom: SIZES.lg,
  },
  label: {
    fontSize: 16,
    fontWeight: "500",
    color: COLORS.text,
    marginBottom: SIZES.xs,
  },
  input: {
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: SIZES.xs,
    padding: SIZES.sm,
    fontSize: 16,
    backgroundColor: COLORS.inputBackground,
  },
  typeContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  typeButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: SIZES.sm,
    paddingHorizontal: SIZES.md,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: SIZES.sm,
    backgroundColor: COLORS.inputBackground,
    flex: 1,
    marginHorizontal: 4,
  },
  typeButtonSelected: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  typeButtonText: {
    fontSize: 14,
    color: COLORS.text,
    marginLeft: 5,
  },
  typeButtonTextSelected: {
    color: "white",
  },
  dosageInputContainer: {
    flexDirection: "row",
    alignItems: "center",
  },
  dosageInput: {
    flex: 1,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: SIZES.xs,
    padding: SIZES.sm,
    fontSize: 16,
    backgroundColor: COLORS.inputBackground,
    marginRight: SIZES.sm,
  },
  unitSelector: {
    flexDirection: "row",
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: SIZES.xs,
    overflow: "hidden",
    backgroundColor: COLORS.inputBackground,
  },
  unitButton: {
    paddingVertical: SIZES.sm,
    paddingHorizontal: SIZES.md,
    alignItems: "center",
    justifyContent: "center",
    borderRightWidth: 1,
    borderRightColor: COLORS.border,
  },
  unitButtonSelected: {
    backgroundColor: COLORS.primary,
  },
  unitButtonText: {
    fontSize: 14,
    color: COLORS.text,
  },
  unitButtonTextSelected: {
    color: "white",
  },
  dateTimeContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  dateTimeButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: SIZES.xs,
    padding: SIZES.sm,
    backgroundColor: COLORS.inputBackground,
    width: "48%",
  },
  dateTimeText: {
    fontSize: 14,
    color: COLORS.text,
  },
  textArea: {
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: SIZES.xs,
    padding: SIZES.sm,
    fontSize: 16,
    backgroundColor: COLORS.inputBackground,
    height: 100,
    textAlignVertical: "top",
  },
  photoContainer: {
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: SIZES.xs,
    padding: SIZES.md,
    backgroundColor: COLORS.inputBackground,
    alignItems: "center",
  },
  photoButtons: {
    flexDirection: "row",
    justifyContent: "space-around",
    width: "100%",
  },
  photoButton: {
    alignItems: "center",
    padding: SIZES.md,
  },
  photoButtonText: {
    color: COLORS.primary,
    marginTop: SIZES.xs,
    fontSize: 14,
  },
  selectedImageContainer: {
    position: "relative",
    width: "100%",
    height: 200,
  },
  selectedImage: {
    width: "100%",
    height: 200,
    borderRadius: SIZES.xs,
  },
  removeImageButton: {
    position: "absolute",
    top: 10,
    right: 10,
    backgroundColor: "white",
    borderRadius: 15,
  },
  fixedUnitDisplay: {
    paddingHorizontal: SIZES.md,
    paddingVertical: SIZES.sm,
    backgroundColor: COLORS.inputBackground,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: SIZES.xs,
    marginLeft: SIZES.sm,
    justifyContent: "center",
  },
  fixedUnitText: {
    fontSize: 14,
    color: COLORS.text,
  },
  typeButtonIconText: {
    fontSize: 16,
    marginRight: 5,
  },
  pickerButtonsContainer: {
    flexDirection: "row",
    justifyContent: "center",
    marginTop: 8,
    marginBottom: 8,
  },
  pickerButton: {
    paddingHorizontal: 20,
    paddingVertical: 8,
    borderRadius: 20,
    marginHorizontal: 8,
  },
  okPickerButton: {
    backgroundColor: COLORS.primary,
  },
  cancelPickerButton: {
    backgroundColor: "#E0E0E0",
  },
  okPickerButtonText: {
    color: "white",
    fontWeight: "500",
  },
  cancelPickerButtonText: {
    color: COLORS.text,
  },
  keyboardAccessory: {
    height: 44,
    backgroundColor: "#f8f8f8",
    borderTopWidth: 1,
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
  cancelButton: {
    color: COLORS.text,
    fontSize: 16,
    fontWeight: "500",
  },
  imageViewerContainer: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.9)",
    justifyContent: "center",
    alignItems: "center",
  },
  imageViewerCloseButton: {
    position: "absolute",
    top: 40,
    right: 20,
    zIndex: 10,
  },
  fullImage: {
    width: "100%",
    height: "80%",
  },
});

export default MedicationScreen;
