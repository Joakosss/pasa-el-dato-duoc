# HU-PUB-01 — Crear publicación

**Como** usuario autenticado  
**quiero** crear una publicación con título, descripción, precio, sede, tipo de venta, categoría e imágenes  
**para** ofrecer mi producto o servicio a la comunidad Duoc.

## Criterios de aceptación

- **Dado** que soy un usuario autenticado y entrego todos los campos con valores válidos y catálogos válidos,
  **cuando** confirmo la creación,
  **entonces** el sistema crea la publicación asociada a mi usuario, con sede, tipo de venta, categoría, estado inicial `Publicada` y confirma la creación.

- **Dado** que no estoy autenticado,
  **cuando** intento crear una publicación,
  **entonces** el sistema rechaza la operación por autenticación requerida.

- **Dado** que falta el título, la descripción, el precio, la sede, el tipo de venta o la categoría, o un valor es inválido,
  **cuando** intento crear la publicación,
  **entonces** el sistema no crea la publicación e indica el campo inválido.

- **Dado** que la sede, la categoría o el tipo de venta no existe o no está disponible,
  **cuando** intento crear la publicación,
  **entonces** el sistema rechaza la creación por catálogo inválido.

- **Dado** que el título tiene menos de 5 o más de 100 caracteres, o la descripción menos de 20 o más de 2.000 caracteres,
  **cuando** intento crear la publicación,
  **entonces** el sistema rechaza la creación por validación.

- **Dado** que el precio está ausente, es menor o igual a cero, no está expresado en CLP, o es “gratis” o “a convenir”,
  **cuando** intento crear la publicación,
  **entonces** el sistema rechaza la creación por precio inválido.

- **Dado** que adjunto cero o más de 5 imágenes, un formato distinto de JPEG, PNG o WebP, o una imagen mayor a 5 MB,
  **cuando** intento crear la publicación,
  **entonces** el sistema rechaza la creación e indica la causa.

- **Dado** que adjunto entre 1 y 5 imágenes válidas con datos válidos,
  **cuando** confirmo la creación,
  **entonces** el sistema crea la publicación con esas imágenes.

## Reglas de negocio

Aprobadas documentalmente (requerimientos publicaciones, CU005, R.3):

- Solo un usuario autenticado puede crear publicaciones.
- La publicación debe quedar asociada a su propietario.
- Tipo de venta, categoría y sede deben corresponder a registros válidos.
- El control administrativo y bloqueo de contenido se trata por separado.

Aprobadas MVP para esta HU:

- Estado inicial `Publicada`, sin moderación previa para el MVP. El bloqueo administrativo es un mecanismo separado.
- Imagen mínima obligatoria: 1 al crear; máximo 5 por publicación.
- Formatos permitidos: JPEG, PNG y WebP. Tamaño máximo 5 MB por imagen.
- Precio obligatorio, en CLP y mayor a $0. No se permite “gratis” ni “a convenir”.
- Título entre 5 y 100 caracteres; descripción entre 20 y 2.000 caracteres.

Fuera de alcance de esta HU: reglas de contenido o palabras prohibidas, IA de precio o recomendaciones, contador de vistas, comprador.

## Dependencias

- Usuarios autenticados.
- Catálogo de sedes disponible.
- Catálogo de tipos de venta disponible.
- Catálogo de categorías disponible.
- Catálogo de estados de publicación.
- Almacenamiento de imágenes.

## Prioridad

**Alta**

Núcleo del MVP. Base para búsqueda, filtros, favoritos, chat, calificaciones y administración.

## Dudas pendientes

- Ninguna bloqueante para iniciar el flujo.

## Estado

`lista` — lista para comenzar `explore → proposal → spec + design → tasks → apply-progress → verify-report → archive-report`.
