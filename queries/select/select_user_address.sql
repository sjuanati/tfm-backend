SELECT
    a.*
FROM 
	public.address a
WHERE
	a.address_id = $1;
