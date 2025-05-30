import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  TouchableOpacity, 
  FlatList,
  Alert,
  Switch,
  SafeAreaView,
  Platform
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { COLORS, SIZES, ROUTES } from '../../constants';
import { useApp } from '../../contexts/AppContext';
import Card from '../../components/Card';
import Button from '../../components/Button';
import * as Notifications from 'expo-notifications';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Container from '../../components/Container';

interface Reminder {
  id: string;
  title: string;
  body: string;
  hour: number;
  minute: number;
  repeats: boolean;
  enabled: boolean;
  identifier?: string;
}

const RemindersScreen: React.FC = () => {
  const { userSettings } = useApp();
  const navigation = useNavigation<StackNavigationProp<any>>();
  
  const [reminders, setReminders] = useState<Reminder[]>([]);
  const [notificationPermission, setNotificationPermission] = useState<boolean | null>(null);
  
  // Predefined quick reminders
  const quickReminders = [
    { 
      id: 'reminder_1hour', 
      title: 'Remind me in 1 hour...',
      body: 'Time to check your blood sugar!',
      hour: 1,
      minute: 0,
      repeats: false,
      enabled: true
    },
    { 
      id: 'reminder_2hours', 
      title: 'Remind me in 2 hours...',
      body: 'Time to check your blood sugar!',
      hour: 2,
      minute: 0,
      repeats: false,
      enabled: true
    }
  ];

  useEffect(() => {
    checkNotificationPermissions();
    loadReminders();
  }, []);

  const checkNotificationPermissions = async () => {
    try {
      const { status } = await Notifications.getPermissionsAsync();
      setNotificationPermission(status === 'granted');
    } catch (error) {
      console.error('Error checking notification permissions:', error);
      setNotificationPermission(false);
    }
  };

  const requestNotificationPermissions = async () => {
    try {
      const { status } = await Notifications.requestPermissionsAsync();
      setNotificationPermission(status === 'granted');
      return status === 'granted';
    } catch (error) {
      console.error('Error requesting notification permissions:', error);
      return false;
    }
  };

  const loadReminders = async () => {
    try {
      const storedReminders = await AsyncStorage.getItem('reminders');
      if (storedReminders) {
        setReminders(JSON.parse(storedReminders));
      }
    } catch (error) {
      console.error('Error loading reminders:', error);
    }
  };

  const handleAddReminder = () => {
    navigation.navigate(ROUTES.ADD_REMINDER);
  };

  const handleEditReminder = (reminder: Reminder) => {
    navigation.navigate(ROUTES.ADD_REMINDER, { reminder });
  };

  const handleToggleReminder = async (reminder: Reminder, enabled: boolean) => {
    try {
      // Cancel the existing notification if disabling
      if (!enabled && reminder.identifier) {
        await Notifications.cancelScheduledNotificationAsync(reminder.identifier);
      }
      
      // Re-schedule the notification if enabling
      let identifier = reminder.identifier;
      if (enabled) {
        const now = new Date();
        const scheduledTime = new Date(now);
        
        // Set the time for the notification
        scheduledTime.setHours(reminder.hour);
        scheduledTime.setMinutes(reminder.minute);
        scheduledTime.setSeconds(0);
        
        // If the time is in the past, schedule for tomorrow
        if (scheduledTime < now) {
          scheduledTime.setDate(scheduledTime.getDate() + 1);
        }
        
        // Schedule the notification
        identifier = await Notifications.scheduleNotificationAsync({
          content: {
            title: reminder.title,
            body: reminder.body,
            data: { id: reminder.id },
          },
          trigger: reminder.repeats 
            ? { hour: reminder.hour, minute: reminder.minute, repeats: true }
            : scheduledTime,
        });
      }
      
      // Update reminders state
      const updatedReminders = reminders.map(r => 
        r.id === reminder.id ? { ...r, enabled, identifier } : r
      );
      setReminders(updatedReminders);
      
      // Save to AsyncStorage
      await AsyncStorage.setItem('reminders', JSON.stringify(updatedReminders));
    } catch (error) {
      console.error('Error toggling reminder:', error);
      Alert.alert('Error', 'Failed to update reminder status');
    }
  };

  const handleDeleteReminder = async (reminder: Reminder) => {
    try {
      // Confirm deletion
      Alert.alert(
        'Delete Reminder',
        'Are you sure you want to delete this reminder?',
        [
          { text: 'Cancel', style: 'cancel' },
          { 
            text: 'Delete', 
            style: 'destructive',
            onPress: async () => {
              // Cancel the notification
              if (reminder.identifier) {
                await Notifications.cancelScheduledNotificationAsync(reminder.identifier);
              }
              
              // Filter out the deleted reminder
              const updatedReminders = reminders.filter(r => r.id !== reminder.id);
              setReminders(updatedReminders);
              
              // Save to AsyncStorage
              await AsyncStorage.setItem('reminders', JSON.stringify(updatedReminders));
            }
          }
        ]
      );
    } catch (error) {
      console.error('Error deleting reminder:', error);
      Alert.alert('Error', 'Failed to delete reminder');
    }
  };

  const handleQuickReminder = async (hours: number) => {
    try {
      if (!notificationPermission) {
        const granted = await requestNotificationPermissions();
        if (!granted) {
          Alert.alert(
            'Permission Required',
            'Notification permission is required to set reminders'
          );
          return;
        }
      }
      
      // Calculate the time for the quick reminder
      const now = new Date();
      const reminderTime = new Date(now.getTime() + hours * 60 * 60 * 1000);
      
      // Generate a unique ID
      const reminderId = `quick_${Date.now()}`;
      
      // Schedule the notification
      const identifier = await Notifications.scheduleNotificationAsync({
        content: {
          title: 'Blood Sugar Reminder',
          body: `It's time to check your blood sugar!`,
          data: { id: reminderId },
        },
        trigger: reminderTime,
      });
      
      // Create the reminder object
      const newReminder: Reminder = {
        id: reminderId,
        title: 'Blood Sugar Reminder',
        body: `It's time to check your blood sugar!`,
        hour: reminderTime.getHours(),
        minute: reminderTime.getMinutes(),
        repeats: false,
        enabled: true,
        identifier,
      };
      
      // Update state and save
      const updatedReminders = [...reminders, newReminder];
      setReminders(updatedReminders);
      await AsyncStorage.setItem('reminders', JSON.stringify(updatedReminders));
      
      // Show confirmation
      Alert.alert(
        'Reminder Set',
        `You will be reminded in ${hours} hour${hours !== 1 ? 's' : ''}`
      );
    } catch (error) {
      console.error('Error setting quick reminder:', error);
      Alert.alert('Error', 'Failed to set reminder');
    }
  };

  const formatTime = (hour: number, minute: number) => {
    const date = new Date();
    date.setHours(hour);
    date.setMinutes(minute);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const renderPermissionRequest = () => (
    <Card style={styles.permissionCard}>
      <View style={styles.permissionContent}>
        <Ionicons name="notifications-off" size={32} color={COLORS.lightText} />
        <View style={styles.permissionTextContainer}>
          <Text style={styles.permissionTitle}>Notifications Disabled</Text>
          <Text style={styles.permissionText}>
            Please enable notifications to use reminders
          </Text>
        </View>
        <Button
          title="Enable"
          onPress={requestNotificationPermissions}
          style={styles.permissionButton}
        />
      </View>
    </Card>
  );

  const renderReminderItem = ({ item }: { item: Reminder }) => (
    <Card style={styles.reminderItem}>
      <View style={styles.reminderContent}>
        <Text style={styles.reminderTitle}>{item.title}</Text>
        <Text style={styles.reminderTime}>{formatTime(item.hour, item.minute)}</Text>
        {item.repeats && <Text style={styles.repeatLabel}>Repeats daily</Text>}
      </View>
      <View style={styles.reminderActions}>
        <Switch
          value={item.enabled}
          onValueChange={(value) => handleToggleReminder(item, value)}
          trackColor={{ false: '#767577', true: COLORS.primaryLight }}
          thumbColor={item.enabled ? COLORS.primary : '#f4f3f4'}
        />
        <TouchableOpacity 
          onPress={() => handleEditReminder(item)}
          style={styles.actionButton}
        >
          <Ionicons name="create-outline" size={22} color={COLORS.primary} />
        </TouchableOpacity>
        <TouchableOpacity 
          onPress={() => handleDeleteReminder(item)}
          style={styles.actionButton}
        >
          <Ionicons name="trash-outline" size={22} color={COLORS.danger} />
        </TouchableOpacity>
      </View>
    </Card>
  );

  const renderEmptyList = () => (
    <View style={styles.emptyContainer}>
      <Ionicons name="alarm-outline" size={48} color={COLORS.lightText} />
      <Text style={styles.emptyTitle}>No Reminders Yet</Text>
      <Text style={styles.emptyText}>
        Set up reminders to help you stay on top of your health routine
      </Text>
      <Button
        title="Add a Reminder"
        onPress={handleAddReminder}
        style={styles.addReminderButton}
      />
    </View>
  );

  const renderQuickReminders = () => (
    <Card style={styles.quickRemindersCard}>
      <Text style={styles.sectionTitle}>Quick Reminders</Text>
      <View style={styles.quickButtonsContainer}>
        <TouchableOpacity 
          style={styles.quickButton}
          onPress={() => handleQuickReminder(1)}
        >
          <Text style={styles.quickButtonText}>In 1 hour</Text>
        </TouchableOpacity>
        <TouchableOpacity 
          style={styles.quickButton}
          onPress={() => handleQuickReminder(2)}
        >
          <Text style={styles.quickButtonText}>In 2 hours</Text>
        </TouchableOpacity>
        <TouchableOpacity 
          style={styles.quickButton}
          onPress={() => handleQuickReminder(4)}
        >
          <Text style={styles.quickButtonText}>In 4 hours</Text>
        </TouchableOpacity>
      </View>
    </Card>
  );

  const handleBackPress = () => {
    const canGoBack = navigation.canGoBack();
    if (canGoBack) {
      navigation.goBack();
    } else {
      navigation.navigate(ROUTES.SETTINGS);
    }
  };

  return (
    <Container>
      <View style={styles.header}>
        <TouchableOpacity 
          onPress={handleBackPress}
          style={styles.backButton}
        >
          <Ionicons name="arrow-back" size={24} color={COLORS.text} />
        </TouchableOpacity>
        <Text style={styles.title}>Reminders</Text>
        <TouchableOpacity 
          onPress={handleAddReminder}
          style={styles.addButton}
        >
          <Ionicons name="add" size={24} color="white" />
        </TouchableOpacity>
      </View>
      
      {notificationPermission === false ? renderPermissionRequest() : (
        <View style={styles.reminderContainer}>
          {renderQuickReminders()}
          <Text style={styles.reminderText}>
            Reminders help you remember to check your blood sugar, take medication, or perform other important health tasks.
          </Text>
          <FlatList
            data={reminders}
            renderItem={renderReminderItem}
            keyExtractor={item => item.id}
            contentContainerStyle={styles.listContent}
            ListEmptyComponent={renderEmptyList}
          />
        </View>
      )}
    </Container>
  );
};

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: SIZES.md,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  backButton: {
    padding: SIZES.xs,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: COLORS.text,
  },
  addButton: {
    backgroundColor: COLORS.primary,
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  permissionCard: {
    margin: SIZES.md,
  },
  permissionContent: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: SIZES.md,
  },
  permissionTextContainer: {
    flex: 1,
    marginLeft: SIZES.md,
  },
  permissionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: COLORS.text,
    marginBottom: 4,
  },
  permissionText: {
    fontSize: 14,
    color: COLORS.lightText,
  },
  permissionButton: {
    alignSelf: 'flex-end',
  },
  reminderContainer: {
    flex: 1,
    padding: SIZES.md,
  },
  reminderText: {
    fontSize: 16,
    color: COLORS.text,
    textAlign: 'center',
    marginBottom: SIZES.lg,
  },
  listContent: {
    flexGrow: 1,
  },
  reminderItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: COLORS.cardBackground,
    borderRadius: 8,
    padding: SIZES.md,
    marginBottom: SIZES.sm,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  reminderContent: {
    flex: 1,
  },
  reminderTitle: {
    fontSize: 16,
    color: COLORS.primary,
    fontWeight: '500',
  },
  reminderTime: {
    fontSize: 14,
    color: COLORS.text,
    marginTop: 4,
  },
  repeatLabel: {
    fontSize: 12,
    color: COLORS.lightText,
    marginTop: 2,
  },
  reminderActions: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  actionButton: {
    padding: 8,
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: SIZES.xl,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: COLORS.text,
    marginTop: SIZES.md,
    marginBottom: SIZES.xs,
  },
  emptyText: {
    fontSize: 14,
    color: COLORS.lightText,
    textAlign: 'center',
    marginBottom: SIZES.md,
  },
  addReminderContainer: {
    alignItems: 'center',
    marginTop: SIZES.lg,
  },
  addReminderButton: {
    minWidth: 200,
    marginTop: SIZES.md,
  },
  quickRemindersCard: {
    marginBottom: SIZES.md,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: COLORS.text,
    marginBottom: SIZES.sm,
    paddingHorizontal: SIZES.sm,
    paddingTop: SIZES.sm,
  },
  quickButtonsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: SIZES.sm,
    paddingBottom: SIZES.sm,
  },
  quickButton: {
    backgroundColor: COLORS.primary,
    paddingVertical: SIZES.sm,
    paddingHorizontal: SIZES.md,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  quickButtonText: {
    color: 'white',
    fontWeight: '500',
  },
});

export default RemindersScreen;
