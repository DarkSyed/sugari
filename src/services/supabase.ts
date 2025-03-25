import 'react-native-url-polyfill/auto';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { createClient } from '@supabase/supabase-js';
import Constants from 'expo-constants';

// Initialize the Supabase client with AsyncStorage for persistent sessions
const supabaseUrl = Constants.expoConfig?.extra?.supabaseUrl || process.env.EXPO_PUBLIC_SUPABASE_URL || '';
const supabaseAnonKey = Constants.expoConfig?.extra?.supabaseAnonKey || process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY || '';

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('Supabase URL or anon key is missing. Please check your environment variables.');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    storage: AsyncStorage as any,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
});

// Authentication methods
export const signUp = async (email: string, password: string) => {
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
  });
  return { data, error };
};

export const signIn = async (email: string, password: string) => {
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });
  return { data, error };
};

export const signOut = async () => {
  const { error } = await supabase.auth.signOut();
  return { error };
};

export const resetPassword = async (email: string) => {
  const { data, error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: 'sugari://reset-password',
  });
  return { data, error };
};

export const updatePassword = async (password: string) => {
  const { data, error } = await supabase.auth.updateUser({
    password,
  });
  return { data, error };
};

export const getCurrentUser = async () => {
  const { data: { user }, error } = await supabase.auth.getUser();
  return { user, error };
};

export const getCurrentSession = async () => {
  const { data: { session }, error } = await supabase.auth.getSession();
  return { session, error };
};

// User profile methods
export const getUserProfile = async (userId: string) => {
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', userId)
    .single();
  return { data, error };
};

export const updateUserProfile = async (userId: string, updates: any) => {
  const { data, error } = await supabase
    .from('profiles')
    .update(updates)
    .eq('id', userId);
  return { data, error };
};

// Blood sugar methods
export const getBloodSugarReadings = async (userId: string) => {
  const { data, error } = await supabase
    .from('blood_sugar')
    .select('*')
    .eq('user_id', userId)
    .order('timestamp', { ascending: false });
  return { data, error };
};

export const addBloodSugarReading = async (reading: any) => {
  const { data, error } = await supabase
    .from('blood_sugar')
    .insert([reading]);
  return { data, error };
};

// Food entry methods
export const getFoodEntries = async (userId: string) => {
  const { data, error } = await supabase
    .from('food_entries')
    .select('*')
    .eq('user_id', userId)
    .order('timestamp', { ascending: false });
  return { data, error };
};

export const addFoodEntry = async (entry: any) => {
  const { data, error } = await supabase
    .from('food_entries')
    .insert([entry]);
  return { data, error };
};

// Insulin dose methods
export const getInsulinDoses = async (userId: string) => {
  const { data, error } = await supabase
    .from('insulin_doses')
    .select('*')
    .eq('user_id', userId)
    .order('timestamp', { ascending: false });
  return { data, error };
};

export const addInsulinDose = async (dose: any) => {
  const { data, error } = await supabase
    .from('insulin_doses')
    .insert([dose]);
  return { data, error };
};

// User settings methods
export const getUserSettings = async (userId: string) => {
  const { data, error } = await supabase
    .from('user_settings')
    .select('*')
    .eq('user_id', userId)
    .single();
  return { data, error };
};

export const updateUserSettings = async (userId: string, settings: any) => {
  const { data, error } = await supabase
    .from('user_settings')
    .update(settings)
    .eq('user_id', userId);
  return { data, error };
}; 