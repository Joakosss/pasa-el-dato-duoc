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

## Subtareas

### Backend (BE)

- **HU-PU-03-BE01:** Endpoint marca para editar banner propio.  
  - `PATCH /api/publicidad/banners/:id` (multipart opcional si se permite cambiar imagen).  
  - Actualizar campos: imagen?, mensaje?, inicio/fin?, sedes?.

- **HU-PU-03-BE02:** Reglas de estado al editar.  
  - Si banner está `ACTIVO`, mantiene estado (no vuelve a revisión).  
  - Si está `RECHAZADO`, al editar pasa a `PENDIENTE` (confirmar en spec; dejar toggle en config o feature-flag si queda duda).  
  - Si está `PENDIENTE`, se mantiene pendiente.

- **HU-PU-03-BE03:** Ajuste de sedes destinatarias.  
  - Mantener asociaciones `BannerSede`: agregar nuevas, eliminar las removidas.

- **HU-PU-03-BE04:** Validaciones y errores.  
  - 403 si no es dueño.  
  - 404 si no existe/eliminado.  
  - Fechas inválidas, sedes inválidas.

- **HU-PU-03-BE05:** DTOs + Swagger.

- **HU-PU-03-BE06:** Pruebas e2e.  
  - Dueño edita OK.  
  - No dueño 403.  
  - Edita activo sin volver a revisión.  
  - Edita rechazado vuelve a pendiente (si se confirma).

- **HU-PU-03-BE07:** Auditoría/logging en `log_api` (cuenta marca).

### Frontend (FE)

- **HU-PU-03-FE01:** Formulario editar banner (prellenado).

- **HU-PU-03-FE02:** Integración con `PATCH /api/publicidad/banners/:id` (multipart si aplica).

- **HU-PU-03-FE03:** UX: mostrar estado actual y reglas (activo no vuelve a revisión; rechazado vuelve a pendiente si aplica).

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
