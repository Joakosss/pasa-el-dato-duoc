# HU-CHAT-01 — Iniciar conversación desde una publicación

**Como** usuario autenticado interesado en una publicación
**quiero** contactar al vendedor desde esa publicación
**para** coordinar con él la compra por mensajería.

## Criterios de aceptación

- **Dado** que soy un usuario autenticado distinto del vendedor y la publicación está disponible para contacto,
  **cuando** selecciono "Contactar vendedor" en la publicación,
  **entonces** el sistema crea una conversación asociada a esa publicación y a ambos usuarios, y me deja en ella.

- **Dado** que ya existe una conversación entre nosotros para esa publicación,
  **cuando** vuelvo a seleccionar "Contactar vendedor",
  **entonces** el sistema recupera la conversación existente sin crear una nueva; hay una sola conversación por par de usuarios y publicación.

- **Dado** que soy un usuario autenticado distinto del vendedor y la publicación está vendida,
  **cuando** selecciono "Contactar vendedor",
  **entonces** el sistema permite el contacto: crea o recupera la conversación mostrando la indicación de que la publicación está vendida.

- **Dado** que la publicación está pausada,
  **cuando** intento "Contactar vendedor",
  **entonces** el sistema rechaza la operación e indica que la publicación no está disponible para contacto.

- **Dado** que intento contactar al vendedor desde una publicación que no existe,
  **cuando** ejecuto el contacto,
  **entonces** el sistema rechaza la operación.

- **Dado** que no estoy autenticado,
  **cuando** intento contactar al vendedor,
  **entonces** el sistema rechaza la operación e indica que debo iniciar sesión.

- **Dado** que soy el dueño de la publicación,
  **cuando** intento iniciar una conversación desde mi propia publicación,
  **entonces** el sistema rechaza la operación e indica que no puedo iniciar contacto conmigo mismo.

## Reglas de negocio

Aprobadas documentalmente (R.10, CU015 extendido) y restricciones de proyecto:

- Solo un usuario autenticado puede iniciar una conversación (precondición CU015).
- Cualquier usuario autenticado distinto del dueño puede contactar, incluidos todos los roles (decisión aprobada).
- Se puede contactar tras una venta: permitido en estado "Vendida", rechazado en "Pausada" (decisión aprobada).
- La conversación nace siempre desde una publicación de interés; no hay chat directo sin publicación (precondición CU015).
- Única conversación por par de usuarios y publicación (recuperar/crear según CU015).
- El dueño de la publicación no conversa consigo mismo.
- La conversación y sus mensajes se guardan en la base de datos documental MongoDB (R.20 — restricción explícita del proyecto para el chat).

Fuera de alcance de esta HU: intercambio de mensajes (HU-CHAT-02), lista de conversaciones (HU-CHAT-03), notificaciones (R.14/CU021), publicaciones con estado no disponible.

## Dependencias

- Usuarios autenticados (módulo auth existente).
- Detalle de publicación consultable (HU-PUB-05, HU-PUB-06).
- Infraestructura de chat inexistente hoy: módulo, MongoDB y Socket.IO no están configurados en el backend; se incorporan con este dominio.

## Prioridad

**Alta**

Puerta de entrada del dominio chat (R.10). Sin conversaciones no hay mensajería, ni lecturas, ni moderación de chat.

## Dudas pendientes

- Ninguna bloqueante.

## Subtareas

### Backend (BE)
- **HU-CHAT-01-BE01**: Definir modelo MVP de conversación en MongoDB (colección `conversaciones`) y sus índices (incluye unicidad por par de usuarios y publicación).
- **HU-CHAT-01-BE02**: Integrar Mongo/Mongoose en backend (NestJS) para el dominio chat (sin Socket.IO aún): `ChatModule`, conexión `MONGO_URL`, schemas.
- **HU-CHAT-01-BE03**: Implementar endpoint protegido para “Contactar vendedor”: crear o recuperar conversación (find-or-create/upsert idempotente).
- **HU-CHAT-01-BE04**: Aplicar reglas de negocio sobre publicación:
  - Rechazar si publicación no existe o no es visible.
  - Rechazar si el usuario autenticado es el dueño.
  - Rechazar si estado es “Pausada”.
  - Permitir si estado es “Vendida” (con flag/metadata en la conversación).
- **HU-CHAT-01-BE05**: DTO de respuesta + Swagger/OpenAPI (conversación creada vs recuperada).
- **HU-CHAT-01-BE06**: Pruebas e2e:
  - 401 sin sesión
  - 404 publicación inexistente
  - 409/403 si dueño intenta contactarse
  - 400/409 si publicación pausada
  - OK si vendida
  - idempotencia: segunda llamada recupera la misma conversación
- **HU-CHAT-01-BE07**: Alinear logging/auditoría con `log_api` (interceptor existente) para registrar `fk_cuenta` y ruta.

### Frontend (FE)
- **HU-CHAT-01-FE01**: Botón/acción “Contactar vendedor” en detalle de publicación:
  - Requiere autenticación (redirigir/login o bloquear según patrón FE).
  - Ocultar/inhabilitar si soy el dueño.
- **HU-CHAT-01-FE02**: Consumir endpoint de conversación (crear/recuperar) con loading + manejo de errores.
- **HU-CHAT-01-FE03**: Navegar a vista de conversación (`/chat/:conversacionId`) o placeholder hasta HU-CHAT-02/03.

### Integración / Infra (INT)
- **HU-CHAT-01-INT01**: Verificar compose/entorno para Mongo (conectividad desde backend, variables `MONGO_URL`, seed/init si aplica).
- **HU-CHAT-01-INT02**: Definir contrato de errores (códigos/mensajes) para FE.

### QA
- **HU-CHAT-01-QA01**: Prueba manual: contacto desde publicación disponible, reintento (no duplica), dueño no puede, vendida sí, pausada no.

## Estado

`lista` — lista para comenzar `explore → proposal → spec + design → tasks → apply-progress → verify-report → archive-report`.
