// User related types
export interface User {
  id: string;
  email: string;
  firstName?: string;
  lastName?: string;
  birthdate?: string;
  diabetesType?: 'type1' | 'type2' | 'gestational' | 'other';
  createdAt: string;
  updatedAt: string;
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
  id: string;
  userId: string;
  value: number; // in mg/dL
  timestamp: string;
  mealContext?: 'before_meal' | 'after_meal' | 'fasting' | 'bedtime' | 'other';
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

// Food and carb related types
export interface FoodEntry {
  id: string;
  userId: string;
  name: string;
  carbs: number; // in grams
  timestamp: string;
  meal: 'breakfast' | 'lunch' | 'dinner' | 'snack';
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

// Insulin related types
export interface InsulinDose {
  id: string;
  userId: string;
  units: number;
  insulinType: 'rapid' | 'long' | 'mixed' | 'other';
  timestamp: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

// Health data types for analytics
export interface HealthData {
  bloodSugar: BloodSugarReading[];
  insulin: InsulinDose[];
  food: FoodEntry[];
}

// Settings and preferences
export interface UserSettings {
  userId: string;
  targetRangeMin: number; // in mg/dL
  targetRangeMax: number; // in mg/dL
  insulinSensitivityFactor: number; // how much 1 unit of insulin lowers blood sugar
  carbRatio: number; // how many grams of carbs are covered by 1 unit of insulin
  notifications: boolean;
  darkMode: boolean;
  units: 'mg/dL' | 'mmol/L';
  createdAt: string;
  updatedAt: string;
} 