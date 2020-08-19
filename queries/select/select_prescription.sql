SELECT
	pre.prescription_item as "item_id",
	pre.product_id,
	pre.product_desc,
	pro.dose_qty,
	pro.dose_form,
	pro.price,
	pro.prescription,
	pro.leaflet_url
FROM
	public.prescription pre
LEFT JOIN
	public.product pro
	ON pre.product_id = pro.product_id
WHERE
	pre.ean13 = $1;
