import React, { useState } from 'react';
import { View, Text, StyleSheet, Alert, TouchableOpacity, Platform } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { useForm, Controller } from 'react-hook-form';
import DateTimePicker from '@react-native-community/datetimepicker';
import { Picker } from '@react-native-picker/picker';
import { COLORS, SIZES, VALIDATION } from '../../constants';
import { useAuth } from '../../contexts/AuthContext';
import { addInsulinDose } from '../../services/supabase';
import Container from '../../components/Container';
import Input from '../../components/Input';
import Button from '../../components/Button';
import Card from '../../components/Card';

type FormData = {
  units: string;
  insulinType: 'rapid' | 'long' | 'mixed' | 'other';
  notes: string;
};

const AddInsulinScreen: React.FC = () => {
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
      units: '',
      insulinType: 'rapid',
      notes: '',
    },
  });

  const onSubmit = async (data: FormData) => {
    if (!authState.user) {
      Alert.alert('Error', 'You must be logged in to add insulin doses');
      return;
    }

    setIsLoading(true);
    try {
      const unitsValue = parseFloat(data.units);

      const insulinDose = {
        user_id: authState.user.id,
        units: unitsValue,
        insulin_type: data.insulinType,
        timestamp: timestamp.toISOString(),
        notes: data.notes.trim() || null,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };

      const { error } = await addInsulinDose(insulinDose);

      if (error) {
        Alert.alert('Error', error.message);
      } else {
        Alert.alert('Success', 'Insulin dose added successfully', [
          {
            text: 'OK',
            onPress: () => {
              reset();
              navigation.goBack();
            },
          },
        ]);
      }
    } catch (error: any) {
      Alert.alert('Error', error.message);
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
          <Text style={styles.title}>Add Insulin</Text>
          <View style={styles.placeholder} />
        </View>

        <Card variant="elevated" style={styles.inputCard}>
          <Controller
            control={control}
            rules={{
              required: VALIDATION.REQUIRED,
              pattern: {
                value: /^[0-9]*\.?[0-9]+$/,
                message: 'Please enter a valid number',
              },
              validate: {
                min: value => parseFloat(value) > 0 || VALIDATION.INSULIN_MIN,
                max: value => parseFloat(value) <= 100 || VALIDATION.INSULIN_MAX,
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
                touched={value !== ''}
              />
            )}
            name="units"
          />

          <Text style={styles.label}>When did you take this insulin?</Text>
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
              value={timestamp}
              mode="date"
              display="default"
              onChange={onDateChange}
              maximumDate={new Date()}
            />
          )}

          {showTimePicker && (
            <DateTimePicker
              value={timestamp}
              mode="time"
              display="default"
              onChange={onTimeChange}
            />
          )}

          <Text style={styles.label}>Insulin Type</Text>
          <Controller
            control={control}
            render={({ field: { onChange, value } }) => (
              <View style={styles.pickerContainer}>
                <Picker
                  selectedValue={value}
                  onValueChange={onChange}
                  style={styles.picker}
                >
                  <Picker.Item label="Rapid Acting" value="rapid" />
                  <Picker.Item label="Long Acting" value="long" />
                  <Picker.Item label="Mixed" value="mixed" />
                  <Picker.Item label="Other" value="other" />
                </Picker>
              </View>
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
              title="Save Dose"
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
});

export default AddInsulinScreen; 