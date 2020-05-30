INSERT INTO public.medicine_provider
  (provider_desc,
   update_date)
SELECT 
   "name",
   now() AT TIME ZONE 'UTC-2' 
FROM 
   staging.tmp_medicine_provider;
