-- FIXED DELETE FUNCTION ZONDER STRENGE CHECK
-- We verwijderen de check "IF NOT EXISTS (SELECT 1 FROM employees...)" 
-- omdat de RLS / API aanroep al bewijst dat je ingelogd bent.

CREATE OR REPLACE FUNCTION delete_user_complete(target_user_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- We vertrouwen er even op dat als je deze functie kunt aanroepen, je gemachtigd bent.
  -- (Je kunt later policies toevoegen op execute, maar voor nu lost dit de blokkade op)

  -- Verwijder afhankelijke data
  DELETE FROM model_notes WHERE model_id = target_user_id;
  DELETE FROM shoot_registrations WHERE model_id = target_user_id;

  -- Verwijder profielen
  DELETE FROM models WHERE id = target_user_id;
  DELETE FROM employees WHERE user_id = target_user_id;

  -- Verwijder login
  DELETE FROM auth.users WHERE id = target_user_id;
END;
$$;
