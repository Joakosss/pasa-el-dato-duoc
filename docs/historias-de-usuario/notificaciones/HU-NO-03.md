# HU-NO-03 — Consultar historial de notificaciones

**Como** usuario con cuenta activa
**quiero** revisar mi historial de notificaciones y abrir la que me interesa
**para** retomar el contexto del evento (chat, publicación, reporte) en el lugar correcto.

## Criterios de aceptación

- **Dado** que soy un usuario autenticado,
  **cuando** accedo a la sección de notificaciones,
  **entonces** el sistema muestra mi historial con cada notificación y su fecha, las más recientes primero.

- **Dado** que existen notificaciones no consultadas en mi historial,
  **cuando** lo consulto,
  **entonces** el sistema las distingue de las ya consultadas (indicación de no leída).

- **Dado** que abro una notificación desde el historial,
  **cuando** la marco como consultada,
  **entonces** el sistema la redirige/a llega a la sección correspondiente según el evento (chat, publicación, reporte, sección administrativa correspondiente) y la deja como leída (CU021, paso 3).

- **Dado** que noizo ninguna notificación aún,
  **cuando** accedo al historial,
  **entonces** el sistema muestra el estado de vacío con un mensaje claro.

- **Dado** que no estoy autenticado,
  **cuando** intento consultar el historial,
  **entonces** el sistema redirige al inicio de sesión.

## Reglas de negocio

Aprobadas documentalmente (R.14, CU021) y resoluciones del proyecto:

- El historial es personal: cada usuario solo ve sus notificaciones.
- Toda notificación de evento queda registrada en el historial (postcondición CU021), independientemente de la preferencia push/correo.
- Abrir una notificación redirige a la sección del evento (CU021, paso 3) y la deja como leída.
- Fuera de alcance de esta HU: eliminar notificaciones del historial (no está documentado), y la configuración de canales (HU-NO-02).

Nota técnica de origen (no define diseño): el patrón vigente `notificacion_marca` ya registra tipo, mensaje, flag `leida` y fecha para marcas; el historial de usuario sigue la misma semántica.

## Subtareas

### Backend (BE)

- **HU-NO-03-BE01:** Definir contrato REST para listar historial de notificaciones del usuario autenticado: `GET /notificaciones` con paginación (cursor o page/pageSize) y orden por fecha desc.
- **HU-NO-03-BE02:** Definir DTO de respuesta: id, tipo, mensaje, leida, fecha y `dataJson` (metadata mínima para redirección: ids de chat/publicación/reporte según tipo).
- **HU-NO-03-BE03:** Validar sesión: el historial es personal; solo devuelve notificaciones del usuario autenticado (401 si no hay sesión).
- **HU-NO-03-BE04:** Implementar endpoint para marcar como leída: `PATCH /notificaciones/:id/leida` (idempotente), validando ownership.
- **HU-NO-03-BE05:** (Opcional según contrato) Endpoint de detalle: `GET /notificaciones/:id` para recuperar data completa previa a redirección.
- **HU-NO-03-BE06:** Asegurar consistencia: al abrir una notificación se marca como leída y queda persistida (CU021 paso 3).
- **HU-NO-03-BE07:** Swagger: documentar endpoints, DTOs y errores (401/403/404/422).
- **HU-NO-03-BE08:** Pruebas e2e: listado ordenado, paginación, distinguir leídas/no leídas, marcar como leída, no permitir acceso a notificación de otro usuario.

### Frontend (FE)

- **HU-NO-03-FE01:** Implementar pantalla “Notificaciones” con listado ordenado (más recientes primero) + estado vacío.
- **HU-NO-03-FE02:** Diferenciar visualmente notificaciones no leídas vs leídas (badge/estilo).
- **HU-NO-03-FE03:** Al click/abrir una notificación: (1) marcar como leída, (2) redirigir a la sección correspondiente según `tipo` y metadata (chat/publicación/reporte/admin).
- **HU-NO-03-FE04:** Manejar paginación/carga incremental del historial.
- **HU-NO-03-FE05:** Manejar errores: sesión expirada, notificación inexistente, fallo al marcar como leída (mantener UI consistente).

## Dependencias

- HU-NO-01 (eventos que llenan el historial).
- Secciones de destino vigentes: chat, publicaciones, reportes, administración según catálogo de eventos.
- Usuarios autenticados (módulo auth existente).

## Prioridad

**Alta**

Completa el ciclo de CU021: sin historial ni redirección las notificaciones no devuelven valor. Va con HU-NO-01.

## Dudas pendientes

1. ¿Paginación del historial? Propuesta de proyecto: alineada al catálogo (20 web / 10 móvil). Confirmar en spec.
2. ¿El usuario puede borrar notificaciones de su historial? No está documentado; propuesta vigente: no se puede (solo lectura). Confirmar.

## Estado

`requiere aclaración` — dudas no bloqueantes para `explore`; propuestas marcadas en dejar ámbitos en spec.
