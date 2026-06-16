# 04. Metodologia de Pruebas

Casos minimos:

- insercion masiva
- turnos por empresa y rango de fechas
- disponibilidad por servicio
- creacion de reserva
- cancelacion de reserva
- historial de turnos

Metricas:

- tiempo total
- promedio por operacion
- errores
- comparacion entre motores

Protocolo:

- mismo dataset logico para Mongo y PostgreSQL
- mismas escalas `small`, `medium`, `large`
- mismas ventanas temporales y misma cantidad de iteraciones
- misma semilla para reproducibilidad

Amenazas a la validez:

- dataset sintetico, no trafico real
- entorno Docker local
- la baseline Mongo replica estructura conceptual, no una instancia productiva
