UPDATE
	public.order_trace
SET
	"txhash" = $2,
    "update_date" = $3
WHERE
	"trace_id" = $1;