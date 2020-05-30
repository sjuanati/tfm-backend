UPDATE
	public.pharmacy
SET
	"pharmacy_desc" = $2,
    "phone_number" = $3,
    "email" = $4,
    "update_date" = $5
WHERE
	"pharmacy_id" = $1;
