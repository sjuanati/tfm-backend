SELECT
	o.order_id,
	o.order_item,
    o.order_id_app,
	o.item_desc,
    o.product_desc,
	o.photo,
	o.status,
	os.status_desc,
	u.id as "user_id",
	u.name,
	p.pharmacy_id, 
	p.pharmacy_desc,
	o.creation_date,
	o.price,
	o.total_price,
	o.comments,
	prod.prescription,
	prod.dose_qty,
	prod.dose_form,
	prod.leaflet_url
FROM 
	public."pharmacy" p,
	public."user" u,
	public."order" o
LEFT JOIN
	public."order_status" os
	ON o.status = os.status_id
LEFT JOIN
	public."product" as prod
	ON o.product_id = prod.product_id
WHERE 
	p.pharmacy_id = $1
AND o.order_id = $2
AND o.pharmacy_id = p.pharmacy_id
AND o.user_id = u.id 
ORDER BY
	o.status asc, 
	o.creation_date desc, 
	order_id asc, 
	order_item asc;
