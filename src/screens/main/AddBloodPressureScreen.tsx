import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, Alert, TouchableOpacity, Platform, KeyboardAvoidingView, Keyboard, ScrollView, TouchableWithoutFeedback } from 'react-native';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import DateTimePicker from '@react-native-community/datetimepicker';
import { useForm, Controller } from 'react-hook-form';
import { COLORS, SIZES, ROUTES } from '../../constants';
import { addBloodPressureReading, updateBloodPressureReading } from '../../services/database';
import Container from '../../components/Container';
import Input from '../../components/Input';
import Button from '../../components/Button';
import { Ionicons } from '@expo/vector-icons';
import { BloodPressureReading, MainStackParamList } from '../../types';
import Card from '../../components/Card';

type RouteParams = RouteProp<MainStackParamList, 'AddPressure'>;

const AddBloodPressureScreen: React.FC = () => {
  const navigation = useNavigation<StackNavigationProp<any>>();
  const route = useRoute<RouteParams>();
  const initialData = route?.params?.initialData;
  const isEditing = !!initialData;
  
  const [systolic, setSystolic] = useState(initialData ? initialData.systolic.toString() : '');
  const [diastolic, setDiastolic] = useState(initialData ? initialData.diastolic.toString() : '');
  const [notes, setNotes] = useState(initialData?.notes || '');
  const [timestamp, setTimestamp] = useState(initialData ? new Date(initialData.timestamp) : new Date());
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showTimePicker, setShowTimePicker] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Add temporary date/time state for iOS picker
  const [tempDate, setTempDate] = useState<Date | null>(null);
  const [tempTime, setTempTime] = useState<Date | null>(null);

  const handleSubmit = async () => {
    if (!systolic || !diastolic) {
      Alert.alert('Error', 'Please enter both systolic and diastolic values');
      return;
    }

    const systolicValue = parseInt(systolic, 10);
    const diastolicValue = parseInt(diastolic, 10);

    if (isNaN(systolicValue) || systolicValue < 60 || systolicValue > 250) {
      Alert.alert('Error', 'Please enter a valid systolic value between 60 and 250');
      return;
    }

    if (isNaN(diastolicValue) || diastolicValue < 40 || diastolicValue > 150) {
      Alert.alert('Error', 'Please enter a valid diastolic value between 40 and 150');
      return;
    }

    setIsSubmitting(true);

    try {
      const readingData = {
        systolic: systolicValue,
        diastolic: diastolicValue,
        timestamp: timestamp.getTime(),
        notes: notes.trim() || null
      };
      
      if (isEditing && initialData) {
        // Update existing reading
        await updateBloodPressureReading(initialData.id, readingData);
      } else {
        // Add new reading
        await addBloodPressureReading(readingData);
      }

      // Reset form and navigate directly to log screen
      setSystolic('');
      setDiastolic('');
      setNotes('');
      setTimestamp(new Date());
      navigation.navigate('SugarLog'); // Navigate to the log screen to see the entry
    } catch (error) {
      console.error('Error saving blood pressure reading:', error);
      Alert.alert('Error', 'Failed to save blood pressure reading. Please try again.');
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
    if (showDatePicker) {
      setShowDatePicker(false);
    } else {
      setShowTimePicker(false); // Close time picker if open
      setShowDatePicker(true);
    }
    Keyboard.dismiss();
  };

  const showTimepicker = () => {
    if (showTimePicker) {
      setShowTimePicker(false);
    } else {
      setShowDatePicker(false); // Close date picker if open
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
        style={{ flex: 1 }}
      >
        <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
          <ScrollView
            contentContainerStyle={{ flexGrow: 1 }}
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
                  <Text style={styles.title}>
                    {isEditing ? "Edit Blood Pressure" : "Add Blood Pressure"}
                  </Text>
                </View>

                {/* Spacer */}
                <View style={styles.headerSpacer} />
              </View>
              {/* --- End Header --- */}

              <Card variant="elevated" style={styles.inputCard}>
                <View style={styles.bpContainer}>
                  <View style={styles.inputContainer}>
                    <Text style={styles.label}>Systolic (mmHg)</Text>
                    <Input
                      value={systolic}
                      onChangeText={setSystolic}
                      placeholder="e.g., 120"
                      keyboardType="number-pad"
                    />
                  </View>

                  <View style={styles.inputContainer}>
                    <Text style={styles.label}>Diastolic (mmHg)</Text>
                    <Input
                      value={diastolic}
                      onChangeText={setDiastolic}
                      placeholder="e.g., 80"
                      keyboardType="number-pad"
                    />
                  </View>
                </View>

                <View style={styles.dateTimeContainer}>
                  <Text style={styles.label}>Date & Time</Text>
                  <View style={styles.dateTimeButtonsContainer}>
                    <TouchableOpacity onPress={showDatepicker} style={styles.dateTimeButton}>
                      <Text style={styles.dateTimeText}>{formatDate(timestamp)}</Text>
                      <Ionicons name="calendar-outline" size={20} color={COLORS.primary} style={styles.dateTimeIcon} />
                    </TouchableOpacity>

                    <TouchableOpacity onPress={showTimepicker} style={styles.dateTimeButton}>
                      <Text style={styles.dateTimeText}>{formatTime(timestamp)}</Text>
                      <Ionicons name="time-outline" size={20} color={COLORS.primary} style={styles.dateTimeIcon} />
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
                    title={isEditing ? "Update Blood Pressure" : "Save Blood Pressure"}
                    onPress={handleSubmit}
                    disabled={!systolic || !diastolic || isSubmitting}
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
  bpContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: SIZES.md,
  },
  inputContainer: {
    marginBottom: SIZES.md,
    flex: 1,
    marginHorizontal: SIZES.xs,
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

export default AddBloodPressureScreen;
