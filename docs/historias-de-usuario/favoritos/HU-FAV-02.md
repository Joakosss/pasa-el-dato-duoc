# HU-FAV-02 — Ver listado "Mis favoritos"

**Como** estudiante autenticado
**quiero** acceder a la sección "Mis favoritos"
**para** revisar las publicaciones que guardé y retomar mi interés en ellas.

## Criterios de aceptación

- **Dado** que soy un usuario autenticado,
  **cuando** accedo a "Mis favoritos",
  **entonces** el sistema muestra solo las publicaciones que guardé como favoritas, con los mismos datos de tarjeta que el catálogo general (título, precio, imagen, sede, estado).

- **Dado** que un usuario autenticado tiene favoritos guardados,
  **cuando** consulta "Mis favoritos",
  **entonces** las favoritas de otros usuarios no aparecen en su listado.

- **Dado** que una publicación guardada fue eliminada o marcada como no disponible por el vendedor o la administración,
  **cuando** consulto "Mis favoritos",
  **entonces** la publicación se muestra con indicación de "no disponible" y no desaparece silenciosamente del listado.

- **Dado** que no tengo ninguna publicación guardada,
  **cuando** accedo a "Mis favoritos",
  **entonces** el sistema muestra un estado vacío con un mensaje claro de que no tengo favoritos.

- **Dado** que no estoy autenticado,
  **cuando** intento acceder a "Mis favoritos",
  **entonces** el sistema redirige al inicio de sesión.

- **Dado** que estoy en "Mis favoritos",
  **cuando** accedo al detalle de una favorita disponible,
  **entonces** llego al detalle normal de la publicación.

- **Dado** que tengo más favoritos de los que caben en una página,
  **cuando** navego el listado desde la web,
  **entonces** el listado se pagina en bloques de 20 favoritos por página; desde un dispositivo móvil, en bloques de 10 por página (decisión de negocio aprobada).

## Reglas de negocio

Aprobadas documentalmente (R.12, CU016 extendido):

- El listado muestra solo los favoritos del usuario autenticado.
- Una favorita eliminada por el vendedor se muestra como no disponible dentro de la lista (CU016, curso alternativo 2).
- Listado paginado: 20 por página en web, 10 por página en móvil (decisión de negocio aprobada).

Fuera de alcance de esta HU: marcar o desmarcar (HU-FAV-01), filtros u ordenamiento dentro del listado, notificaciones (R.14/CU021).

## Dependencias

- HU-FAV-01 (guardar y quitar favorito).
- Usuarios autenticados (módulo auth existente).
- Componente de tarjeta de publicación y catálogo existentes en el frontend.
- Consulta del estado actual de las publicaciones favoritas para diferenciar disponibles y no disponibles.

## Prioridad

**Media**

Es la consecuencia visible de HU-FAV-01: sin este acceso el guardado pierde valor. Va después de HU-FAV-01; no bloquea otros dominios.

## Dudas pendientes

- Orden del listado no definido (sin bloqueo; se propone decidir durante spec, opción natural: más recientes guardados primero).

## Estado

`lista` — lista para comenzar `explore → proposal → spec + design → tasks → apply-progress → verify-report → archive-report`. Depende de HU-FAV-01.
