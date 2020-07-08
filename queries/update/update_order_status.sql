UPDATE
	public.order
SET
	"status" = $2,
    "update_date" = $3
WHERE
	"order_id" = $1;
