# HU-ADM-02 — Gestionar reportes de publicación

**Como** administrador
**quiero** revisar los reportes contra publicaciones y resolverlos aprobando su permanencia o retirando la publicación
**para** garantizar que el catálogo cumpla las normativas institucionales.

## Criterios de aceptación

- **Dado** que soy un administrador autenticado,
  **cuando** accedo al panel de reportes de publicación,
  **entonces** el sistema muestra los reportes pendientes con la publicación asociada.

- **Dado** que reviso el contenido de una publicación reportada,
  **cuando** consulto su detalle,
  **entonces** el sistema muestra el detalle completo de la publicación y el contexto del reporte.

- **Dado** que decido tomar un reporte en revisión,
  **cuando** lo activo,
  **entonces** el sistema pasa el reporte a "en_proceso" y lo registra como en revisión (decisión aprobada).

- **Dado** que decido eliminar la publicación y confirmo,
  **cuando** ejecuto la acción,
  **entonces** el sistema cambia el estado de la publicación a "eliminado", marca el reporte como resuelto y genera un log de auditoría.

- **Dado** que elimino una publicación por administración,
  **cuando** concluye la resolución,
  **entonces** el sistema deja registrado el aviso al vendedor (decisión aprobada: se le informa del retiro; la vía de entrega queda asignada al futuro módulo notificaciones).

- **Dado** que un reporte está resuelto o descartado y necesita revisarse de nuevo,
  **cuando** lo reabro,
  **entonces** el sistema lo devuelve al estado pendiente (decisión aprobada).

- **Dado** que la publicación cumple las normativas,
  **cuando** descarto el reporte,
  **entonces** el sistema marca el reporte como descartado y mantiene la publicación activa.

- **Dado** que opto por solo advertir al vendedor,
  **cuando** confirmo la advertencia,
  **entonces** el sistema marca el reporte como resuelto y deja constancia en el registro.

- **Dado** que intento gestionar reportes sin sesión o sin rol de administrador,
  **cuando** ejecuto la acción,
  **entonces** el sistema rechaza la operación.

## Reglas de negocio

Aprobadas documentalmente (R.7, CU014 extendido, R.33):

- Solo un administrador autenticado gestiona reportes de publicación.
- Resoluciones posibles: eliminar la publicación, advertir al vendedor o descartar el reporte (estados de `ESTADO_REPORTE`).
- El administrador activa el tratamiento del reporte con el estado "en_proceso" al tomarlo en revisión (decisión aprobada).
- Un reporte resuelto o descartado puede reabrirse y vuelve a pendiente (decisión aprobada).
- El vendedor debe recibir aviso cuando su publicación se elimina por administración (decisión aprobada); la vía de entrega queda para el futuro módulo notificaciones (otra HU, otro dominio).
- La advertencia al vendedor se deja registrada; su entrega como notificación queda al futuro módulo notificaciones.
- La eliminación por administración usa el mismo mecanismo de estado "eliminado" del catálogo (consistente con HU-PUB-03/HU-PUB-04 y el patrón BASE).
- La resolución registra log de auditoría con la acción, el administrador y la fecha (R.33).
- La publicación eliminada responde a las reglas generales de visibilidad del catálogo y a la persistencia de conversaciones abiertas.

Fuera de alcance de esta HU: crear reportes de publicación (acción del estudiante: CU011, dominio reportes sin HU aprobada), la entrega de avisos como notificaciones (futuro módulo), reportes contra usuarios (HU-ADM-01).

Nota técnica de origen (no define diseño): `ReportePublicacion` no existe en el `schema.prisma`; el MER lo define como tabla de negocio con motivo, comentarios y estado del reporte.

## Dependencias

- Reportes de publicación entrantes: requiere el flujo de creación de reportes por estudiantes (CU011), sin HU aprobada aún. **Prerrequisito funcional pendiente.**
- Publicaciones consultables con su detalle (HU-PUB-05, HU-PUB-06).
- Rol administrador autenticado.
- `log_api` para auditoría (existe en el modelo).

## Prioridad

**Alta**

Complemento directo de HU-ADM-01 y control de la calidad del catálogo (R.7/R.33).

## Dudas pendientes

- Ninguna en este módulo. Pendiente externo: HU de creación de reportes por estudiantes (prerrequisito funcional) y módulo notificaciones para la entrega de avisos.

## Estado

`lista` — lista para comenzar `explore → proposal → spec + design → tasks → apply-progress → verify-report → archive-report`. Prerrequisito funcional: creación de reportes por estudiantes (HU futura de dominio reportes).
