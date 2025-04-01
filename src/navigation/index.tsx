import React, { useEffect, useState } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';
import { ROUTES, COLORS } from '../constants';
import { useApp } from '../contexts/AppContext';

// Splash Screen
import SplashScreen from '../screens/SplashScreen';

// Main Screens
import DashboardScreen from '../screens/main/DashboardScreen';
import AddSugarScreen from '../screens/main/AddSugarScreen';
import AddGlucoseScreen from '../screens/main/AddGlucoseScreen';
import AddFoodScreen from '../screens/main/AddFoodScreen';
import AddInsulinScreen from '../screens/main/AddInsulinScreen';
import ProfileScreen from '../screens/main/ProfileScreen';
import SugarLogScreen from '../screens/main/SugarLogScreen';
import MedicationScreen from '../screens/main/MedicationScreen';
import AnalyticsScreen from '../screens/main/AnalyticsScreen';
import SettingsScreen from '../screens/main/SettingsScreen';
import AddA1CScreen from '../screens/main/AddA1CScreen';
import AddWeightScreen from '../screens/main/AddWeightScreen';
import AddBloodPressureScreen from '../screens/main/AddBloodPressureScreen';
import BloodPressureLogScreen from '../screens/main/BloodPressureLogScreen';

// Create navigators
const Stack = createNativeStackNavigator();
const Tab = createBottomTabNavigator();

// Dashboard navigator
const DashboardStack = () => {
  return (
    <Stack.Navigator
      initialRouteName={ROUTES.DASHBOARD}
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: 'white' },
      }}
    >
      <Stack.Screen name={ROUTES.DASHBOARD} component={DashboardScreen} />
      <Stack.Screen name={ROUTES.PROFILE} component={ProfileScreen} />
      <Stack.Screen name={ROUTES.GLUCOSE_LOG} component={SugarLogScreen} />
    </Stack.Navigator>
  );
};

// SugarLog navigator
const SugarLogStack = () => {
  return (
    <Stack.Navigator
      initialRouteName={ROUTES.SUGAR_LOG}
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: 'white' },
      }}
    >
      <Stack.Screen name={ROUTES.SUGAR_LOG} component={SugarLogScreen} />
      <Stack.Screen name={ROUTES.ADD_GLUCOSE} component={AddGlucoseScreen} />
      <Stack.Screen name={ROUTES.ADD_FOOD} component={AddFoodScreen} />
      <Stack.Screen name={ROUTES.ADD_INSULIN} component={AddInsulinScreen} />
      <Stack.Screen name={ROUTES.ADD_A1C} component={AddA1CScreen} />
      <Stack.Screen name={ROUTES.ADD_WEIGHT} component={AddWeightScreen} />
      <Stack.Screen name={ROUTES.ADD_BP} component={AddBloodPressureScreen} />
      <Stack.Screen name={ROUTES.BP_LOG} component={BloodPressureLogScreen} />
    </Stack.Navigator>
  );
};

// Medication navigator
const MedicationStack = () => {
  return (
    <Stack.Navigator
      initialRouteName={ROUTES.MEDICATION}
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: 'white' },
      }}
    >
      <Stack.Screen name={ROUTES.MEDICATION} component={MedicationScreen} />
      <Stack.Screen name={ROUTES.ADD_INSULIN} component={AddInsulinScreen} />
    </Stack.Navigator>
  );
};

// Main Tab Navigator
const TabNavigator = () => {
  return (
    <Tab.Navigator
      initialRouteName={ROUTES.HOME}
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarIcon: ({ focused, color, size }) => {
          let iconName;

          if (route.name === ROUTES.HOME) {
            iconName = focused ? 'home' : 'home-outline';
          } else if (route.name === ROUTES.SUGAR_LOG) {
            iconName = focused ? 'analytics' : 'analytics-outline';
          } else if (route.name === ROUTES.MEDICATION) {
            iconName = focused ? 'medkit' : 'medkit-outline';
          } else if (route.name === ROUTES.ANALYTICS) {
            iconName = focused ? 'bar-chart' : 'bar-chart-outline';
          } else if (route.name === ROUTES.SETTINGS) {
            iconName = focused ? 'settings' : 'settings-outline';
          }

          return <Ionicons name={iconName as any} size={size} color={color} />;
        },
        tabBarActiveTintColor: COLORS.primary,
        tabBarInactiveTintColor: COLORS.lightText,
        tabBarStyle: {
          borderTopWidth: 1,
          borderTopColor: COLORS.border,
          paddingBottom: 5,
          paddingTop: 5,
          height: 60,
        },
        tabBarLabelStyle: {
          fontSize: 12,
          paddingBottom: 4,
        },
      })}
    >
      <Tab.Screen
        name={ROUTES.HOME}
        component={DashboardStack}
        options={{
          tabBarLabel: 'Home',
        }}
      />
      <Tab.Screen
        name={ROUTES.SUGAR_LOG}
        component={SugarLogStack}
        options={{
          tabBarLabel: 'Sugar',
        }}
      />
      <Tab.Screen
        name={ROUTES.MEDICATION}
        component={MedicationStack}
        options={{
          tabBarLabel: 'Medication',
        }}
      />
      <Tab.Screen
        name={ROUTES.ANALYTICS}
        component={AnalyticsScreen}
        options={{
          tabBarLabel: 'Analytics',
        }}
      />
      <Tab.Screen
        name={ROUTES.SETTINGS}
        component={SettingsScreen}
        options={{
          tabBarLabel: 'Settings',
        }}
      />
    </Tab.Navigator>
  );
};

// Root Navigator
const AppNavigator = () => {
  const { isLoading } = useApp();
  const [showSplash, setShowSplash] = useState(true);

  useEffect(() => {
    // Show splash screen only for the minimum time needed
    const timer = setTimeout(() => {
      setShowSplash(false);
    }, 500); // Reduced from 2000ms to 500ms

    return () => clearTimeout(timer);
  }, []);

  if (showSplash || isLoading) {
    return <SplashScreen />;
  }

  return (
    <NavigationContainer>
      <TabNavigator />
    </NavigationContainer>
  );
};

export default AppNavigator; 