CREATE TABLE "companies" (
  "id" VARCHAR(64) PRIMARY KEY,
  "company_code" VARCHAR(64) NOT NULL UNIQUE,
  "name" VARCHAR(160) NOT NULL,
  "email" VARCHAR(160) NOT NULL UNIQUE,
  "password_hash" VARCHAR(255) NOT NULL,
  "city" VARCHAR(120) NOT NULL,
  "street" VARCHAR(160) NOT NULL,
  "number" VARCHAR(40) NOT NULL,
  "phone" VARCHAR(60) NOT NULL,
  "role" VARCHAR(20) NOT NULL DEFAULT 'user',
  "created_at" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  "updated_at" TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE "services" (
  "id" VARCHAR(64) PRIMARY KEY,
  "company_id" VARCHAR(64) NOT NULL REFERENCES "companies"("id") ON DELETE RESTRICT,
  "title" VARCHAR(160) NOT NULL,
  "capacity_per_shift" INTEGER NOT NULL,
  "description" TEXT NOT NULL,
  "duration" INTEGER NOT NULL,
  "price" NUMERIC(10, 2) NOT NULL,
  "sign_price" NUMERIC(10, 2) NOT NULL,
  "created_at" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  "updated_at" TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE "service_slots" (
  "id" VARCHAR(64) PRIMARY KEY,
  "service_id" VARCHAR(64) NOT NULL REFERENCES "services"("id") ON DELETE CASCADE,
  "company_id" VARCHAR(64) NOT NULL,
  "starts_at" TIMESTAMPTZ NOT NULL,
  "capacity" INTEGER NOT NULL CHECK ("capacity" > 0),
  "reserved" INTEGER NOT NULL DEFAULT 0 CHECK ("reserved" >= 0),
  "created_at" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  "updated_at" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT "service_slots_reserved_capacity" CHECK ("reserved" <= "capacity")
);

CREATE TABLE "appointments" (
  "id" VARCHAR(64) PRIMARY KEY,
  "company_id" VARCHAR(64) NOT NULL REFERENCES "companies"("id") ON DELETE RESTRICT,
  "service_id" VARCHAR(64) NOT NULL REFERENCES "services"("id") ON DELETE RESTRICT,
  "slot_id" VARCHAR(64) NOT NULL REFERENCES "service_slots"("id") ON DELETE RESTRICT,
  "name" VARCHAR(120) NOT NULL,
  "last_name" VARCHAR(120) NOT NULL,
  "email" VARCHAR(160) NOT NULL,
  "dni" VARCHAR(40) NOT NULL,
  "phone" VARCHAR(60) NOT NULL,
  "date" TIMESTAMPTZ NOT NULL,
  "payment_id" VARCHAR(120),
  "status" VARCHAR(20) NOT NULL DEFAULT 'scheduled',
  "service_title_snapshot" VARCHAR(160) NOT NULL,
  "service_duration_snapshot" INTEGER NOT NULL,
  "service_price_snapshot" NUMERIC(10, 2) NOT NULL,
  "created_at" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  "updated_at" TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE UNIQUE INDEX "service_slots_service_id_starts_at_key"
  ON "service_slots" ("service_id", "starts_at");

CREATE INDEX "services_company_id_idx" ON "services" ("company_id");
CREATE INDEX "service_slots_company_id_starts_at_idx" ON "service_slots" ("company_id", "starts_at");
CREATE INDEX "service_slots_service_id_starts_at_idx" ON "service_slots" ("service_id", "starts_at");
CREATE INDEX "appointments_company_id_date_idx" ON "appointments" ("company_id", "date");
CREATE INDEX "appointments_service_id_date_idx" ON "appointments" ("service_id", "date");

