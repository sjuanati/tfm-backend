INSERT INTO
	public.log (
	"log_id",
	"order_id",
	"order_item",
	"pharmacy_id",
	"user_id",
	"product_id",
    "user_ip",
    "creation_date",
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