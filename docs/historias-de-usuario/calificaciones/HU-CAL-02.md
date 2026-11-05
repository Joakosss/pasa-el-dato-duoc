# HU-CAL-02 — Ver calificaciones y promedio de un usuario en su perfil

**Como** usuario de la comunidad
**quiero** ver las calificaciones recibidas por un usuario y su promedio en su perfil
**para** decidir con quién transaccionar basándome en su reputación.

## Criterios de aceptación

- **Dado** que un usuario recibió calificaciones,
  **cuando** consulto su perfil,
  **entonces** el sistema muestra su promedio de puntaje y el total de calificaciones recibidas.

- **Dado** que un usuario recibió calificaciones con comentarios,
  **cuando** consulto su perfil,
  **entonces** puedo revisar las calificaciones individuales (puntaje y comentario) recibidas en sus transacciones.

- **Dado** que se registra una calificación nueva,
  **cuando** consulto el perfil del usuario calificado,
  **entonces** el promedio refleja la calificación nueva.

- **Dado** que un usuario no tiene calificaciones,
  **cuando** consulto su perfil,
  **entonces** el sistema muestra el perfil sin promedio o con un indicador de sin calificaciones, sin errores.

- **Dado** que no estoy autenticado,
  **cuando** intento consultar calificaciones de un perfil,
  **entonces** el sistema redirige al inicio de sesión.

## Reglas de negocio

Aprobadas documentalmente (R.13, CU017 extendido):

- La calificación queda registrada y visible en el perfil del usuario calificado (postcondición CU017).
- Al guardar una calificación, el sistema actualiza el promedio del usuario calificado (CU017, curso normal).
- Las calificaciones y el promedio son visibles solo para usuarios autenticados (decisión aprobada).

Fuera de alcance de esta HU: elaborar calificaciones (HU-CAL-01), responder calificaciones, moderación o eliminación de calificaciones, métricas del dashboard (R.34).

Nota técnica de origen (no define diseño): `Calificacion` no existe aún en el `schema.prisma`; el MER del proyecto la define como tabla de negocio.

## Dependencias

- HU-CAL-01 (registro de calificaciones).
- Perfil de usuario consultable (HU-PERF existentes, módulo perfil).
- Usuarios autenticados (módulo auth existente).

## Prioridad

**Media**

Postcondición directa de HU-CAL-01: sin esta visibilidad la calificación no genera confianza. Va después de HU-CAL-01.

## Dudas pendientes

- Paginación del detalle de calificaciones individuales: no definida (proponemos alinear con el catálogo y favoritos al decidir en spec). No bloqueante.

## Estado

`lista` — lista para comenzar `explore → proposal → spec + design → tasks → apply-progress → verify-report → archive-report`. Depende de HU-CAL-01.
