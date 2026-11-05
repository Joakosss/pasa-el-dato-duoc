# HU-CHAT-04 — Estado de lectura de mensajes

**Como** participante de una conversación
**quiero** saber qué mensajes han sido leídos por mi contraparte y cuántos llevo sin leer
**para** saber si necesito esperar respuesta o insistir con otro mensaje.

## Criterios de aceptación

- **Dado** que la contraparte deja mensajes pendientes y aún no abre la conversación,
  **cuando** consulta si los mensajes están leídos,
  **entonces** permanecen como no leídos.

- **Dado** que la contraparte abre la conversación,
  **cuando** la abre con mensajes pendientes,
  **entonces** el sistema marca esos mensajes como leídos en el momento de abrir (decisión aprobada: la lectura ocurre al abrir).

- **Dado** que la contraparte está conectada y recibe mi mensaje en tiempo real,
  **cuando** ella lo visualiza en la conversación abierta,
  **entonces** el sistema lo marca como leído (la conversación aberta y visible equivale a lectura).

- **Dado** que reviso el detalle de una conversación desde mi lado,
  **cuando** tengo mensajes que la contraparte ya leyó,
  **entonces** el sistema distingue los mensajes leídos de los no leídos.

- **Dado** que la contraparte dejó mensajes sin leer en varias conversaciones,
  **cuando** consulto el listado de mis conversaciones,
  **entonces** el sistema marca cada conversación con el conteo de mensajes sin leer (confirmación en HU-CHAT-03, donde el mock vigente lo anticipa).

- **Dado** que mi contraparte abre la conversación por primera vez tras quedar desconectada,
  **cuando** la consulta,
  **entonces** los mensajes acumulados pasan a leídos en esa primera consulta completa.

## Reglas de negocio

Aprobadas documentalmente (R.10, CU015 extendido) y base vigente:

- La lectura se registra al abrir la conversación con mensajes pendientes (decisión aprobada); no requiere visualización mensaje a mensaje.
- La conversación abierta registra lectura; lo no abierto permanece como no leído (CU015, curso normal: "entrega el mensaje en tiempo real y actualiza el estado de lectura").
- El estado de lectura pertenece a datos del chat: conversaciones, mensajes, y estado de lectura se manejan en MongoDB (R.20 — restricción explícita).
- Fuera de alcance de esta HU: envío de mensajes (HU-CHAT-02) y notificaciones push de mensajes nuevos (R.14/CU021).

## Dependencias

- HU-CHAT-02 (mensajes que se marcan como leídos).
- HU-CHAT-03 (listado donde se muestra el contador de no leídos).
- Infraestructura de chat inexistente hoy: MongoDB y Socket.IO se incorporan con el dominio.

## Prioridad

**Media**

Apoya decidir esperar o insistir en la transacción, pero no bloquea la mensajería básica. Va después de HU-CHAT-02.

## Dudas pendientes

- Ninguna bloqueante.

## Estado

`lista` — lista para comenzar `explore → proposal → spec + design → tasks → apply-progress → verify-report → archive-report`.
