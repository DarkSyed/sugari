import React, { useState } from 'react';
import { View, Text, StyleSheet, Alert, TouchableOpacity, Platform } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import DateTimePicker from '@react-native-community/datetimepicker';
import { COLORS, SIZES } from '../../constants';
import { addA1CReading } from '../../services/databaseFix';
import Container from '../../components/Container';
import Input from '../../components/Input';
import Button from '../../components/Button';
import { Ionicons } from '@expo/vector-icons';

const AddA1CScreen: React.FC = () => {
  const navigation = useNavigation<StackNavigationProp<any>>();
  const [a1cValue, setA1CValue] = useState('');
  const [notes, setNotes] = useState('');
  const [timestamp, setTimestamp] = useState(new Date());
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showTimePicker, setShowTimePicker] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async () => {
    if (!a1cValue) {
      Alert.alert('Error', 'Please enter an A1C value');
      return;
    }

    const numericValue = parseFloat(a1cValue);
    if (isNaN(numericValue) || numericValue <= 0 || numericValue > 20) {
      Alert.alert('Error', 'Please enter a valid A1C value (between 0 and 20%)');
      return;
    }

    setIsSubmitting(true);

    try {
      await addA1CReading({
        value: numericValue,
        timestamp: timestamp.getTime(),
        notes: notes.trim() || null
      });

      Alert.alert(
        'Success',
        'A1C reading saved successfully',
        [
          {
            text: 'OK',
            onPress: () => {
              setA1CValue('');
              setNotes('');
              setTimestamp(new Date());
              navigation.goBack();
            }
          }
        ]
      );
    } catch (error) {
      console.error('Error saving A1C reading:', error);
      Alert.alert('Error', 'Failed to save A1C reading. Please try again.');
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
        <Text style={styles.headerTitle}>Log A1C</Text>
        <View style={styles.placeholder} />
      </View>

      <View style={styles.inputContainer}>
        <Text style={styles.label}>A1C Value (%)</Text>
        <Input
          value={a1cValue}
          onChangeText={setA1CValue}
          placeholder="e.g., 7.2"
          keyboardType="decimal-pad"
          inputStyle={styles.input}
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
          title="Save A1C Reading"
          onPress={handleSubmit}
          disabled={!a1cValue || isSubmitting}
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
  input: {
    fontSize: 18,
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

export default AddA1CScreen;
