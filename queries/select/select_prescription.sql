SELECT
	*
FROM
	public.prescription
WHERE
	ean13 = $1;
