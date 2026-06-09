-- === SPORTAG PRO - Supabase Schema ===
-- Run this in your Supabase SQL Editor to set up the tables and security rules.

-- 1. PROFILES TABLE (Linked to Supabase Auth users)
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  email TEXT NOT NULL,
  name TEXT NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('patient', 'therapist')),
  is_lower_limb BOOLEAN DEFAULT FALSE,
  condition_name TEXT,
  phone TEXT,
  avatar TEXT DEFAULT '🏃',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Enable Row Level Security (RLS) on profiles
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow public read access to profiles" 
  ON public.profiles FOR SELECT USING (true);

CREATE POLICY "Allow users to update their own profile" 
  ON public.profiles FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Allow users to insert their own profile" 
  ON public.profiles FOR INSERT WITH CHECK (auth.uid() = id);


-- 2. JOURNALS TABLE (Daily tracking logs)
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
  walking_score INTEGER CHECK (walking_score >= 0 AND walking_score <= 10),
  stairs_score INTEGER CHECK (stairs_score >= 0 AND stairs_score <= 10),
  running_score INTEGER CHECK (running_score >= 0 AND running_score <= 10),
  steps_count INTEGER DEFAULT 0,
  distance_km NUMERIC(5, 2) DEFAULT 0.00,
  device_synced BOOLEAN DEFAULT FALSE,
  device_type TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Enable RLS on journals
ALTER TABLE public.journals ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Patients can manage their own journals" 
  ON public.journals FOR ALL USING (auth.uid() = patient_id);

CREATE POLICY "Therapists can view all journals" 
  ON public.journals FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE public.profiles.id = auth.uid() AND public.profiles.role = 'therapist'
    )
  );


-- 3. EXERCISES TABLE (Assigned exercises)
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
  assigned_date DATE DEFAULT CURRENT_DATE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Enable RLS on exercises
ALTER TABLE public.exercises ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Patients and therapists can view assigned exercises" 
  ON public.exercises FOR SELECT USING (
    auth.uid() = patient_id OR 
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE public.profiles.id = auth.uid() AND public.profiles.role = 'therapist'
    )
  );

CREATE POLICY "Therapists can manage exercises" 
  ON public.exercises FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE public.profiles.id = auth.uid() AND public.profiles.role = 'therapist'
    )
  );


-- 4. SESSIONS TABLE (Therapy sessions logs)
CREATE TABLE IF NOT EXISTS public.sessions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  patient_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  therapist_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  date TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  duration INTEGER, -- in minutes
  type TEXT,
  summary TEXT,
  recorded BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Enable RLS on sessions
ALTER TABLE public.sessions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Patients and therapists can view sessions" 
  ON public.sessions FOR SELECT USING (
    auth.uid() = patient_id OR auth.uid() = therapist_id
  );

CREATE POLICY "Therapists can manage sessions" 
  ON public.sessions FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE public.profiles.id = auth.uid() AND public.profiles.role = 'therapist'
    )
  );


-- 5. MEDIA UPLOADS TABLE (Patient uploaded images and videos)
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

-- Enable RLS on media_uploads
ALTER TABLE public.media_uploads ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Patients can manage their own media uploads" 
  ON public.media_uploads FOR ALL USING (auth.uid() = patient_id);

CREATE POLICY "Therapists can view all media uploads" 
  ON public.media_uploads FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE public.profiles.id = auth.uid() AND public.profiles.role = 'therapist'
    )
  );


-- 6. STORAGE BUCKET CONFIGURATION FOR VIDEO UPLOADS
-- Create the bucket if it doesn't exist
INSERT INTO storage.buckets (id, name, public) 
VALUES ('patient-media', 'patient-media', true)
ON CONFLICT (id) DO NOTHING;

-- Enable RLS on storage.objects
ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;

-- Allow public read access to objects in 'patient-media'
CREATE POLICY "Allow public select on patient-media" 
ON storage.objects FOR SELECT 
USING (bucket_id = 'patient-media');

-- Allow public insert access to upload files to 'patient-media'
CREATE POLICY "Allow public insert to patient-media" 
ON storage.objects FOR INSERT 
WITH CHECK (bucket_id = 'patient-media');

-- Allow public update access to files in 'patient-media'
CREATE POLICY "Allow public update on patient-media" 
ON storage.objects FOR UPDATE 
USING (bucket_id = 'patient-media');

-- Allow public delete access to files in 'patient-media'
CREATE POLICY "Allow public delete from patient-media" 
ON storage.objects FOR DELETE 
USING (bucket_id = 'patient-media');
