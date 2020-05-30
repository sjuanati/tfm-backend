INSERT INTO
	public.address (
	"address_id",
	"status",
	"street",
	"locality",
	"zip_code",
	"country",
    "update_date"
    )
VALUES (
	$1,
	1,
	$2,
	$3,
	$4,
	$5,
    $6
);
