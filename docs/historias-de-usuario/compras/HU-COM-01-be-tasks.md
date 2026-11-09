# Plan de desarrollo — HU-COM-01 Backend

> **Fase:** tasks (05-planner)  
> **HU:** HU-COM-01 — Cerrar venta con registro de comprador  
> **Alcance:** subtareas backend únicamente  
> **Generado a partir de:** inspección del código existente en `pasa-el-dato-back/`

---

## Contexto técnico verificado

| Elemento | Estado actual |
|---|---|
| Endpoint de estado | `PATCH /publicaciones/:id/estado` acepta `"Vendida"` sin comprador → **debe bloquearse** |
| Campo `fk_user_comprador` | Existe en Prisma (`Publicacion`) como nullable con relación `comprador: Cuenta?` |
| Módulo de compras | **No existe** |
| Endpoint de búsqueda de usuarios | **No encontrado** en ningún módulo |
| Guard de autenticación | `JwtAuthGuard` con cookie `accessToken`, expone `SesionAutenticada { idCuenta, rol }` |
| Patrón de transacciones | `prisma.$transaction` en `PublicacionService` |
| Patrón de tests e2e | Archivos `test/*.e2e-spec.ts` con Vitest |

---

## Orden de implementación y dependencias

```
T0 (bloqueante de contrato)
  └── T1 (DTO + endpoint)
       └── T2 (lógica atómica)
            ├── T3 (validaciones publicación)
            └── T4 (validaciones comprador)
                 └── T5 (concurrencia/idempotencia)
                      └── T6 (endpoint consulta transacción)
                           ├── T7 (Swagger)
                           └── T8 (pruebas)
T9 (decisión de diseño: lookup de comprador) — paralelo, no bloquea T1-T8
```

---

## T0 — Bloquear "Vendida" en el endpoint de cambio de estado (HU-PUB-04 / HU-COM-01-BE01, parte 1)

**Objetivo:** garantizar que `PATCH /publicaciones/:id/estado` rechace el estado `"Vendida"` con un error claro, de modo que el único camino válido para cerrar una venta sea el nuevo endpoint de cierre.

**Archivos afectados:**
- `src/publicacion/publicacion-estados.constantes.ts` — remover `'Vendida'` de `ESTADOS_PUBLICACION_ASIGNABLES_POR_PROPIETARIO`
- `src/publicacion/publicacion.service.ts` — el guard de `cambiarEstadoPublicacion` ya filtra por la constante; el cambio en la constante es suficiente
- `src/publicacion/publicacion.controller.ts` — actualizar comentario/descripción Swagger del endpoint

**Condición de término:**
- `PATCH /publicaciones/:id/estado` con `{ "estado": "Vendida" }` devuelve `400 Bad Request` con mensaje `"Estado inválido o no asignable por propietario"`.
- `'En curso'` y `'Pausada'` siguen funcionando.

**Notas:**
- Si spec/design decide que "Vendida" debe seguir siendo asignable por el propietario sin comprador (escenario alternativo), este task se revisa. Por defecto se bloquea según las reglas de negocio aprobadas en HU-COM-01.

---

## T1 — Definir contrato HTTP, DTO de entrada y estructura del módulo (HU-COM-01-BE01)

**Objetivo:** acordar y definir el endpoint y el DTO antes de implementar lógica.

**Decisiones de diseño incluidas en este task:**

1. **Endpoint:** `POST /publicaciones/:id/cierre-venta`  
   - Método `POST` porque es una transición de estado no idempotente en el primer cierre (aunque se implementa idempotencia de resultado, semánticamente es una acción).  
   - Ubicado bajo `/publicaciones/:id` para reutilizar el módulo y guard existentes sin crear un módulo nuevo.

2. **DTO de entrada:** `CerrarVentaDto { compradorId: string }` donde `compradorId` es el UUID de `Cuenta.id_cuenta`.

