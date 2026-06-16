EXPLAIN ANALYZE
SELECT *
FROM appointments
WHERE company_id = 'company-001'
  AND date BETWEEN NOW() AND NOW() + INTERVAL '30 days';

EXPLAIN ANALYZE
SELECT *
FROM service_slots
WHERE service_id = 'service-0001'
  AND starts_at >= NOW()
ORDER BY starts_at;

