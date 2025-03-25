import React, { useEffect, useState } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';
import { ROUTES, COLORS } from '../constants';
import { useAuth } from '../contexts/AuthContext';

// Auth Screens
import SplashScreen from '../screens/auth/SplashScreen';
import LoginScreen from '../screens/auth/LoginScreen';
import RegisterScreen from '../screens/auth/RegisterScreen';
import ForgotPasswordScreen from '../screens/auth/ForgotPasswordScreen';

// Main Screens
import DashboardScreen from '../screens/main/DashboardScreen';
import AddSugarScreen from '../screens/main/AddSugarScreen';
import AddGlucoseScreen from '../screens/main/AddGlucoseScreen';
import AddFoodScreen from '../screens/main/AddFoodScreen';
import AddInsulinScreen from '../screens/main/AddInsulinScreen';
import ProfileScreen from '../screens/main/ProfileScreen';
import SugarLogScreen from '../screens/main/SugarLogScreen';
import GlucoseLogScreen from '../screens/main/GlucoseLogScreen';
import AnalyticsScreen from '../screens/main/AnalyticsScreen';
import SettingsScreen from '../screens/main/SettingsScreen';

// Create navigators
const Stack = createNativeStackNavigator();
const Tab = createBottomTabNavigator();

// Auth navigator
const AuthNavigator = () => {
  return (
    <Stack.Navigator
      initialRouteName={ROUTES.LOGIN}
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: 'white' },
      }}
    >
      <Stack.Screen name={ROUTES.LOGIN} component={LoginScreen} />
      <Stack.Screen name={ROUTES.REGISTER} component={RegisterScreen} />
      <Stack.Screen name={ROUTES.FORGOT_PASSWORD} component={ForgotPasswordScreen} />
    </Stack.Navigator>
  );
};

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
      <Stack.Screen name={ROUTES.ADD_SUGAR} component={AddSugarScreen} />
      <Stack.Screen name={ROUTES.ADD_GLUCOSE} component={AddGlucoseScreen} />
      <Stack.Screen name={ROUTES.ADD_FOOD} component={AddFoodScreen} />
      <Stack.Screen name={ROUTES.ADD_INSULIN} component={AddInsulinScreen} />
      <Stack.Screen name={ROUTES.PROFILE} component={ProfileScreen} />
      <Stack.Screen name={ROUTES.GLUCOSE_LOG} component={GlucoseLogScreen} />
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
          } else if (route.name === ROUTES.GLUCOSE_LOG) {
            iconName = focused ? 'pulse' : 'pulse-outline';
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
        component={SugarLogScreen}
        options={{
          tabBarLabel: 'Sugar',
        }}
      />
      <Tab.Screen
        name={ROUTES.GLUCOSE_LOG}
        component={GlucoseLogScreen}
        options={{
          tabBarLabel: 'Glucose',
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

// Temporary component for screens not yet implemented
const DummyScreen = () => {
  return null;
};

// Root Navigator - switches between Auth and Main based on auth state
const AppNavigator = () => {
  const { authState, isLoading } = useAuth();
  const [showSplash, setShowSplash] = useState(true);

  useEffect(() => {
    // Show splash screen for 2 seconds
    const timer = setTimeout(() => {
      setShowSplash(false);
    }, 2000);

    return () => clearTimeout(timer);
  }, []);

  if (showSplash || isLoading) {
    return <SplashScreen />;
  }

  return (
    <NavigationContainer>
      {authState.session ? (
        <TabNavigator />
      ) : (
        <AuthNavigator />
      )}
    </NavigationContainer>
  );
};

export default AppNavigator; 