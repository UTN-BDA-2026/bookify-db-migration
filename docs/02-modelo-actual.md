# 02. Modelo Actual

Resumen del backend original:

- MongoDB con Mongoose.
- Modelos principales: `Company`, `Service`, `Appointment`.
- `Company.services` y `Company.scheduledAppointments` duplican relaciones ya representadas en otras colecciones.
- `Service.availableAppointments` embebe slots con `capacity` y `taken`.
- `Service.scheduledAppointments` guarda fechas, mientras `Company.scheduledAppointments` guarda `ObjectId` de `Appointment`.
- `Appointment` referencia empresa y servicio, pero no existen FK ni constraints reales.

Problemas relevantes para la baseline:

- denormalizacion de relaciones
- disponibilidad embebida dentro del servicio
- riesgo de inconsistencia entre listas duplicadas y coleccion `Appointment`
- logica de ocupacion mezclada con estructura documental
- tipado inconsistente como `updateAt` en `Appointment`
