# HU-NO-05 — Gestionar avisos institucionales

**Como** administrador
**quiero** crear, editar y eliminar avisos institucionales con vigencia y sedes destinatarias
**para** comunicar oficialmente informaciones de Duoc UC a la comunidad de las sedes que correspondan.

## Criterios de aceptación

- **Dado** que soy un administrador autenticado y entrego mensaje, imagen, fechas de vigencia y una o más sedes válidas,
  **cuando** confirmo la creación,
  **entonces** el sistema guarda el aviso y queda activo para mostrar dentro de su vigencia en las sedes destinatarias (sin aprobación ajena; el propio administrador es el emisor).

- **Dado** que las fechas de vigencia son inválidas (fin anterior a inicio) o faltan mensaje, imagen o sedes,
  **cuando** intento crear o editar el aviso,
  **entonces** el sistema no guarda e indica el campo problema.

- **Dado** que edito el mensaje, la imagen, las fechas o las sedes de un aviso existente,
  **cuando** guardo,
  **entonces** el sistema actualiza el aviso y su presentación refleja los cambios dentro de lo vigente.

- **Dado** que una sede ya no debe ver el aviso,
  **cuando** la quito a las destinatarias del aviso,
  **entonces** deja de estar en las destinatarias efectivas del aviso.

- **Dado** que elimino un aviso activo,
  **cuando** confirmo,
  **entonces** deja de mostrarse de inmediato en las sedes a donde estabaactivo.

- **Dado** que intento gestionar avisos sin sesión o sin rol de administrador,
  **cuando** ejecuto la acción,
  **entonces** el sistema rechaza la operación.

## Reglas de negocio

Analogías y decisiones del modelo vigente (sin CU de origen, creature desde el MER):

- El aviso institucional se define con mensaje, imagen, vigencia (fecha inicio/fin) y sedes destinatarias (`NOTIFICACION_ADMINISTRACION` + `NOTIFICACION_SEDE` del MER).
- Solo un administrador autenticado los gestiona; no requieren aprobación ajena (a diferencia de los banners de marcas, que cun ciclo de aprobación en CU018).
- La imagen del aviso sigue la misma regla de banners y publicaciones: única, JPEG/PNG/WebP, máximo 5 MB (decisión de proyecto adoptada de HU-PU-01).
- El aviso solo candidato a usuarios de las sedes destinatarias dentro de su vigencia (HU-NO-04).
- Solo se muestra el aviso activo: es íntegramente un instrumento de comunicación oficial.

Nota técnica de origen (no define diseño): el MER tiene la entidad pero sin ciclo de aprobación ni CU de origen; el patrón a implementar está ya cubierto por los banners (`banner_publicidad`, `banner_sede`, backend implementado con marca) y se re"use en spec.

## Dependencias

- Rol administrador autenticado (módulo auth y roles).
- Catálogo de sedes disponible (implementado).
- Patrón listo para uso: módulo `publicidad` (banners + sedes en backend).
- HU-NO-04 (la visualización consume estos avisos).

## Prioridad

**Media**

Infrastructura institucional del MER, sin CU de origen formal y sin requerimiento de la planilla para el MVP del R.14.

## Dudas pendientes

1. **Creadores y ciclo de vida**: ¿la entidad `NOTIFICACION_ADMINISTRACION` nace para que el administrador emita avisos, o hay otro uso (por ejemplo, anuncios automáticos del sistema)? Confirmar en spec.
2. ¿El aviso institucional también genera notificación personal (evento en HU-NO-01) o solo presentación visual en la plataforma? Confirmar.

## Estado

`requiere aclaración` — sin CU de origen; las dudas 1 y 2 se cierran en spec (control de decidido para poder definir visión/borron).
