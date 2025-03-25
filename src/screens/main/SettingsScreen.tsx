import React, { useState } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  TouchableOpacity, 
  Switch, 
  Alert, 
  ScrollView, 
  Linking 
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { COLORS, SIZES, APP_NAME } from '../../constants';
import { useAuth } from '../../contexts/AuthContext';
import Container from '../../components/Container';
import Card from '../../components/Card';
import Button from '../../components/Button';

const SettingsScreen: React.FC = () => {
  const { authState, logout } = useAuth();
  const navigation = useNavigation<StackNavigationProp<any>>();
  
  // State for various settings
  const [pushNotifications, setPushNotifications] = useState(true);
  const [emailNotifications, setEmailNotifications] = useState(true);
  const [glucoseReminders, setGlucoseReminders] = useState(true);
  const [darkMode, setDarkMode] = useState(false);
  const [glucoseUnit, setGlucoseUnit] = useState('mg/dL'); // or 'mmol/L'
  const [targetRangeMin, setTargetRangeMin] = useState(70);
  const [targetRangeMax, setTargetRangeMax] = useState(180);

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
              const { error } = await logout();
              if (error) {
                Alert.alert('Logout Failed', error.message);
              }
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

  return (
    <Container>
      <ScrollView showsVerticalScrollIndicator={false}>
        <Text style={styles.title}>Settings</Text>

        <Card variant="elevated" style={styles.section}>
          <Text style={styles.sectionTitle}>Account</Text>
          
          <View style={styles.userInfoContainer}>
            <View style={styles.avatarContainer}>
              <Text style={styles.avatarText}>
                {authState.user?.firstName?.[0] || authState.user?.email?.[0] || 'U'}
              </Text>
            </View>
            <View style={styles.userInfo}>
              <Text style={styles.userName}>
                {authState.user?.firstName
                  ? `${authState.user.firstName} ${authState.user.lastName || ''}`
                  : authState.user?.email || 'User'}
              </Text>
              <Text style={styles.userEmail}>{authState.user?.email}</Text>
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
            pushNotifications,
            setPushNotifications
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
            (value) => {
              setDarkMode(value);
              Alert.alert('Coming Soon', 'This feature will be available in a future update');
            }
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
                  onPress: () => setGlucoseUnit('mg/dL'),
                },
                {
                  text: 'mmol/L',
                  onPress: () => setGlucoseUnit('mmol/L'),
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

        <Button
          title="Log Out"
          variant="outline"
          style={styles.logoutButton}
          onPress={handleLogout}
        />

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
});

export default SettingsScreen; 