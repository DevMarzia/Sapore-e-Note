-- ==============================================================================
-- Sapore & Note - Setup Completo Idempotente (Eseguibile quante volte vuoi)
-- ==============================================================================
-- Istruzioni:
-- 1. Seleziona tutto il testo di questo script (Ctrl + A) e copialo.
-- 2. Nel SQL Editor di Supabase, cancella la query precedente e incolla questo script.
-- 3. Clicca su "Run" (o premi Ctrl + Enter). Non restituirà alcun errore!
-- ==============================================================================

-- 1. TABELLA PROFILI
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
    username TEXT UNIQUE,
    full_name TEXT,
    avatar_url TEXT,
    bio TEXT DEFAULT 'Appassionato di cucina genuina e buone forchette.',
    is_private BOOLEAN DEFAULT false
);

ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS is_private BOOLEAN DEFAULT false;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Rimozione sicura di tutte le versioni precedenti delle policy profili
DROP POLICY IF EXISTS "Profili consultabili pubblicamente" ON public.profiles;
DROP POLICY IF EXISTS "Profili visualizzabili da chiunque" ON public.profiles;
DROP POLICY IF EXISTS "Utenti possono aggiornare il proprio profilo" ON public.profiles;
DROP POLICY IF EXISTS "Inserimento proprio profilo" ON public.profiles;
DROP POLICY IF EXISTS "Inserimento profilo utente" ON public.profiles;

-- Creazione nuove policy profili
CREATE POLICY "Profili consultabili pubblicamente"
    ON public.profiles FOR SELECT USING (true);

CREATE POLICY "Utenti possono aggiornare il proprio profilo"
    ON public.profiles FOR UPDATE USING (auth.uid() = id) WITH CHECK (auth.uid() = id);

CREATE POLICY "Inserimento proprio profilo"
    ON public.profiles FOR INSERT WITH CHECK (auth.uid() = id);

-- Trigger auto-profilo con Google OAuth o Email
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
DECLARE
  extracted_username TEXT;
  extracted_name TEXT;
  extracted_avatar TEXT;
BEGIN
  extracted_username := COALESCE(
    new.raw_user_meta_data->>'username',
    new.raw_user_meta_data->>'preferred_username',
    split_part(new.email, '@', 1)
  );

  extracted_name := COALESCE(
    new.raw_user_meta_data->>'full_name',
    new.raw_user_meta_data->>'name',
    extracted_username
  );

  extracted_avatar := COALESCE(
    new.raw_user_meta_data->>'avatar_url',
    new.raw_user_meta_data->>'picture',
    ''
  );

  INSERT INTO public.profiles (id, username, full_name, avatar_url, is_private)
  VALUES (new.id, extracted_username, extracted_name, extracted_avatar, false)
  ON CONFLICT (id) DO UPDATE SET
    avatar_url = CASE WHEN profiles.avatar_url IS NULL OR profiles.avatar_url = '' THEN EXCLUDED.avatar_url ELSE profiles.avatar_url END,
    full_name = CASE WHEN profiles.full_name IS NULL OR profiles.full_name = '' THEN EXCLUDED.full_name ELSE profiles.full_name END;

  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();


-- 2. TABELLA RICETTE
CREATE TABLE IF NOT EXISTS public.recipes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
    user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    title TEXT NOT NULL,
    category TEXT NOT NULL CHECK (category IN ('Antipasti', 'Primi', 'Secondi', 'Dolci')),
    image_url TEXT,
    source_url TEXT,
    source_type TEXT DEFAULT 'manual' CHECK (source_type IN ('manual', 'instagram', 'website')),
    prep_time TEXT DEFAULT '30 min',
    servings INT DEFAULT 4,
    calories INT DEFAULT 0,
    ingredients JSONB NOT NULL DEFAULT '[]'::jsonb,
    steps JSONB NOT NULL DEFAULT '[]'::jsonb,
    nutrition JSONB,
    author JSONB
);

ALTER TABLE public.recipes ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL;
ALTER TABLE public.recipes ADD COLUMN IF NOT EXISTS calories INT DEFAULT 0;
ALTER TABLE public.recipes ADD COLUMN IF NOT EXISTS nutrition JSONB;
ALTER TABLE public.recipes ADD COLUMN IF NOT EXISTS source_url TEXT;
ALTER TABLE public.recipes ADD COLUMN IF NOT EXISTS source_type TEXT DEFAULT 'manual';
ALTER TABLE public.recipes ADD COLUMN IF NOT EXISTS author JSONB;

