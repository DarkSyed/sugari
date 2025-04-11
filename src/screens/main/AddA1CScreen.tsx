import React, { useState } from 'react';
import { View, Text, StyleSheet, Alert, TouchableOpacity, Platform, KeyboardAvoidingView, TouchableWithoutFeedback, ScrollView } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import DateTimePicker from '@react-native-community/datetimepicker';
import { COLORS, SIZES } from '../../constants';
import { addA1CReading } from '../../services/databaseFix';
import Container from '../../components/Container';
import Input from '../../components/Input';
import Button from '../../components/Button';
import { Ionicons } from '@expo/vector-icons';
import { Keyboard } from 'react-native';
import Card from '../../components/Card';

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
    if (isNaN(numericValue) || numericValue < 3 || numericValue > 20) {
      Alert.alert('Error', 'Please enter a valid A1C value between 3% and 20%');
      return;
    }

    setIsSubmitting(true);

    try {
      await addA1CReading({
        value: numericValue,
        timestamp: timestamp.getTime(),
        notes: notes.trim() || null
      });

      // Reset form and navigate directly to log screen
      setA1CValue('');
      setNotes('');
      setTimestamp(new Date());
      navigation.navigate('SugarLog'); // Navigate to the log screen to see the entry
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

  const dateTimePickerStyle = Platform.OS === 'ios' ? {
    alignSelf: 'center' as const,
    marginBottom: SIZES.md,
    width: '100%' as unknown as number
  } : {};

  return (
    <Container keyboardAvoiding={false}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
          <ScrollView>
            <View style={styles.container}>
              {/* --- Header --- */}
              <View style={styles.header}>
                {/* Back Button with Icon */}
                <TouchableOpacity
                  style={styles.backButton}
                  onPress={() => navigation.goBack()}
                >
                  <Ionicons name="arrow-back-outline" size={24} color={COLORS.primary} />
                </TouchableOpacity>

                {/* Title Container */}
                <View style={styles.headerTitleContainer}>
                   {/* Adjust title text as needed */}
                  <Text style={styles.title}>Add A1C Reading</Text>
                </View>

                {/* Spacer */}
                <View style={styles.headerSpacer} />
              </View>
              {/* --- End Header --- */}

              <Card variant="elevated" style={styles.inputCard}>
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
              </Card>
            </View>
          </ScrollView>
        </TouchableWithoutFeedback>
      </KeyboardAvoidingView>
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

export default AddA1CScreen;
