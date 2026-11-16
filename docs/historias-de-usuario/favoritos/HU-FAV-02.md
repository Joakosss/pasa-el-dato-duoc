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

## Subtareas

### Backend (BE)

- **HU-FAV-02-BE01:** Reutilizar el módulo y servicio de favoritos de HU-FAV-01 para consultar únicamente los favoritos activos de la cuenta autenticada.
- **HU-FAV-02-BE02:** Exponer `GET /api/favoritos` con paginación por `page` y `pageSize`, aceptando 20 elementos para web y 10 para móvil.
- **HU-FAV-02-BE03:** Definir y validar DTOs de consulta y respuesta, incluyendo `items`, `page`, `pageSize`, `total`, `nextPage`, datos de tarjeta y el indicador `disponible`.
- **HU-FAV-02-BE04:** Incluir publicaciones pausadas, vendidas o eliminadas lógicamente como no disponibles, sin ocultarlas silenciosamente del listado.
- **HU-FAV-02-BE05:** Mantener aislamiento por cuenta, ordenar de forma determinista por fecha de guardado y evitar duplicados entre páginas.
- **HU-FAV-02-BE06:** Documentar autenticación, parámetros, respuesta paginada y errores `400`/`401` en Swagger, manteniendo el detalle implementado en [HU-FAV-02-back-tasks.md](./HU-FAV-02-back-tasks.md).
- **HU-FAV-02-BE07:** Agregar pruebas unitarias/e2e para aislamiento, estado vacío, no disponibles, paginación, orden y parámetros inválidos.

### Frontend (FE)

- **HU-FAV-02-FE01:** Agregar acceso a la sección “Mis favoritos” desde la navegación de la aplicación.
- **HU-FAV-02-FE02:** Implementar la página/listado reutilizando la tarjeta de publicación del catálogo y consumiendo `GET /api/favoritos`.
- **HU-FAV-02-FE03:** Renderizar título, precio, imagen, sede y estado, diferenciando visualmente las publicaciones no disponibles.
- **HU-FAV-02-FE04:** Implementar paginación de 20 elementos para web y 10 para móvil, conservando el estado de página durante la navegación.
- **HU-FAV-02-FE05:** Mostrar estado vacío claro cuando no existan favoritos y permitir navegar al detalle de las publicaciones disponibles.
- **HU-FAV-02-FE06:** Redirigir al inicio de sesión si la sesión no está activa y manejar errores de API o red sin mostrar un listado incompleto como si fuera válido.
- **HU-FAV-02-FE07:** Agregar pruebas de componente o e2e para listado, estado vacío, paginación, publicaciones no disponibles y redirección por sesión.

## Prioridad

**Media**

Es la consecuencia visible de HU-FAV-01: sin este acceso el guardado pierde valor. Va después de HU-FAV-01; no bloquea otros dominios.

## Dudas pendientes

- Orden del listado no definido (sin bloqueo; se propone decidir durante spec, opción natural: más recientes guardados primero).

## Estado

`lista` — lista para comenzar `explore → proposal → spec + design → tasks → apply-progress → verify-report → archive-report`. Depende de HU-FAV-01.
