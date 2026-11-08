# HU-REP-01 — Reportar publicación

**Como** estudiante autenticado
**quiero** reportar una publicación que considero que incumple las normativas institucionales
**para** alertar a la administración y que evalúe el caso.

## Criterios de aceptación

- **Dado** que soy un estudiante autenticado y selecciono "Reportar" en una publicación describiendo el motivo,
  **cuando** confirmo el reporte,
  **entonces** el sistema registra un reporte asociado a la publicación, con mi autoría y en estado pendiente para revisión administrativa.

- **Dado** que ya tengo un reporte propio en curso sobre esa misma publicación,
  **cuando** intento reportarla de nuevo,
  **entonces** el sistema informa que ya existe un reporte propio en curso y no registra otro (CU011, curso alternativo 1).

- **Dado** que otro usuario ya reportó la misma publicación,
  **cuando** la reporto,
  **entonces** el sistema registra mi reporte independiente (un reporte por situación propia; los reportes de distintos reportantes coexisten).

- **Dado** que la publicación no existe,
  **cuando** intento reportarla,
  **entonces** el sistema rechaza la operación.

- **Dado** que intento reportar mi propia publicación,
  **cuando** ejecuto el reporte,
  **entonces** el sistema rechaza la operación e indica que no puedo reportar mi propia publicación (extensión de la regla de autoreporte de usuarios de CU012, aplicada a publicaciones; confirmar junto con las dudas).

- **Dado** que envío el reporte sin motivo,
  **cuando** intento confirmarlo,
  **entonces** el sistema no lo registra e indica el campo problema.

- **Dado** que no estoy autenticado,
  **cuando** intento reportar,
  **entonces** el sistema rechaza la operación e indica que debo iniciar sesión.

## Reglas de negocio

Aprobadas documentalmente (R.4, CU011 extendido) y resoluciones del dominio administración (consumidores):

- Solo un estudiante autenticado reporta publicaciones.
- El reporte registra el motivo y comentarios, la publicación y el reportante (entidad `REPORTE_PUBLICACION` del MER: fk_publicacion, fk_reportador, motivo, comentarios, fk_estado_reporte).
- El reporte nace en estado "pendiente" y pasa por el ciclo de administración vigente: pendiente → en_proceso (activado por el admin) → resuelto o descartado, con posibilidad de reapertura (decidido en HU-ADM-02).
- Mi propio reporte no se duplica mientras exista en curso (CU011, alternativa 1); reportes de otros reportantes son independientes.
- Fuera de alcance de esta HU: la resolución administrativa (HU-ADM-02), notificaciones, moderación automática, bloqueos.

Nota técnica de origen (no define diseño): `ReportePublicacion` no existe en el `schema.prisma`; el MER define la tabla en tablas de negocio, con el patrón `BASE`.

## Dependencias

- Detalle de publicación consultable (HU-PUB-05, HU-PUB-06).
- Usuarios autenticados (módulo auth existente).
- El flujo alimenta la gestión de administración: HU-ADM-02 (gestionar reportes de publicación). El aviso al vendedor del retiro queda para el módulo notificaciones (fuera de alcance).
- Estados de `ESTADO_REPORTE` vigentes (pendiente, en_proceso, resuelto, descartado).

## Prioridad

**Alta**

R.4 es solicitud explícita; completa el ciclo de moderación y las HUs de administración dependen de este flujo.

## Dudas pendientes

1. **Motivo del reporte**: ¿lista predefinida de motivos (catálogo del sistema), texto libre del estudiante, o lista + comentario? El MER guarda "motivo" y "comentarios" separados, lo que sugiere catálogo + comentarios. Confirmar.
2. ¿Un reporte de publicación "expira" o permanece "en curso" hasta que un admin lo resuelva o descarte (interacción con reapertura)? Interpretación vigente: queda pendiente/en_proceso hasta resolución admin. Confirmar.
3. ¿Se puede reportar una publicación pausada o vendida (no solo las visibles en el catálogo)? No está documentado.

## Estado

`requiere aclaración` — la duda 1 define el formulario; las dudas 2 y 3 acotan el alcance del flujo. Listo para `explore` en paralelo.
