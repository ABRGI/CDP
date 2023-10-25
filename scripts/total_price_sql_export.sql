/*
Total price to be paid per reservation (excluding broken items)
*/

SELECT reservation_id, SUM(li.price) as total_price
	FROM line_item li
	INNER JOIN reservation r ON li.reservation_id = r.id
	WHERE li.product_id NOT IN (6)
		AND ((r.cancelled IS NULL AND ((li.cancelled IS NULL AND li.to_be_cancelled IS NULL)))
			OR (r.cancelled IS NOT NULL))
	GROUP BY reservation_id