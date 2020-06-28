SELECT
	status,
	count(distinct(order_id)) as "total"
FROM
	public.order
WHERE
	pharmacy_id = $1
GROUP BY
	status;
