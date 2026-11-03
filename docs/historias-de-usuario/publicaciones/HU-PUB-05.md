# HU-PUB-05 — Ver detalle de publicación

**Como** usuario  
**quiero** ver el detalle de una publicación con sus imágenes, precio, sede, categoría, tipo de venta y estado  
**para** evaluar el producto o servicio antes de contactar al vendedor.

## Criterios de aceptación

- **Dado** que consulto una publicación existente no eliminada,
  **cuando** abro su detalle,
  **entonces** el sistema muestra título, descripción, precio en CLP, imágenes (entre 1 y 5), sede, tipo de venta, categoría, estado y fecha de publicación con los datos vigentes.

- **Dado** que la publicación no existe o está eliminada (`eliminado = true`),
  **cuando** intento abrir su detalle,
  **entonces** el sistema indica que no está disponible y no muestra su contenido.

- **Dado** que la publicación pertenece a otro usuario,
  **cuando** abro su detalle,
  **entonces** el sistema muestra la información siempre que no esté eliminada; la pertenencia no restringe la consulta.

- **Dado** que la calidad de una imagen adjunta impide mostrarla,
  **cuando** se renderiza el detalle,
  **entonces** el sistema muestra las imágenes disponibles sin interrumpir la consulta del resto del detalle.

## Reglas de negocio

Aprobadas documentalmente (requerimientos publicaciones):

- El detalle refleja los datos definidos para la publicación: título, descripción, precio, estado, tipo de venta, categoría, propietario, sede e imágenes.
- Las publicaciones eliminadas se excluyen de las consultas normales (definido en HU-PUB-02 y HU-PUB-03).

Aprobadas MVP para esta HU:

- Cualquier usuario autenticado puede ver el detalle de una publicación no eliminada, propia o ajena.
- El contador de vistas queda fuera del alcance mientras no se confirme en el modelo definitivo (pendiente documental).

Pendiente de decisión antes de especificar:

- Si usuarios no autenticados pueden ver el detalle de una publicación.

Fuera de alcance: búsqueda y filtros (dominio propio), favoritos, chat, creaciones o ediciones desde el detalle, contador de vistas.

## Dependencias

- HU-PUB-01 — Crear publicación.
- Catálogo de sedes, tipos de venta, categorías y estados disponible.

## Prioridad

**Alta**

El detalle es puerta de entrada a chat, favoritos y compras; sin él el resto de la interacción no tiene punto de partida.

## Dudas pendientes

- ¿Usuarios no autenticados pueden ver el detalle de una publicación? No bloquea explorar, bloquea especificar la visualización pública.

## Subtareas
### Backend (BE)
- **HU-PUB-05-BE01**: Crear endpoint de detalle `GET /api/v1/publicaciones/{id}` (público o protegido según decisión pendiente), retornando el set completo: título, descripción, precio CLP, imágenes (1..5), sede, tipo de venta, categoría, estado y fecha de publicación.
- **HU-PUB-05-BE02**: Implementar regla de exclusión: si no existe o `eliminado = true`, responder “no disponible” (sin exponer contenido).
- **HU-PUB-05-BE03**: Asegurar que la pertenencia no restrinja la consulta (siempre que no esté eliminada).
- **HU-PUB-05-BE04**: Normalizar formato de respuesta para soportar fallas parciales de imágenes (p. ej. URLs que no cargan no deben romper el detalle; asegurar que el API no “falle” por una imagen inválida si el modelo lo permite).
- **HU-PUB-05-BE05**: Pruebas unitarias e integración para: detalle existente, no encontrada, eliminada, accesible siendo ajena; y contract tests del payload.

### Frontend (FE)
- **HU-PUB-05-FE01**: Crear/ajustar página de detalle de publicación que consuma el endpoint y renderice todos los campos requeridos.
- **HU-PUB-05-FE02**: Implementar galería/carrusel de imágenes (1..5) con *fallback* por imagen (si una falla, se omite/placeholder sin romper el resto).
- **HU-PUB-05-FE03**: Manejar el caso “no disponible” (no existe/eliminada) mostrando vista consistente (p. ej. `not-found`/mensaje + CTA).
- **HU-PUB-05-FE04**: Formatear precio en CLP y fecha de publicación según estándar del front.
- **HU-PUB-05-FE05**: Controlar estados de carga y error de red (skeleton/error boundary) para navegación estable.

### Integración y QA (INT/QA)
- **HU-PUB-05-INT01**: Definir y documentar contrato OpenAPI/Swagger del detalle (campos, tipos, ejemplos, errores).
- **HU-PUB-05-INT02**: Pruebas E2E: abrir detalle desde listado, validar render de campos, y escenario eliminada/no existe.
- **HU-PUB-05-INT03**: Resolver y documentar decisión de acceso: “¿usuarios no autenticados pueden ver el detalle?” y reflejarla en auth middleware/guards + pruebas.

## Estado

`requiere aclaración` — única duda es la visualización sin autenticación; el resto está definido.
