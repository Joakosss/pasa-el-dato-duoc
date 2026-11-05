# HU-CHAT-04 — Estado de lectura de mensajes
<!--
SUBTAREAS (plan de implementación)
- Estas subtareas NO cambian el alcance de la HU; solo detallan el trabajo esperado.
- Formato: HU-CHAT-04-(BE|FE)XX para backend/frontend.
-->

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
- La conversación abierta registra lectura; lo no abierto permanece como no leído (CU015, curso normal: \"entrega el mensaje en tiempo real y actualiza el estado de lectura\").
- El estado de lectura pertenece a datos del chat: conversaciones, mensajes, y estado de lectura se manejan en MongoDB (R.20 — restricción explícita).
- Fuera de alcance de esta HU: envío de mensajes (HU-CHAT-02) y notificaciones push de mensajes nuevos (R.14/CU021).

## Subtareas

### Backend (BE)

- **HU-CHAT-04-BE01:** Definir modelo de estado de lectura (MVP) en MongoDB.  
  Opciones a decidir (documentar decisión):\n  - A) En documento `conversaciones`: marca por cuenta (p. ej. `leidoHastaMensajeIdVendedor` / `leidoHastaMensajeIdComprador`).\n  - B) Colección `lecturas` (por `(conversacionId, cuentaId)`), con `leidoHastaMensajeId` y `actualizadoEn`.\n\n- **HU-CHAT-04-BE02:** Implementar comando “marcar como leído al abrir”.\n  - REST: `POST /api/chat/conversaciones/:id/leer` (idempotente)\n  - y/o evento WS: `chat:conversacionAbierta`.\n\n- **HU-CHAT-04-BE03:** Calcular y exponer “no leídos por conversación” en el listado (HU-CHAT-03):\n  - campo `noLeidosCount`.\n\n- **HU-CHAT-04-BE04:** Exponer en el historial el estado leído/no leído (mínimo viable):\n  - flag por mensaje desde el punto de vista del usuario autenticado.\n\n- **HU-CHAT-04-BE05:** DTOs + Swagger (si hay endpoint REST).\n\n- **HU-CHAT-04-BE06:** Pruebas e2e / integration:\n  - 401 sin sesión\n  - 403 no participante\n  - marcar leído idempotente\n  - conteo baja al abrir\n\n- **HU-CHAT-04-BE07:** Logging/auditoría con `log_api` (REST) y logging mínimo para WS.\n\n### Frontend (FE)\n\n- **HU-CHAT-04-FE01:** Al abrir conversación, disparar evento/endpoint de “marcar leído”.\n\n- **HU-CHAT-04-FE02:** Mostrar indicadores de leído/no leído en la vista de conversación.\n\n- **HU-CHAT-04-FE03:** Mostrar contador `noLeidosCount` en el listado de conversaciones.\n\n## Dependencias\n\n- HU-CHAT-02 (mensajes que se marcan como leídos).\n- HU-CHAT-03 (listado donde se muestra el contador de no leídos).\n- Infraestructura de chat inexistente hoy: MongoDB y Socket.IO se incorporan con el dominio.\n\n## Prioridad\n\n**Media**\n\nApoya decidir esperar o insistir en la transacción, pero no bloquea la mensajería básica. Va después de HU-CHAT-02.\n\n## Dudas pendientes\n\n- Ninguna bloqueante.\n\n## Estado\n\n`lista` — lista para comenzar `explore → proposal → spec + design → tasks → apply-progress → verify-report → archive-report`.\n
