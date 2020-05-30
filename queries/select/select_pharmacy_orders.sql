SELECT
	status,
	count(1) as "total"
FROM
	public.order
WHERE
	pharmacy_id = $1
GROUP BY
	status;
