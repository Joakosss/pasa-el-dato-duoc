# HU-FAV-01 — Guardar y quitar una publicación de favoritos

**Como** estudiante autenticado
**quiero** marcar y desmarcar una publicación como favorita desde el listado o el detalle
**para** volver a encontrarla fácilmente más adelante.

## Criterios de aceptación

- **Dado** que soy un usuario autenticado y estoy viendo una publicación disponible en el listado o en su detalle,
  **cuando** selecciono el control de favorito,
  **entonces** la publicación queda guardada en mi lista de favoritos, el control muestra el estado guardado y la acción se persiste.

- **Dado** que la publicación ya está guardada como favorita mía,
  **cuando** selecciono nuevamente el control de favorito,
  **entonces** la publicación se quita de mi lista de favoritos y el control vuelve al estado no guardado.

- **Dado** que la publicación ya está guardada como favorita mía,
  **cuando** recargo la página de la publicación,
  **entonces** el control sigue mostrando el estado guardado (el favorito es persistente, no solo visual).

- **Dado** que no estoy autenticado,
  **cuando** intento marcar una publicación como favorita,
  **entonces** el sistema rechaza la operación e indica que debo iniciar sesión.

- **Dado** que la publicación está en estado pausado o vendido,
  **cuando** intento marcarla como favorita,
  **entonces** el sistema permite guardarla y la favorita queda registrada con su estado actual.

- **Dado** que la publicación no existe, fue eliminada o está bloqueada,
  **cuando** intento marcarla como favorita,
  **entonces** el sistema rechaza la operación e indica que la publicación no está disponible.

- **Dado** que soy el dueño de la publicación,
  **cuando** intento marcarla como favorita,
  **entonces** el sistema rechaza la operación e indica que no puedo guardar mi propia publicación.

- **Dado** que ya tengo guardada esa misma publicación,
  **cuando** intento marcarla de nuevo,
  **entonces** el sistema no crea un registro duplicado y mantiene un único favorito por par usuario–publicación.

## Reglas de negocio

Aprobadas documentalmente (R.12, CU016 extendido, MER):

- Solo un usuario autenticado puede marcar o desmarcar favoritos (precondición de CU016).
- El favorito vincula exactamente un usuario con una publicación (entidad `favorito` del MER: `fk_usuario`, `fk_publicacion`).
- Un mismo usuario no guarda dos veces la misma publicación (`fk_usuario` + `fk_publicacion` identifican el favorito).
- Un usuario no puede marcar como favorita su propia publicación (decisión de negocio aprobada).
- Pueden marcarse publicaciones en estado pausado o vendido (decisión de negocio aprobada). No pueden marcarse publicaciones eliminadas o bloqueadas.
- El quitar un favorito no elimina la publicación ni afecta a otros usuarios.
- Baja lógica del registro acorde al patrón `BASE` del MER.

Fuera de alcance de esta HU: notificación cuando una favorita se vende (CU021, módulo notificaciones), recomendaciones por IA (R.17).

## Dependencias

- Usuarios autenticados (módulo auth existente).
- Publicaciones consultables desde listado y detalle (HU-PUB-01, HU-PUB-05, HU-PUB-06).
- Catalogo de estados de publicación para reconocer publicaciones no disponibles.
- Contexto de sesión en el frontend (sesion-store existente).

Nota técnica de origen (no define diseño): `Favorito` no existe aún en el `schema.prisma`; el MER del proyecto la define como tabla de negocio.

## Subtareas

### Backend (BE)

