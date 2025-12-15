-- Maak een tabel voor shoots/projecten
CREATE TABLE IF NOT EXISTS public.shoots (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  client_name text NOT NULL,
  client_logo_url text,
  shoot_date date,
  description text,
  location text,
  status text DEFAULT 'open',
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Enable Row Level Security
ALTER TABLE public.shoots ENABLE ROW LEVEL SECURITY;

-- Maak policy zodat iedereen shoots kan lezen (voor model registratie pagina)
CREATE POLICY "Iedereen kan shoots lezen"
  ON public.shoots
  FOR SELECT
  USING (true);

-- Maak policy zodat alleen geauthenticeerde gebruikers shoots kunnen aanmaken/bewerken
CREATE POLICY "Authenticated users kunnen shoots beheren"
  ON public.shoots
  FOR ALL
  USING (auth.role() = 'authenticated')
  WITH CHECK (auth.role() = 'authenticated');

-- Voeg een paar voorbeeld shoots toe
INSERT INTO public.shoots (client_name, client_logo_url, shoot_date, description, location, status)
VALUES 
  ('La Cazuela', 'https://via.placeholder.com/150/2B3E72/FFFFFF?text=La+Cazuela', '2025-01-15', 'Fotoshoot voor nieuw menu. We zoeken 2 modellen voor een gezellige setting.', 'Rotterdam Centrum', 'open'),
  ('Urban Beats', 'https://via.placeholder.com/150/E5DDD5/2B3E72?text=Urban+Beats', '2025-01-20', 'Muziek video opnames. Energieke modellen gezocht!', 'Rotterdam Noord', 'open'),
  ('Green Life Cafe', 'https://via.placeholder.com/150/4CAF50/FFFFFF?text=Green+Life', '2025-01-25', 'Content creatie voor social media campagne.', 'Rotterdam Zuid', 'open')
ON CONFLICT DO NOTHING;
