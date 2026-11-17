# Plan de desarrollo — HU-CAL-04 Backend

> **Fase:** tasks (05-planner)
> **HU:** HU-CAL-04 — Consultar estado de mi calificación en una transacción
> **Alcance:** subtareas backend únicamente (BE01–BE06), desarrolladas **en conjunto como un solo cambio**
> **Generado a partir de:** propuesta, especificación, diseño técnico e inspección del código en `pasa-el-dato-back/`

---

## Contexto técnico verificado

| Elemento | Estado actual |
|---|---|
| HU-CAL-01 (registro) | Implementada: `POST /api/publicaciones/:id/calificaciones` en `CalificacionesController`/`CalificacionesService` |
| HU-CAL-03 (activación) | Implementada: `POST /api/publicaciones/:id/activar-calificacion` en módulo `publicacion` |
| Endpoint de estado | **No existe** — objetivo de este plan |
| Constraint único | `ux_calificacion_publicacion_emisor_receptor` (publicación + emisor + receptor) en schema y migraciones |
| `calificacion_activada` | Columna `publicacion` con default `false` |
| Guard de autenticación | `JwtAuthGuard` con cookie `accessToken`, expone `SesionAutenticada { idCuenta, rol }` |
| Precondiciones de `crear` | Evaluadas como excepciones (404/403); aquí se necesitan como flags de respuesta |
| Patrón de tests e2e | `test/calificaciones.e2e-spec.ts` con Vitest y fixtures propias (vendedor/comprador/tercero, cierre-venta) |
| Cambios de BD | **Ninguno** requerido |

## Orden de implementación y dependencias

```
T1 (DTO respuesta)
  └── T2 (service: refactor helpers + consultarEstado)
       └── T3 (endpoint GET estado + Swagger)
            └── T4 (pruebas e2e)
                 └── T5 (verificación build/lint/e2e)
```

Secuencia estricta, sin ramas paralelas (decisión: desarrollo conjunto, un commit `feat(calificaciones): ...`).

---

## T1 — DTO de respuesta del estado (HU-CAL-04-BE01, parte 1)

**Objetivo:** definir la forma de la respuesta 200 antes de implementar lógica.

**Archivo a crear:** `src/calificaciones/dto/estado-calificacion-respuesta.dto.ts`

```ts
export class EstadoCalificacionRespuestaDto {
  @ApiProperty({ example: 'c48d2a2e-0f20-4e0b-8e5f-0b0d99c5c1b2' })
  @IsUUID()
  publicacionId!: string;

  @ApiProperty({ example: true, description: 'Publicación no eliminada, en estado Vendida y con comprador registrado.' })
  @IsBoolean()
  transaccionFinalizada!: boolean;

  @ApiProperty({ example: true, description: 'Valor de calificacion_activada de la publicación.' })
  @IsBoolean()
  calificacionActivada!: boolean;

  @ApiProperty({ example: false, description: 'Existe Calificacion del usuario autenticado hacia su contraparte en esta publicación.' })
  @IsBoolean()
  yaCalifico!: boolean;
}
```

Patrón: `ActivarCalificacionRespuestaDto` (decoradores `@ApiProperty` + `class-validator`).

**Condición de término:**
- DTO compila y los cuatro campos coinciden con la especificación.

---

## T2 — Service: helpers compartidos y `consultarEstado` (HU-CAL-04-BE02, BE03, BE04)

**Objetivo:** implementar la consulta de solo lectura reutilizando la carga de publicación y la resolución de dirección de `crear`, sin alterar el comportamiento de `crear`.

**Archivos a modificar:** `src/calificaciones/calificaciones.service.ts`

**Cambios:**

1. **Helper privado `cargarPublicacionCalificable(publicacionId)`** — extrae el `findUnique` con el `select` actual de `crear` (id, eliminado, fk_usuario, fk_user_comprador, calificacion_activada, estadoPublicacion.descripcion). Lanza 404 `'Publicación no encontrada'` si `!publicacion || eliminado`. Usado por `crear` y `consultarEstado`.
2. **Helper privado `resolverContraparte(sesion, publicacion)`** — extrae el cálculo de dirección de `crear` (`esVendedor`/`esComprador`, lanza 403 `'No participa en esta transacción'`, retorna `receptorId` y `esVendedor`). Usado por ambos.
3. **`crear`** — conserva su orden exacto de excepciones (404 existencia → 404 Vendida → 404 comprador → 404 activada → 403 participación → 409 P2002); internamente usa los helpers.
4. **Nuevo método `consultarEstado({ publicacionId, sesion })`** en este orden estricto:
   1. `!sesion` → 401 `'Sesión inválida'` (defensa defensiva igual que `crear`)
   2. `cargarPublicacionCalificable` → 404 si no existe/eliminada
   3. `resolverContraparte` → 403 si no participante (antes de evaluar flags)
   4. Flags:
      - `transaccionFinalizada = estado === 'Vendida' && fk_user_comprador != null`
      - `calificacionActivada = publicacion.calificacion_activada`
      - `yaCalifico = (await prisma.calificacion.findFirst({ where: { fk_publicacion, fk_emisor: idCuenta, fk_receptor }, select: { id: true } })) !== null`
   5. Retorna `{ publicacionId, transaccionFinalizada, calificacionActivada, yaCalifico }`. Sin escrituras.

