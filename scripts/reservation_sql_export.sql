SET startDate.var = '2023-09-01';
SET endDate.var = '2023-09-28';

SELECT
    reservation.id as id,
    version,
    reservation_code,
    uuid,
    hotel_id,
    lang,
    total_paid,
    reservation.currency,
    customer_first_name,
    customer_last_name,
    customer_mobile,
    customer_address,
    customer_postal_code,
    customer_city,
    customer_ssn,
    customer_date_of_birth,
    customer_purpose_of_visit,
    customer_nationality,
    company_name,
    company_reference,
    booking_channel,
    booking_channel_reservation_id,
    check_in,
    check_out,
    created,
    confirmed,
    cancelled,
    is_fully_refunded,
    pending_confirmation_since,
    change_type,
    state,
    notify_customer,
    is_overrided,
    type,
    modified_by,
    marketing_permission,
    customer_email_real,
    customer_email_virtual,
    total_paid_extra_for_ota,
    breakfasts_for_all,
    company_y_tunnus,
    customer_passport_number,
    member_id,
    customer_iso_country_code,
    cancellation_reason,
    reservation_extra_info,
    h.label as hotel
FROM reservation
INNER JOIN hotel as h ON reservation.hotel_id = h.id
WHERE check_out BETWEEN current_setting('startDate.var')::TIMESTAMP AND (current_setting('endDate.var')::DATE + interval '1' day)::TIMESTAMP --Comment/Remove this line to query all reservations
ORDER BY id ASC;