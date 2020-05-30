SELECT
	count(distinct(m1."userId")) as unseen,
	m2.total as total
FROM
	public.message m1,
	(SELECT
		count(distinct("userId")) as total
	FROM
		public.message
	WHERE
		"pharmacyId" = 5) m2
WHERE
	"pharmacyId" = $1
AND "from" = 'user'
AND "seen" = 'false'
GROUP BY
	m2.total;
