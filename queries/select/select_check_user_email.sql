SELECT
	count(1)
FROM
	public.user
WHERE
	email = $1;
