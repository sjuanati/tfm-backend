SELECT
	*
FROM
	public.order_trace ot,
	public.order_status os
WHERE
	"order_id" = $1
AND ot.order_status = os.status_id
ORDER BY
	order_status;