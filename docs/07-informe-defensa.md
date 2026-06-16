# Informe de defensa - Bookify DB Study

## 1. Resumen ejecutivo

El proyecto compara dos implementaciones del dominio Bookify, una aplicacion de gestion de turnos para empresas y servicios:

- **MongoDB baseline**: replica la estructura conceptual del backend original, con documentos denormalizados y listas duplicadas.
- **PostgreSQL optimizada**: rediseña el mismo dominio con modelo relacional, constraints, claves foraneas, indices especificos y transacciones.

El objetivo no fue demostrar que un motor sea siempre mejor que el otro, sino estudiar que cambia cuando el mismo problema se modela con un enfoque documental y con un enfoque relacional. Para que la comparacion sea defendible, ambos motores cargan el mismo dataset sintetico reproducible y ejecutan los mismos casos de benchmark.

## 2. Caso inicial y problema detectado

Bookify trabaja con empresas, servicios, disponibilidad horaria y reservas. En el modelo baseline de MongoDB aparecen estas caracteristicas:

- `Company` conserva listas de servicios y turnos programados.
- `Service` contiene `availableAppointments` y `scheduledAppointments`.
- `Appointment` referencia empresa y servicio, pero no hay claves foraneas ni restricciones de integridad reales.
- La reserva de un turno actualiza varios documentos: crea el appointment, modifica disponibilidad del servicio y agrega la referencia en la empresa.

Esta estructura es valida como diseño documental cuando se priorizan lecturas directas y documentos autocontenidos. Sin embargo, para este dominio hay operaciones criticas donde la consistencia importa mas que la simple velocidad de lectura: reservar, cancelar, evitar sobreventa de cupos, mantener historial y auditar cambios.

El problema principal era que la disponibilidad y las reservas quedaban repartidas entre documentos y arrays duplicados. Eso aumenta el riesgo de inconsistencias si una operacion falla a mitad de camino o si dos reservas compiten por el mismo cupo.

## 3. Propuesta de rediseño

La version PostgreSQL organiza el dominio en tablas normalizadas:

- `companies`
- `services`
- `service_slots`
- `appointments`

Las decisiones principales fueron:

- Eliminar listas duplicadas y obtener las relaciones desde `appointments`.
- Mover la disponibilidad a `service_slots`, con `capacity` y `reserved`.
- Agregar `UNIQUE(service_id, starts_at)` para evitar slots duplicados por servicio y horario.
- Usar claves foraneas entre reservas, empresas, servicios y slots.
- Mantener snapshots minimos del servicio en `appointments` para conservar el valor historico mostrado al cliente al momento de reservar.
- Usar Prisma para schema, migraciones y consultas comunes, combinado con SQL manual en operaciones donde se necesita control fino.

## 4. Temas de la cursada implementados

El proyecto implementa seis temas de la consigna, aunque solo se exigian cuatro.

### 4.1 Backup & Restore

Se implementaron scripts de backup y restore para ambos motores.

En PostgreSQL:

- `postgres-optimized/src/scripts/backup.ts` ejecuta `pg_dump` dentro del contenedor `bookify-postgres` y genera `postgres-backup.dump`.
- `postgres-optimized/src/scripts/restore.ts` copia el dump al contenedor y ejecuta `pg_restore --clean --if-exists`.

En MongoDB:

- `mongo-baseline/src/scripts/backup.ts` ejecuta `mongodump --archive --gzip`.
- `mongo-baseline/src/scripts/restore.ts` ejecuta `mongorestore --archive --gzip --drop`.

Tambien existen comandos de alto nivel en la raiz del proyecto:

```bash
npm run backup:mongo
npm run restore:mongo
npm run backup:postgres
npm run restore:postgres
```

Justificacion: esto permite reconstruir la base de desarrollo, repetir pruebas y dejar evidencia de recuperacion ante errores de carga, benchmarks o cambios de schema.

### 4.2 Indices

