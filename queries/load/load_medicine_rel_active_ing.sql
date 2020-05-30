
INSERT INTO public.medicine_rel_active_ing
  (medicine_id,
   active_ing_id,
   active_ing_code,
   active_ing_desc,
   qty,
   uom,
   "order",
   update_date)
SELECT 
   nregistro,
   id,
   codigo,
   nombre,
   cantidad,
   unidad,
   orden,
   now() AT TIME ZONE 'UTC-2' 
FROM 
   staging.tmp_medicine_rel_active_ing;

   
