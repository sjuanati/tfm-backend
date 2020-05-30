
INSERT INTO public.medicine_rel_pack 
  (medicine_id,
   pack_id,
   pack_desc,
   auth_date,
   susp_date,
   rev_date,
   sellable,
   supply_problem,
   update_date)
SELECT 
   nregistro,
   cn,
   nombre,
   aut,
   susp,
   rev,
   comerc,
   psum,
   now() AT TIME ZONE 'UTC-2' 
FROM 
   staging.tmp_medicine_rel_pack;
