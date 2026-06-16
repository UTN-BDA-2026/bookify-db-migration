BEGIN;

SELECT id, capacity, reserved
FROM service_slots
WHERE id = $1
FOR UPDATE;

UPDATE service_slots
SET reserved = reserved + 1,
    updated_at = NOW()
WHERE id = $1
  AND reserved < capacity;

INSERT INTO appointments (
  id,
  company_id,
  service_id,
  slot_id,
  name,
  last_name,
  email,
  dni,
  phone,
  date,
  payment_id,
  status,
  service_title_snapshot,
  service_duration_snapshot,
  service_price_snapshot
)
VALUES (
  $2, $3, $4, $1, $5, $6, $7, $8, $9, $10, NULL, 'scheduled', $11, $12, $13
);

COMMIT;

