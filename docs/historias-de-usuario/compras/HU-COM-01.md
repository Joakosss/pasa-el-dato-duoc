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

## Subtareas

### Backend (BE)

- **HU-COM-01-BE01:** Definir el contrato de cierre de venta y DTO de entrada con el identificador del comprador; coordinarlo con HU-PUB-04 para que “Vendida” no se asigne sin comprador.
- **HU-COM-01-BE02:** Implementar el cierre como una única operación atómica que registre `fk_user_comprador` y cambie el estado a “Vendida”.
- **HU-COM-01-BE03:** Validar sesión, existencia de la publicación, propiedad del vendedor, y que no esté eliminada ni vendida.
- **HU-COM-01-BE04:** Validar que el comprador corresponda a un usuario registrado válido y sea distinto del vendedor.
- **HU-COM-01-BE05:** Evitar cierres concurrentes o repetidos y asegurar que el comprador registrado no pueda cambiarse tras el cierre.
- **HU-COM-01-BE06:** Incluir publicación, vendedor y comprador en la respuesta de consulta de una publicación vendida, con acceso para sus participantes según el contrato definido.
- **HU-COM-01-BE07:** Documentar el contrato y respuestas de error en Swagger.
- **HU-COM-01-BE08:** Añadir pruebas unitarias/e2e para cierre válido, autenticación, ownership, publicación inexistente/eliminada/vendida, comprador inválido o propio, repetición y consulta de la transacción.
- **HU-COM-01-BE09:** Resolver en spec/design el mecanismo para identificar al comprador registrado; actualmente no se encontró un endpoint de búsqueda de usuarios disponible.

### Frontend (FE)

- **HU-COM-01-FE01:** Incorporar la acción de cerrar venta para el vendedor dueño, solo cuando la publicación sea finalizable.
- **HU-COM-01-FE02:** Implementar la selección o identificación de un comprador registrado conforme al contrato que se defina; no asumir que ya existe API de búsqueda.
- **HU-COM-01-FE03:** Añadir confirmación del cierre y enviar publicación y comprador en una sola solicitud.
- **HU-COM-01-FE04:** Mostrar carga y evitar envíos duplicados mientras se procesa el cierre.
- **HU-COM-01-FE05:** Actualizar la vista tras el cierre y presentar la transacción con publicación, vendedor y comprador.
- **HU-COM-01-FE06:** Manejar errores de sesión, permisos, publicación no finalizable, comprador inválido o igual al vendedor, y venta ya cerrada, con feedback comprensible.

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
