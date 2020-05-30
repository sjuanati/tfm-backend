SELECT DISTINCT
	o.order_id,
	o.status,
	os.status_desc,
	u.name,
	p.pharmacy_desc,
	o.creation_date,
	o.total_price,
	COALESCE(msg."unseen", 0) as unseen
FROM 
	public."pharmacy" p,
	public."user" u,
	public."order_status" os,
	public."order" o
LEFT JOIN
	(SELECT
		c."id",
		c."userId",
		c."pharmacyId",
		count(*) as unseen
	FROM
		public.CHAT c,
		public.MESSAGE m
	WHERE
		c."id" = m."chatId"
	AND c."userId" = m."userId"
	AND c."pharmacyId" = m."pharmacyId"
	AND m."seen" = false
	AND m."from" = 'user'
	GROUP BY
		c."id", c."userId", c."pharmacyId"
	) msg ON 
		o.user_id = msg."userId"
	AND o.pharmacy_id = msg."pharmacyId"
WHERE
	p.pharmacy_id = $1
AND o.pharmacy_id = p.pharmacy_id
AND o.user_id = u.id 
AND o.status = os.status_id
ORDER BY
	o.status asc, o.creation_date desc;
