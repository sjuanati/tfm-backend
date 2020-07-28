SELECT
	distinct(o.product_id) as product_id,
	o.product_desc,
    o.price,
    p.dose_qty,
    p.dose_form,
    p.leaflet_url,
	max(o.creation_date) as max_date
FROM
	public."order" o
LEFT JOIN
	public.product p
	ON o.product_id = p.product_id
WHERE
	user_id = $1
GROUP BY
	o.product_id, 
	o.product_desc, 
	o.price, 
	p.dose_qty, 
	p.dose_form, 
	p.leaflet_url
ORDER BY
	max_date desc
LIMIT 5;