**Restricción (BE04):** la respuesta solo contiene flags; nunca contenido de `Calificacion` ni identificadores de terceros.

**Condición de término:**
- `consultarEstado` compila, es de solo lectura y los casos de error 401/403/404 quedan en el orden especificado.
- Los e2e existentes de CAL-01/CAL-02/CAL-03 siguen pasando (regresión de `crear`).

---

## T3 — Endpoint `GET estado` con Swagger (HU-CAL-04-BE01, parte 2 + BE05)

**Objetivo:** exponer el endpoint y documentar el contrato.

**Archivo a modificar:** `src/calificaciones/calificaciones.controller.ts`

**Handler:**

```ts
@Get('estado')
@HttpCode(HttpStatus.OK)
@UseGuards(JwtAuthGuard)
```

- 401 defensivo si `!user`, luego llamada a `calificacionesService.consultarEstado(...)` y mapeo directo al `EstadoCalificacionRespuestaDto`.

**Decoradores Swagger:**
- `@ApiOperation` — consulta de estado de calificación de una transacción (solo lectura)
- `@ApiCookieAuth('accessToken')`
- `@ApiOkResponse({ type: EstadoCalificacionRespuestaDto })`
- `@ApiUnauthorizedResponse({ description: 'Sesión inválida' })`
- `@ApiForbiddenResponse({ description: 'No participa en esta transacción' })`
- `@ApiNotFoundResponse({ description: 'Publicación no encontrada' })`

**Condición de término:**
- `GET /api/publicaciones/:id/calificaciones/estado` responde según el contrato y aparece en Swagger con schemas y errores documentados.

---

## T4 — Pruebas e2e (HU-CAL-04-BE06)

**Objetivo:** cubrir todos los criterios de aceptación con tests automatizados.

**Archivo a modificar:** `test/calificaciones.e2e-spec.ts` — nuevo `describe('HU-CAL-04 ...')` con fixtures propias (segunda publicación del vendedor + cierre de venta), sin depender del estado que dejan los tests de CAL-01/02. Casos secuenciales:

| # | Caso | Resultado esperado |
|---|---|---|
| 1 | Venta cerrada, calificación desactivada, comprador consulta | 200 `{ transaccionFinalizada: true, calificacionActivada: false, yaCalifico: false }` |
| 2 | Vendedor activa; comprador consulta | 200 `{ calificacionActivada: true, yaCalifico: false }` |
| 3 | Dos consultas consecutivas del comprador | Mismo cuerpo; `calificacion.count` sin variación (idempotencia) |
| 4 | Comprador califica; comprador consulta | 200 `yaCalifico: true` |
| 5 | Vendedor consulta (sin calificar él) | 200 `yaCalifico: false`; tras calificar → `yaCalifico: true` |
| 6 | Tercero autenticado consulta | 403 |
| 7 | Sin cookie | 401 |
| 8 | UUID de publicación inexistente | 404 |

**Limpieza:** extender el `afterAll` existente para la segunda publicación (calificaciones, imágenes, publicación). Las cuentas ya se limpian.

**Condición de término:**
- Los 8 casos pasan (`podman compose exec back pnpm test:e2e`).
- Los tests previos del archivo siguen pasando.

---

## T5 — Verificación de build

**Objetivo:** cerrar el cambio con verificación técnica completa, con servicios levantados (`podman-compose up -d --build`, ver `ComandosDocker.md`; nunca en host):

1. `podman compose exec back pnpm lint`
2. `podman compose exec back pnpm test:e2e`

**Condición de término:**
- Lint sin errores y suite e2e completa en verde.

---

## Resumen de archivos por tarea

| Task | Archivos nuevos | Archivos modificados |
|---|---|---|
| T1 | `src/calificaciones/dto/estado-calificacion-respuesta.dto.ts` | — |
| T2 | — | `src/calificaciones/calificaciones.service.ts` |
| T3 | — | `src/calificaciones/calificaciones.controller.ts` |
| T4 | — | `test/calificaciones.e2e-spec.ts` |
| T5 | — | — |

---

## Bloqueos y dependencias externas

- **Ningún bloqueo.** HU-CAL-01, HU-CAL-03 y HU-COM-01 están implementadas en el repo.
- Sin cambios de schema ni migraciones.
- Este backend desbloquea FE01–FE04 de HU-CAL-04 y el criterio FE05 de HU-CAL-01 (cambio frontend separado).
