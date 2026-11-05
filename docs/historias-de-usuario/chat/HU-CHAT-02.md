# HU-CHAT-02 — Enviar y recibir mensajes en tiempo real
<!--
SUBTAREAS (plan de implementación)
- Estas subtareas NO cambian el alcance de la HU; solo detallan el trabajo esperado.
- Formato: HU-CHAT-02-(BE|FE)XX para backend/frontend.
-->

**Como** participante de una conversación  
**quiero** enviar y recibir mensajes con la contraparte al instante  
**para** coordinar la transacción sin depender de recargar la pantalla.

## Criterios de aceptación

- **Dado** que soy un participante autenticado de una conversación,
  **cuando** escribo y envío un mensaje,
  **entonces** el mensaje se entrega a la contraparte conectada en tiempo real y queda almacenado en el historial de la conversación.

- **Dado** que la contraparte está conectada,
  **cuando** envío un mensaje,
  **entonces** ella lo ve aparecer en la conversación sin recargar ni reabrir la vista.

- **Dado** que la contraparte está desconectada al momento del envío,
  **cuando** envío un mensaje,
  **entonces** el sistema almacena el mensaje y lo entrega cuando ella se reconecta, en orden, junto con el resto de lo no leído.

- **Dado** que estuve desconectado y me reconecto,
  **cuando** abro la conversación,
  **entonces** veo todos los mensajes que se enviaron mientras no estuve, sin perder ninguno.

- **Dado** que los mensajes de una conversación se consultan desde otro dispositivo o sesión posterior,
  **cuando** abro la conversación,
  **entonces** el historial completo persiste (no se pierde al cerrar sesión ni al cerrar la aplicación).

- **Dado** que intento enviar un mensaje como alguien que no es participante de la conversación,
  **cuando** ejecuto el envío,
  **entonces** el sistema rechaza la operación.

- **Dado** que ya envié un mensaje en la conversación,
  **cuando** intento modificarlo o eliminarlo,
  **entonces** el sistema no lo permite: los mensajes son inmutables una vez enviados.

- **Dado** que un historial de conversación supera el tamaño de página,
  **cuando** lo cargo,
  **entonces** los mensajes se cargan paginados en bloques de 20 en web y 10 en móvil, alineado con catálogo y favoritos (decisión aprobada).

- **Dado** que no estoy autenticado,
  **cuando** intento enviar o recibir mensajes,
  **entonces** el sistema rechaza la operación e indica que debo iniciar sesión.

## Reglas de negocio

Aprobadas documentalmente (R.10, R.20, R.21, CU015 extendido) y restricciones de proyecto:

- Solo los dos participantes de la conversación pueden leer y escribir en ella.
- El intercambio en tiempo real debe operar mediante WebSocket (R.21 — restricción explícita; el proyecto usa Socket.IO).
- Las conversaciones, los mensajes y los datos de tiempo real se almacenan en MongoDB (R.20 — restricción explícita).
- Mensajes con destinatario desconectado: se almacenan y se entregan al reconectarse (CU015, curso alternativo 2).
- Mensajes inmutables: una vez enviados no se editan ni se eliminan (decisión aprobada).
- Historial paginado: 20 mensajes por página en web y 10 en móvil, alineado con el catálogo general y favoritos (decisión aprobada).
- Fuera de alcance de esta HU: la notificación push del evento de reconexión (R.14/CU021, módulo notificaciones), la moderación de contenido (HU-CHAT-05) y el estado de lectura (HU-CHAT-04).

## Subtareas

### Backend (BE)

- **HU-CHAT-02-BE01:** Definir modelo MVP de **Mensaje** en MongoDB (colección `mensajes`) e índices.  
  - Campos sugeridos: `conversacionId`, `emisorCuentaId`, `texto`, `enviadoEn` (y opcional `leidoEn` se difiere a HU-CHAT-04).
  - Índices: `{ conversacionId: 1, enviadoEn: -1 }` y/o `{ conversacionId: 1, _id: -1 }`.

- **HU-CHAT-02-BE02:** Integrar `MensajeSchema` en `ChatModule` (Mongoose `forFeature`) y asegurar conexión `MONGO_URL` vigente.

- **HU-CHAT-02-BE03:** Implementar Socket.IO en NestJS para chat (Gateway) con autenticación (cookies/JWT) y rooms por `conversacionId`.

- **HU-CHAT-02-BE04:** Implementar evento WS **enviar mensaje** (persistir en Mongo y emitir a room).  
  - Reglas: solo participantes; validar conversación existe; mensajes inmutables.

- **HU-CHAT-02-BE05:** Implementar entrega a reconexión: al conectar/join, entregar mensajes no vistos (en orden).  
  - Nota: el “no leído” completo se modela en HU-CHAT-04; aquí se asegura que al reconectar pueda consultar/recibir historial.

- **HU-CHAT-02-BE06:** Endpoint REST de soporte para historial paginado (para web/mobile y para reconexión):  
  - `GET /api/chat/conversaciones/:id/mensajes?cursor=&limit=` (20 web / 10 mobile).  
  - Reglas: solo participantes.

- **HU-CHAT-02-BE07:** DTOs de WS/REST + Swagger para endpoints REST del historial.

- **HU-CHAT-02-BE08:** Pruebas (unit/integration) para Gateway + e2e para endpoint de historial:  
  - 401/403 no participante  
  - paginación  
  - persistencia del historial

- **HU-CHAT-02-BE09:** Alinear logging/auditoría con `log_api` (REST) y definir logging mínimo para eventos WS.

### Frontend (FE)

- **HU-CHAT-02-FE01:** Conectar vista de conversación a Socket.IO (con sesión/cookies) y suscribirse a eventos de mensajes.

- **HU-CHAT-02-FE02:** Implementar envío de mensaje (UI → WS) y render del mensaje recibido en tiempo real.

- **HU-CHAT-02-FE03:** Cargar historial paginado (20 web / 10 mobile) y mezclar con stream en tiempo real sin duplicados.

- **HU-CHAT-02-FE04:** Manejar estados desconectado/reconectado y re-sincronización del historial.

## Dependencias

- HU-CHAT-01 (existencia de la conversación).
- Usuarios autenticados (módulo auth existente).
- Infraestructura de chat inexistente hoy: MongoDB, Socket.IO y su integración con el backend se incorporan con este dominio.

## Prioridad

**Alta**

Núcleo funcional del chat (R.10). Todo el dominio depende de la mensajería real y persistente.

## Dudas pendientes

- Ninguna bloqueante.

## Estado

`lista` — lista para comenzar `explore → proposal → spec + design → tasks → apply-progress → verify-report → archive-report`.
