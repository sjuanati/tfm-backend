
INSERT INTO public.medicine_rel_atc 
  (medicine_id,
   atc_id,
   atc_desc,
   level,
   update_date)
SELECT 
   nregistro,
   codigo,
   nombre,
   nivel,
   now() AT TIME ZONE 'UTC-2' 
FROM 
   staging.tmp_medicine_rel_atc;
