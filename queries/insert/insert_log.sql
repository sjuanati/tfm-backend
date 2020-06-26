INSERT INTO
	public.log (
	"log_id",
	"order_id",
	"order_item",
    "order_status",
    "order_date",
	"pharmacy_id",
	"user_id",
	"product_id",
    "hash"
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
    $9
);