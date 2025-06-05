// Use a placeholder key for OpenAI API
export const OPENAI_API_KEY = "YOUR_OPENAI_API_KEY";

// App Constants
export const APP_NAME = "Sugari";
export const APP_VERSION = "1.0.0";

// Blood Sugar Related Constants
export const NORMAL_SUGAR_MIN = 70; // mg/dL
export const NORMAL_SUGAR_MAX = 160; // mg/dL
export const CRITICAL_SUGAR_LOW = 54; // mg/dL
export const CRITICAL_SUGAR_HIGH = 250; // mg/dL

// Unit Conversion
export const MG_DL_TO_MMOL_L = 0.0555; // Conversion factor

// Theme and UI Constants
export const COLORS = {
  primary: '#4B89DC',
  secondary: '#5D9CEC',
  background: '#F7F9FC',
  text: '#333333',
  lightText: '#7F8C8D',
  error: '#FF5A5F',
  warning: '#FFAB40',
  success: '#50C878',
  danger: '#FF5A5F',
  border: '#E1E8ED',
  cardBackground: '#FFFFFF',
  inputBackground: '#F8F9FA',
};

export const FONTS = {
  regular: "System",
  medium: "System-Medium",
  bold: "System-Bold",
};

export const SIZES = {
  xs: 8,
  sm: 12,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 40,
  headerHeight: 60,
};

// Navigation Constants
export const ROUTES = {
  SPLASH: "Splash",
  LOGIN: "Login",
  REGISTER: "Register",
  FORGOT_PASSWORD: "ForgotPassword",
  HOME: "Home",
  DASHBOARD: "Dashboard",
  GLUCOSE_LOG: "GlucoseLog",
  MEDICATION: "Medication",
  ADD_GLUCOSE: "AddGlucose",
  SUGAR_LOG: "SugarLog",
  ADD_SUGAR: "AddSugar",
  FOOD_LOG: "FoodLog",
  ADD_FOOD: "AddFood",
  INSULIN_LOG: "InsulinLog",
  ADD_INSULIN: "AddInsulin",
  ADD_A1C: "AddA1C",
  ADD_WEIGHT: "AddWeight",
  ADD_BP: "AddBloodPressure",
  BP_LOG: "BloodPressureLog",
  ANALYTICS: "Analytics",
  SETTINGS: "Settings",
  PROFILE: "Profile",
  REPORT: "Report",
  REMINDERS: "Reminders",
  ADD_REMINDER: "AddReminder",
  FEATURE_REQUESTS: "FeatureRequests",
};

// Form Validation Messages
export const VALIDATION = {
  REQUIRED: "This field is required",
  EMAIL: "Please enter a valid email address",
  PASSWORD_MIN: "Password must be at least 8 characters",
  PASSWORD_MATCH: "Passwords do not match",
  SUGAR_MIN: `Blood sugar must be greater than ${NORMAL_SUGAR_MIN - 30} mg/dL`,
  SUGAR_MAX: `Blood sugar must be less than ${CRITICAL_SUGAR_HIGH + 50} mg/dL`,
  CARBS_MIN: "Carbs must be greater than 0g",
  CARBS_MAX: "Carbs must be less than 500g",
  INSULIN_MIN: "Insulin must be greater than 0 units",
  INSULIN_MAX: "Insulin must be less than 100 units",
};

export const BLOOD_SUGAR_LEVELS = {
  LOW: 70,  // mg/dL
  HIGH: 180, // mg/dL
  VERY_LOW: 54, // mg/dL
  VERY_HIGH: 250, // mg/dL
  LOW_MMOL: 3.9, // mmol/L equivalent
  HIGH_MMOL: 10.0, // mmol/L equivalent
  VERY_LOW_MMOL: 3.0, // mmol/L equivalent
  VERY_HIGH_MMOL: 13.9, // mmol/L equivalent
};

export const MEAL_CONTEXTS = [
  { label: 'Before Meal', value: 'before_meal' },
  { label: 'After Meal', value: 'after_meal' },
  { label: 'Fasting', value: 'fasting' },
  { label: 'Before Exercise', value: 'before_exercise' },
  { label: 'After Exercise', value: 'after_exercise' },
  { label: 'Bedtime', value: 'bedtime' },
  { label: 'Overnight', value: 'overnight' },
  { label: 'Other', value: 'other' },
];

export const INSULIN_TYPES = [
  { label: 'Rapid-Acting', value: 'rapid' },
  { label: 'Short-Acting', value: 'short' },
  { label: 'Intermediate-Acting', value: 'intermediate' },
  { label: 'Long-Acting', value: 'long' },
  { label: 'Mixed', value: 'mixed' },
];

export const UNITS = [
  { label: 'mg/dL', value: 'mg/dL' },
  { label: 'mmol/L', value: 'mmol/L' },
]; 