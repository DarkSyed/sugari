import React, { useState, useEffect } from "react";
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
  ActivityIndicator,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";
import { StackNavigationProp } from "@react-navigation/stack";
import { COLORS, SIZES, APP_NAME, APP_VERSION, ROUTES } from "../../constants";
import { useApp } from "../../contexts/AppContext";
import Container from "../../components/Container";
import Card from "../../components/Card";
import Button from "../../components/Button";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { UserSettings } from "../../types";
import {
  getBloodSugarReadings,
  getUserSettings,
  resetDatabase,
} from "../../services/database";
import * as Notifications from "expo-notifications";
import FeatureRequestModal from "../../components/FeatureRequestModal";

// Configure notification behavior
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

const SettingsScreen: React.FC = () => {
  const { userSettings, updateSettings, isLoading, theme } = useApp();
  const navigation = useNavigation<StackNavigationProp<any>>();
  const insets = useSafeAreaInsets();

  // State for various settings
  const [pushNotifications, setPushNotifications] = useState(false);
  const [emailNotifications, setEmailNotifications] = useState(true);
  const [glucoseReminders, setGlucoseReminders] = useState(true);
  const [darkMode, setDarkMode] = useState(false);
  const [glucoseUnit, setGlucoseUnit] = useState("mg/dL"); // or 'mmol/L'
  const [targetRangeMin, setTargetRangeMin] = useState(70);
  const [targetRangeMax, setTargetRangeMax] = useState(180);
  const [email, setEmail] = useState("");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [diabetesType, setDiabetesType] = useState("type1");
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [notifications, setNotifications] = useState(true);
  const [localSettings, setLocalSettings] =
    useState<Partial<UserSettings> | null>(null);
  const [notificationPermission, setNotificationPermission] = useState<
    boolean | null
  >(null);
  const [showFeatureRequestModal, setShowFeatureRequestModal] = useState(false);

  // Update local state when settings change
  useEffect(() => {
    if (userSettings) {
      setEmail(userSettings.email || "");
      setFirstName(userSettings.firstName || "");
      setLastName(userSettings.lastName || "");
      setDiabetesType(userSettings.diabetesType || "type1");
      setNotifications(userSettings.notifications);
      setDarkMode(userSettings.darkMode);
      setGlucoseUnit(userSettings.units || "mg/dL");
    }

    // Check notification permissions
    checkNotificationPermissions();
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
        units: userSettings.units || "mg/dL",
      });
    }
  }, [userSettings, isEditingProfile]);

  const checkNotificationPermissions = async () => {
    try {
      const { status } = await Notifications.getPermissionsAsync();
      setNotificationPermission(status === "granted");
    } catch (error) {
      console.error("Error checking notification permissions:", error);
      setNotificationPermission(false);
    }
  };

  const requestNotificationPermissions = async () => {
    try {
      const { status } = await Notifications.requestPermissionsAsync();
      setNotificationPermission(status === "granted");
      return status === "granted";
    } catch (error) {
      console.error("Error requesting notification permissions:", error);
      return false;
    }
  };

  const scheduleTestNotification = async () => {
    try {
      await Notifications.scheduleNotificationAsync({
        content: {
          title: "Sugari Reminder",
          body: "It's time to check your blood sugar!",
          data: { type: "blood_sugar_check" },
        },
        trigger: { seconds: 5 }, // For testing, send in 5 seconds
      });

      Alert.alert(
        "Notification Scheduled",
        "You will receive a test notification in 5 seconds",
      );
    } catch (error) {
      console.error("Error scheduling notification:", error);
      Alert.alert("Error", "Failed to schedule notification");
    }
  };

  const handleLogout = async () => {
    Alert.alert("Logout", "Are you sure you want to log out?", [
      {
        text: "Cancel",
        style: "cancel",
      },
      {
        text: "Logout",
        style: "destructive",
        onPress: async () => {
          try {
            // Your logout logic here
            Alert.alert("Logged Out", "You have been successfully logged out.");
          } catch (error) {
            console.error("Error during logout:", error);
            Alert.alert("Error", "An error occurred during logout");
          }
        },
      },
    ]);
  };

  const handleResetDatabase = () => {
    Alert.alert(
      "Reset Database",
      "This will delete all your health data. This action cannot be undone. Are you sure?",
      [
        {
          text: "Cancel",
          style: "cancel",
        },
        {
          text: "Reset",
          style: "destructive",
          onPress: async () => {
            try {
              const result = await resetDatabase();
              if (result.success) {
                Alert.alert("Success", result.message);
              } else {
                Alert.alert("Error", result.message);
              }
            } catch (error) {
              console.error("Error resetting database:", error);
              Alert.alert("Error", "Failed to reset database");
            }
          },
        },
      ],
    );
  };

  const handleNotificationsChange = async (value: boolean) => {
    if (value && !notificationPermission) {
      const permissionGranted = await requestNotificationPermissions();
      if (!permissionGranted) {
        return;
      }
    }
    setNotifications(value);
    if (userSettings) {
      updateSettings({ notifications: value });
    }
  };

  const handleDarkModeChange = (value: boolean) => {
    setDarkMode(value);
    if (userSettings) {
      updateSettings({ darkMode: value });
    }
  };

  const handleUnitsChange = (units: string) => {
    setGlucoseUnit(units);
    if (userSettings) {
      updateSettings({ units });
    }
  };

  const handleEditProfile = () => {
    navigation.navigate(ROUTES.PROFILE);
  };

  const openUrl = async (url: string) => {
    try {
      const supported = await Linking.canOpenURL(url);
      if (supported) {
        await Linking.openURL(url);
      } else {
        Alert.alert("Error", `Cannot open URL: ${url}`);
      }
    } catch (error) {
      console.error("Error opening URL:", error);
      Alert.alert("Error", "An error occurred while trying to open the URL");
    }
  };

  const openRemindersScreen = () => {
    navigation.navigate(ROUTES.REMINDERS);
  };

  const openReportScreen = () => {
    navigation.navigate(ROUTES.REPORT);
  };

  const openFeatureRequestsScreen = () => {
    navigation.navigate(ROUTES.FEATURE_REQUESTS);
  };

  const handleFeatureRequest = (title: string, description: string) => {
    setShowFeatureRequestModal(false);
    Alert.alert(
      "Thank You!",
      "Your feature request has been submitted successfully.",
    );
  };

  const handlePushNotificationsToggle = async (value: boolean) => {
    if (value) {
      // Request permission if turning on
      const { status } = await Notifications.requestPermissionsAsync();
      if (status !== "granted") {
        Alert.alert(
          "Permission Required",
          "Please enable notifications in your device settings to receive alerts.",
          [
            { text: "Cancel", style: "cancel" },
            { text: "Settings", onPress: () => Linking.openSettings() },
          ],
        );
        return;
      }
      setNotificationPermission(true);
    }

    // Update settings
    await updateSettings({ notifications: value });
  };

  const handleEmailNotificationsToggle = (value: boolean) => {
    setEmailNotifications(value);
    // Save to settings if needed
  };

  const handleGlucoseRemindersToggle = (value: boolean) => {
    setGlucoseReminders(value);
    // Save to settings if needed
  };

  const handleDarkModeToggle = (value: boolean) => {
    setDarkMode(value);
    if (userSettings) {
      updateSettings({ darkMode: value });
    }
  };

  const handleChangePassword = () => {
    Alert.alert(
      "Coming Soon",
      "This feature will be available in a future update",
    );
  };

  const renderSectionTitle = (title: string) => (
    <Text style={styles.sectionTitle}>{title}</Text>
  );

  const renderSwitchItem = (
    title: string,
    description: string,
    value: boolean,
    onToggle: (value: boolean) => void,
  ) => (
    <View style={styles.settingRow}>
      <View style={styles.settingTextContainer}>
        <Text style={styles.settingTitle}>{title}</Text>
        <Text style={styles.settingDescription}>{description}</Text>
      </View>
      <Switch
        value={value}
        onValueChange={onToggle}
        trackColor={{ false: "#767577", true: "#81b0ff" }}
        thumbColor={value ? COLORS.primary : "#f4f3f4"}
        ios_backgroundColor="#3e3e3e"
      />
    </View>
  );

  const renderNavigationItem = (
    iconName: string,
    title: string,
    onPress: () => void,
  ) => (
    <TouchableOpacity style={styles.navigationItem} onPress={onPress}>
      <View style={styles.navigationIcon}>
        <Ionicons name={iconName} size={24} color="#8e8e93" />
      </View>
      <Text style={styles.navigationTitle}>{title}</Text>
      <Ionicons name="chevron-forward" size={20} color="#c7c7cc" />
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

      <TouchableOpacity style={styles.dangerButton} onPress={handleLogout}>
        <Text style={styles.dangerButtonText}>Logout</Text>
      </TouchableOpacity>
    </Card>
  );

  if (isLoading) {
    return (
      <Container>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={COLORS.primary} />
          <Text>Loading settings...</Text>
        </View>
      </Container>
    );
  }

  return (
    <Container>
      <Text style={styles.screenTitle}>Settings</Text>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={{ paddingBottom: insets.bottom + 20 }}
      >
        {/* Account Section */}
        <View style={styles.section}>
          {renderSectionTitle("Account")}

          <View style={styles.accountHeader}>
            <View style={styles.avatarContainer}>
              <Text style={styles.avatarText}>
                {userSettings?.firstName
                  ? userSettings.firstName.charAt(0)
                  : "R"}
              </Text>
            </View>
            <View style={styles.accountInfo}>
              <Text style={styles.accountName}>
                {userSettings?.firstName || "Ryan"}{" "}
                {userSettings?.lastName || "Syed"}
              </Text>
              <Text style={styles.accountEmail}>
                {userSettings?.email || "javasuck606@gmail.com"}
              </Text>
            </View>
          </View>

          {renderNavigationItem(
            "person-outline",
            "Edit Profile",
            handleEditProfile,
          )}
          {renderNavigationItem(
            "lock-closed-outline",
            "Change Password",
            handleChangePassword,
          )}
        </View>

        {/* Notifications Section */}
        <View style={styles.section}>
          {renderSectionTitle("Notifications")}

          {renderSwitchItem(
            "Push Notifications",
            "Receive alerts and reminders on your device",
            pushNotifications,
            handlePushNotificationsToggle,
          )}

          {renderSwitchItem(
            "Email Notifications",
            "Receive weekly reports and summaries",
            emailNotifications,
            handleEmailNotificationsToggle,
          )}

          {renderSwitchItem(
            "Glucose Reminders",
            "Get reminded to check your glucose",
            glucoseReminders,
            handleGlucoseRemindersToggle,
          )}
        </View>

        {/* Preferences Section */}
        <View style={styles.section}>
          {renderSectionTitle("Preferences")}

          {renderSwitchItem(
            "Dark Mode",
            "Use dark theme throughout the app",
            darkMode,
            handleDarkModeToggle,
          )}

          {renderNavigationItem("color-palette-outline", "Glucose Units", () =>
            Alert.alert("Select Unit", "Choose your preferred glucose unit", [
              {
                text: "mg/dL",
                onPress: () => handleUnitsChange("mg/dL"),
              },
              {
                text: "mmol/L",
                onPress: () => handleUnitsChange("mmol/L"),
              },
              {
                text: "Cancel",
                style: "cancel",
              },
            ]),
          )}

          {renderNavigationItem("options-outline", "Target Range", () =>
            Alert.alert(
              "Coming Soon",
              "This feature will be available in a future update",
            ),
          )}
        </View>

        <Card variant="elevated" style={styles.section}>
          <Text style={styles.sectionTitle}>Data & Privacy</Text>

          {renderNavigationItem(
            "analytics-outline",
            "Export Data",
            openReportScreen,
          )}

          {renderNavigationItem("shield-outline", "Privacy Policy", () =>
            openUrl("https://sugari.com/privacy"),
          )}
        </Card>

        <Card variant="elevated" style={styles.section}>
          <Text style={styles.sectionTitle}>Features</Text>

          {renderNavigationItem(
            "notifications-outline",
            "Reminders",
            openRemindersScreen,
          )}

          {renderNavigationItem(
            "document-text-outline",
            "Reports",
            openReportScreen,
          )}

          {renderNavigationItem(
            "bulb-outline",
            "Feature Requests",
            openFeatureRequestsScreen,
          )}

          {renderNavigationItem("star-outline", "Rate the App", () =>
            openUrl(
              "https://play.google.com/store/apps/details?id=com.sugari.app",
            ),
          )}
        </Card>

        <Card variant="elevated" style={styles.section}>
          <Text style={styles.sectionTitle}>Support</Text>

          {renderNavigationItem("help-circle-outline", "Help & FAQ", () =>
            openUrl("https://sugari.com/help"),
          )}

          {renderNavigationItem("mail-outline", "Contact Support", () =>
            openUrl("mailto:support@sugari.com"),
          )}
        </Card>

        {renderDangerZone()}

        <Text style={styles.versionText}>
          {APP_NAME} v{APP_VERSION}
        </Text>
      </ScrollView>

      <FeatureRequestModal
        visible={showFeatureRequestModal}
        onClose={() => setShowFeatureRequestModal(false)}
        onSubmit={handleFeatureRequest}
      />
    </Container>
  );
};

