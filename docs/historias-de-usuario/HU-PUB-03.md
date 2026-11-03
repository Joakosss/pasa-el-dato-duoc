# HU-PUB-03 — Eliminar publicación

**Como** usuario propietario autenticado  
**quiero** eliminar o retirar una publicación que ya no deseo mantener disponible  
**para** que deje de aparecer en el marketplace.

## Criterios de aceptación

- **Dado** que soy el propietario autenticado de una publicación no eliminada,
  **cuando** selecciono eliminar y confirmo la acción,
  **entonces** el sistema aplica la eliminación lógica, confirma la operación y la publicación deja de estar disponible en el flujo normal del marketplace.

- **Dado** que intento eliminar una publicación que no me pertenece,
  **cuando** ejecuto la eliminación,
  **entonces** el sistema rechaza la operación.

- **Dado** que la publicación no existe o ya está eliminada,
  **cuando** intento eliminarla,
  **entonces** el sistema no realiza ninguna modificación.

- **Dado** que no confirmo la eliminación cuando el sistema la solicita,
  **cuando** cancelo la operación,
  **entonces** la publicación se mantiene sin cambios.

## Reglas de negocio

Aprobadas documentalmente (CU007, requerimientos publicaciones):

- Solo el propietario autenticado elimina su publicación; acciones administrativas se tratan por separado.
- Tras eliminar, la publicación deja de estar disponible según la regla del sistema.
- Una publicación con `eliminado = true` no es editable y se excluye de las consultas normales (definido en HU-PUB-02).

Aprobadas MVP para esta HU:

- Eliminación lógica mediante la bandera común `eliminado = true`, no borrado físico.
- La publicación no eliminada es eliminable en cualquier estado, sin validar estado por ahora.
- La eliminación no se deshace desde el flujo de usuario; la recuperación es operación administrativa fuera del alcance del MVP.

Fuera de alcance: borrado físico de registros e imágenes, acciones administrativas de retiro.

## Dependencias

- HU-PUB-01 — Crear publicación.
- Usuarios autenticados.

## Prioridad

**Alta**

Completa el ciclo de vida básico del MVP junto con HU-PUB-01 y HU-PUB-02.

## Dudas pendientes

- Ninguna bloqueante para iniciar el flujo.

## Estado

`lista` — lista para comenzar `explore → proposal → spec + design → tasks → apply-progress → verify-report → archive-report`.
