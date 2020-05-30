INSERT INTO public.medicine_dose_form 
  (dose_form_id,
   dose_form_desc,
   update_date)
SELECT 
   id,
   "name",
   now() AT TIME ZONE 'UTC-2' 
FROM 
   staging.tmp_medicine_dose_form;
