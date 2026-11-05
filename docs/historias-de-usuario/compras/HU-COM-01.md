# HU-COM-01 — Cerrar venta con registro de comprador

**Como** vendedor dueño de una publicación
**quiero** registrar el cierre de mi venta con el comprador que la realizó
**para** dejar constancia de la transacción y habilitar la calificación mutua posterior.

## Criterios de aceptación

- **Dado** que soy el vendedor dueño autenticado de una publicación finalizable y indico un comprador válido,
  **cuando** marco la publicación como "Vendida" en un solo paso,
  **entonces** el sistema cierra la venta: la publicación queda en estado "Vendida" y el comprador indicado queda registrado como parte de la transacción, en una única acción.

- **Dado** que una venta quedó cerrada con comprador registrado,
  **cuando** cualquier participante consulta la publicación vendida,
  **entonces** la transacción es identificable con sus tres partes: publicación, vendedor y comprador.

- **Dado** que intento cerrar la venta de una publicación que no es mía,
  **cuando** ejecuto el cierre,
  **entonces** el sistema rechaza la operación.

- **Dado** que no estoy autenticado,
  **cuando** intento cerrar la venta,
  **entonces** el sistema rechaza la operación e indica que debo iniciar sesión.

- **Dado** que la publicación no existe, está eliminada o ya está en estado "Vendida",
  **cuando** intento cerrar la venta,
  **entonces** el sistema no realiza el cierre.

- **Dado** que indico un comprador que no existe como usuario válido del sistema,
  **cuando** intento cerrar la venta,
  **entonces** el sistema rechaza el cierre e indica que el comprador es inválido.

- **Dado** que intento cerrar una venta cuyo comprador registrado soy yo mismo,
  **cuando** ejecuto el cierre,
  **entonces** el sistema rechaza la operación e indica que no puedo ser comprador de mi propia publicación.

- **Dado** que la venta ya está cerrada con comprador registrado,
  **cuando** intento cerrarla de nuevo o indicar un comprador distinto,
  **entonces** el sistema no altera el registro: el comprador registrado queda fijo y el cierre no se duplica.

## Reglas de negocio

Decisiones de negocio aprobadas y modelo vigente:

- El cierre de venta es un paso único: el vendedor marca la publicación como "Vendida" indicando en la misma acción al comprador (decisión aprobada). Al quedar "Vendida", la transacción ya tiene sus tres partes identificables.
- Consecuencia de la decisión: la asignación directa del estado "Vendida" sin comprador vía HU-PUB-04 deja de existir como cierre de venta; al asignar "Vendida" por estados (HU-PUB-04), ahora es el cierre definido aquí (se ajustará en la especificación de ambas HUs).
- Toda compraventa ocurre entre usuarios registrados de la plataforma; "Vendida" implica siempre un comprador registrado (decisión aprobada). No existe venta válida sin comprador registrado.
- Transacción finalizada = publicación en estado "Vendida" con su comprador registrado (decisión aprobada en calificaciones).
- El comprador queda registrado en la publicación (`fk_user_comprador` del modelo vigente); el cierre vincula publicación, vendedor y comprador como las tres partes de la transacción.
- Solo el vendedor dueño autenticado puede cerrar la venta.
- Ni el vendedor ni la publicación pueden duplicar el cierre de una venta ya cerrada.
- El comprador registrado queda fijo tras el cierre: no se puede corregir ni cambiar después, incluido el propio vendedor (decisión aprobada).

Fuera de alcance de esta HU: cambio de estado independiente En curso/Pausada (HU-PUB-04), activación de calificaciones (HU-CAL-03), calificar (HU-CAL-01), notificaciones.

Nota técnica de origen (no define diseño): el modelo `publicacion` ya tiene el campo `fk_user_comprador` (nullable) en BD; no existe módulo de compras.

## Dependencias

- HU-PUB-01 (crear publicación). HU-PUB-04 queda para En curso/Pausada; la asignación de "Vendida" pasa a ser el cierre de venta de esta HU (ajuste definido en reglas).
- Usuarios registrados disponibles como compradores (módulo auth existente).
- Esta HU desbloquea: HU-CAL-01 y HU-CAL-03 (la calificación necesita comprador registrado).

## Prioridad

**Alta**

Es la única pieza faltante para el flujo completo de compraventa: sin comprador registrado no hay transacción identificable ni calificación (R.13 bloqueada por esto).

## Dudas pendientes

- Ninguna bloqueante.

## Estado

`lista` — lista para comenzar `explore → proposal → spec + design → tasks → apply-progress → verify-report → archive-report`.
