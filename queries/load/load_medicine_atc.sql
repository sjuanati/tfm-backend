INSERT INTO public.medicine_atc 
  (atc_id,
   atc_desc,
   update_date)
SELECT 
   id,
   "name",
   now() AT TIME ZONE 'UTC-2' 
FROM 
   staging.tmp_medicine_atc;