En PostgreSQL se definieron indices orientados a las consultas reales del sistema:

- `idx_appointments_company_date` sobre `(company_id, date)`.
- `idx_appointments_service_date` sobre `(service_id, date)`.
- `idx_service_slots_service_datetime` como indice unico sobre `(service_id, starts_at)`.

Estos indices responden a los accesos principales:

- buscar turnos de una empresa por rango de fecha;
- buscar historial o turnos de un servicio;
- consultar disponibilidad por servicio y horario;
- impedir duplicacion de slots.

Justificacion: no se agregaron indices genericos "por las dudas". Cada indice corresponde a un caso de uso medido en los benchmarks o a una restriccion de negocio.

### 4.3 Transacciones

La reserva en PostgreSQL se ejecuta dentro de `client.$transaction`. La operacion:

1. Lee el slot con `SELECT ... FOR UPDATE`.
2. Verifica que exista y que `reserved < capacity`.
3. Obtiene datos del servicio para guardar snapshots.
4. Incrementa `reserved`.
5. Crea el appointment.

La cancelacion tambien es transaccional: elimina el appointment y decrementa el contador reservado del slot.

Justificacion: la reserva de turnos es una operacion critica. Si se crea el appointment pero no se actualiza el cupo, o si se descuenta el cupo pero falla la reserva, el sistema queda inconsistente. La transaccion evita esos estados intermedios.

### 4.4 Seguridad

El proyecto aplica buenas practicas de seguridad en el acceso a datos:

- Las credenciales se leen desde variables de entorno (`.env.example` documenta las variables).
- Prisma usa `env("POSTGRES_URL")` y `env("POSTGRES_SHADOW_URL")`.
- Las consultas SQL manuales usan interpolacion segura de Prisma con tagged templates, por ejemplo `WHERE id = ${input.slotId}`, evitando concatenar strings SQL.
- Los scripts no hardcodean usuarios, passwords ni URLs de conexion.

Justificacion: la consigna pide seguridad en conexion y consultas. En este proyecto se evita exponer secretos en codigo y se reducen riesgos de SQL injection al no construir consultas con strings concatenados.

### 4.5 ORM y sin ORM

La implementacion PostgreSQL combina:

- **ORM con Prisma** para schema, migraciones, relaciones, tipos y CRUD comun.
- **SQL manual** para puntos donde se necesita control explicito, como `FOR UPDATE`, scripts de indices y analisis con `EXPLAIN`.

Justificacion: usar solo ORM simplifica desarrollo, pero puede ocultar detalles importantes de concurrencia y performance. Usar solo SQL daria mas control, pero aumentaria el costo de mantenimiento. La decision fue hibrida: Prisma para productividad y SQL donde la base de datos debe expresar comportamiento critico.

### 4.6 NoSQL combinado con base relacional

El proyecto usa MongoDB como baseline NoSQL y PostgreSQL como version relacional optimizada.

MongoDB conserva valor cuando:

- se quieren documentos autocontenidos;
- la disponibilidad embebida permite lecturas directas rapidas;
- el modelo cambia con frecuencia y se prioriza flexibilidad.

PostgreSQL es mas conveniente para este caso cuando:

- hay reglas fuertes de integridad;
- se necesitan restricciones, claves foraneas y unicidad;
- las reservas requieren atomicidad;
- se quiere auditar historico sin depender de arrays duplicados.

Justificacion: la decision no es reemplazar NoSQL por dogma, sino mostrar que para turnos con cupos y concurrencia el modelo relacional reduce riesgos operativos.

## 5. Benchmarks y resultados

### 5.1 Dataset usado

El dataset fue generado con semilla fija `42`, escala `large`, y fecha de generacion `2026-06-13`.

Resumen:

| Entidad | Cantidad |
| --- | ---: |
| Empresas | 30 |
| Servicios | 300 |
| Slots | 90.000 |
| Turnos | 115.204 |

