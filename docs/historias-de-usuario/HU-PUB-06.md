# HU-PUB-06 — Ver mis publicaciones

**Como** usuario propietario autenticado  
**quiero** ver el listado de mis propias publicaciones con su estado  
**para** administrarlas y decidir cuáles editar, cambiar de estado o eliminar.

## Criterios de aceptación

- **Dado** que soy un usuario autenticado con publicaciones propias no eliminadas,
  **cuando** consulto mis publicaciones,
  **entonces** el sistema lista solo mis publicaciones no eliminadas, mostrando título, precio, estado, sede y una imagen representativa de cada una.

- **Dado** que soy un usuario autenticado sin publicaciones propias,
  **cuando** consulto mis publicaciones,
  **entonces** el sistema muestra un mensaje de lista vacía sin errores.

- **Dado** que tengo publicaciones eliminadas (`eliminado = true`),
  **cuando** consulto mis publicaciones,
  **entonces** el sistema no las incluye en el listado.

- **Dado** que no estoy autenticado,
  **cuando** intento consultar mis publicaciones,
  **entonces** el sistema rechaza la operación por autenticación requerida.

- **Dado** que estoy en el listado de mis publicaciones,
  **cuando** selecciono una publicación,
  **entonces** el sistema permite acceder a su detalle y a sus acciones de edición, cambio de estado y eliminación definidas en HU-PUB-02, HU-PUB-03 y HU-PUB-04.

## Reglas de negocio

Aprobadas MVP para esta HU:

- El listado muestra únicamente publicaciones del propio usuario.
- Las publicaciones con `eliminado = true` se excluyen del listado (definido en HU-PUB-02 y HU-PUB-03).
- Los estados `Publicada`, en curso, pausada y vendida se muestran tal como estén; su gestión corresponde a HU-PUB-04.

Fuera de alcance: búsqueda y filtros, favoritos, chat, estadísticas de vistas, listados de otros usuarios (visibles en su perfil).

## Dependencias

- HU-PUB-01 — Crear publicación.
- HU-PUB-04 — Cambiar estado de publicación (para mostrar el estado real en el listado).
- Usuarios autenticados.

## Prioridad

**Media**

Punto de acceso para administrar el ciclo de vida; sin bloquear creación ni edición directas.

## Dudas pendientes

- Ninguna bloqueante para iniciar el flujo.

## Estado

`lista` — lista para comenzar `explore → proposal → spec + design → tasks → apply-progress → verify-report → archive-report`.
