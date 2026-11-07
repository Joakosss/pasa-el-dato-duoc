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

## Prioridad

**Media**

Valor directo para el usuario y prerrequisito de "Mis favoritos" (HU-FAV-02). No bloquea publicaciones, pero sí es puerta de la gestión de guardados y base futura de notificaciones (CU021).

## Dudas pendientes

- Ninguna bloqueante.

## Estado

`lista` — lista para comenzar `explore → proposal → spec + design → tasks → apply-progress → verify-report → archive-report`.
