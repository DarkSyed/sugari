// User related types
export interface User {
  id: number;
  email: string | null;
  firstName: string | null;
  lastName: string | null;
  diabetesType: string | null;
}

// Authentication related types
export interface AuthState {
  user: User | null;
  session: any | null;
  isLoading: boolean;
  error: string | null;
}

// Blood sugar related types
export interface BloodSugarReading {
  id: number;
  value: number;
  timestamp: number;
  context?: string | null;
  notes?: string | null;
}

// Food and carb related types
export interface FoodEntry {
  id: number;
  name: string;
  carbs?: number | null;
  timestamp: number;
  notes?: string | null;
}

// Insulin related types
export interface InsulinDose {
  id: number;
  units: number;
  type: string;
  timestamp: number;
  notes?: string | null;
}

// Health data types for analytics
export interface HealthData {
  bloodSugar: BloodSugarReading[];
  insulin: InsulinDose[];
  food: FoodEntry[];
}

// Settings and preferences
export interface UserSettings {
  id: number;
  email: string | null;
  firstName: string | null;
  lastName: string | null;
  diabetesType: string | null;
  notifications: boolean;
  darkMode: boolean;
  units: string;
}

// AI Insight Type
export interface AIInsight {
  title: string;
  message: string;
  type: 'info' | 'warning' | 'success';
  timestamp: string;
}

// Chart Data Types
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

// Navigation Types
export type RootStackParamList = {
  SplashScreen: undefined;
  Main: undefined;
};

export type BottomTabParamList = {
  Home: undefined;
  GlucoseLog: undefined;
  Analytics: undefined;
  Settings: undefined;
};

export type MainStackParamList = {
  Dashboard: undefined;
  Profile: undefined;
  AddGlucose: { readingId?: number; initialData?: BloodSugarReading } | undefined;
  AddSugar: { readingId?: number; initialData?: BloodSugarReading } | undefined;
  AddFood: { entryId?: number; initialData?: FoodEntry } | undefined;
  AddInsulin: { doseId?: number; initialData?: InsulinDose } | undefined;
  GlucoseDetails: { readingId: number };
  FoodDetails: { entryId: number };
  InsulinDetails: { doseId: number };
  Settings: undefined;
};

// Component Props
export interface CardProps {
  children: React.ReactNode;
  variant?: 'default' | 'elevated' | 'outline';
  style?: any;
  onPress?: () => void;
}

export interface ButtonProps {
  title: string;
  onPress: () => void;
  variant?: 'primary' | 'secondary' | 'outline' | 'text';
  loading?: boolean;
  disabled?: boolean;
  style?: any;
  textStyle?: any;
  icon?: string;
  iconPosition?: 'left' | 'right';
}

export interface ContainerProps {
  children: React.ReactNode;
  style?: any;
  scrollable?: boolean;
  refreshable?: boolean;
  onRefresh?: () => void;
  refreshing?: boolean;
}

// AI-generated insights
export interface Insight {
  id: string;
  title: string;
  description: string;
  createdAt: number;
  type: 'info' | 'warning' | 'success';
}

// Theme
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