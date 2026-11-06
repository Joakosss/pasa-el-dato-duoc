# HU-PU-02 — Aprobar o rechazar un banner publicitario

**Como** administrador
**quiero** revisar los banners pendientes y aprobarlos o rechazarlos
**para** que solo circule publicidad que cumple las normativas institucionales.

## Criterios de aceptación

- **Dado** que soy un administrador autenticado,
  **cuando** accedo al panel de pendientes de aprobación,
  **entonces** el sistema muestra los banners pendientes con su marca, imagen, mensaje, vigencia y sedes destinatarias.

- **Dado** que un banner cumple las normativas,
  **cuando** lo apruebo,
  **entonces** queda activo y pasa a mostrarse durante su vigencia a los usuarios autenticados de las sedes destinatarias (única forma de quedar activo).

- **Dado** que la marca ya tiene 3 banners activos y apruebo un cuarto,
  **cuando** ejecuto la aprobación,
  **entonces** el sistema rechaza la aprobación e indica que la marca alcanzó su límite de banners activos simultáneos (límite 3, decisión de proyecto).

- **Dado** que un banner incumple las normativas,
  **cuando** lo rechazo,
  **entonces** queda rechazado (no muestra) y el sistema notifica a la marca el motivo del rechazo (CU018, curso alternativo 1).

- **Dado** que un banner está pendiente y ya pasó su fecha de inicio sin resolución,
  **cuando** lo reviso,
  **entonces** sigue apareciendo como pendiente (la vigencia corre solo si se aprueba dentro del periodo).

- **Dado** que no estoy autenticado o no tengo rol de administrador,
  **cuando** intento resolver banners,
  **entonces** el sistema rechaza la operación.

## Reglas de negocio

Aprobadas documentalmente (R.8, CU018 extendido):

- La aprobación es el único mecanismo por el cual un banner se activa (CU018, curso normal).
- El rechazo notifica a la marca con el motivo (CU018, curso alternativo 1).
- Solo un administrador autenticado resuelve banners.
- El administrador solo aprueba o rechaza; no edita banners (decisión aprobada).
- Límite de banners activos simultáneos por marca: 3; una aprobación que superaría el límite se rechaza (decisión de proyecto).
- La activación está acotada al periodo de vigencia definido y a las sedes seleccionadas por la marca (CU018, paso 3 del curso normal).
- Fuera de alcance de esta HU: la gestión de cuentas de marcas (ver HU-PU-01, dudas), la edición de banners por parte del administrador y la moderación de contenido de mensajes de usuarios.

Nota técnica de origen (no define diseño): la decisión de aprobación requiere persistir el estado del banner (pendiente / activo / rechazado); el MER no lista de forma explícita ese estado en `BANNER_PUBLICIDAD`, se define en spec.

## Dependencias

- HU-PU-01 (banners creados pendientes de resolución).
- Rol administrador autenticado (módulo auth y roles existentes).

## Prioridad

**Alta**

Es la bisagra del ciclo: controla lo que circula a estudiantes (R.8). Sin aprobación no hay banner visible.

## Dudas pendientes

- Banner rechazado reenviado tras edición: vuelve a quedar pendiente de revisión (propuesta de proyecto; confirmar junto al flujo de edición en spec).

## Estado

`lista` — lista para comenzar `explore → proposal → spec + design → tasks → apply-progress → verify-report → archive-report`. Depende de HU-PU-01 y HU-MAR-01.
