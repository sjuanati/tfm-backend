
INSERT INTO public.medicine_rel_doc 
  (medicine_id,
   "type",
   url_pdf,
   url_html,
   section,
   creation_date,
   update_date)
SELECT 
   nregistro,
   tipo,
   "url",
   urlhtml,
   secc,
   fecha,
   now() AT TIME ZONE 'UTC-2' 
FROM 
   staging.tmp_medicine_rel_doc;
