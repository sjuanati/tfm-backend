SELECT
	*
FROM
	public.order_trace
WHERE
	"order_id" = $1
ORDER BY
	order_status;