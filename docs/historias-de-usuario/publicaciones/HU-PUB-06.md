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

## Subtareas
### Backend (BE)
- **HU-PUB-06-BE01**: Crear endpoint protegido `GET /api/v1/publicaciones/mias` (o equivalente), vinculando la consulta al usuario autenticado.
- **HU-PUB-06-BE02**: Implementar filtro: retornar solo publicaciones del usuario con `eliminado = false`.
- **HU-PUB-06-BE03**: Definir payload de lista “mis publicaciones” incluyendo: título, precio, estado, sede y una imagen representativa (y su regla de selección).
- **HU-PUB-06-BE04**: Manejo de lista vacía: responder éxito con lista vacía (sin errores).
- **HU-PUB-06-BE05**: Pruebas unitarias e integración: con publicaciones, sin publicaciones, con eliminadas (excluidas), y no autenticado (rechazo).

### Frontend (FE)
- **HU-PUB-06-FE01**: Crear vista/página “Mis publicaciones” accesible solo autenticado (guard/redirect según patrón existente).
- **HU-PUB-06-FE02**: Integrar consumo del endpoint y renderizar tarjetas con campos requeridos (título, precio, estado, sede, imagen representativa).
- **HU-PUB-06-FE03**: Implementar estado de lista vacía con mensaje UX (sin tratarlo como error).
- **HU-PUB-06-FE04**: Al seleccionar una publicación, navegar al detalle y exponer acciones: editar (HU-PUB-02), eliminar (HU-PUB-03) y cambiar estado (HU-PUB-04).
- **HU-PUB-06-FE05**: Manejar loading/error (skeleton, retry, mensajes de error) y refresco local tras acciones (p. ej. si se elimina o cambia estado).

### Integración y QA (INT/QA)
- **HU-PUB-06-INT01**: Definir y documentar contrato OpenAPI/Swagger del endpoint de “mis publicaciones”.
- **HU-PUB-06-INT02**: Pruebas de seguridad: confirmar que el endpoint no permita enumerar publicaciones de otros usuarios (siempre ligado al token).
- **HU-PUB-06-INT03**: Pruebas E2E del flujo: entrar a “mis publicaciones”, lista vacía, acceder a detalle y ejecutar acciones (editar/cambiar estado/eliminar) verificando actualización del listado.

## Estado

`lista` — lista para comenzar `explore → proposal → spec + design → tasks → apply-progress → verify-report → archive-report`.
