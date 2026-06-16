# 03. Modelo PostgreSQL

Lineamientos del rediseño:

- `companies`, `services`, `service_slots`, `appointments`.
- claves foraneas, unicidad, restricciones y timestamps consistentes.
- Prisma como capa principal de schema/migraciones.
- SQL puntual para indices, transacciones y analisis con `EXPLAIN`.

Decisiones centrales:

- eliminar listas duplicadas y derivar relaciones desde `appointments`
- mover la disponibilidad a `service_slots`
- guardar snapshots minimos del servicio en `appointments`
- imponer `UNIQUE(service_id, starts_at)` y checks de capacidad
- usar transaccion con bloqueo de slot para la reserva
