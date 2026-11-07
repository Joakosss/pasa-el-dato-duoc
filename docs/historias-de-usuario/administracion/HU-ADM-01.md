# HU-ADM-01 — Gestionar reportes de usuario

**Como** administrador
**quiero** revisar los reportes contra usuarios y resolverlos bloqueando, advirtiendo o descartando
**para** mantener la convivencia de la comunidad y responder ante conductas indebidas.

## Criterios de aceptación

- **Dado** que soy un administrador autenticado,
  **cuando** accedo al panel de reportes de usuario,
  **entonces** el sistema muestra los reportes pendientes con su descripción y usuario involucrado.

- **Dado** que selecciono un reporte,
  **cuando** reviso su detalle,
  **entonces** el sistema muestra la información del reporte y el historial relevante del usuario reportado.

- **Dado** que decido tomar un reporte en revisión,
  **cuando** lo activo,
  **entonces** el sistema pasa el reporte a "en_proceso" y queda registrado como en revisión por mí (decisión aprobada).

- **Dado** que decido bloquear al usuario y confirmo,
  **cuando** ejecuto la acción,
  **entonces** el sistema bloquea la cuenta, marca el reporte como resuelto y registra la acción en el log de auditoría.

- **Dado** que un reporte está resuelto o descartado y necesita revisarse de nuevo,
  **cuando** lo reabro,
  **entonces** el sistema lo devuelve al estado pendiente para un nuevo tratamiento (decisión aprobada).

- **Dado** que el reporte es infundado,
  **cuando** lo descarto,
  **entonces** el sistema marca el reporte como descartado sin sancionar al usuario.

- **Dado** que opto por solo advertir al usuario,
  **cuando** confirmo la advertencia,
  **entonces** el sistema marca el reporte como resuelto y deja constancia de la advertencia en el registro.

- **Dado** que intento gestionar reportes sin sesión o sin rol de administrador,
  **cuando** ejecuto la acción,
  **entonces** el sistema rechaza la operación.

## Reglas de negocio

Aprobadas documentalmente (R.6, CU013 extendido, R.33):

- Solo un administrador autenticado gestiona reportes de usuario.
- Resoluciones posibles: bloqueo, advertencia o descarte; toda resolución deja el reporte fuera del estado pendiente (estados de `ESTADO_REPORTE` del MER: pendiente, en_proceso, resuelto, descartado).
- El administrador activa el tratamiento del reporte: el estado "en_proceso" se asigna voluntariamente al tomarlo en revisión (decisión aprobada).
- Un reporte resuelto o descartado puede reabrirse: vuelve a estado pendiente (decisión aprobada).
- La advertencia al usuario se deja registrada; su entrega como notificación queda pendiente para el futuro módulo notificaciones (otra HU, otro dominio; decisión aprobada).
- La resolución se registra en el log de auditoría con trazabilidad (R.33).
- El bloqueo de cuenta aplica el patrón BASE-EXTRA del modelo (bloqueado, fecha_bloqueo, motivo_bloqueo).
- Un usuario bloqueado pierde el acceso según el comportamiento general de bloqueo.

Fuera de alcance de esta HU: crear reportes (acción del estudiante: CU011/CU012, dominio reportes sin HU aprobada hoy), la entrega de la advertencia como notificación (futuro módulo notificaciones) y los reportes contra publicaciones (HU-ADM-02).

Nota técnica de origen (no define diseño): `ReporteUsuario` y `EstadoReporte` no existen en el `schema.prisma`; el MER los define como tablas de negocio.

## Dependencias

- Reportes de usuario entrantes: requiere el flujo de creación de reportes por estudiantes (CU011/CU012), sin HU aprobada aún. **Prerrequisito funcional pendiente.**
- Rol administrador autenticado (módulo auth y roles existentes).
- Historial del usuario consultable (perfil existente).
- `log_api` para auditoría (existe en el modelo).

## Prioridad

**Alta**

Seguridad de la comunidad y cumplimiento institucional (R.6/R.33). No bloquea otros flujos de publicación, pero responde a reportes acumulados.

## Dudas pendientes

- Ninguna en este módulo. Pendiente externo: HU de creación de reportes por estudiantes (prerrequisito funcional) y módulo notificaciones para la entrega de advertencias.

## Estado

`lista` — lista para comenzar `explore → proposal → spec + design → tasks → apply-progress → verify-report → archive-report`. Prerrequisito funcional: creación de reportes por estudiantes (HU futura de dominio reportes).
