# PostgreSQL Optimized

Implementacion relacional optimizada del dominio Bookify con Prisma como ORM principal y SQL puntual para indices, transacciones y analisis.

## Cobertura de la consigna

- `Indices`: definidos en `schema.prisma`, `prisma/migrations/0001_initial/migration.sql` y `sql/indexes.sql`.
- `Transacciones`: reserva atomica implementada en `src/services/operations.ts` y documentada en `sql/transactions.sql`.
- `Seguridad`: variables de entorno, credenciales fuera del codigo, Prisma y consultas parametrizadas.
- `ORM y/o Sin ORM`: Prisma para schema y carga; SQL puntual para bloqueo de filas, indices y `EXPLAIN`.
- `Backup & Restore`: scripts en `src/scripts/backup.ts` y `src/scripts/restore.ts` usando utilidades del contenedor PostgreSQL.
- `NoSQL`: la comparacion se completa contra `mongo-baseline`; este paquete representa la alternativa relacional optimizada.
