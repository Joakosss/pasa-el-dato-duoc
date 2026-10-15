# HU-PUB-02 — Editar publicación

**Como** usuario propietario autenticado
**quiero** modificar los datos de mi publicación existente
**para** mantener mi oferta actualizada para la comunidad Duoc.

## Criterios de aceptación

- **Dado** que soy el propietario autenticado y accedo a una publicación propia existente y no eliminada,
  **cuando** modifico uno o más campos permitidos con valores válidos y guardo,
  **entonces** el sistema verifica las referencias a sede, categoría y tipo de venta cuando cambian, actualiza la publicación y confirma la actualización.

- **Dado** que intento editar una publicación que no me pertenece,
  **cuando** ejecuto la edición,
  **entonces** el sistema rechaza la operación.

- **Dado** que la publicación no existe o ya no se encuentra disponible según las reglas del sistema,
  **cuando** intento editarla,
  **entonces** el sistema no realiza la edición.

- **Dado** que un nuevo valor no cumple las reglas definidas,
  **cuando** intento guardar,
  **entonces** el sistema rechaza el cambio y mantiene los datos anteriores.

- **Dado** que edito título, descripción o precio sin modificar imágenes,
  **cuando** guardo con título 5-100, descripción 20-2.000 y precio en CLP mayor a $0,
  **entonces** el sistema actualiza sin exigir recarga de imágenes.

- **Dado** que modifico las imágenes,
  **cuando** guardo,
  **entonces** el sistema exige que el resultado final tenga entre 1 y 5 imágenes JPEG, PNG o WebP de hasta 5 MB cada una; si no cumple, rechaza el cambio y mantiene las anteriores.

- **Dado** que edito una publicación no eliminada en cualquier estado,
  **cuando** guardo con valores válidos,
  **entonces** el sistema permite la edición sin validar el estado.

## Reglas de negocio

Aprobadas documentalmente (CU006, requerimientos publicaciones):

- Solo el propietario autenticado edita su publicación; las acciones administrativas se tratan por separado.
- Sede, categoría y tipo de venta deben ser registros válidos cuando cambian.
- El sistema muestra la información actual antes de editar y confirma tras guardar.
- Si la modificación no es válida, se mantienen los datos anteriores.

Aprobadas MVP para esta HU:

- Campos editables: título, descripción, precio, sede, tipo de venta, categoría e imágenes. Estado excluido, corresponde a HU-PUB-04.
- En edición aplican los mismos límites de HU-PUB-01: título 5-100, descripción 20-2.000, precio CLP mayor a $0 sin “gratis” ni “a convenir”, 1 a 5 imágenes JPEG/PNG/WebP de hasta 5 MB.
- Se permite no modificar imágenes; si se modifican, el resultado final debe conservar entre 1 y 5 imágenes.
- Se permite editar cualquier publicación no eliminada, sin validar estado por ahora.
- Una publicación con `eliminado = true` no es editable y se excluye de las consultas normales.

Fuera de alcance: filtro de palabras prohibidas, estados de publicación (HU-PUB-04), eliminación lógica (HU-PUB-03).

## Dependencias

- HU-PUB-01 — Crear publicación.
- Usuarios autenticados.
- Catálogo de sedes disponible.
- Catálogo de tipos de venta disponible.
- Catálogo de categorías disponible.
- Almacenamiento de imágenes.

## Prioridad

**Alta**

Gestión básica del MVP, depende de HU-PUB-01 y desbloquea el ciclo de vida de la publicación.

## Dudas pendientes

- Ninguna bloqueante para iniciar el flujo.

## Estado

`lista` — lista para comenzar `explore → proposal → spec + design → tasks → apply-progress → verify-report → archive-report`.
