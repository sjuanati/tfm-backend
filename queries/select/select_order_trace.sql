SELECT
	ot.trace_id,
	ot.order_id,
	ot.order_id_app,
	ot.order_status,
	ot.order_date,
	ot.pharmacy_id,
	ot.user_id,
	ot.order_items,
	ot.product_ids,
	ot.db_hash,
	ot.tx_hash,
	ot.block_number,
	os.status_desc,
	u.id,
	u.name,
	p.pharmacy_id,
	p.pharmacy_desc
FROM
	public.order_trace ot
LEFT JOIN
	public.order_status os
	ON ot.order_status = os.status_id
LEFT JOIN
	public.user u
	ON ot.user_id = u.id
LEFT JOIN
	public.pharmacy p
	ON ot.pharmacy_id = p.pharmacy_id
WHERE
	ot."order_id" = $1
ORDER BY
	order_status;
