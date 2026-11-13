# HU-REP-02 — Reportar usuario

**Como** estudiante autenticado
**quiero** reportar a otro usuario por una conducta indebida durante una transacción o conversación
**para** alertar a la administración y que evalúe su caso.

## Criterios de aceptación

- **Dado** que soy un estudiante autenticado y selecciono "Reportar usuario" desde el perfil de otro usuario o desde el chat,
  **cuando** describo el motivo y confirmo,
  **entonces** el sistema registra un reporte asociado al usuario reportado y a mí como reportante, en estado pendiente para revisión administrativa.

- **Dado** que intento reportarme a mí mismo,
  **cuando** ejecuto el reporte,
  **entonces** el sistema rechaza la operación (CU012, curso alternativo 1).

- **Dado** que ya tengo un reporte propio en curso contra ese mismo usuario,
  **cuando** intento reportarlo de nuevo,
  **entonces** el sistema informa que ya existe un reporte propio en curso y no registra otro (regla análoga a la de HU-REP-01; decisión aprobada).

- **Dado** que el usuario reportado no existe o ya está eliminado,
  **cuando** intento reportarlo,
  **entonces** el sistema rechaza la operación.

- **Dado** que envío el reporte sin motivo,
  **cuando** intento confirmarlo,
  **entonces** el sistema no lo registra e indica el campo problema.

- **Dado** que no estoy autenticado,
  **cuando** intento reportar,
  **entonces** el sistema rechaza la operación e indica que debo iniciar sesión.

## Reglas de negocio

Aprobadas documentalmente (R.5, CU012 extendido) y resoluciones del dominio administración:

- Solo un estudiante autenticado reporta usuarios.
- No se puede reportar a sí mismo (CU012, alternativa 1).
- El motivo se selecciona de un catálogo predefinido y los comentarios son texto libre (decisión aprobada; MER guarda motivos y comentarios separados).
- El usuario reportado puede ser cualquier usuario registrado distinto de sí mismo (CU012 no acota rol; interpretación mantenida).
- Sin límite de reportes por reportante en un periodo (decisión aprobada: no hay restricción anti-abuso, solo la regla de no duplicar el reporte propio en curso).
- El reporte registra el motivo y comentarios, el reportado y el reportante (entidad `REPORTE_USUARIO` del MER: fk_reportado, fk_reportador, motivos, comentarios, fk_estado_reporte).
- El reporte nace en estado "pendiente" y sigue el ciclo de administración ya decidido: pendiente → en_proceso (activado por el admin) → resuelto o descartado, con posibilidad de reapertura (HU-ADM-01). Las resoluciones posibles son el bloqueo, advertencia o descarte.
- Fuera de alcance de esta HU: resoluciones y sanciones (HU-ADM-01), notificaciones, bloqueos automáticos.

Nota técnica de origen (no define diseño): `ReporteUsuario` no existe en el `schema.prisma`; el MER lo define como tabla de negocio con el patrón `BASE`.

## Dependencias

- Perfil de usuario consultable (HU-PERF existentes) y conversación del chat accesible (HU-CHAT-02/03), desde donde se permite la acción.
- Usuarios autenticados (módulo auth existente).
- Consumo del flujo: HU-ADM-01 (administración), dependiente de esta HU.
- Estados de `ESTADO_REPORTE` vigentes (pendiente, en_proceso, resuelto, descartado).

## Prioridad

**Alta**

R.5 es solicitud explícita; protege la convivencia en conversaciones y transacciones. Las HUs de administración dependen de este flujo.

## Dudas pendientes

- Catálogo de motivos pendiente de gestión: definir quien lo mantiene en spec (opción natural: administración, alineado con ADM-05).

## Estado

`lista` — lista para comenzar `explore → proposal → spec + design → tasks → apply-progress → verify-report → archive-report`.
