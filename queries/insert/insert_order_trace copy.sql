INSERT INTO
	public.order_trace (
	"trace_id",
	"order_id",
    "order_id_app",
	"order_item",
    "order_status",
    "order_date",
	"pharmacy_id",
	"user_id",
	"product_id",
    "hash",
    "update_date"
    )
VALUES (
	$1,
	$2,
	$3,
	$4,
	$5,
    $6,
    $7,
    $8,
    $9,
    $10,
    $11
);