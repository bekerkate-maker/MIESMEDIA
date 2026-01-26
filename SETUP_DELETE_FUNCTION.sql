-- Functie om een gebruiker volledig te verwijderen (User + Model profiel)
-- Deze functie kan alleen worden aangeroepen door ingelogde medewerkers.

CREATE OR REPLACE FUNCTION delete_user_complete(target_user_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- 1. Controleer of de aanvrager een medewerker is
  IF NOT EXISTS (SELECT 1 FROM employees WHERE user_id = auth.uid()) THEN
    RAISE EXCEPTION 'Geen toegang: Alleen medewerkers kunnen accounts verwijderen.';
  END IF;

  -- 2. Verwijder het model profiel (als het bestaat)
  DELETE FROM models WHERE id = target_user_id;
  
  -- 3. Verwijder de employee profiel (als het bestaat)
  DELETE FROM employees WHERE user_id = target_user_id;

  -- 4. Verwijder de login-gebruiker (auth.users)
  DELETE FROM auth.users WHERE id = target_user_id;
END;
$$;
