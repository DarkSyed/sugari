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
