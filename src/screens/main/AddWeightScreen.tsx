import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, Alert, TouchableOpacity, Platform, KeyboardAvoidingView, TouchableWithoutFeedback, ScrollView, Keyboard } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import DateTimePicker from '@react-native-community/datetimepicker';
import { COLORS, SIZES } from '../../constants';
import { addWeightMeasurement } from '../../services/database';
import Container from '../../components/Container';
import Input from '../../components/Input';
import Button from '../../components/Button';
import { Ionicons } from '@expo/vector-icons';
import Card from '../../components/Card';
import { useApp } from '../../contexts/AppContext';

const AddWeightScreen: React.FC = () => {
  const navigation = useNavigation<StackNavigationProp<any>>();
  const { userSettings } = useApp();
  const [weightValue, setWeightValue] = useState('');
  const [notes, setNotes] = useState('');
  const [timestamp, setTimestamp] = useState(new Date());
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showTimePicker, setShowTimePicker] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [tempDate, setTempDate] = useState<Date | null>(null);
  const [tempTime, setTempTime] = useState<Date | null>(null);

  const weightUnit = userSettings?.weightUnit || 'kg';

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
        unit: weightUnit,
        timestamp: timestamp.getTime(),
        notes: notes.trim() || null
      });

      // Reset form and navigate directly to log screen without showing success popup
      setWeightValue('');
      setNotes('');
      setTimestamp(new Date());
      navigation.navigate('SugarLog'); // Navigate to the log screen to see the entry
    } catch (error) {
      console.error('Error saving weight measurement:', error);
      Alert.alert('Error', 'Failed to save weight measurement. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const showDatepicker = () => {
    if (showDatePicker) {
      setShowDatePicker(false);
    } else {
      setShowTimePicker(false);
      setShowDatePicker(true);
    }
    Keyboard.dismiss();
  };

  const showTimepicker = () => {
    if (showTimePicker) {
      setShowTimePicker(false);
    } else {
      setShowDatePicker(false);
      setShowTimePicker(true);
    }
    Keyboard.dismiss();
  };

  const confirmIosDate = () => {
    if (tempDate) {
      const newDate = new Date(timestamp);
      newDate.setFullYear(tempDate.getFullYear());
      newDate.setMonth(tempDate.getMonth());
      newDate.setDate(tempDate.getDate());
      setTimestamp(newDate);
    }
    setShowDatePicker(false);
    setTempDate(null);
  };

  const confirmIosTime = () => {
    if (tempTime) {
      const newDate = new Date(timestamp);
      newDate.setHours(tempTime.getHours());
      newDate.setMinutes(tempTime.getMinutes());
      setTimestamp(newDate);
    }
    setShowTimePicker(false);
    setTempTime(null);
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
      minute: 'numeric',
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
        // ... KAV props ...
      >
        <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
          <ScrollView
            // ... ScrollView props ...
          >
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
                  <Text style={styles.title}>Add Weight</Text>
                </View>

                {/* Spacer */}
                <View style={styles.headerSpacer} />
              </View>
              {/* --- End Header --- */}

              <Card variant="elevated" style={styles.inputCard}>
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
                      <Text style={styles.dateTimeText}>{formatDate(timestamp)}</Text>
                      <Ionicons 
                        name="calendar-outline" 
                        size={18} 
                        color={COLORS.primary} 
                        style={styles.dateTimeIcon} 
                      />
                    </TouchableOpacity>

                    <TouchableOpacity onPress={showTimepicker} style={styles.dateTimeButton}>
                      <Text style={styles.dateTimeText}>{formatTime(timestamp)}</Text>
                      <Ionicons 
                        name="time-outline" 
                        size={18} 
                        color={COLORS.primary} 
                        style={styles.dateTimeIcon} 
                      />
                    </TouchableOpacity>
                  </View>

                  {showDatePicker && (
                    <View style={dateTimePickerStyle}>
                      <DateTimePicker
                        value={tempDate || timestamp}
                        mode="date"
                        display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                        onChange={(event, selectedDate) => {
                          if (Platform.OS === 'android') {
                            setShowDatePicker(false);
                            if (event.type === 'set' && selectedDate) {
                              const newDate = new Date(timestamp);
                              newDate.setFullYear(selectedDate.getFullYear());
                              newDate.setMonth(selectedDate.getMonth());
                              newDate.setDate(selectedDate.getDate());
                              setTimestamp(newDate);
                            }
                          } else if (selectedDate) {
                            setTempDate(selectedDate);
                          }
                        }}
                        style={Platform.OS === 'ios' ? { alignSelf: 'center', width: '100%' } : {}}
                      />
                      <View style={styles.pickerButtonsContainer}>
                        <TouchableOpacity 
                          style={[styles.pickerButton, styles.cancelPickerButton]} 
                          onPress={() => {
                            setShowDatePicker(false);
                            setTempDate(null);
                          }}
                        >
                          <Text style={styles.cancelPickerButtonText}>Cancel</Text>
                        </TouchableOpacity>
                        <TouchableOpacity 
                          style={[styles.pickerButton, styles.okPickerButton]} 
                          onPress={confirmIosDate}
                        >
                          <Text style={styles.okPickerButtonText}>OK</Text>
                        </TouchableOpacity>
                      </View>
                    </View>
                  )}

                  {showTimePicker && (
                    <View style={dateTimePickerStyle}>
                      <DateTimePicker
                        value={tempTime || timestamp}
                        mode="time"
                        display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                        onChange={(event, selectedTime) => {
                          if (Platform.OS === 'android') {
                            setShowTimePicker(false);
                            if (event.type === 'set' && selectedTime) {
                              const newDate = new Date(timestamp);
                              newDate.setHours(selectedTime.getHours());
                              newDate.setMinutes(selectedTime.getMinutes());
                              setTimestamp(newDate);
                            }
                          } else if (selectedTime) {
                            setTempTime(selectedTime);
                          }
                        }}
                        style={Platform.OS === 'ios' ? { alignSelf: 'center', width: '100%' } : {}}
                      />
                      <View style={styles.pickerButtonsContainer}>
                        <TouchableOpacity 
                          style={[styles.pickerButton, styles.cancelPickerButton]} 
                          onPress={() => {
                            setShowTimePicker(false);
                            setTempTime(null);
                          }}
                        >
                          <Text style={styles.cancelPickerButtonText}>Cancel</Text>
                        </TouchableOpacity>
                        <TouchableOpacity 
                          style={[styles.pickerButton, styles.okPickerButton]} 
                          onPress={confirmIosTime}
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
                    title="Save Weight Measurement"
                    onPress={handleSubmit}
                    disabled={!weightValue || isSubmitting}
                    loading={isSubmitting}
                    style={styles.saveButton}
                  />
                </View>
              </Card>
            </View>
          </ScrollView>
        </TouchableWithoutFeedback>
      </KeyboardAvoidingView>
      {/* ... Modals and InputAccessoryView ... */}
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
    justifyContent: 'space-between',
    backgroundColor: COLORS.inputBackground,
    paddingHorizontal: SIZES.sm,
    paddingVertical: SIZES.sm,
    borderRadius: SIZES.xs,
    marginRight: SIZES.sm,
  },
  dateTimeText: {
    fontSize: 14,
    color: COLORS.text,
  },
  dateTimeIcon: {
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

export default AddWeightScreen;
