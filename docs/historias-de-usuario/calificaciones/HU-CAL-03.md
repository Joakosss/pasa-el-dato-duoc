# HU-CAL-03 — Activar la calificación de una venta finalizada

**Como** vendedor dueño de una publicación vendida
**quiero** activar la calificación de esa venta una vez finalizado el intercambio
**para** que ambas partes, comprador y vendedor, puedan calificarse mutuamente.

## Criterios de aceptación

- **Dado** que soy el vendedor dueño de una publicación en estado "Vendida" y aún no activé su calificación,
  **cuando** activo la calificación de esa venta,
  **entonces** la calificación queda activada y ambas partes (comprador y vendedor) pueden calificar.

- **Dado** que la venta no es mía (no soy el dueño de la publicación),
  **cuando** intento activar su calificación,
  **entonces** el sistema rechaza la operación.

- **Dado** que la publicación no está en estado "Vendida",
  **cuando** intento activar la calificación,
  **entonces** el sistema rechaza la operación e indica que la venta no está finalizada.

- **Dado** que ya activé la calificación de esa venta,
  **cuando** intento activarla de nuevo,
  **entonces** el sistema no duplica la activación y mantiene el estado activado.

- **Dado** que no estoy autenticado,
  **cuando** intento activar la calificación,
  **entonces** el sistema rechaza la operación e indica que debo iniciar sesión.

- **Dado** que la calificación quedó activada,
  **cuando** cualquiera de los participantes regresa luego a la publicación vendida,
  **entonces** la acción calificar permanece disponible sin límite de tiempo mientras la publicación esté "Vendida".

## Reglas de negocio

Decisiones de negocio aprobadas:

- La activación es ejecutada por el vendedor dueño de la publicación, una vez finalizado el intercambio (decisión aprobada).
- Mientras la calificación no esté activada, ningún participante puede calificar (consecuencia implementada en HU-CAL-01).
- La activación es una sola por venta; al activar queda habilitada la calificación en ambas direcciones (decisión aprobada).
- Sin ventana temporal de expiración: la activación y la posibilidad de calificar persisten mientras la publicación esté en estado "Vendida" (decisión aprobada).

Fuera de alcance de esta HU: elaborar calificaciones (HU-CAL-01), ver calificaciones en el perfil (HU-CAL-02), cierre de venta y registro del comprador (dominio compras), notificaciones.

Nota técnica de origen (no define diseño): la activación requiere persistencia en la publicación o en un registro asociado; la ubicación exacta se resuelve en spec y design. La tabla `Calificacion` de MER no registra la activación.

## Dependencias

- Publicación en estado "Vendida" asignable por su dueño (HU-PUB-04, implementada en backend).
- Usuarios autenticados (módulo auth existente).
- HU-CAL-01 depende de esta HU.
- Registro del comprador en `fk_user_comprador` al cerrar la venta: **HU-COM-01 (cerrar venta con registro de comprador), actualmente `requiere aclaración`. Los criterios de CAL-01 asumen ese registro; si el cierre de venta y la activación coinciden en un flujo, el spec lo integra allí.**

## Prioridad

**Alta**

Es la puerta de entrada de todo el flujo de calificación: sin activación no existen calificaciones (CAL-01) ni perfil reputacional (CAL-02).

## Dudas pendientes

- ¿La activación coincide con el registro del comprador en el cierre de venta (mismo flujo del dominio compras) o son acciones separadas del vendedor? No bloqueante del diseño funcional; se resuelve en spec junto al dominio compras.

## Estado

`lista` — lista para comenzar `explore → proposal → spec + design → tasks → apply-progress → verify-report → archive-report`. Depende de HU-PUB-04 (estado "Vendida") y de HU-COM-01 (registro del comprador).
