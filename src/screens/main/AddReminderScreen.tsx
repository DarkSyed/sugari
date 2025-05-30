import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  TouchableOpacity, 
  TextInput,
  Switch,
  Alert,
  Platform,
  ScrollView,
  KeyboardAvoidingView
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { COLORS, SIZES } from '../../constants';
import Button from '../../components/Button';
import DateTimePicker from '@react-native-community/datetimepicker';
import * as Notifications from 'expo-notifications';

interface AddReminderProps {
  route?: {
    params?: {
      reminder?: any;
    };
  };
}

const AddReminderScreen: React.FC<AddReminderProps> = ({ route }) => {
  const navigation = useNavigation<StackNavigationProp<any>>();
  const editingReminder = route?.params?.reminder;
  const isEditing = !!editingReminder;
  
  const [title, setTitle] = useState(editingReminder?.title || 'Check Blood Sugar');
  const [body, setBody] = useState(editingReminder?.body || 'Time to check your blood sugar!');
  const [date, setDate] = useState(new Date());
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [repeats, setRepeats] = useState(editingReminder?.repeats || false);
  const [repeatType, setRepeatType] = useState('daily');
  const [isSaving, setIsSaving] = useState(false);
  
  useEffect(() => {
    if (isEditing && editingReminder) {
      // If editing, set the date based on the reminder's hour and minute
      const now = new Date();
      const reminderDate = new Date(
        now.getFullYear(),
        now.getMonth(),
        now.getDate(),
        editingReminder.hour || 0,
        editingReminder.minute || 0
      );
      setDate(reminderDate);
    }
  }, [isEditing, editingReminder]);
  
  const handleDateChange = (event: any, selectedDate?: Date) => {
    const currentDate = selectedDate || date;
    setShowDatePicker(Platform.OS === 'ios');
    setDate(currentDate);
  };
  
  const formatTime = (date: Date) => {
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };
  
  const handleSaveReminder = async () => {
    try {
      setIsSaving(true);
      
      // Check notification permissions
      const { status } = await Notifications.getPermissionsAsync();
      if (status !== 'granted') {
        const { status: newStatus } = await Notifications.requestPermissionsAsync();
        if (newStatus !== 'granted') {
          Alert.alert(
            'Permission Required',
            'Notification permission is required to set reminders.',
            [
              { text: 'Cancel', style: 'cancel' },
              { text: 'Settings', onPress: () => Notifications.requestPermissionsAsync() }
            ]
          );
          setIsSaving(false);
          return;
        }
      }
      
      // Generate a unique ID for the reminder
      const reminderId = isEditing ? editingReminder.id : Date.now().toString();
      
      // Cancel existing notification if editing
      if (isEditing && editingReminder.identifier) {
        await Notifications.cancelScheduledNotificationAsync(editingReminder.identifier);
      }
      
      // Create the notification content
      const notificationContent = {
        title,
        body,
        data: {
          type: 'reminder',
          id: reminderId
        }
      };
      
      // Configure the trigger based on repeat settings
      let trigger;
      if (repeats) {
        // For repeating notifications
        trigger = {
          hour: date.getHours(),
          minute: date.getMinutes(),
          repeats: true,
        };
      } else {
        // For one-time notification
        const triggerDate = new Date(date);
        // If the selected time is in the past, schedule for tomorrow
        if (triggerDate < new Date()) {
          triggerDate.setDate(triggerDate.getDate() + 1);
        }
        trigger = triggerDate;
      }
      
      // Schedule the notification
      const identifier = await Notifications.scheduleNotificationAsync({
        content: notificationContent,
        trigger,
      });
      
      // Save reminder to AsyncStorage
      const reminderData = {
        id: reminderId,
        title,
        body,
        hour: date.getHours(),
        minute: date.getMinutes(),
        repeats,
        repeatType: repeats ? repeatType : null,
        enabled: true,
        identifier,
        createdAt: Date.now()
      };
      
      // Retrieve existing reminders
      const existingRemindersString = await AsyncStorage.getItem('reminders');
      let existingReminders = existingRemindersString 
        ? JSON.parse(existingRemindersString)
        : [];
      
      if (isEditing) {
        // Update existing reminder
        existingReminders = existingReminders.map((r: any) => 
          r.id === reminderId ? reminderData : r
        );
      } else {
        // Add new reminder
        existingReminders.push(reminderData);
      }
      
      // Save updated reminders
      await AsyncStorage.setItem('reminders', JSON.stringify(existingReminders));
      
      // Show success message
      Alert.alert(
        'Success',
        isEditing 
          ? 'Reminder has been updated!' 
          : 'Reminder has been set!',
        [{ text: 'OK', onPress: () => navigation.goBack() }]
      );
    } catch (error) {
      console.error('Error setting reminder:', error);
      Alert.alert('Error', 'Failed to set reminder. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };
  
  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={styles.container}
    >
      <View style={styles.header}>
        <TouchableOpacity 
          onPress={() => navigation.goBack()}
          style={styles.backButton}
        >
          <Ionicons name="arrow-back" size={24} color={COLORS.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>
          {isEditing ? 'Edit Reminder' : 'Add Reminder'}
        </Text>
        <View style={styles.headerSpacer} />
      </View>
      
      <ScrollView 
        style={styles.content}
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
      >
        <Text style={styles.inputLabel}>Title</Text>
        <TextInput
          style={styles.input}
          value={title}
          onChangeText={setTitle}
          placeholder="Enter reminder title"
          placeholderTextColor={COLORS.lightText}
        />
        
        <Text style={styles.inputLabel}>Message</Text>
        <TextInput
          style={styles.input}
          value={body}
          onChangeText={setBody}
          placeholder="Enter reminder message"
          placeholderTextColor={COLORS.lightText}
        />
        
        <Text style={styles.inputLabel}>Time</Text>
        <TouchableOpacity 
          style={styles.timeButton}
          onPress={() => setShowDatePicker(true)}
        >
          <Text style={styles.timeText}>{formatTime(date)}</Text>
        </TouchableOpacity>
        
        {showDatePicker && (
          <DateTimePicker
            value={date}
            mode="time"
            is24Hour={false}
            display={Platform.OS === 'ios' ? 'spinner' : 'default'}
            onChange={handleDateChange}
          />
        )}
        
        <View style={styles.switchContainer}>
          <View style={styles.switchLabelContainer}>
            <Ionicons name="repeat" size={20} color={COLORS.primary} />
            <Text style={styles.switchLabel}>Repeat Daily</Text>
          </View>
          <Switch
            value={repeats}
            onValueChange={setRepeats}
            trackColor={{ false: '#767577', true: COLORS.primary }}
            thumbColor={repeats ? '#fff' : '#f4f3f4'}
          />
        </View>
        
        {repeats && (
          <View style={styles.repeatOptionsContainer}>
            <TouchableOpacity 
              style={[
                styles.repeatOption, 
                repeatType === 'daily' && styles.repeatOptionSelected
              ]}
              onPress={() => setRepeatType('daily')}
            >
              <Text 
                style={[
                  styles.repeatOptionText,
                  repeatType === 'daily' && styles.repeatOptionTextSelected
                ]}
              >
                Daily
              </Text>
            </TouchableOpacity>
            <TouchableOpacity 
              style={[
                styles.repeatOption, 
                repeatType === 'weekdays' && styles.repeatOptionSelected
              ]}
              onPress={() => setRepeatType('weekdays')}
            >
              <Text 
                style={[
                  styles.repeatOptionText,
                  repeatType === 'weekdays' && styles.repeatOptionTextSelected
                ]}
              >
                Weekdays
              </Text>
            </TouchableOpacity>
            <TouchableOpacity 
              style={[
                styles.repeatOption, 
                repeatType === 'weekends' && styles.repeatOptionSelected
              ]}
              onPress={() => setRepeatType('weekends')}
            >
              <Text 
                style={[
                  styles.repeatOptionText,
                  repeatType === 'weekends' && styles.repeatOptionTextSelected
                ]}
              >
                Weekends
              </Text>
            </TouchableOpacity>
          </View>
        )}
        
        <View style={styles.infoContainer}>
          <Ionicons name="information-circle-outline" size={20} color={COLORS.primary} />
          <Text style={styles.infoText}>
            {repeats 
              ? 'This reminder will be sent every day at the specified time.' 
              : 'This is a one-time reminder that will be sent at the specified time.'}
          </Text>
        </View>
      </ScrollView>
      
      <View style={styles.buttonContainer}>
        <Button
          title="Cancel"
          variant="outline"
          onPress={() => navigation.goBack()}
          style={styles.cancelButton}
          disabled={isSaving}
        />
        <Button
          title={isSaving ? 'Saving...' : 'Save Reminder'}
          onPress={handleSaveReminder}
          style={styles.saveButton}
          loading={isSaving}
          disabled={isSaving}
        />
      </View>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: SIZES.md,
    paddingVertical: SIZES.md,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  backButton: {
    padding: SIZES.xs,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: COLORS.text,
  },
  headerSpacer: {
    width: 24,
  },
  content: {
    flex: 1,
  },
  scrollContent: {
    padding: SIZES.md,
  },
  inputLabel: {
    fontSize: 16,
    fontWeight: '500',
    color: COLORS.text,
    marginBottom: SIZES.xs,
    marginTop: SIZES.md,
  },
  input: {
    backgroundColor: COLORS.cardBackground,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 8,
    padding: SIZES.md,
    fontSize: 16,
    color: COLORS.text,
  },
  timeButton: {
    backgroundColor: COLORS.cardBackground,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 8,
    paddingHorizontal: SIZES.md,
    paddingVertical: SIZES.sm,
  },
  timeText: {
    fontSize: 16,
    color: COLORS.text,
  },
  switchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: SIZES.md,
  },
  switchLabelContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  switchLabel: {
    fontSize: 16,
    color: COLORS.text,
    marginLeft: SIZES.xs,
  },
  repeatOptionsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: SIZES.md,
  },
  repeatOption: {
    flex: 1,
    backgroundColor: COLORS.cardBackground,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 8,
    paddingVertical: SIZES.sm,
    alignItems: 'center',
    marginHorizontal: 4,
  },
  repeatOptionSelected: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  repeatOptionText: {
    fontSize: 14,
    color: COLORS.text,
  },
  repeatOptionTextSelected: {
    color: 'white',
  },
  infoContainer: {
    flexDirection: 'row',
    backgroundColor: 'rgba(0, 102, 204, 0.1)',
    padding: SIZES.md,
    borderRadius: 8,
    marginTop: SIZES.sm,
    alignItems: 'flex-start',
  },
  infoText: {
    fontSize: 14,
    color: COLORS.text,
    marginLeft: SIZES.xs,
    flex: 1,
    lineHeight: 20,
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    padding: SIZES.md,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
    backgroundColor: COLORS.background,
  },
  cancelButton: {
    flex: 1,
    marginRight: SIZES.xs,
  },
  saveButton: {
    flex: 1,
    marginLeft: SIZES.xs,
  },
});

export default AddReminderScreen;
