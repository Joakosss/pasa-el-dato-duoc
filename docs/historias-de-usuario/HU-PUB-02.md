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

- **Dado** que edito título, descripción, precio o imágenes,
  **cuando** el sistema valida,
  **entonces** aplica los mismos límites supuesto de HU-PUB-01: título 5-100, descripción 20-2.000, precio mayor a cero en CLP, máximo 5 imágenes JPEG/PNG/WebP de hasta 5 MB cada una. [Supuesto pendiente PO, no definitivo]

## Reglas de negocio

Aprobadas documentalmente (CU006, requerimientos publicaciones):

- Solo el propietario autenticado edita su publicación; las acciones administrativas se tratan por separado.
- Sede, categoría y tipo de venta deben ser registros válidos cuando cambian.
- El sistema muestra la información actual antes de editar y confirma tras guardar.
- Si la modificación no es válida, se mantienen los datos anteriores.

Supuestos explícitos pendientes de validación del Product Owner, no definitivos:

- Campos editables: título, descripción, precio, sede, tipo de venta, categoría e imágenes. Estado excluido, corresponde a HU-PUB-04.
- Una publicación con `eliminado = true` no es editable y se excluye de las consultas normales, según decisión de eliminación lógica pendiente de confirmación de modelo.
- Sin filtro de palabras prohibidas en el MVP hasta definir la regla; lo mencionado en el documento extendido no se convierte en criterio.

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

- Ninguna bloqueante para iniciar el flujo. La lista definitiva de campos editables se suple con el supuesto de 7 campos; debe validar el PO en spec.
- Moderación previa y lista de estados afectan solo a HU-PUB-04, no a esta HU.

## Estado

`lista` con supuestos — lista para comenzar `explore → proposal → spec + design → tasks → apply-progress → verify-report → archive-report`.

HU-PUB-03 y HU-PUB-04 no iniciadas, en espera de resolver eliminación lógica y estados de publicación.
