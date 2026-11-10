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
  **entonces** las siguientes notificaciones de eventos se entregan solo en el mínimo vigente (sin aviso in-app activo: el evento se registra en el historial y avisa por correo solo si el evento lo define) desde ese momento (CU021, curso alternativo 1, adaptado a los canales MVP).

- **Dado** que vuelvo a habilitar el canal de push,
  **cuando** confirmo,
  **entonces** las siguientes notificaciones de eventos vuelven a incluir push.

- **Dado** que intento cambiar preferencias sin sesión,
  **cuando** ejecuto el cambio,
  **entonces** el sistema rechaza la operación e indica que debo iniciar sesión.

## Reglas de negocio

Aprobadas documentalmente (R.14, CU021) y decisiones del proyecto:

- La preferencia es un único toggle global de push por usuario (decisión aprobada); afecta solo la forma de entrega, no la construcción del historial (la notificación se registra igualmente, CU021).
- La preferencia de canales MVP: "push" equivale a la entrega in-app; al desactivarlo, las entregas se limitan al canal mínimo (historial + correo según evento) (CU021, alternativa 1 adaptada).
- El cambio de preferencia aplica desde el momento del cambio; no se renuevan notificaciones anteriores.
- Fuera de alcance de esta HU: definir el catálogo de eventos (HU-NO-01), entregas específicas por evento y preferencias por tipo de evento (no definidas en R.14/CU021).

Nota técnica de origen (no define diseño): la granularidad de los cambios se decide en spec; CU021 solo habla del nivel "notificaciones push" según la alternativa vigente.

## Subtareas

### Backend (BE)

- **HU-NO-02-BE01:** Definir persistencia de preferencia de notificaciones por usuario/cuenta (p.ej. campo boolean `notificaciones_push_habilitadas` en `cuenta` o entidad asociada) y migración Prisma.
- **HU-NO-02-BE02:** Definir contrato REST para consultar preferencias: `GET /notificaciones/preferencias` (o dentro de `GET /perfil/me` si el patrón del proyecto lo indica); incluir el flag de push.
- **HU-NO-02-BE03:** Definir contrato REST para actualizar preferencias: `PATCH /notificaciones/preferencias` con body `{ pushHabilitado: boolean }` (o equivalente) y respuesta con estado vigente.
- **HU-NO-02-BE04:** Validar sesión: rechazar sin autenticación (401).
- **HU-NO-02-BE05:** Implementar reglas: el cambio aplica desde ese momento; no afecta historial pasado; no elimina notificaciones previas.
- **HU-NO-02-BE06:** Integrar con HU-NO-01: el servicio de notificaciones debe consultar la preferencia vigente para decidir canal push vs solo correo.
- **HU-NO-02-BE07:** Swagger: documentar DTOs y respuestas de error (401/422).
- **HU-NO-02-BE08:** Pruebas unitarias/e2e: consultar preferencias, cambiar de true→false→true, y verificar que el valor persiste.

### Frontend (FE)

- **HU-NO-02-FE01:** Agregar sección de “Preferencias de notificaciones” en ajustes/perfil (toggle de push para el MVP).
- **HU-NO-02-FE02:** Consumir endpoint de consulta y reflejar estado vigente al entrar a la pantalla.
- **HU-NO-02-FE03:** Enviar actualización al cambiar el toggle (loading + rollback UI si falla).
- **HU-NO-02-FE04:** Manejar errores: sesión expirada, validación, fallas de red (mantener estado consistente).

## Dependencias

- HU-NO-01 (respeta la preferencia al entregar).
- Usuarios autenticados (módulo auth existente).

## Prioridad

**Media**

Da control al usuario (precondición CU021 exige "notificaciones habilitadas"); va en el módulo no bloqueo, se define antes/aterrizado con HU-NO-01.

## Dudas pendientes

- ¿Silencio total (sin aviso in-app ni correo)? CU021 no lo cubre; propuesta vigente: correo se mantiene como mínimo si el evento lo define. Confirmar en spec.

## Estado

`lista` — lista para comenzar `explore → proposal → spec + design → tasks → apply-progress → verify-report → archive-report`.
