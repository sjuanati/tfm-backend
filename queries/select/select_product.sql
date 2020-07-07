SELECT
	*
FROM
	public.product
WHERE
	search_criteria like '%' || $1 || '%';
