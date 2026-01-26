-- FIX UPDATE PERMISSIES
-- Dit script zorgt ervoor dat je je profiel kunt bijwerken, zelfs als identifiers niet 100% matchen,
-- zolang je emailadres in je token maar overeenkomt met het profiel.

-- 1. Verwijder/vervang de update policy
drop policy if exists "Enable update for users based on user_id" on models;
drop policy if exists "Enable update for users based on user_id_or_email" on models;

create policy "Enable update for users based on user_id_or_email"
on models for update
using (
  auth.uid() = id
  or
  (select auth.jwt() ->> 'email') = email
);
