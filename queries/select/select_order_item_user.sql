-- SELECT
-- 	o.order_id,
-- 	o.order_item,
--     o.order_id_app,
-- 	o.item_desc,
--     o.product_desc,
-- 	o.photo,
-- 	o.status,
-- 	os.status_desc,
-- 	u.id as "user_id",
-- 	u.name,
-- 	p.pharmacy_id, 
-- 	p.pharmacy_desc,
-- 	o.creation_date,
--     o.price,
--     o.total_price,
--     o.comments
-- FROM 
-- 	public."pharmacy" p,
-- 	public."user" u,
-- 	public."order_status" os,
-- 	public."order" o
-- WHERE
-- 	o.user_id = $1
-- AND o.order_id = $2
-- AND o.pharmacy_id = p.pharmacy_id
-- AND o.user_id = u.id 
-- AND o.status = os.status_id
-- ORDER BY
-- 	o.status asc, 
-- 	o.creation_date desc, 
-- 	order_id asc, 
-- 	order_item asc;

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
    prod.product_id,
    prod.dose_qty,
    prod.dose_form,
    prod.leaflet_url
FROM
	public."order" o
LEFT JOIN 
	public."pharmacy" p
	ON o.pharmacy_id = p.pharmacy_id
LEFT JOIN
	public."user" u
	ON o.user_id = u.id
LEFT JOIN
	public."order_status" os
	ON o.status = os.status_id
LEFT JOIN
	public."product" prod
	ON o.product_id = prod.product_id
WHERE
	o.user_id = $1
AND o.order_id = $2
ORDER BY
	o.status asc, 
	o.creation_date desc, 
	order_id asc, 
	order_item asc;
