
INSERT INTO public.medicine_rel_admin_route 
  (medicine_id,
   admin_route_id,
   admin_route_desc,
   update_date)
SELECT 
   nregistro,
   id,
   nombre,
   now() AT TIME ZONE 'UTC-2' 
FROM 
   staging.tmp_medicine_rel_admin_route;
