import React, { useState } from 'react';
import { View, Text, StyleSheet, Alert, TouchableOpacity, Platform } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import DateTimePicker from '@react-native-community/datetimepicker';
import { COLORS, SIZES } from '../../constants';
import { addWeightMeasurement } from '../../services/databaseFix';
import Container from '../../components/Container';
import Input from '../../components/Input';
import Button from '../../components/Button';
import { Ionicons } from '@expo/vector-icons';

const AddWeightScreen: React.FC = () => {
  const navigation = useNavigation<StackNavigationProp<any>>();
  const [weightValue, setWeightValue] = useState('');
  const [notes, setNotes] = useState('');
  const [timestamp, setTimestamp] = useState(new Date());
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showTimePicker, setShowTimePicker] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async () => {
    if (!weightValue) {
      Alert.alert('Error', 'Please enter a weight value');
      return;
    }

    const numericValue = parseFloat(weightValue);
    if (isNaN(numericValue) || numericValue <= 0 || numericValue > 1000) {
      Alert.alert('Error', 'Please enter a valid weight value');
      return;
    }

    setIsSubmitting(true);

    try {
      await addWeightMeasurement({
        value: numericValue,
        timestamp: timestamp.getTime(),
        notes: notes.trim() || null
      });

      Alert.alert(
        'Success',
        'Weight measurement saved successfully',
        [
          {
            text: 'OK',
            onPress: () => {
              setWeightValue('');
              setNotes('');
              setTimestamp(new Date());
              navigation.goBack();
            }
          }
        ]
      );
    } catch (error) {
      console.error('Error saving weight measurement:', error);
      Alert.alert('Error', 'Failed to save weight measurement. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const onDateChange = (event: any, selectedDate?: Date) => {
    const currentDate = selectedDate || timestamp;
    
    if (Platform.OS === 'android') {
      setShowDatePicker(false);
    }
    
    // Preserve the time from the existing timestamp
    const newDate = new Date(currentDate);
    newDate.setHours(timestamp.getHours(), timestamp.getMinutes());
    
    setTimestamp(newDate);
  };

  const onTimeChange = (event: any, selectedTime?: Date) => {
    const currentTime = selectedTime || timestamp;
    
    if (Platform.OS === 'android') {
      setShowTimePicker(false);
    }
    
    // Preserve the date but update the time
    const newDate = new Date(timestamp);
    newDate.setHours(currentTime.getHours(), currentTime.getMinutes());
    
    setTimestamp(newDate);
  };

  const showDatepicker = () => {
    setShowDatePicker(true);
  };

  const showTimepicker = () => {
    setShowTimePicker(true);
  };

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    });
  };

  return (
    <Container>
      <View style={styles.header}>
        <TouchableOpacity 
          onPress={() => navigation.goBack()} 
          style={styles.backButton}
        >
          <Text style={styles.backButtonText}>← Back</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Log Weight</Text>
        <View style={styles.placeholder} />
      </View>

      <View style={styles.inputContainer}>
        <Text style={styles.label}>Weight (lbs)</Text>
        <Input
          value={weightValue}
          onChangeText={setWeightValue}
          placeholder="e.g., 160"
          keyboardType="decimal-pad"
        />
      </View>

      <View style={styles.dateTimeContainer}>
        <Text style={styles.label}>Date & Time</Text>
        <View style={styles.dateTimeButtonsContainer}>
          <TouchableOpacity onPress={showDatepicker} style={styles.dateTimeButton}>
            <Ionicons name="calendar-outline" size={20} color={COLORS.primary} />
            <Text style={styles.dateTimeText}>{formatDate(timestamp)}</Text>
          </TouchableOpacity>

          <TouchableOpacity onPress={showTimepicker} style={styles.dateTimeButton}>
            <Ionicons name="time-outline" size={20} color={COLORS.primary} />
            <Text style={styles.dateTimeText}>{formatTime(timestamp)}</Text>
          </TouchableOpacity>
        </View>

        {showDatePicker && (
          <DateTimePicker
            value={timestamp}
            mode="date"
            display={Platform.OS === 'ios' ? 'spinner' : 'default'}
            onChange={onDateChange}
            maximumDate={new Date()}
            textColor={COLORS.text}
          />
        )}

        {showTimePicker && (
          <DateTimePicker
            value={timestamp}
            mode="time"
            display={Platform.OS === 'ios' ? 'spinner' : 'default'}
            onChange={onTimeChange}
            textColor={COLORS.text}
          />
        )}
      </View>

      <View style={styles.inputContainer}>
        <Text style={styles.label}>Notes (Optional)</Text>
        <Input
          value={notes}
          onChangeText={setNotes}
          placeholder="Add any additional notes here"
          multiline
          numberOfLines={4}
          inputStyle={styles.notesInput}
        />
      </View>

      <View style={styles.footer}>
        <Button
          title="Save Weight Measurement"
          onPress={handleSubmit}
          disabled={!weightValue || isSubmitting}
          loading={isSubmitting}
          style={styles.saveButton}
        />
      </View>
    </Container>
  );
};

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: SIZES.lg,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: COLORS.text,
    textAlign: 'center',
  },
  backButton: {
    paddingVertical: SIZES.xs,
    paddingRight: SIZES.sm,
  },
  backButtonText: {
    color: COLORS.primary,
    fontSize: 16,
    fontWeight: '500',
  },
  placeholder: {
    width: 50,
  },
  inputContainer: {
    marginBottom: SIZES.md,
  },
  label: {
    fontSize: 16,
    fontWeight: '500',
    color: COLORS.text,
    marginBottom: SIZES.xs,
  },
  notesInput: {
    height: 100,
    textAlignVertical: 'top',
  },
  dateTimeContainer: {
    marginBottom: SIZES.md,
  },
  dateTimeButtonsContainer: {
    flexDirection: 'row',
    marginTop: SIZES.xs,
  },
  dateTimeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.inputBackground,
    paddingHorizontal: SIZES.sm,
    paddingVertical: SIZES.sm,
    borderRadius: SIZES.xs,
    marginRight: SIZES.sm,
  },
  dateTimeText: {
    fontSize: 14,
    color: COLORS.text,
    marginLeft: SIZES.xs,
  },
  footer: {
    marginTop: 'auto',
    marginBottom: SIZES.lg,
  },
  saveButton: {
    backgroundColor: COLORS.primary,
  },
});

export default AddWeightScreen;
