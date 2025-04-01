import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  TouchableOpacity, 
  Switch, 
  Alert, 
  ScrollView, 
  Linking, 
  TextInput,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { COLORS, SIZES, APP_NAME } from '../../constants';
import { useApp } from '../../contexts/AppContext';
import Container from '../../components/Container';
import Card from '../../components/Card';
import Button from '../../components/Button';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { UserSettings } from '../../types';
import { 
  getBloodSugarReadings, 
  getUserSettings,
  resetDatabase
} from '../../services/databaseFix';

const SettingsScreen: React.FC = () => {
  const { userSettings, updateSettings, isLoading, theme } = useApp();
  const navigation = useNavigation<StackNavigationProp<any>>();
  const insets = useSafeAreaInsets();
  
  // State for various settings
  const [pushNotifications, setPushNotifications] = useState(true);
  const [emailNotifications, setEmailNotifications] = useState(true);
  const [glucoseReminders, setGlucoseReminders] = useState(true);
  const [darkMode, setDarkMode] = useState(false);
  const [glucoseUnit, setGlucoseUnit] = useState('mg/dL'); // or 'mmol/L'
  const [targetRangeMin, setTargetRangeMin] = useState(70);
  const [targetRangeMax, setTargetRangeMax] = useState(180);
  const [email, setEmail] = useState('');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [diabetesType, setDiabetesType] = useState('type1');
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [notifications, setNotifications] = useState(false);
  const [localSettings, setLocalSettings] = useState<Partial<UserSettings> | null>(null);

  // Update local state when settings change
  useEffect(() => {
    if (userSettings) {
      setEmail(userSettings.email || '');
      setFirstName(userSettings.firstName || '');
      setLastName(userSettings.lastName || '');
      setDiabetesType(userSettings.diabetesType || 'type1');
      setNotifications(userSettings.notifications);
      setDarkMode(userSettings.darkMode);
      setGlucoseUnit(userSettings.units || 'mg/dL');
    }
  }, [userSettings]);

  // Initialize local settings when userSettings changes or edit mode is entered
  useEffect(() => {
    if (userSettings && (isEditingProfile || !localSettings)) {
      setLocalSettings({
        firstName: userSettings.firstName,
        lastName: userSettings.lastName,
        email: userSettings.email,
        diabetesType: userSettings.diabetesType,
        notifications: userSettings.notifications,
        darkMode: userSettings.darkMode,
        units: userSettings.units || 'mg/dL'
      });
    }
  }, [userSettings, isEditingProfile]);

  const handleLogout = async () => {
    Alert.alert(
      'Confirm Logout',
      'Are you sure you want to logout?',
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Logout',
          onPress: async () => {
            try {
              await updateSettings({
                notifications: false,
                darkMode: false,
                units: 'mg/dL'
              });
              // Navigate to login or perform logout action
            } catch (error: any) {
              Alert.alert('Logout Failed', error.message);
            }
          },
        },
      ]
    );
  };

  const openUrl = (url: string) => {
    Linking.openURL(url).catch(err => 
      Alert.alert('Error', 'Could not open the link')
    );
  };

  const handleSupportRequest = () => {
    Alert.alert(
      'Contact Support',
      'How would you like to contact our support team?',
      [
        {
          text: 'Email',
          onPress: () => Linking.openURL('mailto:support@sugari.com'),
        },
        {
          text: 'Website',
          onPress: () => openUrl('https://sugari.com/support'),
        },
        {
          text: 'Cancel',
          style: 'cancel',
        },
      ]
    );
  };

  const handleSaveProfile = async () => {
    setIsSaving(true);
    try {
      await updateSettings({
        email,
        firstName,
        lastName,
        diabetesType
      });
      setIsEditingProfile(false);
      Alert.alert('Success', 'Profile updated successfully');
    } catch (error) {
      console.error('Error updating profile:', error);
      Alert.alert('Error', 'Failed to update profile');
    } finally {
      setIsSaving(false);
    }
  };

  const handleNotificationsChange = async (value: boolean) => {
    setNotifications(value);
    try {
      await updateSettings({ notifications: value });
    } catch (error) {
      console.error('Error updating notifications setting:', error);
      setNotifications(!value); // Revert on error
    }
  };

  const handleDarkModeChange = async (value: boolean) => {
    setDarkMode(value);
    try {
      await updateSettings({ darkMode: value });
    } catch (error) {
      console.error('Error updating dark mode setting:', error);
      setDarkMode(!value); // Revert on error
    }
  };

  const handleUnitsChange = async (value: 'mg/dL' | 'mmol/L') => {
    setGlucoseUnit(value);
    try {
      await updateSettings({ units: value });
    } catch (error) {
      console.error('Error updating units setting:', error);
      setGlucoseUnit(glucoseUnit); // Revert on error
    }
  };

  const handleToggle = async (setting: 'notifications' | 'darkMode') => {
    if (!userSettings) return;
    
    try {
      const newValue = setting === 'notifications' 
        ? !userSettings.notifications 
        : !userSettings.darkMode;
      
      // Update local state immediately for responsive UI
      setLocalSettings(prev => prev ? { ...prev, [setting]: newValue } : null);
      
      // Update in database
      await updateSettings({ [setting]: newValue });
    } catch (error) {
      console.error(`Error toggling ${setting}:`, error);
      Alert.alert('Error', `Could not update ${setting}. Please try again.`);
      
      // Revert local state if there was an error
      setLocalSettings(prev => prev ? { ...prev, [setting]: userSettings[setting] } : null);
    }
  };

  const handleResetDatabase = async () => {
    Alert.alert(
      'Reset Database',
      'This will delete all your health data. This action cannot be undone. Are you sure?',
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Reset',
          style: 'destructive',
          onPress: async () => {
            try {
              const result = await resetDatabase();
              
              if (result.success) {
                Alert.alert('Success', result.message);
                // Force a refresh of all screens that show data
                navigation.reset({
                  index: 0,
                  routes: [{ name: 'Main' }],
                });
              } else {
                Alert.alert('Error', result.message);
              }
            } catch (error: any) {
              Alert.alert('Error', 'Failed to reset database: ' + error.message);
            }
          },
        },
      ]
    );
  };

  const renderSettingSwitch = (
    title: string,
    description: string,
    value: boolean,
    onValueChange: (value: boolean) => void
  ) => (
    <View style={styles.settingRow}>
      <View style={styles.settingInfo}>
        <Text style={styles.settingTitle}>{title}</Text>
        <Text style={styles.settingDescription}>{description}</Text>
      </View>
      <Switch
        value={value}
        onValueChange={onValueChange}
        trackColor={{ false: COLORS.border, true: COLORS.primary + '80' }}
        thumbColor={value ? COLORS.primary : COLORS.lightText}
      />
    </View>
  );

  const renderNavigationItem = (
    icon: string,
    title: string,
    onPress: () => void
  ) => (
    <TouchableOpacity style={styles.navigationRow} onPress={onPress}>
      <View style={styles.navigationIconContainer}>
        <Ionicons name={icon as any} size={22} color={COLORS.primary} />
      </View>
      <Text style={styles.navigationTitle}>{title}</Text>
      <Ionicons name="chevron-forward" size={20} color={COLORS.lightText} />
    </TouchableOpacity>
  );

  const renderDangerZone = () => (
    <Card style={styles.dangerCard}>
      <Text style={styles.dangerTitle}>Danger Zone</Text>
      
      <TouchableOpacity
        style={styles.dangerButton}
        onPress={handleResetDatabase}
      >
        <Text style={styles.dangerButtonText}>Reset Database</Text>
        <Text style={styles.dangerButtonSubtext}>
          This will delete all health data. This action cannot be undone.
        </Text>
      </TouchableOpacity>
      
      <TouchableOpacity
        style={styles.dangerButton}
        onPress={handleLogout}
      >
        <Text style={styles.dangerButtonText}>Logout</Text>
      </TouchableOpacity>
    </Card>
  );

  if (isLoading) {
    return (
      <View style={[styles.loadingContainer, { backgroundColor: theme.colors.background }]}>
        <ActivityIndicator size="large" color={theme.colors.primary} />
      </View>
    );
  }
  
  if (!userSettings || !localSettings) {
    return (
      <View style={[styles.errorContainer, { backgroundColor: theme.colors.background }]}>
        <Text style={[styles.errorText, { color: theme.colors.error }]}>
          Error loading settings. Please try again later.
        </Text>
      </View>
    );
  }

  return (
    <Container>
      <ScrollView showsVerticalScrollIndicator={false}>
        <Text style={styles.title}>Settings</Text>

        <Card variant="elevated" style={styles.section}>
          <Text style={styles.sectionTitle}>Account</Text>
          
          <View style={styles.userInfoContainer}>
            <View style={styles.avatarContainer}>
              <Text style={styles.avatarText}>
                {userSettings.firstName?.[0] || userSettings.email?.[0] || 'U'}
              </Text>
            </View>
            <View style={styles.userInfo}>
              <Text style={styles.userName}>
                {userSettings.firstName
                  ? `${userSettings.firstName} ${userSettings.lastName || ''}`
                  : userSettings.email || 'User'}
              </Text>
              <Text style={styles.userEmail}>{userSettings.email}</Text>
            </View>
          </View>

          {renderNavigationItem(
            'person-outline',
            'Edit Profile',
            () => Alert.alert('Coming Soon', 'This feature will be available in a future update')
          )}
          
          {renderNavigationItem(
            'lock-closed-outline',
            'Change Password',
            () => Alert.alert('Coming Soon', 'This feature will be available in a future update')
          )}
        </Card>

        <Card variant="elevated" style={styles.section}>
          <Text style={styles.sectionTitle}>Notifications</Text>
          
          {renderSettingSwitch(
            'Push Notifications',
            'Receive alerts and reminders on your device',
            notifications,
            handleNotificationsChange
          )}
          
          {renderSettingSwitch(
            'Email Notifications',
            'Receive weekly reports and summaries',
            emailNotifications,
            setEmailNotifications
          )}
          
          {renderSettingSwitch(
            'Glucose Reminders',
            'Get reminded to check your glucose',
            glucoseReminders,
            setGlucoseReminders
          )}
        </Card>

        <Card variant="elevated" style={styles.section}>
          <Text style={styles.sectionTitle}>Preferences</Text>
          
          {renderSettingSwitch(
            'Dark Mode',
            'Use dark theme throughout the app',
            darkMode,
            handleDarkModeChange
          )}
          
          {renderNavigationItem(
            'color-palette-outline',
            'Glucose Units',
            () => Alert.alert(
              'Select Unit',
              'Choose your preferred glucose unit',
              [
                {
                  text: 'mg/dL',
                  onPress: () => handleUnitsChange('mg/dL'),
                },
                {
                  text: 'mmol/L',
                  onPress: () => handleUnitsChange('mmol/L'),
                },
                {
                  text: 'Cancel',
                  style: 'cancel',
                },
              ]
            )
          )}
          
          {renderNavigationItem(
            'options-outline',
            'Target Range',
            () => Alert.alert('Coming Soon', 'This feature will be available in a future update')
          )}
        </Card>

        <Card variant="elevated" style={styles.section}>
          <Text style={styles.sectionTitle}>Data & Privacy</Text>
          
          {renderNavigationItem(
            'analytics-outline',
            'Export Data',
            () => Alert.alert('Coming Soon', 'This feature will be available in a future update')
          )}
          
          {renderNavigationItem(
            'shield-outline',
            'Privacy Policy',
            () => openUrl('https://sugari.com/privacy')
          )}
          
          {renderNavigationItem(
            'document-text-outline',
            'Terms of Service',
            () => openUrl('https://sugari.com/terms')
          )}
        </Card>

        <Card variant="elevated" style={styles.section}>
          <Text style={styles.sectionTitle}>Support</Text>
          
          {renderNavigationItem(
            'help-circle-outline',
            'Help Center',
            () => openUrl('https://sugari.com/help')
          )}
          
          {renderNavigationItem(
            'mail-outline',
            'Contact Support',
            handleSupportRequest
          )}
          
          {renderNavigationItem(
            'information-circle-outline',
            'About Sugari',
            () => Alert.alert(
              `About ${APP_NAME}`,
              `${APP_NAME} v1.0.0\n\nA personalized digital health assistant for diabetes management. Track your glucose, receive insights, and improve your health.`,
              [{ text: 'OK' }]
            )
          )}
        </Card>

        {renderDangerZone()}

        <Text style={styles.versionText}>Version 1.0.0</Text>
      </ScrollView>
    </Container>
  );
};