3. **DTO de respuesta:** `CierreVentaRespuestaDto` con:
   ```ts
   {
     id: string;              // id publicación
     estado: { id: number; descripcion: string };
     vendedor: { id: string; nombre: string }; // fk_usuario
     comprador: { id: string; nombre: string }; // fk_user_comprador
   }
   ```
   Los campos `nombre` del vendedor y comprador se obtienen de `Usuario.pNombre + ' ' + pApellido` (ya disponible en Prisma).

**Archivos a crear:**
- `src/publicacion/dto/cerrar-venta.dto.ts` — `CerrarVentaDto`
- `src/publicacion/dto/cierre-venta-respuesta.dto.ts` — `CierreVentaRespuestaDto`

**Archivos a modificar:**
- `src/publicacion/publicacion.controller.ts` — agregar método `cerrarVenta`
- `src/publicacion/publicacion.service.ts` — agregar método `cerrarVenta`

**Condición de término:**
- DTOs definidos con validaciones `class-validator` apropiadas (`@IsUUID()` para `compradorId`).
- Endpoint registrado y visible en Swagger (aunque sin lógica completa aún).

---

## T2 — Implementar la operación atómica de cierre (HU-COM-01-BE02)

**Objetivo:** actualizar `fk_user_comprador` y `fk_estado_publicacion` a "Vendida" en una única transacción Prisma que no pueda quedar en estado inconsistente.

**Lógica en `PublicacionService.cerrarVenta`:**

```
prisma.$transaction:
  1. findUnique publicacion (con fk_usuario, eliminado, fk_user_comprador, estadoPublicacion.descripcion)
  2. verificaciones (ver T3 y T4) — lanzar excepciones si fallan
  3. si ya está en estado "Vendida" y fk_user_comprador no es null → return idempotente (ver T5)
  4. obtener id de estado "Vendida" desde estadoPublicacion catalog
  5. publicacion.update({ fk_user_comprador: compradorId, fk_estado_publicacion: estadoVendidaId, fechaModificacion: now() })
  6. re-read con vendedor y comprador (via usuario → cuenta) para construir respuesta
```

**Archivos a modificar:**
- `src/publicacion/publicacion.service.ts`

**Condición de término:**
- El test unitario/e2e de cierre válido pasa y la BD queda con `fk_user_comprador` y estado "Vendida" correctos.
- El campo `fechaModificacion` se actualiza en el cierre.

---

## T3 — Validaciones de sesión, publicación, ownership y estado (HU-COM-01-BE03)

**Objetivo:** cubrir los criterios de rechazo relacionados con la publicación y el vendedor.

**Validaciones y respuestas esperadas:**

| Condición | Código | Mensaje |
|---|---|---|
| Sin cookie / token inválido | 401 | `Sesión inválida` (manejado por `JwtAuthGuard`) |
| Publicación no existe | 404 | `Publicación no encontrada` |
| Publicación con `eliminado=true` | 404 | `Publicación no encontrada` |
| Publicación ya en estado "Vendida" | 200 | Respuesta idempotente (ver T5) |
| `fk_usuario !== idCuenta` sesión | 403 | `No tiene permisos para cerrar la venta de esta publicación` |

**Implementación:**
- El controller usa `@UseGuards(JwtAuthGuard)` y verifica `if (!user) throw UnauthorizedException`.
- El service recibe `{ idPublicacion, vendedorId: idCuenta, compradorId }` y ejecuta las validaciones antes del `$transaction`.

**Archivos a modificar:**
- `src/publicacion/publicacion.controller.ts` — guard y extracción de `user.idCuenta`
- `src/publicacion/publicacion.service.ts` — validaciones pre-transacción

**Condición de término:**
- Cada caso de error devuelve el código y mensaje correcto en tests e2e.

---

## T4 — Validaciones del comprador (HU-COM-01-BE04)

**Objetivo:** garantizar que el comprador sea un usuario válido del sistema y sea distinto del vendedor.

