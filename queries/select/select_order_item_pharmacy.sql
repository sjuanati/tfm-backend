SELECT
	o.order_id,
	o.order_item,
	o.item_desc,
	o.photo,
	o.status,
	os.status_desc,
	u.id as "user_id",
	u.name,
	p.pharmacy_id, 
	p.pharmacy_desc,
	o.creation_date,
	o.total_price,
	o.comments
FROM 
	public."pharmacy" p,
	public."user" u,
	public."order_status" os,
	public."order" o
WHERE
	p.pharmacy_id = $1
AND o.order_id = $2
AND o.pharmacy_id = p.pharmacy_id
AND o.user_id = u.id 
AND o.status = os.status_id
ORDER BY
	o.status asc, 
	o.creation_date desc, 
	order_id asc, 
	order_item asc;