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

## Subtareas

### Backend (BE)

- **HU-CAL-02-BE01:** Definir contrato REST para consultar el resumen reputacional del usuario (promedio + total de calificaciones recibidas) en el perfil.
- **HU-CAL-02-BE02:** Definir contrato REST para listar calificaciones recibidas (paginación cursor o page/pageSize), incluyendo puntaje, comentario (si existe), fecha y referencia mínima a la transacción (según lo permitido).
- **HU-CAL-02-BE03:** Implementar queries Prisma eficientes: agregación (AVG/COUNT) y listado ordenado (fecha desc), evitando N+1.
- **HU-CAL-02-BE04:** Exigir autenticación: solo usuarios autenticados pueden consultar reputación/calificaciones.
- **HU-CAL-02-BE05:** Manejar caso sin calificaciones: responder sin promedio (p.ej. null) y total=0, sin error.
- **HU-CAL-02-BE06:** Swagger: documentar endpoints, DTOs y errores (401/404).
- **HU-CAL-02-BE07:** Pruebas unitarias/e2e: usuario con calificaciones, sin calificaciones, auth requerido, promedio actualizado tras nueva calificación (HU-CAL-01).

### Frontend (FE)

- **HU-CAL-02-FE01:** Extender la vista de perfil para mostrar promedio y total (solo autenticado; si no, redirigir a login).
- **HU-CAL-02-FE02:** Implementar listado de calificaciones recibidas con paginación/carga incremental.
- **HU-CAL-02-FE03:** Mostrar estado “sin calificaciones” cuando corresponda.
- **HU-CAL-02-FE04:** Manejo de errores: sesión expirada, usuario/perfil inexistente, fallas de red.

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
