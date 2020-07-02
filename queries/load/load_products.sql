INSERT INTO public.product (
    product_id,
    product_id_app,
    product_desc,
    search_criteria,
    supplier_id,
    dose,
    ean13,
    price,
    creation_date,
    update_date
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
    $10
);