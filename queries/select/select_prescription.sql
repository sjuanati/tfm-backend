SELECT
	pre.prescription_item,
	pre.product_id,
	pre.product_desc,
	pro.dose_qty,
	pro.dose_form,
	pro.price,
	pro.prescription
FROM
	public.prescription pre
LEFT JOIN
	public.product pro
	ON pre.product_id = pro.product_id
WHERE
	pre.ean13 = $1;