CREATE INDEX IF NOT EXISTS idx_recipes_category ON public.recipes(category);
CREATE INDEX IF NOT EXISTS idx_recipes_created_at ON public.recipes(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_recipes_user_id ON public.recipes(user_id);

ALTER TABLE public.recipes ENABLE ROW LEVEL SECURITY;

-- Rimozione sicura di tutte le versioni precedenti delle policy ricette
DROP POLICY IF EXISTS "Accesso pubblico in lettura alle ricette" ON public.recipes;
DROP POLICY IF EXISTS "Ricette leggibili da tutti" ON public.recipes;
DROP POLICY IF EXISTS "Inserimento pubblico ricette" ON public.recipes;
DROP POLICY IF EXISTS "Utenti autenticati o anonimi possono inserire ricette" ON public.recipes;
DROP POLICY IF EXISTS "Modifica pubblica ricette" ON public.recipes;
DROP POLICY IF EXISTS "Aggiornamento ricette" ON public.recipes;
DROP POLICY IF EXISTS "Eliminazione pubblica ricette" ON public.recipes;
DROP POLICY IF EXISTS "Eliminazione ricette" ON public.recipes;

-- Creazione nuove policy ricette
CREATE POLICY "Accesso pubblico in lettura alle ricette"
    ON public.recipes FOR SELECT USING (true);

CREATE POLICY "Inserimento pubblico ricette"
    ON public.recipes FOR INSERT WITH CHECK (true);

CREATE POLICY "Modifica pubblica ricette"
    ON public.recipes FOR UPDATE USING (true) WITH CHECK (true);

CREATE POLICY "Eliminazione pubblica ricette"
    ON public.recipes FOR DELETE USING (true);


-- 3. STORAGE BUCKETS
INSERT INTO storage.buckets (id, name, public) VALUES ('recipe-images', 'recipe-images', true) ON CONFLICT (id) DO UPDATE SET public = true;
INSERT INTO storage.buckets (id, name, public) VALUES ('avatars', 'avatars', true) ON CONFLICT (id) DO UPDATE SET public = true;

-- Rimozione sicura policy storage esistenti
DROP POLICY IF EXISTS "Visualizzazione pubblica immagini ricette" ON storage.objects;
DROP POLICY IF EXISTS "Visualizzazione immagini ricette" ON storage.objects;
DROP POLICY IF EXISTS "Immagini ricette visibili pubblicamente" ON storage.objects;
DROP POLICY IF EXISTS "Caricamento pubblico immagini ricette" ON storage.objects;
DROP POLICY IF EXISTS "Caricamento immagini ricette" ON storage.objects;
DROP POLICY IF EXISTS "Caricamento immagini consentito" ON storage.objects;
DROP POLICY IF EXISTS "Eliminazione immagini ricette" ON storage.objects;
DROP POLICY IF EXISTS "Eliminazione immagini consentita" ON storage.objects;
DROP POLICY IF EXISTS "Visualizzazione pubblica avatar" ON storage.objects;
DROP POLICY IF EXISTS "Visualizzazione avatar" ON storage.objects;
DROP POLICY IF EXISTS "Caricamento avatar" ON storage.objects;
DROP POLICY IF EXISTS "Caricamento avatar consentito" ON storage.objects;
DROP POLICY IF EXISTS "Eliminazione avatar" ON storage.objects;

-- Creazione policy storage
CREATE POLICY "Visualizzazione pubblica immagini ricette"
    ON storage.objects FOR SELECT USING (bucket_id = 'recipe-images');

CREATE POLICY "Caricamento pubblico immagini ricette"
    ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'recipe-images');

CREATE POLICY "Eliminazione immagini ricette"
    ON storage.objects FOR DELETE USING (bucket_id = 'recipe-images');

CREATE POLICY "Visualizzazione pubblica avatar"
    ON storage.objects FOR SELECT USING (bucket_id = 'avatars');

CREATE POLICY "Caricamento avatar"
    ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'avatars');
