# HU-CHAT-03 — Ver lista de mis conversaciones
<!--
SUBTAREAS (plan de implementación)
- Estas subtareas NO cambian el alcance de la HU; solo detallan el trabajo esperado.
- Formato: HU-CHAT-03-(BE|FE)XX para backend/frontend.
-->

**Como** usuario autenticado
**quiero** ver el listado de mis conversaciones con su actividad reciente
**para** retomar con rapidez los contactos por los que me interesé.

## Criterios de aceptación

- **Dado** que soy un usuario autenticado con conversaciones activas,
  **cuando** accedo a la sección de chats,
  **entonces** el sistema muestra solo mis conversaciones, cada una con la contraparte, la publicación asociada, el último mensaje y su fecha.

- **Dado** que una conversación termino de cargarla,
  **cuando** reviso el listado,
  **entonces** la conversación más reciente aparece primero, ordenada por fecha de último mensaje.

- **Dado** que no mantengo ninguna conversación activa,
  **cuando** accedo a la sección de chats,
  **entonces** el sistema muestra el estado de vacío con un mensaje claro.

- **Dado** que no estoy autenticado,
  **cuando** intento acceder a la sección de chats,
  **entonces** el sistema redirige al inicio de sesión.

- **Dado** que la publicación de una conversación ya no está disponible (eliminada o vendida),
  **cuando** consulto el listado,
  **entonces** la conversación sigue visible con la referencia a esa publicación y su indicación de estado, sin romper el listado.

- **Dado** que tengo más conversaciones de las que caben en una página,
  **cuando** navego el listado desde la web,
  **entonces** el listado se pagina en bloques de 20 conversaciones por página; desde un dispositivo móvil, en bloques de 10 (decisión aprobada, alineada con catálogo y favoritos).

- **Dado** que busco una opción para ocultar o eliminar una conversación de mi lista,
  **cuando** reviso el listado,
  **entonces** esa opción no existe para el usuario: las conversaciones permanecen en el listado (decisión aprobada).

## Reglas de negocio

Aprobadas documentalmente (R.10, CU015 extendido) y base vigente:

- El listado muestra solo conversaciones del usuario autenticado.
- Una conversación sobrevive a una publicación eliminada o vendida (coherente con CU007: la conversación persiste y se informa al comprador del cambio).
- Listado paginado: 20 por página en web, 10 por página en móvil, alineado con catálogo y favoritos (decisión aprobada).
- No se puede ocultar ni eliminar conversaciones desde el listado (decisión aprobada).
- Fuera de alcance de esta HU: contadores de no leídos (HU-CHAT-04), envío de mensajes (HU-CHAT-02), eliminación u ocultamiento de conversaciones (decisión aprobada: no existe para el usuario).

## Subtareas

### Backend (BE)

- **HU-CHAT-03-BE01:** Definir contrato del listado de conversaciones (campos mínimos) y criterios de ordenamiento.  
  - Orden: `ultimoMensajeEn desc` (fallback `creadaEn desc`).

- **HU-CHAT-03-BE02:** Implementar endpoint protegido de listado paginado:  
  - `GET /api/chat/conversaciones?cursor=&limit=` (20 web / 10 mobile).  
  - Filtra por conversaciones donde el usuario sea `vendedorCuentaId` o `compradorCuentaId`.

- **HU-CHAT-03-BE03:** Enriquecer el listado con metadatos requeridos:  
  - contraparte (id cuenta)  
  - `publicacionId` + referencia de estado (sin romper si publicación ya no existe/visible)  
  - último mensaje (texto + fecha) desde Mongo (`mensajes`) o denormalizado en `conversaciones`.

- **HU-CHAT-03-BE04:** Definir estrategia para “publicación no disponible”:  
  - mantener la conversación visible, pero exponer `estadoPublicacionAlCrear` + (opcional) snapshot mínimo del título/precio al crear, si se decide denormalizar.

- **HU-CHAT-03-BE05:** DTOs + Swagger (OpenAPI) para el endpoint de listado.

- **HU-CHAT-03-BE06:** Pruebas e2e:  
  - 401 sin sesión  
  - lista solo conversaciones propias  
  - orden por actividad reciente  
  - paginación

- **HU-CHAT-03-BE07:** Logging/auditoría con `log_api` (fk_cuenta + ruta).

### Frontend (FE)

- **HU-CHAT-03-FE01:** Reemplazar mocks `Momentaneo` del listado (`ChatList`, `ChatCard`) por consumo del endpoint real.

- **HU-CHAT-03-FE02:** Implementar paginación/infinite scroll respetando 20 web / 10 mobile.

- **HU-CHAT-03-FE03:** Manejar estado vacío y redirección a login cuando no hay sesión.

## Dependencias

- HU-CHAT-01 (existencia de conversaciones), HU-CHAT-02 (mensajes que alimentan el último mensaje).
- Usuarios autenticados (módulo auth existente).
- Base vigente de front: la página de chats y sus componentes (`ChatList`, `ChatCard`) ya existen con datos mock `Momentaneo` sin contrato backend; esta HU reemplaza esos mocks por el contrato real.

## Prioridad

**Alta**

Acceso diario al chat: sin listado navegable el resto del dominio no es alcanzable con fluidez. Va después de HU-CHAT-02.

## Dudas pendientes

- Orden del listado no definido explícitamente (opción natural, ya anticipada por la carcasa vigente del front: por último mensaje, más reciente primero). Confirmar en spec.

## Estado

`lista` — lista para comenzar `explore → proposal → spec + design → tasks → apply-progress → verify-report → archive-report`.
