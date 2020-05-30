
INSERT INTO public.medicine_active_ing
  (active_ing_id,
   active_ing_code,
   active_ing_desc,
   update_date)
SELECT 
   id,
   code,
   max("name"),
   now() AT TIME ZONE 'UTC-2' 
FROM 
   staging.tmp_medicine_active_ing
GROUP BY
   id, 
   code, 
   now() AT TIME ZONE 'UTC-2';