La metodologia garantiza que ambos motores reciben el mismo dataset logico y ejecutan la misma cantidad de iteraciones.

### 5.2 Resultados principales

| Operacion | Mongo avg ms | PostgreSQL avg ms | Lectura tecnica |
| --- | ---: | ---: | --- |
| Insercion simple de empresa | 1,29 | 0,73 | PostgreSQL fue mas rapido en este caso puntual. |
| Turnos por empresa y rango | 24,35 | 50,78 | Mongo resulto mas rapido en esta lectura del dataset probado. |
| Disponibilidad por servicio | 0,44 | 3,26 | Mongo gana porque la disponibilidad esta embebida en el documento del servicio. |
| Crear reserva | 4,48 | 2,18 | PostgreSQL gana aun haciendo transaccion y bloqueo. |
| Cancelar reserva | 6,54 | 1,31 | PostgreSQL gana con claridad por modelo mas directo y consistente. |
| Historial de empresa | 22,91 | 55,94 | Mongo fue mas rapido en esta consulta particular. |

Todos los casos ejecutaron 50 iteraciones y terminaron con 0 errores.

### 5.3 Interpretacion

Los resultados no muestran una victoria absoluta. Muestran un trade-off:

- MongoDB obtiene muy buen rendimiento en disponibilidad porque esa informacion esta embebida. La lectura es simple y evita joins.
- PostgreSQL mejora mucho en reserva y cancelacion, que son las operaciones de mayor riesgo de negocio.
- PostgreSQL paga costo en algunas lecturas porque el modelo esta mas normalizado y prioriza integridad.
- En una aplicacion real, las lecturas PostgreSQL podrian optimizarse con `EXPLAIN`, indices adicionales, vistas materializadas o caches especificos, sin renunciar a integridad.

La conclusion defendible es que el rediseño relacional mejora las garantias del sistema en las operaciones criticas, aunque algunas consultas de lectura del baseline documental sean mas rapidas.

## 6. Donde se cumple cada punto de la consigna

| Punto de la consigna | Evidencia en el proyecto | Estado |
| --- | --- | --- |
| Backup & Restore | Scripts `backup.ts` y `restore.ts` en MongoDB y PostgreSQL; comandos npm raiz | Cumplido |
| Indices | `postgres-optimized/sql/indexes.sql` y atributos `@@index`/`@@unique` en Prisma | Cumplido |
| Transacciones | `reserveAppointmentPostgres` y `cancelAppointmentPostgres` con `$transaction` y `FOR UPDATE` | Cumplido |
| Seguridad | `.env.example`, `env(...)` en Prisma, consultas parametrizadas con Prisma | Cumplido |
| ORM y/o sin ORM | Prisma + SQL manual para indices/transacciones/EXPLAIN | Cumplido |
| NoSQL | Comparacion Mongo baseline vs PostgreSQL optimizada | Cumplido |
| Particionado | No implementado; sugerido como mejora futura | No incluido |

## 7. Decisiones de diseño defendibles

### Normalizacion vs denormalizacion

MongoDB denormaliza para leer rapido datos cercanos. PostgreSQL normaliza para evitar duplicacion y representar restricciones de negocio. En Bookify, reservar y cancelar turnos tiene mayor criticidad que leer un documento embebido, porque un error puede vender mas cupos de los disponibles.

### Snapshots en appointments

Aunque el modelo esta normalizado, `appointments` guarda `service_title_snapshot`, `service_duration_snapshot` y `service_price_snapshot`. Esto evita que un cambio futuro en el servicio modifique la interpretacion historica de una reserva anterior.

### Indices compuestos

Los indices se eligieron por consultas reales, no por campos aislados. Por ejemplo, `(company_id, date)` responde a "turnos de una empresa en un rango", que es mas util que indexar solo `date`.

### Uso hibrido de Prisma y SQL

Prisma reduce errores en schema y acceso comun. SQL manual se reserva para lo que Prisma no expresa con la misma claridad, especialmente `FOR UPDATE`, indices y `EXPLAIN`.

