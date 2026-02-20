
-- ==========================================================
-- MTMAP-FO : RECURSION & ROLE SYNC FIX (V32)
-- ==========================================================

-- 1. THOROUGH CLEANUP: Drop ALL policies on profiles table dynamically
DO $$ 
DECLARE 
  pol RECORD;
BEGIN 
  FOR pol IN SELECT policyname FROM pg_policies WHERE tablename = 'profiles' AND schemaname = 'public' 
  LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON public.profiles', pol.policyname);
  END LOOP;
END $$;

-- 2. SECURE & SIMPLE POLICIES (Anti-Recursion)
-- We rely on auth.uid() and auth.jwt() to avoid querying the profiles table within its own policies.
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Policy: Users can always read their own profile
CREATE POLICY "profiles_select_self" 
ON public.profiles FOR SELECT 
TO authenticated 
USING ( auth.uid() = id );

-- Policy: Admins can read all profiles (using JWT metadata to break recursion)
CREATE POLICY "profiles_select_admin" 
ON public.profiles FOR SELECT 
TO authenticated 
USING ( (auth.jwt() -> 'user_metadata' ->> 'role')::text = 'admin' );

-- Policy: Users can update only their own profile
CREATE POLICY "profiles_update_self" 
ON public.profiles FOR UPDATE 
TO authenticated 
USING ( auth.uid() = id )
WITH CHECK ( auth.uid() = id );

-- Policy: Admins have full control (using JWT metadata)
CREATE POLICY "profiles_admin_all" 
ON public.profiles FOR ALL 
TO authenticated 
USING ( (auth.jwt() -> 'user_metadata' ->> 'role')::text = 'admin' );


-- 3. STANDARDIZE TRIGGER ROLES (English)
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public, auth
AS $$
DECLARE
    v_role TEXT;
BEGIN
  -- Default to 'technician' (English) to match frontend UserRole type
  v_role := LOWER(COALESCE(new.raw_user_meta_data->>'role', 'technician'));
  
  -- Map French roles or common variants to standard English keys
  IF v_role IN ('technicien', 'agent') THEN v_role := 'technician'; END IF;
  IF v_role IN ('superviseur', 'manager') THEN v_role := 'supervisor'; END IF;
  IF v_role IN ('administrateur') THEN v_role := 'admin'; END IF;

  -- Ensure metadata is synced for the JWT token
  -- This is critical for the RLS policies defined above
  UPDATE auth.users 
  SET raw_user_meta_data = COALESCE(raw_user_meta_data, '{}'::jsonb) || jsonb_build_object('role', v_role)
  WHERE id = new.id;

  -- Create or Update public record
  INSERT INTO public.profiles (id, email, full_name, role, updated_at, is_active)
  VALUES (
    new.id,
    new.email,
    COALESCE(new.raw_user_meta_data->>'full_name', 'Agent MTMAP'),
    v_role,
    NOW(),
    true
  )
  ON CONFLICT (id) DO UPDATE SET
    role = EXCLUDED.role,
    updated_at = NOW();
    
  RETURN new;
END;
$$;

-- 4. RETROACTIVE DATA CLEANUP
-- Standardize existing roles to lowercase English keys
UPDATE public.profiles SET role = 'admin' WHERE LOWER(role) IN ('admin', 'administrateur');
UPDATE public.profiles SET role = 'supervisor' WHERE LOWER(role) IN ('supervisor', 'superviseur');
UPDATE public.profiles SET role = 'technician' WHERE LOWER(role) IN ('technician', 'technicien');
UPDATE public.profiles SET role = 'viewer' WHERE LOWER(role) IN ('viewer', 'consultant', 'guest');
