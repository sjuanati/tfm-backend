SELECT * 
FROM 
	public.pharmacy_schedule p
WHERE 
	p.pharmacy_id = $1
AND p.active = true;
