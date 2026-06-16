CREATE INDEX IF NOT EXISTS idx_appointments_company_date
  ON appointments (company_id, date);

CREATE INDEX IF NOT EXISTS idx_appointments_service_date
  ON appointments (service_id, date);

CREATE UNIQUE INDEX IF NOT EXISTS idx_service_slots_service_datetime
  ON service_slots (service_id, starts_at);

