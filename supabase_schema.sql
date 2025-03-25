-- Create profiles table
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id),
  email TEXT NOT NULL,
  first_name TEXT,
  last_name TEXT,
  birthdate DATE,
  diabetes_type TEXT CHECK (diabetes_type IN ('type1', 'type2', 'gestational', 'other')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()) NOT NULL
);

-- Create trigger to automatically create profile record when a new user signs up
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, created_at, updated_at)
  VALUES (new.id, new.email, now(), now());
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create the trigger
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();

-- Create blood_sugar table
CREATE TABLE IF NOT EXISTS public.blood_sugar (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  value NUMERIC NOT NULL,
  timestamp TIMESTAMP WITH TIME ZONE NOT NULL,
  meal_context TEXT CHECK (meal_context IN ('before_meal', 'after_meal', 'fasting', 'bedtime', 'other')),
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()) NOT NULL
);

-- Create food_entries table
CREATE TABLE IF NOT EXISTS public.food_entries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  carbs NUMERIC NOT NULL,
  timestamp TIMESTAMP WITH TIME ZONE NOT NULL,
  meal TEXT CHECK (meal IN ('breakfast', 'lunch', 'dinner', 'snack')),
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()) NOT NULL
);

-- Create insulin_doses table
CREATE TABLE IF NOT EXISTS public.insulin_doses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  units NUMERIC NOT NULL,
  insulin_type TEXT CHECK (insulin_type IN ('rapid', 'long', 'mixed', 'other')),
  timestamp TIMESTAMP WITH TIME ZONE NOT NULL,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()) NOT NULL
);

-- Create user_settings table
CREATE TABLE IF NOT EXISTS public.user_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  target_range_min NUMERIC DEFAULT 70 NOT NULL,
  target_range_max NUMERIC DEFAULT 180 NOT NULL,
  insulin_sensitivity_factor NUMERIC,
  carb_ratio NUMERIC,
  notifications BOOLEAN DEFAULT true,
  dark_mode BOOLEAN DEFAULT false,
  units TEXT DEFAULT 'mg/dL' CHECK (units IN ('mg/dL', 'mmol/L')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()) NOT NULL,
  UNIQUE(user_id)
);

-- Row Level Security (RLS) Policies

-- Profiles table policies
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own profile" ON public.profiles 
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update own profile" ON public.profiles 
  FOR UPDATE USING (auth.uid() = id);

-- Blood sugar table policies
ALTER TABLE public.blood_sugar ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own blood sugar readings" ON public.blood_sugar 
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own blood sugar readings" ON public.blood_sugar 
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own blood sugar readings" ON public.blood_sugar 
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own blood sugar readings" ON public.blood_sugar 
  FOR DELETE USING (auth.uid() = user_id);

-- Food entries table policies
ALTER TABLE public.food_entries ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own food entries" ON public.food_entries 
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own food entries" ON public.food_entries 
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own food entries" ON public.food_entries 
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own food entries" ON public.food_entries 
  FOR DELETE USING (auth.uid() = user_id);

-- Insulin doses table policies
ALTER TABLE public.insulin_doses ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own insulin doses" ON public.insulin_doses 
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own insulin doses" ON public.insulin_doses 
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own insulin doses" ON public.insulin_doses 
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own insulin doses" ON public.insulin_doses 
  FOR DELETE USING (auth.uid() = user_id);

-- User settings table policies
ALTER TABLE public.user_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own settings" ON public.user_settings 
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own settings" ON public.user_settings 
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own settings" ON public.user_settings 
  FOR UPDATE USING (auth.uid() = user_id);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS blood_sugar_user_id_idx ON public.blood_sugar(user_id);
CREATE INDEX IF NOT EXISTS blood_sugar_timestamp_idx ON public.blood_sugar(timestamp);
CREATE INDEX IF NOT EXISTS food_entries_user_id_idx ON public.food_entries(user_id);
CREATE INDEX IF NOT EXISTS food_entries_timestamp_idx ON public.food_entries(timestamp);
CREATE INDEX IF NOT EXISTS insulin_doses_user_id_idx ON public.insulin_doses(user_id);
CREATE INDEX IF NOT EXISTS insulin_doses_timestamp_idx ON public.insulin_doses(timestamp); 