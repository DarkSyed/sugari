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
  Modal
} from 'react-native';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { useForm, Controller } from 'react-hook-form';
import { Ionicons } from '@expo/vector-icons';
import DateTimePicker from '@react-native-community/datetimepicker';
import { Picker } from '@react-native-picker/picker';
import { COLORS, SIZES, MEAL_CONTEXTS } from '../../constants';
import { BloodSugarReading, MainStackParamList } from '../../types';
import { useApp } from '../../contexts/AppContext';
import Container from '../../components/Container';
import Card from '../../components/Card';
import Button from '../../components/Button';
import Input from '../../components/Input';
import { addBloodSugarReading, updateBloodSugarReading } from '../../services/database';
import { formatDate, formatTime } from '../../utils/dateUtils';

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
      const readingData = {
        value: parseFloat(data.value),
        type: 'sugar' as const,
        timestamp: timestamp.toISOString(),
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

  const handleCancel = () => {
    navigation.goBack();
  };

  const dateTimePickerStyle = Platform.OS === 'ios' ? {
    alignSelf: 'center',
    marginBottom: SIZES.md,
    width: '100%'
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
    // Only update date when user explicitly selects (not while scrolling)
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
  };

  const handleTimeChange = (event: any, selectedTime?: Date) => {
    // Only update time when user explicitly selects (not while scrolling)
    if (event.type === 'set' && selectedTime) {
      const newDate = new Date(timestamp);
      newDate.setHours(selectedTime.getHours());
      newDate.setMinutes(selectedTime.getMinutes());
      setTimestamp(newDate);
      setShowTimePicker(false);
    } else if (event.type === 'dismissed') {
      setShowTimePicker(false);
    }
  };

  return (
    <Container>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={{ flex: 1 }}
      >
        <ScrollView showsVerticalScrollIndicator={false}>
          <View style={styles.header}>
            <Text style={styles.screenTitle}>
              {isEditing ? 'Edit Blood Sugar' : 'Add Blood Sugar'}
            </Text>
            {loading && <ActivityIndicator size="small" color={COLORS.primary} />}
          </View>
          
          <Card variant="elevated">
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
                  />
                )}
                name="value"
                rules={{
                  required: 'Blood sugar value is required',
                  pattern: {
                    value: /^[0-9]*\.?[0-9]*$/,
                    message: 'Please enter a valid number'
                  },
                  validate: {
                    positive: (value) => parseFloat(value) > 0 || 'Value must be greater than 0',
                    reasonable: (value) => {
                      const num = parseFloat(value);
                      const isMMOL = settings?.units === 'mmol/L';
                      const max = isMMOL ? 33.3 : 600; // Max reasonable values
                      return num <= max || `Value seems too high (max: ${max})`;
                    }
                  }
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
                title="Cancel"
                onPress={handleCancel}
                variant="outline"
                style={{ flex: 1, marginRight: 8 }}
              />
              <Button
                title={isEditing ? 'Update' : 'Save'}
                onPress={handleSubmit(onSubmit)}
                loading={loading}
                disabled={loading}
                style={{ flex: 1, marginLeft: 8 }}
              />
            </View>
          </Card>
        </ScrollView>
      </KeyboardAvoidingView>
      
      {/* Date Picker Modal */}
      {showDatePicker && (
        <View style={dateTimePickerStyle}>
          <DateTimePicker
            value={timestamp}
            mode="date"
            display={Platform.OS === 'ios' ? 'spinner' : 'default'}
            onChange={handleDateChange}
            maximumDate={new Date()}
            style={{width: '100%'}}
          />
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
    justifyContent: 'space-between',
    marginTop: SIZES.sm,
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
});

export default AddSugarScreen; 