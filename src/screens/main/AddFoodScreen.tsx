import React, { useState, useEffect } from 'react';
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
import { addFoodEntry } from '../../services/database';
import Container from '../../components/Container';
import Input from '../../components/Input';
import Button from '../../components/Button';
import Card from '../../components/Card';
import { formatDate, formatTime } from '../../utils/dateUtils';

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
  const [keyboardVisible, setKeyboardVisible] = useState(false);
  const inputAccessoryViewID = 'inputAccessoryViewFoodScreen';

  const {
    control,
    handleSubmit,
    formState: { errors },
    reset,
    setValue,
    watch,
  } = useForm<FormData>({
    defaultValues: {
      name: '',
      carbs: '',
      meal: 'breakfast',
      notes: '',
    },
  });

  const mealValue = watch('meal');

  useEffect(() => {
    const keyboardDidShowListener = Keyboard.addListener(
      Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow',
      () => {
        setKeyboardVisible(true);
      }
    );
    const keyboardDidHideListener = Keyboard.addListener(
      Platform.OS === 'ios' ? 'keyboardWillHide' : 'keyboardDidHide',
      () => {
        setKeyboardVisible(false);
      }
    );

    return () => {
      keyboardDidShowListener.remove();
      keyboardDidHideListener.remove();
    };
  }, []);

  const onSubmit = async (data: FormData) => {
    setIsLoading(true);
    try {
      await addFoodEntry({
        name: data.name,
        carbs: parseFloat(data.carbs),
        timestamp: timestamp.getTime(),
        notes: data.notes || null,
      });

      reset();
      Alert.alert('Success', 'Food entry added successfully');
      navigation.goBack();
    } catch (error) {
      console.error('Error saving food entry:', error);
      Alert.alert('Error', 'Failed to save food entry. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const onDateChange = (event: any, selectedDate?: Date) => {
    if (Platform.OS === 'android') {
      setShowDatePicker(false);
      if (event.type === 'set' && selectedDate) {
        const currentTime = new Date(timestamp);
        selectedDate.setHours(currentTime.getHours());
        selectedDate.setMinutes(currentTime.getMinutes());
        setTimestamp(selectedDate);
      }
    } else {
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
      setShowTimePicker(false);
      if (event.type === 'set' && selectedTime) {
        const newDate = new Date(timestamp);
        newDate.setHours(selectedTime.getHours());
        newDate.setMinutes(selectedTime.getMinutes());
        setTimestamp(newDate);
      }
    } else {
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
      setShowDatePicker(false);
    } else {
      setShowTimePicker(false);
      setShowDatePicker(true);
    }
  };

  const showTimepicker = () => {
    if (showTimePicker) {
      setShowTimePicker(false);
    } else {
      setShowDatePicker(false);
      setShowTimePicker(true);
    }
  };

  const confirmIosDate = () => {
    if (tempDate) {
      setTimestamp(tempDate);
    }
    setShowDatePicker(false);
    setTempDate(null);
  };

  const confirmIosTime = () => {
    if (tempTime) {
      setTimestamp(tempTime);
    }
    setShowTimePicker(false);
    setTempTime(null);
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
        statusBarTranslucent={true}
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
                    mealValue === meal.value && styles.selectedMealContext
                  ]}
                  onPress={() => {
                    setValue('meal', meal.value as any);
                    setShowMealPicker(false);
                  }}
                >
                  <Text 
                    style={[
                      styles.mealContextText,
                      mealValue === meal.value && styles.selectedMealContextText
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

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={{ flex: 1 }}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
    >
      <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
        <ScrollView 
          style={styles.scrollView}
          contentContainerStyle={styles.scrollViewContent}
          bounces={false}
          alwaysBounceVertical={false}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <Container keyboardAvoiding={false}>
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
                      touched={value !== ''}
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
                      touched={value !== ''}
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

                {/* --- iOS Date Picker --- */}
                {Platform.OS === 'ios' && showDatePicker && (
                  <View style={styles.iosPickerContainer}>
                    <DateTimePicker
                      value={tempDate || timestamp}
                      mode="date"
                      display="spinner"
                      onChange={onDateChange}
                      style={dateTimePickerStyle}
                    />
                    <View style={styles.pickerButtonsContainer}>
                      <TouchableOpacity 
                        onPress={() => {
                          setShowDatePicker(false);
                          setTempDate(null);
                        }}
                        style={[styles.pickerButton, styles.cancelPickerButton]}
                      >
                        <Text style={styles.cancelPickerButtonText}>Cancel</Text>
                      </TouchableOpacity>
                      <TouchableOpacity 
                        onPress={confirmIosDate}
                        style={[styles.pickerButton, styles.okPickerButton]}
                      >
                        <Text style={styles.okPickerButtonText}>OK</Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                )}
                {/* --- Android Date Picker --- */}
                {Platform.OS === 'android' && showDatePicker && (
                  <DateTimePicker
                    value={timestamp}
                    mode="date"
                    display="default"
                    onChange={onDateChange}
                  />
                )}

                {/* --- iOS Time Picker --- */}
                {Platform.OS === 'ios' && showTimePicker && (
                  <View style={styles.iosPickerContainer}>
                    <DateTimePicker
                      value={tempTime || timestamp}
                      mode="time"
                      display="spinner"
                      onChange={onTimeChange}
                      style={dateTimePickerStyle}
                    />
                    <View style={styles.pickerButtonsContainer}>
                      <TouchableOpacity 
                        onPress={() => {
                          setShowTimePicker(false);
                          setTempTime(null);
                        }}
                        style={[styles.pickerButton, styles.cancelPickerButton]}
                      >
                        <Text style={styles.cancelPickerButtonText}>Cancel</Text>
                      </TouchableOpacity>
                      <TouchableOpacity 
                        onPress={confirmIosTime}
                        style={[styles.pickerButton, styles.okPickerButton]}
                      >
                        <Text style={styles.okPickerButtonText}>OK</Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                )}
                {/* --- Android Time Picker --- */}
                {Platform.OS === 'android' && showTimePicker && (
                  <DateTimePicker
                    value={timestamp}
                    mode="time"
                    display="default"
                    onChange={onTimeChange}
                  />
                )}

                <View style={styles.mealContextContainer}>
                  <Text style={styles.label}>Meal</Text>
                  <TouchableOpacity 
                    style={styles.mealContextButton}
                    onPress={() => setShowMealPicker(true)}
                  >
                    <Text style={styles.mealContextButtonText}>
                      {getMealLabel(mealValue)}
                    </Text>
                    <Ionicons name="chevron-down" size={20} color={COLORS.text} />
                  </TouchableOpacity>
                </View>

                <Controller
                  control={control}
                  render={({ field: { onChange, onBlur, value } }) => (
                    <Input
                      label="Notes (optional)"
                      placeholder="Add any additional notes"
                      multiline
                      numberOfLines={3}
                      textAlignVertical="top"
                      value={value}
                      onChangeText={onChange}
                      onBlur={onBlur}
                      style={styles.notesInput}
                    />
                  )}
                  name="notes"
                />

                <View style={styles.buttonGroup}>
                  <Button
                    title="Cancel"
                    variant="outline"
                    onPress={() => navigation.goBack()}
                    style={styles.cancelButton}
                    disabled={isLoading}
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
            {renderMealContextModal()}

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
        </ScrollView>
      </TouchableWithoutFeedback>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
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
  backButton: {
    padding: SIZES.xs,
  },
  headerTitleContainer: {},
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
  dateTimeIcon: {
    marginLeft: SIZES.xs,
  },
  dateTimeText: {
    fontSize: 16,
    color: COLORS.text,
  },
  mealContextContainer: {
    marginBottom: SIZES.md,
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
  },
  mealContextButtonText: {
    fontSize: 16,
    color: COLORS.text,
  },
  notesInput: {
    height: 80,
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
    paddingHorizontal: SIZES.md,
    borderRadius: SIZES.xs,
    marginBottom: SIZES.xs,
    backgroundColor: 'white',
  },
  selectedMealContext: {
    backgroundColor: `${COLORS.primary}20`,
  },
  mealContextText: {
    fontSize: 16,
    color: COLORS.text,
  },
  selectedMealContextText: {
    color: COLORS.primary,
    fontWeight: 'bold',
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