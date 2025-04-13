import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  Alert, 
  TouchableOpacity, 
  Keyboard,
  Platform,
  Linking,
  TextInput,
  SafeAreaView
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, SIZES } from '../../constants';
import { useApp } from '../../contexts/AppContext';
import Card from '../../components/Card';
import Button from '../../components/Button';
import { KeyboardAwareScrollView } from 'react-native-keyboard-aware-scroll-view';

// Using KeyboardAwareScrollView instead of KeyboardAvoidingView + ScrollView
// This is a more reliable approach for handling keyboards

const ProfileScreen: React.FC = () => {
  const { userSettings, updateSettings } = useApp();
  const navigation = useNavigation<StackNavigationProp<any>>();

  const [isEditing, setIsEditing] = useState(false);
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [diabetesType, setDiabetesType] = useState<string>('');
  const [isSaving, setIsSaving] = useState(false);
  const [emailError, setEmailError] = useState<string | null>(null);

  // Load user data when component mounts or userSettings changes
  useEffect(() => {
    if (userSettings) {
      setFirstName(userSettings.firstName || '');
      setLastName(userSettings.lastName || '');
      setEmail(userSettings.email || '');
      setDiabetesType(userSettings.diabetesType || '');
    }
  }, [userSettings]);

  // Comprehensive email validation
  const validateEmail = (emailToCheck: string): boolean => {
    if (!emailToCheck) return false;
    
    // Basic regex email validation
    const emailRegex = /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i;
    if (!emailRegex.test(emailToCheck)) {
      setEmailError('Please enter a valid email address');
      return false;
    }
    
    // Check for common domains to ensure it's likely a real email
    const domain = emailToCheck.split('@')[1].toLowerCase();
    const commonDomains = [
      'gmail.com', 'yahoo.com', 'hotmail.com', 'outlook.com', 'icloud.com', 
      'aol.com', 'protonmail.com', 'mail.com', 'zoho.com', 'yandex.com', 
      'gmx.com', 'live.com', 'me.com', 'mac.com'
    ];
    
    // Also accept educational and organizational domains
    if (!commonDomains.includes(domain) && 
        !domain.endsWith('.edu') && 
        !domain.endsWith('.org') && 
        !domain.endsWith('.gov') && 
        !domain.endsWith('.net') && 
        !domain.endsWith('.io') && 
        !domain.endsWith('.co')) {
      
      // Ask for confirmation if domain seems uncommon
      setEmailError('This email domain appears uncommon. Please ensure it is correct.');
      return false;
    }
    
    setEmailError(null);
    return true;
  };

  const handleSaveProfile = async () => {
    Keyboard.dismiss();
    
    // Validate email if provided
    if (email && !validateEmail(email)) {
      Alert.alert('Invalid Email', 'Please enter a valid email address for PDF exports');
      return;
    }
    
    try {
      setIsSaving(true);
      
      await updateSettings({
        firstName,
        lastName,
        email,
        diabetesType
      });
      
      setIsEditing(false);
      Alert.alert('Success', 'Profile updated successfully');
    } catch (error) {
      console.error('Error updating profile:', error);
      Alert.alert('Error', 'Failed to update profile');
    } finally {
      setIsSaving(false);
    }
  };

  const handleCancelEdit = () => {
    Keyboard.dismiss();
    // Reset to original values
    if (userSettings) {
      setFirstName(userSettings.firstName || '');
      setLastName(userSettings.lastName || '');
      setEmail(userSettings.email || '');
      setDiabetesType(userSettings.diabetesType || '');
    }
    setIsEditing(false);
    setEmailError(null);
  };

  const handleSendTestEmail = () => {
    if (!email) {
      Alert.alert('No Email', 'Please enter an email address first');
      return;
    }
    
    if (!validateEmail(email)) {
      Alert.alert('Invalid Email', 'Please enter a valid email address');
      return;
    }
    
    // Compose an email using the device's email client
    const subject = 'Sugari Test Email';
    const body = `Hello ${firstName || 'there'},\n\nThis is a test email from Sugari. If you're receiving this, your email is correctly set up for PDF exports.\n\nThank you for using Sugari!\n\nThe Sugari Team`;
    
    const mailtoUrl = `mailto:${email}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
    
    Linking.canOpenURL(mailtoUrl)
      .then(supported => {
        if (supported) {
          return Linking.openURL(mailtoUrl);
        } else {
          Alert.alert('Error', 'Could not open email client');
        }
      })
      .catch(error => {
        console.error('Error opening email client:', error);
        Alert.alert('Error', 'Could not open email client');
      });
  };

  const handleExportData = () => {
    Alert.alert(
      'Export Health Data',
      'Export your health data as a PDF report or CSV file for your records or to share with your healthcare provider.',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Export PDF', 
          onPress: () => Alert.alert(
            'Coming Soon', 
            'PDF export functionality will be available in a future update.'
          )
        },
        { 
          text: 'Export CSV', 
          onPress: () => Alert.alert(
            'Coming Soon', 
            'CSV export functionality will be available in a future update.'
          )
        }
      ]
    );
  };

  const renderProfileInfo = () => {
    return (
      <Card variant="elevated" style={styles.section}>
        <Text style={styles.sectionTitle}>Personal Information</Text>
        <View style={styles.infoRow}>
          <Text style={styles.infoLabel}>Email</Text>
          <Text style={styles.infoValue}>{userSettings?.email || 'Not set'}</Text>
        </View>
        <View style={styles.infoRow}>
          <Text style={styles.infoLabel}>First Name</Text>
          <Text style={styles.infoValue}>{userSettings?.firstName || 'Not set'}</Text>
        </View>
        <View style={styles.infoRow}>
          <Text style={styles.infoLabel}>Last Name</Text>
          <Text style={styles.infoValue}>{userSettings?.lastName || 'Not set'}</Text>
        </View>
        <View style={styles.infoRow}>
          <Text style={styles.infoLabel}>Diabetes Type</Text>
          <Text style={styles.infoValue}>{userSettings?.diabetesType || 'Not set'}</Text>
        </View>
        
        <View style={styles.buttonRow}>
          <Button
            title="Edit Profile"
            variant="outline"
            style={styles.actionButton}
            onPress={() => setIsEditing(true)}
          />
          
          {userSettings?.email && (
            <Button
              title="Test Email"
              variant="outline"
              style={styles.actionButton}
              onPress={handleSendTestEmail}
            />
          )}
        </View>
      </Card>
    );
  };

  const renderProfileEdit = () => {
    return (
      <Card variant="elevated" style={styles.section}>
        <Text style={styles.sectionTitle}>Edit Profile</Text>
        
        {/* Email input */}
        <View style={styles.inputContainer}>
          <Text style={styles.inputLabel}>Email (for PDF export)</Text>
          <TextInput
            style={[styles.textInput, emailError ? styles.inputError : null]}
            value={email}
            onChangeText={(text) => {
              setEmail(text);
              if (text) validateEmail(text);
              else setEmailError(null);
            }}
            keyboardType="email-address"
            autoCapitalize="none"
            returnKeyType="done"
            onSubmitEditing={() => Keyboard.dismiss()}
            placeholder="Enter your email"
          />
          {emailError ? <Text style={styles.errorText}>{emailError}</Text> : null}
        </View>
        
        {/* First Name input */}
        <View style={styles.inputContainer}>
          <Text style={styles.inputLabel}>First Name</Text>
          <TextInput
            style={styles.textInput}
            value={firstName}
            onChangeText={setFirstName}
            returnKeyType="done"
            onSubmitEditing={() => Keyboard.dismiss()}
            placeholder="Enter your first name"
          />
        </View>
        
        {/* Last Name input */}
        <View style={styles.inputContainer}>
          <Text style={styles.inputLabel}>Last Name</Text>
          <TextInput
            style={styles.textInput}
            value={lastName}
            onChangeText={setLastName}
            returnKeyType="done"
            onSubmitEditing={() => Keyboard.dismiss()}
            placeholder="Enter your last name"
          />
        </View>
        
        {/* Diabetes Type input */}
        <View style={styles.inputContainer}>
          <Text style={styles.inputLabel}>Diabetes Type</Text>
          <TextInput
            style={styles.textInput}
            value={diabetesType}
            onChangeText={setDiabetesType}
            returnKeyType="done"
            onSubmitEditing={() => Keyboard.dismiss()}
            placeholder="Type 1, Type 2, etc."
          />
        </View>
        
        <View style={styles.buttonRow}>
          <Button
            title="Cancel"
            variant="outline"
            style={[styles.actionButton, styles.cancelButton]}
            onPress={handleCancelEdit}
            disabled={isSaving}
          />
          <Button
            title="Save"
            style={styles.actionButton}
            onPress={handleSaveProfile}
            loading={isSaving}
            disabled={isSaving}
          />
        </View>
      </Card>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAwareScrollView 
        style={styles.keyboardScrollView}
        contentContainerStyle={styles.scrollViewContent}
        keyboardShouldPersistTaps="handled"
        enableOnAndroid={true}
        enableResetScrollToCoords={false}
        extraScrollHeight={Platform.OS === 'ios' ? 20 : 0}
      >
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Ionicons name="arrow-back" size={24} color={COLORS.text} />
        </TouchableOpacity>
        <Text style={styles.title}>Profile</Text>
        <View style={styles.placeholder} />
      </View>

        <View style={styles.profileHeader}>
          <View style={styles.avatarContainer}>
            <Text style={styles.avatarText}>
              {userSettings?.firstName?.[0] || userSettings?.email?.[0] || 'U'}
            </Text>
          </View>
          <Text style={styles.userName}>
            {userSettings?.firstName
              ? `${userSettings.firstName} ${userSettings.lastName || ''}`
              : userSettings?.email || 'User'}
          </Text>
          <Text style={styles.userEmail}>{userSettings?.email}</Text>
        </View>

        {isEditing ? renderProfileEdit() : renderProfileInfo()}

        <Card variant="elevated" style={styles.section}>
          <Text style={styles.sectionTitle}>Account Settings</Text>
          <TouchableOpacity 
            style={styles.settingsRow}
            onPress={() => navigation.navigate('Settings')}
          >
            <Ionicons name="settings-outline" size={24} color={COLORS.text} />
            <Text style={styles.settingsText}>App Settings</Text>
            <Ionicons name="chevron-forward" size={20} color={COLORS.lightText} />
          </TouchableOpacity>
          <TouchableOpacity 
            style={styles.settingsRow}
            onPress={() => navigation.navigate('Settings')}
          >
            <Ionicons name="notifications-outline" size={24} color={COLORS.text} />
            <Text style={styles.settingsText}>Notifications</Text>
            <Ionicons name="chevron-forward" size={20} color={COLORS.lightText} />
          </TouchableOpacity>
          <TouchableOpacity 
            style={styles.settingsRow}
            onPress={handleExportData}
          >
            <Ionicons name="download-outline" size={24} color={COLORS.text} />
            <Text style={styles.settingsText}>Export Data</Text>
            <Ionicons name="chevron-forward" size={20} color={COLORS.lightText} />
          </TouchableOpacity>
          <TouchableOpacity 
            style={styles.settingsRow}
            onPress={() => Alert.alert('Coming Soon', 'This feature will be available in a future update')}
          >
            <Ionicons name="shield-outline" size={24} color={COLORS.text} />
            <Text style={styles.settingsText}>Privacy Settings</Text>
            <Ionicons name="chevron-forward" size={20} color={COLORS.lightText} />
          </TouchableOpacity>
        </Card>

        <Card variant="elevated" style={styles.section}>
          <Text style={styles.sectionTitle}>Support</Text>
          <TouchableOpacity 
            style={styles.settingsRow}
            onPress={() => Alert.alert('Help Center', 'Visit our website and please reach out to adil.a.syed01@gmail.com for any bugs, issues, help, or support!')}
          >
            <Ionicons name="help-circle-outline" size={24} color={COLORS.text} />
            <Text style={styles.settingsText}>Help Center</Text>
            <Ionicons name="chevron-forward" size={20} color={COLORS.lightText} />
          </TouchableOpacity>
          <TouchableOpacity 
            style={styles.settingsRow}
            onPress={() => Alert.alert('About Sugari', 'Version 1.0.0\n\nA diabetes management app to help you track your health metrics.')}
          >
            <Ionicons name="information-circle-outline" size={24} color={COLORS.text} />
            <Text style={styles.settingsText}>About Sugari</Text>
            <Ionicons name="chevron-forward" size={20} color={COLORS.lightText} />
          </TouchableOpacity>
        </Card>
      </KeyboardAwareScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  keyboardScrollView: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  scrollViewContent: {
    paddingHorizontal: SIZES.md,
    paddingTop: SIZES.md, 
    paddingBottom: SIZES.xxl, // Extra padding at bottom for keyboard
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: SIZES.lg,
  },
  backButton: {
    padding: SIZES.xs,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: COLORS.text,
  },
  placeholder: {
    width: 24,
  },
  profileHeader: {
    alignItems: 'center',
    marginBottom: SIZES.lg,
  },
  avatarContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: COLORS.primary,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: SIZES.md,
  },
  avatarText: {
    color: 'white',
    fontSize: 32,
    fontWeight: 'bold',
  },
  userName: {
    fontSize: 22,
    fontWeight: 'bold',
    color: COLORS.text,
    marginBottom: SIZES.xs,
  },
  userEmail: {
    fontSize: 14,
    color: COLORS.lightText,
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
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: SIZES.sm,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  infoLabel: {
    fontSize: 16,
    color: COLORS.lightText,
  },
  infoValue: {
    fontSize: 16,
    color: COLORS.text,
    fontWeight: '500',
  },
  editButton: {
    marginTop: SIZES.md,
  },
  settingsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: SIZES.md,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  settingsText: {
    flex: 1,
    fontSize: 16,
    color: COLORS.text,
    marginLeft: SIZES.md,
  },
  // Input styles for native TextInput
  inputContainer: {
    marginBottom: SIZES.md,
  },
  inputLabel: {
    fontSize: 16,
    fontWeight: '500',
    marginBottom: SIZES.xs,
    color: COLORS.text,
  },
  textInput: {
    height: 48,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 8,
    paddingHorizontal: 12,
    fontSize: 16,
    color: COLORS.text,
    backgroundColor: COLORS.inputBackground,
  },
  inputError: {
    borderColor: COLORS.error,
  },
  errorText: {
    color: COLORS.error,
    fontSize: 12,
    marginTop: 4,
  },
  buttonRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: SIZES.sm,
  },
  actionButton: {
    flex: 1,
    marginHorizontal: SIZES.xs,
  },
  cancelButton: {
    borderColor: COLORS.border,
  }
});

export default ProfileScreen; 