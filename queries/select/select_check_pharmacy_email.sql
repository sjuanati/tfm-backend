SELECT
	count(1)
FROM
	public.pharmacy
WHERE
	email = $1;
