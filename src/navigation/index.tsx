import React, { useEffect, useState } from "react";
import { NavigationContainer } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { Ionicons } from "@expo/vector-icons";
import { View } from "react-native";
import { ROUTES } from "@/types";
import { useApp } from "@/contexts/AppContext";

import SplashScreen from "@/screens/main/SplashScreen";
import DashboardScreen from "@/screens/main/DashboardScreen";
import AddGlucoseScreen from "@/screens/main/AddGlucoseScreen";
import AddFoodScreen from "@/screens/main/AddFoodScreen";
import AddInsulinScreen from "@/screens/main/AddInsulinScreen";
import ProfileScreen from "@/screens/main/ProfileScreen";
import SugarLogScreen from "@/screens/main/SugarLogScreen";
import MedicationScreen from "@/screens/main/MedicationScreen";
import AnalyticsScreen from "@/screens/main/AnalyticsScreen";
import SettingsScreen from "@/screens/main/SettingsScreen";
import AddA1CScreen from "@/screens/main/AddA1CScreen";
import AddWeightScreen from "@/screens/main/AddWeightScreen";
import AddBloodPressureScreen from "@/screens/main/AddBloodPressureScreen";
import BloodPressureLogScreen from "@/screens/main/BloodPressureLogScreen";
import ReportScreen from "@/screens/main/ReportScreen";
import RemindersScreen from "@/screens/main/RemindersScreen";
import AddReminderScreen from "@/screens/main/AddReminderScreen";
import FeatureRequestScreen from "@/screens/main/FeatureRequestScreen";

import QuickActionMenu from "@/components/QuickActionMenu";

const Stack = createNativeStackNavigator();
const Tab = createBottomTabNavigator();

const DashboardStack = () => {
  return (
    <Stack.Navigator
      initialRouteName={ROUTES.DASHBOARD}
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: "white" },
      }}
    >
      <Stack.Screen name={ROUTES.DASHBOARD} component={DashboardScreen} />
      <Stack.Screen name={ROUTES.PROFILE} component={ProfileScreen} />
      <Stack.Screen name={ROUTES.SUGAR_LOG} component={SugarLogScreen} />
      <Stack.Screen name={ROUTES.ADD_GLUCOSE} component={AddGlucoseScreen} />
      <Stack.Screen name={ROUTES.ADD_FOOD} component={AddFoodScreen} />
      <Stack.Screen name={ROUTES.ADD_INSULIN} component={AddInsulinScreen} />
      <Stack.Screen name={ROUTES.ADD_A1C} component={AddA1CScreen} />
      <Stack.Screen name={ROUTES.ADD_WEIGHT} component={AddWeightScreen} />
      <Stack.Screen name={ROUTES.ADD_BP} component={AddBloodPressureScreen} />
      <Stack.Screen name={ROUTES.BP_LOG} component={BloodPressureLogScreen} />
      <Stack.Screen
        name={ROUTES.FEATURE_REQUESTS}
        component={FeatureRequestScreen}
      />
      <Stack.Screen name={ROUTES.REMINDERS} component={RemindersScreen} />
      <Stack.Screen name={ROUTES.REPORT} component={ReportScreen} />
      <Stack.Screen name={ROUTES.ADD_REMINDER} component={AddReminderScreen} />
    </Stack.Navigator>
  );
};

const SugarLogStack = () => {
  return (
    <Stack.Navigator
      initialRouteName={ROUTES.SUGAR_LOG}
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: "white" },
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

const MedicationStack = () => {
  return (
    <Stack.Navigator
      initialRouteName={ROUTES.MEDICATION}
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: "white" },
      }}
    >
      <Stack.Screen name={ROUTES.MEDICATION} component={MedicationScreen} />
      <Stack.Screen name={ROUTES.ADD_INSULIN} component={AddInsulinScreen} />
    </Stack.Navigator>
  );
};

const TabNavigator = () => {
  return (
    <Tab.Navigator
      initialRouteName={ROUTES.HOME}
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarIcon: ({ color }) => {
          const icons = {
            [ROUTES.HOME]: "home-outline",
            [ROUTES.SUGAR_LOG]: "bar-chart-outline",
            [ROUTES.ANALYTICS]: "analytics-outline",
            [ROUTES.SETTINGS]: "ellipsis-horizontal",
          };

          const iconName =
            icons[route.name as keyof typeof icons] || "help-circle-outline";

          return (
            <Ionicons
              name={iconName as keyof typeof Ionicons.glyphMap}
              size={24}
              color={color}
            />
          );
        },
        tabBarActiveTintColor: "#90D5FF",
        tabBarInactiveTintColor: "#cacaca",
        tabBarStyle: {
          borderTopWidth: 0.3,
          backgroundColor: "#111827",
          borderColor: "#35383b",
          paddingBottom: 5,
          paddingTop: 5,
          height: 70,
        },
        tabBarLabelStyle: {
          fontSize: 11,
          paddingBottom: 5,
        },
      })}
    >
      <Tab.Screen
        name={ROUTES.HOME}
        component={DashboardStack}
        options={{
          tabBarLabel: "Home",
        }}
      />
      <Tab.Screen
        name={ROUTES.SUGAR_LOG}
        component={SugarLogStack}
        options={{
          tabBarLabel: "My Data",
        }}
      />
      <Tab.Screen
        name="QuickAction"
        options={{
          tabBarLabel: "",
          tabBarIcon: () => null,
          tabBarButton: (props) => (
            <View className="flex-1 justify-center items-center -mt-3">
              <QuickActionMenu />
            </View>
          ),
        }}
      >
        {() => null}
      </Tab.Screen>
      <Tab.Screen
        name={ROUTES.ANALYTICS}
        component={AnalyticsScreen}
        options={{
          tabBarLabel: "Insights",
        }}
      />
      <Tab.Screen
        name={ROUTES.SETTINGS}
        component={SettingsScreen}
        options={{
          tabBarLabel: "More",
        }}
      />
    </Tab.Navigator>
  );
};

const AppNavigator = () => {
  const { isLoading } = useApp();
  const [showSplash, setShowSplash] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => {
      setShowSplash(false);
    }, 500);

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
