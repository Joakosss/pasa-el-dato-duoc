# HU-PUB-01 — Crear publicación

**Como** usuario autenticado en rol vendedor
**quiero** crear una publicación con título, descripción, precio, sede, tipo de venta, categoría e imágenes
**para** ofrecer mi producto o servicio a la comunidad Duoc.

## Criterios de aceptación

- **Dado** que soy un usuario autenticado y entrego todos los campos con valores válidos y catálogos válidos,
  **cuando** confirmo la creación,
  **entonces** el sistema crea la publicación asociada a mi usuario, con sede, tipo de venta, categoría, estado inicial y confirma la creación.

- **Dado** que no estoy autenticado,
  **cuando** intento crear una publicación,
  **entonces** el sistema rechaza la operación por autenticación requerida.

- **Dado** que falta el título, la descripción, el precio, la sede, el tipo de venta o la categoría, o un valor es inválido,
  **cuando** intento crear la publicación,
  **entonces** el sistema no crea la publicación e indica el campo inválido.

- **Dado** que la sede, la categoría o el tipo de venta no existe o no está disponible,
  **cuando** intento crear la publicación,
  **entonces** el sistema rechaza la creación por catálogo inválido.

- **Dado** que adjunto una imagen que no puede ser procesada o almacenada, o que excede los límites propuestos,
  **cuando** intento crear la publicación,
  **entonces** el sistema informa el problema y no crea una publicación incompleta.

- **Dado** que el título está fuera de 5 a 100 caracteres o la descripción fuera de 20 a 2.000 caracteres,
  **cuando** intento crear la publicación,
  **entonces** el sistema rechaza la creación por validación. [Supuesto pendiente PO]

- **Dado** que el precio está ausente, es menor o igual a cero, o no está expresado en CLP,
  **cuando** intento crear la publicación,
  **entonces** el sistema rechaza la creación por precio inválido. [Supuesto pendiente PO]

- **Dado** que adjunto más de 5 imágenes, un formato distinto de JPEG, PNG o WebP, o una imagen mayor a 5 MB,
  **cuando** intento crear la publicación,
  **entonces** el sistema rechaza la creación e indica la causa. [Supuesto pendiente PO]

## Reglas de negocio

Aprobadas documentalmente (requerimientos publicaciones, CU005, R.3):

- Solo un usuario autenticado puede crear publicaciones.
- La publicación debe quedar asociada a su propietario.
- Tipo de venta, categoría y sede deben corresponder a registros válidos.
- El control administrativo y bloqueo de contenido se trata por separado.

Propuestas MVP pendientes de validación del Product Owner, no definitivas:

1. Estado inicial `Publicada` solo si no existe moderación previa. Si el negocio exige aprobación administrativa, el estado queda pendiente de confirmación y no se asume otro estado.
2. Máximo 5 imágenes por publicación, formatos JPEG, PNG y WebP, hasta 5 MB por imagen.
3. Precio obligatorio, mayor que cero y expresado en CLP. No se admiten gratuitos ni “a convenir” hasta definir esa necesidad.
4. Título entre 5 y 100 caracteres; descripción entre 20 y 2.000 caracteres.

## Dependencias

- Usuarios autenticados.
- Catálogo de sedes disponible.
- Catálogo de tipos de venta disponible.
- Catálogo de categorías disponible.
- Catálogo de estados de publicación.
- Almacenamiento de imágenes.
- Definición de moderación previa, condiciona el estado inicial.

## Prioridad

**Alta**

Núcleo del MVP. Base para búsqueda, filtros, favoritos, chat, calificaciones y administración.

## Dudas pendientes

- Confirmación PO de los 4 supuestos (estado inicial, imágenes, precio, longitudes).
- Definición de moderación previa: ¿existe aprobación antes de publicar?
- Reglas definitivas de contenido o palabras prohibidas, fuera de esta HU hasta definirse.
- Alcance IA para precio o recomendaciones, fuera de esta HU.

## Estado

`requiere aclaración` — puede continuar con los supuestos como base explícita, pendiente de validación PO para `explore → proposal → spec + design → tasks → apply-progress → verify-report → archive-report`.
