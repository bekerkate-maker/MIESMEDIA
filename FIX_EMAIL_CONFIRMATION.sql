-- DIT SCRIPT BEVESTIGT AUTOMATISCH ALLE EMAILADRESSEN
-- Dit is nodig omdat je in een test-omgeving vaak geen echte bevestigingsmail kunt ontvangen.
-- Zonder bevestiging mag je van Supabase vaak niet inloggen ("Invalid login credentials").

UPDATE auth.users
SET email_confirmed_at = now()
WHERE email_confirmed_at IS NULL;

-- Laat zien welke accounts nu actief zijn
SELECT email, email_confirmed_at, last_sign_in_at FROM auth.users;
