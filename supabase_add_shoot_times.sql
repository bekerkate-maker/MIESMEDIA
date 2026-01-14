-- Voeg begintijd en eindtijd toe aan shoots tabel
ALTER TABLE shoots ADD COLUMN start_time VARCHAR(8);
ALTER TABLE shoots ADD COLUMN end_time VARCHAR(8);