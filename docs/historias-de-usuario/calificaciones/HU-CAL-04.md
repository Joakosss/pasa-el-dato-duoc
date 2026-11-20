# HU-CAL-04 — Consultar estado de mi calificación en una transacción

**Como** participante de una transacción finalizada (comprador o vendedor)
**quiero** consultar si ya califiqué a mi contraparte en esa transacción
**para** saber si puedo calificar o si ya lo hice, sin depender de un intento fallido.

## Criterios de aceptación

- **Dado** que participé como comprador o vendedor en una venta con calificación activada y aún no califico en esa dirección,
  **cuando** consulto el estado de calificación de esa transacción,
  **entonces** el sistema indica que puedo calificar y que aún no registro calificación en esa dirección.

- **Dado** que como comprador ya califiqué a mi contraparte en esa transacción,
  **cuando** consulto el estado de calificación de esa transacción,
  **entonces** el sistema indica que ya registro mi calificación en esa dirección; lo mismo aplica para el vendedor.

- **Dado** que la venta terminó pero el vendedor aún no activa la calificación,
  **cuando** consulto el estado de calificación de esa transacción,
  **entonces** el sistema indica que la calificación no está activada.

- **Dado** que la publicación no está en estado "Vendida" o no tiene comprador registrado,
  **cuando** consulto el estado de calificación de esa transacción,
  **entonces** el sistema indica que no hay transacción finalizada para calificar.

- **Dado** que no participé en la transacción (ni como comprador ni como vendedor),
  **cuando** consulto el estado de calificación de esa transacción,
  **entonces** el sistema rechaza la consulta.

- **Dado** que no estoy autenticado,
  **cuando** consulto el estado de calificación,
  **entonces** el sistema rechaza la consulta e indica que debo iniciar sesión.

- **Dado** que consulto repetidamente el estado de calificación de una misma transacción,
  **cuando** no hubo cambios en las calificaciones,
  **entonces** el sistema responde siempre el mismo estado sin alterar datos (consulta de solo lectura).

## Reglas de negocio

- El estado de calificación se evalúa por dirección: para el usuario autenticado se usa la misma dupla emisor/receptor de HU-CAL-01 (constraint único por publicación + emisor + receptor).
- Solo un participante autenticado de la transacción puede consultar el estado de su calificación.
- "Ya califiqué" = existe una `Calificacion` con `fk_publicacion`, `fk_emisor` = usuario autenticado y `fk_receptor` = su contraparte.
- Las precondiciones de calificabilidad coinciden con HU-CAL-01: publicación existente, no eliminada, estado "Vendida", comprador registrado y calificación activada (HU-CAL-03).
- La consulta es de solo lectura e idempotente: no crea, modifica ni activa calificaciones.
- Fuera de alcance de esta HU: consultar si la contraparte ya calificó, visualizar el contenido de calificaciones de la contraparte, promedios de perfil (HU-CAL-02) y el formulario de calificación (HU-CAL-01).

## Subtareas

### Backend (BE)

- **HU-CAL-04-BE01:** Definir contrato REST para consultar el estado de calificación de una transacción (publicación) desde la sesión del usuario; definir respuesta con: si hay transacción finalizada, si la calificación está activada, si el usuario es participante y si ya registró su calificación en su dirección.
- **HU-CAL-04-BE02:** Implementar la consulta de `Calificacion` por `fk_publicacion` + `fk_emisor` = usuario autenticado, reutilizando las precondiciones de HU-CAL-01 (existencia, no eliminada, estado `Vendida`, comprador registrado, calificación activada).
- **HU-CAL-04-BE03:** Validar sesión y participación: solo comprador o vendedor de la publicación puede consultar su estado; definir códigos de error coherentes con el contrato.
- **HU-CAL-04-BE04:** Garantizar que la consulta no exponga calificaciones de terceros ni de la contraparte, solo el estado respecto al usuario autenticado.
- **HU-CAL-04-BE05:** Documentar el contrato y las respuestas de error en Swagger (401/403/404).
- **HU-CAL-04-BE06:** Añadir pruebas unitarias/e2e para: participante sin calificar, participante ya calificado (comprador y vendedor), sin activación, sin transacción finalizada, no participante, no autenticado y repetición de la consulta.

### Frontend (FE)

- **HU-CAL-04-FE01:** Al cargar la vista de una publicación vendida, consultar el estado de calificación y mostrar la acción "Calificar" o el estado "Ya calificaste" según corresponda, reemplazando la necesidad de adivinar con intentos.
- **HU-CAL-04-FE02:** Manejar los estados de la consulta: calificable pendiente, ya calificado, calificación no activada, sin transacción finalizada; ocultar la acción cuando el usuario no es participante.
- **HU-CAL-04-FE03:** Tras registrar una calificación (HU-CAL-01), actualizar el estado local para mostrar "Ya calificaste" sin nueva consulta obligatoria ni reenvíos.
- **HU-CAL-04-FE04:** Manejar errores de la consulta (sesión expirada, no participante, transacción no encontrada) con feedback comprensible y estados de carga.

## Dependencias

- HU-CAL-01 (registro de calificación; esta HU consulta su resultado y completa el flujo de su criterio FE05).
- HU-CAL-03 (activación de la calificación por el vendedor).
- HU-COM-01 (transacción identificable: publicación "Vendida" con comprador registrado).
- HU-PUB-05 / HU-PUB-06 (vista de publicación donde se muestra el estado).
- Usuarios autenticados (módulo auth existente).

## Prioridad

**Media**

No bloquea calificar, pero es necesaria para el criterio FE05 de HU-CAL-01 ("estado ya calificaste"), que hoy no tiene soporte backend. Recomendable junto con HU-CAL-01 en el mismo desarrollo.

## Dudas pendientes

- Ninguna bloqueante.

## Estado

**Backend completado y verificado (2026-11-17).** BE01–BE06 implementados en conjunto como un solo cambio; desbloquea FE01–FE04 y el criterio FE05 de HU-CAL-01.

- **Contrato:** `GET /api/publicaciones/:id/calificaciones/estado`, guard `JwtAuthGuard`. Respuesta 200 con `publicacionId`, `transaccionFinalizada`, `calificacionActivada`, `yaCalifico`. Errores: 401 (sin sesión), 403 (no participante), 404 (publicación inexistente/eliminada). Estados no-calificables viajan en 200 con flags.
- **Implementación:** módulo `calificaciones` (`calificaciones.controller.ts`, `calificaciones.service.ts`, `dto/estado-calificacion-respuesta.dto.ts`). Helpers compartidos con `crear`: `cargarPublicacionCalificable` y `resolverContraparte`. Consulta de solo lectura, sin cambios de schema.
- **Verificación:** suite e2e completa 270/270 en verde (incluye 8 casos nuevos de HU-CAL-04 en `test/calificaciones.e2e-spec.ts`); lint 0 errores. Nota: 1 fallo puntual no relacionado en `chat-mensajeria.gateway` por timeout WebSocket en una corrida global (flaky preexistente).
- **Plan:** `HU-CAL-04-be-tasks.md` (T1–T5 completados).
- **Pendiente:** FE01–FE04 (cambio frontend separado).

Archivos afectados backend:
- `pasa-el-dato-back/src/calificaciones/calificaciones.controller.ts`
- `pasa-el-dato-back/src/calificaciones/calificaciones.service.ts`
- `pasa-el-dato-back/src/calificaciones/dto/estado-calificacion-respuesta.dto.ts`
- `pasa-el-dato-back/test/calificaciones.e2e-spec.ts`
