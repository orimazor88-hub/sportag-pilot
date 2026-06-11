-- === SPORTAG PRO - Schema Update ===
-- Run this in your Supabase SQL Editor to add required fields and create the secure registration function.

-- 1. Add fields to profiles for targets, age, gender, and sport
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS targets JSONB;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS age INTEGER;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS gender TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS sport TEXT;

-- 2. Add fields to journals to track ROM and Strength
ALTER TABLE public.journals ADD COLUMN IF NOT EXISTS rom INTEGER;
ALTER TABLE public.journals ADD COLUMN IF NOT EXISTS strength NUMERIC(3,1);

-- 3. Create SECURE DEFINER function to create new patients by therapist
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
  -- Check if caller is therapist
  IF NOT EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE id = auth.uid() AND role = 'therapist'
  ) THEN
    RAISE EXCEPTION 'Only therapists can create patients';
  END IF;

  -- Check if email already exists
  IF EXISTS (
    SELECT 1 FROM public.profiles WHERE email = p_email
  ) THEN
    RAISE EXCEPTION 'מטופל עם אימייל זה כבר קיים במערכת';
  END IF;

  -- Generate UUID and encrypt password
  new_user_id := gen_random_uuid();
  encrypted_pw := crypt(p_password, gen_salt('bf'));
  
  -- Insert user into auth.users
  INSERT INTO auth.users (
    instance_id, id, aud, role, email, encrypted_password, 
    email_confirmed_at, raw_app_meta_data, raw_user_meta_data, created_at, updated_at
  ) VALUES (
    '00000000-0000-0000-0000-000000000000', new_user_id, 'authenticated', 'authenticated', 
    p_email, encrypted_pw, now(), 
    '{"provider": "email", "providers": ["email"]}', 
    jsonb_build_object('name', p_name, 'role', 'patient'), now(), now()
  );

  -- Insert identity into auth.identities
  INSERT INTO auth.identities (
    id, user_id, identity_data, provider, provider_id, last_sign_in_at, created_at, updated_at
  ) VALUES (
    gen_random_uuid(), new_user_id, 
    jsonb_build_object('sub', new_user_id, 'email', p_email), 'email', new_user_id::text, null, now(), now()
  );

  -- Insert profile
  INSERT INTO public.profiles (
    id, email, name, role, is_lower_limb, condition_name, phone, avatar, targets, age, gender, sport
  ) VALUES (
    new_user_id, p_email, p_name, 'patient', p_is_lower_limb, p_condition_name, p_phone, 
    CASE WHEN p_is_lower_limb THEN '🦵' ELSE '💪' END, p_targets, p_age, p_gender, p_sport
  );

  -- Insert initial baseline journal entry
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
