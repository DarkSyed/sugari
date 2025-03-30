import React, { useState } from 'react';
import { View, Text, StyleSheet, Alert, TouchableOpacity, Platform } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { useForm, Controller } from 'react-hook-form';
import DateTimePicker from '@react-native-community/datetimepicker';
import { Picker } from '@react-native-picker/picker';
import { COLORS, SIZES, VALIDATION, NORMAL_SUGAR_MIN, NORMAL_SUGAR_MAX } from '../../constants';
import { useAuth } from '../../contexts/AuthContext';
import { addBloodSugarReading, addInsulinDose } from '../../services/database';
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

  const {
    control,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm<FormData>({
    defaultValues: {
      value: '',
      mealContext: 'before_meal',
      notes: '',
      insulinUnits: '',
    },
  });

  const onSubmit = async (data: FormData) => {
    if (!authState.user) {
      Alert.alert('Error', 'You must be logged in to add readings');
      return;
    }

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
        const hasInsulin = data.insulinUnits && parseFloat(data.insulinUnits) > 0;
        Alert.alert('Success', hasInsulin ? 'Blood glucose and insulin logged successfully' : 'Blood glucose reading added successfully', [
          {
            text: 'OK',
            onPress: () => {
              reset();
              navigation.goBack();
            },
          },
        ]);
      } else {
        Alert.alert('Error', 'Failed to add reading');
      }
    } catch (error: any) {
      Alert.alert('Error', error.message);
    } finally {
      setIsLoading(false);
    }
  };

  const onDateChange = (event: any, selectedDate?: Date) => {
    // Only close the picker when a date is selected
    if (event.type === 'set' && selectedDate) {
      setShowDatePicker(false);
      
      const currentTime = new Date(timestamp);
      selectedDate.setHours(currentTime.getHours());
      selectedDate.setMinutes(currentTime.getMinutes());
      setTimestamp(selectedDate);
    } else if (event.type === 'dismissed') {
      setShowDatePicker(false);
    }
  };

  const onTimeChange = (event: any, selectedTime?: Date) => {
    // Only close the picker when a time is selected
    if (event.type === 'set' && selectedTime) {
      setShowTimePicker(false);
      
      const newDate = new Date(timestamp);
      newDate.setHours(selectedTime.getHours());
      newDate.setMinutes(selectedTime.getMinutes());
      setTimestamp(newDate);
    } else if (event.type === 'dismissed') {
      setShowTimePicker(false);
    }
  };

  const showDatepicker = () => {
    setShowDatePicker(true);
  };

  const showTimepicker = () => {
    setShowTimePicker(true);
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

  return (
    <Container>
      <View style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity 
            style={styles.backButton} 
            onPress={() => navigation.goBack()}
          >
            <Ionicons name="arrow-back" size={24} color={COLORS.text} />
          </TouchableOpacity>
          <View style={styles.headerTitleContainer}>
            <Text style={styles.title}>Log Blood Glucose</Text>
            <Text style={styles.subtitle}>Record your blood glucose reading</Text>
          </View>
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
            <DateTimePicker
              testID="dateTimePicker"
              value={timestamp}
              mode="date"
              display={Platform.OS === 'ios' ? 'spinner' : 'default'}
              onChange={onDateChange}
              maximumDate={new Date()}
            />
          )}

          {showTimePicker && (
            <DateTimePicker
              testID="timeTimePicker"
              value={timestamp}
              mode="time"
              display={Platform.OS === 'ios' ? 'spinner' : 'default'}
              onChange={onTimeChange}
              is24Hour={false}
            />
          )}

          <Text style={styles.label}>Meal Context</Text>
          <Controller
            control={control}
            render={({ field: { onChange, value } }) => (
              <View style={styles.pickerContainer}>
                <Picker
                  selectedValue={value}
                  onValueChange={onChange}
                  style={styles.picker}
                >
                  <Picker.Item label="Before Meal" value="before_meal" />
                  <Picker.Item label="After Meal" value="after_meal" />
                  <Picker.Item label="Fasting" value="fasting" />
                  <Picker.Item label="Bedtime" value="bedtime" />
                  <Picker.Item label="Other" value="other" />
                </Picker>
              </View>
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

          {/* Simplified Insulin input */}
          <View style={styles.insulinInputRow}>
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
          </View>
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
  },
  backButton: {
    padding: SIZES.xs,
    marginRight: SIZES.sm,
  },
  headerTitleContainer: {
    flex: 1,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: SIZES.xs,
    color: COLORS.text,
  },
  subtitle: {
    fontSize: 16,
    color: COLORS.lightText,
    marginBottom: SIZES.lg,
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
  insulinSection: {
    marginBottom: SIZES.md,
    paddingTop: SIZES.xs,
  },
  insulinInputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: SIZES.md,
    marginBottom: SIZES.xs,
  },
  insulinInputContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
  },
  insulinInput: {
    flex: 1,
  },
  insulinUnitText: {
    fontSize: 14,
    color: COLORS.text,
    marginLeft: SIZES.xs,
    marginBottom: SIZES.lg,
  },
});

export default AddGlucoseScreen; 