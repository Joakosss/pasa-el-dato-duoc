# HU-PU-03 — Editar banner publicitario

**Como** marca autorizada y autenticada
**quiero** modificar los datos de un banner propio (imagen, mensaje, vigencia o sedes)
**para** mantener vigente la publicidad con contenido actualizado.

## Criterios de aceptación

- **Dado** que soy dueño del banner entrego valores válidos,
  **cuando** guardo los cambios,
  **entonces** el sistema actualiza el banner y confirma.

- **Dado** que no soy dueño del banner,
  **cuando** intento editarlo,
  **entonces** el sistema deniega la operación.

- **Dado** que las nuevas fechas son inválidas (fin anterior a inicio) o dejo campos vacíos,
  **cuando** intento guardarlo,
  **entonces** el sistema no guarda e indica el campo problema.

- **Dado** que indico una sede nueva en el banner mientras edito,
  **cuando** guardo,
  **entonces** esa sede se agrega a las destinatarias del banner.

- **Dado** que quito una sede ya asignada al banner,
  **cuando** guardo,
  **entonces** la sede deja de estar en las destinatarias efectivas.

- **Dado** que edito un banner que ya está activo (aprobado),
  **cuando** guardo los cambios,
  **entonces** el banner mantiene su vigencia aprobada: no requiere nueva aprobación administrativa (decisión aprobada).

- **Dado** que edito un banner rechazado,
  **cuando** guardo los cambios,
  **entonces** el banner vuelve a quedar pendiente de revisión administrativa (propuesta de proyecto; confirmar en spec).

## Reglas de negocio

Aprobadas documentalmente (R.8 — la gestión de banners incluye editar) y modelo vigente:

- Solo la marca dueña del banner lo edita; el banner mantiene su asociación propietaria (entidad `BANNER_PUBLICIDAD` con `fk_marca`).
- Un banner activo editado no vuelve a aprobación: mantiene su vigencia aprobada, mientras la marca sea dueña y el banner no se elimine (decisión aprobada).
- Las sedes destinatarias se ajustan vía asociaciones `BANNER_SEDE`.
- La vigencia mantiene la regla de fechas: fecha fin posterior a la fecha inicio.
- Fuera de alcance de esta HU: la aprobación administrativa (HU-PU-02) y la presentación a los estudiantes (HU-PU-05).

Nota técnica de origen (no define diseño): CU018 no define la relación entre editar un banner ya aprobado y su aprobación; la decisión tomada cubre ese vacío.

## Dependencias

- HU-PU-01 (existencia del banner) y HU-MAR-01 (cuenta de marca).
- Cuenta de marca autenticada.

## Prioridad

**Media**

Mantener contenido fresco de las marcas; no bloquea el ciclo básico crear→aprobar→ver.

## Dudas pendientes

- Confirmar en spec la propuesta de proyecto: banner rechazado que se edita vuelve a estado pendiente.

## Estado

`lista` — lista para comenzar `explore → proposal → spec + design → tasks → apply-progress → verify-report → archive-report`.