- **HU-FAV-01-BE01:** Implementar o verificar el modelo `Favorito` en Prisma con campos BASE, `fk_usuario`, `fk_publicacion`, relaciones, índices y restricción única por par usuario-publicación.
- **HU-FAV-01-BE02:** Crear o integrar `FavoritosModule`, `FavoritosService` y el controller REST con guard de autenticación.
- **HU-FAV-01-BE03:** Exponer `POST /api/favoritos/:publicacionId`, `DELETE /api/favoritos/:publicacionId` y `GET /api/favoritos/:publicacionId` para marcar, quitar y consultar el estado.
- **HU-FAV-01-BE04:** Validar UUID, sesión autenticada, publicación existente, eliminación lógica, bloqueo del dueño y demás condiciones de disponibilidad.
- **HU-FAV-01-BE05:** Permitir favoritos para publicaciones pausadas o vendidas y rechazar el favorito de la propia publicación.
- **HU-FAV-01-BE06:** Garantizar idempotencia: no duplicar favoritos y reactivar el registro mediante baja lógica cuando corresponda; quitar sin afectar publicaciones ni favoritos de otros usuarios.
- **HU-FAV-01-BE07:** Documentar contratos, respuestas y errores en Swagger, manteniendo el contrato implementado en [HU-FAV-01-back-tasks.md](./HU-FAV-01-back-tasks.md).
- **HU-FAV-01-BE08:** Agregar y mantener pruebas unitarias/e2e para autenticación, persistencia, idempotencia, disponibilidad, autoreporte y reactivación.

### Frontend (FE)

- **HU-FAV-01-FE01:** Agregar control de favorito reutilizable en las tarjetas del listado y en el detalle de publicación.
- **HU-FAV-01-FE02:** Consultar el estado inicial con `GET /api/favoritos/:publicacionId` y reflejar visualmente favorito/no favorito al cargar o recargar.
- **HU-FAV-01-FE03:** Consumir `POST` y `DELETE` para alternar el estado, con estado de carga y bloqueo temporal para evitar solicitudes duplicadas.
- **HU-FAV-01-FE04:** Actualizar la interfaz solo después de una respuesta exitosa y revertir o conservar el estado anterior cuando la operación falle.
- **HU-FAV-01-FE05:** Manejar sesión no autenticada, publicación no disponible, autoreporte y errores de red con mensajes consistentes y acceso al inicio de sesión cuando corresponda.
- **HU-FAV-01-FE06:** Mantener permitido el control para publicaciones pausadas o vendidas, según el estado recibido desde el backend.
- **HU-FAV-01-FE07:** Agregar pruebas de componente o e2e para marcar, desmarcar, persistencia tras recarga y principales errores.

## Prioridad

**Media**

Valor directo para el usuario y prerrequisito de "Mis favoritos" (HU-FAV-02). No bloquea publicaciones, pero sí es puerta de la gestión de guardados y base futura de notificaciones (CU021).

## Dudas pendientes

- Ninguna bloqueante.

## Estado

`en-progreso` — Backend completado (BE01–BE08) y verificado; Frontend (FE01–FE07) pendiente.

Notas de cierre backend (2026-11-15):

- Modelo `Favorito` en `pasa-el-dato-back/prisma/schema.prisma` (patrón BASE, unique `ux_favorito_publicacion_usuario`, índices por usuario y publicación) con migración `20261110013554_favorito` aplicada.
- Módulo `src/favoritos/` con `FavoritosService`, `FavoritosController` y `FavoritosModule` registrado en `AppModule`.
- Contrato vigente: `GET/POST/DELETE /api/favoritos/:publicacionId` y `GET /api/favoritos` (listado paginado, pageSize 20 web / 10 móvil). Respuestas `{ publicacionId, esFavorito }`.
- Reglas: no disponible (inexistente/eliminada/dueño bloqueado-eliminado-no aprobado) → 404; publicación propia → 400; Pausada/Vendida permitida; idempotente con baja lógica y reactivación por `upsert`.
- Swagger documenta los 4 endpoints (`EstadoFavoritoRespuestaDto`, 200/201/400/401/404, cookie `accessToken`).
- Verificación: `tsc --noEmit` limpio, lint 0 errores, suite e2e en contenedor verde (30 archivos, 252 tests, incluye `favoritos.e2e-spec.ts` F1–F9).
- Detalle de subtareas y evidencia: [HU-FAV-01-back-tasks.md](./HU-FAV-01-back-tasks.md).
- Fuera de alcance registrado: notificación de favorita vendida (CU021 / HU-NO-01) y recomendaciones por IA (R.17); sin deuda técnica pendiente del backend.
