# HU-NO-01 — Recibir notificaciones de eventos relevantes

**Como** usuario con cuenta activa
**quiero** recibir notificaciones de los eventos relevantes de mi cuenta
**para** enterarme oportunamente sin tener que revisar cada sección.

## Criterios de aceptación

- **Dado** que ocurre un evento relevante de mi cuenta (nuevo mensaje de chat, respuesta a reporte, publicación favorita vendida, advertencia administrativa con entrega activa, avisos que apliquen según el catálogo de eventos),
  **cuando** el sistema lo detecta,
  **entonces** genera una notificación dirigida a mí y la entrega según mi configuración de notificaciones vigente.

- **Dado** que tengo las notificaciones push habilitadas,
  **cuando** ocurre el evento,
  **entonces** el sistema envía la notificación push y, si corresponde, el correo automático asociado (CU021, curso normal).

- **Dado** que tengo las notificaciones push deshabilitadas,
  **cuando** ocurre el evento,
  **entonces** el sistema envía solo la notificación por correo electrónico (CU021, curso alternativo 1).

- **Dado** que el evento genera notificación,
  **cuando** la notificación se registra,
  **entonces** queda registrada en mi historial de notificaciones (postcondición CU021).

- **Dado** que mi cuenta no está activa (bloqueada o eliminada),
  **cuando** ocurriera un evento para mí,
  **entonces** el sistema no me entrega notificación.

## Reglas de negocio

Aprobadas documentalmente (R.14, CU021 extendido) y eventos fijados por dominios ya definidos:

- Solo cuenta activa con notificaciones habilitadas recibe (precondición CU021).
- La entrega sigue la preferencia del usuario: push habilitada → push (y/o correo); push deshabilitada → solo correo (CU021).
- Toda notificación queda registrada en el historial del usuario (postcondición CU021).
- Catálogo de eventos vigente: nuevo mensaje de chat, favorita vendida, respuesta/resultado de reporte, advertencias administrativas y avisos administrativos con entrega activa según los dominios de origen (ADM-01/02, HU-CHAT-02, HU-FAV-01).
- Fuera de alcance de esta HU: la gestión de preferencias (HU-NO-02), el centro/historial de lectura (HU-NO-03) y la entrega de avisos institucionales (HU-NO-04/05).

Nota técnica de origen (no define diseño): el backend ya tiene el patrón `notificacion_marca` (registro con tipo, mensaje, flag `leida` y fecha) dirigido a marcas; no existe el módulo de notificaciones de usuario (R.14).

## Dependencias

- Usuarios autenticados (módulo auth existente).
- Eventos fuente existentes o definidos: chat (HU-CHAT-02), compras y ventas (HU-COM-01), favoritos (HU-FAV-01), reportes y administración (HU-REP/ADM).
- Preferencia vigente de notificaciones (HU-NO-02).

## Prioridad

**Alta**

R.14 es requerimiento solicitado y las decisiones de otros módulos (advertencias, avisos a vendedor) dejaron la entrega explícitos para este módulo.

## Dudas pendientes

1. **Canales de entrega**: la arquitectura vigente no define infraestructura de push para la aplicación web (push nativo se asocia a la app móvil, objetivo futura). ¿Para el MVP web, "push" significa notificación in-app con centre de actividad, o se integra un servicio real de web push (hay que definirlo)? Conviene cerrarla antes del spec.
2. ¿El correo aplica a todos los eventos o solo los "(si corresponde)" según el catálogo de eventos? CU021 lo deja suelto: "push y, si corresponde, correo". Definir en spec qué eventos van con correo.

## Estado

`requiere aclaración` — la duda 1 (canales de push web) define la forma de entrega; LISTA dependerá de esta respuesta (o de decidir "in-app sólo" para el MVP).
