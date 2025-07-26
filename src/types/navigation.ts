import { NavigatorScreenParams } from "@react-navigation/native";
import { StackNavigationProp } from "@react-navigation/stack";
import { CGMBrand } from ".";
import {
  BloodSugarReading,
  FoodEntry,
  InsulinDose,
  WeightMeasurement,
  BloodPressureReading,
  A1CReading,
} from "./data";

export const ROUTES = {
  SPLASH_SCREEN: "SplashScreen",
  MAIN: "Main",
  LOGIN: "Login",
  REGISTER: "Register",
  FORGOT_PASSWORD: "ForgotPassword",
  HOME: "Home",
  DASHBOARD: "Dashboard",
  MEDICATION: "Medication",
  ADD_GLUCOSE: "AddGlucose",
  SUGAR_LOG: "SugarLog",
  FOOD_LOG: "FoodLog",
  ADD_FOOD: "AddFood",
  INSULIN_LOG: "InsulinLog",
  ADD_INSULIN: "AddInsulin",
  ADD_A1C: "AddA1C",
  ADD_WEIGHT: "AddWeight",
  ADD_BP: "AddBloodPressure",
  PAIR_CGM: "PairCGM",
  BP_LOG: "BloodPressureLog",
  ANALYTICS: "Analytics",
  SETTINGS: "Settings",
  PROFILE: "Profile",
  REPORT: "Report",
  REMINDERS: "Reminders",
  ADD_REMINDER: "AddReminder",
  FEATURE_REQUESTS: "FeatureRequests",
} as const;

export type AuthParamList = {
  [ROUTES.LOGIN]: undefined;
  [ROUTES.REGISTER]: undefined;
  [ROUTES.FORGOT_PASSWORD]: undefined;
};

export type TabParamList = {
  [ROUTES.HOME]: undefined;
  [ROUTES.SUGAR_LOG]: undefined;
  [ROUTES.ANALYTICS]: undefined;
  [ROUTES.SETTINGS]: undefined;
};

export type MainStackParamList = {
  [ROUTES.DASHBOARD]: undefined;
  [ROUTES.PROFILE]: undefined;
  [ROUTES.ADD_BP]?: {
    readingId?: number;
    initialData?: BloodPressureReading;
    isEditing: boolean;
  };
  [ROUTES.ADD_GLUCOSE]?: {
    readingId?: number;
    initialData?: BloodSugarReading;
    isEditing?: boolean;
  };
  [ROUTES.ADD_A1C]?: {
    readingId?: number;
    initialData?: A1CReading;
    isEditing?: boolean;
  };
  [ROUTES.ADD_WEIGHT]?: {
    readingId?: number;
    initailData?: WeightMeasurement;
    isEditing?: boolean;
  };
  [ROUTES.ADD_FOOD]?: {
    entryId?: number;
    initialData?: FoodEntry;
    isEditing: boolean;
  };
  [ROUTES.ADD_INSULIN]?: {
    doseId?: number;
    initialData?: InsulinDose;
    isEditing: boolean;
  };
  [ROUTES.SUGAR_LOG]?: { readingId?: number };
  [ROUTES.FOOD_LOG]?: { entryId?: number };
  [ROUTES.INSULIN_LOG]?: { doseId?: number };
  [ROUTES.SETTINGS]?: undefined;
  [ROUTES.BP_LOG]?: undefined;
  [ROUTES.REPORT]?: undefined;
  [ROUTES.REMINDERS]?: undefined;
  [ROUTES.ADD_REMINDER]?: undefined;
  [ROUTES.FEATURE_REQUESTS]?: undefined;
  [ROUTES.PAIR_CGM]?: { brand: CGMBrand };
};

export type RootStackParamList = {
  [ROUTES.SPLASH_SCREEN]: undefined;
  Auth: NavigatorScreenParams<AuthParamList>;
  Main: NavigatorScreenParams<TabParamList>;
};

export type NavProp = StackNavigationProp<MainStackParamList>;

declare global {
  namespace ReactNavigation {
    interface RootParamList extends RootStackParamList {}
  }
}
