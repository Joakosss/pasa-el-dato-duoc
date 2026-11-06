# HU-PU-04 — Eliminar banner publicitario

**Como** marca autorizada y autenticada
**quiero** eliminar un banner propio
**para** retirar publicidad que ya no quiero mantener visible.

## Criterios de aceptación

- **Dado** que soy dueño del banner,
  **cuando** lo elimino,
  **entonces** deja de estar disponible de inmediato, incluso si estaba activo dentro de su vigencia (deja de mostrarse a los estudiantes).

- **Dado** que no soy dueño del banner,
  **cuando** intento eliminarlo,
  **entonces** el sistema deniega la operación.

- **Dado** que el banner ya fue eliminado,
  **cuando** intento eliminarlo de nuevo,
  **entonces** el sistema no duplica la eliminación y mantiene el estado.

- **Dado** que el registro se consulta después,
  **cuando** el banner ya está eliminado,
  **entonces** ya no aparece como disponible ni se muestra a los estudiantes.

## Reglas de negocio

Aprobadas documentalmente (R.8 — la gestión de banners incluye eliminar) y modelo vigente:

- Solo la marca dueña del banner lo elimina.
- La eliminación de un banner activo lo retira durante la vigencia (consistente con la presentación acotada definida en CU018).
- Baja lógica del registro acorde al patrón `BASE` del MER (idéntico al resto del modelo).
- Fuera de alcance de esta HU: la aprobación administrativa (HU-PU-02) y la notificación a la marca de acciones administrativas.

Nota técnica de origen (no define diseño): el mecanismo concreto de baja usa el patrón `eliminado` ya presente en las entidades del modelo; se definirá en design.

## Dependencias

- HU-PU-01 (existencia del banner).
- Cuenta de marca autenticada (mismo prerrequisito de HU-PU-01).

## Prioridad

**Media**

Completa el ciclo propio de la marca; no bloquea el flujo básico crear→aprobar→ver.

## Dudas pendientes

- Ninguna bloqueante.

## Estado

`lista` — lista para comenzar `explore → proposal → spec + design → tasks → apply-progress → verify-report → archive-report`.
