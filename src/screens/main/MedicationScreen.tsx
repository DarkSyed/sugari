import React, { useState, useEffect, useCallback } from 'react';
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
  Alert
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { Ionicons } from '@expo/vector-icons';
import DateTimePicker from '@react-native-community/datetimepicker';
import * as ImagePicker from 'expo-image-picker';
import { COLORS, SIZES, ROUTES } from '../../constants';
import { useApp } from '../../contexts/AppContext';
import { InsulinDose } from '../../types';
import { getInsulinDoses, addInsulinDose } from '../../services/database';
import Container from '../../components/Container';
import Card from '../../components/Card';
import Button from '../../components/Button';
import { formatDateTime, formatDate, formatTime } from '../../utils/dateUtils';

interface Medication {
  id?: number;
  name: string;
  type: 'pill' | 'insulin' | 'injection';
  dosage: string;
  unit: string;
  timestamp: number;
  notes?: string;
  photoUri?: string;
}

const MedicationScreen: React.FC = () => {
  const { theme } = useApp();
  const navigation = useNavigation<StackNavigationProp<any>>();
  const [medications, setMedications] = useState<InsulinDose[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const [loading, setLoading] = useState(true);
  
  // New medication entry state
  const [showAddModal, setShowAddModal] = useState(false);
  const [newMedication, setNewMedication] = useState<Medication>({
    name: '',
    type: 'pill',
    dosage: '',
    unit: 'mg',
    timestamp: new Date().getTime(),
    notes: '',
  });
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showTimePicker, setShowTimePicker] = useState(false);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);

  const fetchMedications = useCallback(async () => {
    try {
      setLoading(true);
      const insulinData = await getInsulinDoses();
      setMedications(insulinData);
    } catch (error) {
      console.error('Error fetching medications:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchMedications();
  }, [fetchMedications]);

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchMedications();
  };

  const handleAddMedication = () => {
    // Reset form
    setNewMedication({
      name: '',
      type: 'pill',
      dosage: '',
      unit: 'mg',
      timestamp: new Date().getTime(),
      notes: '',
    });
    setSelectedImage(null);
    setShowAddModal(true);
  };

  const handleSaveMedication = async () => {
    if (!newMedication.name.trim()) {
      Alert.alert('Error', 'Please enter a medication name');
      return;
    }

    if (!newMedication.dosage.trim()) {
      Alert.alert('Error', 'Please enter a dosage amount');
      return;
    }

    try {
      // For now, we'll adapt this to save to our insulin database
      // In a real implementation, we'd have a proper medication table
      await addInsulinDose({
        units: parseFloat(newMedication.dosage),
        type: newMedication.name,
        timestamp: newMedication.timestamp,
        notes: `${newMedication.type} - ${newMedication.unit} ${newMedication.notes ? '- ' + newMedication.notes : ''}`
      });
      
      setShowAddModal(false);
      fetchMedications();
    } catch (error) {
      console.error('Error saving medication:', error);
      Alert.alert('Error', 'Failed to save medication');
    }
  };

  const handleTypeSelect = (type: 'pill' | 'insulin' | 'injection') => {
    setNewMedication(prev => ({ 
      ...prev, 
      type, 
      unit: type === 'insulin' ? 'units' : type === 'pill' ? 'mg' : 'ml' 
    }));
  };

  const handleUnitSelect = (unit: string) => {
    setNewMedication(prev => ({ ...prev, unit }));
  };

  const handleDateChange = (event: any, selectedDate?: Date) => {
    // Only close the picker when a date is selected
    if (event.type === 'set' && selectedDate) {
      setShowDatePicker(false);
      
      const currentDateTime = new Date(newMedication.timestamp);
      selectedDate.setHours(currentDateTime.getHours());
      selectedDate.setMinutes(currentDateTime.getMinutes());
      
      setNewMedication(prev => ({
        ...prev,
        timestamp: selectedDate.getTime()
      }));
    } else if (event.type === 'dismissed') {
      setShowDatePicker(false);
    }
  };

  const handleTimeChange = (event: any, selectedTime?: Date) => {
    // Only close the picker when a time is selected
    if (event.type === 'set' && selectedTime) {
      setShowTimePicker(false);
      
      const currentDateTime = new Date(newMedication.timestamp);
      currentDateTime.setHours(selectedTime.getHours());
      currentDateTime.setMinutes(selectedTime.getMinutes());
      
      setNewMedication(prev => ({
        ...prev,
        timestamp: currentDateTime.getTime()
      }));
    } else if (event.type === 'dismissed') {
      setShowTimePicker(false);
    }
  };

  const pickImage = async () => {
    try {
      const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();
      
      if (!permissionResult.granted) {
        Alert.alert('Permission Required', 'You need to grant access to your photos to upload an image');
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
        setNewMedication(prev => ({ ...prev, photoUri: result.assets[0].uri }));
      }
    } catch (error) {
      console.error('Error picking image:', error);
      Alert.alert('Error', 'Failed to pick image');
    }
  };

  const takePhoto = async () => {
    try {
      const permissionResult = await ImagePicker.requestCameraPermissionsAsync();
      
      if (!permissionResult.granted) {
        Alert.alert('Permission Required', 'You need to grant access to your camera to take a photo');
        return;
      }
      
      const result = await ImagePicker.launchCameraAsync({
        allowsEditing: true,
        aspect: [4, 3],
        quality: 0.8,
      });
      
      if (!result.canceled) {
        setSelectedImage(result.assets[0].uri);
        setNewMedication(prev => ({ ...prev, photoUri: result.assets[0].uri }));
      }
    } catch (error) {
      console.error('Error taking photo:', error);
      Alert.alert('Error', 'Failed to take photo');
    }
  };

  const renderMedicationItem = ({ item }: { item: InsulinDose }) => (
    <Card variant="elevated" style={styles.medicationCard}>
      <View style={styles.medicationHeader}>
        <View>
          <Text style={styles.medicationType}>{item.type}</Text>
          <Text style={styles.medicationTime}>{formatDateTime(item.timestamp)}</Text>
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
      <Container>
        <View style={styles.modalHeader}>
          <TouchableOpacity onPress={() => setShowAddModal(false)}>
            <Ionicons name="close" size={24} color={COLORS.text} />
          </TouchableOpacity>
          <Text style={styles.modalTitle}>Add Medication</Text>
          <TouchableOpacity onPress={handleSaveMedication}>
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
              onChangeText={(text) => setNewMedication(prev => ({ ...prev, name: text }))}
            />
          </View>

          <View style={styles.formGroup}>
            <Text style={styles.label}>Type</Text>
            <View style={styles.typeContainer}>
              <TouchableOpacity
                style={[
                  styles.typeButton,
                  newMedication.type === 'pill' && styles.typeButtonSelected
                ]}
                onPress={() => handleTypeSelect('pill')}
              >
                <Ionicons 
                  name="medical" 
                  size={20} 
                  color={newMedication.type === 'pill' ? 'white' : COLORS.text} 
                />
                <Text 
                  style={[
                    styles.typeButtonText,
                    newMedication.type === 'pill' && styles.typeButtonTextSelected
                  ]}
                >
                  Pill
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.typeButton,
                  newMedication.type === 'insulin' && styles.typeButtonSelected
                ]}
                onPress={() => handleTypeSelect('insulin')}
              >
                <Ionicons 
                  name="fitness" 
                  size={20} 
                  color={newMedication.type === 'insulin' ? 'white' : COLORS.text} 
                />
                <Text 
                  style={[
                    styles.typeButtonText,
                    newMedication.type === 'insulin' && styles.typeButtonTextSelected
                  ]}
                >
                  Insulin
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.typeButton,
                  newMedication.type === 'injection' && styles.typeButtonSelected
                ]}
                onPress={() => handleTypeSelect('injection')}
              >
                <Ionicons 
                  name="medkit-outline" 
                  size={20} 
                  color={newMedication.type === 'injection' ? 'white' : COLORS.text} 
                />
                <Text 
                  style={[
                    styles.typeButtonText,
                    newMedication.type === 'injection' && styles.typeButtonTextSelected
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
                style={[styles.dosageInput, newMedication.type === 'insulin' ? { flex: 1 } : { flex: 2 }]}
                placeholder="Amount"
                keyboardType="numeric"
                value={newMedication.dosage}
                onChangeText={(text) => setNewMedication(prev => ({ ...prev, dosage: text }))}
              />
              
              {newMedication.type === 'insulin' ? (
                <View style={styles.fixedUnitDisplay}>
                  <Text style={styles.fixedUnitText}>units</Text>
                </View>
              ) : (
                <View style={styles.unitSelector}>
                  {newMedication.type === 'pill' && (
                    <View style={[styles.unitButton, styles.unitButtonSelected]}>
                      <Text style={styles.unitButtonTextSelected}>mg</Text>
                    </View>
                  )}
                  {newMedication.type === 'injection' && (
                    <View style={[styles.unitButton, styles.unitButtonSelected]}>
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
                onPress={() => setShowDatePicker(true)}
              >
                <Text style={styles.dateTimeText}>
                  {formatDate(new Date(newMedication.timestamp))}
                </Text>
                <Ionicons name="calendar" size={20} color={COLORS.primary} />
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={styles.dateTimeButton} 
                onPress={() => setShowTimePicker(true)}
              >
                <Text style={styles.dateTimeText}>
                  {formatTime(new Date(newMedication.timestamp))}
                </Text>
                <Ionicons name="time" size={20} color={COLORS.primary} />
              </TouchableOpacity>
            </View>
            
            {showDatePicker && (
              <DateTimePicker
                value={new Date(newMedication.timestamp)}
                mode="date"
                display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                onChange={handleDateChange}
              />
            )}
            
            {showTimePicker && (
              <DateTimePicker
                value={new Date(newMedication.timestamp)}
                mode="time"
                display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                onChange={handleTimeChange}
              />
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
              onChangeText={(text) => setNewMedication(prev => ({ ...prev, notes: text }))}
            />
          </View>

          <View style={styles.formGroup}>
            <Text style={styles.label}>Photo</Text>
            <View style={styles.photoContainer}>
              {selectedImage ? (
                <View style={styles.selectedImageContainer}>
                  <Image source={{ uri: selectedImage }} style={styles.selectedImage} />
                  <TouchableOpacity 
                    style={styles.removeImageButton} 
                    onPress={() => {
                      setSelectedImage(null);
                      setNewMedication(prev => ({ ...prev, photoUri: undefined }));
                    }}
                  >
                    <Ionicons name="close-circle" size={24} color={COLORS.danger} />
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
                    <Text style={styles.photoButtonText}>Choose from Library</Text>
                  </TouchableOpacity>
                </View>
              )}
            </View>
          </View>
        </View>
      </Container>
    </Modal>
  );

  return (
    <Container>
      <View style={styles.header}>
        <Text style={styles.title}>Medication Log</Text>
        <Button 
          title="Add Medication" 
          onPress={handleAddMedication}
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
              ? (medications.reduce((sum, med) => sum + med.units, 0) / medications.length).toFixed(1) 
              : '0'}
          </Text>
          <Text style={styles.statLabel}>Avg Units</Text>
        </Card>
      </View>

      <Text style={styles.sectionTitle}>Recent Medications</Text>
      
      {medications.length > 0 ? (
        <FlatList
          data={medications}
          renderItem={renderMedicationItem}
          keyExtractor={(item) => item.id.toString()}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
          }
          contentContainerStyle={styles.listContainer}
        />
      ) : (
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyText}>No medications recorded yet</Text>
          <Button
            title="Add First Medication"
            onPress={handleAddMedication}
            style={styles.addButton}
          />
        </View>
      )}

      {renderAddMedicationModal()}
    </Container>
  );
};

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SIZES.md,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: COLORS.text,
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: SIZES.lg,
  },
  statCard: {
    flex: 1,
    marginHorizontal: 4,
    padding: SIZES.sm,
    alignItems: 'center',
  },
  statValue: {
    fontSize: 20,
    fontWeight: 'bold',
    color: COLORS.primary,
  },
  statLabel: {
    fontSize: 12,
    color: COLORS.lightText,
    marginTop: 4,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
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
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  medicationType: {
    fontSize: 16,
    fontWeight: 'bold',
    color: COLORS.text,
  },
  medicationTime: {
    fontSize: 12,
    color: COLORS.lightText,
  },
  dosageContainer: {
    flexDirection: 'row',
    alignItems: 'baseline',
  },
  dosageValue: {
    fontSize: 22,
    fontWeight: 'bold',
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
    fontWeight: 'bold',
    color: COLORS.text,
  },
  notesText: {
    fontSize: 14,
    color: COLORS.text,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: SIZES.xl,
  },
  emptyText: {
    fontSize: 16,
    color: COLORS.lightText,
    marginBottom: SIZES.md,
    textAlign: 'center',
  },
  addButton: {
    marginTop: SIZES.sm,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: SIZES.md,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: COLORS.text,
  },
  saveButton: {
    color: COLORS.primary,
    fontSize: 16,
    fontWeight: 'bold',
  },
  formContainer: {
    paddingVertical: SIZES.sm,
  },
  formGroup: {
    marginBottom: SIZES.lg,
  },
  label: {
    fontSize: 16,
    fontWeight: '500',
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
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  typeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
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
    color: 'white',
  },
  dosageInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
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
    flexDirection: 'row',
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: SIZES.xs,
    overflow: 'hidden',
    backgroundColor: COLORS.inputBackground,
  },
  unitButton: {
    paddingVertical: SIZES.sm,
    paddingHorizontal: SIZES.md,
    alignItems: 'center',
    justifyContent: 'center',
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
    color: 'white',
  },
  dateTimeContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  dateTimeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: SIZES.xs,
    padding: SIZES.sm,
    backgroundColor: COLORS.inputBackground,
    width: '48%',
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
    textAlignVertical: 'top',
  },
  photoContainer: {
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: SIZES.xs,
    padding: SIZES.md,
    backgroundColor: COLORS.inputBackground,
    alignItems: 'center',
  },
  photoButtons: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    width: '100%',
  },
  photoButton: {
    alignItems: 'center',
    padding: SIZES.md,
  },
  photoButtonText: {
    color: COLORS.primary,
    marginTop: SIZES.xs,
    fontSize: 14,
  },
  selectedImageContainer: {
    position: 'relative',
    width: '100%',
    height: 200,
  },
  selectedImage: {
    width: '100%',
    height: 200,
    borderRadius: SIZES.xs,
  },
  removeImageButton: {
    position: 'absolute',
    top: 10,
    right: 10,
    backgroundColor: 'white',
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
    justifyContent: 'center',
  },
  fixedUnitText: {
    fontSize: 14,
    color: COLORS.text,
  },
  typeButtonIconText: {
    fontSize: 16,
    marginRight: 5,
  },
});

export default MedicationScreen; 