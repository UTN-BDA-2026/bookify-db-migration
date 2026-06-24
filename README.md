# Bookify DB Study

Repositorio dedicado al trabajo final de Base de Datos para Bookify. Compara una `MongoDB baseline` que replica la estructura conceptual actual del backend original con una `PostgreSQL optimizada` rediseñada con buenas practicas relacionales.

## Objetivo

- Generar un dataset sintetico, reproducible y equivalente para ambos motores.
- Cargar el mismo dataset logico en MongoDB y PostgreSQL.
- Ejecutar benchmarks comparables sobre operaciones de turnos.
- Documentar resultados, decisiones tecnicas y evidencia para la defensa.

## Estructura tecnica

```text
.
├── docs/
├── mongo-baseline/
├── postgres-optimized/
├── dataset-tools/
├── docker-compose.yml
├── package.json
└── tsconfig.base.json
```

### Raiz

- `package.json`: orquestacion con npm workspaces.
- `docker-compose.yml`: MongoDB, PostgreSQL y herramientas visuales.
- `.env.example`: variables de entorno.

### `mongo-baseline/`

- Replica el dominio actual de Bookify con sus relaciones duplicadas y limitaciones relevantes.
- Incluye modelos, scripts de carga, benchmark y backup/restore.

### `postgres-optimized/`

- Contiene el esquema Prisma, SQL puntual para indices, transacciones y `EXPLAIN`, y benchmarks.
- Separa acceso ORM de consultas/manual SQL para justificar decisiones tecnicas.

### `dataset-tools/`

- Genera el dataset reproducible del dominio logico `companies/services/slots/appointments`.
- Centraliza comparacion de metricas y formatos de salida del informe.

## Flujo inicial

1. Copiar `.env.example` a `.env` y completar variables de entorno.
2. Ejecutar `npm run setup` para instalar dependencias, levantar Docker, aplicar migraciones, generar el dataset y cargarlo en ambas bases.

Alternativa paso a paso:

1. `npm install`
2. `npm run docker:up`
3. `npm run postgres:deploy`
4. `npm run postgres:generate`
5. `npm run dataset:generate`
6. `npm run dataset:load:mongo` y `npm run dataset:load:postgres`

## Comandos publicos

```bash
npm run setup
npm run reset
npm run dataset:generate
npm run dataset:load:mongo
npm run dataset:load:postgres
npm run bench:mongo
npm run bench:postgres
npm run bench:compare
npm run backup:mongo
npm run restore:mongo
npm run backup:postgres
npm run restore:postgres
```

## Estado actual

El repo queda preparado para generar dataset, cargar ambas bases, correr benchmarks y producir reportes comparativos. Mongo conserva a proposito las duplicaciones del modelo original para servir como baseline experimental.
