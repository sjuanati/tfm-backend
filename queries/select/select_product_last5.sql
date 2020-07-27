SELECT
	distinct(product_id) as product_id,
	product_desc,
    price,
	max(creation_date) as max_date
FROM
	public.order
WHERE
	user_id = $1
GROUP BY
	product_id, product_desc, price
ORDER BY
	max_date desc
LIMIT 5;
