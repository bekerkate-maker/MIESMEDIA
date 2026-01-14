-- RUN DEZE CODE IN JE SUPABASE SQL EDITOR OM DE FOUTMELDING OP TE LOSSEN

-- Optie 1: RLS uitzetten voor shoots (makkelijkste, alle bezoekers kunnen aanpassen)
ALTER TABLE public.shoots DISABLE ROW LEVEL SECURITY;

-- Optie 2: Als je RLS aan wilt laten staan maar iedereen toegang wilt geven (alternatief)
-- CREATE POLICY "Iedereen mag alles met shoots"
-- ON public.shoots
-- FOR ALL
-- USING (true)
-- WITH CHECK (true);
