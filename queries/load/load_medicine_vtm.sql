
INSERT INTO public.medicine_vtm 
  (medicine_id,
   vtm_id,
   vtm_desc,
   update_date)
SELECT 
   nregistro,
   id,
   nombre,
   now() AT TIME ZONE 'UTC-2' 
FROM 
   staging.tmp_medicine_vtm;
