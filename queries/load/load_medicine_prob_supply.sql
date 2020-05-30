INSERT INTO public.medicine_prob_supply
  (pack_id,
   pack_desc,
   problem_type,
   problem_desc,
   "start_date",
   "end_date",
   active,
   update_date)
SELECT 
   cn,
   nombre,
   tipoproblemasuministro,
   observ,
   fini,
   ffin,
   activo,
   now() AT TIME ZONE 'UTC-2' 
FROM 
   staging.tmp_medicine_prob_supply;
