-- === SPORTAG PRO - Complete Database Reset & Schema Setup ===
-- Run this ENTIRE script in your Supabase SQL Editor to reset and rebuild the database.
-- WARNING: This will permanently delete all existing data.

-- ============================================================
-- STEP 1: DROP ALL EXISTING TABLES (clean slate)
-- ============================================================
DROP TABLE IF EXISTS public.therapist_notes CASCADE;
DROP TABLE IF EXISTS public.media_uploads CASCADE;
DROP TABLE IF EXISTS public.sessions CASCADE;
DROP TABLE IF EXISTS public.exercises CASCADE;
DROP TABLE IF EXISTS public.journals CASCADE;
DROP TABLE IF EXISTS public.profiles CASCADE;


-- ============================================================
-- STEP 2: DELETE ALL AUTH USERS (clean slate)
-- ============================================================
DELETE FROM auth.users;


-- ============================================================
-- STEP 3: PROFILES TABLE
-- ============================================================
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  email TEXT NOT NULL,
  name TEXT NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('patient', 'therapist')),
  is_lower_limb BOOLEAN DEFAULT FALSE,
  condition_name TEXT,
  phone TEXT,
  avatar TEXT DEFAULT '🏃',
  targets JSONB,
  age INTEGER,
  gender TEXT,
  sport TEXT,
  can_switch_role BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "profiles_select" ON public.profiles FOR SELECT USING (true);
CREATE POLICY "profiles_update" ON public.profiles FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "profiles_insert" ON public.profiles FOR INSERT WITH CHECK (true);


-- ============================================================
-- STEP 4: JOURNALS TABLE
-- ============================================================
CREATE TABLE IF NOT EXISTS public.journals (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  patient_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  date DATE NOT NULL DEFAULT CURRENT_DATE,
  pain_level INTEGER CHECK (pain_level >= 0 AND pain_level <= 10),
  mood TEXT,
  energy INTEGER CHECK (energy >= 1 AND energy <= 10),
  sleep INTEGER CHECK (sleep >= 0 AND sleep <= 24),
  activity TEXT,
  notes TEXT,
  rom INTEGER,
  strength NUMERIC(3,1),
  walking_score INTEGER CHECK (walking_score >= 0 AND walking_score <= 10),
  stairs_score INTEGER CHECK (stairs_score >= 0 AND stairs_score <= 10),
  running_score INTEGER CHECK (running_score >= 0 AND running_score <= 10),
  steps_count INTEGER DEFAULT 0,
  distance_km NUMERIC(5, 2) DEFAULT 0.00,
  device_synced BOOLEAN DEFAULT FALSE,
  device_type TEXT,
  pain_location TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

ALTER TABLE public.journals ENABLE ROW LEVEL SECURITY;

CREATE POLICY "journals_patient_all" ON public.journals FOR ALL USING (auth.uid() = patient_id);
CREATE POLICY "journals_therapist_select" ON public.journals FOR SELECT USING (
  EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'therapist')
);


-- ============================================================
-- STEP 5: EXERCISES TABLE
-- ============================================================
CREATE TABLE IF NOT EXISTS public.exercises (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  patient_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  name_he TEXT,
  category TEXT,
  description TEXT,
  sets INTEGER,
  reps INTEGER,
  hold_time INTEGER,
  frequency TEXT,
  difficulty TEXT,
  video_url TEXT,
  therapist_note TEXT,
  assigned_date DATE DEFAULT CURRENT_DATE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

ALTER TABLE public.exercises ENABLE ROW LEVEL SECURITY;

CREATE POLICY "exercises_select" ON public.exercises FOR SELECT USING (
  auth.uid() = patient_id OR
  EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'therapist')
);
CREATE POLICY "exercises_therapist_all" ON public.exercises FOR ALL USING (
  EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'therapist')
);


-- ============================================================
-- STEP 6: SESSIONS TABLE
-- ============================================================
CREATE TABLE IF NOT EXISTS public.sessions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  patient_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  therapist_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  date TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  duration INTEGER,
  type TEXT,
  summary TEXT,
  recorded BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

ALTER TABLE public.sessions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "sessions_select" ON public.sessions FOR SELECT USING (
  auth.uid() = patient_id OR auth.uid() = therapist_id
);
CREATE POLICY "sessions_therapist_all" ON public.sessions FOR ALL USING (
  EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'therapist')
);


-- ============================================================
-- STEP 7: MEDIA UPLOADS TABLE
-- ============================================================
CREATE TABLE IF NOT EXISTS public.media_uploads (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  patient_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  title TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('image', 'video')),
  file_name TEXT NOT NULL,
  file_url TEXT NOT NULL,
  thumbnail_url TEXT,
  note TEXT,
  exercise_id TEXT,
  date DATE NOT NULL DEFAULT CURRENT_DATE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

