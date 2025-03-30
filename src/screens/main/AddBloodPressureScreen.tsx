import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Platform } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { COLORS, SIZES } from '../../constants';
import Container from '../../components/Container';
import Input from '../../components/Input';
import Button from '../../components/Button';
import Card from '../../components/Card';
import DateTimePicker from '@react-native-community/datetimepicker';

const AddBloodPressureScreen: React.FC = () => {
  const navigation = useNavigation();
  const [systolic, setSystolic] = useState('');
  const [diastolic, setDiastolic] = useState('');
  const [notes, setNotes] = useState('');
  const [date, setDate] = useState(new Date());
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showTimePicker, setShowTimePicker] = useState(false);

  const handleSubmit = () => {
    // TODO: Implement blood pressure tracking functionality
    console.log('Blood pressure submitted:', { 
      systolic, 
      diastolic, 
      timestamp: date.getTime(), 
      notes 
    });
    navigation.goBack();
  };

  const onDateChange = (event: any, selectedDate?: Date) => {
    setShowDatePicker(Platform.OS === 'ios');
    
    if (selectedDate) {
      const currentTime = new Date(date);
      selectedDate.setHours(currentTime.getHours());
      selectedDate.setMinutes(currentTime.getMinutes());
      setDate(selectedDate);
    }
  };

  const onTimeChange = (event: any, selectedTime?: Date) => {
    setShowTimePicker(Platform.OS === 'ios');
    
    if (selectedTime) {
      const newDate = new Date(date);
      newDate.setHours(selectedTime.getHours());
      newDate.setMinutes(selectedTime.getMinutes());
      setDate(newDate);
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
      <View style={styles.header}>
        <Text style={styles.title}>Log Blood Pressure</Text>
      </View>

      <Card variant="elevated" style={styles.card}>
        <View style={styles.bpContainer}>
          <View style={styles.bpField}>
            <Text style={styles.label}>Systolic (mmHg)</Text>
            <Input
              placeholder="120"
              value={systolic}
              onChangeText={setSystolic}
              keyboardType="number-pad"
            />
          </View>

          <Text style={styles.separator}>/</Text>

          <View style={styles.bpField}>
            <Text style={styles.label}>Diastolic (mmHg)</Text>
            <Input
              placeholder="80"
              value={diastolic}
              onChangeText={setDiastolic}
              keyboardType="number-pad"
            />
          </View>
        </View>

        <Text style={styles.label}>When was this reading taken?</Text>
        <View style={styles.dateTimeContainer}>
          <TouchableOpacity
            style={styles.dateTimeButton}
            onPress={showDatepicker}
          >
            <Text style={styles.dateTimeText}>
              {formatDate(date)}
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.dateTimeButton}
            onPress={showTimepicker}
          >
            <Text style={styles.dateTimeText}>
              {formatTime(date)}
            </Text>
          </TouchableOpacity>
        </View>

        {showDatePicker && (
          <DateTimePicker
            testID="dateTimePicker"
            value={date}
            mode="date"
            display={Platform.OS === 'ios' ? 'spinner' : 'default'}
            onChange={onDateChange}
            maximumDate={new Date()}
          />
        )}

        {showTimePicker && (
          <DateTimePicker
            testID="timeTimePicker"
            value={date}
            mode="time"
            display={Platform.OS === 'ios' ? 'spinner' : 'default'}
            onChange={onTimeChange}
            is24Hour={false}
          />
        )}

        <Text style={styles.label}>Notes (optional)</Text>
        <Input
          placeholder="Add notes"
          value={notes}
          onChangeText={setNotes}
          multiline
          style={styles.notesInput}
        />

        <View style={styles.buttonContainer}>
          <Button 
            title="Save" 
            onPress={handleSubmit} 
            variant="primary"
            style={styles.button}
          />
          <Button 
            title="Cancel" 
            onPress={() => navigation.goBack()} 
            variant="outline"
            style={styles.button}
          />
        </View>
      </Card>
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
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: COLORS.text,
  },
  card: {
    padding: SIZES.md,
  },
  bpContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: SIZES.md,
  },
  bpField: {
    flex: 1,
  },
  separator: {
    fontSize: 28,
    fontWeight: 'bold',
    marginHorizontal: 10,
    color: COLORS.text,
    alignSelf: 'flex-end',
    paddingBottom: 15,
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
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: SIZES.lg,
  },
  button: {
    flex: 1,
    marginHorizontal: 5,
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
});

export default AddBloodPressureScreen; 