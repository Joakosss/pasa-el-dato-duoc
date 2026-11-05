# HU-CHAT-05 — Moderación de palabras bloqueadas en chat

**Como** participante de una conversación
**quiero** que el sistema impida el envío de mensajes con palabras sensibles
**para** que la mensajería del marketplace se mantenga dentro del uso institucional aceptable.

## Criterios de aceptación

- **Dado** que intento enviar un mensaje que contiene palabras bloqueadas,
  **cuando** ejecuto el envío,
  **entonces** el sistema no entrega el mensaje ni lo almacena, e informa que no se pudo enviar por contenido no permitido.

- **Dado** que el mensaje se rechaza por contenido,
  **cuando** corrijo el texto y reenvío sin palabras bloqueadas,
  **entonces** el sistema lo envía con normalidad.

- **Dado** que del texto de mi mensaje tengo palabras bloqueadas dentro de un texto más largo,
  **cuando** ejecuto el envío,
  **entonces** el sistema bloquea el mensaje (el filtro se aplica al contenido completo del mensaje, no solo a mensajes cortos).

- **Dado** que un mensaje con palabras bloqueadas se rechaza,
  **cuando** vuelve a intentarse el envío del mismo texto,
  **entonces** el sistema vuelve a rechazarlo (el filtro se aplica en cada intención de envío).

- **Dado** que no hay palabras bloqueadas en el texto,
  **cuando** ejecuto el envío,
  **entonces** el mensaje viaja con normalidad sin demoras adicionales detectables en el flujo normal.

## Reglas de negocio

Aprobadas documentalmente (R.15, CU015 extendido, alternativa 1):

- El sistema aplica un filtro automático que bloquea palabras sensibles en el chat (R.15).
- El filtro aplica coincidencia exacta de palabras: no detecta variantes con espacios o símbolos intercalados (decisión aprobada).
- El filtro se aplica al contenido completo del mensaje en cada intento de envío (decisión aprobada).
- Mensaje con palabras bloqueadas: impedido el envío y se notifica al usuario el motivo (CU015, curso alternativo 1).
- El mensaje bloqueado no queda en el historial ni alcanza al destinatario.
- Fuera de alcance de esta HU: el mismo filtro aplicado a publicaciones (se define en su dominio), la gestión de la lista de palabras bloqueadas (módulo administración) y el reporte de usuarios.

## Dependencias

- HU-CHAT-02 (flujo de envío al que se integra el filtro).
- Lista de palabras bloqueadas vigente: inexistente hoy; definida y mantenida en el dominio administración. Para el MVP de este módulo se requiere una lista operativa antes de especificar.

## Prioridad

**Media**

Requerimiento solicitado (R.15) con impacto regulatorio; no bloquea la mensajería base si la lista no existe aún.

## Dudas pendientes

- Gestión de la lista de palabras bloqueadas: pertenece al dominio administración (quién la mantiene y cómo se actualiza). Este módulo la consume; se define en su dominio.

## Estado

`lista` — lista para comenzar `explore → proposal → spec + design → tasks → apply-progress → verify-report → archive-report`. Necesita una lista de palabras operativa proveniente del dominio administración.
