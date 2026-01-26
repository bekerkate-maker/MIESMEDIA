-- DIT SCRIPT RESET HET WACHTWOORD VAN ALLE GEBRUIKERS NAAR: welcome123
-- Dit is een paardenmiddel om zeker te weten dat het wachtwoord klopt.

-- 1. Zorg dat we wachtwoorden kunnen versleutelen
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- 2. Update alle accounts:
--    - Zet wachtwoord op 'welcome123'
--    - Bevestig emailadres (voor het geval dat)
UPDATE auth.users
SET encrypted_password = crypt('welcome123', gen_salt('bf')),
    email_confirmed_at = COALESCE(email_confirmed_at, now()),
    raw_app_meta_data = raw_app_meta_data || '{"provider": "email", "providers": ["email"]}'::jsonb;

-- 3. Toon de gebruikers die nu kunnen inloggen
SELECT email, 'welcome123' as password,  email_confirmed_at FROM auth.users;
