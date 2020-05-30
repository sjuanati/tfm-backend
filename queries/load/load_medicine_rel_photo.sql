
INSERT INTO public.medicine_rel_photo 
  (medicine_id,
   "type",
   "url_photo",
   creation_date,
   update_date)
SELECT 
   nregistro,
   NULLIF(REPLACE(REPLACE(tipo,'materialas','1'),'formafarmac','2'),'')::INTEGER,
   "url",
   fecha,
   now() AT TIME ZONE 'UTC-2' 
FROM 
   staging.tmp_medicine_rel_photo;
