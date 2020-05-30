
INSERT INTO public.medicine_rel_excipient 
  (medicine_id,
   excipient_id,
   excipient_desc,
   qty,
   uom,
   "order",
   update_date)
SELECT 
   nregistro,
   id,
   nombre,
   cantidad,
   unidad,
   orden,
   now() AT TIME ZONE 'UTC-2' 
FROM 
   staging.tmp_medicine_rel_excipient;