const styles = StyleSheet.create({
  screenTitle: {
    fontSize: 32,
    fontWeight: "bold",
    marginBottom: 20,
    marginTop: 10,
    marginLeft: 20,
  },
  scrollView: {
    flex: 1,
  },
  section: {
    marginBottom: 20,
    backgroundColor: "white",
    borderRadius: 10,
    overflow: "hidden",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 5,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: "bold",
    marginVertical: 15,
    marginHorizontal: 16,
  },
  accountHeader: {
    flexDirection: "row",
    alignItems: "center",
    padding: 16,
    borderBottomWidth: 0.5,
    borderBottomColor: "#E0E0E0",
  },
  avatarContainer: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: "#4285F4",
    justifyContent: "center",
    alignItems: "center",
  },
  avatarText: {
    fontSize: 24,
    fontWeight: "bold",
    color: "white",
  },
  accountInfo: {
    marginLeft: 15,
  },
  accountName: {
    fontSize: 18,
    fontWeight: "600",
    marginBottom: 4,
  },
  accountEmail: {
    fontSize: 14,
    color: "#8e8e93",
  },
  navigationItem: {
    flexDirection: "row",
    alignItems: "center",
    padding: 16,
    borderBottomWidth: 0.5,
    borderBottomColor: "#E0E0E0",
  },
  navigationIcon: {
    width: 30,
    marginRight: 10,
  },
  navigationTitle: {
    flex: 1,
    fontSize: 16,
  },
  settingRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: 16,
    borderBottomWidth: 0.5,
    borderBottomColor: "#E0E0E0",
  },
  settingTextContainer: {
    flex: 1,
    marginRight: 10,
  },
  settingTitle: {
    fontSize: 16,
    marginBottom: 4,
  },
  settingDescription: {
    fontSize: 14,
    color: "#8e8e93",
  },
  logoutButton: {
    marginVertical: SIZES.lg,
  },
  versionText: {
    textAlign: "center",
    fontSize: 12,
    color: COLORS.lightText,
    marginBottom: SIZES.xl,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  errorContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  errorText: {
    fontSize: 16,
    textAlign: "center",
  },
  dangerCard: {
    marginTop: SIZES.lg,
    backgroundColor: "#FFF5F5",
    borderWidth: 1,
    borderColor: "#FFCCCC",
  },
  dangerTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: COLORS.danger,
    marginBottom: SIZES.md,
    paddingHorizontal: SIZES.md,
    paddingTop: SIZES.md,
  },
  dangerButton: {
    borderWidth: 1,
    borderColor: COLORS.danger,
    borderRadius: SIZES.xs,
    padding: SIZES.md,
    marginBottom: SIZES.sm,
    marginHorizontal: SIZES.md,
  },
  dangerButtonText: {
    color: COLORS.danger,
    fontWeight: "bold",
    fontSize: 16,
    marginBottom: 4,
  },
  dangerButtonSubtext: {
    color: COLORS.lightText,
    fontSize: 12,
  },
  logoutButtonText: {
    color: COLORS.danger,
    fontSize: 16,
    fontWeight: "bold",
    textAlign: "center",
  },
});

export default SettingsScreen;