**Validaciones y respuestas esperadas:**

| Condición | Código | Mensaje |
|---|---|---|
| `compradorId === vendedorId` | 400 | `No puede ser comprador de su propia publicación` |
| `compradorId` no existe como `Cuenta` | 400 | `El comprador indicado no es un usuario válido` |
| Cuenta comprador tiene `eliminado=true` / `bloqueado=true` / `aprobada=false` | 400 | `El comprador indicado no es un usuario válido` |
| Cuenta comprador no tiene `usuario` asociado (es marca, no persona) | 400 | `El comprador indicado no es un usuario válido` |

**Implementación en `PublicacionService`:**
```ts
// Dentro de la transacción, antes del update:
const cuentaComprador = await tx.cuenta.findUnique({
  where: { id_cuenta: compradorId },
  select: { aprobada: true, bloqueado: true, eliminado: true, usuario: { select: { id_cuenta: true } } }
});
if (!cuentaComprador || !cuentaComprador.usuario || cuentaComprador.eliminado || cuentaComprador.bloqueado || !cuentaComprador.aprobada) {
  throw new BadRequestException('El comprador indicado no es un usuario válido');
}
```

**Archivos a modificar:**
- `src/publicacion/publicacion.service.ts`

**Condición de término:**
- Todos los casos de comprador inválido devuelven 400 con mensaje correcto.
- Comprador = vendedor devuelve 400 con mensaje diferenciado.

---

## T5 — Idempotencia y protección contra cierres concurrentes (HU-COM-01-BE05)

**Objetivo:** asegurar que un cierre ya realizado no pueda sobreescribirse ni duplicarse.

**Estrategia:**

1. **Idempotencia de resultado:** si al entrar a `cerrarVenta` la publicación ya tiene estado "Vendida" y `fk_user_comprador != null`, devolver `200` con el registro existente sin ejecutar el `update`. El comprador registrado nunca cambia.

2. **Protección contra carreras:** usar `updateMany` con condición en lugar de `update`:
   ```ts
   const result = await tx.publicacion.updateMany({
     where: {
       id: idPublicacion,
       fk_user_comprador: null,          // solo si no hay comprador aún
       fk_usuario: vendedorId,
       eliminado: false,
     },
     data: { fk_user_comprador: compradorId, fk_estado_publicacion: estadoVendidaId, fechaModificacion: new Date() }
   });
   // si result.count === 0 → re-leer y devolver estado actual (ya fue cerrada por otra petición)
   ```
   Esto es atómico a nivel de fila en PostgreSQL y evita que dos peticiones simultáneas registren compradores distintos.

**Archivos a modificar:**
- `src/publicacion/publicacion.service.ts`

**Condición de término:**
- El segundo `POST /publicaciones/:id/cierre-venta` sobre una publicación ya cerrada devuelve `200` con los mismos datos sin alterar `fk_user_comprador`.
- En caso de concurrencia, solo uno de los dos requests persiste el comprador; el otro obtiene la respuesta idempotente.

---

## T6 — Endpoint de consulta de transacción para participantes (HU-COM-01-BE06)

**Objetivo:** permitir que vendedor y comprador consulten la publicación vendida con sus tres partes (publicación, vendedor, comprador), sin romper la regla de visibilidad pública MVP que oculta publicaciones no-"En curso".

**Decisión de diseño:** endpoint separado protegido, no modificar `GET /publicaciones/:id` público.

**Endpoint:** `GET /publicaciones/:id/transaccion`  
- `@UseGuards(JwtAuthGuard)`
- Solo accesible si `sesion.idCuenta === fk_usuario` (vendedor) o `sesion.idCuenta === fk_user_comprador` (comprador)
- Devuelve `CierreVentaRespuestaDto` (misma forma que el cierre)
- Si la publicación no está en estado "Vendida" o no tiene comprador registrado → `404 Publicación no encontrada` (no revelar existencia a terceros)
- Si sesión es de un tercero → `403 No tiene acceso a esta transacción`

