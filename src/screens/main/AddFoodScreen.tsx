import React, { useState } from 'react';
import { View, Text, StyleSheet, Alert, TouchableOpacity, Platform } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { useForm, Controller } from 'react-hook-form';
import DateTimePicker from '@react-native-community/datetimepicker';
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

const AddFoodScreen: React.FC = () => {
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
    setShowDatePicker(false);
    setShowTimePicker(Platform.OS === 'ios');

    if (selectedDate) {
      const currentTime = new Date(timestamp);
      selectedDate.setHours(currentTime.getHours());
      selectedDate.setMinutes(currentTime.getMinutes());
      setTimestamp(selectedDate);
    }
  };

  const onTimeChange = (event: any, selectedTime?: Date) => {
    setShowTimePicker(false);

    if (selectedTime) {
      const newDate = new Date(timestamp);
      newDate.setHours(selectedTime.getHours());
      newDate.setMinutes(selectedTime.getMinutes());
      setTimestamp(newDate);
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

  const dateTimePickerStyle = Platform.OS === 'ios' ? {
    alignSelf: 'center' as const,
    marginBottom: SIZES.md,
    width: '100%' as unknown as number
  } : {};

  return (
    <Container>
      <View style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => navigation.goBack()}
          >
            <Text style={styles.backButtonText}>← Back</Text>
          </TouchableOpacity>
          <Text style={styles.title}>Add Food</Text>
          <View style={styles.placeholder} />
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
                value={timestamp}
                mode="date"
                display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                onChange={onDateChange}
                maximumDate={new Date()}
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
                value={timestamp}
                mode="time"
                display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                onChange={onTimeChange}
                is24Hour={false}
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

          <Text style={styles.label}>Meal</Text>
          <Controller
            control={control}
            render={({ field: { onChange, value } }) => (
              <View style={styles.pickerContainer}>
                <Picker
                  selectedValue={value}
                  onValueChange={onChange}
                  style={styles.picker}
                >
                  <Picker.Item label="Breakfast" value="breakfast" />
                  <Picker.Item label="Lunch" value="lunch" />
                  <Picker.Item label="Dinner" value="dinner" />
                  <Picker.Item label="Snack" value="snack" />
                </Picker>
              </View>
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
    justifyContent: 'space-between',
    marginBottom: SIZES.lg,
  },
  backButton: {
    padding: SIZES.xs,
  },
  backButtonText: {
    fontSize: 16,
    color: COLORS.primary,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: COLORS.text,
  },
  placeholder: {
    width: 50,
  },
  inputCard: {
    marginBottom: SIZES.lg,
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
});

export default AddFoodScreen; 