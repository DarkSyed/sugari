import React, { useState } from 'react';
import { View, Text, StyleSheet, Alert, TouchableOpacity, Platform, Modal } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { useForm, Controller } from 'react-hook-form';
import DateTimePicker from '@react-native-community/datetimepicker';
import { Picker } from '@react-native-picker/picker';
import { COLORS, SIZES, VALIDATION, NORMAL_SUGAR_MIN, NORMAL_SUGAR_MAX, MEAL_CONTEXTS } from '../../constants';
import { useAuth } from '../../contexts/AuthContext';
import { addBloodSugarReading, addInsulinDose } from '../../services/databaseFix';
import Container from '../../components/Container';
import Input from '../../components/Input';
import Button from '../../components/Button';
import Card from '../../components/Card';
import { Ionicons } from '@expo/vector-icons';

type FormData = {
  value: string;
  mealContext: 'before_meal' | 'after_meal' | 'fasting' | 'bedtime' | 'other';
  notes: string;
  insulinUnits?: string;
  insulinType?: string;
};

const AddGlucoseScreen: React.FC = () => {
  const { authState } = useAuth();
  const navigation = useNavigation<StackNavigationProp<any>>();
  const [isLoading, setIsLoading] = useState(false);
  const [timestamp, setTimestamp] = useState(new Date());
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showTimePicker, setShowTimePicker] = useState(false);
  const [showMealContextPicker, setShowMealContextPicker] = useState(false);

  const {
    control,
    handleSubmit,
    formState: { errors },
    reset,
    watch,
    setValue,
  } = useForm<FormData>({
    defaultValues: {
      value: '',
      mealContext: 'before_meal',
      notes: '',
      insulinUnits: '',
    },
  });

  const mealContext = watch('mealContext');

  const onSubmit = async (data: FormData) => {
    // Removing authentication check to allow data entry
    // if (!authState.user) {
    //   Alert.alert('Error', 'You must be logged in to add readings');
    //   return;
    // }

    setIsLoading(true);
    try {
      const glucoseValue = parseFloat(data.value);

      const reading = {
        value: glucoseValue,
        timestamp: timestamp.getTime(),
        context: data.mealContext,
        notes: data.notes.trim() || null,
      };

      const insertId = await addBloodSugarReading(reading);

      // Log insulin if units provided
      if (data.insulinUnits && parseFloat(data.insulinUnits) > 0) {
        await addInsulinDose({
          units: parseFloat(data.insulinUnits),
          type: 'rapid', // Default to rapid since we removed the type selector
          timestamp: timestamp.getTime(),
          notes: data.notes.trim() || null,
        });
      }

      if (insertId) {
        // Reset form and navigate directly to log screen
        reset();
        navigation.navigate('SugarLog'); // Navigate to the log screen to see the entry
      } else {
        Alert.alert('Error', 'Failed to add reading');
      }
    } catch (error: any) {
      Alert.alert('Error', error.message);
    } finally {
      setIsLoading(false);
    }
  };

  const dateTimePickerStyle = Platform.OS === 'ios' ? {
    alignSelf: 'center' as const,
    marginBottom: SIZES.md,
    width: '100%' as unknown as number
  } : {};

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

  const onDateChange = (event: any, selectedDate?: Date) => {
    // Only close the picker and update the date when the user explicitly selects a date
    if (event.type === 'set' && selectedDate) {
      const currentTime = new Date(timestamp);
      selectedDate.setHours(currentTime.getHours());
      selectedDate.setMinutes(currentTime.getMinutes());
      setTimestamp(selectedDate);
      setShowDatePicker(false);
    } else if (event.type === 'dismissed') {
      setShowDatePicker(false);
    }
  };

  const onTimeChange = (event: any, selectedTime?: Date) => {
    // Only close the picker and update the time when the user explicitly selects a time
    // For iOS, event.type will be 'set' when the user taps "Done" button
    // For Android, event.type will be 'set' when an option is tapped
    if (event.type === 'set' && selectedTime) {
      const newDate = new Date(timestamp);
      newDate.setHours(selectedTime.getHours());
      newDate.setMinutes(selectedTime.getMinutes());
      setTimestamp(newDate);
      setShowTimePicker(false);
    } else if (event.type === 'dismissed') {
      // Just close the picker without updating the time when dismissed
      setShowTimePicker(false);
    }
    // Important: Do nothing if the event.type is undefined,
    // which happens during scrolling on iOS pickers
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

  const getStatusColor = (value: string) => {
    const numValue = parseFloat(value);
    if (isNaN(numValue)) {
      return COLORS.text;
    }

    if (numValue < NORMAL_SUGAR_MIN) {
      return COLORS.warning;
    } else if (numValue > NORMAL_SUGAR_MAX) {
      return COLORS.warning;
    }
    return COLORS.success;
  };

  const getMealContextLabel = (value: string) => {
    const context = MEAL_CONTEXTS.find(ctx => ctx.value === value);
    return context ? context.label : 'Before Meal';
  };

  const renderMealContextModal = () => {
    return (
      <Modal
        visible={showMealContextPicker}
        transparent
        animationType="slide"
        onRequestClose={() => setShowMealContextPicker(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Select Meal Context</Text>
              <TouchableOpacity onPress={() => setShowMealContextPicker(false)}>
                <Ionicons name="close" size={24} color={COLORS.text} />
              </TouchableOpacity>
            </View>
            
            <View style={styles.mealContextList}>
              {MEAL_CONTEXTS.map((context) => (
                <TouchableOpacity
                  key={context.value}
                  style={[
                    styles.mealContextItem,
                    mealContext === context.value && styles.selectedMealContext
                  ]}
                  onPress={() => {
                    setValue('mealContext', context.value as any);
                    setShowMealContextPicker(false);
                  }}
                >
                  <Text 
                    style={[
                      styles.mealContextText,
                      mealContext === context.value && styles.selectedMealContextText
                    ]}
                  >
                    {context.label}
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
    <Container keyboardAvoiding={true}>
      <View style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity 
            style={styles.backButton} 
            onPress={() => navigation.goBack()}
          >
            <Text style={styles.backButtonText}>← Back</Text>
          </TouchableOpacity>
          <View style={styles.headerTitleContainer}>
            <Text style={styles.title}>Log Blood Glucose</Text>
          </View>
          <View style={styles.backButton} />
        </View>

        <Card variant="elevated" style={styles.inputCard}>
          <Controller
            control={control}
            rules={{
              required: VALIDATION.REQUIRED,
              pattern: {
                value: /^[0-9]+$/,
                message: 'Please enter a valid number',
              },
              validate: {
                min: value => parseFloat(value) >= 40 || VALIDATION.SUGAR_MIN,
                max: value => parseFloat(value) <= 400 || VALIDATION.SUGAR_MAX,
              },
            }}
            render={({ field: { onChange, onBlur, value } }) => (
              <View style={styles.glucoseInputContainer}>
                <Input
                  label="Blood Glucose"
                  placeholder="Enter value"
                  keyboardType="numeric"
                  value={value}
                  onChangeText={onChange}
                  onBlur={onBlur}
                  error={errors.value?.message}
                  touched={value !== ''}
                  containerStyle={styles.glucoseInput}
                />
                <View style={styles.unitContainer}>
                  <Text
                    style={[
                      styles.valuePreview,
                      { color: getStatusColor(value) },
                    ]}
                  >
                    {value ? value : '---'}
                  </Text>
                  <Text style={styles.unitText}>mg/dL</Text>
                </View>
              </View>
            )}
            name="value"
          />

          <Controller
            control={control}
            rules={{
              pattern: {
                value: /^\d*\.?\d*$/,
                message: 'Please enter a valid number',
              },
              validate: {
                min: value => !value || parseFloat(value) > 0 || 'Insulin must be greater than 0 units',
                max: value => !value || parseFloat(value) <= 100 || 'Insulin must be less than 100 units',
              },
            }}
            render={({ field: { onChange, onBlur, value } }) => (
              <View style={styles.insulinInputContainer}>
                <Input
                  label="Insulin Units (optional)"
                  placeholder="Enter units"
                  keyboardType="numeric"
                  value={value}
                  onChangeText={onChange}
                  onBlur={onBlur}
                  error={errors.insulinUnits?.message}
                  touched={value !== ''}
                  containerStyle={styles.insulinInput}
                />
                <Text style={styles.insulinUnitText}>units</Text>
              </View>
            )}
            name="insulinUnits"
          />

          <Text style={styles.label}>When was this reading taken?</Text>
          <View style={styles.dateTimeContainer}>
            <TouchableOpacity
              style={styles.dateTimeButton}
              onPress={showDatepicker}
            >
              <Text style={styles.dateTimeText}>
                {formatDate(timestamp)}
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.dateTimeButton}
              onPress={showTimepicker}
            >
              <Text style={styles.dateTimeText}>
                {formatTime(timestamp)}
              </Text>
            </TouchableOpacity>
          </View>

          {showDatePicker && (
            <View style={dateTimePickerStyle}>
              <DateTimePicker
                testID="dateTimePicker"
                value={timestamp}
                mode="date"
                display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                onChange={onDateChange}
                maximumDate={new Date()}
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
                testID="timeTimePicker"
                value={timestamp}
                mode="time"
                display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                onChange={onTimeChange}
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

          <Text style={styles.label}>Meal Context</Text>
          <Controller
            control={control}
            render={({ field: { value } }) => (
              <TouchableOpacity 
                style={styles.mealContextButton}
                onPress={() => setShowMealContextPicker(true)}
              >
                <Text style={styles.mealContextButtonText}>
                  {getMealContextLabel(value)}
                </Text>
                <Ionicons name="chevron-down" size={16} color={COLORS.text} />
              </TouchableOpacity>
            )}
            name="mealContext"
          />

          <Controller
            control={control}
            render={({ field: { onChange, onBlur, value } }) => (
              <Input
                label="Notes (optional)"
                placeholder="Add any additional information"
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
        </Card>

        <View style={styles.buttonContainer}>
          <Button
            title="Cancel"
            onPress={() => navigation.goBack()}
            variant="outline"
            style={styles.cancelButton}
          />
          <Button
            title="Save"
            onPress={handleSubmit(onSubmit)}
            loading={isLoading}
            disabled={isLoading}
            style={styles.saveButton}
          />
        </View>
      </View>
      
      {renderMealContextModal()}
    </Container>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: SIZES.md,
    justifyContent: 'space-between',
  },
  backButton: {
    padding: SIZES.xs,
    width: 80,
  },
  backButtonText: {
    fontSize: 16,
    color: COLORS.primary,
  },
  headerTitleContainer: {
    alignItems: 'center',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: SIZES.xs,
    color: COLORS.text,
    textAlign: 'center',
  },
  inputCard: {
    marginBottom: SIZES.lg,
  },
  glucoseInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: SIZES.md,
  },
  glucoseInput: {
    flex: 2,
    marginRight: SIZES.md,
  },
  unitContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  valuePreview: {
    fontSize: 24,
    fontWeight: 'bold',
  },
  unitText: {
    fontSize: 14,
    color: COLORS.lightText,
    marginTop: 4,
  },
  label: {
    fontSize: 16,
    marginBottom: SIZES.xs,
    color: COLORS.text,
    fontWeight: '500',
  },
  dateTimeContainer: {
    flexDirection: 'row',
    marginBottom: SIZES.md,
  },
  dateTimeButton: {
    backgroundColor: COLORS.inputBackground,
    borderRadius: SIZES.xs,
    padding: SIZES.sm,
    marginRight: SIZES.sm,
    borderWidth: 1,
    borderColor: COLORS.border,
    flex: 1,
  },
  dateTimeText: {
    fontSize: 16,
    color: COLORS.text,
    textAlign: 'center',
  },
  mealContextButton: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: COLORS.inputBackground,
    borderRadius: SIZES.xs,
    padding: SIZES.sm,
    marginBottom: SIZES.md,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  mealContextButtonText: {
    fontSize: 16,
    color: COLORS.text,
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
  insulinInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: SIZES.md,
  },
  insulinInput: {
    flex: 1,
    marginRight: SIZES.sm,
  },
  insulinUnitText: {
    fontSize: 16,
    color: COLORS.text,
    marginBottom: 15,
  },
});

export default AddGlucoseScreen; 