**Archivos a modificar:**
- `src/publicacion/publicacion.controller.ts` — agregar método `obtenerTransaccion`
- `src/publicacion/publicacion.service.ts` — agregar método `obtenerTransaccion`

**Condición de término:**
- Vendedor puede consultar la transacción y obtener datos de publicación, vendedor y comprador.
- Comprador puede consultar la transacción.
- Un tercero autenticado obtiene 403.
- Sin sesión obtiene 401.

---

## T7 — Documentar contrato en Swagger (HU-COM-01-BE07)

**Objetivo:** todos los endpoints nuevos y modificados quedan documentados en OpenAPI.

**Endpoints a documentar:**

1. `POST /publicaciones/:id/cierre-venta`
   - `@ApiOperation` con descripción clara
   - `@ApiCookieAuth('accessToken')`
   - `@ApiOkResponse({ type: CierreVentaRespuestaDto })` para éxito (incluye idempotencia)
   - `@ApiUnauthorizedResponse` — sin sesión
   - `@ApiForbiddenResponse` — no es el vendedor dueño
   - `@ApiNotFoundResponse` — publicación inexistente/eliminada/ya vendida (ver nota)
   - `@ApiBadRequestResponse` — comprador inválido, comprador = vendedor

2. `GET /publicaciones/:id/transaccion`
   - `@ApiOperation`
   - `@ApiCookieAuth('accessToken')`
   - `@ApiOkResponse({ type: CierreVentaRespuestaDto })`
   - `@ApiUnauthorizedResponse`, `@ApiForbiddenResponse`, `@ApiNotFoundResponse`

3. `PATCH /publicaciones/:id/estado` (modificación de descripción)
   - Actualizar `@ApiOperation` y el schema del body para indicar que `"Vendida"` ya no es un valor aceptado.

**Archivos a modificar:**
- `src/publicacion/publicacion.controller.ts`
- `src/publicacion/dto/cerrar-venta.dto.ts` — decoradores `@ApiProperty`
- `src/publicacion/dto/cierre-venta-respuesta.dto.ts` — decoradores `@ApiProperty`

**Condición de término:**
- Swagger UI muestra los tres endpoints con sus request/response schemas y códigos de error.

---

## T8 — Pruebas e2e (HU-COM-01-BE08)

**Objetivo:** verificar todos los criterios de aceptación mediante tests automatizados.

**Archivo a crear:** `test/compras-cierre-venta.e2e-spec.ts`

**Casos obligatorios:**

| # | Caso | Resultado esperado |
|---|---|---|
| 1 | Cierre válido (vendedor autenticado, publicación En curso, comprador válido distinto) | 200 con `CierreVentaRespuestaDto` |
| 2 | Cierre válido sobre publicación Pausada | 200 (Pausada también es finalizable) |
| 3 | Sin cookie | 401 |
| 4 | Autenticado pero no es el vendedor dueño | 403 |
| 5 | Publicación no existe | 404 |
| 6 | Publicación con `eliminado=true` | 404 |
| 7 | Publicación ya en estado "Vendida" | 200 idempotente, comprador no cambia |
| 8 | Segundo cierre con `compradorId` diferente | 200 idempotente, comprador original se mantiene |
| 9 | `compradorId` no existe como cuenta | 400 |
| 10 | `compradorId` existe pero es marca (sin `usuario`) | 400 |
| 11 | `compradorId` existe pero cuenta bloqueada/eliminada/no aprobada | 400 |
| 12 | `compradorId === vendedorId` | 400 con mensaje diferenciado |
| 13 | `PATCH /:id/estado` con `"Vendida"` (regresión T0) | 400 |
| 14 | Consulta transacción por vendedor | 200 con vendedor y comprador |
| 15 | Consulta transacción por comprador | 200 con vendedor y comprador |
| 16 | Consulta transacción por tercero autenticado | 403 |
| 17 | Consulta transacción sin sesión | 401 |
| 18 | Consulta transacción publicación no vendida | 404 |