const styles = StyleSheet.create({
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: COLORS.text,
    marginBottom: SIZES.md,
  },
  section: {
    marginBottom: SIZES.lg,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: COLORS.text,
    marginBottom: SIZES.md,
  },
  userInfoContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: SIZES.md,
    paddingBottom: SIZES.md,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  avatarContainer: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: COLORS.primary,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: SIZES.md,
  },
  avatarText: {
    color: 'white',
    fontSize: 24,
    fontWeight: 'bold',
  },
  userInfo: {
    flex: 1,
  },
  userName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: COLORS.text,
    marginBottom: 4,
  },
  userEmail: {
    fontSize: 14,
    color: COLORS.lightText,
  },
  settingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: SIZES.sm,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  settingInfo: {
    flex: 1,
    paddingRight: SIZES.md,
  },
  settingTitle: {
    fontSize: 16,
    color: COLORS.text,
    marginBottom: 2,
  },
  settingDescription: {
    fontSize: 12,
    color: COLORS.lightText,
  },
  navigationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: SIZES.md,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  navigationIconContainer: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: COLORS.primary + '10',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: SIZES.md,
  },
  navigationTitle: {
    flex: 1,
    fontSize: 16,
    color: COLORS.text,
  },
  logoutButton: {
    marginVertical: SIZES.lg,
  },
  versionText: {
    textAlign: 'center',
    fontSize: 12,
    color: COLORS.lightText,
    marginBottom: SIZES.xl,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  errorText: {
    fontSize: 16,
    textAlign: 'center',
  },
  dangerCard: {
    marginTop: SIZES.lg,
    backgroundColor: '#FFF5F5',
    borderWidth: 1,
    borderColor: '#FFCCCC',
  },
  dangerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: COLORS.danger,
    marginBottom: SIZES.md,
  },
  dangerButton: {
    borderWidth: 1,
    borderColor: COLORS.danger,
    borderRadius: SIZES.xs,
    padding: SIZES.md,
    marginBottom: SIZES.sm,
  },
  dangerButtonText: {
    color: COLORS.danger,
    fontWeight: 'bold',
    fontSize: 16,
    marginBottom: 4,
  },
  dangerButtonSubtext: {
    color: COLORS.lightText,
    fontSize: 12,
  },
});

export default SettingsScreen; 