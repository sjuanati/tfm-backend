UPDATE
	public.user
SET
	"name" = $2,
    "gender" = $3,
    "email" = $4,
    "birthday" = $5,
    "phone" = $6,
    "updatedAt" = $7
WHERE
	id = $1;