**Archivos a modificar/crear:**
- `test/compras-cierre-venta.e2e-spec.ts`
- Reutilizar helpers existentes de `test/global-setup.e2e.ts` y patrones de `test/publicaciones.e2e-spec.ts`

**Condición de término:**
- Todos los casos pasan en CI (`podman compose exec back pnpm test:e2e`).

---

## T9 — Resolver mecanismo de lookup de comprador (HU-COM-01-BE09)

**Objetivo:** definir cómo el frontend obtiene el `compradorId` (UUID de `Cuenta`) para incluirlo en el cierre.

**Estado:** decisión pendiente, no bloquea T0–T8 (el backend del cierre ya acepta UUID).

**Opciones a evaluar en spec/design:**

| Opción | Descripción | Trade-off |
|---|---|---|
| A | Endpoint `GET /usuarios/buscar?correo=` protegido | Requiere nueva HU/endpoint; privacidad controlada |
| B | Endpoint `GET /usuarios/buscar?run=` protegido | RUN es conocido entre estudiantes; más natural en contexto Duoc |
| C | El frontend envía correo/RUN y el backend resuelve a UUID internamente en el mismo `POST /cierre-venta` ampliando el DTO | Más simple para FE; acomplamiento del lookup al cierre |
| D | El comprador "confirma" la compra desde su sesión (flujo de dos pasos) | Cambia la UX y el modelo; fuera del alcance de HU-COM-01 según reglas de negocio aprobadas |

**Decisión recomendada para spec/design:** opción B o C. La opción C es la más directa para esta HU (un solo request desde FE), ampliando `CerrarVentaDto` con un campo `identificadorComprador` (correo o RUN) y resolviendo a UUID en el service, sin crear un endpoint de búsqueda de usuarios expuesto.

**Bloqueos:**
- Si se elige la opción A o B, se requiere una HU de búsqueda de usuarios antes de que FE pueda implementar HU-COM-01-FE02.
- El backend de cierre (T1–T8) no se bloquea: en tests e2e se usa UUID directamente.

**Condición de término:**
- Decisión documentada en spec/design y reflejada en el DTO/endpoint si aplica.

---

## Resumen de archivos por tarea

| Task | Archivos nuevos | Archivos modificados |
|---|---|---|
| T0 | — | `publicacion-estados.constantes.ts`, `publicacion.controller.ts` |
| T1 | `dto/cerrar-venta.dto.ts`, `dto/cierre-venta-respuesta.dto.ts` | `publicacion.controller.ts`, `publicacion.service.ts` |
| T2 | — | `publicacion.service.ts` |
| T3 | — | `publicacion.controller.ts`, `publicacion.service.ts` |
| T4 | — | `publicacion.service.ts` |
| T5 | — | `publicacion.service.ts` |
| T6 | — | `publicacion.controller.ts`, `publicacion.service.ts` |
| T7 | — | `publicacion.controller.ts`, `dto/cerrar-venta.dto.ts`, `dto/cierre-venta-respuesta.dto.ts` |
| T8 | `test/compras-cierre-venta.e2e-spec.ts` | — |
| T9 | — | `dto/cerrar-venta.dto.ts` (si opción C) |

---

## Bloqueos y dependencias externas

- **T0** no tiene bloqueos; puede iniciar de inmediato.
- **T9** (lookup de comprador) puede iniciar en paralelo como tarea de spec/design; no bloquea la implementación backend.
- Esta HU no depende de módulos no existentes; `fk_user_comprador` ya está en el modelo Prisma.
- Una vez completada esta HU, se desbloquean **HU-CAL-01** y **HU-CAL-03** (requieren comprador registrado).
