
INSERT INTO public.medicine_admin_route 
  (admin_route_id,
   admin_route_desc,
   update_date)
SELECT 
   id,
   "name",
   now() AT TIME ZONE 'UTC-2' 
FROM 
   staging.tmp_medicine_admin_route;
