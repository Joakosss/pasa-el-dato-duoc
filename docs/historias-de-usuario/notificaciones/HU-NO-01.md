# HU-NO-01 — Recibir notificaciones de eventos relevantes

**Como** usuario con cuenta activa
**quiero** recibir notificaciones de los eventos relevantes de mi cuenta
**para** enterarme oportunamente sin tener que revisar cada sección.

## Criterios de aceptación

- **Dado** que ocurre un evento relevante de mi cuenta (nuevo mensaje de chat, respuesta a reporte, publicación favorita vendida, advertencia administrativa con entrega activa, avisos que apliquen según el catálogo de eventos),
  **cuando** el sistema lo detecta,
  **entonces** genera una notificación dirigida a mí y la entrega según mi configuración de notificaciones vigente.

- **Dado** que tengo las notificaciones habilitadas,
  **cuando** ocurre el evento,
  **entonces** recibir la entrega sobre el canal activo: en el MVP web, la notificación en la aplicación (disponible de inmediato en mi historial con su indicación de no leída) y correo automático si el evento lo define (decisión aprobada de canales MVP; el push nativo queda para la app móvil del arquitectura objetivo).

- **Dado** que el evento lo define con correo en el catálogo de eventos,
  **cuando** ocurre,
  **entonces** el sistema envía además el correo automático al correo registrado de mi cuenta (CU021, curso normal).

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
- La entrega sigue la preferencia del usuario (CU021).
- Canales del MVP web (decisión de proyecto): la entrega es in-app (disponible de inmediato en el historial con su indicación de no leída) más correo automático para los eventos que el catálogo defina. El push nativo queda para la app móvil, según la arquitectura objetivo; sin infraestructura de push nueva para web.
- Toda notificación queda registrada en el historial, independiente del canal de entrega.
- Toda notificación queda registrada en el historial del usuario (postcondición CU021).
- Catálogo de eventos vigente: nuevo mensaje de chat, favorita vendida, respuesta/resultado de reporte, advertencias administrativas y avisos administrativos con entrega activa según los dominios de origen (ADM-01/02, HU-CHAT-02, HU-FAV-01).
- Fuera de alcance de esta HU: la gestión de preferencias (HU-NO-02), el centro/historial de lectura (HU-NO-03) y la entrega de avisos institucionales (HU-NO-04/05).

Nota técnica de origen (no define diseño): el backend ya tiene el patrón `notificacion_marca` (registro con tipo, mensaje, flag `leida` y fecha) dirigido a marcas; no existe el módulo de notificaciones de usuario (R.14).

## Subtareas

> Nota: la HU está en `requiere aclaración` por el significado de “push” en web. Las subtareas separan **registro/historial in-app (MVP)** y **entrega por canales** para permitir avanzar incrementalmente.

### Backend (BE)

- **HU-NO-01-BE01:** Definir modelo `NotificacionUsuario` en Prisma + migración (id, fk_cuenta, tipo, mensaje, leida, dataJson opcional y campos BASE).
- **HU-NO-01-BE02:** Definir catálogo de tipos (enum) alineado al catálogo de eventos vigente (chat nuevo mensaje, favorita vendida, reporte resuelto, advertencia admin, aviso admin, etc.).
- **HU-NO-01-BE03:** Definir el “payload” mínimo (`dataJson`) por tipo para habilitar redirección (p.ej. `chatId`, `publicacionId`, `reporteId`, `adminSeccion`, etc.) y su contrato.
- **HU-NO-01-BE04:** Implementar `NotificacionUsuarioService` para registrar notificaciones solo si la cuenta está activa (no bloqueada/eliminada) y según preferencia vigente (HU-NO-02).
- **HU-NO-01-BE05:** Implementar deduplicación por evento cuando aplique (p.ej. evitar spam por múltiples mensajes: agrupar o colapsar por conversación + ventana de tiempo) y documentarlo en spec si se adopta.
- **HU-NO-01-BE06:** Integrar emisión desde eventos fuente (hooks/llamadas desde dominios):
  - chat: nuevo mensaje (HU-CHAT-02)
  - compras/favoritos: favorita vendida (HU-COM-01, HU-FAV-01)
  - administración/reportes: respuesta/resultado de reporte y advertencias/avisos (HU-ADM-01/02, HU-REP)
- **HU-NO-01-BE07:** Implementar endpoint para crear/registrar la notificación (interno) y/o exponer endpoints públicos de historial/lectura en conjunto con HU-NO-03 (alinear para no duplicar contratos).
- **HU-NO-01-BE08:** Definir estrategia de “entrega” por canales: (a) in-app (historial/centro), (b) email (integración), (c) push (app móvil / futuro); documentarlo en spec.
- **HU-NO-01-BE09:** (Email) Definir interfaz/adaptador de envío (mock en MVP si no hay proveedor) y cola/retry (al menos diseño) para que el dominio no dependa directo del proveedor.
- **HU-NO-01-BE10:** (Push) Definir integración futura: para web (si aplica) o app móvil (token device), sin implementarlo si no está aprobado; dejar ganchos en spec.
- **HU-NO-01-BE11:** Swagger: documentar modelos/DTOs/endpoints y errores (401/403 cuando aplique).
- **HU-NO-01-BE12:** Pruebas unitarias/e2e: creación por evento, no crear/entregar si cuenta bloqueada/eliminada, payload correcto por tipo, integración con HU-NO-02 y endpoints de HU-NO-03.

### Frontend (FE)

- **HU-NO-01-FE01:** (MVP) Agregar indicador de notificaciones (badge/ícono) visible globalmente para usuarios autenticados.
- **HU-NO-01-FE02:** Implementar una vista/listado básico para historial (si HU-NO-03 aún no existe, usar carcasa con TODO[MOMENTANEO]).
- **HU-NO-01-FE03:** Consumir `GET /notificaciones` (o el contrato final de HU-NO-03) y renderizar items (tipo, mensaje, fecha, estado leído).
- **HU-NO-01-FE04:** Actualizar badge (cantidad no leída) al cargar app, al volver del chat y tras abrir historial.
- **HU-NO-01-FE05:** Manejar sesión expirada / cuenta inactiva: redirigir o mostrar feedback.
- **HU-NO-01-FE06:** Definir UX para notificación “toast/in-app” al ocurrir evento mientras el usuario navega (solo si el back soporta polling o websocket; si no, dejarlo como futuro en spec).

## Dependencias

- Usuarios autenticados (módulo auth existente).
- Eventos fuente existentes o definidos: chat (HU-CHAT-02), compras y ventas (HU-COM-01), favoritos (HU-FAV-01), reportes y administración (HU-REP/ADM).
- Preferencia vigente de notificaciones (HU-NO-02).

## Prioridad

**Alta**

R.14 es requerimiento solicitado y las decisiones de otros módulos (advertencias, avisos a vendedor) dejaron la entrega explícitos para este módulo.

## Dudas pendientes

- Catálogo de eventos con correo: cada evento define si incluye correo por "si corresponde" (CU021); la lista definitiva fija spec.

## Estado

`lista` — lista para comenzar `explore → proposal → spec + design → tasks → apply-progress → verify-report → archive-report`.
