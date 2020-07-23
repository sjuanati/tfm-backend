SELECT
	et.id,
	et.earn_desc,
	et.earn_desc_long,
	et.earn_qty,
	et.validity_start_date,
	et.validity_end_date,
	et.photo,
	s.supplier_desc
FROM
	public.earn_tokens et
LEFT JOIN
	public.supplier s on et.supplier_id = s.supplier_id;
