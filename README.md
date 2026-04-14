# Propuesta de Mejora de Base de Datos

Integrantes:
Faustino Durán-Ignacio Patiño-Valentino Araya

**Sistema de Turnos (tipo Bookify)**

---

## Propósito y Alcance

**Propósito**

Proponer una mejora estructural del modelo de base de datos de un sistema de turnos, aplicando buenas prácticas de diseño y normalización, basadas en los conceptos aprendidos en la materia.

**Alcance**

- Análisis del modelo actual basado en MongoDB
- Identificación de problemas estructurales
- Rediseño conceptual en PostgreSQL
- Aplicación de normalización hasta 3FN
- Mejora en integridad, rendimiento y mantenibilidad

**Nota**

El objetivo es diseñar una **nueva estructura optimizada**, manteniendo consistencia conceptual con el sistema original.

---

## Estado Actual de la Base de Datos

### Descripción General

El sistema actual utiliza MongoDB con un modelo orientado a documentos:

- Esquemas flexibles
- Uso de datos embebidos
- Optimización para lecturas rápidas

Este enfoque resulta adecuado en etapas iniciales, pero presenta limitaciones a medida que el sistema crece.

---

### Modelos Conceptuales

- **Appointments (citas)**: contienen datos del usuario, servicio y empresa, frecuentemente embebidos
- **Users (usuarios)**: información personal y de contacto
- **Services (servicios)**: datos como nombre, duración y precio
- **Companies (empresas)**: agrupan servicios y configuraciones
- **Payments / Reminders**: estructuras mixtas entre embebidos y colecciones separadas

---

### Problemas Estructurales

### Falta de normalización

- Información repetida en múltiples documentos
- Ejemplo: datos del servicio dentro de cada cita

### Redundancia de datos

- Duplicación de atributos (precio, nombre, duración)
- Mayor costo de almacenamiento y mantenimiento

### Problemas de integridad

- No existen restricciones formales
- Posibilidad de inconsistencias y datos inválidos

### Dificultad en consultas complejas

- Consultas analíticas poco eficientes
- Uso de pipelines complejos

### Anomalías de actualización

- Cambios en datos requieren múltiples modificaciones
- Riesgo de inconsistencias

---

## Propuesta de Mejora

### Justificación del Modelo Relacional (PostgreSQL)

- Mejora en la **integridad de los datos**
- Soporte para **relaciones complejas**
- Consultas más eficientes y claras
- Aplicación de restricciones a nivel base de datos

---

### Diseño Relacional Propuesto (3FN)

Entidades principales:

- **Users**
- **Companies**
- **Services**
- **Appointments**
- **Payments**
- **Reminders**
- **Subscriptions**
- **Audit / History**

Características:

- Separación clara de responsabilidades
- Uso de claves primarias (PK)
- Uso de claves foráneas (FK)
- Eliminación de redundancia

---

### Normalización

- **1FN**: eliminación de datos no atómicos
- **2FN**: eliminación de dependencias parciales
- **3FN**: eliminación de dependencias transitivas

Resultado:

- Datos consistentes
- Menor redundancia
- Mejor mantenibilidad

---

### Integridad y Reglas

- Claves foráneas entre entidades
- Constraints (NOT NULL, UNIQUE, CHECK)
- Estados controlados mediante enums
- Uso de transacciones para operaciones críticas

---

### Optimización

- Índices en campos clave (usuario, empresa, fecha)
- Índices compuestos para consultas frecuentes
- Uso opcional de JSONB para datos flexibles

---

## Consistencia con el Sistema Actual

El rediseño mantiene coherencia conceptual con el sistema original:

- Las mismas entidades principales (usuarios, citas, servicios)
- Misma lógica de negocio
- Reorganización estructural sin alterar el dominio

El objetivo es **mejorar el modelo**, no cambiar el funcionamiento del sistema.

---

## Buenas Prácticas Operativas

- Estrategia de backups
- Posibilidad de recuperación ante fallos
- Organización para escalabilidad futura
- Separación entre datos operativos y datos históricos

---

## Escalabilidad y Mantenimiento

- Posibilidad de particionado por fechas
- Soporte para replicación
- Uso de vistas materializadas para reporting
