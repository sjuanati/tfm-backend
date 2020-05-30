SELECT 
	m.medicine_id,
	m.medicine_desc,
	e.excipient_desc,
	ai.active_ing_desc,
	pack.pack_desc,
	pack.start_date,
	pack.end_date,
	pack.remarks,
	atc.atc_id,
	atc.atc_desc,
	a.admin_route_desc,
	d.url_html,
	d.url_pdf,
	ph.url_photo,
	ar.admin_route_desc
FROM 
	public.med_medicine m
FULL OUTER JOIN
	public.rel_med_active_ingredient ai on m.medicine_id = ai.medicine_id
FULL OUTER JOIN
	(SELECT 
		p.pack_desc, 
		p.medicine_id,
		ps.start_date,
		ps.end_date,
		ps.remarks
	FROM 
		public.rel_med_pack p 
	FULL OUTER JOIN
		public.med_prob_supply ps ON p.pack_id = ps.pack_id
	) pack ON m.medicine_id = pack.medicine_id
FULL OUTER JOIN
	public.rel_med_excipient e on m.medicine_id = e.medicine_id
FULL OUTER JOIN
	public.rel_med_administration_route a on m.medicine_id = a.medicine_id
FULL OUTER JOIN
	public.rel_med_atc atc on m.medicine_id = atc.medicine_id
FULL OUTER JOIN
	public.rel_med_doc d on m.medicine_id = d.medicine_id
FULL OUTER JOIN
	public.rel_med_photo ph on m.medicine_id = ph.medicine_id
FULL OUTER JOIN
	public.rel_med_administration_route ar on m.medicine_id = ar.medicine_id
WHERE
	(upper(m.medicine_desc) like $1 OR upper(ai.active_ing_desc) like $1)
AND d.type = 2; -- user prospect instead of technical info