### Mongo como baseline, no como enemigo

La baseline Mongo representa una decision tecnica posible y tiene resultados favorables en lecturas embebidas. El trabajo muestra por que, para este dominio particular, conviene rediseñar ciertas partes con garantias relacionales.

## 8. Sugerencias de imagenes para el documento o slides

1. **Diagrama antes/despues del modelo**: a la izquierda documentos Mongo con arrays embebidos; a la derecha tablas PostgreSQL con relaciones.
2. **Flujo de reserva**: pasos desde "cliente elige slot" hasta "appointment creado", destacando `FOR UPDATE` y transaccion.
3. **Grafico de barras de benchmarks**: comparar promedio ms por operacion entre Mongo y PostgreSQL.
4. **Matriz de cumplimiento de consigna**: check visual para Backup, Indices, Transacciones, Seguridad, ORM/SQL y NoSQL.
5. **Captura de scripts npm**: fragmento de `package.json` con comandos `backup`, `restore`, `bench` y `dataset`.
6. **Captura de Prisma schema**: parte de `ServiceSlot` y `Appointment` mostrando indices, unique y relaciones.
7. **Captura o esquema de Docker Compose**: mostrar que el entorno levanta MongoDB y PostgreSQL de forma reproducible.
8. **Linea de tiempo de una transaccion**: bloquear slot, validar capacidad, incrementar contador, insertar appointment, commit.

## 9. Guion sugerido para defensa de 15 minutos

| Minuto | Contenido |
| ---: | --- |
| 0:00 - 1:00 | Presentar Bookify y el problema de reservas con cupos. |
| 1:00 - 2:30 | Explicar baseline MongoDB y riesgos de duplicacion. |
| 2:30 - 4:00 | Mostrar rediseño PostgreSQL y modelo de tablas. |
| 4:00 - 7:30 | Recorrer temas de la cursada implementados. |
| 7:30 - 10:30 | Presentar benchmarks y explicar trade-offs. |
| 10:30 - 12:30 | Demo corta: comandos dataset, benchmark, backup/restore o transaccion. |
| 12:30 - 14:00 | Conclusiones y decisiones tecnicas. |
| 14:00 - 15:00 | Preguntas y mejoras futuras. |

## 10. Demo recomendada

Para la defensa conviene mostrar una demo breve y controlada:

```bash
npm run docker:up
npm run dataset:generate -- --scale=small
npm run dataset:load:mongo
npm run dataset:load:postgres
npm run bench:mongo
npm run bench:postgres
npm run bench:compare
```

Si el tiempo es corto, mostrar solo:

```bash
npm run bench:compare
cat dataset-tools/output/reports/benchmark-comparison.md
```

Para backup/restore:

```bash
npm run backup:postgres
npm run restore:postgres
```

## 11. Mejoras futuras

- Evaluar particionado por fecha en `appointments` si el volumen historico crece mucho.
- Agregar `EXPLAIN ANALYZE` antes y despues de nuevos indices.
- Probar concurrencia real con multiples reservas simultaneas sobre el mismo slot.
- Agregar vistas o caches para lecturas donde Mongo fue mas rapido.
- Automatizar los benchmarks en CI para dejar evidencia historica en GitHub.
- Incorporar metricas de uso de CPU/memoria, no solo latencia.

## 12. Conclusion

El trabajo cumple la consigna porque desarrolla una aplicacion de estudio con dos sistemas de base de datos, implementa mas de cuatro temas de la cursada y documenta decisiones tecnicas con evidencia.

La conclusion principal es que MongoDB ofrece lecturas rapidas cuando la informacion esta embebida, pero PostgreSQL aporta mejores garantias para las operaciones criticas de reserva y cancelacion. En Bookify, donde la sobreventa de cupos y la inconsistencia de turnos afectan directamente al negocio, el modelo relacional optimizado es una decision justificada.
