# HU-CAL-01 — Calificar contraparte tras finalizar una compra

**Como** parte de una transacción finalizada (comprador o vendedor)
**quiero** calificar con puntaje y comentario a mi contraparte desde la publicación finalizada
**para** aportar confianza a la comunidad sobre cómo fue la transacción.

## Criterios de aceptación

- **Dado** que participé como comprador o vendedor en una venta activada para calificación (HU-CAL-03: publicación en estado "Vendida", comprador registrado y calificación activada por el vendedor) y aún no califico a mi contraparte en esa dirección,
  **cuando** accedo a la publicación y selecciono "Calificar",
  **entonces** el sistema muestra el formulario de calificación con puntaje y comentario.

- **Dado** que la venta terminó pero el vendedor aún no activa la calificación,
  **cuando** intento calificar,
  **entonces** el sistema rechaza la operación e indica que la calificación de esa venta no está activada.

- **Dado** que como comprador envío el formulario con puntaje entre 1 y 5 y sin comentario,
  **cuando** confirmo la calificación,
  **entonces** el sistema registra mi calificación hacia el vendedor, asociada a la transacción (publicación, vendedor y comprador) y confirma.

- **Dado** que como vendedor envío el formulario con puntaje entre 1 y 5 y sin comentario,
  **cuando** confirmo la calificación,
  **entonces** el sistema registra mi calificación hacia el comprador, asociada a la transacción (publicación, vendedor y comprador) y confirma.

- **Dado** que envío la calificación con comentario,
  **cuando** confirmo,
  **entonces** el sistema registra el comentario junto al puntaje.

- **Dado** que como comprador ya califiqué a la contraparte en esa transacción,
  **cuando** intento calificar de nuevo hacia esa misma contraparte,
  **entonces** el sistema impide la segunda calificación y no registra el duplicado; lo mismo aplica para el vendedor hacia el comprador.

- **Dado** que la transacción no existe o la publicación no está en estado "Vendida",
  **cuando** intento calificar,
  **entonces** el sistema rechaza la operación e indica que no hay transacción finalizada para calificar.

- **Dado** que no estuve involucrado en la transacción (ni como comprador ni como vendedor),
  **cuando** intento calificarla,
  **entonces** el sistema rechaza la operación.

- **Dado** que no estoy autenticado,
  **cuando** intento calificar,
  **entonces** el sistema rechaza la operación e indica que debo iniciar sesión.

- **Dado** que envío el formulario sin puntaje, con puntaje fuera del rango 1 a 5, o con un comentario que excede el límite de caracteres,
  **cuando** intento confirmar,
  **entonces** el sistema no registra la calificación e indica el campo problema.

## Reglas de negocio

Aprobadas documentalmente (R.13, CU017 extendido) y decisiones de negocio aprobadas:

- Solo puede calificar un participante de la transacción (comprador o vendedor) que esté autenticado (precondición CU017).
- Transacción finalizada = publicación en estado "Vendida" con su comprador registrado (decisión aprobada).
- La calificación se activa: el vendedor dueño de la publicación activa la calificación de la venta una vez finalizada; solo desde entonces puede calificar cualquiera de los dos participantes (decisión aprobada, ver HU-CAL-03).
- Sin ventana temporal de expiración: mientras la publicación esté "Vendida" con calificación activada, el botón permanece disponible (decisión aprobada).
- La calificación es mutua: comprador y vendedor pueden calificarse los dos; por cada transacción hay como máximo dos calificaciones, una por dirección (decisión aprobada).
- Impedida una segunda calificación por la misma dirección (mismo emisor hacia el mismo receptor en la misma transacción).
- Puntaje obligatorio en escala entera 1 a 5 (decisión aprobada).
- Comentario opcional; si se incluye, se registra junto al puntaje (decisión aprobada). El límite de caracteres se fija en la especificación.
- La calificación vincula transacción: publicación, vendedor y comprador (entidad `Calificacion` del MER).

Fuera de alcance de esta HU: visualización de calificaciones y promedio en el perfil (HU-CAL-02), moderación de comentarios, notificaciones, cierre de venta y registro del comprador (dominio compras).

Nota técnica de origen (no define diseño): `Calificacion` no existe aún en el `schema.prisma`; el MER del proyecto la define como tabla de negocio con `puntaje`, `comentario`, `id_user_comprador`, `id_user_vendedor`, `id_publicacion` y campos `BASE`.

## Dependencias

- HU-CAL-03 (activación de la calificación por el vendedor).
- Usuarios autenticados (módulo auth existente).
- Publicación en estado "Vendida" con comprador registrado en `fk_user_comprador` a través del cierre de venta (HU-COM-01). **Esta HU no puede completarse sin HU-COM-01.**
- Publicación accesible en su estado vendida (HU-PUB-05, HU-PUB-06).

## Prioridad

**Alta**

Genera confianza y es base del perfil reputacional. Bloqueada por la ausencia del dominio compras.

## Dudas pendientes

- Ninguna bloqueante.

## Estado

`lista` — lista para comenzar `explore → proposal → spec + design → tasks → apply-progress → verify-report → archive-report`. Depende de HU-CAL-03 y de HU-COM-01.
