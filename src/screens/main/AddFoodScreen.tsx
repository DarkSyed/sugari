import React, { useState } from 'react';
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
  TouchableWithoutFeedback
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { useForm, Controller } from 'react-hook-form';
import DateTimePicker from '@react-native-community/datetimepicker';
import { Ionicons } from '@expo/vector-icons';
import { Picker } from '@react-native-picker/picker';
import { COLORS, SIZES, VALIDATION } from '../../constants';
import { useAuth } from '../../contexts/AuthContext';
import { addFoodEntry } from '../../services/databaseFix';
import Container from '../../components/Container';
import Input from '../../components/Input';
import Button from '../../components/Button';
import Card from '../../components/Card';

type FormData = {
  name: string;
  carbs: string;
  meal: 'breakfast' | 'lunch' | 'dinner' | 'snack';
  notes: string;
};

// Define meal options similar to MEAL_CONTEXTS in constants
const MEAL_OPTIONS = [
  { label: 'Breakfast', value: 'breakfast' },
  { label: 'Lunch', value: 'lunch' },
  { label: 'Dinner', value: 'dinner' },
  { label: 'Snack', value: 'snack' },
];

const AddFoodScreen: React.FC = () => {
  const { authState } = useAuth();
  const navigation = useNavigation<StackNavigationProp<any>>();
  const [isLoading, setIsLoading] = useState(false);
  const [timestamp, setTimestamp] = useState(new Date());
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showTimePicker, setShowTimePicker] = useState(false);
  const [showMealPicker, setShowMealPicker] = useState(false);
  const [tempDate, setTempDate] = useState<Date | null>(null);
  const [tempTime, setTempTime] = useState<Date | null>(null);
  const inputAccessoryViewID = 'inputAccessoryViewFoodScreen';

  const {
    control,
    handleSubmit,
    formState: { errors },
    reset,
    setValue,
  } = useForm<FormData>({
    defaultValues: {
      name: '',
      carbs: '',
      meal: 'breakfast',
      notes: '',
    },
  });

  const onSubmit = async (data: FormData) => {
    setIsLoading(true);
    try {
      await addFoodEntry({
        name: data.name,
        carbs: parseFloat(data.carbs),
        timestamp: timestamp.getTime(),
        notes: data.notes || null,
      });

      // Reset form and navigate directly to log screen
      reset();
      navigation.navigate('SugarLog'); // Navigate to the log screen to see the entry
    } catch (error) {
      console.error('Error saving food entry:', error);
      Alert.alert('Error', 'Failed to save food entry. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const onDateChange = (event: any, selectedDate?: Date) => {
    if (Platform.OS === 'android') {
      // On Android, update only when "set" is triggered (user taps OK)
      if (event.type === 'set' && selectedDate) {
        const currentTime = new Date(timestamp);
        selectedDate.setHours(currentTime.getHours());
        selectedDate.setMinutes(currentTime.getMinutes());
        setTimestamp(selectedDate);
        setShowDatePicker(false);
      } else if (event.type === 'dismissed') {
        setShowDatePicker(false);
      }
    } else {
      // On iOS, don't update right away, just store the temporary value
      if (selectedDate) {
        const currentTime = new Date(timestamp);
        selectedDate.setHours(currentTime.getHours());
        selectedDate.setMinutes(currentTime.getMinutes());
        setTempDate(selectedDate);
      }
    }
  };

  const onTimeChange = (event: any, selectedTime?: Date) => {
    if (Platform.OS === 'android') {
      // On Android, update only when "set" is triggered (user taps OK)
      if (event.type === 'set' && selectedTime) {
        const newDate = new Date(timestamp);
        newDate.setHours(selectedTime.getHours());
        newDate.setMinutes(selectedTime.getMinutes());
        setTimestamp(newDate);
        setShowTimePicker(false);
      } else if (event.type === 'dismissed') {
        setShowTimePicker(false);
      }
    } else {
      // On iOS, don't update right away, just store the temporary value
      if (selectedTime) {
        const newDate = new Date(timestamp);
        newDate.setHours(selectedTime.getHours());
        newDate.setMinutes(selectedTime.getMinutes());
        setTempTime(newDate);
      }
    }
  };

  const showDatepicker = () => {
    if (showDatePicker) {
      // If already open, close it (toggle behavior)
      setShowDatePicker(false);
    } else {
      // Close time picker if open and open date picker
      setShowTimePicker(false);
      setShowDatePicker(true);
    }
  };

  const showTimepicker = () => {
    if (showTimePicker) {
      // If already open, close it (toggle behavior)
      setShowTimePicker(false);
    } else {
      // Close date picker if open and open time picker
      setShowDatePicker(false);
      setShowTimePicker(true);
    }
  };

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const dateTimePickerStyle = Platform.OS === 'ios' ? {
    alignSelf: 'center' as const,
    marginBottom: SIZES.md,
    width: '100%' as unknown as number
  } : {};

  const getMealLabel = (value: string) => {
    const meal = MEAL_OPTIONS.find(m => m.value === value);
    return meal ? meal.label : 'Breakfast';
  };

  const renderMealContextModal = () => {
    return (
      <Modal
        visible={showMealPicker}
        transparent
        animationType="slide"
        onRequestClose={() => setShowMealPicker(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Select Meal</Text>
              <TouchableOpacity onPress={() => setShowMealPicker(false)}>
                <Ionicons name="close" size={24} color={COLORS.text} />
              </TouchableOpacity>
            </View>
            
            <View style={styles.mealContextList}>
              {MEAL_OPTIONS.map((meal) => (
                <TouchableOpacity
                  key={meal.value}
                  style={[
                    styles.mealContextItem,
                    control._formValues.meal === meal.value && styles.selectedMealContext
                  ]}
                  onPress={() => {
                    setValue('meal', meal.value as any);
                    setShowMealPicker(false);
                  }}
                >
                  <Text 
                    style={[
                      styles.mealContextText,
                      control._formValues.meal === meal.value && styles.selectedMealContextText
                    ]}
                  >
                    {meal.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        </View>
      </Modal>
    );
  };

  // --- Calculate potential offset ---
  // Example: If using react-navigation header, you might use useHeaderHeight()
  // import { useHeaderHeight } from '@react-navigation/elements';
  // const headerHeight = useHeaderHeight();
  // Otherwise, use the known height of your custom header or tab bar.
  const iosOffset = 60; // Example: Replace with actual header/tab bar height if applicable
  const androidOffset = 0; // Example: Start with 0 for Android and test

  return (
    <Container keyboardAvoiding={false}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardAvoidingContainer}
        keyboardVerticalOffset={Platform.OS === 'ios' ? iosOffset : androidOffset}
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
                  <Ionicons name="arrow-back-outline" size={24} color={COLORS.primary} />
            </TouchableOpacity>
                <View style={styles.headerTitleContainer}>
            <Text style={styles.title}>Add Food</Text>
                </View>
                <View style={styles.headerSpacer} />
          </View>

          <Card variant="elevated" style={styles.inputCard}>
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
                  message: 'Please enter a valid number',
                },
                validate: {
                  min: value => parseFloat(value) > 0 || VALIDATION.CARBS_MIN,
                  max: value => parseFloat(value) <= 500 || VALIDATION.CARBS_MAX,
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
                      inputAccessoryViewID={Platform.OS === 'ios' ? inputAccessoryViewID : undefined}
                />
              )}
              name="carbs"
            />

            <Text style={styles.label}>When did you eat this?</Text>
            <View style={styles.dateTimeContainer}>
              <TouchableOpacity
                style={styles.dateTimeButton}
                onPress={showDatepicker}
              >
                <Text style={styles.dateTimeText}>
                  {formatDate(timestamp)}
                </Text>
                <Ionicons name="calendar-outline" size={20} color={COLORS.primary} style={styles.dateTimeIcon} />
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.dateTimeButton}
                onPress={showTimepicker}
              >
                <Text style={styles.dateTimeText}>
                  {formatTime(timestamp)}
                </Text>
                <Ionicons name="time-outline" size={20} color={COLORS.primary} style={styles.dateTimeIcon} />
              </TouchableOpacity>
            </View>

            {showDatePicker && (
              <View style={dateTimePickerStyle}>
                <DateTimePicker
                  value={timestamp}
                  mode="date"
                  display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                  onChange={onDateChange}
                  maximumDate={new Date()}
                  style={{width: '100%'}}
                />
                <View style={styles.pickerButtonsContainer}>
                  <TouchableOpacity 
                    style={[styles.pickerButton, styles.cancelPickerButton]} 
                    onPress={() => {
                      setTempDate(null);
                      setShowDatePicker(false);
                    }}
                  >
                    <Text style={styles.cancelPickerButtonText}>Cancel</Text>
                  </TouchableOpacity>
                  <TouchableOpacity 
                    style={[styles.pickerButton, styles.okPickerButton]} 
                    onPress={() => {
                      // Apply the temp date value on iOS
                      if (Platform.OS === 'ios' && tempDate) {
                        setTimestamp(tempDate);
                        setTempDate(null);
                      }
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
                  value={timestamp}
                  mode="time"
                  display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                  onChange={onTimeChange}
                  is24Hour={false}
                  style={{width: '100%'}}
                />
                <View style={styles.pickerButtonsContainer}>
                  <TouchableOpacity 
                    style={[styles.pickerButton, styles.cancelPickerButton]} 
                    onPress={() => {
                      setTempTime(null);
                      setShowTimePicker(false);
                    }}
                  >
                    <Text style={styles.cancelPickerButtonText}>Cancel</Text>
                  </TouchableOpacity>
                  <TouchableOpacity 
                    style={[styles.pickerButton, styles.okPickerButton]} 
                    onPress={() => {
                      // Apply the temp time value on iOS
                      if (Platform.OS === 'ios' && tempTime) {
                        setTimestamp(tempTime);
                        setTempTime(null);
                      }
                      setShowTimePicker(false);
                    }}
                  >
                    <Text style={styles.okPickerButtonText}>OK</Text>
                  </TouchableOpacity>
                </View>
              </View>
            )}

            <Text style={styles.label}>Meal</Text>
            <Controller
              control={control}
              render={({ field: { value } }) => (
                <TouchableOpacity 
                  style={styles.mealContextButton}
                  onPress={() => setShowMealPicker(true)}
                >
                  <Text style={styles.mealContextButtonText}>
                    {getMealLabel(value)}
                  </Text>
                  <Ionicons name="chevron-down" size={16} color={COLORS.text} />
                </TouchableOpacity>
              )}
              name="meal"
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
                title="Save Entry"
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
      
      {renderMealContextModal()}

      {/* Input Accessory View for iOS with simplified styling */}
      {Platform.OS === 'ios' && (
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
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: SIZES.md,
    width: '100%',
  },
  backButton: {
    padding: SIZES.xs,
  },
  headerTitleContainer: {
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    color: COLORS.text,
    textAlign: 'center',
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
    fontWeight: '500',
  },
  dateTimeContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: SIZES.md,
  },
  dateTimeButton: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: COLORS.inputBackground,
    borderRadius: SIZES.xs,
    padding: SIZES.sm,
    borderWidth: 1,
    borderColor: COLORS.border,
    flex: 1,
    marginRight: 8,
  },
  dateTimeText: {
    fontSize: 16,
    color: COLORS.text,
  },
  dateTimeIcon: {
    marginLeft: 4,
  },
  pickerContainer: {
    backgroundColor: COLORS.inputBackground,
    borderRadius: SIZES.xs,
    borderWidth: 1,
    borderColor: COLORS.border,
    marginBottom: SIZES.md,
    overflow: 'hidden',
  },
  picker: {
    height: 50,
  },
  notesInput: {
    height: 80,
    textAlignVertical: 'top',
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
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
  pickerButtonsContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
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
    backgroundColor: '#E0E0E0',
  },
  okPickerButtonText: {
    color: 'white',
    fontWeight: '500',
  },
  cancelPickerButtonText: {
    color: COLORS.text,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: COLORS.cardBackground,
    borderTopLeftRadius: SIZES.md,
    borderTopRightRadius: SIZES.md,
    padding: SIZES.lg,
    maxHeight: '70%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SIZES.md,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: COLORS.text,
  },
  mealContextList: {
    marginBottom: SIZES.md,
  },
  mealContextItem: {
    paddingVertical: SIZES.sm,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  selectedMealContext: {
    backgroundColor: COLORS.primary + '20',
  },
  mealContextText: {
    fontSize: 16,
    color: COLORS.text,
  },
  selectedMealContextText: {
    color: COLORS.primary,
    fontWeight: 'bold',
  },
  mealContextButton: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: COLORS.inputBackground,
    borderRadius: SIZES.xs,
    borderWidth: 1,
    borderColor: COLORS.border,
    padding: SIZES.sm,
    marginBottom: SIZES.md,
  },
  mealContextButtonText: {
    fontSize: 16,
    color: COLORS.text,
  },
  keyboardAccessory: {
    height: 44,
    backgroundColor: '#f8f8f8',
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: '#d8d8d8',
    flexDirection: 'row',
    justifyContent: 'flex-end',
    alignItems: 'center',
    paddingHorizontal: 16,
    width: '100%',
  },
  doneButton: {
    padding: 8,
  },
  doneButtonText: {
    color: COLORS.primary,
    fontSize: 16,
    fontWeight: '600',
  },
  scrollViewContent: {
    flexGrow: 1,
    paddingBottom: SIZES.xl * 2,
  },
  keyboardAvoidingContainer: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  scrollViewContent: {
    flexGrow: 1,
    paddingBottom: SIZES.xl,
  },
  container: {
    flex: 1,
    padding: SIZES.md,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: SIZES.md,
    width: '100%',
  },
  headerTitleContainer: {
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    color: COLORS.text,
    textAlign: 'center',
  },
  inputCard: {
    padding: SIZES.md,
    marginBottom: SIZES.lg,
  },
  label: {
    fontSize: 16,
    fontWeight: '500',
    marginBottom: SIZES.xs,
    color: COLORS.text,
  },
  dateTimeContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: SIZES.md,
  },
  dateTimeButton: {
    width: '48.5%',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.inputBackground,
    borderRadius: SIZES.xs,
    paddingVertical: SIZES.sm,
    paddingHorizontal: SIZES.xs,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  dateTimeText: {
    fontSize: 16,
    color: COLORS.text,
  },
  dateTimeIcon: {
    marginLeft: SIZES.xs,
  },
  mealContextButton: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: COLORS.inputBackground,
    borderRadius: SIZES.xs,
    padding: SIZES.sm,
    borderWidth: 1,
    borderColor: COLORS.border,
    marginBottom: SIZES.md,
  },
  mealContextButtonText: {
    fontSize: 16,
    color: COLORS.text,
  },
  notesInput: {
    height: 80,
    textAlignVertical: 'top',
    marginBottom: SIZES.lg,
  },
  buttonGroup: {
    flexDirection: 'row',
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
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: 'white',
    borderTopLeftRadius: SIZES.md,
    borderTopRightRadius: SIZES.md,
    padding: SIZES.md,
    maxHeight: '70%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SIZES.md,
    paddingBottom: SIZES.sm,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: COLORS.text,
  },
  mealOption: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: SIZES.md,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  mealOptionSelected: {
    backgroundColor: `${COLORS.primary}10`,
  },
  mealOptionText: {
    fontSize: 16,
    color: COLORS.text,
  },
  mealOptionTextSelected: {
    color: COLORS.primary,
    fontWeight: '500',
  },
  iosPickerContainer: {
    borderRadius: SIZES.sm,
    marginBottom: SIZES.md,
  },
  pickerButtonsContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingTop: SIZES.sm,
  },
  pickerButton: {
    paddingVertical: SIZES.xs + 2,
    paddingHorizontal: SIZES.lg,
    borderRadius: 20,
    marginHorizontal: SIZES.sm,
  },
  cancelPickerButton: {
    backgroundColor: '#E0E0E0',
  },
  okPickerButton: {
    backgroundColor: COLORS.primary,
  },
  cancelPickerButtonText: {
    color: COLORS.text,
    fontSize: 16,
    fontWeight: '500',
  },
  okPickerButtonText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 16,
  },
  keyboardAccessory: {
    height: 44,
    backgroundColor: '#f8f8f8',
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: '#d8d8d8',
    flexDirection: 'row',
    justifyContent: 'flex-end',
    alignItems: 'center',
    paddingHorizontal: 16,
    width: '100%',
  },
  doneButton: {
    padding: 8,
  },
  doneButtonText: {
    color: COLORS.primary,
    fontSize: 16,
    fontWeight: '600',
  },
});

export default AddFoodScreen; 