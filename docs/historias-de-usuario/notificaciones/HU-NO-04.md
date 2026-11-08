# HU-NO-04 — Ver avisos institucionales de mi sede

**Como** usuario autenticado
**quiero** ver los avisos institucionales activos de Duoc UC para mi sede
**para** estar al tanto de informaciones oficiales de mi comunidad.

## Criterios de aceptación

- **Dado** que soy un usuario autenticado asociado a una sede,
  **cuando** navego la plataforma,
  **entonces** el sistema me muestra los avisos institucionales activos destinados a mi sede durante su vigencia.

- **Dado** que un aviso está fuera de su periodo (antes de la fecha de inicio o después de la fecha fin) o es para otra sede,
  **cuando** navego la plataforma,
  **entonces** el aviso no se me muestra.

- **Dado** que cambio de sede en mi perfil a otra con avisos propios,
  **cuando** vuelvo a consultar,
  **entonces** el sistema ajusta los avisos mostrados a la nueva sede.

- **Dado** que no hay avisos activos para mi sede,
  **cuando** navego,
  **entonces** la sección correspondiente no muestra avisos, sin erorres.

- **Dado** que no estoy autenticado,
  **cuando** navego,
  **entonces** no accedo a la sección de avisos (el catálogo de avisos requiere sesión).

## Reglas de negocio

Aprobadas documentalmente (MER) y analogías de resolución vigente:

- El aviso institucional se define con mensaje, imagen, fecha de inicio/fin (entidad `NOTIFICACION_ADMINISTRACION` del MER) y sedes destinatarias (entidad `NOTIFICACION_SEDE`, en el MER, al igual que la tabla `banner_sede`).
- Un aviso es visible solo dentro de su vigencia y para las sedes destinatarias; regla con la misma lógica de banners (HU-PU-05, decisión adoptada).
- Fuera de alcance de esta HU: crear o gestionar avisos (HU-NO-05), notificaciones de eventos personales (HU-NO-01).

Nota técnica de origen (no define diseño): `Notificaciones` administrativas (`notificacion_administracion` sobre el MER) no existen en el `schema.prisma` hoy.

## Dependencias

- HU-NO-05 (la existencia de avisos institucionales).
- Módulo de sedes vigente e implementado en backend.
- Usuarios autenticados (módulo auth existente).

## Prioridad

**Media**

Comunicación institucional (MER); útil pero sin prerrequisito del catálogo de eventos personales. Va con HU-NO-05.

## Dudas pendientes

1. **Origen y puntos de conexión**: la entidad existe en el MER pero ningún CU hace Su definición funcional completa. ¿Quién decide contenido y sedes, y dónde se muestra (banner de inicio, sección dedicada)? Confirmar en spec.
2. ¿La acción del aviso requiere el catálogo de evento de notificación o es solo visual? Propuesta vigente: solo visual (no notifica evento personal). Confirmar.

## Estado

`requiere aclaración` — sin CU de origen (entidad definida solo en el MER); indica la duda 1 antes de especificar.
