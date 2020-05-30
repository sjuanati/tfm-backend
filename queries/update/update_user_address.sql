UPDATE
	public.address
SET
	"street" = $2,
	"locality" = $3,
	"zip_code" = $4,
	"country" = $5,
    "update_date" = $6
WHERE
	address_id = $1;