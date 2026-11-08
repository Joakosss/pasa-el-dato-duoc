# HU-NO-02 — Gestionar preferencias de notificaciones

**Como** usuario con cuenta activa
**quiero** habilitar o deshabilitar mis notificaciones
**para** controlar qué y cómo el sistema me avisa.

## Criterios de aceptación

- **Dado** que soy un usuario autenticado,
  **cuando** consulto mis preferencias de notificaciones,
  **entonces** el sistema muestra el estado vigente (habilitado/deshabilitado) para el canal de push.

- **Dado** que deshabilito el canal de push,
  **cuando** confirmo,
  **entonces** las siguientes notificaciones de eventos se entregan solo por correo (sin push) desde ese momento (CU021, curso alternativo 1).

- **Dado** que vuelvo a habilitar el canal de push,
  **cuando** confirmo,
  **entonces** las siguientes notificaciones de eventos vuelven a incluir push.

- **Dado** que intento cambiar preferencias sin sesión,
  **cuando** ejecuto el cambio,
  **entonces** el sistema rechaza la operación e indica que debo iniciar sesión.

## Reglas de negocio

Aprobadas documentalmente (R.14, CU021) y decisiones del proyecto:

- La preferencia es por usuario; afecta solo la forma de entrega, no la existencia del evento ni la construcción del historial (la notificación se registra igualmente en el historial, CU021).
- Deshabilitar push no elimina ni silencia el envío base: el sistema deriva a correo (CU021, alternativa 1). No existe "apagar todo" en el alcance vigente; el canal de correo queda como mínimo de entrega documentado.
- El cambio de preferencia aplica desde el momento del cambio; no se renuevan notificaciones anteriores.
- Fuera de alcance de esta HU: definir el catálogo de eventos (HU-NO-01), entregas específicas por evento y preferencias por tipo de evento (no definidas en R.14/CU021).

Nota técnica de origen (no define diseño): la granularidad de los cambios se decide en spec; CU021 solo habla del nivel "notificaciones push" según la alternativa vigente.

## Dependencias

- HU-NO-01 (respeta la preferencia al entregar).
- Usuarios autenticados (módulo auth existente).

## Prioridad

**Media**

Da control al usuario (precondición CU021 exige "notificaciones habilitadas"); va en el módulo no bloqueo, se define antes/aterrizado con HU-NO-01.

## Dudas pendientes

1. ¿La preferencia es global (un solo toggle de push) o existe detalle por tipo de evento (sines mensajes, reportes, publicidad)? CU021 solo menciona "notificaciones push deshabilitadas", un nivel; la granularidad no está definida. Proposición vigente: toggle global de push para el MVP. Confirmar.
2. ¿Puede el usuario dejar silencio total (sin push y sin correo)? CU021 no lo cubre; la propuesta vigente mantiene correo como mínimo. Confirmar.

## Estado

`requiere aclaración` — dudas no bloqueantes para `explore`; cerrarlas antes de especificar.
