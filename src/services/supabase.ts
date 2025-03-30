// This file is commented out as we're no longer using Supabase
// and using SQLite for local storage instead

// Mock functions to replace Supabase functionality
export const supabase = {};

// Authentication methods (using local SQLite instead)
export const signUp = async (email: string, password: string) => {
  console.log('Mock signUp called - using local storage instead of Supabase');
  return { data: {}, error: null };
};

export const signIn = async (email: string, password: string) => {
  console.log('Mock signIn called - using local storage instead of Supabase');
  return { data: {}, error: null };
};

export const signOut = async () => {
  console.log('Mock signOut called - using local storage instead of Supabase');
  return { error: null };
};

export const resetPassword = async (email: string) => {
  console.log('Mock resetPassword called - using local storage instead of Supabase');
  return { data: {}, error: null };
};

export const updatePassword = async (password: string) => {
  console.log('Mock updatePassword called - using local storage instead of Supabase');
  return { data: {}, error: null };
};

export const getCurrentUser = async () => {
  console.log('Mock getCurrentUser called - using local storage instead of Supabase');
  return { user: null, error: null };
};

export const getCurrentSession = async () => {
  console.log('Mock getCurrentSession called - using local storage instead of Supabase');
  return { session: null, error: null };
};

// User profile methods (using SQLite instead)
export const getUserProfile = async (userId: string) => {
  console.log('Mock getUserProfile called - using local storage instead of Supabase');
  return { data: null, error: null };
};

export const updateUserProfile = async (userId: string, updates: any) => {
  console.log('Mock updateUserProfile called - using local storage instead of Supabase');
  return { data: null, error: null };
};

// All other methods with mock implementations
export const getBloodSugarReadings = async (userId: string) => {
  console.log('Mock getBloodSugarReadings called - using local storage instead of Supabase');
  return { data: [], error: null };
};

export const addBloodSugarReading = async (reading: any) => {
  console.log('Mock addBloodSugarReading called - using local storage instead of Supabase');
  return { data: null, error: null };
};

export const getFoodEntries = async (userId: string) => {
  console.log('Mock getFoodEntries called - using local storage instead of Supabase');
  return { data: [], error: null };
};

export const addFoodEntry = async (entry: any) => {
  console.log('Mock addFoodEntry called - using local storage instead of Supabase');
  return { data: null, error: null };
};

export const getInsulinDoses = async (userId: string) => {
  console.log('Mock getInsulinDoses called - using local storage instead of Supabase');
  return { data: [], error: null };
};

export const addInsulinDose = async (dose: any) => {
  console.log('Mock addInsulinDose called - using local storage instead of Supabase');
  return { data: null, error: null };
};

export const getUserSettings = async (userId: string) => {
  console.log('Mock getUserSettings called - using local storage instead of Supabase');
  return { data: null, error: null };
};

export const updateUserSettings = async (userId: string, settings: any) => {
  console.log('Mock updateUserSettings called - using local storage instead of Supabase');
  return { data: null, error: null };
}; 