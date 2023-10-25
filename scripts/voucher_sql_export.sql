SELECT reservation_id,
  voucher_id,
  voucher_key
  FROM line_item
  INNER JOIN discount_voucher as d ON voucher_id=d.id
  WHERE voucher_id IS NOT NULL;