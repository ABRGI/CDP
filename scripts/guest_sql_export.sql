SET startDate.var = '2023-09-01';
SET endDate.var = '2023-09-28';

SELECT
    g.id as id,
    r.id as reservation_id,
    room_alias,
    guest_index,
    first_name,
    last_name,
    nationality,
    email,
    mobile,
    ssn,
    date_of_birth,
    purpose_of_visit,
    age,
    passport_number,
    g.marketing_permission as marketing_permission,
    iso_country_code,
    signature_id
FROM reservation as r
INNER JOIN guest g ON g.reservation_id = r.id
WHERE r.check_out BETWEEN current_setting('startDate.var')::TIMESTAMP AND (current_setting('endDate.var')::DATE + interval '1' day)::TIMESTAMP
;