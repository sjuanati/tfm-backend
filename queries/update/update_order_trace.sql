UPDATE
	public.order_trace
SET
	"tx_hash" = $2,
	"block_number" = $3,
    "update_date" = $4
WHERE
	"trace_id" = $1;