ALTER TABLE public.media_uploads ENABLE ROW LEVEL SECURITY;

CREATE POLICY "media_patient_all" ON public.media_uploads FOR ALL USING (auth.uid() = patient_id);
CREATE POLICY "media_therapist_all" ON public.media_uploads FOR ALL USING (
  EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'therapist')
);


-- ============================================================
-- STEP 8: THERAPIST NOTES TABLE
-- ============================================================
CREATE TABLE IF NOT EXISTS public.therapist_notes (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  patient_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  therapist_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  date DATE NOT NULL DEFAULT CURRENT_DATE,
  notes TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

ALTER TABLE public.therapist_notes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "notes_select" ON public.therapist_notes FOR SELECT USING (
  auth.uid() = patient_id OR
  EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'therapist')
);
CREATE POLICY "notes_therapist_all" ON public.therapist_notes FOR ALL USING (
  EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'therapist')
);


-- ============================================================
-- STEP 9: SECURE FUNCTION TO CREATE PATIENTS
-- ============================================================
CREATE OR REPLACE FUNCTION public.create_patient(
  p_email TEXT,
  p_password TEXT,
  p_name TEXT,
  p_phone TEXT,
  p_age INTEGER,
  p_gender TEXT,
  p_sport TEXT,
  p_condition_name TEXT,
  p_is_lower_limb BOOLEAN,
  p_targets JSONB,
  p_initial_pain INTEGER,
  p_initial_rom INTEGER,
  p_initial_strength NUMERIC(3,1),
  p_initial_walking INTEGER,
  p_initial_stairs INTEGER,
  p_initial_running INTEGER
) RETURNS UUID AS $$
DECLARE
  new_user_id UUID;
  encrypted_pw TEXT;
BEGIN
  IF NOT EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'therapist') THEN
    RAISE EXCEPTION 'Only therapists can create patients';
  END IF;

  IF EXISTS (SELECT 1 FROM public.profiles WHERE email = p_email)
  OR EXISTS (SELECT 1 FROM auth.users WHERE email = p_email) THEN
    RAISE EXCEPTION 'כתובת האימייל הזו כבר רשומה במערכת. אנא השתמש בכתובת אימייל אחרת.';
  END IF;

  new_user_id := gen_random_uuid();
  encrypted_pw := crypt(p_password, gen_salt('bf'));

  INSERT INTO auth.users (
    instance_id, id, aud, role, email, encrypted_password,
    email_confirmed_at, raw_app_meta_data, raw_user_meta_data, created_at, updated_at
  ) VALUES (
    '00000000-0000-0000-0000-000000000000', new_user_id, 'authenticated', 'authenticated',
    p_email, encrypted_pw, now(),
    '{"provider": "email", "providers": ["email"]}',
    jsonb_build_object('name', p_name, 'role', 'patient'), now(), now()
  );

  INSERT INTO auth.identities (
    id, user_id, identity_data, provider, provider_id, last_sign_in_at, created_at, updated_at
  ) VALUES (
    gen_random_uuid(), new_user_id,
    jsonb_build_object('sub', new_user_id, 'email', p_email), 'email', new_user_id::text, null, now(), now()
  );

  INSERT INTO public.profiles (
    id, email, name, role, is_lower_limb, condition_name, phone, avatar, targets, age, gender, sport
  ) VALUES (
    new_user_id, p_email, p_name, 'patient', p_is_lower_limb, p_condition_name, p_phone,
    CASE WHEN p_is_lower_limb THEN '🦵' ELSE '💪' END, p_targets, p_age, p_gender, p_sport
  );

  INSERT INTO public.journals (
    patient_id, date, pain_level, rom, strength, walking_score, stairs_score, running_score, notes
  ) VALUES (
    new_user_id, CURRENT_DATE, p_initial_pain, p_initial_rom, p_initial_strength,
    CASE WHEN p_is_lower_limb THEN p_initial_walking ELSE NULL END,
    CASE WHEN p_is_lower_limb THEN p_initial_stairs ELSE NULL END,
    CASE WHEN p_is_lower_limb THEN p_initial_running ELSE NULL END,
    'ערכי בסיס (Baseline) שהוגדרו על ידי המטפל במעמד הרישום.'
  );

  RETURN new_user_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;


-- ============================================================
-- STEP 10: STORAGE BUCKET (run separately if this part fails)
-- ============================================================
INSERT INTO storage.buckets (id, name, public, file_size_limit)
VALUES ('patient-media', 'patient-media', true, 524288000)
ON CONFLICT (id) DO UPDATE SET file_size_limit = 524288000;
