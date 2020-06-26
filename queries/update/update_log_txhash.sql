UPDATE
	public.log
SET
	"txhash" = $2,
    "update_date" = $3
WHERE
	"log_id" = $1;