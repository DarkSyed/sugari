import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  ScrollView,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Modal,
  Keyboard,
  InputAccessoryView,
  TouchableWithoutFeedback
} from 'react-native';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { useForm, Controller } from 'react-hook-form';
import { Ionicons } from '@expo/vector-icons';
import DateTimePicker from '@react-native-community/datetimepicker';
import { COLORS, SIZES, MEAL_CONTEXTS, VALIDATION } from '../../constants';
import { BloodSugarReading, MainStackParamList } from '../../types';
import { useApp } from '../../contexts/AppContext';
import Container from '../../components/Container';
import Card from '../../components/Card';
import Button from '../../components/Button';
import Input from '../../components/Input';
import { addBloodSugarReading, updateBloodSugarReading } from '../../services/databaseFix';
import { formatDate, formatTime, dateToTimestamp } from '../../utils/dateUtils';

type FormData = {
  value: string;
  context: string;
  notes: string;
};

type RouteParams = RouteProp<MainStackParamList, 'AddSugar'>;

const AddSugarScreen: React.FC = () => {
  const navigation = useNavigation<StackNavigationProp<any>>();
  const route = useRoute<RouteParams>();
  const { settings } = useApp();
  
  const isEditing = !!route.params?.readingId;
  const initialData = route.params?.initialData;
  
  const [loading, setLoading] = useState(false);
  const [timestamp, setTimestamp] = useState(
    initialData ? new Date(initialData.timestamp) : new Date()
  );
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showTimePicker, setShowTimePicker] = useState(false);
  const [showContextPicker, setShowContextPicker] = useState(false);
  const [tempDate, setTempDate] = useState<Date | null>(null);
  const [tempTime, setTempTime] = useState<Date | null>(null);
  const inputAccessoryViewID = 'inputAccessoryViewSugarScreen';

  const { control, handleSubmit, setValue, watch, formState: { errors } } = useForm<FormData>({
    defaultValues: {
      value: initialData ? initialData.value.toString() : '',
      context: initialData?.context || '',
      notes: initialData?.notes || '',
    }
  });

  // Watch context for display
  const selectedContext = watch('context');

  // Format date and time for display
  const formattedDate = formatDate(timestamp);
  const formattedTime = formatTime(timestamp);

  // Get the appropriate context label for display
  const getContextLabel = (value: string) => {
    const context = MEAL_CONTEXTS.find(ctx => ctx.value === value);
    return context ? context.label : 'Select Context';
  };

  const onSubmit = async (data: FormData) => {
    setLoading(true);
    
    try {
      // Convert timestamp string back to number for database operations
      const timestampInMs = timestamp.getTime();

      const readingData = {
        value: parseFloat(data.value),
        type: 'sugar' as const,
        // Use timestampInMs (number) for database operations
        timestamp: timestampInMs,
        context: data.context || null,
        notes: data.notes || null
      };
      
      if (isEditing && route.params?.readingId) {
        await updateBloodSugarReading(route.params.readingId, readingData);
        Alert.alert('Success', 'Blood sugar reading updated successfully');
      } else {
        await addBloodSugarReading(readingData);
        Alert.alert('Success', 'Blood sugar reading added successfully');
      }
      
      navigation.goBack();
    } catch (error) {
      console.error('Error saving blood sugar reading:', error);
      Alert.alert('Error', 'Failed to save blood sugar reading');
    } finally {
      setLoading(false);
    }
  };

  const dateTimePickerStyle = Platform.OS === 'ios' ? {
    alignSelf: 'center' as const,
    marginBottom: SIZES.md,
    width: '100%' as unknown as number
  } : {};

  // Modified to toggle the date picker on/off
  const toggleDatePicker = () => {
    if (showDatePicker) {
      setShowDatePicker(false);
    } else {
      setShowTimePicker(false);
      setShowContextPicker(false);
      setShowDatePicker(true);
    }
  };

  // Modified to toggle the time picker on/off
  const toggleTimePicker = () => {
    if (showTimePicker) {
      setShowTimePicker(false);
    } else {
      setShowDatePicker(false);
      setShowContextPicker(false);
      setShowTimePicker(true);
    }
  };

  // Modified to toggle the context picker on/off
  const toggleContextPicker = () => {
    if (showContextPicker) {
      setShowContextPicker(false);
    } else {
      setShowDatePicker(false);
      setShowTimePicker(false);
      setShowContextPicker(true);
    }
  };

  const handleDateChange = (event: any, selectedDate?: Date) => {
    if (Platform.OS === 'android') {
      // On Android, update only when "set" is triggered (user taps OK)
      if (event.type === 'set' && selectedDate) {
        const newDate = new Date(timestamp);
        newDate.setFullYear(selectedDate.getFullYear());
        newDate.setMonth(selectedDate.getMonth());
        newDate.setDate(selectedDate.getDate());
        setTimestamp(newDate);
        setShowDatePicker(false);
      } else if (event.type === 'dismissed') {
        setShowDatePicker(false);
      }
    } else {
      // On iOS, don't update right away, just store the temporary value
      if (selectedDate) {
        const newDate = new Date(timestamp);
        newDate.setFullYear(selectedDate.getFullYear());
        newDate.setMonth(selectedDate.getMonth());
        newDate.setDate(selectedDate.getDate());
        setTempDate(newDate);
      }
    }
  };

  const handleTimeChange = (event: any, selectedTime?: Date) => {
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

  return (
    <Container>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={{ flex: 1 }}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 20}
      >
        <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
          <ScrollView
            showsVerticalScrollIndicator={false}
            bounces={false}
            alwaysBounceVertical={false}
            keyboardShouldPersistTaps="handled"
            contentContainerStyle={styles.scrollViewContent}
          >
            <View style={styles.header}>
              <Text style={styles.screenTitle}>
                {isEditing ? 'Edit Blood Sugar' : 'Add Blood Sugar'}
              </Text>
              {loading && <ActivityIndicator size="small" color={COLORS.primary} />}
            </View>
            
            <Card variant="elevated" style={styles.inputCard}>
              <View style={styles.formGroup}>
                <Text style={styles.label}>Blood Sugar Value ({settings?.units || 'mg/dL'})</Text>
                <Controller
                  control={control}
                  render={({ field: { onChange, onBlur, value } }) => (
                    <Input
                      value={value}
                      onChangeText={onChange}
                      onBlur={onBlur}
                      placeholder={`Enter blood sugar value in ${settings?.units || 'mg/dL'}`}
                      keyboardType="numeric"
                      error={errors.value?.message}
                      inputAccessoryViewID={Platform.OS === 'ios' ? inputAccessoryViewID : undefined}
                    />
                  )}
                  name="value"
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
                />
              </View>
              
              <View style={styles.dateTimeContainer}>
                <View style={styles.dateTimeField}>
                  <Text style={styles.label}>Date</Text>
                  <TouchableOpacity
                    style={styles.dateTimePicker}
                    onPress={toggleDatePicker}
                  >
                    <Text style={styles.dateTimeText}>{formattedDate}</Text>
                    <Ionicons name="calendar-outline" size={20} color={COLORS.primary} />
                  </TouchableOpacity>
                </View>
                
                <View style={styles.dateTimeField}>
                  <Text style={styles.label}>Time</Text>
                  <TouchableOpacity
                    style={styles.dateTimePicker}
                    onPress={toggleTimePicker}
                  >
                    <Text style={styles.dateTimeText}>{formattedTime}</Text>
                    <Ionicons name="time-outline" size={20} color={COLORS.primary} />
                  </TouchableOpacity>
                </View>
              </View>
              
              <View style={styles.formGroup}>
                <Text style={styles.label}>Context</Text>
                <TouchableOpacity
                  style={styles.contextPicker}
                  onPress={toggleContextPicker}
                >
                  <Text style={styles.contextText}>
                    {selectedContext ? getContextLabel(selectedContext) : 'Select Context'}
                  </Text>
                  <Ionicons name="chevron-down" size={20} color={COLORS.primary} />
                </TouchableOpacity>
              </View>
              
              <View style={styles.formGroup}>
                <Text style={styles.label}>Notes (Optional)</Text>
                <Controller
                  control={control}
                  render={({ field: { onChange, onBlur, value } }) => (
                    <Input
                      value={value}
                      onChangeText={onChange}
                      onBlur={onBlur}
                      placeholder="Add any additional notes"
                      multiline
                      numberOfLines={3}
                      textAlignVertical="top"
                      style={styles.notesInput}
                    />
                  )}
                  name="notes"
                />
              </View>
              
              <View style={styles.buttonGroup}>
                <Button
                  title={isEditing ? 'Update Reading' : 'Save Reading'}
                  onPress={handleSubmit(onSubmit)}
                  loading={loading}
                  disabled={loading}
                  style={styles.saveButton}
                />
              </View>
            </Card>
          </ScrollView>
        </TouchableWithoutFeedback>
      </KeyboardAvoidingView>
      
      {/* Date Picker Modal */}
      {showDatePicker && (
        <View style={dateTimePickerStyle}>
          <DateTimePicker
            value={timestamp}
            mode="date"
            display={Platform.OS === 'ios' ? 'spinner' : 'default'}
            onChange={handleDateChange}
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
      
      {/* Time Picker Modal */}
      {showTimePicker && (
        <View style={dateTimePickerStyle}>
          <DateTimePicker
            value={timestamp}
            mode="time"
            display={Platform.OS === 'ios' ? 'spinner' : 'default'}
            onChange={handleTimeChange}
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
      
      {/* Context Picker Modal */}
      <Modal
        visible={showContextPicker}
        transparent
        animationType="slide"
        onRequestClose={() => setShowContextPicker(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Select Context</Text>
              <TouchableOpacity onPress={() => setShowContextPicker(false)}>
                <Ionicons name="close" size={24} color={COLORS.text} />
              </TouchableOpacity>
            </View>
            
            <ScrollView>
              {MEAL_CONTEXTS.map((context) => (
                <TouchableOpacity
                  key={context.value}
                  style={[
                    styles.contextOption,
                    selectedContext === context.value && styles.contextOptionSelected
                  ]}
                  onPress={() => {
                    setValue('context', context.value);
                    setShowContextPicker(false);
                  }}
                >
                  <Text style={[
                    styles.contextOptionText,
                    selectedContext === context.value && styles.contextOptionTextSelected
                  ]}>
                    {context.label}
                  </Text>
                  {selectedContext === context.value && (
                    <Ionicons name="checkmark" size={20} color={COLORS.primary} />
                  )}
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        </View>
      </Modal>
      
      {/* Input Accessory View for iOS */}
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
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SIZES.md,
  },
  screenTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: COLORS.text,
  },
  formGroup: {
    marginBottom: SIZES.md,
  },
  label: {
    fontSize: 16,
    fontWeight: '500',
    color: COLORS.text,
    marginBottom: SIZES.xs,
  },
  dateTimeContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: SIZES.md,
  },
  dateTimeField: {
    width: '48%',
  },
  dateTimePicker: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: COLORS.inputBackground,
    borderRadius: SIZES.xs,
    borderWidth: 1,
    borderColor: COLORS.border,
    padding: SIZES.sm,
  },
  dateTimeText: {
    fontSize: 16,
    color: COLORS.text,
  },
  contextPicker: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: COLORS.inputBackground,
    borderRadius: SIZES.xs,
    borderWidth: 1,
    borderColor: COLORS.border,
    padding: SIZES.sm,
  },
  contextText: {
    fontSize: 16,
    color: COLORS.text,
  },
  notesInput: {
    height: 100,
    paddingTop: SIZES.sm,
  },
  buttonGroup: {
    flexDirection: 'row',
    marginTop: SIZES.lg,
  },
  saveButton: {
    flex: 1,
    marginLeft: SIZES.sm,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
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
  contextOption: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: SIZES.md,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  contextOptionSelected: {
    backgroundColor: `${COLORS.primary}10`,
  },
  contextOptionText: {
    fontSize: 16,
    color: COLORS.text,
  },
  contextOptionTextSelected: {
    color: COLORS.primary,
    fontWeight: '500',
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
  scrollViewContent: {
    flexGrow: 1,
    paddingBottom: 20,
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
  inputCard: {
    padding: SIZES.md,
    marginBottom: SIZES.lg,
  },
  notesInput: {
    height: 100,
    paddingTop: SIZES.sm,
    textAlignVertical: 'top',
  },
});

export default AddSugarScreen; 