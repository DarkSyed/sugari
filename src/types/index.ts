import { initialWindowSafeAreaInsets } from "react-native-safe-area-context";

export interface User {
  id: number;
  email: string | null;
  firstName: string | null;
  lastName: string | null;
  diabetesType: string | null;
}

export interface AuthState {
  user: User | null;
  session: any | null;
  isLoading: boolean;
  error: string | null;
}

export interface BloodSugarReading {
  id: number;
  value: number;
  timestamp: number;
  context?: string | null;
  notes?: string | null;
}

export interface FoodEntry {
  id: number;
  name: string;
  carbs?: number | null;
  timestamp: number;
  meal_type: string;
  notes?: string | null;
}

export interface InsulinDose {
  id: number;
  units: number;
  type: string;
  timestamp: number;
  notes?: string | null;
}

export interface HealthData {
  bloodSugar: BloodSugarReading[];
  insulin: InsulinDose[];
  food: FoodEntry[];
}

export interface UserSettings {
  id: number;
  email: string | null;
  firstName: string | null;
  lastName: string | null;
  diabetesType: string | null;
  notifications: boolean;
  darkMode: boolean;
  units: string;
  targetLowThreshold?: number;
  targetHighThreshold?: number;
  fastingLowThreshold?: number;
  fastingHighThreshold?: number;
  weight?: number | null;
  height?: number | null;
  weightUnit?: string;
}

export interface AIInsight {
  title: string;
  message: string;
  type: "info" | "warning" | "success";
  timestamp: string;
}

export interface ChartDataPoint {
  value: number;
  timestamp: string;
  context?: string;
}

export interface GlucoseTrendData {
  label: string;
  data: ChartDataPoint[];
  timeRange: string;
}

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

export type RootStackParamList = {
  [ROUTES.SPLASH_SCREEN]: undefined;
  [ROUTES.MAIN]: undefined;
};

export type BottomTabParamList = {
  [ROUTES.HOME]: undefined;
  [ROUTES.ANALYTICS]: undefined;
  [ROUTES.SETTINGS]: undefined;
};

export type MainStackParamList = {
  [ROUTES.DASHBOARD]: undefined;
  [ROUTES.PROFILE]: undefined;
  [ROUTES.ADD_BP]:
    | {
        readingId?: number;
        initialData?: BloodPressureReading;
        isEditing: boolean;
      }
    | undefined;
  [ROUTES.ADD_GLUCOSE]:
    | {
        readingId?: number;
        initialData?: BloodSugarReading;
        isEditing?: boolean;
      }
    | undefined;
  [ROUTES.ADD_A1C]:
    | { readingId?: number; initialData?: A1CReading; isEditing?: boolean }
    | undefined;
  [ROUTES.ADD_WEIGHT]:
    | {
        readingId?: number;
        initailData?: WeightMeasurement;
        isEditing?: boolean;
      }
    | undefined;
  [ROUTES.ADD_FOOD]:
    | { entryId?: number; initialData?: FoodEntry; isEditing: boolean }
    | undefined;
  [ROUTES.ADD_INSULIN]:
    | { doseId?: number; initialData?: InsulinDose; isEditing: boolean }
    | undefined;
  [ROUTES.SUGAR_LOG]: { readingId?: number };
  [ROUTES.FOOD_LOG]: { entryId?: number };
  [ROUTES.INSULIN_LOG]: { doseId?: number };
  [ROUTES.SETTINGS]: undefined;
  [ROUTES.BP_LOG]: undefined;
};

export interface CardProps {
  children: React.ReactNode;
  variant?: "default" | "elevated" | "outline";
  style?: any;
  onPress?: () => void;
}

export interface ButtonProps {
  title: string;
  onPress: () => void;
  variant?: "primary" | "secondary" | "outline" | "text";
  loading?: boolean;
  disabled?: boolean;
  style?: any;
  textStyle?: any;
  icon?: string;
  iconPosition?: "left" | "right";
}

export interface ContainerProps {
  children: React.ReactNode;
  style?: any;
  scrollable?: boolean;
  refreshable?: boolean;
  onRefresh?: () => void;
  refreshing?: boolean;
}

export interface Insight {
  id: string;
  title: string;
  description: string;
  createdAt: number;
  type: "info" | "warning" | "success";
}

export interface Theme {
  isDark: boolean;
  colors: {
    primary: string;
    background: string;
    card: string;
    text: string;
    border: string;
    notification: string;
    success: string;
    warning: string;
    error: string;
    info: string;
  };
}

export interface A1CReading {
  id: number;
  value: number;
  timestamp: number;
  notes?: string | null;
}

export interface WeightMeasurement {
  id: number;
  value: number;
  timestamp: number;
  notes?: string | null;
}

export interface BloodPressureReading {
  id: number;
  systolic: number;
  diastolic: number;
  timestamp: number;
  notes?: string | null;
}

export interface Medication {
  id: number;
  name: string;
  type: "pill" | "injection";
  dosage: string;
  frequency: string;
  notes?: string;
  imagePath?: string;
  timestamp: number;
}

export type CGMBrand = "Dexcom" | "Freestyle Libre" | "Medtronic";
