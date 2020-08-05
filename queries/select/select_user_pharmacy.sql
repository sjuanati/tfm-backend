-- SELECT
--     up.pharmacy_id,
--     p.pharmacy_desc
-- FROM 
-- 	public.user_pharmacy up,
-- 	public.pharmacy p
-- WHERE 
-- 	up.pharmacy_id = p.pharmacy_id
-- AND up.user_id = $1
-- AND up.favorite is TRUE;


SELECT
    p.pharmacy_id,
    p.pharmacy_desc,
	p.eth_address
FROM 
	public.user u,
	public.pharmacy p
WHERE
	u.pharmacy_id = p.pharmacy_id
AND u.id = $1;