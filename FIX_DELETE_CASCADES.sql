-- DIT SCRIPT ZORGT DAT ALLES NETJES WORDT OPRUIMT ALS JE IEMAND VERWIJDERT
-- We voegen "ON DELETE CASCADE" toe aan de relaties.

-- 1. Notities koppelen aan model (verwijder notities als model weg is)
ALTER TABLE model_notes DROP CONSTRAINT IF EXISTS model_notes_model_id_fkey;

ALTER TABLE model_notes
ADD CONSTRAINT model_notes_model_id_fkey
FOREIGN KEY (model_id)
REFERENCES models(id)
ON DELETE CASCADE;

-- 2. Shoot registraties koppelen aan model (verwijder aanmeldingen als model weg is)
-- We doen dit voorzichtig omdat de foreign key naam kan verschillen.
-- Check of model_id bestaat? Ja, gebruikt in code.

DO $$
BEGIN
  -- Probeer constraint te droppen als hij bestaat
  BEGIN
    ALTER TABLE shoot_registrations DROP CONSTRAINT IF EXISTS shoot_registrations_model_id_fkey;
  EXCEPTION WHEN OTHERS THEN NULL; END;
  
  -- Nieuwe toevoegen
  ALTER TABLE shoot_registrations
  ADD CONSTRAINT shoot_registrations_model_id_fkey
  FOREIGN KEY (model_id)
  REFERENCES models(id)
  ON DELETE CASCADE;
END $$;

-- 3. Herlaad de delete functie voor de zekerheid met extra explicit deletes (safety net)
CREATE OR REPLACE FUNCTION delete_user_complete(target_user_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Check medewerker
  IF NOT EXISTS (SELECT 1 FROM employees WHERE user_id = auth.uid()) THEN
    RAISE EXCEPTION 'Geen toegang: Alleen medewerkers kunnen accounts verwijderen.';
  END IF;

  -- Verwijder afhankelijke data (voor het geval cascades falen)
  DELETE FROM model_notes WHERE model_id = target_user_id;
  DELETE FROM shoot_registrations WHERE model_id = target_user_id;

  -- Verwijder profielen
  DELETE FROM models WHERE id = target_user_id;
  DELETE FROM employees WHERE user_id = target_user_id;

  -- Verwijder login
  DELETE FROM auth.users WHERE id = target_user_id;
END;
$$;
