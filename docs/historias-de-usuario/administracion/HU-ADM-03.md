# HU-ADM-03 — Gestionar categorías y tipos de venta

**Como** administrador
**quiero** crear, editar y eliminar categorías de productos/servicios y tipos de venta
**para** mantener el catálogo de referencia disponible para los vendedores al publicar.

## Criterios de aceptación

- **Dado** que soy un administrador autenticado y selecciono "Nueva categoría" o "Nuevo tipo de venta",
  **cuando** ingreso el nombre y confirmo,
  **entonces** el sistema guarda el registro y lo hace disponible en los formularios de publicación.

- **Dado** que edito el nombre de una categoría o tipo de venta existente,
  **cuando** guardo,
  **entonces** el sistema actualiza el registro y su nombre queda aplicable a publicaciones nuevas.

- **Dado** que intento crear una categoría o tipo de venta con un nombre que ya existe,
  **cuando** confirmo,
  **entonces** el sistema rechaza la operación e indica el duplicado.

- **Dado** que intento eliminar una categoría en uso por publicaciones activas,
  **cuando** confirmo la eliminación,
  **entonces** el sistema advierte del conflicto y solicita reasignar las publicaciones antes de eliminarla (no elimina la categoría mientras exista en uso).

- **Dado** que intento eliminar un tipo de venta en uso por publicaciones activas,
  **cuando** confirmo la eliminación,
  **entonces** el sistema aplica la misma regla que las categorías: advierte del conflicto y solicita reasignar antes de eliminar (decisión aprobada).

- **Dado** que la categoría o tipo de venta ya no está en uso,
  **cuando** lo elimino,
  **entonces** el sistema lo retira de los formularios y del catálogo disponible para publicaciones nuevas.

- **Dado** que intento gestionar los catálogos sin sesión o sin rol de administrador,
  **cuando** ejecuto la acción,
  **entonces** el sistema rechaza la operación.

## Reglas de negocio

Aprobadas documentalmente (R.31, R.32, CU019 extendido):

- Solo un administrador autenticado puede escribir en los catálogos (hoy el backend expone solo lectura para cualquiera autenticado con `GET`).
- Una categoría en uso por publicaciones activas no se elimina: primero se reasignan las publicaciones (CU019, curso alternativo 1). El mismo mecanismo aplica a los tipos de venta (decisión aprobada).
- Los registros de catálogo son compartidos y únicos: los nombres se consideran únicos entre categorías y entre tipos de venta (modelo vigente en BD).
- El cambio de catálogos no altera el contenido de las publicaciones ya existentes más allá del uso previsto en su asociación.

Fuera de alcance de esta HU: la publicación misma (HU-PUB-01), la moderación y bloqueo, y la visualización de métricas.

Nota técnica de origen (no define diseño): los módulos `categoria` y `tipo-venta` ya existen en el backend con endpoints de lectura (`GET`) y datos sembrados; el CRUD de escritura y los guard de admin no existen.

## Subtareas

### Backend (BE)

- **HU-ADM-03-BE01:** Definir contratos y DTOs de creación/edición para categorías y tipos de venta, con normalización y límites de nombre.
- **HU-ADM-03-BE02:** Implementar endpoints administrativos para listar, crear y editar categorías y tipos de venta, protegiendo las escrituras con rol administrador.
- **HU-ADM-03-BE03:** Implementar eliminación de categoría/tipo de venta solo cuando no esté en uso por publicaciones activas; devolver conflicto con información suficiente si requiere reasignación.
- **HU-ADM-03-BE04:** Validar duplicados por tipo de catálogo y persistir cambios de forma consistente con el modelo actual.
- **HU-ADM-03-BE05:** Documentar contratos, DTOs y errores en Swagger; agregar pruebas unitarias/e2e para permisos, CRUD, duplicados y eliminación de elementos en uso/libres.
- **HU-ADM-03-BE06:** Definir en spec/design cómo se ejecuta la reasignación de publicaciones antes de eliminar un elemento en uso; no eliminarlo ni reasignar automáticamente sin una decisión.

### Frontend (FE)

- **HU-ADM-03-FE01:** Crear la interfaz administrativa para listar y gestionar categorías y tipos de venta.
- **HU-ADM-03-FE02:** Implementar formularios de creación y edición con validación de nombre y errores de duplicado.
- **HU-ADM-03-FE03:** Implementar eliminación con confirmación y presentación clara del conflicto cuando el catálogo aún esté asociado a publicaciones activas.
- **HU-ADM-03-FE04:** Integrar las operaciones con la API y refrescar formularios/listados de catálogo después de cambios exitosos.
- **HU-ADM-03-FE05:** Manejar estados de carga, vacío, éxito, error de autorización y errores de red, evitando ofrecer acciones no disponibles al no administrador.

## Dependencias

- Catálogo de categorías y tipos de venta disponible (backend existe en su parte de lectura).
- Rol administrador autenticado (guard de roles existente).
- HU-PUB-01 (consumo del catálogo al publicar, valido para verificar disponibilidad).

## Prioridad

**Alta**

Catálogo de referencia del núcleo comercial sin vía de mantenimiento hoy; cualquier catálogo mal definido queda permanente hasta esta HU.

## Dudas pendientes

- Cómo se ejecuta la reasignación al eliminar en uso (acción por acción del administrador o sugerencia de equivalentes): definirse en spec. No bloqueante.

## Estado

`lista` — lista para comenzar `explore → proposal → spec + design → tasks → apply-progress → verify-report → archive-report`.
